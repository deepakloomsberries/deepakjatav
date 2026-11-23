# Deepak Jatav — portfolio

Personal portfolio and resume of Deepak Jatav, Senior Data Analyst & Operations Lead
(e-commerce marketplaces, supply chain and ERP across Saudi Arabia and the UAE).

**Live site:** https://deepakjatav.com/ (the old https://deepakloomsberries.github.io/deepakjatav/ address redirects there)

## What is here

| Path | Purpose |
| --- | --- |
| `index.html` | The portfolio (single page) |
| `assets/css/style.css` | All styling and CSS animation |
| `assets/js/main.js` | Sample dashboards, order-to-cash stepper, calculators |
| `resume.html` | Resume source, also readable online |
| `assets/Deepak_Jatav_Resume.pdf` | The downloadable 2-page ATS-friendly resume |
| `assets/logos/` | Tool logos from [Simple Icons](https://simpleicons.org) 16.38.1 (CC0); marketplace names are set as text, not logos |
| `assets/flags/` | Saudi Arabia, UAE and India flags from [flag-icons](https://flagicons.lipis.dev) 7.6.0 (MIT) |
| `sitemap.xml` | Page list for search engines; update `lastmod` when content changes |

Plain HTML, CSS and JavaScript. No build step and no dependencies, so GitHub Pages serves it as is.

## Publishing a change

First bump the `?v=` version on the `style.css` and `main.js` links in `index.html`
(both must match). GitHub Pages tells browsers to reuse files for 10 minutes, so without
a new version a visitor can get the new page with the old stylesheet and see it unstyled.

GitHub Pages serves this site from the `gh-pages` branch, so push both branches together:

```powershell
git push origin main main:gh-pages
```

The live site updates about a minute later.

## Updating the resume

1. Edit the text in `resume.html`.
2. Regenerate the PDF from it with Chrome or Edge:

   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --no-pdf-header-footer --print-to-pdf="assets\Deepak_Jatav_Resume.pdf" "$PWD\resume.html"
   ```

3. Check that it is still two pages, then commit and push.

## Search engines

1. In [Google Search Console](https://search.google.com/search-console), add a
   **Domain** property for `deepakjatav.com`.
2. It asks for a `TXT` record: add it in Cloudflare under **DNS → Records** for
   deepakjatav.com, then press Verify.
3. Under **Sitemaps**, submit `https://deepakjatav.com/sitemap.xml`, and use
   **URL inspection** to request indexing of the home page.

The structured data (`ProfilePage` JSON-LD in `index.html`) can be checked with
Google's [Rich Results Test](https://search.google.com/test/rich-results).

## Custom domain

`deepakjatav.com` is registered at Cloudflare (bought 2026-11-23), which also runs its DNS.
The `CNAME` file in this repository tells GitHub Pages to serve the site on that domain.

DNS records in Cloudflare, all set to **DNS only** (grey cloud), so GitHub can issue
the HTTPS certificate:

| Type | Name | Content |
| --- | --- | --- |
| `A` | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (one record each) |
| `CNAME` | `www` | `deepakloomsberries.github.io` |
| `TXT` | `_github-pages-challenge-deepakloomsberries` | GitHub's domain-verification code |

Optional IPv6 `AAAA` records for `@` (`2606:50c0:8000::153` to `2606:50c0:8003::153`) are not
added; GitHub Pages works without them.

Renewal is in the Cloudflare dashboard under **Domains → Registrations**; keep auto-renew on.
