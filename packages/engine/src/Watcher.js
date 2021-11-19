import watcher from '@parcel/watcher';
import { init, parse } from 'es-module-lexer';
import { readFile } from 'fs/promises';
import path from 'path';

await init;

async function getJsDependencies(sourceFilePath) {
  const sourceBuffer = await readFile(sourceFilePath, 'utf8');
  const [imports] = parse(sourceBuffer.toString());

  const jsDependencies = imports.map(importObj => {
    return path.join(path.dirname(sourceFilePath), importObj.n);
  });
  return jsDependencies;
}

// TODO: consider https://github.com/parcel-bundler/watcher

export class Watcher {
  pages = [];

  acceptPageUpdates = true;

  _taskQueue = new Map();

  async init(initDir) {
    this.subscription = await watcher.subscribe(initDir, async (err, events) => {
      if (this.acceptPageUpdates) {
        for (const event of events) {
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
        await this.executeTaskQueue();
      } else {
        for (const event of events) {
          if (!this._taskQueue.has(event.path)) {
            console.log(
              `You saved ${event.path} while Rocket was busy building. Automatic rebuilding is not yet implemented please save again.`,
            );
          }
        }
      }
    });
  }

  async addUpdateTask(sourceFilePath) {
    for (const page of this.pages) {
      if (page.sourceFilePath === sourceFilePath || page.jsDependencies.includes(sourceFilePath)) {
        this._taskQueue.set(page.sourceFilePath, { type: 'update' });
      }
    }
  }

  async addCreateTask(sourceFilePath) {
    if (sourceFilePath.endsWith('rocket.js')) {
      this._taskQueue.set(sourceFilePath, { type: 'create' });
    }
  }

  async addDeleteTask(sourceFilePath) {
    console.log(`delete ${sourceFilePath}`);
  }

  async executeTaskQueue() {
    this.acceptPageUpdates = false;
    for (const [sourceFilePath, info] of this._taskQueue) {
      await this.callback({ sourceFilePath });
      if (info.type === 'create') {
        await this.createPage(sourceFilePath);
      }
      if (info.type === 'update') {
        await this.updatePage(sourceFilePath);
      }
    }
    this.allDoneCallback();
    this._taskQueue.clear();
    this.acceptPageUpdates = true;
  }

  async updatePage(sourceFilePath) {
    const foundIndex = this.pages.findIndex(page => page.sourceFilePath === sourceFilePath);
    if (foundIndex !== -1) {
      this.pages[foundIndex].jsDependencies = await getJsDependencies(sourceFilePath);
    } else {
      throw new Error(`Page not found in watch index while trying to update: ${sourceFilePath}`);
    }
  }

  async createPage(sourceFilePath) {
    const page = {
      sourceFilePath,
      jsDependencies: await getJsDependencies(sourceFilePath),
    };
    this.pages.push(page);
    return page;
  }

  async deletePage(sourceFilePath) {
    console.log('TO IMPLEMENT');
  }

  async addPages(sourceFilePaths) {
    for (const sourceFilePath of sourceFilePaths) {
      await this.createPage(sourceFilePath);
    }
  }

  async watchPages(callback, allDoneCallback) {
    this.callback = callback;
    this.allDoneCallback = allDoneCallback;
  }

  async cleanup() {
    await this.subscription.unsubscribe();
  }
}
