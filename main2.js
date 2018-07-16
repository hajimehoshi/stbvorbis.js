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
  var initializationP = new Promise(function(resolve) {
    if (typeof useWasm !== 'undefined') {
      Module.onRuntimeInitialized = function() {
        var decodeMemory = Module.cwrap('stb_vorbis_decode_memory_float', 'number',
                                        ['number', 'number', 'number', 'number', 'number']);
        resolve(decodeMemory);
      };
      return;
    }
    var decodeMemory = Module['_stb_vorbis_decode_memory_float'];
    resolve(decodeMemory);
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

  function ptrToFloat32s(ptr, length) {
    var buf = new ArrayBuffer(length * Float32Array.BYTES_PER_ELEMENT);
    var copied = new Float32Array(buf);
    copied.set(new Float32Array(Module.HEAPU8.buffer, ptr, length));
    return copied;
  }

  self.addEventListener('message', function(event) {
    initializationP.then(function(decodeMemory) {
      var buf = event.data.buf;
      var copiedBuf = null;
      if (buf instanceof ArrayBuffer) {
        copiedBuf = arrayBufferToHeap(buf, 0, buf.byteLength);
      } else if (buf instanceof Uint8Array) {
        copiedBuf = arrayBufferToHeap(buf.buffer, buf.byteOffset, buf.byteLength);
      }
      var channelsPtr = Module._malloc(4);
      var sampleRatePtr = Module._malloc(4);
      var outputPtr = Module._malloc(4);
      var length = decodeMemory(copiedBuf.byteOffset, copiedBuf.byteLength, channelsPtr, sampleRatePtr, outputPtr);
      if (length < 0) {
        postMessage({
          id:    event.data.id,
          error: new Error('stbvorbis decode failed: ' + length),
        });
        return;
      }
      var channels = ptrToInt32(channelsPtr);
      
      var data = [];
      var dataPtrs = ptrToInt32s(ptrToInt32(outputPtr), channels);
      for (var i = 0; i < dataPtrs; i++) {
        data.push(ptrToFloat32s(dataPtrs[i], length));
      }
      var result = {
        id:         event.data.id,
        data:       data,
        sampleRate: ptrToInt32(sampleRatePtr),
      };

      Module._free(copiedBuf.byteOffset);
      Module._free(channelsPtr);
      Module._free(sampleRatePtr);

      for (var i = 0; i < dataPtrs; i++) {
        Module._free(dataPtrs[i]);
      }
      Module._free(ptrToInt32(outputPtr));
      Module._free(outputPtr);

      postMessage(result, result.data.map(function(array) { return array.buffer; }));
    });
  });
})(Module);
