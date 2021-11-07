import { Worker } from 'worker_threads';

let worker = new Worker('./src/worker/renderFile.js');
const history = new Set();

export function renderViaWorker({ filePath, outputDir }) {
  if (history.has(filePath)) {
    // trying rerender the same file => needs a new worker to clear the module cache
    worker.unref();
    worker = new Worker('./src/worker/renderFile.js');
    history.clear();
  }
  history.add(filePath);

  return new Promise((resolve, reject) => {
    worker.postMessage({ action: 'renderFile', filePath, outputDir });

    worker.once('message', result => {
      resolve(result);
    });
    worker.once('error', error => {
      reject(error);
    });
  });
}

export async function cleanupWorker() {
  await worker.unref();
}
