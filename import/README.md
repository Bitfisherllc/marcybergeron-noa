# Bulk import paintings (no CSV)

Drop image files into a gallery folder and run one command. Everything is read from the **filename**.

## Filename format

```
{order}-{title} {width}x{height}.{ext}
```

Example:

```
1-Gut Feeling 24x18.webp
17Born in the USA   22x18 .webp
16-Headlights 14 x 12.webp
```

Extra spaces, an optional dash after the order number, and spaces around `x` in the size are all fine.

- **order** — sort position in the gallery (1, 2, 3…)
- **title** — painting title (spaces allowed)
- **size** — width and height with `x` (shown on the site as `24" × 18"`)
- **ext** — `.webp`, `.jpg`, `.jpeg`, `.png`, or `.gif`

## Encaustic example

1. Put your files in:

   ```
   website/import/encaustic/
   ```

2. Preview (no changes):

   ```bash
   npm run import:gallery -- Encaustic --dry-run
   ```

3. Import:

   ```bash
   npm run import:gallery -- Encaustic
   ```

Other galleries use the same pattern — replace `Encaustic` with the gallery slug (`Sculpture`, `Works on Paper`, etc.) or pass a custom folder:

```bash
npm run import:gallery -- Encaustic ./path/to/my/folder
```

Optional: override the material line shown on the site:

```bash
npm run import:gallery -- Encaustic --medium "Encaustic"
```

Paintings that already exist in the gallery (same title) are skipped.
