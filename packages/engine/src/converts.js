import { readFile, writeFile } from 'fs/promises';
import { mdToJsWithMd } from './mdToJsWithMd.js';

/**
 * @param {string} filePath
 */
export async function convertMdFile(filePath) {
  const mdContent = await readFile(filePath);
  const jsWithMd = mdToJsWithMd(mdContent.toString());
  const toImportFilePath = filePath.replace(/\.md$/, '.rocket-generated-from-md.js');
  await writeFile(toImportFilePath, jsWithMd);
  return toImportFilePath;
}
