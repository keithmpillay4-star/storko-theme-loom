# Loom

An editorial, catalogue-led Shopify theme for general ecommerce and lifestyle stores.

![License: MIT](https://img.shields.io/badge/license-MIT-green)
![Online Store 2.0](https://img.shields.io/badge/Shopify-Online%20Store%202.0-5a863e)

**Live demo:** https://storko.co.za/demo/loom (a working storefront with sample products; checkout is disabled)

Built for general ecommerce, fashion, homeware and lifestyle stores. Part of the free Storko theme family: [Ember](https://github.com/keithmpillay4-star/storko-theme-ember), [Loom](https://github.com/keithmpillay4-star/storko-theme-loom) and [Anvil](https://github.com/keithmpillay4-star/storko-theme-anvil).

## What you get

- Centered header with a multi-column mega menu (turn it on in the header settings)
- Sidebar filtering and sorting on collection pages
- Promo grid, collection list, logo list, scrolling text strip and featured blog sections
- Square-edged, photography-first design with an italic serif accent

Shared by all three themes:

- Cart drawer with free-shipping progress, keyboard focus trap and screen-reader announcements
- Predictive search, product filtering and sorting (Shopify's storefront filtering)
- Variant picker, image gallery, quantity selector, dynamic checkout buttons
- Announcement bar, header with dropdown menus and a mobile menu, footer with newsletter and payment icons
- Blog and articles, contact form, 404, password page, gift card and customer account templates
- Theme editor friendly: JSON templates, sections with presets, and section-level settings for colours, fonts, spacing and radii
- Structured data for products and articles, Open Graph tags, no dependencies and no build step

## Install

**Upload a ZIP:** click **Code > Download ZIP** on GitHub, then in your Shopify admin go to **Online Store > Themes > Add theme > Upload zip file**.

**Shopify CLI:**

```bash
git clone https://github.com/keithmpillay4-star/storko-theme-loom.git
cd storko-theme-loom
shopify theme push --unpublished --store your-store.myshopify.com
```

**Develop locally:** `shopify theme dev --store your-store.myshopify.com`

Customise colours, fonts, page width, corner radii and cart type under **Theme settings** in the theme editor.

## Quality and limits

- `shopify theme check` reports no offenses, and the theme has been uploaded to and tested on a real Shopify development store: variant switching, cart drawer, search, filters and page templates.
- Lighthouse accessibility and performance scores have not been formally measured yet.
- The customer account templates apply to stores using classic customer accounts; stores on Shopify's new customer accounts use Shopify-hosted pages instead.
- Demo photography on storko.co.za is not included in this repository.

## Contributing

Issues and pull requests are welcome. Please run `shopify theme check` before opening a pull request.

## Licence

MIT. See [LICENSE](LICENSE). Copyright (c) 2026 Storko. All theme code is original.
