(() => {
 const defs=[
  ['basic','BASIC',1,1],['eye','EYE',1,1],['spider','SPIDER',1.05,1],['ghost','GHOST',1.05,.98],['hornet','HORNET',.95,1.08],['spike','SPIKE',1,1.02],
  ['ufo','UFO',1.15,.95],['octopus','OCTOPUS',1.05,1],['bot','BOT',1,1.03],['bat','BAT',1.15,1.06],['crystal','CRYSTAL',1.05,1],['star','STAR',1.05,1],
  ['rock','ROCK',1.35,.82],['slime','SLIME',1.15,.9],['fire','FIRE',1,1.12],['orbit','ORBIT',1,1.04],['squid','SQUID',1.1,1],['beetle','BEETLE',1.1,.98]
 ];
 const makeImage=id=>{const im=new Image();im.src='enemies/sprites/'+id+'.png?v=0.3.36';return im};
 window.XONIX_PLAYER_SPRITE=makeImage('player');
 window.XONIX_ENEMIES=defs.map(([id,label,size,speedMultiplier])=>({
  id,label,size,movement:'bounce',speedMultiplier,specials:[],image:makeImage(id),
  draw(ctx,x,y,r){
   const im=this.image;if(!im||!im.complete||!im.naturalWidth){ctx.beginPath();ctx.fillStyle='#ff5470';ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();return;}
   const maxSide=r*3.8,w0=im.naturalWidth,h0=im.naturalHeight,scale=maxSide/Math.max(w0,h0),w=w0*scale,h=h0*scale;
   ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,x-w/2,y-h/2,w,h);ctx.restore();
  }
 }));
})();