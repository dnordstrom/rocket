import path from 'path';
import { TreeModel } from '@d4kmor/tree-model';
import { getHtmlMetaData } from './getHtmlMetaData.js';
import { sourceRelativeFilePathToOutputRelativeFilePath, sourceRelativeFilePathToUrl } from './urlPathConverter.js';
import { readFile, writeFile } from 'fs/promises';

function findParent(child, tree) {
  return tree.first(node => {
    return child.model.url.startsWith(node.model.url) && node.model.level === child.model.level - 1;
  });
}

function findSelf(child, tree) {
  return tree.first(
    node => child.model.sourceRelativeFilePath === node.model.sourceRelativeFilePath,
  );
}

export class PageTree {
  /**
   * @param {string | URL} docsDir
   */
  constructor(docsDir) {
    this.docsDir = docsDir instanceof URL ? docsDir.pathname : docsDir;
    this.dataFilePath = path.join(this.docsDir, 'pageTreeData.rocketGenerated.json');
    this.treeModel = new TreeModel();
  }

  /**
   * @param {string} sourceRelativeFilePath
   */
  async add(sourceRelativeFilePath) {
    const outputFilePath = path.join(this.docsDir, sourceRelativeFilePath);
    const htmlMetaData = await getHtmlMetaData(outputFilePath);
    const outputRelativeFilePath = sourceRelativeFilePathToOutputRelativeFilePath(sourceRelativeFilePath);

    if (!outputRelativeFilePath.endsWith('index.html')) {
      return;
    }

    const pageData = {
      ...htmlMetaData,
      url: sourceRelativeFilePathToUrl(sourceRelativeFilePath),
      outputRelativeFilePath,
      sourceRelativeFilePath: sourceRelativeFilePath,
      level: outputRelativeFilePath.split('/').length - 1,
    };
    const pageModel = this.treeModel.parse(pageData);

    if (this.tree) {
      const self = findSelf(pageModel, this.tree);
      if (self) {
        console.log('NOT YET IMPLEMENTED');
      } else {
        const parent = findParent(pageModel, this.tree);
        if (parent) {
          parent.addChild(pageModel);
        } else {
          throw Error('corrupt page tree - could not find parent of page to add');
        }
        this.needsAnotherRenderingPass = true;
      }
    } else {
      this.tree = pageModel;
    }
  }

  /**
   * @param {string} sourceRelativeFilePath
   */
  async update(sourceRelativeFilePath) {
    // function findSelf(child, tree) {
    //   return tree.first(
    //     node => child.model.sourceRelativeFilePath === node.model.sourceRelativeFilePath,
    //   );
    // }
    // const { relativeFilePath, outputFilePath } = page;
    // const htmlMetaData = await getHtmlMetaData(outputFilePath);
    // const outputRelativeFilePath = pathToUrl(sourceRelativeFilePath);
    // const pageData = {
    //   ...htmlMetaData,
    //   url: sourceRelativeFilePathToUrl(sourceRelativeFilePath),
    //   outputRelativeFilePath,
    //   sourceRelativeFilePath: relativeFilePath,
    //   level: outputRelativeFilePath.split('/').length - 1,
    // };
    // const pageModel = this.treeModel.parse(pageData);
    // let tree;
    // if (existsSync(pageTreeDataFilePath)) {
    //   tree = await restoreFromJsonFile(pageTreeDataFilePath, treeModel);
    // } else {
    //   tree = pageModel;
    // }
    // const parent = findParent(pageModel, tree);
    // if (parent) {
    //   parent.addChild(pageModel);
    // }
    // console.log(JSON.stringify(tree, null, 2));
    // await writeFile(pageTreeDataFilePath, JSON.stringify(tree, null, 2));
  }

  async restore() {
    const content = await readFile(this.dataFilePath);
    const obj = JSON.parse(content.toString());
    this.tree = this.treeModel.parse(obj);
  }

  async save() {
    await writeFile(this.dataFilePath, JSON.stringify(this.tree, null, 2));
  }

  /**
   * @param {string} sourceRelativeFilePath
   */
  setCurrent(sourceRelativeFilePath) {
    const currentNode = this.tree.first(
      entry => entry.model.sourceRelativeFilePath === sourceRelativeFilePath,
    );
    if (currentNode) {
      currentNode.model.current = true;
      for (const parent of currentNode.getPath()) {
        parent.model.active = true;
      }
    }
  }

  removeCurrent() {
    const currentNode = this.tree.first(entry => entry.model.current === true);
    if (currentNode) {
      currentNode.model.current = false;
      for (const parent of currentNode.getPath()) {
        parent.model.active = false;
      }
    }
  }

  async renderMenu(inst, sourceRelativeFilePath) {
    this.setCurrent(sourceRelativeFilePath);
    inst.currentNode = this.tree.first(entry => entry.model.current === true);
    const output = await inst.render(this.tree);
    this.removeCurrent();
    return output;
  }
}
