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
        '  <a href="about/index.html">About</a>',
        '  <a href="components/index.html">Components</a>',
        '</nav>',
        '',
        '<main><p>Home</p></main>',
        '',
      ].join('\n'),
    );

    expect(readOutput('about/index.html', { format: 'html' })).to.equal(
      [
        '<nav aria-label="site">',
        '  <a href="about/index.html">About</a>',
        '  <a href="components/index.html">Components</a>',
        '</nav>',
        '',
        '<main><p>About</p></main>',
        '',
      ].join('\n'),
    );

    await cleanup();
  });

  it.only('can generate a pageTree.rocketGenerated.js file', async () => {
    const { cleanup, readOutput, engine, readSource } = setupTestEngine(
      'fixtures/05-menu/02-generate-page-tree/docs',
    );

    await engine.run();

    expect(readSource('pageTreeData.rocketGenerated.json')).to.equal(
      JSON.stringify(
        {
          level: 0,
          h1: 'This is Home',
          menuLinkText: 'Home',
          url: '/',
          outputRelativeFilePath: 'index.html',
          sourceRelativeFilePath: 'index.rocket.js',
          children: [
            {
              h1: 'This is About',
              menuLinkText: 'About',
              url: '/about/',
              level: 1,
              outputRelativeFilePath: 'about/index.html',
              sourceRelativeFilePath: 'about.rocket.js',
            },
            {
              h1: 'This is Components',
              menuLinkText: 'Components',
              url: '/components/',
              level: 1,
              outputRelativeFilePath: 'components/index.html',
              sourceRelativeFilePath: 'components.rocket.js',
            },
          ],
        },
        null,
        2,
      ),
    );

    await cleanup();
  });
});
