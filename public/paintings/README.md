# Paintings directory

Drop painting images here as JPEGs, then reference them by filename in the matching series file under `src/content/series/`.

## Recommended specs

- **Format:** JPEG, quality 85
- **Size:** 2048px on the long edge
- **Color space:** sRGB (embed the profile)
- **Aspect ratio:** match the actual painting

## Naming convention

Use the painting's `id` from the series file:

```
helicoide-1.jpg
spirit-of-freedom.jpg
```

## Production optimization

For real launch, convert to KTX2 (Basis Universal) using `toktx`. Smaller payload, faster GPU upload. Three.js loader: `KTX2Loader`. Not necessary for initial dev work — JPEGs are fine.
