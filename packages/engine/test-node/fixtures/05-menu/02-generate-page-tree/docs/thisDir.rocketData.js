import { Site } from '@web/menu';
import { PageTree } from '../../../../../src/PageTree.js';

const pageTree = new PageTree({
  inputDir: new URL('./', import.meta.url),
  outputDir: new URL('../__output', import.meta.url),
});

await pageTree.restore();

export const layout = async (content, data) => {
  return `
    ${await pageTree.renderMenu(new Site(), data.sourceRelativeFilePath)}
    <main>${content}</main>
  `;
};
