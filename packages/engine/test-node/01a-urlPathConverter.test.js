import chai from 'chai';
import { pathToUrl } from '../src/urlPathConverter.js';

const { expect } = chai;

describe('pathToUrl', () => {
  describe('html files output', () => {
    it('handles index.rocket.js files', async () => {
      expect(pathToUrl(`index.rocket.js`)).to.equal('index.html');
      expect(pathToUrl(`components/index.rocket.js`)).to.equal(
        'components/index.html',
      );
    });

    it('handles [name].rocket.js files', async () => {
      expect(pathToUrl(`tabs.rocket.js`)).to.equal('tabs/index.html');
      expect(pathToUrl(`components/accordion.rocket.js`)).to.equal(
        'components/accordion/index.html',
      );
    });

    it('handles [order]--[name].rocket.js files', async () => {
      expect(pathToUrl(`01--tabs.rocket.js`)).to.equal('tabs/index.html');
      expect(pathToUrl(`01--components/01--accordion.rocket.js`)).to.equal(
        'components/accordion/index.html',
      );
    });

    it('handles index.rocket.md files', async () => {
      expect(pathToUrl(`index.rocket.md`)).to.equal('index.html');
      expect(pathToUrl(`components/index.rocket.md`)).to.equal(
        'components/index.html',
      );
    });

    it('handles [name].rocket.md files', async () => {
      expect(pathToUrl(`tabs.rocket.md`)).to.equal('tabs/index.html');
      expect(pathToUrl(`components/accordion.rocket.md`)).to.equal(
        'components/accordion/index.html',
      );
    });

    it('handles index.rocket.html files', async () => {
      expect(pathToUrl(`index.rocket.html`)).to.equal('index.html');
      expect(pathToUrl(`components/index.rocket.html`)).to.equal(
        'components/index.html',
      );
    });

    it('handles [name].rocket.html files', async () => {
      expect(pathToUrl(`tabs.rocket.html`)).to.equal('tabs/index.html');
      expect(pathToUrl(`components/accordion.rocket.html`)).to.equal(
        'components/accordion/index.html',
      );
    });
  });

  describe('custom files output', () => {
    it('handles [name].[ext].rocket.js files', async () => {
      expect(pathToUrl(`sitemap.xml.rocket.js`)).to.equal('sitemap.xml');
      expect(pathToUrl(`components/sitemap.xml.rocket.js`)).to.equal(
        'components/sitemap.xml',
      );
    });

    it('handles [order]--[name].[ext].rocket.js files', async () => {
      expect(pathToUrl(`01--sitemap.xml.rocket.js`)).to.equal('sitemap.xml');
      expect(pathToUrl(`01--components/01--sitemap.xml.rocket.js`)).to.equal(
        'components/sitemap.xml',
      );
    });

    it('supports custom file extensions only with rocket.js files', async () => {
      expect(pathToUrl(`sitemap.xml.rocket.md`)).to.equal(
        'sitemap.xml/index.html',
      );
      expect(pathToUrl(`components/sitemap.xml.rocket.md`)).to.equal(
        'components/sitemap.xml/index.html',
      );
    });

    it('supports creation of custom md files', async () => {
      expect(pathToUrl(`my-markdown.md.rocket.js`)).to.equal(
        'my-markdown.md',
      );
      expect(pathToUrl(`components/my-markdown.md.rocket.js`)).to.equal(
        'components/my-markdown.md',
      );
    });

    it('doing index.html.rocket.js still works', async () => {
      expect(pathToUrl(`index.html.rocket.js`)).to.equal('index.html');
      expect(pathToUrl(`components/index.html.rocket.js`)).to.equal(
        'components/index.html',
      );
    });

    it('doing [name].html.rocket.js will not create folders with index files', async () => {
      expect(pathToUrl(`tabs.html.rocket.js`)).to.equal('tabs.html');
      expect(pathToUrl(`components/accordion.html.rocket.js`)).to.equal(
        'components/accordion.html',
      );
    });
  });
});
