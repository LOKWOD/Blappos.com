import fs from 'node:fs';
import path from 'node:path';

const stories = [
  {
    id: 'sep10-mural-phone', place: 'Springfield, Massachusetts', image: 'assets/cards/sep10-mural-phone.webp',
    title: '1937 mural catches a time traveler checking his notifications',
    facts: 'A 1937 mural by Umberto Romano went viral after viewers noticed an Indigenous man holding a small dark rectangle in a pose that looks strikingly like someone checking a smartphone. The mural depicts a 17th-century encounter involving Springfield founder William Pynchon.',
    why: 'There is no evidence of a lost colonial cellular network. Historians say the object is more plausibly a small hand mirror, book or traded item. The mural was created for Springfield’s main post office as part of a Depression-era federal art project.',
    angle: 'The first smartphone user has finally been identified, and he already looks disappointed by the battery life. Historians believe he was checking whether the Mayflower had surge pricing.',
    source: 'https://www.ndtv.com/offbeat/smartphone-in-a-1937-painting-viral-image-sparks-bizarre-time-travel-claims-12028636',
    sourceName: 'Read the NDTV report',
    products: [
      ['The Time Machine by H. G. Wells', 'https://m.media-amazon.com/images/P/0451530703.01.LZZZZZZZ.jpg', 'Cover of The Time Machine by H. G. Wells', 'The repair manual for anyone who arrives in 1636 with a phone and no charger.', 'https://www.amazon.com/dp/0451530703?tag=blappos-20', 5],
      ['Magnetic Selfie Mirror for Phone', 'https://m.media-amazon.com/images/P/B0CYSCFJCD.01.LZZZZZZZ.jpg', 'Round magnetic selfie mirror for a smartphone', 'The historically plausible explanation, now upgraded with magnetic attachment and outdoor-selfie capability.', 'https://www.amazon.com/dp/B0CYSCFJCD?tag=blappos-20', 4],
      ['How to Invent Everything: A Survival Guide for the Stranded Time Traveler', 'https://m.media-amazon.com/images/P/073522014X.01.LZZZZZZZ.jpg', 'Cover of How to Invent Everything', 'Useful when your 1937 mural appearance occurs before the nearest charging brick has been invented.', 'https://www.amazon.com/dp/073522014X?tag=blappos-20', 5]
    ]
  },
  {
    id: 'sep10-henna-robot', place: 'India / Online', image: 'assets/cards/sep10-henna-robot.webp',
    title: 'Robot applies wedding henna and immediately requests a five-star review',
    facts: 'Industrialist Harsh Goenka shared an AI-generated video showing a machine apparently applying a detailed mehendi design to a woman’s hand. The clip prompted a fresh argument over whether automation is coming for traditional artists and skill-based services.',
    why: 'Mehendi artists create intricate, personalized designs for weddings, festivals and celebrations. Commenters quickly noted that a synthetic demonstration is not proof of a safe, reliable commercial machine—and that craftsmanship, judgment and human connection remain central to the tradition.',
    angle: 'The robot promises perfect symmetry, no small talk and a mandatory firmware update halfway through the bride’s left hand. Premium users may unlock the thumb.',
    source: 'https://www.ndtv.com/offbeat/some-more-jobs-gone-harsh-goenka-shares-video-of-mehendi-applying-machine-12027218',
    sourceName: 'Read the NDTV report',
    products: [
      ['The Henna Sourcebook', 'https://m.media-amazon.com/images/P/1596680334.01.LZZZZZZZ.jpg', 'Cover of The Henna Sourcebook', 'The human reference manual for patterns that deserve more thought than “robot arm go brrrr.”', 'https://www.amazon.com/dp/1596680334?tag=blappos-20', 5],
      ['Mehndi: The Art of Henna Body Painting', 'https://m.media-amazon.com/images/P/089281778X.01.LZZZZZZZ.jpg', 'Cover of Mehndi The Art of Henna Body Painting', 'A proper introduction to the art before Silicon Valley adds a subscription tier to your palm.', 'https://www.amazon.com/dp/089281778X?tag=blappos-20', 4],
      ['Temporary Tattoos', 'https://m.media-amazon.com/images/P/0486407039.01.LZZZZZZZ.jpg', 'Cover of a temporary tattoo design book', 'For people who want decorative skin art without placing a hand under suspicious imaginary machinery.', 'https://www.amazon.com/dp/0486407039?tag=blappos-20', 3]
    ]
  },
  {
    id: 'sep10-silent-account', place: 'Cupertino, California / Online', image: 'assets/cards/sep10-silent-account.webp',
    title: 'Account gains 10 million followers by finally keeping quiet',
    facts: 'Apple’s main account on X has accumulated nearly 10 million followers while showing zero regular public posts on its timeline. The company has used the platform for paid promotions, while support accounts and executives publish normally.',
    why: 'The blank feed is a strange exception to the standard social-media growth playbook. It also shows the difference between organic timeline posts and paid advertising: an account can appear silent while the company remains active elsewhere on the platform.',
    angle: 'Ten million people subscribed to hear nothing and have never been disappointed. Every social-media manager just stared at next month’s content calendar and whispered, “Son of a bitch.”',
    source: 'https://www.ndtv.com/offbeat/apple-has-10-million-x-twitter-followers-but-hasnt-posted-once-in-15-years-12026829',
    sourceName: 'Read the NDTV report',
    products: [
      ['The Subtle Art of Not Giving a F*ck', 'https://m.media-amazon.com/images/P/0062457713.01.LZZZZZZZ.jpg', 'Cover of The Subtle Art of Not Giving a Fck', 'The corporate social strategy, expanded from zero posts into 224 pages.', 'https://www.amazon.com/dp/0062457713?tag=blappos-20', 5],
      ['Wreck This Journal', 'https://m.media-amazon.com/images/P/0399161945.01.LZZZZZZZ.jpg', 'Cover of Wreck This Journal', 'A posting calendar with the correct amount of blank space and significantly more audience participation.', 'https://www.amazon.com/dp/0399161945?tag=blappos-20', 4],
      ['Wacky Waving Inflatable Tube Guy', 'https://m.media-amazon.com/images/I/71xmJjfakxL._SL1500_.jpg', 'Mini wacky waving inflatable tube guy', 'When the official account says nothing, deploy the tiny inflatable communications department.', 'https://www.amazon.com/dp/0762462876?tag=blappos-20', 5]
    ]
  }
];

