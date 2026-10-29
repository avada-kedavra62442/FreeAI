# FreeAI theme assets

FreeAI has four vivid, dark-only Liquid Glass palettes: Red (Gryffindor), Green (Slytherin), Blue (Ravenclaw), and Yellow (Hufflepuff).

Each theme has six Apple touch icon SVG sources, six Android/PWA icon SVG sources, and one SVG favicon under `public/icons/<theme>/`. The `predev` and `prebuild` lifecycle scripts use the open-source `sharp` package to generate matching, correctly sized PNG Apple touch icons and Android/PWA icons in the same public folders. Theme-specific install manifests live under `public/manifests/` and point to those generated PNGs.

Theme selection updates browser-visible favicons, Apple icon links, visible app marks, theme-color metadata, and the linked manifest. An already-installed launcher may cache its icon and can require a refresh or reinstall to reflect a new theme.