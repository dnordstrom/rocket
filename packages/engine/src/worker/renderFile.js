import path from 'path';
import { mdjsProcess } from '@mdjs/core';
import { parentPort } from 'worker_threads';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { sourceRelativeFilePathToOutputRelativeFilePath } from '../urlPathConverter.js';
import { convertMdFile } from '../converts.js';

async function renderFile({ writeFileToDisk = true, filePath, outputDir }) {
  let toImportFilePath = filePath;
  if (filePath.endsWith('.rocket.md')) {
    toImportFilePath = await convertMdFile(filePath);
  }
  const { default: content, ...data } = await import(toImportFilePath);

  const { sourceRelativeFilePath, layout } = data;
  const outputRelativeFilePath = sourceRelativeFilePathToOutputRelativeFilePath(sourceRelativeFilePath);
  const outputFilePath = path.join(outputDir, outputRelativeFilePath);

  let contentForLayout = content;
  if (toImportFilePath.endsWith('.rocketGeneratedFromMd.js')) {
    const mdjs = await mdjsProcess(content);
    contentForLayout = mdjs.html;
  }

  let fileContent = contentForLayout;
  if (layout) {
    fileContent = typeof layout.render === 'function' ? await layout.render(contentForLayout, data) : await layout(contentForLayout, data)
  }

  if (writeFileToDisk) {
    if (!existsSync(path.dirname(outputFilePath))) {
      await mkdir(path.dirname(outputFilePath), { recursive: true });
    }
    await writeFile(outputFilePath, fileContent);
  }

  parentPort.postMessage({
    status: 200,
    outputFilePath,
    fileContent,
    filePath,
    sourceRelativeFilePath,
  });
}

parentPort.on('message', message => {
  if (message.action === 'renderFile') {
    const { filePath, outputDir } = message;
    renderFile({ filePath, outputDir });
  }
});
