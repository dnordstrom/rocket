```js server
/* START - Rocket auto generated - do not touch */
export const relativeFilePath = 'markdown.rocket.md';
import { layout, title, titleFn } from './thisDir.rocketData.js';
export { layout, title, titleFn };
/* END - Rocket auto generated - do not touch */

import { members } from './members.js';
import { md } from '@rocket/engine';

const now = '2022-03-03 13:20';
```

# Welcome Members:

```js server-markdown
${members.map(member => md`- ${member}`)}
```

Generated on ${now}
