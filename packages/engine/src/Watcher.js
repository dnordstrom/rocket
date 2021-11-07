import { init, parse } from 'es-module-lexer';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

import { debounce } from './helpers/debounce.js';

await init;

// TODO: consider https://github.com/parcel-bundler/watcher

export class Watcher {
  pages = [];

  async addPage(filePath) {
    const sourceBuffer = await readFile(filePath, 'utf8');
    const [imports] = parse(sourceBuffer.toString());

    const jsDependencies = imports.map(importObj => {
      return path.join(path.dirname(filePath), importObj.n);
    });

    this.pages.push({
      filePath,
      jsDependencies,
    });
  }

  async addPages(filePaths) {
    for (const filePath of filePaths) {
      await this.addPage(filePath);
    }
  }

  async watchPages(callback) {
    this._watchPagesController = new AbortController();

    const deps = new Map();

    let acceptPageUpdates = true;

    for (const page of this.pages) {
      fs.watch(
        page.filePath,
        { signal: this._watchPagesController.signal },
        debounce(
          async () => {
            if (acceptPageUpdates) {
              acceptPageUpdates = false;
              await callback(page);
              acceptPageUpdates = false;
            }
          },
          25,
          true,
        ),
      );

      for (const jsDep of page.jsDependencies) {
        if (deps.has(jsDep)) {
          deps.get(jsDep).push(page);
        } else {
          deps.set(jsDep, [page]);
        }
      }
    }

    for (const [jsDep, pages] of deps) {
      fs.watch(
        jsDep,
        { signal: this._watchPagesController.signal },
        debounce(
          async () => {
            acceptPageUpdates = false;
            for (const page of pages) {
              await callback(page);
            }
            acceptPageUpdates = true;
          },
          25,
          true,
        ),
      );
    }
  }

  cleanup() {
    if (this._watchPagesController) {
      this._watchPagesController.abort();
    }
  }
}
