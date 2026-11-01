# Contributing

Theme changes start in `src/palettes.json`. The eleven positions in each ramp correspond to 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, and 950. Primary and neutral ramps increase in brightness for Immich Dark appearance; the generator produces inverse ramps and legacy RGB triplets.

1. Install Node.js 22 or newer and run `npm ci`.
2. Install the preview browser with `npx playwright install chromium` (`--with-deps` if Linux system libraries are missing).
3. Edit the palette, run `npm run build`, and run `npm run check`.
4. Use `npm run preview` to inspect the result, then `npm run previews` to update image examples.
5. Commit source palettes, generated CSS, and any updated examples together.

Keep installable CSS self-contained and scoped to dark appearance. Preserve photo/video rendering, layout, native status colors, and field validation. Avoid remote imports, fonts, selectors based on generated component hashes, and blanket `!important` rules. Compare the proposed tokens against the exact Immich version being supported.

The checks include syntax, native/legacy color formats, ordered ramps, readable body/muted/button pairs (including hover), and a Chromium fixture that checks light mode isolation, dialogs, focus, and unchanged image pixels. The fixture is deliberately small; a passing check does not prove every screen in a real deployment works. See [compatibility](docs/compatibility.md).

For a bug report, include your Immich version, browser, selected appearance, theme filename, affected screen, and whether other custom CSS is present. Crop or replace private photographs and account information before attaching screenshots. Describe what you expected and what happened.
