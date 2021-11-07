import chai from 'chai';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Engine start', () => {
  it('updates rocket header on a *.rocket.js file change', async () => {
    const { writeSource, cleanup, readSource, engine, anEngineEvent } = setupTestEngine(
      'fixtures/09-watch/01-update-header/docs',
    );

    await writeSource('index.rocket.js', "export default 'index';");
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(readSource('index.rocket.js')).to.equal("export default 'index';");

    await engine.start();
    await writeSource('index.rocket.js', "export default 'updated index';");
    await anEngineEvent('rocketUpdated');

    expect(readSource('index.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const relativeFilePath = 'index.rocket.js';",
        '/* END - Rocket auto generated - do not touch */',
        '',
        "export default 'updated index';",
      ].join('\n'),
    );

    await cleanup();
  });

  it('if started updates the header on file change', async () => {
    const { writeSource, cleanup, readSource, engine, anEngineEvent } = setupTestEngine(
      'fixtures/09-watch/02-update-header-on-dependency-change/docs',
    );

    await writeSource(
      'index.rocket.js',
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const relativeFilePath = 'index.rocket.js';",
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
        "export const relativeFilePath = 'index.rocket.js';",
        "import { some } from './thisDir.rocketData.js';",
        'export { some }',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `about`;',
      ].join('\n'),
    );
    await writeSource('thisDir.rocketData.js', 'export const some = "data";');

    await engine.start();
    await writeSource(
      'thisDir.rocketData.js',
      ["export const some = 'data';", "export const more = 'stuff';"].join('\n'),
    );

    await anEngineEvent('rocketUpdated');

    expect(readSource('index.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const relativeFilePath = 'index.rocket.js';",
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
        "export const relativeFilePath = 'about.rocket.js';",
        "import { some, more } from './thisDir.rocketData.js';",
        'export { some, more };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `about`;',
      ].join('\n'),
    );

    await cleanup();
  });

  it('rerenders only a single file when changing a single file', async () => {
    const { execute, readOutput, writeSource, anEngineEvent, cleanup, engine } = setupTestEngine(
      'fixtures/09-watch/edit-single-page/docs',
    );

    await writeSource('index.rocket.js', "export default 'index';");
    await writeSource('about.rocket.js', "export default 'about';");
    await execute();
    expect(readOutput('index.html')).to.equal('<my-layout>index</my-layout>');
    expect(readOutput('about/index.html')).to.equal('<my-layout>about</my-layout>');

    await engine.start();
    await writeSource('index.rocket.js', "export default 'updated index';");
    await anEngineEvent('rocketUpdated');
    expect(readOutput('index.html')).to.equal('<my-layout>updated index</my-layout>');
    expect(readOutput('about/index.html')).to.equal('<my-layout>about</my-layout>');

    await cleanup();
  });
});
