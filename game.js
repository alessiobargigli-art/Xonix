(() => {
function setVhVar(){
 const h=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;
 document.documentElement.style.setProperty('--vh',(h*0.01)+'px');
}
setVhVar();
addEventListener('resize',setVhVar);
addEventListener('orientationchange',()=>setTimeout(setVhVar,60));
if(window.visualViewport)window.visualViewport.addEventListener('resize',setVhVar);
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=96,H=60,C=10,EMPTY=0,LAND=1,TRAIL=2;
const MODES={
 easy:{lives:5,target:.75,balls:2,ballSpeed:2.6,hunterStep:.065},
 normal:{lives:3,target:.75,balls:4,ballSpeed:4.2,hunterStep:.034},
 hard:{lives:3,target:.75,balls:6,ballSpeed:5.2,hunterStep:.024}
};
let difficulty='easy',theme='classic',grid,player,enemies,hunter,dir={x:0,y:0},nextDir={x:0,y:0},inputHeld=false,running=false,paused=false,lives=5,level=1,score=0,last=0,acc=0,hunterAcc=0,timeLeft=120;
let bgImage=null,bgPool=[],lastBg=-1,levelComplete=false,completeUntil=0,completeStarted=0,fireworks=[],advancingLevel=false,lastEnemyType=null,currentEnemyType=null,levelRunTime=0;
const ui={level:document.getElementById('level'),lives:document.getElementById('lives'),area:document.getElementById('area'),time:document.getElementById('time'),score:document.getElementById('score'),overlay:document.getElementById('overlay'),pauseOverlay:document.getElementById('pauseOverlay')};
const bgMusic=document.getElementById('bgMusic'),musicVolume=document.getElementById('musicVolume'),musicVolumeValue=document.getElementById('musicVolumeValue'),muteBtn=document.getElementById('muteBtn');
let musicMuted=localStorage.getItem('xonix.musicMuted')==='1';
let musicLevel=Math.max(0,Math.min(1,Number(localStorage.getItem('xonix.musicVolume')??.35)));
function syncMusicUI(){
 bgMusic.volume=musicLevel;bgMusic.muted=musicMuted;
 musicVolume.value=Math.round(musicLevel*100);musicVolumeValue.textContent=Math.round(musicLevel*100)+'%';
 muteBtn.textContent=musicMuted?'RIATTIVA':'MUTE';muteBtn.classList.toggle('active',musicMuted);
}
function themeMusic(){return themes[theme]?.music||'assets/music/hypnotic-loop.mp3'}
function applyThemeMusic(autoplay=false){
 const src=themeMusic();
 if(bgMusic.dataset.src!==src){bgMusic.dataset.src=src;bgMusic.src=src;bgMusic.load()}
 syncMusicUI();if(autoplay&&bgMusic.paused)bgMusic.play().catch(()=>{});
}
function startMusic(){applyThemeMusic(true)}
let audioCtx=null,lastBounceSound=0;
function audioContext(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return audioCtx}
function tone(freq,duration,volume,type='square',slide=0){
 if(musicMuted||musicLevel<=0)return;
 const ac=audioContext(),o=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime;
 o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),now+duration);
 g.gain.setValueAtTime(Math.max(.0001,volume*musicLevel),now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
 o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+duration);
}
function bounceSound(){
 const now=performance.now();if(now-lastBounceSound<45)return;lastBounceSound=now;
 tone(150,.045,.055,'square',55);
}
function hitSound(){tone(180,.18,.16,'sawtooth',-110);setTimeout(()=>tone(85,.22,.13,'square',-35),65)}
musicVolume.addEventListener('input',()=>{musicLevel=Number(musicVolume.value)/100;localStorage.setItem('xonix.musicVolume',musicLevel);if(musicLevel>0&&musicMuted){musicMuted=false;localStorage.setItem('xonix.musicMuted','0')}syncMusicUI();startMusic()});
muteBtn.addEventListener('click',()=>{musicMuted=!musicMuted;localStorage.setItem('xonix.musicMuted',musicMuted?'1':'0');syncMusicUI();if(!musicMuted)startMusic()});
syncMusicUI();

