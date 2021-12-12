import chai from 'chai';
import fetch from 'node-fetch';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe.only('Assets', () => {
  it('image in index file', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine('fixtures/08-assets/01-image-in-index/docs');
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(`<img src="../docs/test.png" alt="test" />`);
    expect(await index.text()).to.equal(`<img src="/__wds-outside-root__/1/docs/test.png" alt="test" />`);

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(`<img src="../../docs/test.png" alt="test" />`);
    expect(await about.text()).to.equal(`<img src="/__wds-outside-root__/1/docs/test.png" alt="test" />`);

    await cleanup();
  });

  it('image in named file', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine('fixtures/08-assets/02-image-named-file/docs');
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(`<img src="../docs/test.png" alt="index" />`);
    expect(await index.text()).to.equal(`<img src="/__wds-outside-root__/1/docs/test.png" alt="index" />`);

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(`<img src="../../docs/test.png" alt="about" />`);
    expect(await about.text()).to.equal(`<img src="/__wds-outside-root__/1/docs/test.png" alt="about" />`);

    const components = await fetch('http://localhost:8000/components/');
    expect(readOutput('components/index.html')).to.equal(`<img src="../../docs/test.png" alt="components" />`);
    expect(await components.text()).to.equal(`<img src="/__wds-outside-root__/1/docs/test.png" alt="components" />`);

    const tabs = await fetch('http://localhost:8000/components/tabs/');
    expect(readOutput('components/tabs/index.html')).to.equal(`<img src="../../../docs/test.png" alt="tabs" />`);
    expect(await tabs.text()).to.equal(`<img src="/__wds-outside-root__/1/docs/test.png" alt="tabs" />`);

    await cleanup();
  });
});
