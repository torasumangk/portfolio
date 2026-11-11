# torasuman.co

Portfolio site for Toraihan Sumantri — static HTML/CSS/JS built from the Figma file *Landing Page torasuman.co*.

```
index.html              Home (selected work)
product-design/         Product design
brand-campaigns/        Brand & campaigns
motion-video/           Motion & video
gudangkripto/           GudangKripto revamp case study (before/after sliders)
assets/css/style.css    Styles, breakpoints (≥1200 desktop · 768–1199 tablet · <768 mobile)
assets/js/main.js       Scroll reveals, sticky nav, mobile menu, comparison slider
```

No build step. Preview locally with `npx serve .` (or any static server).

## Deploy (Cloudflare Workers static assets)
Cloudflare Worker `portfolio` is connected to this repo via Git integration; `wrangler.jsonc` serves the repo root as static assets.
Custom domain: `torasuman.co`. Every push to `main` deploys automatically.
