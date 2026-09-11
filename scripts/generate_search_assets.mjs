import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://blappos.com';

function loadStories(file, variable) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: file });
  return context.window[variable] || [];
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value = '') {
  return escapeHtml(value);
}

function absoluteImage(story) {
  const aliases = {
    'jan-caracas': 'caracas',
    'jan-minnesota': 'minneapolis',
    'feb-shutdown': 'washington',
    'may-longview': 'longview',
    'sep-typhoon': 'coastal-china',
    'sep-nepal': 'nepal'
  };
  return `${origin}/${story.image || `assets/cards/${aliases[story.id] || story.id}.webp`}`;
}

function isoDate(story) {
  if (story.isoDate) return story.isoDate;
  const parsed = new Date(`${story.date}, 2026 12:00:00 UTC`);
  return Number.isNaN(parsed.valueOf()) ? '2026-01-01' : parsed.toISOString().slice(0, 10);
}

function shareMarkup(story, canonical) {
  const title = `${story.title} — Blappos`;
  const encodedUrl = encodeURIComponent(canonical);
  const encodedTitle = encodeURIComponent(title);
  const message = encodeURIComponent(`${title}\n${canonical}`);
  return `<section class="story-share" aria-label="Share this story">
          <span>SPREAD THE BAD NEWS</span><h2>Share this disaster</h2>
          <p>Send the permanent story link—with this story’s illustration—to somebody who needs to see it.</p>
          <div class="story-share-links">
            <button class="share-primary" type="button" data-share-native>SHARE ↗</button>
            <a href="sms:?&body=${message}">TEXT</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener">FACEBOOK</a>
            <a href="https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener">X</a>
            <a href="https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}" target="_blank" rel="noopener">REDDIT</a>
            <a href="mailto:?subject=${encodedTitle}&body=${message}">EMAIL</a>
            <button type="button" data-copy-link>COPY LINK</button>
          </div><span class="share-status" aria-live="polite"></span>
        </section>`;
}

function magnetMarkup(story) {
  if (!story.magnetUrl) return '';
  return `<section class="story-magnet" aria-label="Buy this Blappos magnet">
          <span>NOW A PHYSICAL OBJECT</span><h2>Put this disaster on your refrigerator.</h2>
          <p>A 3-inch square Blappos magnet, printed to order and shipped by Printify.</p>
          <a href="${escapeHtml(story.magnetUrl)}" target="_blank" rel="noopener">BUY THIS MAGNET — ${escapeHtml(story.magnetPrice || '$9.99')} ↗</a>
          <small>Shipping calculated by Printify.</small>
        </section>`;
}

function amazonMarkup(story) {
  const links = (story.amazonLinks || []).filter(item => item.title && item.image && item.url).slice(0, 3);
  if (!links.length) return '';
  return `<section class="story-amazon" aria-label="Relevant Amazon finds">
          <h2>${links.length === 3 ? 'Three ridiculously relevant Amazon finds' : 'Ridiculously relevant Amazon finds'}</h2>
          <div class="story-amazon-links">${links.map((item, index) => `<a class="story-amazon-link" href="${escapeHtml(item.url)}" target="_blank" rel="sponsored nofollow noopener"><span class="story-amazon-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}" width="320" height="320" loading="lazy"></span><span class="story-amazon-copy"><small>AMAZON FIND 0${index + 1}</small><strong>${escapeHtml(item.title)}</strong><em>${escapeHtml(item.quip)}</em><b>SEE THE EXACT ITEM →</b></span></a>`).join('')}</div>
          <p class="story-amazon-disclosure">As an Amazon Associate, Blappos may earn from qualifying purchases. Product availability and pricing can change.</p>
        </section>`;
}

const stories = [...loadStories('archive-data.js', 'archiveStories'), ...loadStories('daily-data.js', 'dailyStories')]
  .filter((story, index, list) => story.id && list.findIndex(item => item.id === story.id) === index);

const storiesDir = path.join(root, 'stories');
fs.rmSync(storiesDir, { recursive: true, force: true });
fs.mkdirSync(storiesDir, { recursive: true });

