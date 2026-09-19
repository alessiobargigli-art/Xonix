(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=96,H=60,C=10;
const EMPTY=0,LAND=1,TRAIL=2;
let grid,player,enemies,dir={x:0,y:0},nextDir={x:0,y:0},running=false,paused=false,lives=3,level=1,score=0,target=.72,last=0,acc=0;
const ui={level:document.getElementById('level'),lives:document.getElementById('lives'),area:document.getElementById('area'),score:document.getElementById('score'),overlay:document.getElementById('overlay')};

function resetLevel(){
 grid=Array.from({length:H},()=>Array(W).fill(EMPTY));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<3||y<3||x>=W-3||y>=H-3)grid[y][x]=LAND;
 player={x:Math.floor(W/2),y:H-2,onTrail:false};
 dir={x:0,y:0};nextDir={x:0,y:0};
 enemies=[];
 const count=Math.min(2+level,8);
 for(let i=0;i<count;i++) enemies.push({x:15+Math.random()*(W-30),y:12+Math.random()*(H-24),vx:(Math.random()<.5?-1:1)*(4+level*.35),vy:(Math.random()<.5?-1:1)*(3.5+level*.3),r:1.1});
 updateUI();
}
function landRatio(){let n=0;for(const row of grid)for(const c of row)if(c===LAND)n++;return n/(W*H)}
function updateUI(){ui.level.textContent=level;ui.lives.textContent=lives;ui.area.textContent=Math.floor(landRatio()*100)+'%';ui.score.textContent=score}
function setDir(x,y){nextDir={x,y}}
function stepPlayer(){
 if(nextDir.x||nextDir.y){if(!(dir.x===-nextDir.x&&dir.y===-nextDir.y)){dir=nextDir}}
 if(!dir.x&&!dir.y)return;
 const nx=player.x+dir.x,ny=player.y+dir.y;
 if(nx<0||ny<0||nx>=W||ny>=H)return;
 const current=grid[player.y][player.x],dest=grid[ny][nx];
 if(dest===TRAIL){loseLife();return}
 if(current===LAND&&dest===EMPTY){player.onTrail=true}
 if(player.onTrail&&dest===EMPTY)grid[ny][nx]=TRAIL;
 player.x=nx;player.y=ny;
 if(player.onTrail&&dest===LAND){capture();player.onTrail=false}
}
function capture(){
 const seen=Array.from({length:H},()=>Array(W).fill(false)),q=[];
 for(const e of enemies){const x=Math.max(0,Math.min(W-1,Math.floor(e.x))),y=Math.max(0,Math.min(H-1,Math.floor(e.y)));if(grid[y][x]===EMPTY&&!seen[y][x]){seen[y][x]=true;q.push([x,y])}}
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&!seen[ny][nx]&&grid[ny][nx]===EMPTY){seen[ny][nx]=true;q.push([nx,ny])}}}
 let filled=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(grid[y][x]===TRAIL){grid[y][x]=LAND;filled++}else if(grid[y][x]===EMPTY&&!seen[y][x]){grid[y][x]=LAND;filled++}}
 score+=filled*10*level;
 if(landRatio()>=target){score+=1000*level;level++;resetLevel()}
 updateUI();
}
function clearTrail(){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===TRAIL)grid[y][x]=EMPTY}
function loseLife(){
 clearTrail();lives--;player={x:Math.floor(W/2),y:H-2,onTrail:false};dir={x:0,y:0};nextDir={x:0,y:0};updateUI();
 if(lives<=0){running=false;ui.overlay.classList.remove('hidden');ui.overlay.querySelector('h1').textContent='GAME OVER';ui.overlay.querySelector('p').textContent='Punteggio '+score;document.getElementById('startBtn').textContent='RIPROVA'}
}
function updateEnemies(dt){
 for(const e of enemies){
  let nx=e.x+e.vx*dt,ny=e.y+e.vy*dt;
  const hit=(x,y)=>{const gx=Math.floor(x),gy=Math.floor(y);return gx<0||gy<0||gx>=W||gy>=H||grid[gy][gx]===LAND};
  if(hit(nx,e.y)){e.vx*=-1;nx=e.x+e.vx*dt}
  if(hit(e.x,ny)){e.vy*=-1;ny=e.y+e.vy*dt}
  e.x=nx;e.y=ny;
  const gx=Math.floor(e.x),gy=Math.floor(e.y);
  if(gx>=0&&gy>=0&&gx<W&&gy<H&&grid[gy][gx]===TRAIL){loseLife();return}
  const dx=e.x-(player.x+.5),dy=e.y-(player.y+.5);if(dx*dx+dy*dy<1.5&&player.onTrail){loseLife();return}
 }
}
function update(dt){acc+=dt;updateEnemies(dt);while(acc>.045){stepPlayer();acc-=.045}}
function draw(){
 ctx.fillStyle='#02060c';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=grid[y][x];if(c===LAND){ctx.fillStyle='#0f708c';ctx.fillRect(x*C,y*C,C,C)}else if(c===TRAIL){ctx.fillStyle='#f9e45b';ctx.fillRect(x*C,y*C,C,C)}}
 ctx.fillStyle='#eaf6ff';ctx.fillRect(player.x*C+1,player.y*C+1,C-2,C-2);
 for(const e of enemies){ctx.beginPath();ctx.fillStyle='#ff5470';ctx.arc(e.x*C,e.y*C,e.r*C,0,Math.PI*2);ctx.fill()}
}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;if(running&&!paused)update(dt);draw();requestAnimationFrame(loop)}
function start(){lives=3;level=1;score=0;running=true;paused=false;ui.overlay.classList.add('hidden');resetLevel()}
document.getElementById('startBtn').addEventListener('click',start);
document.getElementById('pauseBtn').addEventListener('click',()=>{if(running){paused=!paused;document.getElementById('pauseBtn').textContent=paused?'RIPRENDI':'PAUSA'}});
const keys={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};
addEventListener('keydown',e=>{if(keys[e.key]){e.preventDefault();setDir(...keys[e.key])}if(e.key===' '){paused=!paused}});
document.querySelectorAll('[data-dir]').forEach(b=>{const m={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};const go=e=>{e.preventDefault();setDir(...m[b.dataset.dir])};b.addEventListener('pointerdown',go);b.addEventListener('touchstart',go,{passive:false})});
let sx=0,sy=0;
canvas.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});
canvas.addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>20){if(Math.abs(dx)>Math.abs(dy))setDir(Math.sign(dx),0);else setDir(0,Math.sign(dy))}});
resetLevel();requestAnimationFrame(loop);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();