import { pageTree } from './pageTree.js';
import { Site } from '@web/menu';
import TreeModel from 'tree-model';
import { readFile } from 'fs/promises';


/**
 * @param {NodeOfPage} tree
 * @param {NodeOfPage} node
 */
function setCurrent(tree, relativeFilePath) {
  const currentNode = tree.first(entry => entry.model.relPath === relativeFilePath);
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

async function getPageTree() {
  const data = JSON.parse((await readFile(new URL('./pageTreeData.rocketGenerated.json', import.meta.url))).toString());
  const treeModel = new TreeModel();
  return treeModel.parse(data);
}

async function renderMenu(inst, tree, relativeFilePath) {
  setCurrent(tree, relativeFilePath);
  inst.currentNode = tree.first(entry => entry.model.current === true);
  const output = await inst.render(tree);
  removeCurrent(tree);
  return output;
}

// --- consumer code
export const layout = async (content, data) => {
  return `
    ${await renderMenu(new Site(), await getPageTree(), data.relativeFilePath)}
    <main>${content}</main>
  `;
};
