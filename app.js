/* La Rosetta · lógica de la web
   Los datos de las pizzas están en data.js y las fotos en photos.js.
   Aquí solo hay pantallas y comportamiento. */
(function(){
'use strict';

var D=window.ROSETTA_DATA;
var PHOTOS=window.ROSETTA_PHOTOS||{};
var RAW=D.RAW,GROUP=D.GROUP,CATS=D.CATS;
var GH={romana:'Pizzas romanas',napolitana:'Pizzas napolitanas',pinsa:'Pinsas'};

/* ---------- utilidades ---------- */
function $(s){return document.querySelector(s);}
function norm(s){return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();}
/* clave de búsqueda: sin tildes, sin mayúsculas y sin puntos ni apóstrofos (A.O.V.E. -> aove) */
function sk(s){return norm(s).replace(/[.'’´`]/g,'');}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmt(ms){var s=Math.floor(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}

/* ---------- datos ---------- */
var PIZZAS=[];
['romana','napolitana','pinsa'].forEach(function(g){
  RAW[g].forEach(function(row){
    var n=row[0];
    var items=row.slice(1).map(function(s){var k=s.lastIndexOf(':');return {n:s.slice(0,k),c:s.slice(k+1)};});
    PIZZAS.push({id:g+'-'+norm(n).replace(/[^a-z0-9]+/g,'-'),g:g,n:n,i:items,elige:items.some(function(x){return /elegir/.test(x.n);})});
  });
});
var BY={};PIZZAS.forEach(function(p){BY[p.id]=p;});
var N_PHOTOS=PIZZAS.filter(function(p){return PHOTOS[p.id];}).length;

/* ingredientes: las variantes de un mismo ingrediente comparten clave (ALIAS en data.js) */
var ALIAS_KEY={};
(D.ALIAS||[]).forEach(function(g){var k=sk(g[0]);g.forEach(function(n){ALIAS_KEY[sk(n)]=k;});});
function ikey(n){var k=sk(n);return ALIAS_KEY[k]||k;}
var ING=(function(){
  var m={},list=[];
  PIZZAS.forEach(function(p){p.i.forEach(function(x){
    if(/elegir| o nata/.test(norm(x.n)))return;
    var k=ikey(x.n);
    if(!m[k]){m[k]={k:k,n:x.n,c:x.c,v:[],names:[]};list.push(m[k]);}
    var s=sk(x.n);if(m[k].v.indexOf(s)<0)m[k].v.push(s);
    if(m[k].names.indexOf(x.n)<0)m[k].names.push(x.n);
  });});
  (D.ALIAS||[]).forEach(function(g){var it=m[sk(g[0])];if(it)it.n=g[0];});
  list.forEach(function(it){var x=(D.SEARCH_EXTRA||{})[it.n];if(x)it.v.push(sk(x));});
  return list;
})();
var ING_BY={};ING.forEach(function(i){ING_BY[i.k]=i;});

/* puntuación de un texto escrito frente a las variantes de un nombre (menor = mejor, 9 = no coincide) */
function rank(variants,t){
  var best=9;
  for(var i=0;i<variants.length;i++){
    var v=variants[i];
    if(v.indexOf(t)===0)return v===t?-1:0;
    if((' '+v).indexOf(' '+t)>=0)best=Math.min(best,1);
    else if(v.indexOf(t)>=0)best=Math.min(best,2);
  }
  return best;
}
function sorted(list){
  return list.sort(function(a,b){return a.r-b.r||a.n.localeCompare(b.n,'es');});
}

/* ---------- progreso y lista guardados en este navegador ---------- */
var store={status:{},mine:[],tab:'fichas'};
try{
  var raw=localStorage.getItem('rosetta.v1');
  if(raw){
    var o=JSON.parse(raw);
    if(o&&typeof o==='object'){
      store.status=o.status||{};
      store.mine=Array.isArray(o.mine)?o.mine.filter(function(id){return BY[id];}):[];
      store.tab=o.tab||'fichas';
    }
  }
}catch(e){}
function save(){try{localStorage.setItem('rosetta.v1',JSON.stringify(store));}catch(e){}}
function isMine(id){return store.mine.indexOf(id)>=0;}
function setStatus(id,s){store.status[id]=s;save();updateProg();}
function stLabel(id){var s=store.status[id];return s==='k'?'Dominada':s==='r'?'Por repasar':'Nueva';}
function updateProg(){
  var base=store.mine.length?store.mine.map(function(id){return BY[id];}):PIZZAS;
  var k=base.filter(function(p){return store.status[p.id]==='k';}).length;
  $('#progLabel').textContent=store.mine.length?'Mi lista':'Dominadas';
  $('#progTxt').textContent=k+' / '+base.length;
  $('#progBar').style.width=(100*k/base.length)+'%';
}

/* ---------- estado de la interfaz ---------- */
var TABS=['lista','fichas','quiz','comanda','carta'];
var start=store.mine.length?'mia':'todas';
var ui={
  tab:TABS.indexOf(store.tab)>=0?store.tab:'fichas',
  f:{deck:start,order:[],idx:0,shown:false,init:false,done:false,tally:{k:0,r:0}},
  q:{mode:'lleva',group:start,s:null,msg:''},
  c:{n:5,group:start,s:null,msg:''},
  k:{q:'',g:'todas',b:'todas',open:{}},
  m:{q:'',g:'todas',confirm:null}
};
var tick=null;
var app=$('#app');

function pool(group){
  return PIZZAS.filter(function(p){
    if(group==='todas')return true;
    if(group==='mia')return isMine(p.id);
    if(group==='aprender')return store.status[p.id]!=='k';
    return p.g===group;
  });
}
function emptyMsg(group){
  return group==='mia'?'Tu lista está vacía. Elige pizzas en «Mi lista».':'No hay pizzas por aprender en este grupo. Elige otro.';
}
function groupChips(act,cur,o){
  o=o||{};
  var items=[['todas','Todas']];
  if(o.mine&&(store.mine.length||cur==='mia'))items.push(['mia','Mi lista · '+store.mine.length]);
  items.push(['romana','Romanas'],['napolitana','Napolitanas'],['pinsa','Pinsas']);
  if(o.learn)items.push(['aprender','Por aprender · '+pool('aprender').length]);
  return '<div class="pills" role="group">'+items.map(function(it){
    return '<button class="pill" data-act="'+act+'" data-v="'+it[0]+'" aria-pressed="'+(cur===it[0])+'">'+it[1]+'</button>';
  }).join('')+'</div>';
}
function chips(list,hit){
  return '<ul class="chips">'+list.map(function(x){
    var h=hit&&norm(x.n).indexOf(hit)>=0?' hit':'';
    return '<li class="chip c-'+x.c+h+'">'+esc(x.n)+'</li>';
  }).join('')+'</ul>';
}
function notes(p){
  var n=[];
  if(p.i.some(function(x){return x.n==='A.O.V.E.';}))n.push('A.O.V.E. = aceite de oliva virgen extra');
  if(p.elige)n.push('Los 3 ingredientes los elige el cliente');
  return n.length?'<p class="note">'+n.join(' · ')+'</p>':'';
}
function photo(id,cls,alt){
  var s=PHOTOS[id];
  return s?'<img class="'+cls+'" src="'+s+'" alt="'+esc(alt)+'" decoding="async">':'';
}
var OPT_ALL={mine:true,learn:true};

/* ---------- MI LISTA ---------- */
function toggleMine(id){
  var i=store.mine.indexOf(id);
  if(i>=0)store.mine.splice(i,1);else store.mine.push(id);
  save();updateProg();
  ui.f.init=false;
  if(!store.mine.length){
    if(ui.f.deck==='mia')ui.f.deck='todas';
    if(ui.q.group==='mia')ui.q.group='todas';
    if(ui.c.group==='mia')ui.c.group='todas';
    if(ui.k.g==='mia')ui.k.g='todas';
  }
  if(ui.tab==='lista'){renderMsum();renderMlist();renderReset();}
  else if(ui.tab==='carta'){var y=window.scrollY||0;render();window.scrollTo(0,y);}
}
function doReset(){
  store.status={};save();updateProg();
  ui.f.init=false;ui.q.s=null;ui.c.s=null;
}
function renderMsum(){
  var n=store.mine.length,h;
  var k=store.mine.filter(function(id){return store.status[id]==='k';}).length;
  if(!n){
    h='<div class="panel"><p class="big">Aún no has elegido ninguna</p><p class="sub">Toca las pizzas de abajo para añadirlas a tu lista. Después podrás estudiar solo esas en Fichas, Quiz y Comanda.</p></div>';
  }else{
    h='<div class="panel"><p class="label">Tu lista</p><p class="big">'+n+(n===1?' pizza':' pizzas')+' · '+k+(k===1?' dominada':' dominadas')+'</p>'+
      '<p class="sub">Estudia solo estas:</p><div class="go">'+
      '<button class="btn primary" data-act="study" data-v="fichas">Fichas</button>'+
      '<button class="btn primary" data-act="study" data-v="quiz">Quiz</button>'+
      '<button class="btn primary" data-act="study" data-v="comanda">Comanda</button></div></div>';
  }
  $('#msum').innerHTML=h;
}
function renderMlist(){
  var m=ui.m,q=norm(m.q.trim()),h='';
  ['romana','napolitana','pinsa'].forEach(function(g){
    if(m.g!=='todas'&&m.g!==g)return;
    var part=PIZZAS.filter(function(p){return p.g===g&&(!q||norm(p.n).indexOf(q)>=0);});
    if(!part.length)return;
    h+='<p class="gh">'+GH[g]+' · '+part.length+'</p><div class="rows cols">'+part.map(function(p){
      var on=isMine(p.id);
      return '<button class="pick" role="checkbox" aria-checked="'+on+'" data-act="mine-toggle" data-id="'+p.id+'">'+
        '<span class="box" aria-hidden="true">✓</span><span><span class="pr-name">'+esc(p.n)+'</span><span class="pr-meta">'+GROUP[p.g]+' · '+stLabel(p.id)+'</span></span></button>';
    }).join('')+'</div>';
  });
  if(!h)h='<p class="empty">No hay pizzas con ese nombre.</p>';
  $('#mlist').innerHTML=h;
}
function renderReset(){
  var m=ui.m,done=PIZZAS.filter(function(p){return store.status[p.id]==='k';}).length;
  var h='<div class="panel"><p class="label">Progreso</p>';
  if(m.confirm==='reset'){
    h+='<p class="fb bad" style="margin:0">Se borra todo lo que has marcado como dominado o por repasar. Tu lista de pizzas se queda como está.</p>'+
      '<div class="actions" style="margin-top:0"><button class="btn" data-act="m-cancel">Cancelar</button><button class="btn no" data-act="m-do" data-v="reset">Sí, restablecer</button></div>';
  }else if(m.confirm==='clear'){
    h+='<p class="fb bad" style="margin:0">Se quitan todas las pizzas de tu lista. Tu progreso se queda como está.</p>'+
      '<div class="actions" style="margin-top:0"><button class="btn" data-act="m-cancel">Cancelar</button><button class="btn no" data-act="m-do" data-v="clear">Sí, vaciar</button></div>';
  }else{
    h+='<p class="sub">Tienes '+done+' de '+PIZZAS.length+' pizzas marcadas como dominadas.</p>'+
      '<div class="actions" style="margin-top:0"><button class="btn" data-act="m-ask" data-v="clear"'+(store.mine.length?'':' disabled')+'>Vaciar mi lista</button><button class="btn no" data-act="m-ask" data-v="reset">Restablecer progreso</button></div>';
  }
  $('#mreset').innerHTML=h+'</div>';
}
function rLista(){
  var m=ui.m;
  app.innerHTML='<h1 class="h">Mi lista</h1><p class="sub">Marca las pizzas que tienes que aprender, por ejemplo las que te ha pedido tu jefa. Se guardan en este dispositivo.</p>'+
    '<div id="msum"></div>'+
    '<input class="search" id="msearch" type="search" placeholder="Buscar pizza por nombre" autocomplete="off" value="'+esc(m.q)+'" aria-label="Buscar pizza">'+
    groupChips('m-group',m.g)+
    '<div id="mlist"></div><div class="mt" id="mreset"></div>';
  renderMsum();renderMlist();renderReset();
}

/* ---------- FICHAS ---------- */
function newDeck(){
  var f=ui.f;
  f.order=shuffle(pool(f.deck).map(function(p){return p.id;}));
  f.idx=0;f.shown=false;f.init=true;f.done=false;f.tally={k:0,r:0};
}
function rFichas(){
  var f=ui.f;if(!f.init)newDeck();
  var h='<h1 class="h">Fichas</h1><p class="sub">Lee el nombre, piensa qué lleva y toca la ficha para comprobarlo.</p>'+groupChips('f-deck',f.deck,OPT_ALL);
  if(!f.order.length){
    if(f.deck==='mia'){
      h+='<div class="panel"><p class="big">Tu lista está vacía</p><p class="sub">Elige las pizzas que tienes que aprender y aparecerán aquí.</p><button class="btn primary" data-act="go-lista">Elegir pizzas</button></div>';
    }else{
      h+='<div class="panel"><p class="big">No hay pizzas en este grupo</p><p class="sub">Ya dominas todas las de «Por aprender». Elige otro grupo para seguir repasando.</p><button class="btn primary" data-act="f-all">Ver todas</button></div>';
    }
  }else if(f.done){
    h+='<div class="panel reveal"><p class="label">Ronda terminada</p><p class="big">'+f.tally.k+' las sabías, '+f.tally.r+' a repasar</p><div class="actions" style="margin-top:0"><button class="btn" data-act="f-again">Otra ronda</button><button class="btn primary" data-act="f-learn">Solo las que faltan</button></div></div>';
  }else{
    var p=BY[f.order[f.idx]];
    h+='<div class="count"><span>Ficha '+(f.idx+1)+' de '+f.order.length+'</span><span>'+stLabel(p.id)+'</span></div>';
    h+='<div class="card" data-act="flip"><span class="tag">'+GROUP[p.g]+'</span><h2 class="pname">'+esc(p.n)+'</h2>'+
      (f.shown?'<div class="reveal rowfoto">'+photo(p.id,'photo','Foto de '+p.n)+chips(p.i)+notes(p)+'</div>':'<p class="hint">Toca para ver los ingredientes</p>')+'</div>';
    h+=f.shown?
      '<div class="actions"><button class="btn no" data-act="mark" data-v="r">Repasar</button><button class="btn ok" data-act="mark" data-v="k">La sé</button></div>':
      '<button class="btn primary wide mt" data-act="flip">Ver ingredientes</button>';
  }
  app.innerHTML=h;
}

/* ---------- QUIZ (se responde escribiendo) ---------- */
function newQ(kind,p){
  return {kind:kind,p:p,ans:[],chosen:null,checked:false,ok:false};
}
function startQuiz(){
  var q=ui.q;
  var ps=pool(q.group).filter(function(p){return !p.elige;});
  if(q.mode==='foto')ps=ps.filter(function(p){return PHOTOS[p.id];});
  if(!ps.length){
    q.s=null;
    q.msg=q.mode==='foto'&&pool(q.group).length?'Ninguna pizza de este grupo tiene foto. Elige otro grupo.':emptyMsg(q.group);
    return;
  }
  q.msg='';
  function rk(id){var s=store.status[id];return s==='r'?0:s==='k'?2:1;}
  ps=shuffle(ps).sort(function(a,b){return rk(a.id)-rk(b.id);}).slice(0,10);
  q.s={qs:ps.map(function(p){return newQ(q.mode,p);}),i:0,correct:0,done:false,miss:[]};
}
function curQ(){var s=ui.q.s;return s.qs[s.i];}
function qScore(qn,ok){
  var s=ui.q.s;qn.ok=ok;
  if(ok)s.correct++;else s.miss.push(qn.p.id);
  setStatus(qn.p.id,ok?'k':'r');
}

/* ingredientes: qué falta, qué sobra y qué has acertado */
function gradeIng(qn){
  var want={},got={};
  qn.p.i.forEach(function(x){want[ikey(x.n)]=x;});
  qn.ans.forEach(function(a){got[a.k]=1;});
  var ok=Object.keys(want).every(function(k){return got[k];})&&qn.ans.every(function(a){return want[a.k];});
  return {want:want,got:got,ok:ok};
}
function ingResult(qn,g){
  var li=qn.ans.map(function(a){
    var w=g.want[a.k];
    return '<li class="chip c-'+(w?w.c:a.c)+(w?' good':' bad')+'">'+esc(w?w.n:a.n)+'</li>';
  });
  qn.p.i.forEach(function(x){if(!g.got[ikey(x.n)])li.push('<li class="chip c-'+x.c+' miss">'+esc(x.n)+'</li>');});
  return '<ul class="chips">'+li.join('')+'</ul>';
}
function ingFeedback(qn,g){
  if(g.ok)return '<p class="fb good">Perfecta.</p>';
  var miss=qn.p.i.filter(function(x){return !g.got[ikey(x.n)];}).map(function(x){return x.n;});
  var extra=qn.ans.filter(function(a){return !g.want[a.k];}).map(function(a){return a.n;});
  return '<p class="fb bad">'+(miss.length?'Te faltó: '+esc(miss.join(', '))+'. ':'')+(extra.length?'Sobró: '+esc(extra.join(', '))+'.':'')+'</p>';
}

/* caja para escribir: sugerencias solo cuando hay texto */
function typebox(placeholder,label){
  return '<div class="typebox"><input class="search" id="qi" type="text" enterkeyhint="done" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="'+esc(placeholder)+'" aria-label="'+esc(label)+'"><div class="sug" id="qsug" aria-live="polite"></div></div>';
}
function matches(qn,t){
  var out=[];
  if(!t)return out;
  if(qn.kind==='lleva'){
    var taken={};qn.ans.forEach(function(a){taken[a.k]=1;});
    ING.forEach(function(i){
      if(taken[i.k])return;
      var r=rank(i.v,t);
      if(r>=9)return;
      /* se muestra la variante que más se parece a lo que has escrito */
      var best=i.n,br=9;
      i.names.forEach(function(nm){var rr=rank([sk(nm)],t);if(rr<br){br=rr;best=nm;}});
      out.push({r:r,n:best,k:i.k});
    });
  }else{
    PIZZAS.forEach(function(p){var r=rank([sk(p.n)],t);if(r<9)out.push({r:r,n:p.n,id:p.id});});
  }
  return sorted(out).slice(0,7);
}
function renderQAdded(){
  var qn=curQ(),box=$('#qadded');
  if(!box||qn.kind!=='lleva')return;
  box.innerHTML=qn.ans.map(function(a){
    return '<li><button class="chip neutral ans" data-act="rm-ing" data-k="'+esc(a.k)+'" aria-label="Quitar '+esc(a.n)+'">'+esc(a.n)+'</button></li>';
  }).join('');
}
function renderQSug(){
  var box=$('#qsug'),inp=$('#qi');
  if(!box||!inp)return;
  var qn=curQ(),t=sk(inp.value.trim());
  if(!t){box.innerHTML='';return;}
  var res=matches(qn,t);
  if(!res.length){box.innerHTML='<p class="note">'+(qn.kind==='lleva'?'No encuentro ningún ingrediente así. Revisa cómo lo has escrito.':'No encuentro ninguna pizza así. Revisa cómo lo has escrito.')+'</p>';return;}
  box.innerHTML='<ul class="chips">'+res.map(function(r){
    return qn.kind==='lleva'?
      '<li><button class="chip neutral" data-act="sug-ing" data-k="'+esc(r.k)+'" data-n="'+esc(r.n)+'">'+esc(r.n)+'</button></li>':
      '<li><button class="chip neutral" data-act="sug-name" data-id="'+esc(r.id)+'">'+esc(r.n)+'</button></li>';
  }).join('')+'</ul>';
}
function refocus(){var inp=$('#qi');if(inp&&inp.focus)inp.focus();}
function addIng(k,label){
  var qn=curQ(),it=ING_BY[k];
  if(qn.checked||!it||qn.ans.some(function(a){return a.k===k;}))return;
  qn.ans.push({k:it.k,n:label||it.n,c:it.c});
  var inp=$('#qi');if(inp)inp.value='';
  renderQAdded();renderQSug();refocus();
}
function answerName(id){
  var qn=curQ();
  if(qn.checked)return;
  qn.chosen=id;qn.checked=true;
  qScore(qn,id===qn.p.id);
  render();
}
/* Intro en el teclado: añade la coincidencia exacta o, si solo hay una sugerencia, esa */
function enterQuiz(){
  var s=ui.q.s;if(!s||s.done)return;
  var qn=curQ();if(qn.checked)return;
  var inp=$('#qi');if(!inp)return;
  var res=matches(qn,sk(inp.value.trim()));
  var exact=res.filter(function(r){return r.r===-1;});
  var pick=exact.length===1?exact[0]:res.length===1?res[0]:null;
  if(!pick)return;
  if(qn.kind==='lleva')addIng(pick.k,pick.n);else answerName(pick.id);
}

function rQuiz(){
  var q=ui.q,s=q.s,h;
  if(!s){
    h='<h1 class="h">Quiz</h1><p class="sub">Hasta diez preguntas. Contestas escribiendo, sin lista de opciones. Salen primero las pizzas que más te cuestan.</p>'+
      '<div class="modes">'+
      '<button class="opt" data-act="q-mode" data-v="lleva" aria-pressed="'+(q.mode==='lleva')+'"><b>¿Qué lleva?</b><span>Ves el nombre y escribes sus ingredientes uno a uno.</span></button>'+
      '<button class="opt" data-act="q-mode" data-v="nombre" aria-pressed="'+(q.mode==='nombre')+'"><b>¿Qué pizza es?</b><span>Ves los ingredientes y escribes el nombre.</span></button>'+
      '<button class="opt" data-act="q-mode" data-v="foto" aria-pressed="'+(q.mode==='foto')+'"><b>Foto</b><span>Ves la foto y escribes el nombre. Solo salen las '+N_PHOTOS+' pizzas que tienen foto.</span></button></div>'+
      groupChips('q-group',q.group,OPT_ALL)+
      (q.msg?'<p class="fb bad" style="margin:0 0 14px">'+q.msg+'</p>':'')+
      '<button class="btn primary wide" data-act="q-start">Empezar</button>';
    app.innerHTML=h;return;
  }
  if(s.done){
    h='<div class="panel reveal"><p class="label">Resultado</p><p class="big">'+s.correct+' de '+s.qs.length+' bien</p>'+
      (s.miss.length?'<p class="sub">Estas son las que fallaste. Léelas una vez antes de la siguiente ronda.</p>':'<p class="sub">Ronda perfecta.</p>')+'</div>';
    if(s.miss.length){
      h+='<div class="rows mt">'+s.miss.map(function(id){var p=BY[id];return '<article class="row"><div class="row-h"><h3>'+esc(p.n)+'</h3><span class="tag">'+GROUP[p.g]+'</span></div>'+photo(id,'photo sm','Foto de '+p.n)+chips(p.i)+notes(p)+'</article>';}).join('')+'</div>';
    }
    h+='<div class="actions"><button class="btn" data-act="q-end">Cambiar modo</button><button class="btn primary" data-act="q-again">Otra ronda</button></div>';
    app.innerHTML=h;return;
  }
  var qn=s.qs[s.i],p=qn.p,last=s.i===s.qs.length-1;
  h='<div class="count"><span>Pregunta '+(s.i+1)+' de '+s.qs.length+'</span><span>'+s.correct+' bien</span></div><div class="card q">';
  if(qn.kind==='lleva'){
    h+='<span class="tag">'+GROUP[p.g]+' · ¿Qué lleva?</span><h2 class="pname">'+esc(p.n)+'</h2>';
    if(!qn.checked){
      h+='<p class="lead">Lleva '+p.i.length+(p.i.length===1?' ingrediente':' ingredientes')+'. Escríbelos y toca la sugerencia correcta.</p><ul class="chips" id="qadded"></ul>'+
        typebox('Escribe un ingrediente','Escribe un ingrediente');
    }else{
      var g=gradeIng(qn);
      h+=ingResult(qn,g)+ingFeedback(qn,g)+notes(p);
    }
    h+='</div>';
    h+=qn.checked?
      '<button class="btn primary wide mt" data-act="qnext">'+(last?'Ver resultado':'Siguiente')+'</button>':
      '<button class="btn primary wide mt" data-act="check">Comprobar</button>';
  }else{
    if(qn.kind==='foto'){
      h+='<span class="tag">Foto · ¿Qué pizza es?</span>'+photo(p.id,'photo',qn.checked?'Foto de '+p.n:'Foto de una pizza');
    }else{
      h+='<span class="tag">¿Qué pizza es?</span>'+chips(p.i);
    }
    if(!qn.checked){
      h+=typebox('Escribe el nombre de la pizza','Escribe el nombre de la pizza');
    }else{
      h+='<h2 class="pname">'+esc(p.n)+'</h2>'+
        (qn.ok?'<p class="fb good" style="margin:0">Correcto.</p>':'<p class="fb bad" style="margin:0">'+(qn.chosen==='?'?'Esta es '+esc(p.n)+'.':'Respondiste '+esc(BY[qn.chosen].n)+'. Era '+esc(p.n)+'.')+'</p>')+
        (qn.kind==='foto'?chips(p.i):'')+notes(p);
    }
    h+='</div>';
    h+=qn.checked?
      '<button class="btn primary wide mt" data-act="qnext">'+(last?'Ver resultado':'Siguiente')+'</button>':
      '<button class="btn wide mt" data-act="idk">No lo sé</button>';
  }
  app.innerHTML=h;
  if(!qn.checked&&qn.kind==='lleva'){renderQAdded();renderQSug();}
}

/* ---------- COMANDA ---------- */
function startComanda(){
  var c=ui.c;
  var ps=shuffle(pool(c.group)).slice(0,c.n);
  if(!ps.length){c.s=null;c.msg=emptyMsg(c.group);return;}
  c.msg='';
  c.s={mesa:1+Math.floor(Math.random()*24),items:ps.map(function(p){return {id:p.id,shown:false,res:null};}),t0:Date.now(),t1:null,done:false};
}
function rComanda(){
  var c=ui.c,s=c.s,h;
  if(!s){
    h='<h1 class="h">Comanda</h1><p class="sub">Entran varias pizzas a la vez. Cántalas de memoria, mira cómo vas y comprueba una a una.</p>'+
      '<p class="label">Pizzas en la comanda</p><div class="pills" role="group">'+[3,4,5,6,7].map(function(n){return '<button class="pill" data-act="c-n" data-v="'+n+'" aria-pressed="'+(c.n===n)+'">'+n+'</button>';}).join('')+'</div>'+
      '<p class="label">De qué grupo</p>'+groupChips('c-group',c.group,OPT_ALL)+
      (c.msg?'<p class="fb bad" style="margin:0 0 14px">'+c.msg+'</p>':'')+
      '<button class="btn primary wide" data-act="c-start">Cantar comanda</button>';
    app.innerHTML=h;return;
  }
  var good=s.items.filter(function(it){return it.res==='b';}).length;
  h='<div class="ticket"><div class="t-head"><span>Mesa '+s.mesa+'</span><span class="mono" id="timer">'+fmt((s.t1||Date.now())-s.t0)+'</span></div>'+
    '<div class="t-sub">'+s.items.length+' pizzas · entran a la vez</div><ol class="t-list">'+
    s.items.map(function(it,k){
      var p=BY[it.id];
      var r='<li class="t-row"><span class="qty">1×</span><span class="t-name">'+esc(p.n)+'</span>';
      if(it.res)r+='<span class="badge '+(it.res==='b'?'good':'bad')+'">'+(it.res==='b'?'Bien':'Fallé')+'</span>';
      else if(!it.shown)r+='<button class="btn small" data-act="see" data-k="'+k+'">Ver</button>';
      else r+='<span></span>';
      if(it.shown){
        r+='<div class="t-reveal reveal">'+photo(p.id,'photo sm','Foto de '+p.n)+chips(p.i)+notes(p)+(it.res?'':'<div class="actions" style="margin-top:0"><button class="btn no" data-act="grade" data-k="'+k+'" data-v="f">Fallé</button><button class="btn ok" data-act="grade" data-k="'+k+'" data-v="b">Bien</button></div>')+'</div>';
      }
      return r+'</li>';
    }).join('')+'</ol></div>';
  if(s.done){
    h+='<div class="result"><div class="panel"><p class="label">Comanda terminada</p><p class="big">'+good+' de '+s.items.length+' bien en '+fmt(s.t1-s.t0)+'</p></div>'+
      '<div class="actions" style="margin-top:0"><button class="btn" data-act="c-end">Cambiar ajustes</button><button class="btn primary" data-act="c-again">Otra comanda</button></div>'+
      (good<s.items.length?'<button class="btn wide" data-act="c-learn">Repasar las que me faltan en fichas</button>':'')+'</div>';
  }else{
    h+='<button class="btn small mt" data-act="c-end">Abandonar comanda</button>';
  }
  app.innerHTML=h;
  if(!s.done)tick=setInterval(function(){var t=$('#timer');if(t)t.textContent=fmt(Date.now()-s.t0);},500);
}

/* ---------- CARTA ---------- */
function cartaFiltered(){
  var k=ui.k,q=norm(k.q.trim());
  return PIZZAS.filter(function(p){
    if(k.g==='mia'){if(!isMine(p.id))return false;}
    else if(k.g!=='todas'&&p.g!==k.g)return false;
    if(k.b==='tomate'&&!p.i.some(function(x){return /^tomate( o nata)?$/.test(norm(x.n));}))return false;
    if(k.b==='nata'&&!p.i.some(function(x){return /(^|\s)nata$/.test(norm(x.n));}))return false;
    if(q&&!(norm(p.n).indexOf(q)>=0||p.i.some(function(x){return norm(x.n).indexOf(q)>=0;})))return false;
    return true;
  });
}
function renderList(){
  var k=ui.k,q=norm(k.q.trim()),list=cartaFiltered(),h='';
  if(!list.length){h='<p class="empty">No hay pizzas con eso. Prueba con otra palabra.</p>';}
  else{
    ['romana','napolitana','pinsa'].forEach(function(g){
      var part=list.filter(function(p){return p.g===g;});
      if(!part.length)return;
      h+='<p class="gh">'+GH[g]+' · '+part.length+'</p><div class="rows">'+
        part.map(function(p){
          var on=isMine(p.id),open=k.open[p.id];
          return '<article class="row"><div class="row-h">'+
            (PHOTOS[p.id]?'<button class="thumb-btn" data-act="k-photo" data-id="'+p.id+'" aria-expanded="'+(!!open)+'" aria-label="'+(open?'Cerrar':'Ver')+' foto de '+esc(p.n)+'">'+photo(p.id,'thumb','')+'</button>':'')+
            '<h3>'+esc(p.n)+'</h3><div class="row-r">'+
            (store.status[p.id]==='k'?'<span class="known">✓ dominada</span>':'')+
            '<button class="mine-btn" data-act="mine-toggle" data-id="'+p.id+'" aria-pressed="'+on+'">'+(on?'✓ En mi lista':'+ Mi lista')+'</button></div></div>'+
            (open?photo(p.id,'photo','Foto de '+p.n):'')+
            '<ul class="chips">'+p.i.map(function(x){
              var hit=q&&norm(x.n).indexOf(q)>=0?' hit':'';
              return '<li><button class="chip c-'+x.c+hit+'" data-act="k-ing" data-v="'+esc(x.n)+'">'+esc(x.n)+'</button></li>';
            }).join('')+'</ul>'+notes(p)+'</article>';
        }).join('')+'</div>';
    });
  }
  $('#list').innerHTML=h;
}
function rCarta(){
  var k=ui.k;
  var h='<h1 class="h">Carta</h1><p class="sub">Busca por pizza o por ingrediente. Toca un ingrediente para ver qué otras pizzas lo llevan. Toca la miniatura para ver la foto.</p>'+
    '<input class="search" id="search" type="search" placeholder="Pizza o ingrediente, por ejemplo gorgonzola" autocomplete="off" value="'+esc(k.q)+'" aria-label="Buscar en la carta">'+
    groupChips('k-group',k.g,{mine:true})+
    '<div class="pills" role="group">'+[['todas','Cualquier base'],['tomate','Con tomate'],['nata','Con nata']].map(function(it){
      return '<button class="pill" data-act="k-base" data-v="'+it[0]+'" aria-pressed="'+(k.b===it[0])+'">'+it[1]+'</button>';
    }).join('')+'</div><div id="list"></div>'+
    '<details class="legend"><summary>Colores de los ingredientes</summary><ul class="chips">'+
    CATS.map(function(c){return '<li class="chip c-'+c[0]+'">'+c[1]+'</li>';}).join('')+'</ul><p class="note">A.O.V.E. = aceite de oliva virgen extra</p></details>';
  app.innerHTML=h;
  renderList();
}

/* ---------- navegación y eventos ---------- */
function render(){
  if(tick){clearInterval(tick);tick=null;}
  document.querySelectorAll('.tab').forEach(function(b){b.setAttribute('aria-current',b.dataset.tab===ui.tab?'page':'false');});
  ({lista:rLista,fichas:rFichas,quiz:rQuiz,comanda:rComanda,carta:rCarta})[ui.tab]();
}
function goTab(t){ui.tab=t;store.tab=t;save();render();window.scrollTo(0,0);}

function act(a,d){
  var f=ui.f,q=ui.q,c=ui.c,k=ui.k,m=ui.m,top=false;
  switch(a){
    case 'f-deck':f.deck=d.v;newDeck();break;
    case 'flip':f.shown=true;break;
    case 'mark':f.tally[d.v]++;setStatus(f.order[f.idx],d.v);f.idx++;f.shown=false;if(f.idx>=f.order.length)f.done=true;top=true;break;
    case 'f-again':newDeck();top=true;break;
    case 'f-learn':f.deck='aprender';newDeck();top=true;break;
    case 'f-all':f.deck='todas';newDeck();break;
    case 'go-lista':goTab('lista');return;

    case 'q-mode':q.mode=d.v;q.msg='';break;
    case 'q-group':q.group=d.v;q.msg='';break;
    case 'q-start':case 'q-again':startQuiz();top=true;break;
    case 'q-end':q.s=null;q.msg='';top=true;break;
    case 'sug-ing':addIng(d.k,d.n);return;
    case 'rm-ing':{
      var qr=curQ();if(qr.checked)return;
      qr.ans=qr.ans.filter(function(x){return x.k!==d.k;});
      renderQAdded();renderQSug();refocus();return;
    }
    case 'check':{
      var qn2=curQ();if(qn2.checked)return;
      qn2.checked=true;qScore(qn2,gradeIng(qn2).ok);
      break;
    }
    case 'sug-name':answerName(d.id);return;
    case 'idk':{var qn3=curQ();if(qn3.checked)return;qn3.checked=true;qn3.chosen='?';qScore(qn3,false);break;}
    case 'qnext':q.s.i++;if(q.s.i>=q.s.qs.length)q.s.done=true;top=true;break;

    case 'c-n':c.n=+d.v;break;
    case 'c-group':c.group=d.v;c.msg='';break;
    case 'c-start':case 'c-again':startComanda();top=true;break;
    case 'c-end':c.s=null;c.msg='';top=true;break;
    case 'see':c.s.items[+d.k].shown=true;break;
    case 'grade':{
      var it=c.s.items[+d.k];if(it.res)return;
      it.res=d.v;setStatus(it.id,d.v==='b'?'k':'r');
      if(c.s.items.every(function(x){return x.res;})){c.s.done=true;c.s.t1=Date.now();}
      break;
    }
    case 'c-learn':f.deck='aprender';newDeck();goTab('fichas');return;

    case 'k-group':k.g=d.v;break;
    case 'k-base':k.b=d.v;break;
    case 'k-photo':k.open[d.id]=!k.open[d.id];renderList();return;
    case 'k-ing':k.q=d.v;var sb=$('#search');if(sb)sb.value=d.v;renderList();window.scrollTo(0,0);return;

    case 'm-group':m.g=d.v;break;
    case 'mine-toggle':toggleMine(d.id);return;
    case 'm-ask':m.confirm=d.v;renderReset();return;
    case 'm-cancel':m.confirm=null;renderReset();return;
    case 'm-do':
      if(d.v==='reset'){doReset();}
      else{
        store.mine=[];save();updateProg();ui.f.init=false;
        if(f.deck==='mia')f.deck='todas';
        if(q.group==='mia')q.group='todas';
        if(c.group==='mia')c.group='todas';
        if(k.g==='mia')k.g='todas';
      }
      m.confirm=null;break;
    case 'study':
      f.deck=q.group=c.group='mia';
      f.init=false;q.s=null;c.s=null;q.msg='';c.msg='';
      goTab(d.v);return;
  }
  render();
  if(top)window.scrollTo(0,0);
}

app.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');
  if(!el||el.disabled)return;
  act(el.dataset.act,el.dataset);
});
app.addEventListener('input',function(e){
  if(!e.target)return;
  if(e.target.id==='search'){ui.k.q=e.target.value;renderList();}
  else if(e.target.id==='msearch'){ui.m.q=e.target.value;renderMlist();}
  else if(e.target.id==='qi'){renderQSug();}
});
app.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target&&e.target.id==='qi'){e.preventDefault();enterQuiz();}
});
$('#tabs').addEventListener('click',function(e){
  var b=e.target.closest('[data-tab]');
  if(b)goTab(b.dataset.tab);
});

updateProg();
render();
})();
