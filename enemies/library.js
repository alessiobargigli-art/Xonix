(() => {
 const circle=(fill,eye=null)=> (ctx,x,y,r)=>{
  ctx.save();ctx.translate(x,y);ctx.shadowColor=fill;ctx.shadowBlur=r*.7;ctx.fillStyle=fill;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  if(eye){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,r*.45,0,Math.PI*2);ctx.fill();ctx.fillStyle=eye;ctx.beginPath();ctx.arc(r*.08,0,r*.2,0,Math.PI*2);ctx.fill()}
  ctx.restore();
 };
 const legs=(fill,n=6)=> (ctx,x,y,r)=>{
  ctx.save();ctx.translate(x,y);ctx.strokeStyle=fill;ctx.lineWidth=Math.max(2,r*.22);for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.6,Math.sin(a)*r*.6);ctx.lineTo(Math.cos(a)*r*1.35,Math.sin(a)*r*1.35);ctx.stroke()}circle(fill,'#111')(ctx,0,0,r*.75);ctx.restore();
 };
 const diamond=fill=>(ctx,x,y,r)=>{ctx.save();ctx.translate(x,y);ctx.fillStyle=fill;ctx.shadowColor=fill;ctx.shadowBlur=r;ctx.beginPath();ctx.moveTo(0,-r*1.25);ctx.lineTo(r,0);ctx.lineTo(0,r*1.25);ctx.lineTo(-r,0);ctx.closePath();ctx.fill();ctx.restore()};
 const star=fill=>(ctx,x,y,r)=>{ctx.save();ctx.translate(x,y);ctx.fillStyle=fill;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r*1.25;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,r*.3,0,Math.PI*2);ctx.fill();ctx.restore()};
 const defs=[
  ['basic','BASIC',1,1,circle('#ff5470','#111')],['eye','EYE',1,1,circle('#45d84a','#164aa8')],['spider','SPIDER',1.05,1,legs('#3787ff',8)],
  ['ghost','GHOST',1.05,.98,circle('#ad62e8','#111')],['hornet','HORNET',.95,1.08,legs('#ffad18',4)],['spike','SPIKE',1,1.02,star('#ff3d4f')],
  ['ufo','UFO',1.15,.95,diamond('#28c8ff')],['octopus','OCTOPUS',1.05,1,legs('#ff4ba4',6)],['bot','BOT',1,1.03,circle('#f2a51a','#d71920')],
  ['bat','BAT',1.15,1.06,diamond('#50cf4c')],['crystal','CRYSTAL',1.05,1,diamond('#34dff3')],['star','STAR',1.05,1,star('#ff4869')],
  ['rock','ROCK',1.35,.82,circle('#7d8795','#d71920')],['slime','SLIME',1.15,.9,circle('#66d83f','#111')],['fire','FIRE',1,1.12,diamond('#ff8a17')],
  ['orbit','ORBIT',1,1.04,star('#2589ff')],['squid','SQUID',1.1,1,legs('#a34de0',6)],['beetle','BEETLE',1.1,.98,legs('#d99012',6)]
 ];
 window.XONIX_ENEMIES=defs.map(([id,label,size,speedMultiplier,draw])=>({id,label,size,movement:'bounce',speedMultiplier,specials:[],draw}));
})();