import chai from 'chai';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Formats', () => {
  it('markdown', async () => {
    const { execute, readOutput, writeSource } = setupTestEngine('fixtures/03-formats/md');
    await writeSource('empty.rocket.md', 'empty.rocket.md relativeFilePath: "${relativeFilePath}"');
    await execute();

    expect(readOutput('empty/index.html')).to.equal(
      '<p>empty.rocket.md relativeFilePath: "empty.rocket.md"</p>',
    );
    expect(readOutput('existing/index.html')).to.equal(
      '<p>existing.rocket.md relativeFilePath: "existing.rocket.md"</p>',
    );
  });

  // TODO: implement
  it.skip('html', async () => {
    const { execute, readOutput, writeSource } = setupTestEngine('fixtures/03-formats/md');
    await writeSource(
      'empty.rocket.html',
      'empty.rocket.html relativeFilePath: "${relativeFilePath}"',
    );
    await execute();

    expect(readOutput('empty/index.html')).to.equal(
      '<p>empty.rocket.html relativeFilePath: "empty.rocket.html"</p>',
    );
    expect(readOutput('existing/index.html')).to.equal(
      '<p>existing.rocket.html relativeFilePath: "existing.rocket.html"</p>',
    );
  });
});
