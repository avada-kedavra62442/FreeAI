# FreeAI theme assets

FreeAI has four vivid, dark-only Liquid Glass palettes: Red (Gryffindor), Green (Slytherin), Blue (Ravenclaw), and Yellow (Hufflepuff).

Each theme has six Apple touch icon sizes, six Android/PWA icon sizes, and a favicon under `public/icons/<theme>/`. Theme-specific install manifests live under `public/manifests/`. Theme selection updates browser-visible favicons, Apple icon links, visible app marks, theme-color metadata, and the linked manifest.

Installed launchers may cache their app icon and need a refresh or reinstall to reflect a changed theme. SVG icon support varies by platform; if a launcher requires raster PNGs, add PNG exports at the same sizes in the same folders.
