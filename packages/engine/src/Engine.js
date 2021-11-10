/* eslint-disable @typescript-eslint/ban-ts-comment */

/** @typedef {import('../types/main').EngineOptions} EngineOptions */
import fs, { exists, existsSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

import { applyPlugins } from 'plugins-manager';

import { gatherFiles } from './gatherFiles.js';
import { cleanupWorker, renderViaWorker } from './renderViaWorker.js';
import { debounce } from './helpers/debounce.js';
import { updateRocketHeader } from './updateRocketHeader.js';
import { Watcher } from './Watcher.js';

import { parseHtmlFile } from '@web/menu';
import { getHtmlMetaData } from './getHtmlMetaData.js';
import { pathToUrl } from './urlPathConverter.js';

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
    if (!fs.existsSync(this.outputDir)) {
      await mkdir(this.outputDir, { recursive: true });
    }

    // write files
    const sourceFiles = await gatherFiles(this.docsDir);
    const pages = [];
    for (const sourceFilePath of sourceFiles) {
      await updateRocketHeader(sourceFilePath, this.docsDir);
      const { outputWriteFilePath, relativeFilePath } = await this.renderFile(sourceFilePath);

      // console.log({ outputWriteFilePath, relativeFilePath })

      const needsRerender = await this.updatePageTreeModel({
        outputFilePath: outputWriteFilePath,
        relativeFilePath,
      });
      pages.push({
        sourceFilePath,
        outputFilePath: outputWriteFilePath,
        relativeFilePath,
        needsRerender,
      });
    }

    // we have two loops her without it every render would need a new worker (due tue the rerendering) which is expensive
    for (const page of pages) {
      if (page.needsRerender) {
        //
      }
      // const needsRerender = await this.updatePageTreeModel(page);
      // if (needsRerender) {
      //   // await this.renderFile(outputFilePath);
      // }
    }
  }

  async updatePageTreeModel(page) {
    function findParent(child, tree) {
      return tree.first(node => {
        return child.url.startsWith(node.model.url) && node.model.level === child.level - 1;
      });
    }

    async function readJsonFile(filePath) {
      const content = await readFile(filePath);
      return JSON.parse(content.toString());
    }

    const pageTreeDataFilePath = path.join(this.docsDir, 'pageTreeData.rocketGenerated.json');
    const pageTreeData = existsSync(pageTreeDataFilePath)
      ? await readJsonFile(pageTreeDataFilePath)
      : {};

    const treeModel = new TreeModel();
    treeModel.parse(pageTreeData);

    



    // const { relativeFilePath, outputFilePath } = page;

    // const foundIndex = pageTreeData.findIndex(p => p.relativeFilePath === relativeFilePath);
    // const htmlMetaData = await getHtmlMetaData(outputFilePath);

    // const data = {
    //   relativeFilePath,
    //   url: pathToUrl(relativeFilePath),
    //   ...htmlMetaData,
    // };

    // if (foundIndex === -1) {
    //   pageTreeData.push(data);
    // } else {
    //   pageTreeData[foundIndex] = data;
    // }

    // console.log({ pageTreeData });

    // const stuff = await parseHtmlFile(outputFilePath);
    // await writeFile(pageTreeDataFilePath, JSON.stringify(pageTreeData, null, 2));

    return true;
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
    // return result.outputWriteFilePath;
    // console.log({foo});
  }
}
