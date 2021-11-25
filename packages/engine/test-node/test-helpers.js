import path from 'path';
import chai from 'chai';
import { fileURLToPath } from 'url';
import prettier from 'prettier';
import { rm, writeFile } from 'fs/promises';

import { Engine } from '../src/Engine.js';
import { existsSync, readFileSync } from 'fs';

const { expect } = chai;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {function} method
 * @param {string} errorMessage
 */
export async function expectThrowsAsync(method, { errorMatch, errorMessage } = {}) {
  let error = null;
  try {
    await method();
  } catch (err) {
    error = err;
  }
  expect(error).to.be.an('Error', 'No error was thrown');
  if (errorMatch) {
    expect(error.message).to.match(errorMatch);
  }
  if (errorMessage) {
    expect(error.message).to.equal(errorMessage);
  }
}

export async function setupTestEngine(docsDir, options = {}) {
  const useOptions = { ...options, docsDir };
  if (useOptions.docsDir) {
    useOptions.docsDir = path.join(__dirname, docsDir.split('/').join(path.sep));
  }
  useOptions.outputDir = path.join(useOptions.docsDir, '..', '__output');

  const engine = new Engine();
  engine.setOptions(useOptions);
  await engine.clearOutputDir();

  function readOutput(toInspect, { format = false } = {}) {
    const filePath = path.join(engine.outputDir, toInspect);
    let text = readFileSync(filePath).toString();
    if (format) {
      text = prettier.format(text, { parser: format, printWidth: 100 });
    }
    return text;
  }

  function readSource(toInspect, { format = false } = {}) {
    const filePath = path.join(engine.docsDir, toInspect);
    let text = readFileSync(filePath).toString();
    if (format) {
      text = prettier.format(text, { parser: format, printWidth: 100 });
    }
    return text;
  }

  async function writeSource(toInspect, text) {
    const filePath = path.join(engine.docsDir, toInspect);
    await writeFile(filePath, text);
  }

  async function deleteSource(toInspect) {
    const filePath = path.join(engine.docsDir, toInspect);
    await rm(filePath, { force: true });
  }

  function outputExists(toInspect) {
    const filePath = path.join(engine.outputDir, toInspect);
    return existsSync(filePath);
  }

  async function cleanup() {
    await engine.cleanup();
  }

  async function build() {
    await engine.build();
    await cleanup();
  }

  function watch() {
    engine.watch();
  }

  function start() {
    engine.start();
  }

  function setAsOpenedInBrowser(toInspect) {
    const sourceFilePath = path.join(engine.docsDir, toInspect);
    engine.watcher?.addWebSocketToPage(sourceFilePath, { send: () => {} });
  }

  function anEngineEvent(eventName) {
    return new Promise((resolve, reject) => {
      engine.events.on(eventName, () => {
        resolve();
      });
    });
  }

  return {
    readOutput,
    outputExists,
    readSource,
    build,
    writeSource,
    deleteSource,
    watch,
    cleanup,
    start,
    engine,
    anEngineEvent,
    setAsOpenedInBrowser,
  };
}
