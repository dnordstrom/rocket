import { Position } from 'sax-wasm';
import { Node, Model } from '@d4kmor/tree-model';
import { Menu } from '../src/Menu.js';
import { MetaPlugin } from 'plugins-manager';

//
// PARSING
//

type Page = {
  name: string;
  level: number;
  url: string;
  children?: Node<Page>;
  order?: number;
  active?: boolean;
  current?: boolean;
  relPath?: string;
  // tableOfContentsNode
}

export type NodeOfPage = Node<Page>;
export type ModelOfPage = Model<Page>;


type A = Node<Page>;
type B = NodeOfPage;

type C = Page;
type D = A['model']['level']
type E = B['model']['level']


type A = Model<{ a: 1, deps: [{ a: 2}] }, 'deps'>;
// type B = A['deps'][number]['a'];
// type D = Model<{ b: 2 }>;
// type E = D['children'][number]['b'];


export interface MenuParsed {
  name: string;
  start: Position;
  end: Position;
}

export interface ParseMetaData {
  metaLinkText?: string;
  relPath?: string;
  name?: string;
  fileString?: string;
  menus: MenuParsed[];
  order?: number;
  exclude?: boolean;
  h1?: string;
  title?: string;
  __tocElements?: Array<{
    text: string;
    id: string;
    level: number;
  }>;
  releaseDateTime?: string;
  subHeading?: string;
  tableOfContentsNode?: Node<Page>;
}

export type MetaPluginMenu = MetaPlugin<Menu>;

//
// renderMenu
//

// export interface Preset {
//   render: (options: renderFn) => string;
//   list: (options: renderFn) => string;
//   listItem: (options: renderFn) => string;
//   link: (options: renderFn) => string;
//   childCondition: (node: Node<Page>) => boolean;
//   listTag: string;
// }

// export interface renderFn extends Preset {
//   node: Node<Page>;
//   currentNode?: Node<Page>;
// }

export interface ConfigOptions {
  docsDir: string;
  outputDir?: string;
  plugins?: Menu[];
  setupPlugins: Array<(menus: MetaPluginMenu[]) => MetaPluginMenu[]>;
}

export interface WebMenuCliOptions extends ConfigOptions {
  configFile?: string;
}
