import page, * as data from './index.md.js';

import { mdjsProcess } from '@mdjs/core';

const data2 = await mdjsProcess(page);
console.log(data2);

// const inst = new data.layout(data);
// console.log(inst.render(page));







// console.log({ page, data });
// console.log(data.render(page, data))
