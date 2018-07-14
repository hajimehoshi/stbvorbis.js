var stbvorbis = typeof stbvorbis !== 'undefined' ? stbvorbis : {};

(() => {
  'use strict';
  const scriptPath = document.currentScript.src;
  const directoryPath = scriptPath.slice(0, scriptPath.lastIndexOf('/') + 1);
  const worker = new Worker(directoryPath + 'stbvorbis_worker_wasm.js');

  let id = 0;
  stbvorbis.decode = arrayBuffer => new Promise((resolve, reject) => {
    const myID = id;
    worker.addEventListener('message', function onmessage(event) {
      const result = event.data;
      if (result.id === myID) {
        delete result.id;
        worker.removeEventListener('message', onmessage);
        if (result.error) {
          reject(result.error);
        } else {
          resolve(result);
        }
      }
    });
    worker.postMessage({id, arrayBuffer}, [arrayBuffer instanceof TypedArray ? arrayBuffer.buffer : arrayBuffer]);
    id++;
  });
})();