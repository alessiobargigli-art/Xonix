(() => {
 const defs=[
  ['basic','BASIC',1,1,'bounce','multiball'],
  ['eye','EYE',1,1,'watcher','lockon'],
  ['spider','SPIDER',1.05,1,'zigzag','web'],
  ['ghost','GHOST',1.05,.98,'drift','phase'],
  ['hornet','HORNET',.95,1.08,'dash','sting'],
  ['spike','SPIKE',1,1.02,'ricochet','spikeburst'],
  ['ufo','UFO',1.15,.95,'curve','tractor'],
  ['octopus','OCTOPUS',1.05,1,'wobble','ink'],
  ['bot','BOT',1,1.03,'grid','targeting'],
  ['bat','BAT',1.15,1.06,'erratic','swarm'],
  ['crystal','CRYSTAL',1.05,1,'mirror','refraction'],
  ['star','STAR',1.05,1,'hunterburst','homing'],
  ['rock','ROCK',1,.82,'heavy','quake'],
  ['slime','SLIME',1.15,.9,'stretch','split'],
  ['fire','FIRE',1,1.12,'frenzy','overheat'],
  ['orbit','ORBIT',1,1.04,'spiral','gravity'],
  ['squid','SQUID',1.1,1,'pulse','teleport'],
  ['beetle','BEETLE',1.1,.98,'charge','ram']
 ];
 const makeImage=id=>{const im=new Image();im.src='enemies/sprites/'+id+'.png?v=0.3.39';return im};
 window.XONIX_PLAYER_SPRITE=makeImage('player');
 window.XONIX_ENEMIES=defs.map(([id,label,size,speedMultiplier,movement,eliteSpecial])=>({
  id,label,size,movement,speedMultiplier,eliteSpecial,image:makeImage(id),
  draw(ctx,x,y,r){
   const im=this.image;if(!im||!im.complete||!im.naturalWidth){ctx.beginPath();ctx.fillStyle='#ff5470';ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();return;}
   const maxSide=r*3.8,w0=im.naturalWidth,h0=im.naturalHeight,scale=maxSide/Math.max(w0,h0),w=w0*scale,h=h0*scale;
   ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,x-w/2,y-h/2,w,h);ctx.restore();
  }
 }));
})();