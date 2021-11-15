import { pageTree } from './pageTree.js';
import { Site } from '@web/menu';

/**
 * @param {NodeOfPage} tree
 * @param {NodeOfPage} node
 */
function setCurrent(tree, relativeFilePath) {
  const currentNode = tree.first(entry => entry.model.sourceRelativeFilePath === relativeFilePath);
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

async function renderMenu(inst, tree, relativeFilePath) {
  setCurrent(tree, relativeFilePath);
  inst.currentNode = tree.first(entry => entry.model.current === true);
  const output = await inst.render(tree);
  removeCurrent(tree);
  return output;
}

export const layout = async (content, data) => {
  return `
    ${await renderMenu(new Site(), pageTree, data.relativeFilePath)}
    <main>${content}</main>
  `;
};
