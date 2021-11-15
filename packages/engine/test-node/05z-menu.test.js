import chai from 'chai';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Engine menus', () => {
  it('can add a static menu', async () => {
    const { cleanup, readOutput, engine } = setupTestEngine('fixtures/05-menu/01-two-pages/docs');

    await engine.run();

    expect(readOutput('index.html', { format: 'html' })).to.equal(
      [
        '<nav aria-label="site">',
        '  <a href="/about/">About</a>',
        '  <a href="/components/">Components</a>',
        '</nav>',
        '',
        '<main><h1>Home</h1></main>',
        '',
      ].join('\n'),
    );

    expect(readOutput('about/index.html', { format: 'html' })).to.equal(
      [
        '<nav aria-label="site">',
        '  <a href="/about/" aria-current="page">About</a>',
        '  <a href="/components/">Components</a>',
        '</nav>',
        '',
        '<main><h1>About</h1></main>',
        '',
      ].join('\n'),
    );

    await cleanup();
  });

  it('will create a complete new pageTreeData file when using build', async () => {
    const { cleanup, writeSource, engine, readSource, readOutput } = setupTestEngine(
      'fixtures/05-menu/02-generate-page-tree/docs',
    );

    const startTreeData = {
      menuLinkText: 'existing Home',
      h1: 'This is existing Home',
      name: 'This is existing Home',
      url: '/',
      outputRelativeFilePath: 'index.html',
      sourceRelativeFilePath: 'index.rocket.js',
      level: 0,
      children: [],
    };
    // this simulates a pre existing file
    await writeSource('pageTreeData.rocketGenerated.json', JSON.stringify(startTreeData, null, 2));

    await engine.run(); // TODO: rename to build

    expect(JSON.parse(readSource('pageTreeData.rocketGenerated.json'))).to.deep.equal({
      menuLinkText: 'Home',
      h1: 'This is Home',
      url: '/',
      outputRelativeFilePath: 'index.html',
      sourceRelativeFilePath: 'index.rocket.js',
      level: 0,
      children: [
        {
          menuLinkText: 'About',
          h1: 'This is About',
          url: '/about/',
          outputRelativeFilePath: 'about/index.html',
          sourceRelativeFilePath: 'about.rocket.js',
          level: 1,
        },
        {
          menuLinkText: 'Components',
          h1: 'This is Components',
          url: '/components/',
          outputRelativeFilePath: 'components/index.html',
          sourceRelativeFilePath: 'components.rocket.js',
          level: 1,
        },
      ],
    });

    expect(readOutput('index.html', { format: 'html' })).to.equal(
      [
        '<nav aria-label="site">',
        '  <a href="/about/">About</a>',
        '  <a href="/components/">Components</a>',
        '</nav>',
        '',
        '<main>',
        '  <meta name="menu:link.text" content="Home" />',
        '  <h1>This is Home</h1>',
        '</main>',
        '',
      ].join('\n'),
    );

    await cleanup();
  });
});