const ACCESS_CODES={BTSEXY:'btsexy',FRIENDS:'friends'};
const ACCESS_KEY='xonix.accessGroups';
function accessGroups(){
 const groups=new Set(['public']);
 try{for(const g of JSON.parse(localStorage.getItem(ACCESS_KEY)||'[]'))if(g==='btsexy'||g==='friends')groups.add(g)}catch{}
 return groups;
}
function saveAccessGroups(groups){localStorage.setItem(ACCESS_KEY,JSON.stringify([...groups].filter(g=>g!=='public')))}
function themeVisible(t){
 const visibility=Array.isArray(t.visibility)&&t.visibility.length?t.visibility:['public'];
 const groups=accessGroups();
 return visibility.some(g=>groups.has(g));
}
function accessLabel(){return [...accessGroups()].map(g=>g.toUpperCase()).join(' · ')}
function applyAccessCode(raw){
 const code=(raw||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
 const group=ACCESS_CODES[code];
 if(!group)return false;
 const groups=accessGroups();groups.add(group);saveAccessGroups(groups);syncAccessUI();renderThemeButtons();
 return true;
}
function removeAccessGroup(group){
 if(group==='public')return;
 const groups=accessGroups();groups.delete(group);saveAccessGroups(groups);
 if(!themeVisible(themes[theme]))selectTheme('classic');else renderThemeButtons();
 syncAccessUI();
}
function consumeInvite(){
 const url=new URL(location.href),invite=url.searchParams.get('invite');
 if(!invite)return;
 applyAccessCode(invite);
 url.searchParams.delete('invite');
 history.replaceState(null,'',url.pathname+(url.searchParams.toString()?'?'+url.searchParams:'')+url.hash);
}

let themes={classic:{id:'classic',label:'CLASSICO',type:'classic'}};\nlet bgMetaPool=[],bgMeta=null;
const REMOTE_THEME={id:'remote',label:'ONLINE',type:'remote'};
themes.remote=REMOTE_THEME;
const REMOTE_ENDPOINT_KEY='xonix.remoteEndpoint',REMOTE_TAGS_KEY='xonix.remoteTags';
const remoteThemeBox=document.getElementById('remoteThemeBox'),remoteTags=document.getElementById('remoteTags');
remoteTags.value=localStorage.getItem(REMOTE_TAGS_KEY)||'';
remoteTags.addEventListener('input',()=>localStorage.setItem(REMOTE_TAGS_KEY,remoteTags.value));
function remoteEndpoint(){return (localStorage.getItem(REMOTE_ENDPOINT_KEY)||'/api/images').trim()}
function remoteTagList(){return remoteTags.value.split(/[#,;\s]+/).map(x=>x.trim()).filter(Boolean).slice(0,8)}
function syncRemoteThemeUI(){remoteThemeBox.classList.toggle('hidden',theme!=='remote')}
async function loadRemoteBackgrounds(){
 bgPool=[];bgImage=null;lastBg=-1;
 const tags=remoteTagList();if(!tags.length)return;
 const url=new URL(remoteEndpoint(),location.href);url.searchParams.set('tags',tags.join(','));url.searchParams.set('limit','20');
 const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('remote '+r.status);
 const data=await r.json();const items=Array.isArray(data)?data:(Array.isArray(data.images)?data.images:[]);
 bgMetaPool=items.map(x=>typeof x==='string'?{url:x}:x).filter(x=>x&&(x.url||x.image||x.src)).slice(0,20);\n bgPool=bgMetaPool.map(x=>x.url||x.image||x.src);
 if(bgPool.length)await pickBackground();
}

function loadThemes(){
 return fetch('backgrounds/themes.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]).then(list=>{
  if(Array.isArray(list))for(const t of list)if(t&&t.id)themes[t.id]=t;
  renderThemeButtons();return loadThemeBackgrounds(theme);
 }).catch(()=>renderThemeButtons());
}
function renderThemeButtons(){
 const box=document.getElementById('themeButtons');box.innerHTML='';
 const visible=Object.values(themes).filter(themeVisible);
 if(!visible.some(t=>t.id===theme))theme='classic';
 visible.forEach(t=>{const b=document.createElement('button');b.className='theme'+(t.id===theme?' active':'');b.dataset.theme=t.id;b.textContent=t.label||t.id.toUpperCase();b.addEventListener('click',()=>selectTheme(t.id));box.appendChild(b)});
}
function selectTheme(id){
 theme=id;document.querySelectorAll('.theme').forEach(x=>x.classList.toggle('active',x.dataset.theme===id));syncRemoteThemeUI();applyThemeMusic(!bgMusic.paused);return loadThemeBackgrounds(id);
}
function loadThemeBackgrounds(id){
 const t=themes[id];bgPool=[];bgMetaPool=[];bgMeta=null;bgImage=null;lastBg=-1;
 if(!t||t.type==='classic')return Promise.resolve();
 if(t.type==='remote')return loadRemoteBackgrounds().catch(()=>{bgPool=[];bgImage=null});
 if(!t.path)return Promise.resolve();
 return fetch('backgrounds/'+t.path+'/backgrounds.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]).then(files=>{bgPool=Array.isArray(files)?files.map(x=>'backgrounds/'+t.path+'/'+x):[];return bgPool.length?pickBackground():undefined}).catch(()=>{bgPool=[]});
}
function pickBackground(){
 const t=themes[theme];if(!t||t.type==='classic'||!bgPool.length){bgImage=null;return Promise.resolve()}
 let i=Math.floor(Math.random()*bgPool.length);if(bgPool.length>1&&i===lastBg)i=(i+1)%bgPool.length;
 lastBg=i;bgMeta=bgMetaPool[i]||null;return new Promise(resolve=>{const im=new Image();im.onload=()=>{bgImage=im;resolve()};im.onerror=()=>{bgImage=null;resolve()};im.src=bgPool[i]});
}
function pickEnemyType(){
 const lib=window.XONIX_ENEMIES||[];
 if(!lib.length)return {id:'basic',size:1,movement:'bounce',speedMultiplier:1,specials:[],draw:null};
 let pool=lib.filter(x=>x.id!==lastEnemyType);if(!pool.length)pool=lib;
 const type=pool[Math.floor(Math.random()*pool.length)];lastEnemyType=type.id;return type;
}
function resetLevel(){
 levelComplete=false;completeUntil=0;completeStarted=0;fireworks=[];timeLeft=120;levelRunTime=0;currentEnemyType=pickEnemyType();
 grid=Array.from({length:H},()=>Array(W).fill(EMPTY));
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(x<2||y<2||x>=W-2||y>=H-2)grid[y][x]=LAND;
 player={x:Math.floor(W/2),y:0,onTrail:false};
 hunter={x:Math.floor(W/2),y:H-1,vx:1,vy:-1};hunterAcc=0;
 dir={x:0,y:0};nextDir={x:0,y:0};inputHeld=false;enemies=[];
 const m=MODES[difficulty],wins=level-1,extraBalls=Math.ceil(wins/2),speedUps=Math.floor(wins/2);
 const count=Math.min(m.balls+extraBalls,12),s=m.ballSpeed*Math.pow(1.12,speedUps);
 const eliteIndex=Math.floor(Math.random()*count);
 for(let i=0;i<count;i++){
  const sm=currentEnemyType.speedMultiplier||1,isElite=i===eliteIndex,baseR=.55*(currentEnemyType.size||1),r=baseR*(isElite?2:1);
  const vx=(Math.random()<.5?-1:1)*4.25*s*sm,vy=(Math.random()<.5?-1:1)*3.72*s*sm;
  enemies.push({x:15+Math.random()*(W-30),y:12+Math.random()*(H-24),vx,vy,baseVx:vx,baseVy:vy,r,type:currentEnemyType,isElite,
   age:0,patternClock:Math.random()*3,specialClock:isElite?3+Math.random()*2:999,specialTime:0,specialState:null,specialWindup:0,trail:[],clones:[]});
 }
 if(themes[theme]?.type==='classic')bgImage=null;updateUI();
}
const INITIAL_LAND=W*H-(W-4)*(H-4),CAPTURABLE_CELLS=W*H-INITIAL_LAND;
function capturedRatio(){let land=0;for(const row of grid)for(const c of row)if(c===LAND)land++;return Math.max(0,land-INITIAL_LAND)/CAPTURABLE_CELLS}
function updateUI(){ui.level.textContent=level;ui.lives.textContent=lives;ui.area.textContent=(capturedRatio()*100).toFixed(1)+'%';const s=Math.max(0,Math.ceil(timeLeft));ui.time.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');ui.time.classList.toggle('urgent',s<=20);ui.score.textContent=score}
function setDir(x,y){nextDir={x,y};dir={x,y}}
function stopPlayer(){inputHeld=false;dir={x:0,y:0};nextDir={x:0,y:0}}
function stepPlayer(){
 if(!inputHeld||(!dir.x&&!dir.y))return;
 const nx=player.x+dir.x,ny=player.y+dir.y;if(nx<0||ny<0||nx>=W||ny>=H)return;
 const current=grid[player.y][player.x],dest=grid[ny][nx];
 if(dest===TRAIL)return;
 if(current===LAND&&dest===EMPTY)player.onTrail=true;
 if(player.onTrail&&dest===EMPTY)grid[ny][nx]=TRAIL;
 player.x=nx;player.y=ny;
 if(player.onTrail&&dest===LAND){capture();player.onTrail=false}
}
function capture(){
 const seen=Array.from({length:H},()=>Array(W).fill(false)),q=[];
 for(const e of enemies){const x=Math.max(0,Math.min(W-1,Math.floor(e.x))),y=Math.max(0,Math.min(H-1,Math.floor(e.y)));if(grid[y][x]===EMPTY&&!seen[y][x]){seen[y][x]=true;q.push([x,y])}}
 for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&!seen[ny][nx]&&grid[ny][nx]===EMPTY){seen[ny][nx]=true;q.push([nx,ny])}}}
 let filled=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(grid[y][x]===TRAIL){grid[y][x]=LAND;filled++}else if(grid[y][x]===EMPTY&&!seen[y][x]){grid[y][x]=LAND;filled++}}
 score+=filled*10*level;
 if(capturedRatio()>=MODES[difficulty].target){score+=1000*level;beginLevelComplete()}
 updateUI();
}
function beginLevelComplete(){
 levelComplete=true;running=false;stopPlayer();completeStarted=performance.now();completeUntil=completeStarted+6000;
 for(let i=0;i<7;i++)setTimeout(()=>spawnFirework(),i*360);
}
function spawnFirework(){
 const cx=120+Math.random()*(canvas.width-240),cy=70+Math.random()*(canvas.height*.58);
 for(let i=0;i<34;i++){const a=Math.random()*Math.PI*2,s=45+Math.random()*150;fireworks.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.7+Math.random()*.7,max:1.4,h:Math.floor(Math.random()*360)})}
}
async function advanceLevel(){
 if(advancingLevel)return;
 advancingLevel=true;
 level++;
 if(themes[theme]?.type!=='classic')await pickBackground();
 resetLevel();
 running=true;
 advancingLevel=false;
}
function updateCelebration(dt,t){
 for(const p of fireworks){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;p.life-=dt}
 fireworks=fireworks.filter(p=>p.life>0);
 if(levelComplete&&t>=completeUntil)advanceLevel();
}
function clearTrail(){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===TRAIL)grid[y][x]=EMPTY}
function respawn(){player={x:Math.floor(W/2),y:0,onTrail:false};hunter={x:Math.floor(W/2),y:H-1,vx:1,vy:-1};dir={x:0,y:0};nextDir={x:0,y:0};inputHeld=false}
function resetEnemySpeedRamp(){
 levelRunTime=0;
 for(const e of enemies){normalizeEnemySpeed(e);e.age=0;e.patternClock=0}
}
function loseLife(){
 hitSound();clearTrail();lives--;respawn();resetEnemySpeedRamp();updateUI();
 if(lives<=0){running=false;ui.overlay.classList.remove('hidden');document.getElementById('menuTitle').textContent='GAME OVER';document.getElementById('menuText').textContent='Punteggio '+score;document.getElementById('difficultyBox').style.display='grid';document.getElementById('startBtn').textContent='RIPROVA'}
}
function steerToward(e,tx,ty,strength){
 const sp=Math.hypot(e.vx,e.vy)||1,dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1;
 e.vx=e.vx*(1-strength)+(dx/d)*sp*strength;e.vy=e.vy*(1-strength)+(dy/d)*sp*strength;
}
function timeSpeedMultiplier(){return Math.min(1.75,1+levelRunTime*.0045)}
function normalizeEnemySpeed(e,mult=1){
 const base=Math.hypot(e.baseVx,e.baseVy)*mult*timeSpeedMultiplier(),sp=Math.hypot(e.vx,e.vy)||1,k=base/sp;
 e.vx*=k;e.vy*=k;
}
function startEliteWindup(e){
 e.specialState=e.type.eliteSpecial;e.specialWindup=1.15;e.specialTime=0;e.specialClock=7+Math.random()*4;
 e.clones=[];
}
function activateEliteSpecial(e){
 const s=e.specialState;e.specialWindup=0;
 if(s==='lockon'||s==='homing'||s==='sting'||s==='ram'||s==='targeting')e.specialTime=2.2;
 else if(s==='phase'||s==='spikeburst'||s==='tractor'||s==='ink'||s==='swarm'||s==='refraction'||s==='split'||s==='overheat'||s==='gravity'||s==='quake')e.specialTime=4;
 else if(s==='multiball'||s==='web')e.specialTime=5;
 else if(s==='teleport'){
  for(let n=0;n<20;n++){const x=8+Math.random()*(W-16),y=8+Math.random()*(H-16);if(grid[Math.floor(y)]?.[Math.floor(x)]===EMPTY){e.x=x;e.y=y;break}}
  e.specialTime=.8;
 }
 if(s==='multiball'||s==='swarm'||s==='refraction'||s==='split')e.clones=[-1,1,2].slice(0,s==='refraction'||s==='split'?2:3).map((k,i)=>({a:(i+1)*2.1,r:2.5+i*.4}));
}
function applyEnemyPattern(e,dt){
 e.age+=dt;e.patternClock+=dt;
 const p=e.type.movement,base=Math.hypot(e.baseVx,e.baseVy),sp=Math.hypot(e.vx,e.vy)||1;
 if(p==='watcher'){if(e.patternClock>.45){e.patternClock=0;steerToward(e,player.x+.5,player.y+.5,.22)}}
 else if(p==='zigzag'&&e.patternClock>.55){e.patternClock=0;const a=Math.atan2(e.vy,e.vx)+(Math.random()<.5?-1:1)*1.0;e.vx=Math.cos(a)*base;e.vy=Math.sin(a)*base}
 else if(p==='drift'){const a=.035*Math.sin(e.age*2.2),c=Math.cos(a),s=Math.sin(a),x=e.vx;e.vx=x*c-e.vy*s;e.vy=x*s+e.vy*c;normalizeEnemySpeed(e)}
 else if(p==='dash'){const phase=e.age%3.2,target=phase<.65?1.65:phase<1.35?1.0:.82;normalizeEnemySpeed(e,target)}
 else if(p==='ricochet'){normalizeEnemySpeed(e,1.08)}
 else if(p==='curve'){const a=.035*dt*60,c=Math.cos(a),s=Math.sin(a),x=e.vx;e.vx=x*c-e.vy*s;e.vy=x*s+e.vy*c;normalizeEnemySpeed(e)}
 else if(p==='wobble'){const a=.05*Math.sin(e.age*6),c=Math.cos(a),s=Math.sin(a),x=e.vx;e.vx=x*c-e.vy*s;e.vy=x*s+e.vy*c;normalizeEnemySpeed(e)}
 else if(p==='grid'&&e.patternClock>.8){e.patternClock=0;const horizontal=Math.random()<.5;e.vx=horizontal?(Math.random()<.5?-1:1)*base:0;e.vy=horizontal?0:(Math.random()<.5?-1:1)*base}
 else if(p==='erratic'&&e.patternClock>.35){e.patternClock=0;const a=Math.atan2(e.vy,e.vx)+(Math.random()-.5)*1.8;e.vx=Math.cos(a)*base;e.vy=Math.sin(a)*base}
 else if(p==='mirror'&&e.patternClock>1.25){e.patternClock=0;if(Math.random()<.5)e.vx*=-1;else e.vy*=-1;normalizeEnemySpeed(e)}
 else if(p==='hunterburst'){if((e.age%3.5)<1.1)steerToward(e,player.x+.5,player.y+.5,.055);normalizeEnemySpeed(e)}
 else if(p==='heavy'){if(e.patternClock>1.6){e.patternClock=0;const a=Math.atan2(e.vy,e.vx)+(Math.random()-.5)*.35;e.vx=Math.cos(a)*base*.78;e.vy=Math.sin(a)*base*.78}}
 else if(p==='stretch'){normalizeEnemySpeed(e,.58+.72*(.5+.5*Math.sin(e.age*2.5)))}
 else if(p==='frenzy'){const phase=e.age%4,target=phase<2?(.8+phase*.38):(1.56-(phase-2)*.38);normalizeEnemySpeed(e,target)}
 else if(p==='spiral'){const a=(.025+.018*Math.sin(e.age*1.7))*dt*60,c=Math.cos(a),s=Math.sin(a),x=e.vx;e.vx=x*c-e.vy*s;e.vy=x*s+e.vy*c;normalizeEnemySpeed(e)}
 else if(p==='pulse'){normalizeEnemySpeed(e,(e.age%2.4)<.55?1.65:.62)}
 else if(p==='charge'){const phase=e.age%3.4;if(phase<.75)normalizeEnemySpeed(e,1.55);else normalizeEnemySpeed(e,.78);if(e.patternClock>3.4){e.patternClock=0;const a=Math.atan2(e.vy,e.vx)+(Math.random()-.5)*.6;e.vx=Math.cos(a)*base;e.vy=Math.sin(a)*base}}
}
function applyEliteSpecial(e,dt){
 if(!e.isElite||!e.type.eliteSpecial)return;
 if(e.specialWindup>0){
  e.specialWindup-=dt;normalizeEnemySpeed(e,.28);
  if(e.specialWindup<=0)activateEliteSpecial(e);
  return;
 }
 if(e.specialTime<=0){e.specialClock-=dt;if(e.specialClock<=0){startEliteWindup(e);return}normalizeEnemySpeed(e);return}
 e.specialTime-=dt;const s=e.specialState;
 if(s==='lockon'||s==='homing'){steerToward(e,player.x+.5,player.y+.5,s==='homing'?.075:.055);normalizeEnemySpeed(e,1.35)}
 else if(s==='sting'){if((e.specialTime%.72)<.2)steerToward(e,player.x+.5,player.y+.5,.18);normalizeEnemySpeed(e,1.55)}
 else if(s==='targeting'||s==='ram'){const dx=player.x+.5-e.x,dy=player.y+.5-e.y;if(s==='targeting'){if(Math.abs(dx)>Math.abs(dy)){e.vx=Math.sign(dx)*Math.hypot(e.baseVx,e.baseVy)*1.45;e.vy=0}else{e.vx=0;e.vy=Math.sign(dy)*Math.hypot(e.baseVx,e.baseVy)*1.45}}else{steerToward(e,player.x+.5,player.y+.5,.16);normalizeEnemySpeed(e,1.5)}}
 else if(s==='spikeburst')e.r=Math.max(e.r,.55*(e.type.size||1)*2.65);
 else if(s==='tractor'){const dx=e.x-(player.x+.5),dy=e.y-(player.y+.5),d=Math.hypot(dx,dy);if(d<16&&player.onTrail&&d>1)e.r=Math.max(e.r,.55*(e.type.size||1)*2.35)}
 else if(s==='overheat')normalizeEnemySpeed(e,1.55)
 else if(s==='gravity'){for(const o of enemies)if(o!==e){const dx=e.x-o.x,dy=e.y-o.y,d=Math.hypot(dx,dy)||1;if(d<18){o.vx+=dx/d*8*dt;o.vy+=dy/d*8*dt}}}
 else if(s==='quake'){e.r=Math.max(e.r,.55*(e.type.size||1)*2.25)}
 if(e.specialTime<=0){e.r=.55*(e.type.size||1)*2;e.clones=[];e.specialState=null;normalizeEnemySpeed(e)}
}
function updateEnemies(dt){
 for(const e of enemies){
  applyEnemyPattern(e,dt);applyEliteSpecial(e,dt);
  let nx=e.x+e.vx*dt,ny=e.y+e.vy*dt;
  const phased=e.isElite&&e.specialState==='phase'&&e.specialTime>0;
  const hit=(x,y)=>{const gx=Math.floor(x),gy=Math.floor(y);return gx<0||gy<0||gx>=W||gy>=H||(!phased&&grid[gy][gx]===LAND)};
  let bounced=false;
  if(hit(nx,e.y)){e.vx*=-1;nx=e.x+e.vx*dt;bounced=true}if(hit(e.x,ny)){e.vy*=-1;ny=e.y+e.vy*dt;bounced=true}
  if(bounced){bounceSound();if(e.type.movement==='ricochet'){e.vx*=1.06;e.vy*=1.06}}
  e.x=Math.max(.5,Math.min(W-.5,nx));e.y=Math.max(.5,Math.min(H-.5,ny));
  const gx=Math.floor(e.x),gy=Math.floor(e.y);
  if(gx>=0&&gy>=0&&gx<W&&gy<H&&grid[gy][gx]===TRAIL){loseLife();return}
  const dx=e.x-(player.x+.5),dy=e.y-(player.y+.5),danger=e.r+.7;if(dx*dx+dy*dy<danger*danger&&player.onTrail){loseLife();return}
 }
 for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){
  const a=enemies[i],b=enemies[j],dx=b.x-a.x,dy=b.y-a.y,min=a.r+b.r,d2=dx*dx+dy*dy;
  if(d2>0&&d2<min*min){
   const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,overlap=(min-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
   const avx=a.vx,avy=a.vy;a.vx=b.vx;a.vy=b.vy;b.vx=avx;b.vy=avy;bounceSound();
  }
 }
}
function moveHunter(){
 if(!hunter)return;
 const isLand=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&grid[y][x]===LAND;
 let vx=hunter.vx,vy=hunter.vy;
 if(!isLand(hunter.x,hunter.y+vy))vy*=-1;
 if(!isLand(hunter.x+vx,hunter.y))vx*=-1;
 let nx=hunter.x+vx,ny=hunter.y+vy;
 if(!isLand(nx,ny)){
  if(isLand(hunter.x-vx,ny)){vx*=-1;nx=hunter.x+vx}
  else if(isLand(nx,hunter.y-vy)){vy*=-1;ny=hunter.y+vy}
  else {vx*=-1;vy*=-1;nx=hunter.x+vx;ny=hunter.y+vy}
 }
 hunter.vx=vx;hunter.vy=vy;
 if(isLand(nx,ny)){hunter.x=nx;hunter.y=ny}
 if(hunter.x===player.x&&hunter.y===player.y)loseLife();
}
function update(dt){
 levelRunTime+=dt;
 timeLeft-=dt;if(timeLeft<=0){timeLeft=120;loseLife();return}updateUI();
 acc+=dt;updateEnemies(dt);hunterAcc+=dt;
 const speedUps=Math.floor((level-1)/2),hunterStep=MODES[difficulty].hunterStep/Math.pow(1.12,speedUps);
 if(hunterAcc>=hunterStep){hunterAcc=0;moveHunter()}
 while(acc>.045){stepPlayer();acc-=.045}
}
function imageRect(){
 if(!bgImage)return null;
 const ir=bgImage.width/bgImage.height,cr=canvas.width/canvas.height;let dw,dh,dx,dy;
 if(ir>cr){dh=canvas.height;dw=dh*ir;dx=(canvas.width-dw)/2;dy=0}else{dw=canvas.width;dh=dw/ir;dx=0;dy=(canvas.height-dh)/2}
 return {dx,dy,dw,dh};
}
function revealProgress(){if(!levelComplete)return 0;const t=Math.min(1,(performance.now()-completeStarted)/2000);return 1-Math.pow(1-t,3)}
function drawImageClippedToLand(){
 if(!bgImage)return false;
 const r=imageRect();
 ctx.save();ctx.beginPath();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===LAND)ctx.rect(x*C,y*C,C+.5,C+.5);
 ctx.clip();ctx.drawImage(bgImage,r.dx,r.dy,r.dw,r.dh);ctx.restore();return true;
}
function drawCompletionImageLayer(){
 if(!levelComplete||!bgImage||themes[theme]?.type==='classic')return;
 const r=imageRect(),p=revealProgress(),cx=canvas.width/2,cy=canvas.height/2;
 const maxR=Math.hypot(Math.max(cx,canvas.width-cx),Math.max(cy,canvas.height-cy));
 const radius=Math.max(1,maxR*p);
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.clip();ctx.drawImage(bgImage,r.dx,r.dy,r.dw,r.dh);ctx.restore();
}
function drawLandTint(alpha){
 if(alpha<=0)return;
 ctx.fillStyle='rgba(8,91,130,'+alpha+')';
 if(levelComplete){
  ctx.save();ctx.beginPath();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===LAND)ctx.rect(x*C,y*C,C+.5,C+.5);ctx.clip();ctx.fillStyle='rgba(8,91,130,'+alpha+')';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();return
 }
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===LAND)ctx.fillRect(x*C,y*C,C+.5,C+.5);
}
function draw(){
 ctx.fillStyle='#02060c';ctx.fillRect(0,0,canvas.width,canvas.height);
 const isClassic=themes[theme]?.type==='classic';const hasBg=!isClassic&&drawImageClippedToLand();
 if(isClassic){
  ctx.fillStyle='#0f708c';for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===LAND)ctx.fillRect(x*C,y*C,C,C);
 }else if(!hasBg){
  ctx.fillStyle='#0f708c';for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===LAND)ctx.fillRect(x*C,y*C,C,C)
 }
 if(hasBg)drawLandTint(.48);
 if(!levelComplete){
  ctx.fillStyle='#f9e45b';for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]===TRAIL)ctx.fillRect(x*C,y*C,C,C);
  ctx.save();
  const px=player.x*C+C/2,py=player.y*C+C/2,ps=window.XONIX_PLAYER_SPRITE;
  if(ps&&ps.complete&&ps.naturalWidth){ctx.imageSmoothingEnabled=false;const size=C*2.2;ctx.drawImage(ps,px-size/2,py-size/2,size,size)}
  else{ctx.shadowColor='#59e6ff';ctx.shadowBlur=12;ctx.fillStyle='#eaffff';ctx.beginPath();ctx.arc(px,py,C*.42,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#35c7ff';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#35c7ff';ctx.beginPath();ctx.arc(px,py,C*.16,0,Math.PI*2);ctx.fill()}
  ctx.restore();
  if(hunter){ctx.fillStyle='#ff9f1c';ctx.fillRect(hunter.x*C,hunter.y*C,C,C);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(hunter.x*C+1,hunter.y*C+1,C-2,C-2)}
  for(const e of enemies){
   if(e.isElite){ctx.save();const winding=e.specialWindup>0,pulse=.5+.5*Math.sin(performance.now()*.018);ctx.beginPath();ctx.strokeStyle=winding?'#ffffff':(e.specialTime>0?'#fff06a':'#ff9f1c');ctx.lineWidth=winding?5:3;ctx.shadowColor=winding?'#ffffff':'#ff9f1c';ctx.shadowBlur=winding?22+18*pulse:14;ctx.arc(e.x*C,e.y*C,e.r*C*(winding?2.25+(.18*pulse):2.15),0,Math.PI*2);ctx.stroke();if(winding){ctx.globalAlpha=.5+.35*pulse;ctx.beginPath();ctx.strokeStyle='#ff5470';ctx.lineWidth=2;ctx.arc(e.x*C,e.y*C,e.r*C*(2.7-.25*pulse),0,Math.PI*2);ctx.stroke()}ctx.restore()}
   if(e.type?.draw)e.type.draw(ctx,e.x*C,e.y*C,e.r*C);else{ctx.beginPath();ctx.fillStyle='#ff5470';ctx.arc(e.x*C,e.y*C,e.r*C,0,Math.PI*2);ctx.fill()}
   if(e.isElite&&e.specialTime>0){
    const s=e.specialState;ctx.save();ctx.globalAlpha=.28;
    if(s==='ink'){ctx.fillStyle='#090014';ctx.beginPath();ctx.arc(e.x*C,e.y*C,110,0,Math.PI*2);ctx.fill()}
    else if(s==='web'){ctx.strokeStyle='#e8f4ff';ctx.lineWidth=2;for(let k=1;k<4;k++){ctx.beginPath();ctx.arc(e.x*C,e.y*C,k*18,0,Math.PI*2);ctx.stroke()}}
    else if(s==='tractor'){ctx.strokeStyle='#8ffcff';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(e.x*C,e.y*C);ctx.lineTo((player.x+.5)*C,(player.y+.5)*C);ctx.stroke()}
    else if(e.clones?.length){for(const c of e.clones){const a=e.age*2+c.a,x=(e.x+Math.cos(a)*c.r)*C,y=(e.y+Math.sin(a)*c.r)*C;e.type.draw(ctx,x,y,e.r*C*.65)}}
    ctx.restore();
   }
  }
 }else{
  drawCompletionImageLayer();
  ctx.save();ctx.textAlign='center';ctx.font='bold 42px system-ui';ctx.fillStyle='rgba(255,255,255,.96)';ctx.strokeStyle='rgba(0,0,0,.65)';ctx.lineWidth=6;ctx.strokeText('LIVELLO COMPLETATO!',canvas.width/2,62);ctx.fillText('LIVELLO COMPLETATO!',canvas.width/2,62);ctx.restore();
 }
 for(const p of fireworks){ctx.beginPath();ctx.fillStyle='hsla('+p.h+',90%,65%,'+Math.max(0,p.life/p.max)+')';ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fill()}
}
function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;if(running&&!paused)update(dt);if(levelComplete)updateCelebration(dt,t);draw();requestAnimationFrame(loop)}
function showPause(){if(!running||levelComplete)return;paused=true;stopPlayer();pressedKeys.clear();ui.pauseOverlay.classList.remove('hidden')}
function hidePause(){paused=false;ui.pauseOverlay.classList.add('hidden')}
function mainMenu(){paused=false;running=false;stopPlayer();pressedKeys.clear();ui.pauseOverlay.classList.add('hidden');ui.overlay.classList.remove('hidden');document.getElementById('menuTitle').textContent='XONIX';document.getElementById('menuText').textContent='Conquista il campo, rivela lo sfondo e non farti prendere.';document.getElementById('difficultyBox').style.display='grid';document.getElementById('themeBox').style.display='grid';document.getElementById('startBtn').textContent='GIOCA'}
const preloadOverlay=document.getElementById('preloadOverlay'),preloadBar=document.getElementById('preloadBar'),preloadStatus=document.getElementById('preloadStatus'),preloadPercent=document.getElementById('preloadPercent');
function setPreloadProgress(done,total,label){
 const pct=total?Math.round(done/total*100):100;preloadBar.style.width=pct+'%';preloadPercent.textContent=pct+'%';preloadStatus.textContent=label||'Caricamento…';
}
function preloadImage(src){return new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=src})}
async function preloadGameSession(){
 preloadOverlay.classList.remove('hidden');setPreloadProgress(0,1,'Preparazione contenuti…');
 if(themes[theme]?.type!=='classic'&&!bgPool.length)await loadThemeBackgrounds(theme);
 const urls=themes[theme]?.type==='classic'?[]:bgPool.slice(0,20);
 const total=Math.max(1,urls.length+1);let done=0;
 setPreloadProgress(done,total,urls.length?'Precaricamento immagini…':'Preparazione campo…');
 for(const src of urls){await preloadImage(src);done++;setPreloadProgress(done,total,'Immagini '+done+'/'+urls.length)}
 if(themes[theme]?.type!=='classic'&&!bgImage)await pickBackground();
 done=total;setPreloadProgress(done,total,'Pronto');
 await new Promise(resolve=>setTimeout(resolve,260));
 preloadOverlay.classList.add('hidden');
}
async function start(){
 startMusic();const m=MODES[difficulty];lives=m.lives;level=1;score=0;running=false;paused=false;advancingLevel=false;
 ui.pauseOverlay.classList.add('hidden');ui.overlay.classList.add('hidden');
 try{await preloadGameSession()}catch(e){console.warn('Preload non completato',e);preloadOverlay.classList.add('hidden')}
 resetLevel();running=true
}
document.querySelectorAll('.diff').forEach(b=>b.addEventListener('click',()=>{difficulty=b.dataset.difficulty;document.querySelectorAll('.diff').forEach(x=>x.classList.toggle('active',x===b))}));

