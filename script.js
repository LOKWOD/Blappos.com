const dailyStories=window.dailyStories||[];
const baseArchive=window.archiveStories||[];
const latestIso=[...new Set(dailyStories.map(story=>story.isoDate).filter(Boolean))].sort().at(-1);
const stories=latestIso?dailyStories.filter(story=>story.isoDate===latestIso):baseArchive.slice(-8).reverse();
const monthOrder=['January','February','March','April','May','June','July','August','September','October','November','December'];
const archiveStories=[...baseArchive,...dailyStories]
 .filter((story,index,list)=>list.findIndex(item=>item.id===story.id)===index)
 .sort((a,b)=>monthOrder.indexOf(a.month)-monthOrder.indexOf(b.month)||Number.parseInt(a.date.match(/\d+/)?.[0]||0,10)-Number.parseInt(b.date.match(/\d+/)?.[0]||0,10));
const allStories=archiveStories;
const dailyFinds=window.dailyFinds||[];
const grid=document.querySelector('#card-grid');
const dialog=document.querySelector('#story-dialog');
const content=document.querySelector('#story-content');
const archiveImageAliases={'jan-caracas':'caracas','jan-minnesota':'minneapolis','feb-shutdown':'washington','may-longview':'longview','sep-typhoon':'coastal-china','sep-nepal':'nepal'};
function imageForStory(story){return story.image||`assets/cards/${archiveImageAliases[story.id]||story.id}.webp`}
function card(story,index){const image=imageForStory(story);return `<button class="news-card" data-story="${story.id}"><img src="${image}" alt="Satirical Blappos illustration: ${story.title}" width="1000" height="1000" ${index>2?'loading="lazy"':''}><span class="card-meta"><span>${story.place}</span><span>${story.date}</span></span><h3>${story.title}</h3><span class="read">FLIP FOR THE REAL STORY →</span></button>`}
grid.innerHTML=stories.map(card).join('');
function syncHero(){const story=stories[0];if(!story)return;const hero=document.querySelector('.hero-card');if(!hero)return;hero.dataset.story=story.id;hero.setAttribute('aria-label',`Read the real story behind ${story.title}`);const img=hero.querySelector('img');if(img){img.src=imageForStory(story);img.alt=`Featured Blappos illustration for ${story.title}`}}
syncHero();
function openStory(id){const story=allStories.find(item=>item.id===id);if(!story)return;const facts=story.facts||story.dek;const why=story.why||'The event became part of a larger argument about public responsibility, power and the cost carried by ordinary people.';const angle=story.angle||story.title;const image=imageForStory(story);const visual=`<img src="${image}" alt="Satirical illustrated Blappos card for ${story.place}" width="1000" height="1000">`;content.innerHTML=`<article class="story">${visual}<div class="story-copy"><span class="label">THE STORY BEHIND THE SATIRE · ${story.place} · ${story.date}</span><h2 id="story-title">${story.title}</h2><h4>What happened</h4><p>${facts}</p><h4>Why it matters</h4><p>${why}</p><h4>The Blappos angle</h4><p>${angle}</p><a class="source" href="${story.source}" target="_blank" rel="noopener">${story.sourceName||'Read the reporting'} ↗</a><p class="disclosure">Blappos is commentary. Artwork is illustration—not documentary photography—and the joke is not a substitute for the linked reporting.</p></div></article>`;if(dialog.open)dialog.close();dialog.showModal();history.replaceState(null,'',`#${id}`)}
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-story]');if(trigger)openStory(trigger.dataset.story)});
document.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
dialog.addEventListener('close',()=>history.replaceState(null,'',location.pathname));
const archiveGrid=document.querySelector('#archive-grid');
const filters=document.querySelector('#month-filters');
const months=[...new Set(archiveStories.map(story=>story.month).filter(Boolean))];
function archiveCard(story){return `<button class="news-card" data-story="${story.id}"><img src="${imageForStory(story)}" alt="Satirical Blappos illustration: ${story.title}" width="1000" height="1000" loading="lazy"><span class="card-meta"><span>${story.place}</span><span>${story.date}</span></span><h3>${story.title}</h3><span class="read">FLIP FOR THE REAL STORY →</span></button>`}
function renderArchive(month='All'){archiveGrid.innerHTML=archiveStories.filter(story=>month==='All'||story.month===month).map(archiveCard).join('');document.querySelectorAll('#month-filters button').forEach(button=>button.classList.toggle('active',button.dataset.month===month))}
filters.innerHTML=['All',...months].map(month=>`<button data-month="${month}">${month}</button>`).join('');
filters.addEventListener('click',event=>{const button=event.target.closest('[data-month]');if(button)renderArchive(button.dataset.month)});
renderArchive();
const findsGrid=document.querySelector('#finds-grid');
if(findsGrid){findsGrid.innerHTML=dailyFinds.map(find=>{const story=allStories.find(item=>item.id===find.storyId);return `<article class="find-card"><a class="find-image" href="${find.url}" target="_blank" rel="sponsored nofollow noopener"><img src="${find.image}" alt="${find.alt}" width="600" height="600" loading="lazy"></a><div class="find-copy"><span>RIDICULOUSLY RELEVANT TO</span><button data-story="${find.storyId}">${story?.title||'Today’s story'} →</button><h3>${find.title}</h3><p>${find.quip}</p><a class="shop-link" href="${find.url}" target="_blank" rel="sponsored nofollow noopener">SEE THE EXACT ITEM ON AMAZON ↗</a></div></article>`}).join('')}
const initial=location.hash.slice(1);if(allStories.some(story=>story.id===initial))openStory(initial);
