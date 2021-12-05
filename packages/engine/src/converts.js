import { readFile, writeFile } from 'fs/promises';
import { mdToJsWithMd } from './mdToJsWithMd.js';

/**
 * @param {string} filePath
 */
export async function convertMdFile(filePath) {
  const mdContent = await readFile(filePath);
  const jsWithMd = mdToJsWithMd(mdContent.toString());
  const toImportFilePath = mdFilePathToJsFilePath(filePath);
  await writeFile(toImportFilePath, jsWithMd);
  return toImportFilePath;
}

/**
 * @param {string} filePath
 * @returns {string}
 */
export function mdFilePathToJsFilePath(filePath) {
  return filePath.replace(/\.rocket\.md$/, '.rocketGeneratedFromMd.js');
}
