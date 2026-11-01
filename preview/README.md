# Illustrative previews

This directory is a local, responsive illustration of an Immich-style photo library. It loads the actual distributable CSS files in `themes/`; layout rules are confined to `preview.css`. It is not a screenshot of a running Immich server and does not demonstrate exhaustive version compatibility.

Serve the repository root with the project preview command and open `/preview/`. Theme selection updates the URL and the CSS download link. A small local server is needed to load the shared `src/palettes.json` catalog. No external fonts, remote photographs, analytics, or runtime network dependencies are used.

The gallery, navigation, search appearance, photo count, avatar, and storage details are illustrative content. Only the theme selector, collection link, and download link are interactive. No personal photographs or user data are included. Claude Theme and GPT Theme are unofficial community themes.

`art/*.svg` are original landscape illustrations generated for this project by `art/generate-art.mjs`. They are covered by the repository's MIT license. Reproduce them with:

```sh
node preview/art/generate-art.mjs
```

Reproduce desktop (1440 × 1000), mobile (390 × 844), and collection overview screenshots with:

```sh
npm run previews
```

The renderer uses Playwright Chromium and serves the repository on an ephemeral loopback port. Install its browser with `npx playwright install chromium` if necessary. An existing Chromium can be used by setting `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path. Screenshot browser requests are restricted to that local preview server. All PNG files are saved to `docs/images/`.
