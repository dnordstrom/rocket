import { Site } from '@web/menu';
import { PageTree } from '@rocket/engine';

const pageTree = new PageTree({
  inputDir: new URL('./', import.meta.url),
  outputDir: new URL('../__output', import.meta.url),
});

await pageTree.restore();

export async function layout(content, data) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    ${await pageTree.renderMenu(new Site(), data.sourceRelativeFilePath)}
    ${content}
  </body>
  </html>`;
}
