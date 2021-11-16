import watcher from '@parcel/watcher';
import { init, parse } from 'es-module-lexer';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

import { debounce } from './helpers/debounce.js';

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

  async init(initDir) {
    this.subscription = await watcher.subscribe(initDir, async (err, events) => {
      if (this.acceptPageUpdates) {
        for (const event of events) {
          await this[event.type](event.path);
        }
      }
    });
  }

  async update(sourceFilePath) {
    for (const page of this.pages) {
      if (page.sourceFilePath === sourceFilePath || page.jsDependencies.includes(sourceFilePath)) {
        this.acceptPageUpdates = false;
        await this.callback(page);
        await this.updatePage(page.sourceFilePath);
        this.acceptPageUpdates = true;
      }
    }
  }

  async create(sourceFilePath) {
    if (sourceFilePath.endsWith('rocket.js')) {
      const page = await this.addPage(sourceFilePath);
      await this.callback(page);
    }
  }

  delete(sourceFilePath) {
    console.log(`delete ${sourceFilePath}`);
  }

  async updatePage(sourceFilePath) {
    const foundIndex = this.pages.findIndex(page => page.sourceFilePath === sourceFilePath);
    if (foundIndex !== -1) {
      this.pages[foundIndex].jsDependencies = await getJsDependencies(sourceFilePath);
    } else {
      throw new Error(`Page not found in watch index while trying to update: ${sourceFilePath}`);
    }
  }

  async addPage(sourceFilePath) {
    const page = {
      sourceFilePath,
      jsDependencies: await getJsDependencies(sourceFilePath),
    };
    this.pages.push(page);
    return page;
  }

  async addPages(sourceFilePaths) {
    for (const sourceFilePath of sourceFilePaths) {
      await this.addPage(sourceFilePath);
    }
  }

  async watchPages(callback) {
    this.callback = callback;
    // this._watchPagesController = new AbortController();

    // const deps = new Map();

    // let acceptPageUpdates = true;

    // for (const page of this.pages) {
    //   fs.watch(
    //     page.sourceFilePath,
    //     { signal: this._watchPagesController.signal },
    //     debounce(
    //       async () => {
    //         if (acceptPageUpdates) {
    //           acceptPageUpdates = false;
    //           await callback(page);
    //           acceptPageUpdates = false;
    //         }
    //       },
    //       25,
    //       true,
    //     ),
    //   );

    //   for (const jsDep of page.jsDependencies) {
    //     if (deps.has(jsDep)) {
    //       deps.get(jsDep).push(page);
    //     } else {
    //       deps.set(jsDep, [page]);
    //     }
    //   }
    // }

    // for (const [jsDep, pages] of deps) {
    //   fs.watch(
    //     jsDep,
    //     { signal: this._watchPagesController.signal },
    //     debounce(
    //       async () => {
    //         acceptPageUpdates = false;
    //         for (const page of pages) {
    //           await callback(page);
    //         }
    //         acceptPageUpdates = true;
    //       },
    //       25,
    //       true,
    //     ),
    //   );
    // }
  }

  async cleanup() {
    await this.subscription.unsubscribe();
    // if (this._watchPagesController) {
    //   this._watchPagesController.abort();
    // }
  }
}
