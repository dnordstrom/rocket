import { existsSync } from 'fs';
import path from 'path';

export function urlToSourceRelativeFilePath(url, rootDir) {
  const sourceFilePath = urlToSourceFilePath(url, rootDir);
  return path.relative(rootDir, sourceFilePath);
}

export function urlToSourceFilePath(url, rootDir) {
  if (url.endsWith('/')) {
    const potentialIndexFile = path.join(rootDir, url, 'index.rocket.js');
    if (existsSync(potentialIndexFile)) {
      return potentialIndexFile;
    } else {
      const potentialNamedFile = path.join(rootDir, `${url.slice(0, -1)}.rocket.js`);
      if (existsSync(potentialNamedFile)) {
        return potentialNamedFile;
      }
    }
  }
}


export function outputRelativeFilePathToSourceRelativeFilePath() {}

/**
 * @param {string} name
 * @returns {string}
 */
function cleanOrder(name) {
  let newName = name;
  const matches = name.match(/^[0-9]+--(.*)$/);
  if (matches && matches.length > 1 && matches[1]) {
    newName = matches[1];
  }

  return newName;
}

/**
 * @param {string} relPath
 * @returns {string}
 */
export function sourceRelativeFilePathToOutputRelativeFilePath(relPath) {
  const basename = path.basename(relPath);
  const rawDirname = path.dirname(relPath);

  const dirname = rawDirname
    .split('/')
    .map(part => cleanOrder(part))
    .join('/');

  let name = basename;
  for (const ending of ['.rocket.js', '.rocket.md', '.rocket.html']) {
    name = name.endsWith(ending) ? name.substring(0, name.length - ending.length) : name;
  }

  name = cleanOrder(name);

  if (relPath.endsWith('.js') && name.includes('.')) {
    return path.join(dirname, name);
  }

  return name === 'index'
    ? path.join(dirname, 'index.html')
    : path.join(dirname, name, 'index.html');
}

/**
 *
 * @param {string} sourceRelativeFilePath
 * @returns
 */
export function sourceRelativeFilePathToUrl(sourceRelativeFilePath) {
  const outputRelativeFilePath = sourceRelativeFilePathToOutputRelativeFilePath(
    sourceRelativeFilePath,
  );

  return outputRelativeFilePath.endsWith('index.html')
    ? `/${outputRelativeFilePath.substring(0, outputRelativeFilePath.length - 'index.html'.length)}`
    : `/${outputRelativeFilePath}`;
}