for (const story of stories) {
  story.isoDate = '2026-09-10'; story.month = 'September'; story.date = 'Sep 10, 2026';
  story.amazonLinks = story.products.map(([title,image,alt,quip,url,salesPriority]) => ({title,image,alt,quip,url,salesPriority}));
  delete story.products;
}

const dataPath = 'daily-data.js';
let data = fs.readFileSync(dataPath, 'utf8');
const marker = 'window.dailyFinds=[];';
const ids = stories.map(story => story.id);
if (!ids.every(id => data.includes(`id:'${id}'`) || data.includes(`"id":"${id}"`))) {
  const serialized = JSON.stringify(stories, null, 2).replaceAll('\\u003c', '<');
  data = data.replace(marker, `const sep10ExtraStories=${serialized};\nwindow.dailyStories=window.dailyStories.filter(story=>!sep10ExtraStories.some(item=>item.id===story.id));\nwindow.dailyStories.splice(0,0,...sep10ExtraStories);\n${marker}`);
  fs.writeFileSync(dataPath, data);
}

function esc(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function enc(value) { return encodeURIComponent(value); }
function page(story) {
  const url = `https://blappos.com/stories/${story.id}/`;
  const image = `https://blappos.com/${story.image}`;
  const title = `${story.title} — Blappos`;
  const description = story.facts;
  const productCards = story.amazonLinks.map((p,i)=>`<a class="story-amazon-link" href="${p.url}" target="_blank" rel="sponsored nofollow noopener"><span class="story-amazon-image"><img src="${p.image}" alt="${esc(p.alt)}" width="320" height="320" loading="lazy"></span><span class="story-amazon-copy"><small>AMAZON FIND 0${i+1}</small><strong>${esc(p.title)}</strong><em>${esc(p.quip)}</em><b>SEE THE EXACT ITEM →</b></span></a>`).join('');
  const shareText = enc(`${title}\n${url}`);
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:story.title,description,image:[image],datePublished:'2026-09-10',dateModified:'2026-09-10',mainEntityOfPage:url,author:{'@type':'Organization',name:'Blappos',url:'https://blappos.com'},publisher:{'@type':'Organization',name:'Blappos',url:'https://blappos.com',logo:{'@type':'ImageObject',url:'https://blappos.com/assets/blappos-logo.png'}}}).replaceAll('<','\\u003c');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}"><meta property="article:published_time" content="2026-09-10">
<meta name="theme-color" content="#d94a2b"><link rel="icon" type="image/png" href="../../assets/blappos-logo.png"><link rel="apple-touch-icon" href="../../assets/blappos-logo.png"><link rel="stylesheet" href="../../styles.css"><script type="application/ld+json">${schema}</script></head>
<body class="story-page"><header class="masthead"><a class="logo" href="../../" aria-label="Blappos home"><img src="../../assets/blappos-logo.png" alt="Blappos — Bad news. Great magnet." width="900" height="600"></a></header><main><article class="story standalone-story">
<img src="${image}" alt="Satirical Blappos illustration: ${esc(story.title)}" width="1000" height="1000"><div class="story-copy"><span class="label">THE STORY BEHIND THE SATIRE · ${esc(story.place)} · Sep 10, 2026</span><h1>${esc(story.title)}</h1>
<h2>What happened</h2><p>${esc(story.facts)}</p><h2>Why it matters</h2><p>${esc(story.why)}</p><h2>The Blappos angle</h2><p>${esc(story.angle)}</p><a class="source" href="${story.source}" target="_blank" rel="noopener">${esc(story.sourceName)} ↗</a><p class="disclosure">Blappos is commentary. Artwork is illustration—not documentary photography—and the joke is not a substitute for the linked reporting.</p>
<section class="story-share" aria-label="Share this story"><span>SPREAD THE BAD NEWS</span><h2>Share this disaster</h2><p>Send the permanent story link—with this story’s illustration—to somebody who needs to see it.</p><div class="story-share-links"><button class="share-primary" type="button" data-share-native>SHARE ↗</button><a href="sms:?&body=${shareText}">TEXT</a><a href="https://www.facebook.com/sharer/sharer.php?u=${enc(url)}" target="_blank" rel="noopener">FACEBOOK</a><a href="https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}" target="_blank" rel="noopener">X</a><a href="https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}" target="_blank" rel="noopener">REDDIT</a><a href="mailto:?subject=${enc(title)}&body=${shareText}">EMAIL</a><button type="button" data-copy-link>COPY LINK</button></div><span class="share-status" aria-live="polite"></span></section>
<section class="story-magnet" aria-label="Buy this Blappos magnet"><span>NOW A PHYSICAL OBJECT</span><h2>Put this disaster on your refrigerator.</h2><p>A 3-inch square Blappos magnet, printed to order and shipped by Printify.</p><a id="magnet-link" href="../../merch/">MAGNET IS ENTERING PRODUCTION ↗</a><small>Product link updates automatically after Printify publishes it.</small></section>
<section class="story-amazon" aria-label="Relevant Amazon finds"><h2>Three ridiculously relevant Amazon finds</h2><div class="story-amazon-links">${productCards}</div><p class="story-amazon-disclosure">As an Amazon Associate, Blappos may earn from qualifying purchases. Product availability and pricing can change.</p></section><p><a class="button" href="../../#${story.id}">View this story on Blappos</a></p></div></article></main>
<script src="../../daily-data.js"></script><script>const shareUrl=document.querySelector('link[rel="canonical"]').href;async function copyLink(button){try{await navigator.clipboard.writeText(shareUrl)}catch{const field=document.createElement('textarea');field.value=shareUrl;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();document.execCommand('copy');field.remove()}button.closest('.story-share').querySelector('.share-status').textContent='LINK COPIED'}document.querySelector('[data-share-native]').addEventListener('click',async event=>{if(navigator.share){try{await navigator.share({title:document.title,text:'The story behind this Blappos disaster.',url:shareUrl});return}catch(error){if(error.name==='AbortError')return}}await copyLink(event.currentTarget)});document.querySelector('[data-copy-link]').addEventListener('click',event=>copyLink(event.currentTarget));const liveStory=(window.dailyStories||[]).find(story=>story.id==='${story.id}');if(liveStory?.magnetUrl){const link=document.querySelector('#magnet-link');link.href=liveStory.magnetUrl;link.target='_blank';link.rel='noopener';link.textContent='BUY THIS MAGNET — '+(liveStory.magnetPrice||'$9.99')+' ↗';link.nextElementSibling.textContent='Shipping calculated by Printify.'}</script></body></html>`;
}

for (const story of stories) {
  const dir = path.join('stories', story.id); fs.mkdirSync(dir, {recursive:true}); fs.writeFileSync(path.join(dir,'index.html'), page(story));
}

let sitemap = fs.readFileSync('sitemap.xml','utf8');
for (const story of stories) {
  const entry = `  <url><loc>https://blappos.com/stories/${story.id}/</loc><lastmod>2026-09-10</lastmod></url>`;
  if (!sitemap.includes(`/stories/${story.id}/`)) sitemap = sitemap.replace('</urlset>', `${entry}\n</urlset>`);
}
sitemap = sitemap.replace('<url><loc>https://blappos.com/</loc><lastmod>2026-09-11</lastmod>', '<url><loc>https://blappos.com/</loc><lastmod>2026-09-11</lastmod>');
fs.writeFileSync('sitemap.xml', sitemap);
