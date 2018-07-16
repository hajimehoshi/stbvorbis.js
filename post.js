} // End of the function decodeWorker().

var workerUrl = '';
if (typeof WebAssembly === 'object') {
  workerUrl = URL.createObjectURL(new Blob([ '(' + decodeWorker.toString() + ')();' ], { type: 'text/javascript' }));
} else {
  var scriptPath = document.currentScript.src;
  var directoryPath = scriptPath.slice(0, scriptPath.lastIndexOf('/') + 1);
  workerUrl = directoryPath + 'stbvorbis_asm.js';
}

var worker = new Worker(workerUrl);
var requestId = 0;

stbvorbis.decode = function(buf) {
  return new Promise(function(resolve, reject) {
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
};

})(); // End of the scope.
