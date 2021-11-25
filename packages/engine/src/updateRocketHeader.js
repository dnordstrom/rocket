import path from 'path';
import fs from 'fs';
import { writeFile, readFile } from 'fs/promises';

import { init, parse } from 'es-module-lexer';

await init;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function setRocketHeader(content, header, filePath) {
  const lines = content.toString().split('\n');

  let startIndex = -1;
  let endIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '/* START - Rocket auto generated - do not touch */') {
      startIndex = i;
    }
    if (lines[i].trim() === '/* END - Rocket auto generated - do not touch */') {
      endIndex = i;
    }
  }

  if (startIndex && !endIndex) {
    throw new Error(`No "/* END - Rocket auto generated - do not touch */" found in ${filePath}`);
  }

  if (startIndex >= 0 && endIndex >= 0) {
    lines.splice(startIndex, endIndex - startIndex + 1, header);
  } else {
    const wrapBefore = filePath.endsWith('.md') ? ['```js server'] : [];
    const warpAfter = filePath.endsWith('.md') ? ['```'] : [];

    lines.unshift([...wrapBefore, header, ...warpAfter, ''].join('\n'));
  }

  return lines.join('\n');
}

async function generateRocketHeader(content, { filePath, docsDir }) {
  const dataFiles = [
    {
      filePath: new URL('../preset/data.rocketData.js', import.meta.url),
      exportModuleName: '@rocket/engine',
    },
  ];

  // Add `thisDir.rocketData.js` if available
  const thisDirFilePath = path.join(path.dirname(filePath), 'thisDir.rocketData.js');
  if (fs.existsSync(thisDirFilePath)) {
    dataFiles.push({
      filePath: thisDirFilePath,
      exportModuleName: './thisDir.rocketData.js',
    });
  }

  const possibleImports = [];
  for (const dataFile of dataFiles) {
    const { filePath: dataFilePath, exportModuleName } = dataFile;
    const readDataFile = await readFile(dataFilePath);
    const [imports, exports] = parse(readDataFile.toString());

    for (const dataExportName of exports) {
      const foundIndex = possibleImports.findIndex(el => el.importName === dataExportName);
      if (foundIndex >= 0) {
        possibleImports[foundIndex].importModuleName = exportModuleName;
      } else {
        possibleImports.push({
          importName: dataExportName,
          importModuleName: exportModuleName,
        });
      }
    }
  }

  const contentWithoutRocketHeader = setRocketHeader(content, '', filePath);
  const [imports, thisExports] = parse(contentWithoutRocketHeader);

  for (const thisExport of thisExports) {
    const foundIndex = possibleImports.findIndex(el => el.importName === thisExport);
    if (foundIndex >= 0) {
      const asOriginalVariableName = `original${capitalizeFirstLetter(possibleImports[foundIndex].importName)}`;
      if (contentWithoutRocketHeader.includes(asOriginalVariableName)) {
        // import { variableName as originalVariableName } instead
        possibleImports[foundIndex].as = asOriginalVariableName;
      } else {
        // delete import as exported by user and asOriginalVariableName is not used in code
        possibleImports.splice(foundIndex, 1);
      }
    }
  }

  const exportNames = possibleImports.filter(el => !el.as).map(el => el.importName);
  const exportsString = exportNames.length > 0 ? [`export { ${exportNames.join(', ')} };`] : [];

  const usedImports = new Map();
  for (const importObj of possibleImports) {
    const importStatement = importObj.as
      ? `${importObj.importName} as ${importObj.as}`
      : `${importObj.importName}`;
    if (usedImports.has(importObj.importModuleName)) {
      usedImports.get(importObj.importModuleName).push(importStatement);
    } else {
      usedImports.set(importObj.importModuleName, [importStatement]);
    }
  }

  const sourceRelativeFilePath = path.relative(docsDir, filePath);
  const header = [
    '/* START - Rocket auto generated - do not touch */',
    `export const sourceRelativeFilePath = '${sourceRelativeFilePath}';`,
    ...[...usedImports.entries()].map(
      ([importModuleName, imports]) =>
        `import { ${imports.join(', ')} } from '${importModuleName}';`,
    ),
    ...exportsString,
    '/* END - Rocket auto generated - do not touch */',
  ].join('\n');

  return header;
}

export async function updateRocketHeader(filePath, docsDir) {
  const content = (await readFile(filePath)).toString();
  const header = await generateRocketHeader(content, { filePath, docsDir });
  const updatedContent = setRocketHeader(content, header, filePath);

  if (content !== updatedContent) {
    await writeFile(filePath, updatedContent);
  }
}
