import chai from 'chai';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Formats', () => {
  it('markdown', async () => {
    const { build, readOutput, writeSource } = await setupTestEngine('fixtures/03-formats/md');
    await writeSource('empty.rocket.md', 'empty.rocket.md sourceRelativeFilePath: "${sourceRelativeFilePath}"');
    await build();

    expect(readOutput('empty/index.html')).to.equal(
      '<p>empty.rocket.md sourceRelativeFilePath: "empty.rocket.md"</p>',
    );
    expect(readOutput('index.html')).to.equal(
      '<p>index.rocket.md sourceRelativeFilePath: "index.rocket.md"</p>',
    );
  });

  // TODO: implement
  it.skip('html', async () => {
    const { build, readOutput, writeSource } = await setupTestEngine('fixtures/03-formats/md');
    await writeSource(
      'empty.rocket.html',
      'empty.rocket.html sourceRelativeFilePath: "${sourceRelativeFilePath}"',
    );
    await build();

    expect(readOutput('empty/index.html')).to.equal(
      '<p>empty.rocket.html sourceRelativeFilePath: "empty.rocket.html"</p>',
    );
    expect(readOutput('index.html')).to.equal(
      '<p>index.rocket.html sourceRelativeFilePath: "index.rocket.html"</p>',
    );
  });
});
