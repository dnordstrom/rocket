import chai from 'chai';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Engine Data Cascade', () => {
  it('injects a header into the source file', async () => {
    const { build, readSource, writeSource, readOutput } = await setupTestEngine(
      'fixtures/01-data-cascade/01-basics/docs',
    );
    await writeSource(
      'empty.rocket.js',
      'export default `empty.rocket.js sourceRelativeFilePath: "${sourceRelativeFilePath}"`;',
    );
    await build();

    expect(readSource('empty.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'empty.rocket.js';",
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `empty.rocket.js sourceRelativeFilePath: "${sourceRelativeFilePath}"`;',
      ].join('\n'),
    );
    expect(readOutput('empty/index.html')).to.equal(
      'empty.rocket.js sourceRelativeFilePath: "empty.rocket.js"',
    );

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        `/* END - Rocket auto generated - do not touch */`,
        '',
        'export default `index.rocket.js sourceRelativeFilePath: "${sourceRelativeFilePath}"`;',
        '',
      ].join('\n'),
    );
    expect(readOutput('index.html')).to.equal(
      'index.rocket.js sourceRelativeFilePath: "index.rocket.js"',
    );

    expect(readSource('sub-dir/index.rocket.js')).to.equal(
      [
        [
          `/* START - Rocket auto generated - do not touch */`,
          "export const sourceRelativeFilePath = 'sub-dir/index.rocket.js';",
          `/* END - Rocket auto generated - do not touch */`,
          '',
          'export default `sub-dir/index.rocket.js sourceRelativeFilePath: "${sourceRelativeFilePath}"`;',
          '',
        ].join('\n'),
      ].join('\n'),
    );
    expect(readOutput('sub-dir/index.html')).to.equal(
      'sub-dir/index.rocket.js sourceRelativeFilePath: "sub-dir/index.rocket.js"',
    );
  });

  it('injects data from `thisDir.rocketData.js`', async () => {
    const { build, readSource, writeSource } = await setupTestEngine(
      'fixtures/01-data-cascade/02-this-dir/docs',
    );
    await writeSource('index.rocket.js', 'export default `index`;');
    await writeSource('about.rocket.js', 'export default `about`;');
    await writeSource('components/accordion.rocket.js', 'export default `accordion`;');
    await writeSource('components/tabs.rocket.js', 'export default `tabs`;');
    await build();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { onRootLevel } from './thisDir.rocketData.js';",
        'export { onRootLevel };',
        `/* END - Rocket auto generated - do not touch */`,
        '',
        'export default `index`;',
      ].join('\n'),
    );

    expect(readSource('about.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'about.rocket.js';",
        "import { onRootLevel } from './thisDir.rocketData.js';",
        'export { onRootLevel };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `about`;',
      ].join('\n'),
    );

    expect(readSource('components/accordion.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'components/accordion.rocket.js';",
        "import { inComponents } from './thisDir.rocketData.js';",
        'export { inComponents };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `accordion`;',
      ].join('\n'),
    );

    expect(readSource('components/tabs.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'components/tabs.rocket.js';",
        "import { inComponents } from './thisDir.rocketData.js';",
        'export { inComponents };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `tabs`;',
      ].join('\n'),
    );
  });

  it('injects multiple exports from `thisDir.rocketData.js`', async () => {
    const { build, readSource, writeSource } = await setupTestEngine(
      'fixtures/01-data-cascade/03-this-dir-multiple-exports/docs',
    );
    await writeSource('index.rocket.js', 'export default `index`;');
    await build();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { foo, bar } from './thisDir.rocketData.js';",
        'export { foo, bar };',
        `/* END - Rocket auto generated - do not touch */`,
        '',
        'export default `index`;',
      ].join('\n'),
    );
  });

  it('imports as "[name]asOriginal" if export exists`', async () => {
    const { build, readSource, writeSource } = await setupTestEngine(
      'fixtures/01-data-cascade/04-import-as-original/docs',
    );
    await writeSource(
      'index.rocket.js',
      [
        "export const options = { ...originalOptions, b: 'bValue' };",
        '',
        'export default JSON.stringify(options, null, 2);',
      ].join('\n'),
    );
    await build();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { options as originalOptions } from './thisDir.rocketData.js';",
        `/* END - Rocket auto generated - do not touch */`,
        '',
        "export const options = { ...originalOptions, b: 'bValue' };",
        '',
        'export default JSON.stringify(options, null, 2);',
      ].join('\n'),
    );
  });

  it('injects data from `thisAndSubDirs.rocketData.js`', async () => {
    const { build, readSource, writeSource } = await setupTestEngine(
      'fixtures/01-data-cascade/05-this-and-sub-dirs/docs',
    );
    await writeSource('index.rocket.js', 'export default `index`;');
    await writeSource('about.rocket.js', 'export default `about`;');
    await writeSource('components/index.rocket.js', 'export default `components/index`;');
    await build();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { fromRoot } from './thisAndSubDirs.rocketData.js';",
        'export { fromRoot };',
        `/* END - Rocket auto generated - do not touch */`,
        '',
        'export default `index`;',
      ].join('\n'),
    );

    expect(readSource('about.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'about.rocket.js';",
        "import { fromRoot } from './thisAndSubDirs.rocketData.js';",
        'export { fromRoot };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `about`;',
      ].join('\n'),
    );

    expect(readSource('components/index.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'components/index.rocket.js';",
        "import { fromRoot } from '../thisAndSubDirs.rocketData.js';",
        'export { fromRoot };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `components/index`;',
      ].join('\n'),
    );
  });

  it('`thisDir.rocketData.js` overwrites data from `thisAndSubDirs.rocketData.js`', async () => {
    const { build, readSource, writeSource } = await setupTestEngine(
      'fixtures/01-data-cascade/06-this-dir-overwrite/docs',
    );
    await writeSource('index.rocket.js', 'export default `index`;');
    await writeSource('components/index.rocket.js', 'export default `components/index`;');
    await writeSource('components/tabs.rocket.js', 'export default `components/tabs`;');
    await build();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const sourceRelativeFilePath = 'index.rocket.js';",
        "import { fromRoot } from './thisAndSubDirs.rocketData.js';",
        'export { fromRoot };',
        `/* END - Rocket auto generated - do not touch */`,
        '',
        'export default `index`;',
      ].join('\n'),
    );

    expect(readSource('components/index.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'components/index.rocket.js';",
        "import { fromRoot } from './thisDir.rocketData.js';",
        'export { fromRoot };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `components/index`;',
      ].join('\n'),
    );

    expect(readSource('components/tabs.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const sourceRelativeFilePath = 'components/tabs.rocket.js';",
        "import { fromRoot } from './thisDir.rocketData.js';",
        'export { fromRoot };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `components/tabs`;',
      ].join('\n'),
    );
  });
});
