# Blappos

Bad news. Great magnet.

A static, card-first satire-news site. Every illustration opens a concise factual recap and a link to the underlying reporting.

## Editorial rules

- Publish three to ten non-duplicate stories from the previous day.
- Verify every factual recap against the linked reporting before publishing.
- Every story card must look like a distressed mid-century American souvenir magnet: limited ink colors, halftone texture, chipped or rusty rounded edges, and prominent location lettering. No glossy 3D, photorealistic, neon, or generic modern card art.

### Amazon products — non-negotiable daily gate

- Every story must include exactly three Amazon products. Three products across the whole daily edition is not enough.
- Each product must connect directly to the central subject or exact event in that story. Matching only a broad category such as “funny,” “travel,” “animals,” or “cars” does not qualify.
- Before publishing, write a one-sentence reason the product belongs with that specific story. If the reason could be reused unchanged on an unrelated story, reject the product.
- Prefer products that solve, imitate, parody, measure, protect against, or recreate a specific detail from the story.
- Do not use generic novelty filler, convenient products already used on unrelated cards, or loosely associated impulse items.
- Every link must open an active Amazon product-detail page for that exact item—not a search page, category page, video, or substitute product.
- Use the exact current product title and the photograph from that same product listing. The image, title, ASIN and destination URL must all describe the same item.
- Verify all three product pages and all three images immediately before publishing. If any item is unavailable, mismatched, broken or weakly relevant, replace it before the story goes live.
- Amazon URLs must include the `blappos-20` affiliate tag. Links use `rel="sponsored nofollow noopener"`, and the affiliate disclosure remains visible beside the products.
- A daily edition is not complete until every new story passes this Amazon-product gate.

## Publishing

The repository is dependency-free and ready for GitHub Pages from the `main` branch root.

Every change to `daily-data.js` or `archive-data.js` automatically generates a permanent,
indexable page for each story, updates `sitemap.xml`, and refreshes `robots.txt`. Submit
`https://blappos.com/sitemap.xml` to Google Search Console once; future daily posts are
included automatically.

Every generated story page includes native sharing plus text, Facebook, X, Reddit,
email and copy-link controls. Sharing always uses the permanent story URL so social
previews carry the matching headline and story illustration. This is regenerated for
every daily batch along with the sitemap.
