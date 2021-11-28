import fs from 'fs';
import path from 'path';
import saxWasm from 'sax-wasm';
import { createRequire } from 'module';
import { getAttribute, getText } from './helpers/sax-helpers.js';

/** @typedef {import('sax-wasm').Text} Text */
/** @typedef {import('sax-wasm').Tag} Tag */
/** @typedef {import('sax-wasm').Position} Position */
/** @typedef {import('../types/main').ParseMetaData} ParseMetaData */

const require = createRequire(import.meta.url);
const { SaxEventType, SAXParser } = saxWasm;

const streamOptions = { highWaterMark: 256 * 1024 };

const saxPath = require.resolve('sax-wasm/lib/sax-wasm.wasm');
const saxWasmBuffer = fs.readFileSync(saxPath);
const parser = new SAXParser(SaxEventType.CloseTag | SaxEventType.Comment, streamOptions);

await parser.prepareWasm(saxWasmBuffer);

/**
 * @param {Tag} data
 * @returns {boolean}
 */
function isHeadline(data) {
  return data.name
    ? data.name[0] === 'h' && ['1', '2', '3', '4', '5', '6'].includes(data.name[1])
    : false;
}

/**
 *
 * @param {string} htmlFilePath
 * @returns
 */
export function getHtmlMetaData(htmlFilePath) {
  const fileName = path.basename(htmlFilePath);

  /** @type {ParseMetaData} */
  const metaData = {
    // headlinesWithId: [],
  };

  parser.eventHandler = (ev, _data) => {
    if (ev === SaxEventType.CloseTag) {
      const data = /** @type {Tag} */ (/** @type {any} */ (_data));
      if (data.name === 'meta') {
        const metaName = getAttribute(data, 'name');
        if (metaName === 'menu:link.text') {
          metaData.menuLinkText = getAttribute(data, 'content');
        }
        if (metaName === 'menu:page.releaseDateTime') {
          const dtString = getAttribute(data, 'content');
          if (dtString) {
            const date = new Date(dtString);
            const year = date.getFullYear();
            const month = date.getMonth().toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0'); // getDay === week of the day
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            metaData.order = parseInt(`-${year}${month}${day}${hours}${minutes}`);
            metaData.releaseDateTime = dtString;
          }
        }
        if (metaName === 'menu:page.subHeading') {
          metaData.subHeading = getAttribute(data, 'content');
        }
        if (metaName === 'menu:order') {
          metaData.menuOrder = parseInt(getAttribute(data, 'content') || '0');
        }
        if (metaName === 'menu:exclude') {
          metaData.menuExclude = getAttribute(data, 'content') !== 'false';
        }
      }
      if (!metaData.title && data.name === 'title') {
        metaData.title = getText(data);
      }
      if (!metaData.h1 && data.name === 'h1') {
        metaData.h1 = getText(data);
      }

      if (isHeadline(data)) {
        const id = getAttribute(data, 'id');
        const text = getText(data);
        if (id && text) {
          if (!metaData.headlinesWithId) {
            metaData.headlinesWithId = [];
          }
          metaData.headlinesWithId.push({
            text,
            id,
            level: parseInt(data.name[1], 10),
          });
        }
      }
    }
  };

  return new Promise(resolve => {
    /** @type {Array<Buffer>} */
    const chunks = [];
    const readable = fs.createReadStream(htmlFilePath, streamOptions);
    readable.on('data', chunk => {
      parser.write(/** @type {Buffer} */ (chunk));
      chunks.push(Buffer.from(chunk));
    });
    readable.on('end', () => {
      parser.end();
      metaData.menuLinkText = metaData.menuLinkText || metaData.h1 || metaData.title || fileName;

      resolve(metaData);
    });
  });
}
