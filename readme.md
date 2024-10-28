# SsiReplaceWebpackPlugin

A Webpack plugin that fetches HTML content for SSI tags and replaces them in `index.html`, for development use only.

## Installation

```bash
npm install ssi-replace-webpack-plugin --save-dev
```

## Usage

```javascript
import SsiReplaceWebpackPlugin from "ssi-replace-webpack-plugin";

export default {
  mode: "development",
  plugins: [
    new SsiReplaceWebpackPlugin({
      headerUrl: "http://localhost:3000/header.html",
      footerUrl: "http://localhost:3000/footer.html",
      sidebarUrl: "http://localhost:3000/sidebar.html",
      // Optional: custom SSI tags
      ssiTags: [
        "<!--#include virtual='header.html' -->",
        "<!--#include virtual='footer.html' -->",
        "<!--#include virtual='sidebar.html' -->",
      ],
    }),
  ],
};
```

## Options

| Option       | Type     | Required | Default   | Description                       |
| ------------ | -------- | -------- | --------- | --------------------------------- |
| `headerUrl`  | string   | Yes      | -         | URL to fetch header HTML content  |
| `footerUrl`  | string   | Yes      | -         | URL to fetch footer HTML content  |
| `sidebarUrl` | string   | Yes      | -         | URL to fetch sidebar HTML content |
| `ssiTags`    | string[] | No       | See below | Custom SSI tags to replace        |

Default SSI tags if not specified:

```html
<!--#include virtual='header.html' -->
<!--#include virtual='footer.html' -->
<!--#include virtual='sidebar.html' -->
```

## Notes

- Only works in development mode
- Requires `index.html` in your build output
- Uses axios for content fetching

## License

MIT License
