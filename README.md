# Deepak Jatav — portfolio

Personal portfolio and resume of Deepak Jatav, Senior Data Analyst & Operations Lead
(e-commerce marketplaces, supply chain and ERP across Saudi Arabia and the UAE).

**Live site:** https://deepakloomsberries.github.io/deepakjatav/

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
   **URL prefix** property for `https://deepakloomsberries.github.io/deepakjatav/`.
2. Choose **HTML tag** verification, put the `<meta name="google-site-verification">`
   tag it gives you in the `<head>` of `index.html`, publish, then press Verify.
3. Under **Sitemaps**, submit `sitemap.xml`, and use **URL inspection** to request
   indexing of the home page.

The structured data (`ProfilePage` JSON-LD in `index.html`) can be checked with
Google's [Rich Results Test](https://search.google.com/test/rich-results).

## Custom domain

When a domain is bought: add it under **Settings → Pages → Custom domain** in this
repository, and point the domain's DNS at GitHub Pages (a `CNAME` record for `www`
to `deepakloomsberries.github.io`, plus GitHub's four `A` records for the root domain).
Then update the `canonical` and `og:url` links at the top of `index.html`.
