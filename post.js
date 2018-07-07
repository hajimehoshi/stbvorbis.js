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

(Module => {
  const INITIALIZING_PHASE_NOT_STARTED  = 0;
  const INITIALIZING_PHASE_INITIALIZING = 1;
  const INITIALIZING_PHASE_INITIALIZED  = 2;

  var decodeMemory = null;
  var initializingPhase = INITIALIZING_PHASE_NOT_STARTED;
  var initializingResolveQueue = [];

  const initializationP = new Promise(resolve => {
    initializingResolveQueue.push(resolve);

    switch (initializingPhase) {
    case INITIALIZING_PHASE_NOT_STARTED:
      Module.onRuntimeInitialized = () => {
        decodeMemory = Module.cwrap('stb_vorbis_decode_memory_float', 'number',
                                    ['number', 'number', 'number', 'number', 'number']);
        for (const resolve of initializingResolveQueue) {
          resolve();
        }
        initializingResolveQueue = [];
        initializingPhase = INITIALIZING_PHASE_INITIALIZED;
      };
      initializingPhase = INITIALIZING_PHASE_INITIALIZING;
      break

    case INITIALIZING_PHASE_INITIALIZING:
      break;

    case INITIALIZING_PHASE_INITIALIZED:
      for (const resolve of initializingResolveQueue) {
        resolve();
      }
      initializingResolveQueue = [];
      break;
    }
  });

  function arrayBufferToHeap(buffer, byteOffset, byteLength) {
    const ptr = Module._malloc(byteLength);
    const heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, byteLength);
    heapBytes.set(new Uint8Array(buffer, byteOffset, byteLength));
    return heapBytes;
  }

  function ptrToInt32(ptr) {
    const a = new Int32Array(Module.HEAPU8.buffer, ptr, 1);
    return a[0];
  }

  function ptrToFloat32(ptr) {
    const a = new Float32Array(Module.HEAPU8.buffer, ptr, 1);
    return a[0];
  }

  function ptrToInt32s(ptr, length) {
    const buf = new ArrayBuffer(length * Int32Array.BYTES_PER_ELEMENT);
    const copied = new Int32Array(buf);
    copied.set(new Int32Array(Module.HEAPU8.buffer, ptr, length));
    return copied;
  }

  function ptrToFloat32s(ptr, length) {
    const buf = new ArrayBuffer(length * Float32Array.BYTES_PER_ELEMENT);
    const copied = new Float32Array(buf);
    copied.set(new Float32Array(Module.HEAPU8.buffer, ptr, length));
    return copied;
  }

  stbvorbis.decode = (buf) => {
    return new Promise(resolve2 => {
      initializationP.then(() => {
        let copiedBuf = null;
        if (buf instanceof ArrayBuffer) {
          copiedBuf = arrayBufferToHeap(buf, 0, buf.byteLength);
        } else if (buf instanceof TypedArray) {
          copiedBuf = arrayBufferToHeap(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        const channelsPtr = Module._malloc(4);
        const sampleRatePtr = Module._malloc(4);
        const outputPtr = Module._malloc(4);
        const length = decodeMemory(copiedBuf.byteOffset, copiedBuf.byteLength, channelsPtr, sampleRatePtr, outputPtr);
        if (length < 0) {
          throw 'stbvorbis decode failed: ' + length;
        }
        const channels = ptrToInt32(channelsPtr);
        
        let data = [];
        const dataPtrs = ptrToInt32s(ptrToInt32(outputPtr), channels);
        for (const ptr of dataPtrs) {
          data.push(ptrToFloat32s(ptr, length));
        }
        const result = {
          data:       data,
          sampleRate: ptrToInt32(sampleRatePtr),
        };

        Module._free(copiedBuf.byteOffset);
        Module._free(channelsPtr);
        Module._free(sampleRatePtr);

        for (const ptr of dataPtrs) {
          Module._free(ptr);
        }
        Module._free(ptrToInt32(outputPtr));
        Module._free(outputPtr);

        resolve2(result);
      });
    });
  };
})(Module);

})(); // End of the scope.
