/* eslint-disable @typescript-eslint/ban-ts-comment */

/** @typedef {import('../types/main').EngineOptions} EngineOptions */
import { existsSync } from 'fs';
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import { startDevServer } from '@web/dev-server';

import { applyPlugins } from 'plugins-manager';

import { gatherFiles } from './gatherFiles.js';
import { cleanupWorker, renderViaWorker } from './renderViaWorker.js';
import { updateRocketHeader } from './updateRocketHeader.js';
import { Watcher } from './Watcher.js';

import { PageTree } from './PageTree.js';
import {
  sourceRelativeFilePathToOutputRelativeFilePath,
  urlToSourceFilePath,
} from './urlPathConverter.js';

export class Engine {
  /** @type {EngineOptions} */
  options = {
    plugins: undefined,
    defaultPlugins: [],
    setupPlugins: [],
  };

  events = new EventEmitter();

  /**
   * @param {Partial<EngineOptions>} [options]
   */
  constructor(options = {}) {
    this.setOptions({ ...this.options, ...options });
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

    const defaultPlugins = this.options.defaultPlugins ? [...this.options.defaultPlugins] : [];
    delete this.options.defaultPlugins;

    this.options = applyPlugins(this.options, defaultPlugins);

    const { docsDir: userDocsDir, outputDir: userOutputDir } = this.options;
    this.docsDir = userDocsDir ? path.resolve(userDocsDir) : path.join(process.cwd(), 'docs');
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

    this.cleanup();
  }

  async clearOutputDir() {
    await rm(this.outputDir, { recursive: true, force: true });
  }

  async start() {
    const files = await gatherFiles(this.docsDir);

    this.watcher = new Watcher();
    await this.watcher.init(this.docsDir);
    await this.watcher.addPages(files);

    function registerTabPlugin() {
      return {
        name: 'register-tab-plugin',
        injectWebSocket: true,
        serve(context) {
          // you can serve a virtual module to be imported
          if (context.path === '/ws-register-tab.js') {
            return "import { sendMessage } from '/__web-dev-server__web-socket.js';\n export default () => { sendMessage({ type: 'register-tab', pathname: document.location.pathname }); }";
          }
        },
      };
    }

    this.devServer = await startDevServer({
      config: {
        open: false,
        rootDir: this.outputDir,
        plugins: [registerTabPlugin()],
      },
      logStartMessage: false,
      readCliArgs: false,
      readFileConfig: false,
      // argv: this.__argv,
    });

    this.devServer.webSockets.on('message', async ({ webSocket, data }) => {
      const sourceFilePath = await this.getSourceFilePathFromUrl(data.pathname);
      this.watcher?.addWebSocketToPage(sourceFilePath, webSocket);
    });

    this.devServer.webSockets.webSocketServer.on('connection', webSocket => {
      webSocket.on('close', () => {
        this.watcher?.removeWebSocket(webSocket);
      });

      webSocket.send(
        JSON.stringify({ type: 'import', data: { importPath: '/ws-register-tab.js' } }),
      );
    });

    this.watcher.watchPages(
      async page => {
        await updateRocketHeader(page.sourceFilePath, this.docsDir);
        if (page.isOpenedInBrowser) {
          try {
            await this.renderFile(page.sourceFilePath);
          } catch (error) {
            await this.writeErrorAsHtmlToOutput(page.sourceFilePath, error);
          }
          setTimeout(() => {
            // TODO: @web/dev-server has a caching bug it seems need to wait some time before reloading
            for (const webSocket of page.webSockets) {
              webSocket.send(
                JSON.stringify({
                  type: 'import',
                  data: { importPath: 'data:text/javascript,window.location.reload()' },
                }),
              );
            }
          }, 110);
        }
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
    this?.watcher?.cleanup();
    this.devServer?.stop();
    await cleanupWorker();
  }

  /**
   * @param {string} sourceFilePath
   */
  async deleteOutputOf(sourceFilePath) {
    await rm(this.getOutputFilePath(sourceFilePath), { force: true });
  }

  getOutputFilePath(sourceFilePath) {
    const sourceRelativeFilePath = path.relative(this.docsDir, sourceFilePath);
    const outputRelativeFilePath = sourceRelativeFilePathToOutputRelativeFilePath(
      sourceRelativeFilePath,
    );
    return path.join(this.outputDir, outputRelativeFilePath);
  }

  async getSourceFilePathFromUrl(url) {
    return await urlToSourceFilePath(url, this.docsDir);
  }

  async writeErrorAsHtmlToOutput(sourceFilePath, error) {
    const outputFilePath = this.getOutputFilePath(sourceFilePath);
    const errorHtml = `
      <html>
        <head>
          <title>${error.message}</title>
        </head>
        <body>
          <h1>${error.message}</h1>
          <pre>${error.stack}</pre>
        </body>
      </html>
    `;
    const outputFilePathDir = path.dirname(outputFilePath);

    if (!existsSync(outputFilePathDir)) {
      await mkdir(outputFilePathDir, { recursive: true });
    }

    await writeFile(outputFilePath, errorHtml);
  }

  async renderFile(filePath, { writeFileToDisk = true } = {}) {
    return await renderViaWorker({ filePath, outputDir: this.outputDir, writeFileToDisk });
  }
}
