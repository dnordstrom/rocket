import { PageTree } from '@rocket/engine';
import { LayoutSidebar } from './_some-dependency/LayoutSidebar.js';

const pageTree = new PageTree(new URL('./', import.meta.url));
await pageTree.restore();

export const layout = new LayoutSidebar({ pageTree });
