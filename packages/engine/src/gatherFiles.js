import { readdir } from 'fs/promises';
import path from 'path';
import { slugify } from './slugify.js';

/**
 * @typedef {object} gatherFilesOptions
 * @property {string[]} fileEndings
 **/

/**
 * @param {string} inRootDir
 * @param {Partial<gatherFilesOptions>} [options]
 * @returns
 */
export async function gatherFiles(inRootDir, options = {}) {
  /** @type {gatherFilesOptions} */
  const activeOptions = {
    fileEndings: ['.rocket.js', '.rocket.md', '.rocket.html'],
    ...options,
  };

  const rootDir = path.resolve(inRootDir);
  let files = [];

  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const { name } = entry;
    const currentPath = path.join(rootDir, name);
    const { fileEndings } = activeOptions;

    if (entry.isDirectory()) {
      // if (slugify(name) !== name.replace(/\./g, '')) {
      //   throw new Error(
      //     `Folder at "${currentPath}"" is using invalid characters. Use only url safe characters like [a-z][A-Z]-_. Name Suggestion: ${slugify(name)}`,
      //   );
      // }
      files = [...files, ...(await gatherFiles(currentPath, options))];
    } else if (fileEndings.some(ending => name.endsWith(ending))) {
      // if (slugify(name) !== name.replace(/\./g, '')) {
      //   throw new Error(
      //     `File at "${currentPath}" is using invalid characters. Use only url safe characters like [a-z][A-Z]-_`,
      //   );
      // }
      const filePath = path.join(rootDir, name);
      files.push(filePath);
    }
  }
  return files;
}
