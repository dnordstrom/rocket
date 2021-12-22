import chai from 'chai';
import fetch from 'node-fetch';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Engine start', () => {
  it('updates rocket header on a *.rocket.js file change', async () => {
    const {
      writeSource,
      cleanup,
      readSource,
      engine,
      anEngineEvent,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/01-update-header/docs');
    await writeSource('index.rocket.js', "export default 'index';");
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(readSource('index.rocket.js')).to.equal("export default 'index';");

    await engine.start();
    setAsOpenedInBrowser('index.rocket.js');
    await writeSource('index.rocket.js', "export default 'updated index';");
    await anEngineEvent('rocketUpdated');

    expect(readSource('index.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        '/* END - Rocket auto generated - do not touch */',
        '',
        "export default 'updated index';",
      ].join('\n'),
    );

    await cleanup();
  });

  it('updates rocket header on a *.rocket.md file change', async () => {
    const {
      writeSource,
      cleanup,
      readSource,
      engine,
      anEngineEvent,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/01b-update-header-md/docs');
    await writeSource('index.rocket.md', 'index');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(readSource('index.rocket.md')).to.equal('index');

    await engine.start();
    setAsOpenedInBrowser('index.rocket.md');
    await writeSource('index.rocket.md', 'updated index');
    await anEngineEvent('rocketUpdated');

    expect(readSource('index.rocket.md')).to.equal(
      [
        '```js server',
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'index.rocket.md';",
        '/* END - Rocket auto generated - do not touch */',
        '```',
        '',
        'updated index',
      ].join('\n'),
    );

    await cleanup();
  });

  it('if started updates the header on a dependency file change', async () => {
    const {
      writeSource,
      cleanup,
      readSource,
      engine,
      anEngineEvent,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/02-update-header-on-dependency-change/docs');
    await writeSource(
      'index.rocket.js',
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { some } from './thisDir.rocketData.js';",
        'export { some }',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `index`;',
      ].join('\n'),
    );
    await writeSource(
      'about.rocket.js',
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { some } from './thisDir.rocketData.js';",
        'export { some }',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `about`;',
      ].join('\n'),
    );
    await writeSource('thisDir.rocketData.js', 'export const some = "data";');

    await engine.start();
    setAsOpenedInBrowser('index.rocket.js');
    setAsOpenedInBrowser('about.rocket.js');
    await writeSource(
      'thisDir.rocketData.js',
      ["export const some = 'data';", "export const more = 'stuff';"].join('\n'),
    );
    await anEngineEvent('rocketUpdated');

    expect(readSource('index.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { some, more } from './thisDir.rocketData.js';",
        'export { some, more };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `index`;',
      ].join('\n'),
    );
    expect(readSource('about.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'about.rocket.js';",
        "import { some, more } from './thisDir.rocketData.js';",
        'export { some, more };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `about`;',
      ].join('\n'),
    );

    await cleanup();
  });

  it('renders only pages that are fetched or that are opened in browser', async () => {
    const {
      readOutput,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
      outputExists,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/03-update-single-page/docs');
    // reset state
    await writeSource('index.rocket.js', "export default 'index';");

    await engine.start();
    // nothing is written so far
    expect(outputExists('index.html')).to.be.false;
    expect(outputExists('about/index.html')).to.be.false;

    // fetching it results in the file being written
    await fetch('http://localhost:8000/');
    expect(readOutput('index.html')).to.equal('<my-layout>index</my-layout>');

    // a file open in browser will rerender
    setAsOpenedInBrowser('index.rocket.js');
    await writeSource('index.rocket.js', "export default 'updated index';");
    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.equal('<my-layout>updated index</my-layout>');

    // about page is still not there
    expect(outputExists('about/index.html')).to.be.false;
    // lets make it
    await fetch('http://localhost:8000/about/');
    expect(readOutput('about/index.html')).to.equal('<my-layout>about</my-layout>');

    await cleanup();
  });

  it('04: rerenders on a js dependency change', async () => {
    const {
      build,
      readOutput,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/04-update-js-dependency/docs');

    await writeSource('name.js', "export const name = 'initial name';");
    await build();
    expect(readOutput('index.html')).to.equal('name: "initial name"');

    await engine.start();
    setAsOpenedInBrowser('index.rocket.js');
    await writeSource('name.js', "export const name = '🚀';");
    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.equal('name: "🚀"');

    await cleanup();
  });

  it('04b: rerenders on a js dependency change [in md]', async () => {
    const {
      build,
      readOutput,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/04b-update-js-dependency-md/docs');

    await writeSource('name.js', "export const name = 'initial name';");
    await build();
    expect(readOutput('index.html')).to.equal('<p>name: "initial name"</p>');

    await engine.start();
    setAsOpenedInBrowser('index.rocket.md');
    await writeSource('name.js', "export const name = '🚀';");
    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.equal('<p>name: "🚀"</p>');

    await cleanup();
  });

  it('04c: rerenders on npm dependency update', async () => {
    const {
      readOutput,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/04c-npm-dependency-update/docs');

    await writeSource(
      '../node_modules/some-dependency/index.js',
      "export const someDependency = 'initialSomeDependency';",
    );

    await engine.start();
    await fetch('http://localhost:8000/');
    expect(readOutput('index.html')).to.equal('<p>initialSomeDependency</p>');

    setAsOpenedInBrowser('index.rocket.js');
    await writeSource(
      '../node_modules/some-dependency/index.js',
      "export const someDependency = 'updatedSomeDependency';",
    );

    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.equal('<p>updatedSomeDependency</p>');

    await cleanup();
  });

  it('rerenders on a js dependency change after an import change in the page', async () => {
    const {
      readOutput,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
      setAsOpenedInBrowser,
    } = await setupTestEngine(
      'fixtures/09-watch/05-update-js-dependency-after-page-import-change/docs',
    );

    await writeSource('name.js', "export const name = 'I am name.js';");
    await writeSource('name-initial.js', "export const name = 'I am name-initial.js';");
    await writeSource(
      'index.rocket.js',
      [
        //
        `import { name } from './name-initial.js';`,
        '',
        'export default `name: "${name}"`;',
      ].join('\n'),
    );

    await engine.start();
    await fetch('http://localhost:8000/');
    setAsOpenedInBrowser('index.rocket.js');
    // will not trigger a write as not part of the jsDependencies
    await writeSource('name.js', "export const name = '🚀 stage 1';");
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(readOutput('index.html')).to.equal('name: "I am name-initial.js"');

    await writeSource(
      'index.rocket.js',
      [
        //
        `import { name } from './name.js';`,
        '',
        'export default `name: "${name}"`;',
      ].join('\n'),
    );
    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.equal('name: "🚀 stage 1"');

    // now it will trigger a write
    await writeSource('name.js', "export const name = '🚀 stage 2';");
    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.equal('name: "🚀 stage 2"');

    await cleanup();
  });

  it('directly render newly created pages to get the PageTree Metadata', async () => {
    const { readOutput, writeSource, cleanup, engine, deleteSource, anEngineEvent } = await setupTestEngine(
      'fixtures/09-watch/06-create-single-page/docs',
    );
    await deleteSource('name.js');
    await deleteSource('about.rocket.js');

    await engine.start();
    await writeSource('name.js', "export const name = '🚀 stage 1';");
    await writeSource(
      'about.rocket.js',
      [
        //
        `import { name } from './name.js';`,
        '',
        'export default `name: "${name}"`;',
      ].join('\n'),
    );
    await anEngineEvent('rocketUpdated');
    expect(readOutput('about/index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta http-equiv="X-UA-Compatible" content="IE=edge" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '    <title>Document</title>',
        '  </head>',
        '  <body>',
        '    name: "🚀 stage 1"',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );

    await cleanup();
  });

  it('will delete the output file if a page gets deleted', async () => {
    const {
      build,
      readOutput,
      outputExists,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
      deleteSource,
    } = await setupTestEngine('fixtures/09-watch/07-delete-page/docs');
    await writeSource('about.rocket.js', 'export default `about`;');
    await build();
    expect(readOutput('index.html')).to.equal('index');
    expect(readOutput('about/index.html')).to.equal('about');

    await engine.start();
    await deleteSource('about.rocket.js');
    await anEngineEvent('rocketUpdated');

    expect(outputExists('about/index.html')).to.be.false;

    await cleanup();
  });

  // TODO: test works standalone but not when running all tests - probably due to some cleanup issues of wasm in a worker
  it.skip('continues after error in page rendering', async () => {
    const {
      readOutput,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/08-error-in-page/docs');
    await writeSource('index.rocket.js', 'export default `index`;');

    await engine.start();
    setAsOpenedInBrowser('index.rocket.js');
    await writeSource('index.rocket.js', 'export default `index ${name}`;');
    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.include('ReferenceError: name is not defined');

    await writeSource('index.rocket.js', "const name = 'Home';\nexport default `index ${name}`;");
    await anEngineEvent('rocketUpdated');

    expect(readOutput('index.html')).to.equal('index Home');
    await cleanup();
  });

  it('updates the pageTree on creating a new page without needing to open it', async () => {
    const {
      readOutput,
      writeSource,
      readSource,
      cleanup,
      engine,
      deleteSource,
      anEngineEvent,
      setAsOpenedInBrowser,
    } = await setupTestEngine('fixtures/09-watch/09-update-pageTree-on-create/docs');
    await deleteSource('about.rocket.js');
    await writeSource(
      'pageTreeData.rocketGenerated.json',
      [
        '{',
        '  "title": "Document",',
        '  "url": "/",',
        '  "outputRelativeFilePath": "index.html",',
        '  "sourceRelativeFilePath": "index.rocket.js",',
        '  "level": 0,',
        '  "children": [',
        '    {',
        '      "title": "Document",',
        '      "h1": "components",',
        '      "menuLinkText": "components",',
        '      "url": "/components/",',
        '      "outputRelativeFilePath": "components/index.html",',
        '      "sourceRelativeFilePath": "components.rocket.js",',
        '      "level": 1',
        '    }',
        '  ]',
        '}',
      ].join('\n'),
    );

    await engine.start();
    setAsOpenedInBrowser('index.rocket.js');
    await writeSource(
      'about.rocket.js',
      [
        //
        'export default `<h1>about</h1>`;',
      ].join('\n'),
    );
    await anEngineEvent('rocketUpdated');
    expect(readSource('pageTreeData.rocketGenerated.json')).to.equal(
      [
        '{',
        '  "title": "Document",',
        '  "url": "/",',
        '  "outputRelativeFilePath": "index.html",',
        '  "sourceRelativeFilePath": "index.rocket.js",',
        '  "level": 0,',
        '  "children": [',
        '    {',
        '      "title": "Document",',
        '      "h1": "components",',
        '      "menuLinkText": "components",',
        '      "url": "/components/",',
        '      "outputRelativeFilePath": "components/index.html",',
        '      "sourceRelativeFilePath": "components.rocket.js",',
        '      "level": 1',
        '    },',
        '    {',
        '      "title": "Document",',
        '      "h1": "about",',
        '      "menuLinkText": "about",',
        '      "url": "/about/",',
        '      "outputRelativeFilePath": "about/index.html",',
        '      "sourceRelativeFilePath": "about.rocket.js",',
        '      "level": 1',
        '    }',
        '  ]',
        '}',
      ].join('\n'),
    );

    // about only got rendered to read the metadata for the PageTree
    // e.g. it will not include the about page itself
    expect(readOutput('about/index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta http-equiv="X-UA-Compatible" content="IE=edge" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '    <title>Document</title>',
        '  </head>',
        '  <body>',
        '    <nav aria-label="site">',
        '      <a href="/components/">components</a>',
        '    </nav>',
        '',
        '    <h1>about</h1>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );

    // index gets rerendered with the updated PageTree which includes the about page
    expect(readOutput('index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta http-equiv="X-UA-Compatible" content="IE=edge" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '    <title>Document</title>',
        '  </head>',
        '  <body>',
        '    <nav aria-label="site">',
        '      <a href="/components/">components</a>',
        '      <a href="/about/">about</a>',
        '    </nav>',
        '',
        '    <h1>index</h1>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );

    await cleanup();
  });

  it('will rerender all open pages on pageTree change', async () => {
    const {
      readOutput,
      outputExists,
      setAsOpenedInBrowser,
      writeSource,
      anEngineEvent,
      cleanup,
      engine,
    } = await setupTestEngine('fixtures/09-watch/10-pageTree-change-rerenders-all-open/docs');
    await writeSource('about.rocket.js', 'export default `<h1>about</h1>`;');

    await engine.start();
    setAsOpenedInBrowser('index.rocket.js');
    setAsOpenedInBrowser('about.rocket.js');

    await writeSource('about.rocket.js', 'export default `<h1>new about</h1>`;');
    await anEngineEvent('rocketUpdated');

    expect(readOutput('about/index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta http-equiv="X-UA-Compatible" content="IE=edge" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '    <title>Document</title>',
        '  </head>',
        '  <body>',
        '    <nav aria-label="site">',
        '      <a href="/about/" aria-current="page">about</a>',
        '      <a href="/components/">components</a>',
        '      <a href="/getting-started/">getting-started</a>',
        '    </nav>',
        '',
        '    <h1>new about</h1>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );

    expect(readOutput('index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="UTF-8" />',
        '    <meta http-equiv="X-UA-Compatible" content="IE=edge" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        '    <title>Document</title>',
        '  </head>',
        '  <body>',
        '    <nav aria-label="site">',
        '      <a href="/about/">about</a>',
        '      <a href="/components/">components</a>',
        '      <a href="/getting-started/">getting-started</a>',
        '    </nav>',
        '',
        '    index',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );

    // does not render page not opened in browser
    expect(outputExists('getting-started/index.html')).to.be.false;

    await cleanup();
  });
});
