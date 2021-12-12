import chai from 'chai';
import { AdjustAssetUrls } from '@rocket/engine';

const { expect } = chai;

const options = {
  sourceFilePath: '/my/path/to/docs/index.rocket.js',
  sourceRelativeFilePath: 'index.rocket.js',
  outputFilePath: '/my/path/to/__output/index.html',
};

describe('AdjustAssetUrls', () => {
  it('adjust <img src="./foo.png">', async () => {
    const adjust = new AdjustAssetUrls();
    expect(await adjust.transform('<img src="./foo.png" />', options)).to.equal(
      '<img src="../docs/foo.png" />',
    );
    expect(
      await adjust.transform('<img src="./foo.png" /><img src="./bar.png" />', options),
    ).to.equal('<img src="../docs/foo.png" /><img src="../docs/bar.png" />');
  });

  it('adjust <link href="./foo.css" />', async () => {
    const adjust = new AdjustAssetUrls();
    expect(await adjust.transform('<link href="./foo.css" />', options)).to.equal(
      '<link href="../docs/foo.css" />',
    );
  });

  it('adjust <script src="./foo.js"></script>', async () => {
    const adjust = new AdjustAssetUrls();
    expect(await adjust.transform('<script src="./foo.js"></script>', options)).to.equal(
      '<script src="../docs/foo.js"></script>',
    );
  });

  it('adjust <a href="./foo.html"></a>', async () => {
    const adjust = new AdjustAssetUrls();
    expect(await adjust.transform('<a href="./foo.html">go</a>', options)).to.equal(
      '<a href="../docs/foo.html">go</a>',
    );
  });

  it('ignores <a href="#foo"></a>', async () => {
    const adjust = new AdjustAssetUrls();
    expect(await adjust.transform('<a href="#foo">go</a>', options)).to.equal(
      '<a href="#foo">go</a>',
    );
  });  

  it('adjust <a href="./about.rocket.js"></a>', async () => {
    const adjust = new AdjustAssetUrls();
    expect(await adjust.transform('<a href="./about.rocket.js">go</a>', options)).to.equal(
      '<a href="/about/">go</a>',
    );
    expect(
      await adjust.transform('<a href="./about.rocket.js">go</a>', {
        sourceRelativeFilePath: 'components/index.rocket.js',
        outputFilePath: '/my/path/to/__output/components/index.html',
      }),
    ).to.equal('<a href="/components/about/">go</a>');

    expect(
      await adjust.transform('<a href="./about.rocket.js">go</a>', {
        sourceRelativeFilePath: 'components.rocket.js',
        outputFilePath: '/my/path/to/__output/components/index.html',
      }),
    ).to.equal('<a href="/components/about/">go</a>');
  });
});
