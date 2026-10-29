# FreeAI theme assets

All theme SVG sources are directly in `public/`: six Apple touch icons, six Android icons, and one main favicon per Red, Green, Blue, and Yellow theme. The build script generates the 48 PNG versions directly in `public/`. Each palette has its own `.webmanifest`.

`window.FREEAI_THEME` is the selected theme, `window.FREEAI_THEME_CONFIG` is its palette, and `freeai:themechange` is available for integrations such as CookieYes. Theme selection updates browser favicon, visible app marks, Apple icon links, theme-color metadata, and the linked manifest. Websites cannot force already-installed iOS/Android launcher icons to change instantly; the OS can cache them, and iOS has no web API for dynamic icon replacement.

Sitemap URLs and the canonical host will be finalized during SEO work.
