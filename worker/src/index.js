export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null,{headers:cors});
    const u=new URL(request.url);
    if(u.pathname!=="/api/images") return json({error:"not_found"},404,cors);
    if(!env.PEXELS_API_KEY) return json({error:"pexels_not_configured"},503,cors);

    const tags=(u.searchParams.get("tags")||"").split(",").map(x=>x.trim()).filter(Boolean).slice(0,8);
    const limit=Math.min(Math.max(Number(u.searchParams.get("limit"))||20,1),20);
    if(!tags.length) return json({images:[],provider:"pexels"},200,cors);

    // One normalized Pexels search per game start: saves quota and lets Pexels
    // interpret multiple user tags as one semantic query.
    const query=tags.join(" ");
    const api=new URL("https://api.pexels.com/v1/search");
    api.searchParams.set("query",query);
    api.searchParams.set("orientation","landscape");
    api.searchParams.set("locale","it-IT");
    api.searchParams.set("per_page",String(Math.min(80,Math.max(limit*2,20))));

    const upstream=await fetch(api,{headers:{Authorization:env.PEXELS_API_KEY}});
    if(!upstream.ok) return json({error:"pexels_error",status:upstream.status},502,cors);
    const data=await upstream.json();
    const photos=Array.isArray(data.photos)?data.photos:[];
    shuffle(photos);
    const images=photos.slice(0,limit).map(p=>({
      id:p.id,
      url:p.src?.landscape||p.src?.large||p.src?.medium,
      photoUrl:p.url,
      photographer:p.photographer,
      photographerUrl:p.photographer_url,
      alt:p.alt||"",
      provider:"Pexels"
    })).filter(x=>x.url);
    return json({images,provider:"pexels",query,count:images.length},200,{...cors,"Cache-Control":"public, max-age=3600"});
  }
};
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}
function json(body,status,headers){return new Response(JSON.stringify(body),{status,headers:{...headers,"Content-Type":"application/json; charset=utf-8"}})}
