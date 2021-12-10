import emoji from 'remark-emoji';
import { addPlugin } from 'plugins-manager';
import markdown from 'remark-parse';

import chai from 'chai';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Unified', () => {
  it.skip('can add a plugin', async () => {
    const { build, engine, readOutput } = await setupTestEngine(
      'fixtures/07-unified/01-add-plugin/docs',
    );
    engine.setOptions({
      setupUnifiedPlugins: [addPlugin(emoji, {}, { location: markdown })],
    })
    await build();

    expect(readOutput('index.html')).to.equal(`<p>See a 🐶</p>`);
  });
});
