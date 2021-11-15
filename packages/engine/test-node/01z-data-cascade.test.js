import chai from 'chai';
import { setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Engine Data Cascade', () => {
  it('injects a header into the source file', async () => {
    const { execute, readSource, writeSource, readOutput } = setupTestEngine(
      'fixtures/01-data-cascade/01-basics/docs',
    );
    await writeSource(
      'empty.rocket.js',
      'export default `empty.rocket.js relativeFilePath: "${relativeFilePath}"`;',
    );
    await execute();

    expect(readSource('empty.rocket.js')).to.equal(
      [
        '/* START - Rocket auto generated - do not touch */',
        "export const relativeFilePath = 'empty.rocket.js';",
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `empty.rocket.js relativeFilePath: "${relativeFilePath}"`;',
      ].join('\n'),
    );
    expect(readOutput('empty/index.html')).to.equal(
      'empty.rocket.js relativeFilePath: "empty.rocket.js"',
    );

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const relativeFilePath = 'index.rocket.js';",
        `/* END - Rocket auto generated - do not touch */`,
        '',
        'export default `index.rocket.js relativeFilePath: "${relativeFilePath}"`;',
        '',
      ].join('\n'),
    );
    expect(readOutput('index.html')).to.equal(
      'index.rocket.js relativeFilePath: "index.rocket.js"',
    );

    expect(readSource('sub-dir/index.rocket.js')).to.equal(
      [
        [
          `/* START - Rocket auto generated - do not touch */`,
          "export const relativeFilePath = 'sub-dir/index.rocket.js';",
          `/* END - Rocket auto generated - do not touch */`,
          '',
          'export default `sub-dir/index.rocket.js relativeFilePath: "${relativeFilePath}"`;',
          '',
        ].join('\n'),
      ].join('\n'),
    );
    expect(readOutput('sub-dir/index.html')).to.equal(
      'sub-dir/index.rocket.js relativeFilePath: "sub-dir/index.rocket.js"',
    );
  });

  it('injects data from `thisDir.rocketData.js`', async () => {
    const { execute, readSource, writeSource } = setupTestEngine(
      'fixtures/01-data-cascade/02-this-dir/docs',
    );
    await writeSource('index.rocket.js', 'export default `index`;');
    await writeSource('about.rocket.js', 'export default `about`;');
    await writeSource('components/accordion.rocket.js', 'export default `accordion`;');
    await writeSource('components/tabs.rocket.js', 'export default `tabs`;');
    await execute();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const relativeFilePath = 'index.rocket.js';",
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
        "export const relativeFilePath = 'about.rocket.js';",
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
        "export const relativeFilePath = 'components/accordion.rocket.js';",
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
        "export const relativeFilePath = 'components/tabs.rocket.js';",
        "import { inComponents } from './thisDir.rocketData.js';",
        'export { inComponents };',
        '/* END - Rocket auto generated - do not touch */',
        '',
        'export default `tabs`;',
      ].join('\n'),
    );
  });

  it('injects multiple exports from `thisDir.rocketData.js`', async () => {
    const { execute, readSource, writeSource } = setupTestEngine(
      'fixtures/01-data-cascade/03-this-dir-multiple-exports/docs',
    );
    await writeSource('index.rocket.js', 'export default `index`;');
    await execute();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const relativeFilePath = 'index.rocket.js';",
        "import { foo, bar } from './thisDir.rocketData.js';",
        'export { foo, bar };',
        `/* END - Rocket auto generated - do not touch */`,
        '',
        'export default `index`;',
      ].join('\n'),
    );
  });

  it('imports as "[name]asOriginal" if export exists`', async () => {
    const { execute, readSource, writeSource } = setupTestEngine(
      'fixtures/01-data-cascade/04-import-as-original/docs',
    );
    await writeSource('index.rocket.js', [
      "export const options = { ...originalOptions, b: 'bValue' };",
      '',
      'export default JSON.stringify(options, null, 2);'
    ].join('\n'));
    await execute();

    expect(readSource('index.rocket.js')).to.equal(
      [
        `/* START - Rocket auto generated - do not touch */`,
        "export const relativeFilePath = 'index.rocket.js';",
        "import { options as originalOptions } from './thisDir.rocketData.js';",
        `/* END - Rocket auto generated - do not touch */`,
        '',
        "export const options = { ...originalOptions, b: 'bValue' };",
        '',
        'export default JSON.stringify(options, null, 2);'
      ].join('\n'),
    );
  });
});
