import path from 'path';
import { mdjsProcess } from '@mdjs/core';
import { parentPort } from 'worker_threads';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { pathToUrl } from '../urlPathConverter.js';
import { convertMdFile } from '../converts.js';

async function renderFile({ filePath, outputDir }) {
  let toImportFilePath = filePath;
  if (filePath.endsWith('.md')) {
    toImportFilePath = await convertMdFile(filePath);
  }

  const { default: content, relativeFilePath, layout, ...data } = await import(toImportFilePath);

  const relWriteFilePath = pathToUrl(relativeFilePath);
  const outputWriteFilePath = path.join(outputDir, relWriteFilePath);

  let contentForLayout = content;
  if (toImportFilePath.endsWith('.rocket-generated-from-md.js')) {
    const mdjs = await mdjsProcess(content);
    contentForLayout = mdjs.html;
  }

  let fileContent = contentForLayout;
  if (layout) {
    fileContent = typeof layout.render === 'function' ? layout.render(contentForLayout, data) : layout(contentForLayout, data)
  }

  if (!existsSync(path.dirname(outputWriteFilePath))) {
    await mkdir(path.dirname(outputWriteFilePath), { recursive: true });
  }
  await writeFile(outputWriteFilePath, fileContent);

  parentPort.postMessage({
    status: 200,
    outputWriteFilePath,
  });
}

parentPort.on('message', message => {
  if (message.action === 'renderFile') {
    const { filePath, outputDir } = message;
    renderFile({ filePath, outputDir });
  }
});
