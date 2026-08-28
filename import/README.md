# Bulk import paintings (no CSV)

Drop image files into a gallery folder and run one command. Everything is read from the **filename**.

## Import folders

| Gallery | Import command | Drop files here |
|---|---|---|
| Oil and Cold Wax | `npm run import:gallery -- "Oil and Cold Wax"` | `import/oil-and-cold-wax/` |
| Encaustic Paintings on Panel | `npm run import:gallery -- "Encaustic Paintings on Panel"` | `import/encaustic-paintings-on-panel/` |
| Wax Based Collage on Panel | `npm run import:gallery -- "Wax Based Collage on Panel"` | `import/wax-based-collage-on-panel/` |
| Encaustic Monotypes | `npm run import:gallery -- "Encaustic Monotypes"` | `import/encaustic-monotypes/` |
| Sculpture | `npm run import:gallery -- Sculpture` | `import/sculpture/` |

Gallery names match the public URLs (e.g. `/art/Oil and Cold Wax`).

## Filename format

```
{order}-{title} {width}x{height}.{ext}
```

Examples:

```
1-Gut Feeling 24x18.webp
1a-Beautiful Unbroken -framed 13x13.webp
17Born in the USA   22x18 .webp
16-Headlights 14 x 12.webp
```

Extra spaces, letter suffixes (`1a`, `2b`), an optional dash after the order number, and spaces around `x` in the size are all fine.

- **order** — sort position in the gallery (1, 2, 3… or 1a, 1b, 2a…)
- **title** — painting title (spaces allowed)
- **size** — width and height with `x` (shown on the site as `24" × 18"`)
- **ext** — `.webp`, `.jpg`, `.jpeg`, `.png`, or `.gif`

## Examples

**Encaustic Monotypes**

```bash
# files in import/encaustic-monotypes/
npm run import:gallery -- "Encaustic Monotypes" --dry-run
npm run import:gallery -- "Encaustic Monotypes"
```

**Sculpture**

```bash
# files in import/sculpture/
npm run import:gallery -- Sculpture --dry-run
npm run import:gallery -- Sculpture
```

**Wax Based Collage on Panel**

```bash
# files in import/wax-based-collage-on-panel/
npm run import:gallery -- "Wax Based Collage on Panel" --dry-run
npm run import:gallery -- "Wax Based Collage on Panel"
```

Or pass a custom folder:

```bash
npm run import:gallery -- "Encaustic Monotypes" ./path/to/my/folder
```

Optional: override the material line shown on the site:

```bash
npm run import:gallery -- "Encaustic Monotypes" --medium "Encaustic monotype"
```

Paintings that already exist in the gallery (same title) are skipped.
