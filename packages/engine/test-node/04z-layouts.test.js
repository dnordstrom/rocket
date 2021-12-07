import chai from 'chai';
import { expectThrowsAsync, setupTestEngine } from './test-helpers.js';

const { expect } = chai;

describe('Layouts', () => {
  it('01-function', async () => {
    const { build, readOutput } = await setupTestEngine('fixtures/04-layouts/01-function/docs');
    await build();

    let outcome = [
      '<html>',
      '  <head>',
      '    <title>[[ web-menu-title ]] | Rocket</title>',
      '  </head>',
      '  <body>',
      '    <h1 id="welcome-members">',
      '      <a aria-hidden="true" tabindex="-1" href="#welcome-members"',
      '        ><span class="icon icon-link"></span></a',
      '      >Welcome Members:',
      '    </h1>',
      '    <ul>',
      '      <li>',
      '        <p>Superman</p>',
      '      </li>',
      '      <li>',
      '        <p>Deadpool</p>',
      '      </li>',
      '    </ul>',
      '    <p>Generated on 2022-03-03 13:20</p>',
      '    <web-menu type="main"></web-menu>',
      '  </body>',
      '</html>',
      '',
    ].join('\n');

    const index = await readOutput('index.html', { format: 'html' });
    expect(index).to.equal(outcome);

    const md = await readOutput('markdown/index.html', { format: 'html' });
    expect(md).to.equal(outcome);
  });

  it.skip('permalink-invalid-filename', async () => {
    await expectThrowsAsync(
      () => {
        const { build } = setupTestEngine('fixtures/permalink-invalid-filename/docs');
        return build();
      },
      {
        errorMatch: /File at ".*" is using invalid characters. Use only url safe characters like \[a-z\]\[A-Z\]-_/,
      },
    );
  });

  it('02-Class', async () => {
    const { build, readOutput } = await setupTestEngine('fixtures/04-layouts/02-class/docs');
    await build();

    expect(readOutput('layout-raw/index.html', { format: 'html' })).to.equal(
      ['<p>Hey there</p>', ''].join('\n'),
    );

    expect(readOutput('index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="en-US">',
        '  <head> </head>',
        '  <body>',
        '    <header></header>',
        '    <main>',
        '      <p>Hey there</p>',
        '    </main>',
        '    <footer></footer>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );

    expect(readOutput('adding-before/index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="de-DE">',
        '  <head> </head>',
        '  <body>',
        '    <header></header>',
        '    <main>',
        '      <p>content__10</p>',
        '      <p>Hey there</p>',
        '    </main>',
        '    <footer></footer>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );

    expect(readOutput('show-data/index.html', { format: 'html' })).to.equal(
      [
        '<!DOCTYPE html>',
        '<html lang="en-US">',
        '  <head> </head>',
        '  <body>',
        '    <header></header>',
        '    <main>',
        '      <p>content__10 🎉</p>',
        '      <p>Hey there</p>',
        '    </main>',
        '    <footer></footer>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );
  });
});
