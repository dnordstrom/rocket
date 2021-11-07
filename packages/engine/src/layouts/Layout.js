import { renderJoiningGroup } from '../helpers/renderJoiningGroup.js';

export class Layout {
  constructor(options = {}) {
    /** @type {Record<string, string>} */
    this.options = options;
    this.data = {};
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

    return [
      //
      '<html>',
      this.renderHead(),
      this.renderBody(),
      '</html>',
    ].join('\n');
  }
}
