import TreeModel from 'tree-model';

const data = {
  level: 0,
  name: 'Two Pages',
  title: 'Two Pages',
  relPath: 'index.rocket.js',
  children: [
    { name: 'About', url: 'about/index.html', level: 1, relPath: 'about.rocket.js' },
    { name: 'Components', url: 'components/index.html', level: 1, relPath: 'components.rocket.js' },
  ],
};

const treeModel = new TreeModel();
export const pageTree = treeModel.parse(data);
