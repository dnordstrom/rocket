/* eslint-disable @typescript-eslint/ban-ts-comment */

/** @typedef {import('../types/main').EngineOptions} EngineOptions */
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

import { applyPlugins } from 'plugins-manager';

import { gatherFiles } from './gatherFiles.js';
import { cleanupWorker, renderViaWorker } from './renderViaWorker.js';
import { debounce } from './helpers/debounce.js';
import { updateRocketHeader } from './updateRocketHeader.js';
import { Watcher } from './Watcher.js';

import { PageTree } from './PageTree.js';

export class Engine {
  /** @type {EngineOptions} */
  options = {
    plugins: undefined,
    defaultPlugins: [],
    setupPlugins: [],
  };

  events = new EventEmitter();

  /**
   * @param {Partial<EngineOptions>} options
   */
  constructor(options) {
    this.setOptions(options);
  }

  /**
   * @param {Partial<EngineOptions>} newOptions
   */
  setOptions(newOptions) {
    if (!newOptions) {
      return;
    }
    const setupPlugins = newOptions.setupPlugins
      ? [...this.options.setupPlugins, ...newOptions.setupPlugins]
      : this.options.setupPlugins;

    this.options = {
      ...this.options,
      ...newOptions,
      setupPlugins,
    };
    const defaultPlugins = [...this.options.defaultPlugins];
    delete this.options.defaultPlugins;

    this.options = applyPlugins(this.options, defaultPlugins);

    const { docsDir: userDocsDir, outputDir: userOutputDir } = this.options;
    this.docsDir = userDocsDir ? path.resolve(userDocsDir) : process.cwd();
    this.outputDir = userOutputDir
      ? path.resolve(userOutputDir)
      : path.join(this.docsDir, '..', '_site');
  }

  async run() {
    if (!existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
    }

    const pageTree = new PageTree(this.docsDir);

    // write files
    const sourceFiles = await gatherFiles(this.docsDir);

    for (const sourceFilePath of sourceFiles) {
      await updateRocketHeader(sourceFilePath, this.docsDir);
      const { outputWriteFilePath, relativeFilePath } = await this.renderFile(sourceFilePath);
      await pageTree.add(relativeFilePath);
    }

    await pageTree.save();

    if (pageTree.needsAnotherRenderingPass) {
      for (const sourceFilePath of sourceFiles) {
        await this.renderFile(sourceFilePath);
      }
    }
  }

  async start() {
    await this.watchForRocketHeaderUpdate();
  }

  async watchForRocketHeaderUpdate() {
    const files = await gatherFiles(this.docsDir);

    this.watcher = new Watcher();
    await this.watcher.addPages(files);

    const debouncedUpdateEvent = debounce(
      () => {
        this.events.emit('rocketUpdated');
      },
      5,
      false,
    );

    this.watcher.watchPages(async page => {
      await updateRocketHeader(page.filePath, this.docsDir);
      // if (page.active) {  // TODO: add feature to only render pages currently open in the browser
      await this.renderFile(page.filePath);
      // }
      debouncedUpdateEvent();
    });
  }

  async cleanup() {
    if (this.watcher) {
      this.watcher.cleanup();
    }
    await cleanupWorker();
  }

  async renderFile(filePath, { writeFileToDisk = true } = {}) {
    return await renderViaWorker({ filePath, outputDir: this.outputDir, writeFileToDisk });
  }
}
