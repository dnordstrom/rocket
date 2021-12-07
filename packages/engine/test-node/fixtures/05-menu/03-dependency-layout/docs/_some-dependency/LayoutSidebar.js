import { Layout, renderJoiningGroup } from '@rocket/engine';
import { Site } from '@web/menu';

export class LayoutSidebar extends Layout {
  constructor(options) {
    super(options);
    this.setGlobalOptions({
      sidebar__20_nav: async data =>
        await this.options.pageTree.renderMenu(new Site(), data.sourceRelativeFilePath),
    });
  }

  async renderContent() {
    return [
      //
      '<div class="content-area">',
      '  <div id="sidebar">',
      await renderJoiningGroup('sidebar', this.options, this.data),
      '  </div>',
      '  <main class="markdown-body">',
      await renderJoiningGroup('content', this.options, this.data),
      '  </main>',
      '</div>',
    ].join('\n');
  }
}
