import watcher from '@parcel/watcher';
import { convertMdFile } from './converts.js';
import { findJsDependencies } from './helpers/findJsDependencies.js';

async function getJsDependencies(sourceFilePath) {
  let toImportFilePath = sourceFilePath;
  if (sourceFilePath.endsWith('.rocket.md')) {
    toImportFilePath = await convertMdFile(sourceFilePath);
  }

  const jsDependencies = await findJsDependencies([toImportFilePath]);
  return jsDependencies;
}

function isRocketPageFile(filePath) {
  return (
    filePath.endsWith('.rocket.js') ||
    filePath.endsWith('.rocket.md') ||
    filePath.endsWith('.rocket.html')
  );
}

function shouldHandle(filePath, ignoreFolders) {
  for (const ignoreFolder of ignoreFolders) {
    if (filePath.startsWith(ignoreFolder)) {
      return false;
    }
  }
  return true;
}

export class Watcher {
  pages = new Map();

  acceptPageUpdates = true;

  _taskQueue = new Map();

  async init(initDir, { ignoreFolders = [] }) {
    this.subscription = await watcher.subscribe(initDir, async (err, events) => {
      if (this.acceptPageUpdates) {
        for (const event of events) {
          if (shouldHandle(event.path, ignoreFolders)) {
            if (event.type === 'create') {
              await this.addCreateTask(event.path);
            }
            if (event.type === 'update') {
              await this.addUpdateTask(event.path);
            }
            if (event.type === 'delete') {
              await this.addDeleteTask(event.path);
            }
          }
        }
        await this.executeTaskQueue();
      } else {
        for (const event of events) {
          if (shouldHandle(event.path, ignoreFolders)) {
            if (
              this._taskQueue.has(event.path) ||
              event.path.endsWith('pageTreeData.rocketGenerated.json')
            ) {
              // file is either in queue or is the pageTreeData.rocketGenerated.json file
            } else {
              console.log(
                `You saved ${event.path} while Rocket was busy building. Automatic rebuilding is not yet implemented please save again.`,
              );
            }
          }
        }
      }
    });
  }

  async addUpdateTask(sourceFilePath) {
    for (const [pageSourceFilePath, page] of this.pages) {
      if (pageSourceFilePath === sourceFilePath || page.jsDependencies.includes(sourceFilePath)) {
        this._taskQueue.set(pageSourceFilePath, { ...page, type: 'update' });
      }
    }
  }

  async addCreateTask(sourceFilePath) {
    if (isRocketPageFile(sourceFilePath)) {
      this._taskQueue.set(sourceFilePath, { type: 'create' });
    }
  }

  async addDeleteTask(sourceFilePath) {
    for (const [pageSourceFilePath, page] of this.pages) {
      if (pageSourceFilePath === sourceFilePath || page.jsDependencies.includes(sourceFilePath)) {
        this._taskQueue.set(pageSourceFilePath, { type: 'delete' });
      }
    }
  }

  async executeTaskQueue() {
    if (this._taskQueue.size === 0) {
      return;
    }
    this.acceptPageUpdates = false;
    for (const [sourceFilePath, info] of this._taskQueue) {
      if (info.type === 'create') {
        const isActiveCounter = 5;
        await this.renderCallback({ sourceFilePath, isActiveCounter });
        await this.createPage(sourceFilePath, { isActiveCounter });
      }
      if (info.type === 'update') {
        const isOpenedInBrowser = !!info.webSockets?.size ?? false;
        const isActiveCounter = info.isActiveCounter ? info.isActiveCounter - 1 : 0;
        await this.renderCallback({ ...info, sourceFilePath, isOpenedInBrowser, isActiveCounter });
        await this.updatePage(sourceFilePath, { isActiveCounter });
      }
      if (info.type === 'delete') {
        await this.deleteCallback({ sourceFilePath });
        await this.deletePage(sourceFilePath);
      }
    }
    await this.doneCallback();
    this._taskQueue.clear();
    this.acceptPageUpdates = true;
  }

  async updatePage(sourceFilePath, options = {}) {
    if (this.pages.has(sourceFilePath)) {
      const page = this.pages.get(sourceFilePath);
      page.jsDependencies = await getJsDependencies(sourceFilePath);
      if (options.isActiveCounter !== undefined) {
        page.isActiveCounter = options.isActiveCounter;
      }
      this.pages.set(sourceFilePath, page);
    } else {
      throw new Error(`Page not found in watch index while trying to update: ${sourceFilePath}`);
    }
  }

  addWebSocketToPage(sourceFilePath, webSocket) {
    if (this.pages.has(sourceFilePath)) {
      const page = this.pages.get(sourceFilePath);
      if (!page.webSockets) {
        page.webSockets = new Set();
      }
      page.webSockets.add(webSocket);
      this.pages.set(sourceFilePath, page);
    } else {
      throw new Error(
        `Page not found in watch index while trying to add websocket: ${sourceFilePath}`,
      );
    }
  }

  removeWebSocket(webSocket) {
    for (const [sourceFilePath, page] of this.pages.entries()) {
      if (page.webSockets && page.webSockets.has(webSocket)) {
        page.webSockets.delete(webSocket);
        this.pages.set(sourceFilePath, page);
      }
    }
  }

  async createPage(sourceFilePath, options = {}) {
    const page = {
      ...options,
      jsDependencies: await getJsDependencies(sourceFilePath),
    };
    this.pages.set(sourceFilePath, page);
    return page;
  }

  async deletePage(sourceFilePath) {
    if (this.pages.has(sourceFilePath)) {
      this.pages.delete(sourceFilePath);
    } else {
      throw new Error(`Page not found in watch index while trying to delete: ${sourceFilePath}`);
    }
  }

  async addPages(sourceFilePaths) {
    for (const sourceFilePath of sourceFilePaths) {
      await this.createPage(sourceFilePath);
    }
  }

  async watchPages(renderCallback, deleteCallback, doneCallback) {
    this.renderCallback = renderCallback;
    this.deleteCallback = deleteCallback;
    this.doneCallback = doneCallback;
  }

  async cleanup() {
    await this?.subscription?.unsubscribe();
    this.pages.clear();
    this._taskQueue.clear();
    this.acceptPageUpdates = true;
  }
}
