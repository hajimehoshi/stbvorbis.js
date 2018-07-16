} // End of the function decodeWorker().

let workerUrl = '';
if (typeof WebAssembly === 'object') {
  workerUrl = URL.createObjectURL(new Blob([ `(${decodeWorker.toString()})();` ], { type: "text/javascript" }));
} else {
  const scriptPath = document.currentScript.src;
  const directoryPath = scriptPath.slice(0, scriptPath.lastIndexOf('/') + 1);
  workerUrl = directoryPath + 'stbvorbis_asm.js';
}

const worker = new Worker(workerUrl);
let requestId = 0;

stbvorbis.decode = buf => new Promise((resolve, reject) => {
  const currentId = requestId;
  const onmessage = event => {
    const result = event.data;
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

})(); // End of the scope.
