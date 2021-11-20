/* eslint-disable @typescript-eslint/ban-ts-comment */

/** @typedef {import('../types/main').EngineOptions} EngineOptions */
import { existsSync } from 'fs';
import { mkdir, rm } from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

import { applyPlugins } from 'plugins-manager';

import { gatherFiles } from './gatherFiles.js';
import { cleanupWorker, renderViaWorker } from './renderViaWorker.js';
import { debounce } from './helpers/debounce.js';
import { updateRocketHeader } from './updateRocketHeader.js';
import { Watcher } from './Watcher.js';

import { PageTree } from './PageTree.js';
import { sourceRelativeFilePathToOutputRelativeFilePath } from './urlPathConverter.js';

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

  async build() {
    if (!existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
    } else {
      await this.clearOutputDir();
    }

    const pageTree = new PageTree(this.docsDir);

    // write files
    const sourceFiles = await gatherFiles(this.docsDir);

    for (const sourceFilePath of sourceFiles) {
      await updateRocketHeader(sourceFilePath, this.docsDir);
      const { sourceRelativeFilePath } = await this.renderFile(sourceFilePath);
      await pageTree.add(sourceRelativeFilePath);
    }

    await pageTree.save();

    if (pageTree.needsAnotherRenderingPass) {
      for (const sourceFilePath of sourceFiles) {
        await this.renderFile(sourceFilePath);
      }
    }
  }

  async clearOutputDir() {
    await rm(this.outputDir, { recursive: true, force: true });
  }

  async start() {
    await this.watchForRocketHeaderUpdate();
  }

  async watchForRocketHeaderUpdate() {
    const files = await gatherFiles(this.docsDir);

    this.watcher = new Watcher();
    await this.watcher.init(this.docsDir);
    await this.watcher.addPages(files);

    this.watcher.watchPages(
      async page => {
        await updateRocketHeader(page.sourceFilePath, this.docsDir);

        // if (page.active) {  // TODO: add feature to only render pages currently open in the browser
        await this.renderFile(page.sourceFilePath);
        // }
      },
      async page => {
        await this.deleteOutputOf(page.sourceFilePath);
      },
      () => {
        this.events.emit('rocketUpdated');
      },
    );
  }

  async cleanup() {
    if (this.watcher) {
      this.watcher.cleanup();
    }
    await cleanupWorker();
  }

  /**
   * @param {string} sourceFilePath
   */
  async deleteOutputOf(sourceFilePath) {
    const sourceRelativeFilePath = path.relative(this.docsDir, sourceFilePath);
    const outputRelativeFilePath = sourceRelativeFilePathToOutputRelativeFilePath(
      sourceRelativeFilePath,
    );
    const outputFilePath = path.join(this.outputDir, outputRelativeFilePath);
    await rm(outputFilePath, { force: true });
  }

  async renderFile(filePath, { writeFileToDisk = true } = {}) {
    return await renderViaWorker({ filePath, outputDir: this.outputDir, writeFileToDisk });
  }
}
