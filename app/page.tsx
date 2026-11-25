<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>แอปนาฬิกา</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600&family=Sarabun:wght@400;700&display=swap">
<style>
:root{--bg:#e9ede8;--panel:#f7f8f5;--ink:#17231f;--muted:#5b6b64;--line:#cbd3cc;--teal:#0e6b5c;--amber:#e0a030;--red:#c23b4e;--up:#1b8a4b;--chip:#dfe6df;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f1815;--panel:#18241f;--ink:#e8efe9;--muted:#9bb0a6;--line:#2c3b35;--teal:#3fb89f;--chip:#22312b;--up:#4cc27f;--red:#ee6a7d}}
:root[data-theme="dark"]{--bg:#0f1815;--panel:#18241f;--ink:#e8efe9;--muted:#9bb0a6;--line:#2c3b35;--teal:#3fb89f;--chip:#22312b;--up:#4cc27f;--red:#ee6a7d}
*{box-sizing:border-box}html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;background:var(--bg);color:var(--ink);font-family:Sarabun,system-ui,sans-serif;min-height:100dvh}
h1,h2,.pr{font-family:Prompt,Sarabun,sans-serif}
.app{display:grid;grid-template-columns:190px 1fr;min-height:100dvh}
nav{position:sticky;top:0;height:100dvh;padding:22px 12px;display:flex;flex-direction:column;gap:4px;border-right:1px solid var(--line)}
.brand{font-size:22px;font-weight:600;color:var(--teal);padding:0 10px 16px}
.tab{display:flex;gap:10px;padding:10px 12px;border:0;background:none;border-radius:10px;font:inherit;font-size:16px;color:var(--muted);cursor:pointer;text-align:left}
.tab.on{background:var(--ink);color:var(--bg)}
button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
main{max-width:720px;width:100%;padding:26px 22px 60px}
h1{font-size:28px;margin:0 0 16px;font-weight:600}h2{font-size:18px;margin:22px 0 10px;font-weight:600}
.m{color:var(--muted)}.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0}
.list{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.big{font-size:64px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
.hero{position:relative;width:min(290px,78vw);aspect-ratio:1;margin:6px auto 0}.hero svg{width:100%;height:100%}
.hero div{position:absolute;inset:0;display:grid;place-content:center;text-align:center}
.date{text-align:center;font-size:18px;margin:12px 0 0}
.zones{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.zone{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}
.zone span{display:block}.zt{font-size:26px;font-weight:600;font-variant-numeric:tabular-nums}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.chip{border:1px solid var(--line);background:var(--panel);padding:7px 14px;border-radius:99px;font:inherit;cursor:pointer;color:var(--ink)}
.chip.on{background:var(--teal);border-color:var(--teal);color:var(--bg)}
.match{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.match .r{text-align:right}.sc{text-align:center;min-width:76px;font-size:22px;font-weight:600}.sc small{display:block;font-size:13px;font-weight:400}.live{color:var(--red);font-weight:700}
.digits{font-size:clamp(46px,14vw,90px);font-weight:600;text-align:center;font-variant-numeric:tabular-nums;margin:18px 0}
.row{display:flex;gap:14px;justify-content:center;margin-bottom:16px}
.btn{border:0;border-radius:99px;padding:12px 26px;font:inherit;font-weight:700;cursor:pointer;color:#fff;background:var(--teal)}
.btn.stop{background:#c23b4e}.btn.ghost{background:var(--chip);color:var(--ink)}
.lap{display:grid;grid-template-columns:1fr auto auto;gap:16px;padding:10px 14px;background:var(--panel);border-radius:10px;font-variant-numeric:tabular-nums}
input[type=text],input[type=time],textarea{font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)}
.form{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.form input[type=text]{flex:1;min-width:150px}
.alarm{display:flex;justify-content:space-between;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 16px}
.alarm.off{opacity:.55}.at{font-size:32px;font-weight:600}
.sw{width:46px;height:26px;border-radius:99px;border:0;background:var(--line);position:relative;cursor:pointer;margin-right:12px}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s}
.sw.on{background:var(--teal)}.sw.on::after{transform:translateX(20px)}
.link{background:none;border:0;color:var(--teal);font:inherit;cursor:pointer;text-decoration:underline}
.calh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.calh h2{margin:0;font-size:22px}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.wd{text-align:center;color:var(--muted);padding:6px 0;font-size:14px}
.day{position:relative;aspect-ratio:1;border:1px solid transparent;border-radius:10px;background:var(--panel);color:var(--ink);font:inherit;font-size:17px;cursor:pointer}
.day.today{background:var(--teal);color:var(--bg)}.day.sel{border-color:var(--ink)}.sun{color:var(--red)}
.day i{position:absolute;bottom:5px;left:50%;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--amber)}
textarea{width:100%;margin-top:8px}
.wnow{display:flex;gap:18px;align-items:center}.wnow .ic{font-size:60px}.wt{font-size:52px;font-weight:600;line-height:1}
.fday{display:grid;grid-template-columns:1.3fr auto 1fr auto;gap:14px;align-items:center;padding:10px 14px;background:var(--panel);border-radius:10px}
.chart{width:100%;height:auto}.note{color:var(--muted);font-size:14px}
.ov{position:fixed;inset:0;background:rgba(10,18,15,.88);display:grid;place-items:center;z-index:50}
.ov div{background:var(--panel);border-radius:20px;padding:34px 42px;text-align:center}
@media (max-width:720px){.app{grid-template-columns:1fr;padding-bottom:72px}
nav{position:fixed;inset:auto 0 0 0;height:auto;flex-direction:row;padding:6px 6px calc(6px + env(safe-area-inset-bottom,0px));background:var(--panel);border-right:0;border-top:1px solid var(--line);z-index:20}
.brand{display:none}.tab{flex-direction:column;gap:2px;font-size:11px;padding:6px 2px;flex:1;align-items:center}
main{padding:18px 14px}.big{font-size:52px}}
</style>
</head>
<body>
<div class="app"><nav id="nav"><div class="brand pr">นาฬิกา</div></nav><main><h1 id="ttl"></h1><div id="v"></div></main></div>
<div id="ring"></div>
<script>
const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,"0");
const MO=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const store={get(k,d){try{const s=localStorage.getItem(k);return s?JSON.parse(s):d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const TABS=[["time","เวลา","🕒"],["fb","ผลบอล","⚽"],["sw","จับเวลา","⏱️"],["al","ปลุก","⏰"],["cal","ปฏิทิน","📅"],["wx","อากาศ","🌤️"],["st","หุ้น","📈"]];
let tab="time",timers=[];
let alarms=store.get("alarms",[]),notes=store.get("notes",{});
let ctx=null;
function unlock(){try{if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();ctx.resume()}catch{}}
function beep(f=880,d=.18){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;o.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.3,ctx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+d);o.start();o.stop(ctx.currentTime+d+.02)}
addEventListener("pointerdown",unlock,{once:true});
function tp(d,tz){const p=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).formatToParts(d).map(x=>[x.type,x.value]));return{h:+p.hour%24,m:+p.minute,s:+p.second}}
function every(fn,ms){fn();timers.push(setInterval(fn,ms))}
function go(t){tab=t;timers.forEach(clearInterval);timers=[];
$("#nav").querySelectorAll(".tab").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
$("#ttl").textContent=TABS.find(x=>x[0]===t)[1];$("#v").innerHTML="";V[t]($("#v"))}
TABS.forEach(([id,l,i])=>{const b=document.createElement("button");b.className="tab";b.dataset.t=id;b.innerHTML=`<span>${i}</span><span>${l}</span>`;b.onclick=()=>go(id);$("#nav").append(b)});
const ZONES=[["Asia/Bangkok","กรุงเทพฯ"],["Asia/Tokyo","โตเกียว"],["Europe/London","ลอนดอน"],["America/New_York","นิวยอร์ก"],["Australia/Sydney","ซิดนีย์"]];
const V={
time(el){const C=2*Math.PI*118;
el.innerHTML=`<div class="hero"><svg viewBox="0 0 280 280"><circle cx="140" cy="140" r="118" fill="none" stroke="var(--line)" stroke-width="8"/><circle id="rg" cx="140" cy="140" r="118" fill="none" stroke="var(--teal)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" transform="rotate(-90 140 140)"/></svg><div><div class="big pr" id="hm"></div><div class="m" id="ss"></div></div></div><p class="date" id="dt"></p><h2>เวลาทั่วโลก</h2><div class="zones" id="zn"></div>`;
every(()=>{const n=new Date(),p=tp(n,"Asia/Bangkok");$("#hm").textContent=pad(p.h)+":"+pad(p.m);$("#ss").textContent=pad(p.s)+" วินาที";$("#rg").setAttribute("stroke-dashoffset",C*(1-(p.s+n.getMilliseconds()/1000)/60));
$("#dt").textContent=new Intl.DateTimeFormat("th-TH",{timeZone:"Asia/Bangkok",weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(n);
$("#zn").innerHTML=ZONES.map(([tz,nm])=>{const q=tp(n,tz);return`<div class="zone"><div><b>${nm}</b><span class="m">${new Intl.DateTimeFormat("th-TH",{timeZone:tz,weekday:"short",day:"numeric",month:"short"}).format(n)}</span></div><div class="zt pr">${pad(q.h)}:${pad(q.m)}</div></div>`}).join("")},250)},
fb(el){const L={"พรีเมียร์ลีก":[["Liverpool","Arsenal","2","1","post","จบการแข่งขัน"],["Man City","Chelsea","1","1","in","67'"],["Tottenham","Newcastle","","","pre","22:30"]],"ลาลีกา":[["Real Madrid","Barcelona","3","2","post","จบการแข่งขัน"],["Atlético","Sevilla","0","0","in","23'"]],"บุนเดสลีกา":[["Bayern","Dortmund","2","0","post","จบการแข่งขัน"],["Leipzig","Leverkusen","","","pre","21:30"]],"เซเรีย อา":[["Inter","Milan","1","0","in","54'"],["Juventus","Napoli","","","pre","01:45"]],"ไทยลีก":[["บุรีรัมย์","ช็อปปี้ปปี้","2","1","post","จบการแข่งขัน"],["เมืองทอง","พีทีที ระยอง","","","pre","19:00"]]};
const names=Object.keys(L);let cur=names[0];
const draw=()=>{el.innerHTML=`<div class="chips">${names.map(n=>`<button class="chip ${n===cur?"on":""}" data-n="${n}">${n}</button>`).join("")}</div><p class="note">ตัวอย่างข้อมูลในหน้าพรีวิว (เวอร์ชัน Next.js ดึงผลจริงจาก ESPN)</p><div class="list">${L[cur].map(m=>`<div class="match"><b>${m[0]}</b><div class="sc pr">${m[4]=="pre"?`<span class="m">${m[5]}</span>`:m[2]+" - "+m[3]+`<small class="${m[4]=="in"?"live":"m"}">${m[4]=="in"?"● "+m[5]:m[5]}</small>`}</div><b class="r">${m[1]}</b></div>`).join("")}</div>`;el.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{cur=b.dataset.n;draw()})};draw()},
sw(el){let mode="sw",run=false,el0=0,base=0,laps=[],cm=5,left=300,crun=false,end=0;
const f=ms=>`${pad(Math.floor(ms/60000))}:${pad(Math.floor(ms/1000)%60)}.${pad(Math.floor(ms/10)%100)}`;
const draw=()=>{el.innerHTML=`<div class="chips"><button class="chip ${mode=="sw"?"on":""}" data-m="sw">จับเวลา</button><button class="chip ${mode=="cd"?"on":""}" data-m="cd">นับถอยหลัง</button></div>`+(mode=="sw"?`<div class="digits pr" id="dg">${f(el0)}</div><div class="row"><button class="btn ghost" id="a">${run?"บันทึกรอบ":"รีเซ็ต"}</button><button class="btn ${run?"stop":""}" id="b">${run?"หยุด":el0?"เริ่มต่อ":"เริ่ม"}</button></div><div class="list">${laps.map((l,i)=>`<div class="lap"><span>รอบที่ ${laps.length-i}</span><span>${f(l-(laps[i+1]||0))}</span><span class="m">${f(l)}</span></div>`).join("")}</div>`:`<div class="digits pr" id="dg">${pad(Math.floor(left/60))}:${pad(left%60)}</div>${crun?"":`<div class="chips" style="justify-content:center">${[1,3,5,10,25].map(m=>`<button class="chip ${cm==m?"on":""}" data-c="${m}">${m} นาที</button>`).join("")}</div>`}<div class="row"><button class="btn ghost" id="a">รีเซ็ต</button><button class="btn ${crun?"stop":""}" id="b">${crun?"หยุด":"เริ่ม"}</button></div>`);
el.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>{mode=b.dataset.m;draw()});el.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{cm=+b.dataset.c;left=cm*60;draw()});
$("#a").onclick=()=>{if(mode=="sw"){if(run)laps.unshift(el0);else{el0=0;laps=[]}}else{crun=false;left=cm*60}draw()};
$("#b").onclick=()=>{unlock();if(mode=="sw"){run=!run;base=Date.now()-el0}else{if(!left)left=cm*60;crun=!crun;end=Date.now()+left*1000}draw()}};
draw();every(()=>{if(mode=="sw"&&run){el0=Date.now()-base;$("#dg").textContent=f(el0)}if(mode=="cd"&&crun){left=Math.max(0,Math.ceil((end-Date.now())/1000));$("#dg").textContent=pad(Math.floor(left/60))+":"+pad(left%60);if(!left){crun=false;[0,300,600].forEach(d=>setTimeout(()=>beep(988,.25),d));draw()}}},50)},
al(el){const draw=()=>{const s=[...alarms].sort((a,b)=>a.time.localeCompare(b.time));
el.innerHTML=`<div class="panel form"><input type="time" id="t" value="07:00" class="pr" style="font-size:22px" aria-label="เวลาปลุก"><input type="text" id="l" placeholder="ชื่อ เช่น ตื่นไปทำงาน" aria-label="ชื่อ"><button class="btn" id="add">เพิ่มการปลุก</button><button class="btn ghost" id="tst">ทดสอบเสียง</button></div>${s.length?"":`<div class="panel m">ยังไม่มีการปลุก ตั้งเวลาแล้วกดเพิ่ม</div>`}<div class="list">${s.map(a=>`<div class="alarm ${a.on?"":"off"}"><div><div class="at pr">${a.time}</div><div class="m">${a.label} · ทุกวัน</div></div><div><button class="sw ${a.on?"on":""}" data-s="${a.id}" role="switch" aria-checked="${a.on}" aria-label="เปิด/ปิด"></button><button class="link" data-d="${a.id}">ลบ</button></div></div>`).join("")}</div><p class="note">เสียงปลุกดังเมื่อเปิดหน้านี้ค้างไว้ในเบราว์เซอร์เท่านั้น</p>`;
const save=()=>{store.set("alarms",alarms);draw()};
$("#add").onclick=()=>{unlock();const t=$("#t").value;if(t){alarms.push({id:Date.now()+"",time:t,label:$("#l").value.trim()||"นาฬิกาปลุก",on:true});save()}};$("#tst").onclick=()=>{unlock();beep()};
el.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{const a=alarms.find(x=>x.id==b.dataset.s);a.on=!a.on;save()});el.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{alarms=alarms.filter(x=>x.id!=b.dataset.d);save()})};draw()},
cal(el){const t=new Date();let y=t.getFullYear(),m=t.getMonth(),sel=null;const k=d=>`${y}-${pad(m+1)}-${pad(d)}`,tk=`${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`;
const draw=()=>{const f=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate();
el.innerHTML=`<div class="calh"><button class="btn ghost" id="p" aria-label="เดือนก่อน">‹</button><h2 class="pr">${MO[m]} ${y+543}</h2><button class="btn ghost" id="n" aria-label="เดือนถัดไป">›</button></div><div class="cal">${["อา","จ","อ","พ","พฤ","ศ","ส"].map((w,i)=>`<div class="wd ${i?"":"sun"}">${w}</div>`).join("")}${Array(f).fill("<div></div>").join("")}${Array.from({length:n},(_,i)=>i+1).map(d=>`<button class="day ${k(d)==tk?"today":""} ${sel==k(d)?"sel":""} ${(f+d-1)%7?"":"sun"}" data-d="${d}">${d}${notes[k(d)]?"<i></i>":""}</button>`).join("")}</div>${sel?`<div class="panel"><b>${+sel.slice(8)} ${MO[+sel.slice(5,7)-1]} ${+sel.slice(0,4)+543}</b><textarea id="nt" rows="3" placeholder="จดบันทึกหรือนัดหมายของวันนี้">${notes[sel]||""}</textarea></div>`:`<p class="note">แตะวันที่เพื่อจดบันทึก</p>`}<button class="link" id="td">กลับไปวันนี้</button>`;
$("#p").onclick=()=>{m--;if(m<0){m=11;y--}draw()};$("#n").onclick=()=>{m++;if(m>11){m=0;y++}draw()};$("#td").onclick=()=>{y=t.getFullYear();m=t.getMonth();sel=tk;draw()};
el.querySelectorAll(".day").forEach(b=>b.onclick=()=>{sel=k(+b.dataset.d);draw()});
const nt=$("#nt");if(nt)nt.oninput=()=>{if(nt.value)notes[sel]=nt.value;else delete notes[sel];store.set("notes",notes)}};draw()},
wx(el){const P={"สุโขทัย":[34,"⛅","ฝนบางพื้นที่",62,38,6],"กรุงเทพฯ":[33,"⛈️","พายุฝนฟ้าคะนอง",70,41,12],"เชียงใหม่":[29,"🌤️","มีเมฆบางส่วน",58,33,8],"ภูเก็ต":[30,"🌧️","ฝนตก",80,22,15]};const ns=Object.keys(P);let cur=ns[0];
const draw=()=>{const[x,i,d,h,w,r]=P[cur],days=["วันนี้","พรุ่งนี้","วันถัดไป","","","",""];const ic=["⛅","🌧️","🌤️","⛈️","☁️","🌦️","☀️"];
el.innerHTML=`<div class="chips">${ns.map(n=>`<button class="chip ${n==cur?"on":""}" data-n="${n}">${n}</button>`).join("")}</div><p class="note">ตัวอย่างข้อมูลในหน้าพรีวิว (เวอร์ชัน Next.js ดึงจาก Open-Meteo จริง)</p><div class="panel wnow"><div class="ic">${i}</div><div><div class="wt pr">${x}°</div><div>${d} · ${cur}</div><div class="m">ความชื้น ${h}% · ลม ${w} กม./ชม.</div></div></div><h2>พยากรณ์ 7 วัน</h2><div class="list">${ic.map((c,j)=>{const dt=new Date(Date.now()+j*864e5);return`<div class="fday"><span>${j?new Intl.DateTimeFormat("th-TH",{weekday:"short",day:"numeric",month:"short"}).format(dt):"วันนี้"}</span><span>${c}</span><span class="m">ฝน ${Math.max(0,Math.min(95,h-20+j*(r%5)*3))}%</span><span><b>${x+(j%3)-1}°</b> <span class="m">${x-9+(j%2)}°</span></span></div>`}).join("")}</div>`;
el.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{cur=b.dataset.n;draw()})};draw()},
st(el){const S=[["SET",1420],["PTT",33],["AOT",58],["CPALL",56],["ADVANC",290]],N=60,D={};S.forEach(([s,b])=>{let v=b;D[s]=Array.from({length:N},()=>v*=1+(Math.random()-.5)*.012)});let cur="SET";
const draw=()=>{const a=D[cur],W=640,H=260,mn=Math.min(...a),mx=Math.max(...a),X=i=>8+i/(N-1)*(W-16),Y=v=>H-8-(v-mn)/(mx-mn||1)*(H-16),ln=a.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+","+Y(v).toFixed(1)).join(" "),c=a[N-1]-a[0],up=c>=0,col=up?"var(--up)":"var(--red)",dp=a[N-1]<100?2:1;
el.innerHTML=`<div class="chips">${S.map(([s])=>`<button class="chip ${s==cur?"on":""}" data-n="${s}">${s}</button>`).join("")}</div><div class="panel"><div style="display:flex;gap:14px;align-items:baseline;flex-wrap:wrap"><span class="wt pr">${a[N-1].toFixed(dp)}</span><b style="color:${col}">${up?"▲":"▼"} ${Math.abs(c).toFixed(dp)} (${(c/a[0]*100).toFixed(2)}%)</b></div><svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="กราฟราคา ${cur}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".25"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>${[.25,.5,.75].map(f=>`<line x1="0" x2="${W}" y1="${H*f}" y2="${H*f}" stroke="var(--line)" stroke-dasharray="4 5"/>`).join("")}<path d="${ln} L${X(N-1)},${H} L${X(0)},${H}Z" fill="url(#g)"/><path d="${ln}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${X(N-1)}" cy="${Y(a[N-1])}" r="4.5" fill="${col}"/></svg><div class="m" style="display:flex;justify-content:space-between;font-size:14px"><span>ต่ำสุด ${mn.toFixed(dp)}</span><span>สูงสุด ${mx.toFixed(dp)}</span></div></div><p class="note">ข้อมูลจำลองเพื่อสาธิต ไม่ใช่ราคาจริง</p>`;
el.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{cur=b.dataset.n;draw()})};draw();
every(()=>{S.forEach(([s])=>{D[s].shift();const l=D[s][N-2];D[s].push(Math.max(1,l*(1+(Math.random()-.5)*.012)))});draw()},2000)}};
/* alarm checker (runs on every tab) */
let last="",ringT=null;
setInterval(()=>{const n=new Date(),hm=pad(n.getHours())+":"+pad(n.getMinutes()),k=n.toDateString()+hm;if(k===last)return;last=k;const a=alarms.find(x=>x.on&&x.time===hm);if(!a)return;
$("#ring").innerHTML=`<div class="ov" role="alertdialog"><div><div class="big pr">${a.time}</div><p style="font-size:20px">${a.label}</p><button class="btn stop" id="x">ปิดเสียง</button></div></div>`;
const r=()=>{beep(880,.2);setTimeout(()=>beep(1175,.2),250)};r();ringT=setInterval(r,900);$("#x").onclick=()=>{clearInterval(ringT);$("#ring").innerHTML=""}},1000);
go("time");
</script>
</body>
</html>