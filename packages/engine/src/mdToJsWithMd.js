/**
 * @param {string} str
 * @returns {string}
 */
function escapeBackTick(str) {
  let isMd = true;
  let newStr = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '$' && str[i + 1] === '{') {
      isMd = false;
    }
    if (isMd && char === '}') {
      isMd = true;
    }
    newStr += isMd && char === '`' ? '\\`' : char;
  }
  return newStr;
}

/**
 * @param {string} mdString
 * @returns {string}
 */
export function mdToJsWithMd(mdString) {
  const lines = mdString.split('\n');
  let inServerBlock = false;
  let inServerMarkdownBlock = false;
  let shouldProcess = true;
  let needsMdImport = true;

  const processedLines = [];
  for (const line of lines) {
    let addLine = true;
    if (line.trim() === '`````') {
      shouldProcess = !shouldProcess;
    }

    if (shouldProcess) {
      if (line.trim() === '```js server') {
        inServerBlock = true;
        addLine = false;
      }

      if (line.trim() === '```js server-markdown') {
        inServerMarkdownBlock = true;
        addLine = false;
      }

      if (inServerBlock && line.trim() === '```') {
        inServerBlock = false;
        addLine = false;
      }
      if (inServerMarkdownBlock && line.trim() === '```') {
        inServerMarkdownBlock = false;
        addLine = false;
      }

      if (addLine) {
        if (inServerBlock) {
          processedLines.push(line);
        } else {
          processedLines.push(`rocketAutoConvertedMdText += md\`${escapeBackTick(line)}\`;`);
        }
      }
    } else {
      processedLines.push(`rocketAutoConvertedMdText += md\`${escapeBackTick(line)}\`;`);
    }

    if (line.match(/import\s*{(\n|.)*md(\n|.)*}.*@rocket\/engine/gm)) {
      needsMdImport = false;
    }
  }

  const mdImport = needsMdImport ? [`import { md } from '@rocket/engine';`] : [];
  const wrappedLines = [
    ...mdImport,
    `let rocketAutoConvertedMdText = '';`,
    ...processedLines,
    `export default rocketAutoConvertedMdText;`,
  ];

  return wrappedLines.join('\n');
}
