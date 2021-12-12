import path from 'path';

export class AdjustAssetUrls {
  transform(source, { outputRelativeFilePath, sourceFilePath, outputFilePath }) {
    let output = source;
    if (outputRelativeFilePath.endsWith('.html')) {
      output = output.replace(/<img src="(.*?)"/g, (match, url) => {
        const newUrl = path.relative(
          path.dirname(outputFilePath),
          path.join(path.dirname(sourceFilePath), url),
        );
        return `<img src="${newUrl}"`;
      });
    }
    return output;
  }
}
