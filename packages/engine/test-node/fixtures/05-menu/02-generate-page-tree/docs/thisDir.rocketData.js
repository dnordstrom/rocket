import { Site } from '@web/menu';
import { PageTree } from '../../../../../src/PageTree.js';

const pageTree = new PageTree(new URL('./', import.meta.url));
await pageTree.restore();

export const layout = async (content, data) => {
  return `
    ${await pageTree.renderMenu(new Site(), data.relativeFilePath)}
    <main>${content}</main>
  `;
};
