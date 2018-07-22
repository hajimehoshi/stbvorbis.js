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
  if (typeof WebAssembly === 'object') {
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

var requestId = 0;

stbvorbis.decode = function(buf) {
  return initializeWorkerP.then(function(worker) {
    return new Promise(function (resolve, reject) {
      var currentId = requestId;
      var onmessage = function(event) {
        var result = event.data;
        if (result.id !== currentId) {
          return;
        }
        worker.removeEventListener('message', onmessage);
        if (result.error) {
          reject(result.error);
          return;
        }
        resolve({
          data:       result.data,
          sampleRate: result.sampleRate,
        });
      };
      worker.addEventListener('message', onmessage);
      worker.postMessage({id: requestId, buf: buf}, [buf instanceof Uint8Array ? buf.buffer : buf]);
      requestId++;
    });
  });
};

})(); // End of the scope.
