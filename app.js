(()=>{'use strict';
const BANK=window.QUESTION_BANK||[], UNITS=['전체 단원',...new Set(BANK.map(q=>q.unit))];
const $=id=>document.getElementById(id), KEY='edu_recall_history_v1';
let history={};try{history=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
let unit='전체 단원',type='mix',order='random',limit=20,wrongMode=false,queue=[],idx=0,answers={},chosen=-1,checked=false;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s).normalize('NFKC').toLowerCase().replace(/[\s·.,()\[\]{}\-–—_]/g,'').replace(/부르너/g,'브루너').replace(/맥타이/g,'멕타이');
const alias={'직소Ⅱ':['직소2','jigsaw2','jigsawⅡ'],'직소Ⅰ':['직소1','jigsaw1','jigsawⅠ'],'개인내적지능':['개인내 지능'],'대인관계지능':['대인 지능'],'이원목표 분류표':['이원목표분류표'],'스코프':['scope','범위'],'계획된 우연모형':['계획된 우연 모형']};
function isAnswer(res,q){let variants=[q.answer,...(alias[q.answer]||[])];return variants.some(a=>norm(res)===norm(a))}
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(history))}catch(e){}}
function countWrong(){return BANK.filter(q=>history[q.id]&&history[q.id].wrong>0&&!history[q.id].mastered).length}
function updateStats(){let attempted=Object.keys(history).length,correct=Object.values(history).reduce((a,v)=>a+(v.correct||0),0),total=Object.values(history).reduce((a,v)=>a+(v.attempts||0),0);$('stats').innerHTML=`<div class="statline"><span>학습한 개념</span><strong>${attempted} / ${BANK.length}</strong></div><div class="statline"><span>누적 정답률</span><strong>${total?Math.round(correct/total*100):0}%</strong></div><div class="statline"><span>복습할 오답</span><strong>${countWrong()}개</strong></div>`;$('wrongCount').textContent=countWrong()}
function renderUnits(){$('units').innerHTML=UNITS.map((u,i)=>`<button class="unit ${unit===u?'active':''}" data-unit="${esc(u)}"><span>${i?`<span class="number">${String(i).padStart(2,'0')}</span>`:'⌂　'}${esc(u)}</span><b>${u==='전체 단원'?BANK.length:BANK.filter(x=>x.unit===u).length}</b></button>`).join('');$('currentUnitLabel').textContent=unit==='전체 단원'?'ALL SUBJECTS / 08':`SUBJECT ${UNITS.indexOf(unit).toString().padStart(2,'0')} / 08`;$('sectionTitle').textContent=unit==='전체 단원'?'전체 교육학 퀴즈':unit;document.querySelectorAll('.unit').forEach(b=>b.addEventListener('click',()=>{unit=b.dataset.unit;wrongMode=false;renderUnits();start()}))}
function start(){let items=BANK.filter(q=>(unit==='전체 단원'||q.unit===unit)&&(!wrongMode||history[q.id]?.wrong>0&&!history[q.id]?.mastered)&& (type==='mix'||!q.fixedType||q.fixedType===(type==='mc'?'choice':type)));queue=(order==='random'?shuffle(items):items).slice(0,limit||undefined);idx=0;answers={};chosen=-1;checked=false;show()}
function isShort(){const q=queue[idx];return q?.fixedType?q.fixedType==='short':type==='short'||(type==='mix'&&idx%2===1)}
function answerNow(){if(!queue.length||checked)return;const q=queue[idx],short=isShort();const response=short?($('shortAns')?.value||'').trim():q.options[chosen];if(!response)return;let correct=isAnswer(response,q);checked=true;let record=history[q.id]||{attempts:0,correct:0,wrong:0,mastered:false};record.attempts++;if(correct){record.correct++;record.mastered=true}else{record.wrong++;record.mastered=false}history[q.id]=record;persist();answers[idx]={response,correct};show();updateStats()}
function score(){return Object.values(answers).filter(a=>a.correct).length}
function show(){updateStats();$('prev').disabled=idx===0||queue.length===0;$('next').disabled=!queue.length||!checked;
$('progressText').textContent=queue.length?`${Math.min(idx+1,queue.length)} / ${queue.length} 문제${wrongMode?' · 오답 복습':''}`:(wrongMode?'복습할 오답이 없습니다':'문제 없음');$('scoreText').textContent=queue.length?`현재 ${score()}문제 정답`:'';$('progressBar').style.width=queue.length?`${(idx+(checked?1:0))/queue.length*100}%`:'0%';$('next').textContent=idx===queue.length-1?'결과 확인 →':'다음 문제 →';
if(!queue.length){$('questionBox').innerHTML=`<div class="empty"><div class="spark">✳</div><h3>${wrongMode?'복습할 문항이 없습니다.':'해당하는 문항이 없습니다.'}</h3><p>단원이나 복습 조건을 바꿔 다시 시작해 보세요.</p></div>`;return}
if(idx>=queue.length){$('questionBox').innerHTML=`<div class="done"><div class="eyebrow">SESSION COMPLETE</div><div class="score">${score()} / ${queue.length}</div><h2>학습 완료!</h2><p>정답률 ${Math.round(score()/queue.length*100)}% · 틀린 문항은 오답 복습에 저장됩니다.</p><div class="actions" style="justify-content:center"><button class="primary" id="restartDone">한 번 더 풀기</button><button class="ghost" id="wrongDone">오답만 풀기</button></div></div>`;$('next').disabled=true;$('prev').disabled=false;$('restartDone').onclick=()=>{wrongMode=false;start()};$('wrongDone').onclick=()=>{wrongMode=true;start()};return}
const q=queue[idx],short=isShort(),prev=answers[idx];checked=!!prev;const selected=prev?.response;
let html=`<div class="qmeta">${esc(q.unit)}　/　${short?'SHORT ANSWER':'MULTIPLE CHOICE'}　/　${esc(q.id)}</div><h3 class="qtitle">${esc(q.question)}</h3><div class="qhint">KEYWORD · ${esc(q.hint)}</div>`;
if(short){html+=`<div class="shortinput"><input id="shortAns" type="text" autocomplete="off" spellcheck="false" placeholder="핵심 개념을 입력하세요" value="${esc(selected||'')}" ${checked?'disabled':''}><button class="primary" id="checkShort" ${checked?'disabled':''}>정답 확인</button></div><div class="qhint" style="margin-top:12px">띄어쓰기는 무시하지만 핵심 용어가 정확해야 정답 처리됩니다.</div>`}
else{html+=`<div class="options">${q.options.map((o,j)=>{let status=checked?(o===q.answer?'correct':o===selected?'incorrect':''):(chosen===j?'selected':'');return `<button class="option ${status}" data-opt="${j}" ${checked?'disabled':''}><span class="num">${String(j+1).padStart(2,'0')}</span><span>${esc(o)}</span>${checked&&o===q.answer?' ✓':''}</button>`}).join('')}</div>`}
if(checked){html+=`<div class="result ${prev.correct?'ok':'bad'}"><strong>${prev.correct?'✓ 정답입니다!':'✕ 오답입니다.'}</strong><p>정답: <b>${esc(q.answer)}</b></p><div>${esc(q.explanation)}</div><div class="src">원자료: ${esc(q.unit)} · ${esc(q.source)} (문항 제작 시 재구성)</div></div>`}
else{html+=`<div class="actions"><button class="ghost" id="reveal">정답 확인 / 채점</button><span class="qhint" style="margin:0">답을 선택하거나 입력한 후 채점하세요.</span></div>`}
$('questionBox').innerHTML=html;
$('next').disabled=!checked;
if(short&&!checked){$('checkShort').onclick=answerNow;$('shortAns').addEventListener('keydown',e=>{if(e.key==='Enter')answerNow()})}
if(!short&&!checked)document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{chosen=Number(b.dataset.opt);document.querySelectorAll('[data-opt]').forEach((x,j)=>x.classList.toggle('selected',j===chosen))});
if(!checked)$('reveal').onclick=answerNow
}
$('start').onclick=()=>{wrongMode=false;start()};$('wrongOnly').onclick=()=>{wrongMode=true;start()};$('prev').onclick=()=>{if(idx>0){idx--;chosen=-1;show()}};$('next').onclick=()=>{if(checked){idx++;chosen=-1;checked=!!answers[idx];show()}};
for(const [name,value] of [['types','type'],['order','order']])document.querySelectorAll(`#${name} button`).forEach(b=>b.onclick=()=>{document.querySelectorAll(`#${name} button`).forEach(x=>x.classList.remove('active'));b.classList.add('active');if(value==='type')type=b.dataset.type;else order=b.dataset.order;start()});
document.querySelectorAll('#amounts button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#amounts button').forEach(x=>x.classList.remove('active'));b.classList.add('active');limit=Number(b.dataset.limit);start()});
$('reset').onclick=()=>{if(confirm('학습 이력과 오답 기록을 모두 삭제할까요?')){history={};persist();updateStats();wrongMode=false;start()}};
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!queue.length||idx>=queue.length)return;if(!isShort()&&!checked&&/^[1-4]$/.test(e.key)){chosen=Number(e.key)-1;document.querySelectorAll('[data-opt]').forEach((x,j)=>x.classList.toggle('selected',j===chosen))}else if(e.key==='Enter'){if(!checked)answerNow();else $('next').click()}});
const requested=new URLSearchParams(location.search).get('unit');if(requested&&UNITS.includes(requested))unit=requested;renderUnits();updateStats();start();
})();
