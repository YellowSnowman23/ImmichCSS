# Compatibility and validation

These seven themes target the **Immich web client v3.3.5 in Dark appearance**. They use Immich's color variables rather than replacing its layout. The presence of older color variables does not establish support for older Immich releases. Native Android and iOS applications do not use this web stylesheet.

## Verified upstream baseline

The [v3.3.5 web package](https://github.com/immich-app/immich/blob/v3.3.5/web/package.json) declares `@immich/ui` as `^0.90.0`; the [release lockfile](https://github.com/immich-app/immich/blob/v3.3.5/pnpm-lock.yaml) resolves it to **0.90.0**. Immich's application version and its UI package version are separate.

The implementation was checked against the [v3.3.5 app stylesheet](https://github.com/immich-app/immich/blob/v3.3.5/web/src/app.css) and the [published UI 0.90.0 default theme](https://unpkg.com/@immich/ui@0.90.0/dist/theme/default.css). These are source-level compatibility checks, not a promise that every Immich route or future version has been tested.

## Installation and scope

1. Back up any existing custom CSS.
2. Open **Administration → Settings → Theme Settings → Custom CSS** (`/admin/system-settings`) as an administrator.
3. Replace the field with the complete contents of **one** file from `themes/`, then save.
4. Select **Dark** appearance in the web client and reload the page. Other users must also use Dark appearance to see these palettes.

The exact English labels come from [v3.3.5 translations](https://github.com/immich-app/immich/blob/v3.3.5/i18n/en.json) and the [settings page](https://github.com/immich-app/immich/blob/v3.3.5/web/src/routes/admin/system-settings/%2Bpage.svelte). The [official system settings documentation](https://docs.immich.app/administration/system-settings/#theme-settings) explains that custom CSS loads for **all users of the web application**. This is an instance setting, not a private per-user theme selection.

If the field is disabled because the instance uses a configuration file, follow that deployment's existing configuration workflow for `theme.customCss`. The [theme editor source](https://github.com/immich-app/immich/blob/v3.3.5/web/src/routes/admin/system-settings/ThemeSettings.svelte) explicitly disables editing in that situation. Do not overwrite the rest of the configuration to install a theme.

To uninstall, restore the previous field contents (or clear it if it was empty), save, and reload. Immich's [HTML shell](https://github.com/immich-app/immich/blob/v3.3.5/web/src/app.html) loads the resulting stylesheet from `/custom.css`; a hard refresh can help if a browser or reverse proxy retains an earlier copy.

## Color contract

The [UI default theme](https://unpkg.com/@immich/ui@0.90.0/dist/theme/default.css) switches variables with `.dark` and `.light`. The [theme manager](https://unpkg.com/@immich/ui@0.90.0/dist/services/theme-manager.svelte.js) applies the selected class to `<html>`. Our palettes are scoped to `:root.dark, .dark`; they do not force a user's appearance preference.

| Variable family | Expected value | Role in Dark appearance |
| --- | --- | --- |
| `--immich-ui-light` | A full CSS color, such as `#101418` | Dark base surface; also the text on filled buttons |
| `--immich-ui-dark` | A full CSS color | Light foreground text |
| `--immich-ui-gray`, `--immich-ui-muted`, `--immich-ui-default-border` | Full CSS colors | Subtle surface, muted color, default border |
| `--immich-ui-primary-50` … `-950` | Full CSS colors | **Dark → light**; `500` is the main accent |
| `--immich-ui-light-50` … `-950` | Full CSS colors | **Dark → light** surface/foreground ramp |
| `--immich-ui-dark-50` … `-950` | Full CSS colors | **Light → dark** inverse ramp |
| `--color-gray-50` … `-950` | Full CSS colors | Conventional **light → dark** utilities used by fields and secondary text |
| `--immich-dark-primary`, `-bg`, `-fg`, `-gray` | Space-separated RGB channels, such as `122 216 193` | Remaining legacy utilities; Immich wraps these values in `rgb(...)` |

Several details matter when modifying a palette:

- **Button text is deliberately dark.** UI [filled variants](https://unpkg.com/@immich/ui@0.90.0/dist/styles.js) use `text-light` with primary, success, danger, warning, and info backgrounds. Making `--immich-ui-light` pale in dark mode can make their labels unreadable. Check hover states too: filled buttons reduce background opacity.
- **The primary ramp is reversed in dark mode.** A conventional light-to-dark primary ramp makes softly tinted cards and selected controls use the wrong brightness. The [Card component](https://unpkg.com/@immich/ui@0.90.0/dist/components/Card/Card.svelte) uses low primary stops for dark backgrounds.
- **Semantic status colors stay native.** The themes do not redefine warning, danger, success, or info ramps. Avoid selectors that recolor every button or every border; those can erase validation and destructive-action distinctions.
- **Muted text also uses gray utilities.** The [UI styles](https://unpkg.com/@immich/ui@0.90.0/dist/styles.js) use `dark:text-gray-400` for muted text and `dark:bg-gray-800` for fields. Changing only `--immich-ui-muted` will not recolor all secondary labels.
- **Photos keep their own rendering.** There are no blanket image filters, opacity changes, or replacement image styles. Immich's [thumbnail component](https://github.com/immich-app/immich/blob/v3.3.5/web/src/lib/components/assets/thumbnail/ImageThumbnail.svelte) intentionally dims hidden assets and adds selection rings. The asset viewer's black backdrop is retained.

## What the examples establish

The repository's images show a local preview using sample artwork and the actual theme files. They illustrate the palettes and representative interface states; they are **not screenshots of a connected Immich library**. Source checks and preview checks do not exercise authentication, uploads, video controls, maps, every modal, or every responsive layout in a running server.

Before adopting a theme broadly, inspect your deployed version's timeline, album page, search, settings, dialogs, warning/destructive actions, keyboard focus, and asset viewer. Check both a wide and a narrow window, then switch to Light appearance to confirm that it still behaves normally. Repeat this review after upgrading Immich, because internal CSS tokens and components can change.
