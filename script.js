const products=[...document.querySelectorAll('.product')];
const filterButtons=[...document.querySelectorAll('[data-filter]')];
function applyFilter(filter){
  filterButtons.forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
  products.forEach(card=>card.classList.toggle('hidden',filter!=='all'&&card.dataset.category!==filter));
}
filterButtons.forEach(btn=>btn.addEventListener('click',()=>applyFilter(btn.dataset.filter)));

document.querySelectorAll('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>{
  const filter=btn.dataset.jump;
  applyFilter(filter);
  document.querySelector('#finds').scrollIntoView({behavior:'smooth'});
}));

function randomProduct(){
  applyFilter('all');
  const card=products[Math.floor(Math.random()*products.length)];
  card.scrollIntoView({behavior:'smooth',block:'center'});
  card.animate([{transform:'translateY(-3px)',boxShadow:'5px 5px 0 #111'},{transform:'translateY(-3px)',boxShadow:'14px 14px 0 #efff31'},{transform:'translateY(-3px)',boxShadow:'5px 5px 0 #111'}],{duration:900});
}
document.getElementById('randomPick')?.addEventListener('click',randomProduct);
document.getElementById('heroRandom')?.addEventListener('click',randomProduct);

const verdict=document.getElementById('verdict');
document.querySelectorAll('[data-score]').forEach(btn=>btn.addEventListener('click',()=>{
  const s=Number(btn.dataset.score);
  verdict.textContent=s>=11?'BLAPPOS VERDICT: You already measured the shelf. This purchase was decided before you arrived.':s>=7?'BLAPPOS VERDICT: You are in the dangerous research phase. Add to cart, then stare at it for 20 minutes.':'BLAPPOS VERDICT: Close the tab. You are not emotionally committed enough for this level of nonsense.';
}));

const menu=document.querySelector('.menu');
menu?.addEventListener('click',()=>document.querySelector('.topbar')?.classList.toggle('menu-open'));
document.querySelectorAll('.topbar nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.topbar')?.classList.remove('menu-open')));