document.getElementById('startBtn').addEventListener('click',start);
document.getElementById('refreshBtn').addEventListener('click',async()=>{
 const regs='serviceWorker'in navigator?await navigator.serviceWorker.getRegistrations():[];
 await Promise.all(regs.map(r=>r.update().catch(()=>{})));
 location.reload();
});
document.getElementById('pauseBtn').addEventListener('click',()=>{if(paused)hidePause();else showPause()});
document.getElementById('continueBtn').addEventListener('click',hidePause);
document.getElementById('menuBtn').addEventListener('click',mainMenu);
const keys={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};
const pressedKeys=new Map();let keyOrder=0;
function syncKeyboardDirection(){
 let latest=null;
 for(const [key,order] of pressedKeys)if(keys[key]&&(!latest||order>latest.order))latest={key,order};
 if(latest){inputHeld=true;setDir(...keys[latest.key])}else stopPlayer();
}
addEventListener('keydown',e=>{
 if(keys[e.key]){e.preventDefault();if(!pressedKeys.has(e.key))pressedKeys.set(e.key,++keyOrder);syncKeyboardDirection()}
 if((e.key==='Escape'||e.key===' ')&&running&&!e.repeat){e.preventDefault();if(paused)hidePause();else showPause()}
});
addEventListener('keyup',e=>{if(keys[e.key]){e.preventDefault();pressedKeys.delete(e.key);syncKeyboardDirection()}});
addEventListener('blur',()=>{pressedKeys.clear();stopPlayer()});
document.querySelectorAll('[data-dir]').forEach(b=>{
 const m={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);inputHeld=true;setDir(...m[b.dataset.dir])});
 b.addEventListener('pointerup',e=>{e.preventDefault();stopPlayer()});
 b.addEventListener('pointercancel',stopPlayer);
 b.addEventListener('lostpointercapture',stopPlayer);
});
let sx=0,sy=0;
canvas.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!canvas.hasPointerCapture?.(e.pointerId))return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>16){inputHeld=true;if(Math.abs(dx)>Math.abs(dy))setDir(Math.sign(dx),0);else setDir(0,Math.sign(dy));sx=e.clientX;sy=e.clientY}});
canvas.addEventListener('pointerup',e=>{e.preventDefault();stopPlayer()});
canvas.addEventListener('pointercancel',stopPlayer);
const accessBtn=document.getElementById('accessBtn'),accessPanel=document.getElementById('accessPanel'),accessCode=document.getElementById('accessCode'),applyAccessBtn=document.getElementById('applyAccessBtn');
accessBtn.addEventListener('click',()=>{accessPanel.classList.toggle('hidden');syncAccessUI();if(!accessPanel.classList.contains('hidden'))accessCode.focus()});
function submitAccess(){
 if(!applyAccessCode(accessCode.value)){accessCode.classList.add('invalid');setTimeout(()=>accessCode.classList.remove('invalid'),700);return}
 accessCode.value='';
}
applyAccessBtn.addEventListener('click',submitAccess);
accessCode.addEventListener('keydown',e=>{if(e.key==='Enter')submitAccess()});
document.getElementById('accessStatus').addEventListener('click',e=>{
 const group=e.target.dataset?.remove;if(group)removeAccessGroup(group);
});
function syncAccessUI(){
 const status=document.getElementById('accessStatus');if(!status)return;
 const groups=[...accessGroups()];
 status.innerHTML=groups.map(g=>g==='public'?'<span>PUBLIC</span>':'<button type="button" data-remove="'+g+'" title="Disattiva '+g+'">'+g.toUpperCase()+' ×</button>').join('');
}
consumeInvite();
syncAccessUI();
syncRemoteThemeUI();
loadThemes();resetLevel();requestAnimationFrame(loop);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();