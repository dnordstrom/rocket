import { renderJoiningGroup } from '../helpers/renderJoiningGroup.js';

export class Layout {
  constructor(options = {}) {
    this.options = {
      lang: 'en-US',
    };
    this.setGlobalOptions(options);
    this.data = {};
    this.pageOptions = new Map();
  }

  /**
   * @param {Record<string, unknown>} options
   */
  setGlobalOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   *
   * @param {string} sourceRelativeFilePath
   * @param {Record<string, unknown>} options
   */
  setOptions(sourceRelativeFilePath, options) {
    if (this.pageOptions.has(sourceRelativeFilePath)) {
      this.pageOptions.set(sourceRelativeFilePath, {
        ...this.pageOptions.get(sourceRelativeFilePath),
        ...options,
      });
    } else {
      this.pageOptions.set(sourceRelativeFilePath, options);
    }
  }

  async renderHead() {
    return [
      //
      '<head>',
      await renderJoiningGroup('head', this.options, this.data),
      '</head>',
    ].join('\n');
  }

  async renderHeader() {
    return [
      //
      '<header>',
      await renderJoiningGroup('header', this.options, this.data),
      '</header>',
    ].join('\n');
  }

  async renderFooter() {
    return [
      //
      '<footer>',
      await renderJoiningGroup('footer', this.options, this.data),
      '</footer>',
    ].join('\n');
  }

  async renderBody() {
    return [
      //
      '<body>',
      await renderJoiningGroup('top', this.options, this.data),
      await this.renderHeader(),
      await this.renderContent(),
      await this.renderFooter(),
      await renderJoiningGroup('bottom', this.options, this.data),
      '</body>',
    ].join('\n');
  }

  async renderContent() {
    return [
      //
      '<main>',
      await renderJoiningGroup('content', this.options, this.data),
      '</main>',
    ].join('\n');
  }

  /**
   * @param {string} content
   * @param {Record<string, unknown>} data
   * @returns {Promise<string>}
   */
  async render(content, data) {
    this.data = data;
    this.options.content__500 = content;

    const originalOptions = { ...this.options };
    if (this.pageOptions.has(data.sourceRelativeFilePath)) {
      this.setGlobalOptions(this.pageOptions.get(data.sourceRelativeFilePath));
    }

    const output = [
      //
      '<!DOCTYPE html>',
      `<html lang="${this.options.lang}">`,
      await this.renderHead(),
      await this.renderBody(),
      '</html>',
    ].join('\n');

    this.options = originalOptions;
    return output;
  }
}
