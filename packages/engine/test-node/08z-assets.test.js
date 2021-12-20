import chai from 'chai';
import fetch from 'node-fetch';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Assets', () => {
  it('image in index file', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine(
      'fixtures/08-assets/01-image-in-index/docs',
    );
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(`<img src="../docs/test.png" alt="test" />`);
    expect(await index.text()).to.equal(
      `<img src="/__wds-outside-root__/1/docs/test.png" alt="test" />`,
    );

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(`<img src="../../docs/test.png" alt="test" />`);
    expect(await about.text()).to.equal(
      `<img src="/__wds-outside-root__/1/docs/test.png" alt="test" />`,
    );

    await cleanup();
  });

  it('image in named file', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine(
      'fixtures/08-assets/02-image-named-file/docs',
    );
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(`<img src="../docs/test.png" alt="index" />`);
    expect(await index.text()).to.equal(
      `<img src="/__wds-outside-root__/1/docs/test.png" alt="index" />`,
    );

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(
      `<img src="../../docs/test.png" alt="about" />`,
    );
    expect(await about.text()).to.equal(
      `<img src="/__wds-outside-root__/1/docs/test.png" alt="about" />`,
    );

    const components = await fetch('http://localhost:8000/components/');
    expect(readOutput('components/index.html')).to.equal(
      `<img src="../../docs/test.png" alt="components" />`,
    );
    expect(await components.text()).to.equal(
      `<img src="/__wds-outside-root__/1/docs/test.png" alt="components" />`,
    );

    const tabs = await fetch('http://localhost:8000/components/tabs/');
    expect(readOutput('components/tabs/index.html')).to.equal(
      `<img src="../../../docs/test.png" alt="tabs" />`,
    );
    expect(await tabs.text()).to.equal(
      `<img src="/__wds-outside-root__/1/docs/test.png" alt="tabs" />`,
    );

    await cleanup();
  });

  it('supports multiple images', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine(
      'fixtures/08-assets/03-multiple-images/docs',
    );
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(
      `<img src="../docs/test.png" alt="index" /><img src="../docs/test.png" alt="index" />`,
    );
    expect(await index.text()).to.equal(
      `<img src="/__wds-outside-root__/1/docs/test.png" alt="index" /><img src="/__wds-outside-root__/1/docs/test.png" alt="index" />`,
    );

    await cleanup();
  });

  it('<link href="./style.css" />', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine(
      'fixtures/08-assets/04-link-href/docs',
    );
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(`<link rel="stylesheet" href="../docs/style.css" />`);
    expect(await index.text()).to.equal(
      `<link rel="stylesheet" href="/__wds-outside-root__/1/docs/style.css" />`,
    );

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(
      `<link rel="stylesheet" href="../../docs/style.css" />`,
    );
    expect(await about.text()).to.equal(
      `<link rel="stylesheet" href="/__wds-outside-root__/1/docs/style.css" />`,
    );

    await cleanup();
  });

  it('<a href="./about.rocket.js" />', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine(
      'fixtures/08-assets/05-a-href/docs',
    );
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(`Index: <a href="/about/">to about</a>`);
    expect(await index.text()).to.equal(`Index: <a href="/about/">to about</a>`);

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(`About: <a href="/">to index</a>`);
    expect(await about.text()).to.equal(`About: <a href="/">to index</a>`);

    await cleanup();
  });

  it('<img src="resolve:asset-example/test-img" />', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine(
      'fixtures/08-assets/06-node-resolve-local/docs',
    );
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(`<img src="../test.png" alt="test" />`);
    expect(await index.text()).to.equal(
      `<img src="/__wds-outside-root__/1/test.png" alt="test" />`,
    );

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(`<img src="../../test.png" alt="test" />`);
    expect(await about.text()).to.equal(
      `<img src="/__wds-outside-root__/1/test.png" alt="test" />`,
    );

    await cleanup();
  });

  it('<img src="resolve:some-dependency/assets/test.png" />', async () => {
    const { readOutput, engine, cleanup } = await setupTestEngine(
      'fixtures/08-assets/07-node-resolve-dependency/docs',
    );
    await engine.start();

    const index = await fetch('http://localhost:8000');
    expect(readOutput('index.html')).to.equal(
      `<img src="../node_modules/some-dependency/assets/test.png" alt="test" />`,
    );
    expect(await index.text()).to.equal(
      `<img src="/__wds-outside-root__/1/node_modules/some-dependency/assets/test.png" alt="test" />`,
    );

    const about = await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal(
      `<img src="../../node_modules/some-dependency/assets/test.png" alt="test" />`,
    );
    expect(await about.text()).to.equal(
      `<img src="/__wds-outside-root__/1/node_modules/some-dependency/assets/test.png" alt="test" />`,
    );

    await cleanup();
  });

  it('copies files from the __public folder', async () => {
    const { build, outputExists } = await setupTestEngine(
      'fixtures/08-assets/08-copies-public-files/docs',
    );
    await build();

    expect(outputExists('added-via-input-folder.txt')).to.be.true;
    expect(outputExists('some-folder/add-nested-via-input-folder.txt')).to.be.true;
  });
});