for (const story of stories) {
  const pageDir = path.join(storiesDir, story.id);
  fs.mkdirSync(pageDir, { recursive: true });
  const canonical = `${origin}/stories/${story.id}/`;
  const description = story.facts || story.dek || story.angle || story.title;
  const image = absoluteImage(story);
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: story.title, description, image: [image],
    datePublished: isoDate(story), dateModified: isoDate(story),
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Blappos', url: origin },
    publisher: { '@type': 'Organization', name: 'Blappos', url: origin, logo: { '@type': 'ImageObject', url: `${origin}/assets/blappos-logo.png` } }
  }).replaceAll('<', '\\u003c');
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(story.title)} — Blappos</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(story.title)} — Blappos">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(story.title)} — Blappos">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  <meta property="article:published_time" content="${isoDate(story)}">
  <meta name="theme-color" content="#d94a2b">
  <link rel="icon" type="image/png" href="../../assets/blappos-logo.png">
  <link rel="apple-touch-icon" href="../../assets/blappos-logo.png">
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">${schema}</script>
</head>
<body class="story-page">
  <header class="masthead"><a class="logo" href="../../" aria-label="Blappos home"><img src="../../assets/blappos-logo.png" alt="Blappos — Bad news. Great magnet." width="900" height="600"></a></header>
  <main>
    <article class="story standalone-story">
      <img src="${image}" alt="Satirical Blappos illustration: ${escapeHtml(story.title)}" width="1000" height="1000">
      <div class="story-copy">
        <span class="label">THE STORY BEHIND THE SATIRE · ${escapeHtml(story.place)} · ${escapeHtml(story.date)}</span>
        <h1>${escapeHtml(story.title)}</h1>
        <h2>What happened</h2><p>${escapeHtml(description)}</p>
        <h2>Why it matters</h2><p>${escapeHtml(story.why || 'The event became part of a larger argument about public responsibility, power and the cost carried by ordinary people.')}</p>
        <h2>The Blappos angle</h2><p>${escapeHtml(story.angle || story.title)}</p>
        <a class="source" href="${escapeHtml(story.source)}" target="_blank" rel="noopener">${escapeHtml(story.sourceName || 'Read the reporting')} ↗</a>
        <p class="disclosure">Blappos is commentary. Artwork is illustration—not documentary photography—and the joke is not a substitute for the linked reporting.</p>
        ${shareMarkup(story, canonical)}
        ${magnetMarkup(story)}
        ${amazonMarkup(story)}
        <p><a class="button" href="../../#${escapeHtml(story.id)}">View this story on Blappos</a></p>
      </div>
    </article>
  </main>
  <script>
    const shareUrl = document.querySelector('link[rel="canonical"]').href;
    async function copyLink(button) {
      try { await navigator.clipboard.writeText(shareUrl); }
      catch { const field=document.createElement('textarea');field.value=shareUrl;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();document.execCommand('copy');field.remove(); }
      button.closest('.story-share').querySelector('.share-status').textContent='LINK COPIED';
    }
    document.querySelector('[data-share-native]').addEventListener('click', async event => {
      if (navigator.share) { try { await navigator.share({title:document.title,text:'The story behind this Blappos disaster.',url:shareUrl});return; } catch (error) { if (error.name==='AbortError') return; } }
      await copyLink(event.currentTarget);
    });
    document.querySelector('[data-copy-link]').addEventListener('click', event => copyLink(event.currentTarget));
  </script>
</body>
</html>
`;
  fs.writeFileSync(path.join(pageDir, 'index.html'), html.replace(/[ \t]+$/gm, ''));
}

const urls = [
  { loc: `${origin}/`, lastmod: stories.map(isoDate).sort().at(-1) || '2026-01-01' },
  ...stories.map(story => ({ loc: `${origin}/stories/${story.id}/`, lastmod: isoDate(story) }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod }) => `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);

console.log(`Generated ${stories.length} story pages and ${urls.length} sitemap URLs.`);
