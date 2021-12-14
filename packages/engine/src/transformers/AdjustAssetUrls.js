import path from 'path';
import saxWasm from 'sax-wasm';
import { createRequire } from 'module';
import { readFile } from 'fs/promises';
import { getAttributeMeta, replaceBetween } from '../helpers/sax-helpers.js';
import { isRocketPageFile } from '../helpers/isRocketPageFile.js';
import { sourceRelativeFilePathToUrl } from '../urlPathConverter.js';
import { isRocketIndexFile } from '../helpers/isRocketIndexFile.js';
import { stripRocketSuffix } from '../helpers/stripRocketSuffix.js';

/** @typedef {import('sax-wasm').Text} Text */
/** @typedef {import('sax-wasm').Tag} Tag */
/** @typedef {import('sax-wasm').Position} Position */

const { SaxEventType, SAXParser } = saxWasm;

const require = createRequire(import.meta.url);

const streamOptions = { highWaterMark: 256 * 1024 };
const saxPath = require.resolve('sax-wasm/lib/sax-wasm.wasm');
const saxWasmBuffer = await readFile(saxPath);
const parser = new SAXParser(SaxEventType.CloseTag, streamOptions);

parser.prepareWasm(saxWasmBuffer);

/**
 * @param {object} options
 * @param {string} options.url
 * @param {string} options.sourceFilePath
 * @param {string} options.sourceRelativeFilePath
 * @param {string} options.outputFilePath
 * @returns
 */
async function defaultAdjustAssetUrl({
  url,
  sourceFilePath,
  sourceRelativeFilePath,
  outputFilePath,
}) {
  if (isRocketPageFile(url)) {
    const dir = isRocketIndexFile(url)
      ? path.dirname(sourceRelativeFilePath)
      : stripRocketSuffix(sourceRelativeFilePath);
    return sourceRelativeFilePathToUrl(path.join(dir, url));
  }
  if (url.startsWith('./') || url.startsWith('../')) {
    return path.relative(
      path.dirname(outputFilePath),
      path.join(path.dirname(sourceFilePath), url),
    );
  }
  if (url.startsWith('resolve:')) {
    const bareImport = url.substring(8);
    const requireOfSource = createRequire(sourceFilePath);
    const resolvedPath = requireOfSource.resolve(bareImport);
    const rel = path.relative(
      path.dirname(outputFilePath),
      resolvedPath
    );
    return rel;
  }
  return url;
}

export class AdjustAssetUrls {
  constructor({
    assetElements = [
      { tagName: 'img', attribute: 'src' },
      { tagName: 'img', attribute: 'srcset' },
      { tagName: 'source', attribute: 'srcset' },
      { tagName: 'a', attribute: 'href' },
      { tagName: 'link', attribute: 'href' },
      { tagName: 'script', attribute: 'src' },
    ],
    adjustAssetUrl = defaultAdjustAssetUrl,
  } = {}) {
    this.assetElements = assetElements;
    this.adjustAssetUrl = adjustAssetUrl;
  }

  /**
   * @param {string} source
   * @param {object} options
   * @param {string} options.url
   * @param {string} options.sourceFilePath
   * @param {string} options.sourceRelativeFilePath
   * @param {string} options.outputFilePath
   * @param {string} options.outputRelativeFilePath
   * @returns {Promise<string>}
   */
  async transform(
    source,
    { sourceFilePath, sourceRelativeFilePath, outputFilePath, outputRelativeFilePath },
  ) {
    let output = source;
    if (outputFilePath.endsWith('.html')) {
      const assetUrls = [];

      parser.eventHandler = (ev, _data) => {
        if (ev === SaxEventType.CloseTag) {
          const data = /** @type {Tag} */ (/** @type {any} */ (_data));
          const searchTags = this.assetElements.map(({ tagName }) => tagName);
          if (searchTags.includes(data.name)) {
            const possibleAttributes = this.assetElements
              .map(({ attribute, tagName }) => (tagName === data.name ? attribute : undefined))
              .filter(Boolean);
            for (const possibleAttributeName of possibleAttributes) {
              const attribute = getAttributeMeta(data, possibleAttributeName);
              if (attribute) {
                const { value, start, end } = attribute;
                assetUrls.push({
                  start,
                  end,
                  url: value,
                  attribute: possibleAttributeName,
                  tag: data.name,
                  sourceFilePath,
                  outputFilePath,
                  sourceRelativeFilePath,
                  outputRelativeFilePath,
                });
              }
            }
          }
        }
      };
      parser.write(Buffer.from(source));
      parser.end();

      for (const adjustment of assetUrls.reverse()) {
        const { sourceFilePath, outputFilePath, start, end, url } = adjustment;
        const adjustedUrl = await this.adjustAssetUrl({
          url,
          sourceFilePath,
          outputFilePath,
          sourceRelativeFilePath,
        });
        if (adjustedUrl !== url) {
          output = replaceBetween({
            content: output,
            start: start,
            end: end,
            replacement: adjustedUrl,
          });
        }
      }
    }
    return output;
  }
}
