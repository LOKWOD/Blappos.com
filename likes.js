(() => {
  const namespace='blappos.com';
  const action='like';
  let ready;
  function loadApi(){
    if(window.counterApi)return Promise.resolve(window.counterApi);
    if(ready)return ready;
    ready=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://counterapi.com/counterapi.embed.js';
      script.async=true;
      script.onload=()=>window.counterApi?resolve(window.counterApi):reject(new Error('CounterAPI unavailable'));
      script.onerror=()=>reject(new Error('CounterAPI load failed'));
      document.head.append(script);
    });
    return ready;
  }
  function readCount(id){
    return loadApi().then(api=>new Promise((resolve,reject)=>{
      api.read(id,action,namespace,{behavior:'vote'},(err,res)=>err?reject(err):resolve(res));
    }));
  }
  function increment(id){
    return loadApi().then(api=>new Promise((resolve,reject)=>{
      api.increment(id,action,namespace,{behavior:'vote'},(err,res)=>err?reject(err):resolve(res));
    }));
  }
  function clientId(){
    try{
      let id=localStorage.getItem('blappos-like-client');
      if(!id){id=crypto.randomUUID?crypto.randomUUID():`b-${Date.now()}-${Math.random().toString(36).slice(2)}`;localStorage.setItem('blappos-like-client',id)}
      return id;
    }catch{return 'anonymous'}
  }
  function likedSet(){try{return new Set(JSON.parse(localStorage.getItem('blappos-liked-stories')||'[]'))}catch{return new Set()}}
  function save(set){try{localStorage.setItem('blappos-liked-stories',JSON.stringify([...set]))}catch{}}
  function storyId(){
    const parts=location.pathname.split('/').filter(Boolean);
    return parts[0]==='stories'&&parts[1]?parts[1]:null;
  }
  function makeButton(id,liked){
    const button=document.createElement('button');
    button.type='button';button.className='like-button'+(liked?' liked':'');button.dataset.likeStory=id;
    button.setAttribute('aria-pressed',String(liked));button.setAttribute('aria-label',liked?'You liked this Blappos':'Like this Blappos');
    button.innerHTML=`<span class="like-heart" aria-hidden="true">${liked?'♥':'♡'}</span><span class="like-count" data-like-count>0</span>`;
    return button;
  }
  async function load(button){
    try{
      const data=await readCount(button.dataset.likeStory);
      button.querySelector('[data-like-count]').textContent=Number(data.value||0).toLocaleString();
    }catch{button.classList.add('likes-offline')}
  }
  const id=storyId();if(!id)return;
  const liked=likedSet();
  const title=document.querySelector('.standalone-story .story-copy>h1');
  if(!title)return;
  const button=makeButton(id,liked.has(id));
  title.insertAdjacentElement('afterend',button);
  load(button);
  button.addEventListener('click',async()=>{
    if(liked.has(id))return;
    button.disabled=true;
    try{
      const data=await increment(id);
      liked.add(id);save(liked);button.classList.add('liked');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','You liked this Blappos');
      button.querySelector('.like-heart').textContent='♥';button.querySelector('[data-like-count]').textContent=Number(data.value||0).toLocaleString();
    }catch{button.classList.add('likes-offline')}
    finally{button.disabled=false}
  });
})();
// Shared Blappos likes enabled on homepage, archive, and story pages.
