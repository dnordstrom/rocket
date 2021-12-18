import path from 'path';
import { mdjsProcess } from '@mdjs/core';
import { parentPort } from 'worker_threads';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import {
  sourceRelativeFilePathToOutputRelativeFilePath,
  sourceRelativeFilePathToUrl,
} from '../urlPathConverter.js';
import { convertMdFile } from '../converts.js';
import { transformFile } from '../helpers/transformFile.js';

async function renderFile({ writeFileToDisk = true, filePath, outputDir }) {
  let toImportFilePath = filePath;
  if (filePath.endsWith('.rocket.md')) {
    toImportFilePath = await convertMdFile(filePath);
  }
  const { default: content, ...data } = await import(toImportFilePath);

  const { sourceRelativeFilePath, layout } = data;
  const outputRelativeFilePath = sourceRelativeFilePathToOutputRelativeFilePath(
    sourceRelativeFilePath,
  );
  const outputFilePath = path.join(outputDir, outputRelativeFilePath);

  let contentForLayout = content;
  if (toImportFilePath.endsWith('.rocketGeneratedFromMd.js')) {
    const options = {};
    if (data.setupUnifiedPlugins) {
      options.setupUnifiedPlugins = data.setupUnifiedPlugins;
    }
    const mdjs = await mdjsProcess(content, options);
    contentForLayout = mdjs.html;
  }


  let fileContent = contentForLayout;
  if (layout) {
    const layoutData = {
      sourceFilePath: filePath,
      outputFilePath,
      sourceRelativeFilePath,
      outputRelativeFilePath,
      url: sourceRelativeFilePathToUrl(sourceRelativeFilePath),
      ...data,
    }
    fileContent =
      typeof layout.render === 'function'
        ? await layout.render(contentForLayout, layoutData)
        : await layout(contentForLayout, layoutData);
  }

  fileContent = await transformFile(fileContent, {
    setupPlugins: data.setupEnginePlugins,
    sourceFilePath: filePath,
    outputFilePath,
    sourceRelativeFilePath,
    outputRelativeFilePath,
    url: sourceRelativeFilePathToUrl(sourceRelativeFilePath),
  });

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
