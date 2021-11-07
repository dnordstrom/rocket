/* Rocket managed */
import { layout } from './subfolder.rocket.js';

export { layout };
/* Rocket managed */

export const title = 'overrriiiidddeee';
export const content = [];

content.push(`
# Stuff to do

hey there ${title}
`);

export default content.join('\n');
