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
    // reject is not available here since this promise is used later.
    resolve(new Error('asm.js fallback is not available. HTTP status: ' + err.status));
  });
});

var requestId = 0;

stbvorbis.decode = function(buf) {
  return new Promise(function(resolve, reject) {
    initializeWorkerP.then(function(val) {
      if (val instanceof Error) {
        reject(val)
        return;
      }
      var worker = val;
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
