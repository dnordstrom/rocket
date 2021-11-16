import { pageTree } from './pageTree.js';
import { Site } from '@web/menu';

/**
 * @param {NodeOfPage} tree
 * @param {NodeOfPage} node
 */
function setCurrent(tree, sourceRelativeFilePath) {
  const currentNode = tree.first(entry => entry.model.sourceRelativeFilePath === sourceRelativeFilePath);
  if (currentNode) {
    currentNode.model.current = true;
    for (const parent of currentNode.getPath()) {
      parent.model.active = true;
    }
  }
}

/**
 * @param {NodeOfPage} tree
 */
function removeCurrent(tree) {
  const currentNode = tree.first(entry => entry.model.current === true);
  if (currentNode) {
    currentNode.model.current = false;
    for (const parent of currentNode.getPath()) {
      parent.model.active = false;
    }
  }
}

async function renderMenu(inst, tree, sourceRelativeFilePath) {
  setCurrent(tree, sourceRelativeFilePath);
  inst.currentNode = tree.first(entry => entry.model.current === true);
  const output = await inst.render(tree);
  removeCurrent(tree);
  return output;
}

export const layout = async (content, data) => {
  return `
    ${await renderMenu(new Site(), pageTree, data.sourceRelativeFilePath)}
    <main>${content}</main>
  `;
};
