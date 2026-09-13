# Blappos

Bad news. Great magnet.

A static, card-first satire-news site. Every illustration opens a concise factual recap and a link to the underlying reporting.

## Editorial rules

- Publish three to ten non-duplicate stories from the previous day.
- Verify every factual recap against the linked reporting before publishing.

### Magnet desirability — non-negotiable story-selection gate

- A story does not qualify merely because it is strange or funny. Before commissioning art, confirm that its premise can become a magnet somebody would want to buy, give, and keep on display after the news cycle ends.
- The finished concept must work without the article: one instantly recognizable central subject, one short punchline readable across a kitchen, and an image with enough charm, personality, identity, hobby, occupation, location, or gift appeal to stand on its own.
- Prefer animals, food, vehicles, travel, records, local pride, work and family humor, and absurd everyday situations with a strong visual action. Reject grim tragedy, partisan bait, niche technical context, weak visual premises, and jokes that require a paragraph of explanation.
- Score every candidate from 1–5 for visual clarity, punchline strength, giftability, broad appeal, and evergreen display value. Publish only stories scoring at least 18/25, with no category below 3.
- If the available news does not produce a buyable magnet concept, publish fewer stories instead of padding the edition.

### Visual system — non-negotiable collection gate

- Every story card must use the established Blappos magnet system. Before approving new art, compare it directly with `sep10-narrowest-car.webp`, `sep10-pony-collection.webp`, and `sep10-tallest-horse.webp`; these are the permanent visual references.
- Required construction: a rounded square rusty metal/enamel sign, thick weathered cream-and-rust perimeter, one visible dark mounting rivet in every corner, a navy location banner across the top, one detailed humorous mid-century scene in the center, and a contrasting navy or brick-red punchline banner across the bottom.
- Required illustration character: richly painted 1940s–1950s American magazine-ad realism with expressive people, story-specific props, weathered navy/cream/brick-red/mustard/dusty-blue color, and authentic chipped enamel and oxidation. It must not look like a flat vector screenprint, propaganda poster, generic retro graphic, modern ad, or clean digital illustration.
- The top line is the place; the bottom line is the joke. Both use large condensed vintage uppercase lettering and remain completely inside wide print-safe margins. No extra captions, clipped letters, white corner wedges, missing rivets, logos, watermarks, or edge content that Printify could crop.
- This visual-conformity review is a non-negotiable daily gate. If a card would look like it came from a different collection when placed beside the three reference cards, reject and regenerate it before publishing the story or creating its magnet.

### Physical Blappos magnets — non-negotiable purchase gate

- Every new story must have its own real purchasable physical Blappos magnet before the story is considered complete.
- Create and publish the matching product through the repository's Printify automation using the final approved story artwork. Never use an SVG placeholder, temporary art, or a different story's artwork for a new product unless the story itself is an exact duplicate.
- Every published story object must contain a working `magnetUrl` and `magnetPrice`.
- The story modal must display the visible `BUY THIS MAGNET` purchase CTA, and the story artwork may also link directly to the exact matching Printify product.
- Verify that the purchase URL opens the correct story magnet and that the storefront product is actually purchasable before considering the daily update finished.
- If Printify creation fails, the product URL is missing, or the link opens the wrong product, do not publish that story until it is corrected.
- Current standard retail price is `$9.99` unless intentionally changed in the Printify product configuration.
- A daily edition is not complete until every new story passes this physical-magnet purchase gate.
- Replacing approved card artwork must automatically refresh the corresponding existing Printify product; the website card and physical magnet may never show different artwork.

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

### Homepage Ridiculous Finds — permanent rotation rule

- Render exactly three homepage finds only when they can come from three different stories; never show multiple homepage products from the same story in one rotation.
- Build the pool automatically from story-level Amazon products in the current seven-day story window. Do not maintain a separate static homepage product list.
- Rotate the visible selection every six hours and whenever newer stories are published.
- Prefer products with stronger realistic purchase appeal using a numeric `salesPriority` from 1–5, while still requiring direct story relevance, exact product photos, exact `/dp/ASIN` destinations, and `tag=blappos-20`.
- If fewer than three distinct eligible stories exist, show fewer than three products instead of repeating a story.
