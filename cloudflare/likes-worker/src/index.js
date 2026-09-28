const corsHeaders={
  'Access-Control-Allow-Origin':'https://blappos.com',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Cache-Control':'no-store'
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json;charset=UTF-8'}})}
function validStoryId(id){return typeof id==='string'&&/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)}

async function voterHash(request,clientId){
  const ip=request.headers.get('CF-Connecting-IP')||'';
  const ua=request.headers.get('User-Agent')||'';
  const raw=`${clientId}|${ip}|${ua.slice(0,180)}`;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders});
    const url=new URL(request.url);
    if(url.pathname!=='/api/likes')return json({error:'Not found'},404);

    if(request.method==='GET'){
      const ids=(url.searchParams.get('ids')||'').split(',').map(v=>v.trim()).filter(validStoryId).slice(0,100);
      if(!ids.length)return json({counts:{}});
      const placeholders=ids.map(()=>'?').join(',');
      const result=await env.DB.prepare(`SELECT story_id, COUNT(*) AS count FROM likes WHERE story_id IN (${placeholders}) GROUP BY story_id`).bind(...ids).all();
      const counts=Object.fromEntries(ids.map(id=>[id,0]));
      for(const row of result.results||[])counts[row.story_id]=Number(row.count||0);
      return json({counts});
    }

    if(request.method==='POST'){
      let body;
      try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)}
      const storyId=body?.storyId;
      const clientId=typeof body?.clientId==='string'?body.clientId.slice(0,128):'';
      if(!validStoryId(storyId)||!clientId)return json({error:'Invalid like'},400);
      const hash=await voterHash(request,clientId);
      await env.DB.prepare('INSERT OR IGNORE INTO likes (story_id,voter_hash,created_at) VALUES (?,?,CURRENT_TIMESTAMP)').bind(storyId,hash).run();
      const row=await env.DB.prepare('SELECT COUNT(*) AS count FROM likes WHERE story_id=?').bind(storyId).first();
      return json({storyId,count:Number(row?.count||0)});
    }

    return json({error:'Method not allowed'},405);
  }
};