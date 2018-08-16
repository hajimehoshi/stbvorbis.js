// Copyright 2018 Hajime Hoshi
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

(function(Module) {
  var initializeP = new Promise(function(resolve) {
    if (typeof useWasm !== 'undefined') {
      Module.onRuntimeInitialized = function() {
        var fs = {};
        fs.open = Module.cwrap('stb_vorbis_js_open', 'number', []);
        fs.close = Module.cwrap('stb_vorbis_js_close', 'void', ['number']);
        fs.channels = Module.cwrap('stb_vorbis_js_channels', 'number', ['number']);
        fs.sampleRate = Module.cwrap('stb_vorbis_js_sample_rate', 'number', ['number']);
        fs.decode = Module.cwrap('stb_vorbis_js_decode', 'number',
                                 ['number', 'number', 'number', 'number', 'number']);
        resolve(fs);
      };
      return;
    }

    // asm.js
    var fs = {};
    fs.open = Module['_stb_vorbis_js_open'];
    fs.close = Module['_stb_vorbis_js_close'];
    fs.channels = Module['_stb_vorbis_js_channels'];
    fs.sampleRate = Module['_stb_vorbis_js_sampleRate'];
    fs.decode = Module['_stb_vorbis_js_decode'];
    resolve(fs);
  });

  function arrayBufferToHeap(buffer, byteOffset, byteLength) {
    var ptr = Module._malloc(byteLength);
    var heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, byteLength);
    heapBytes.set(new Uint8Array(buffer, byteOffset, byteLength));
    return heapBytes;
  }

  function ptrToInt32(ptr) {
    var a = new Int32Array(Module.HEAPU8.buffer, ptr, 1);
    return a[0];
  }

  function ptrToFloat32(ptr) {
    var a = new Float32Array(Module.HEAPU8.buffer, ptr, 1);
    return a[0];
  }

  function ptrToInt32s(ptr, length) {
    var buf = new ArrayBuffer(length * Int32Array.BYTES_PER_ELEMENT);
    var copied = new Int32Array(buf);
    copied.set(new Int32Array(Module.HEAPU8.buffer, ptr, length));
    return copied;
  }

  function appendFloat32s(arr, ptr, length) {
    if (arr.buffer.byteLength < arr.byteLength + length * Float32Array.BYTES_PER_ELEMENT) {
      var newByteLength = Math.max(Math.floor(arr.buffer.byteLength * 1.2 / 4) * 4,
                                   arr.byteLength + length * Float32Array.BYTES_PER_ELEMENT);
      var buf = new ArrayBuffer(newByteLength);
      var newArr = new Float32Array(buf, arr.byteOffset, arr.length);
      newArr.set(arr, 0);
      arr = newArr;
    }
    var oldLength = arr.length;
    arr = new Float32Array(arr.buffer, arr.byteOffset, oldLength + length);
    arr.set(new Float32Array(Module.HEAPU8.buffer, ptr, length), oldLength);
    return arr;
  }

  self.addEventListener('message', function(event) {
    initializeP.then(function(funcs) {
      var statePtr = funcs.open();
      var input = event.data.buf;
      var result = {
        id:         event.data.id,
        data:       [],
        sampleRate: 0,
        error:      null,
      };
      var initMinChunkLength = 65536;
      var minChunkLength = initMinChunkLength;
      try {
        while (input.byteLength > 0) {
          var copiedInput = null;
          var chunkLength = Math.min(minChunkLength, input.byteLength);
          if (input instanceof ArrayBuffer) {
            copiedInput = arrayBufferToHeap(input, 0, chunkLength);
          } else if (input instanceof Uint8Array) {
            copiedInput = arrayBufferToHeap(input.buffer, input.byteOffset, chunkLength);
          }

          var outputPtr = Module._malloc(4);
          var readPtr = Module._malloc(4);
          var length = funcs.decode(statePtr, copiedInput.byteOffset, copiedInput.byteLength, outputPtr, readPtr);
          Module._free(copiedInput.byteOffset);

          var read = ptrToInt32(readPtr);
          Module._free(readPtr);
          input = input.slice(read);

          if (length < 0) {
            result.error = 'stbvorbis decode failed: ' + length;
            postMessage(result);
            return;
          }

          var channels = funcs.channels(statePtr);
          if (channels > 0) {
            var dataPtrs = ptrToInt32s(ptrToInt32(outputPtr), channels);
            for (var i = 0; i < dataPtrs.length; i++) {
              if (!result.data[i]) {
                result.data[i] = new Float32Array();
              }
              result.data[i] = appendFloat32s(result.data[i], dataPtrs[i], length);
              Module._free(dataPtrs[i]);
            }
          }
          Module._free(ptrToInt32(outputPtr));
          Module._free(outputPtr);

          if (result.sampleRate === 0) {
            result.sampleRate = funcs.sampleRate(statePtr);
          }

          if (result.data.length === 0 || result.sampleRate === 0) {
            minChunkLength *= 2;
          } else {
            minChunkLength = initMinChunkLength;
          }
        }
      } finally {
        funcs.close(statePtr);
      }
      postMessage(result, result.data.map(function(array) { return array.buffer; }));
    });
  });
})(Module);
