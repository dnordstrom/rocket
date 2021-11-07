// function layoutDefault(page) {
//   return `<html>${page}</html>`;
// }

class LayoutDefault {
  constructor(data) {
    this.data = data;
  }

  render(page) {
    return `<html>
    <head>
      <title>${this.data.title}</title>
    </head>
    <body>
      ${page}
      <web-menu type="main"></web-menu>
      </body>
    </html>`;
  }
}

export const layout = LayoutDefault;
export const title = 'foo';
// export const render = (page, data) => data.layout(page);
