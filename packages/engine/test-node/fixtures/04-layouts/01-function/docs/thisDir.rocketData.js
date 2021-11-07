import { html } from '@rocket/engine';

function defaultLayout(content, data) {
  return html`
    <html>
      <head>
        <title>${data.titleFn(data)}</title>
      </head>
      <body>
        ${content}
        <web-menu type="main"></web-menu>
      </body>
    </html>
  `;
}

export const layout = defaultLayout;

export const title = '[[ web-menu-title ]]';
export const titleFn = (data) => `${data.title} | Rocket`;
