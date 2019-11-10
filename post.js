// Copyright 2018 The stbvorbis.js Authors
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

} // End of the function decodeWorker().

function httpGet(url) {
  return new Promise(function(resolve, reject) {
    // fetch is not available on iOS 9. Use XMLHttpRequest instead.
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.addEventListener('load', function () {
      var status = xhr.status;
      if (status < 200 || status >= 300) {
        reject({
          status: status,
        });
        return;
      }
      resolve(xhr.response);
    });
    xhr.addEventListener('error', function () {
      reject({
        status: xhr.status,
      });
    });
    xhr.send();
  });
}

var initializeWorkerP = new Promise(function(resolve, reject) {
  // wasm on iOS Safari is STILL unstable even if it is iOS 13
  var isiOS = navigator.userAgent.match(/iPhone|iPad|iPod/);
  if (typeof WebAssembly === 'object' && !isiOS) {
    var workerURL = URL.createObjectURL(new Blob(
      ['(' + decodeWorker.toString() + ')();'],
      {type: 'text/javascript'}
    ));
    resolve(new Worker(workerURL));
    return;
  }

  var scriptPath = document.currentScript.src;
  var directoryPath = scriptPath.slice(0, scriptPath.lastIndexOf('/') + 1);
  httpGet(directoryPath + 'stbvorbis_asm.js').then(function(script) {
    workerURL = URL.createObjectURL(new Blob(
      [script],
      {type: 'text/javascript'}
    ));
    resolve(new Worker(workerURL));
  }).catch(function(err) {
    reject(new Error('asmjs version is not available (HTTP status: ' + err.status + ' on stbvorbis_asm.js). Deploy stbvorbis_asm.js at the same place as stbvorbis.js.'));
  });
});

// Catch the error once to suppress error messages on console.
initializeWorkerP.catch(function(e) {});

stbvorbis.decode = function(buf, outCallback) {
  var inCallback = stbvorbis.decodeStream(outCallback);
  inCallback({
    data: buf,
    eof:  false,
  });
  inCallback({
    data: null,
    eof:  true,
  });
}

var sessionId = 0;
var outCallbacks = {};

stbvorbis.decodeStream = function(outCallback) {
  // A callback that actually sends input data to worker.
  // This is initialized later.
  var inCallbackImpl = null;

  // Represents a queue that holds pending input.
  // This queue is consumed just after inCallbackImpl is initialized.
  var inputQueue = [];

  // A callback that is called on user side.
  var inCallback = function(input) {
    // inCallbackImpl is not initialized yet. Perserve the input at the queue.
    if (!inCallbackImpl) {
      inputQueue.push(input)
      return;
    }
    inCallbackImpl(input);
  };

  initializeWorkerP.then(function(worker) {
    var currentId = sessionId;
    sessionId++;

    var sampleRate = 0;
    var data = [];
    var onmessage = function(event) {
      var result = event.data;
      if (result.id !== currentId) {
        return;
      }

      if (result.error) {
        outCallback({
          data:       null,
          sampleRate: 0,
          eof:        false,
          error:      result.error,
        });
        worker.removeEventListener('message', onmessage);
        return;
      }

      if (result.eof) {
        outCallback({
          data:       null,
          sampleRate: 0,
          eof:        true,
          error:      null,
        });
        worker.removeEventListener('message', onmessage);
        return;
      }

      outCallback({
        data:       result.data,
        sampleRate: result.sampleRate,
        eof:        false,
        error:      null,
      });
    };
    worker.addEventListener('message', onmessage);

    inCallbackImpl = function(input) {
      if (input.eof) {
        worker.postMessage({
          id:  currentId,
          buf: null,
          eof: true,
        });
        return;
      }

      var buf = input.data;
      worker.postMessage({
        id:  currentId,
        buf: buf,
        eof: false,
      }, [buf instanceof Uint8Array ? buf.buffer : buf]);
    };

    // Consume the pending input.
    for (var i = 0; i < inputQueue.length; i++) {
      inCallbackImpl(inputQueue[i]);
    }
    inputQueue = null;
  });

  return inCallback;
};

})(); // End of the scope.
