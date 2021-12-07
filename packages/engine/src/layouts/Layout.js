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

  renderHead() {
    return [
      //
      '<head>',
      renderJoiningGroup('head', this.options, this.data),
      '</head>',
    ].join('\n');
  }

  renderHeader() {
    return [
      //
      '<header>',
      renderJoiningGroup('header', this.options, this.data),
      '</header>',
    ].join('\n');
  }

  renderFooter() {
    return [
      //
      '<footer>',
      renderJoiningGroup('footer', this.options, this.data),
      '</footer>',
    ].join('\n');
  }

  renderBody() {
    return [
      //
      '<body>',
      renderJoiningGroup('top', this.options, this.data),
      this.renderHeader(),
      this.renderContent(),
      this.renderFooter(),
      renderJoiningGroup('bottom', this.options, this.data),
      '</body>',
    ].join('\n');
  }

  renderContent() {
    return [
      //
      '<main>',
      renderJoiningGroup('content', this.options, this.data),
      '</main>',
    ].join('\n');
  }

  /**
   * @param {string} content
   * @param {Record<string, unknown>} data
   * @returns {string}
   */
  render(content, data) {
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
      this.renderHead(),
      this.renderBody(),
      '</html>',
    ].join('\n');

    this.options = originalOptions;
    return output;
  }
}
