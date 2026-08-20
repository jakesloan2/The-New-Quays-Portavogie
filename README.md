# The New Quays, Portavogie

Website for The New Quays — a seafood restaurant and bar at 81 New Harbour Road, Portavogie, County Down, and Besties Café, the daytime café in the same building.

Built by [Apex Design NI](https://apexdesignni.co.uk/).

---

## What this is

A hand-built static website. **There is no build step and no dependencies.** The repository *is* the website — what you see in these folders is exactly what gets served. Push to `main` and GitHub Pages publishes it.

That was a deliberate choice over a framework like Astro or Next.js. A restaurant website that needs `npm install` before anyone can change a price is a website that goes stale. This one can be edited from the GitHub web editor on a phone.

```
├── index.html              Home
├── menu.html               Restaurant menu
├── besties.html            Besties Café
├── about.html              Our story
├── portavogie.html         Local area / SEO page
├── gallery.html            Photography
├── contact.html            Find us, hours, map, FAQ
├── 404.html
├── robots.txt
├── sitemap.xml
├── .nojekyll               Stops GitHub Pages running Jekyll over the files
├── .github/workflows/
│   └── deploy.yml          Publishes to GitHub Pages on push to main
└── assets/
    ├── css/style.css       All styling. One file, organised in @layers.
    ├── js/
    │   ├── site-config.js  ← business details live here. Start here.
    │   └── main.js         Navigation, booking, hours, gallery, reveals
    └── img/                Responsive WebP sets + JPEG fallbacks
```

---

## Deploying to GitHub Pages

1. Create a repository and push these files to the `main` branch.
2. In the repository, go to **Settings → Pages**.
3. Under **Source**, choose **GitHub Actions**.
4. Push any commit. The workflow in `.github/workflows/deploy.yml` publishes the site.

### Custom domain

1. **Settings → Pages → Custom domain** — enter the domain and save. This creates a `CNAME` file.
2. At your DNS provider, point the domain at GitHub Pages:
   - Apex (`example.co.uk`) → four `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `www` → a `CNAME` record pointing at `<your-username>.github.io`
3. Tick **Enforce HTTPS** once the certificate has been issued (usually within an hour).

### After the domain is live

Search the project for `REPLACE-WITH-DOMAIN.co.uk` and replace every occurrence with the real domain. It appears in:

- the `<link rel="canonical">` and Open Graph tags in all eight HTML files
- the JSON-LD structured data in all eight HTML files
- `robots.txt`
- `sitemap.xml`

A find-and-replace across the project handles all of it in one go. **Do this before submitting the site to Google Search Console** — canonical tags pointing at a placeholder domain will stop pages being indexed.

---

## Placeholders that must be filled before launch

Everything the client has not yet confirmed is wrapped in `[SQUARE BRACKETS]` so it is impossible to miss. Search the project for `[` to find them all.

| Placeholder | Where | Notes |
|---|---|---|
| `[DISH NAME]`, `[£0.00]` | `menu.html` | The whole menu is placeholder. See "Editing the menu" below. |
| `[LATITUDE]`, `[LONGITUDE]` | `site-config.js` | Take the exact pin from Google Business Profile, then add a `geo` block to the JSON-LD |
| `[Add the family and ownership story...]` | `about.html` | Should be in the owners' own words |
| `[Introduce key team members...]` | `about.html` | |
| `[Add the restaurant's allergen statement]` | `menu.html` | |
| `[Add the Besties menu here]` | `besties.html` | |

There is also a `.placeholder-note` box at the top of the menu, visible on the page, reminding whoever edits it to delete the notice once the real menu is in. **Remove that block before launch.**

---

## Editing content

### Business details — `js/site-config.js`

Phone number, address, social links, booking mode and opening hours all live in this one file.

⚠️ **Important:** the same details are *also* written into each page's HTML and JSON-LD. That is deliberate — search engines and AI crawlers must see the facts without running JavaScript. So when you change something in `site-config.js`, change it in the HTML too. The table above lists where each value appears.

### Opening hours

Two separate schedules, because the restaurant and Besties keep different days and times but share one phone line.

Both schedules are confirmed and in place. To change either, edit the relevant block:

```js
restaurant: {
  label: "Restaurant",
  confirmed: true,              // ← flip this to true
  days: {
    0: [["12:00", "20:00"]],    // Sunday
    1: [],                      // Monday — closed
    2: [["12:00", "14:30"], ["17:00", "20:30"]],   // two sittings
    // ...
  }
}
```

`0` is Sunday through to `6` for Saturday. An empty array means closed. Multiple sittings in a day are allowed.

While `confirmed` is `false`, the "open now" indicator stays hidden rather than showing something wrong. Once it is `true`, every status indicator on the site starts working automatically.

Then also:
1. Write the hours into `contact.html` (the Restaurant block) and the footer of every page.
2. Add an `openingHoursSpecification` array to the `Restaurant` JSON-LD in each page's `<head>`. Copy the shape used in the Besties `department` block directly beneath it.

### Editing the menu

Open `menu.html`. Each dish is one block:

```html
<li class="menu-item">
  <p class="menu-item__name">Portavogie prawn scampi</p>
  <p class="menu-item__price">£14.50</p>
  <p class="menu-item__desc">Breadcrumbed prawn tails, salad, chips and tartare.</p>
</li>
```

Dietary markers go after the dish name:

```html
<p class="menu-item__name">Roast vegetable tart <span class="diet"><span>V</span><span>GF</span></span></p>
```

Add or remove `<li>` blocks freely. To add a whole new category, copy a `<section class="menu-section">` block, give it a unique `id`, and add a matching link to the `.menu-nav` list at the top of the page.

### Adding photographs

Images live in `img/`. Each one has a set of WebP files at different widths (`name-600.webp`, `name-900.webp`, and so on) plus a `name.jpg` fallback for older browsers.

To add a new photograph, generate the same set of sizes and follow the existing `<picture>` pattern. Always include `width` and `height` attributes — they reserve the space and stop the page jumping as images load.

**Alt text is not optional.** Describe what is in the photograph for someone who cannot see it. Not keywords.

---

## The booking system

This is the part of the build most worth understanding, because it is designed to change.

Right now every **Book a table** button is a phone call. `js/site-config.js`:

```js
booking: {
  mode: "phone",
  widgetUrl: ""
}
```

- **On phones and tablets** the button is a `tel:` link. One tap opens the dialler. This works even with JavaScript disabled, because the `tel:` href is written into the HTML.
- **On desktop** a `tel:` link does nothing useful, and a primary call-to-action that appears broken is worse than none at all. So the same button opens a panel with the number, a copy button, the current open/closed status, and a note about large parties.

### Switching to an online booking provider later

When the restaurant is ready for ResDiary, Dojo, OpenTable or similar:

```js
booking: {
  mode: "widget",
  widgetUrl: "https://booking.resdiary.com/widget/..."
}
```

That is the entire migration. Every booking button across all seven pages changes at once. No page needs rebuilding, no layout needs redesigning.

Two things to do at the same time:
- Add `"potentialAction"` with a `ReserveAction` to the `Restaurant` JSON-LD. It is deliberately absent now, because pointing it at a URL that cannot take a booking is worse than omitting it.
- Add the booking link to the Google Business Profile so the Maps "Reserve" button appears.

---

## SEO and AEO

**Implemented:**

- Semantic HTML5 with one `<h1>` per page and no skipped heading levels
- Unique titles (all under 65 characters) and meta descriptions (all under 158)
- Canonical URLs, Open Graph and Twitter card tags on every page
- `Restaurant` JSON-LD with `alternateName` covering the legacy trading names, and Besties modelled as a `department` (`CafeOrCoffeeShop`) — this mirrors the "Located in: The New Quays" relationship Google already holds, rather than fighting it
- `FAQPage` structured data on Contact and Portavogie
- `BreadcrumbList` on every interior page
- `sitemap.xml` and `robots.txt`, with AI crawlers explicitly allowed
- Descriptive alt text on every image

**Still to do, and worth more than anything on this site:**

1. **Claim and complete both Google Business Profiles** — The New Quays and Besties Café. Correct hours, correct phone number, 30+ recent photographs, every review answered. For a village restaurant this outranks the website for local searches.
2. **Use one name everywhere.** The business currently appears across listings as The New Quays, The Quays, New Quays and "The Q". That fragmentation costs rankings. The site treats **The New Quays** as the brand and the others as `alternateName`. Make the same choice on Google, Facebook, Tripadvisor and every directory.
3. Submit the sitemap in Google Search Console once the real domain is live.

---

## Performance

No framework, no jQuery, no icon library, no tag manager, no tracking pixel. Measured, uncompressed:

| | |
|---|---|
| CSS | 26 KB (~7 KB served with Brotli) |
| JavaScript | 15 KB (~4 KB served with Brotli) |
| Homepage first paint | ~155 KB including the hero image |
| Third-party requests on load | **zero** |

The Google Maps embed on the Contact page is behind a click-to-load facade. The map only loads when a visitor asks for it, which keeps third-party cookies off the page by default and keeps the Contact page fast.

**One improvement worth making:** fonts currently load from the Google Fonts CDN. Self-hosting them removes a third-party connection and speeds up first paint. Download the Fraunces and Inter Tight WOFF2 files, put them in `fonts/`, and replace the `<link>` in each `<head>` with local `@font-face` rules using `font-display: swap`.

---

## Accessibility

Built against WCAG 2.2 AA:

- Skip link to main content
- Keyboard navigation throughout, with a focus trap in the mobile drawer and the lightbox, and Escape to close both
- Visible focus rings on every interactive element
- All interactive targets at least 44×44px
- Body text contrast 14.8:1; no information conveyed by colour alone
- `prefers-reduced-motion` fully respected — all animation is disabled, and content is shown immediately rather than waiting on a scroll reveal
- Semantic landmarks, labelled navigation regions, a labelled hours table, real `<button>` and `<a>` elements
- If JavaScript fails entirely, the site still renders and every page and phone number remains reachable

---

## Browser support

Current versions of Chrome, Edge, Firefox and Safari, on desktop and mobile. The layout uses CSS Grid, custom properties, `@layer` and `color-mix()`. Older browsers get the JPEG image fallbacks automatically.

---

## Known limitations

- **Header and footer are duplicated in each HTML file.** With no build step there is no way to share them. If you change a navigation link, change it in all eight files. This was the trade-off for a site anyone can edit without tooling. If the page count grows much beyond this, revisit it.
- **The menu is placeholder content.** The site cannot go live until it is replaced.
- **Commercial use of the George Best name and likeness** should be confirmed with the estate before any memorabilia photography or biographical content is added to the Besties page. The current copy refers only to the café's own name and the public mural near the harbour.
