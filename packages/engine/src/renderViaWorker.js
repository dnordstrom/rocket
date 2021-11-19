import { Worker } from 'worker_threads';

let worker = new Worker('./src/worker/renderFile.js');
const history = new Set();

export function renderViaWorker({ filePath, outputDir, writeFileToDisk }) {
  if (history.has(filePath)) {
    // trying rerender the same file => needs a new worker to clear the module cache
    worker.unref();
    worker = new Worker('./src/worker/renderFile.js');
    history.clear();
  }
  history.add(filePath);

  return new Promise((resolve, reject) => {
    worker.postMessage({ action: 'renderFile', filePath, outputDir, writeFileToDisk });

    worker.once('message', result => {
      if (result.filePath === filePath) {
        resolve(result);
      } else {
        reject(new Error(`File path mismatch: ${result.filePath} !== ${filePath}`));
      }
    });
    worker.once('error', error => {
      console.log('GOT error', error);
      reject(error);
    });
  });
}

export async function cleanupWorker() {
  await worker.unref();
}
