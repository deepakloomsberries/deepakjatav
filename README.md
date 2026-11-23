# Deepak Jatav — portfolio

Personal portfolio and resume of Deepak Jatav, Senior Data Analyst & Operations Lead
(e-commerce marketplaces, supply chain and ERP across Saudi Arabia and the UAE).

**Live site:** https://deepakloomsberries.github.io/deepakjatav/

## What is here

| Path | Purpose |
| --- | --- |
| `index.html` | The portfolio (single page) |
| `assets/css/style.css` | All styling and CSS animation |
| `assets/js/main.js` | Interactions: route canvas, scroll effects, calculators |
| `resume.html` | Resume source, also readable online |
| `assets/Deepak_Jatav_Resume.pdf` | The downloadable 2-page ATS-friendly resume |

Plain HTML, CSS and JavaScript. No build step and no dependencies, so GitHub Pages serves it as is.

## Updating the resume

1. Edit the text in `resume.html`.
2. Regenerate the PDF from it with Chrome or Edge:

   ```powershell
   & "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --no-pdf-header-footer --print-to-pdf="assets\Deepak_Jatav_Resume.pdf" "$PWD\resume.html"
   ```

3. Check that it is still two pages, then commit and push.

## Custom domain

When a domain is bought: add it under **Settings → Pages → Custom domain** in this
repository, and point the domain's DNS at GitHub Pages (a `CNAME` record for `www`
to `deepakloomsberries.github.io`, plus GitHub's four `A` records for the root domain).
Then update the `canonical` and `og:url` links at the top of `index.html`.
