import chai from 'chai';
import { mdToJsWithMd } from '../src/mdToJsWithMd.js';

const { expect } = chai;

describe('mdToJsWithMd', () => {
  it('wraps simple text', async () => {
    expect(mdToJsWithMd('Hello')).to.equal(
      [
        `import { md } from '@rocket/engine';`,
        `let rocketAutoConvertedMdText = '';`,
        'rocketAutoConvertedMdText += md`Hello`;',
        `export default rocketAutoConvertedMdText;`,
      ].join('\n'),
    );
  });

  it('removes the js server code block wrapper', async () => {
    const result = mdToJsWithMd(
      [
        //
        '```js server',
        'let a = 1;',
        '```',
      ].join('\n'),
    );
    expect(result).to.equal(
      [
        `import { md } from '@rocket/engine';`,
        `let rocketAutoConvertedMdText = '';`,
        'let a = 1;',
        `export default rocketAutoConvertedMdText;`,
      ].join('\n'),
    );
  });

  it('removes multiple js server code block wrappers', async () => {
    const result = mdToJsWithMd(
      [
        //
        '```js server',
        'let a = 1;',
        '```',
        'some text',
        '   ```js server',
        '   let b = 1;',
        '   ```',
      ].join('\n'),
    );
    expect(result).to.equal(
      [
        `import { md } from '@rocket/engine';`,
        `let rocketAutoConvertedMdText = '';`,
        'let a = 1;',
        'rocketAutoConvertedMdText += md`some text`;',
        '   let b = 1;',
        `export default rocketAutoConvertedMdText;`,
      ].join('\n'),
    );
  });

  it('removes js server-markdown code block wrappers but keep it as markdown text', async () => {
    const result = mdToJsWithMd(
      [
        //
        'some text',
        '```js server-markdown',
        '${members.map(member => `- ${member}\\n`)}',
        '```',
      ].join('\n'),
    );
    expect(result).to.equal(
      [
        `import { md } from '@rocket/engine';`,
        `let rocketAutoConvertedMdText = '';`,
        'rocketAutoConvertedMdText += md`some text`;',
        'rocketAutoConvertedMdText += md`${members.map(member => `- ${member}\\n`)}`;',
        `export default rocketAutoConvertedMdText;`,
      ].join('\n'),
    );
  });

  it('will not remove the js code block wrappers if inside a "bigger" code fence block', async () => {
    const result = mdToJsWithMd(
      [
        //
        'You can write it like this:',
        '`````',
        '```js server',
        'let a = 1;',
        '```',
        '`````',
      ].join('\n'),
    );
    expect(result).to.equal(
      [
        `import { md } from '@rocket/engine';`,
        `let rocketAutoConvertedMdText = '';`,
        'rocketAutoConvertedMdText += md`You can write it like this:`;',
        'rocketAutoConvertedMdText += md`\\`\\`\\`\\`\\``;',
        'rocketAutoConvertedMdText += md`\\`\\`\\`js server`;',
        'rocketAutoConvertedMdText += md`let a = 1;`;',
        'rocketAutoConvertedMdText += md`\\`\\`\\``;',
        'rocketAutoConvertedMdText += md`\\`\\`\\`\\`\\``;',
        `export default rocketAutoConvertedMdText;`,
      ].join('\n'),
    );
  });
});
