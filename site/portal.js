/* Compact research portal: one chapter and one topic at a time.
 * Source sections are MOVED, not cloned or replaced. Without JS the entire
 * original scientific narrative remains visible and every anchor works. */
"use strict";
(() => {
  const guide = document.getElementById("recorrido");
  const grid = guide?.querySelector(".chapter-grid");
  if (!guide || !grid) return;

  const definitions = [
    {key:"study", name:"El estudio", intro:"Datos, variables y series observadas.",
      topics:[["datos","Parcelas"],["variables","26 variables"],["preparacion","Preparación y clima"]]},
    {key:"models", name:"Los modelos", intro:"Ensamble, arquitectura, geología y entrenamiento.",
      topics:[["ensamble","Ensamble y componentes"],["arquitectura","Arquitectura"],["geologia","Geología"],["faltantes","Datos faltantes"],["ajuste","Entrenamiento"]]},
    {key:"evidence", name:"Evaluación", intro:"Métricas, inferencia estadística y límites.",
      topics:[["resultados","Resultados"],["pruebas","Pruebas estadísticas"],["limites","Limitaciones"],["preguntas","Preguntas frecuentes"]]},
    {key:"explore", name:"Explorar", intro:"Herramientas de predicción y cartografía.",
      topics:[["simulador","Laboratorio de parcelas"],["mapa-interactivo","Mapa interactivo"]]}
  ];
  const original = definitions.map(d => d.topics.map(([id]) =>
    document.getElementById(id)));
  if (original.some(group => group.some(node => !node))) return;
  const cards = [...grid.querySelectorAll(".chapter-card")];
  if (cards.length !== definitions.length) return;

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const make = (tag, className, textValue) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (textValue !== undefined) node.textContent = textValue;
    return node;
  };
  const decks = make("div","portal-decks");
  decks.id = "capitulos";
  decks.setAttribute("aria-label","Capítulos y subsecciones del estudio");
  const state = new Map();
  const timing = new WeakMap();
  let activeChapter = null, navigationCounter = 0;

  definitions.forEach((definition, index) => {
    const {key,name,intro,topics} = definition;
    const card = cards[index];
    card.dataset.portalCard = key;
    card.classList.add("portal-card");
    const action = make("button","portal-open","Abrir capítulo");
    action.type = "button";
    action.setAttribute("aria-controls","portal-panel-"+key);
    action.setAttribute("aria-expanded","false");
    action.setAttribute("aria-label","Abrir capítulo: "+name);
    card.appendChild(action);

    const panel = make("section","portal-chapter");
    panel.id = "portal-panel-"+key;
    panel.dataset.portalChapter = key;
    panel.setAttribute("aria-labelledby","portal-title-"+key);
    const header = make("div","portal-chapter-header");
    const lead = make("div","portal-chapter-lead");
    const eyebrow = make("p","portal-eyebrow","CAPÍTULO "+String(index+1).padStart(2,"0")+" / 04");
    const title = make("h2","portal-chapter-title",name);
    title.id = "portal-title-"+key;
    lead.append(eyebrow,title,make("p","portal-chapter-intro",intro));
    const close = make("button","portal-close","Cerrar capítulo ×");
    close.type = "button";
    close.addEventListener("click",() => { closeAll(); scrollTo(guide); });
    header.append(lead,close);

    const tabs = make("div","portal-topic-tabs");
    tabs.setAttribute("role","tablist");
    tabs.setAttribute("aria-label","Apartados de "+name);
    const body = make("div","portal-topic-body");
    const topicButtons = new Map();
    const topicNodes = new Map();
    topics.forEach(([id,label],topicIndex) => {
      const button=make("button","portal-topic-button",label);
      button.id="portal-tab-"+id;
      button.type="button";
      button.setAttribute("role","tab");
      button.setAttribute("aria-controls",id);
      button.setAttribute("aria-selected","false");
      button.tabIndex=-1;
      button.addEventListener("click",() => {
        select(key,id,{hash:"#"+id,target:document.getElementById(id),scroll:true});
      });
      button.addEventListener("keydown",event => {
        const keys=["ArrowLeft","ArrowRight","Home","End"];
        if(!keys.includes(event.key))return;
        event.preventDefault();
        let next=topicIndex;
        if(event.key==="Home") next=0;
        else if(event.key==="End") next=topics.length-1;
        else next=(topicIndex+(event.key==="ArrowRight"?1:topics.length-1))%topics.length;
        const sibling=topics[next][0];
        topicButtons.get(sibling).focus();
        select(key,sibling,{hash:"#"+sibling,target:document.getElementById(sibling),scroll:false});
      });
      topicButtons.set(id,button);
      tabs.appendChild(button);
      const section=original[index][topicIndex];
      section.classList.add("portal-topic");
      section.dataset.portalTopic=id;
      section.setAttribute("role","tabpanel");
      section.setAttribute("aria-labelledby",button.id);
      topicNodes.set(id,section);
      body.appendChild(section);
    });
    panel.append(header,tabs,body);
    decks.appendChild(panel);
    state.set(key,{panel,card,action,topics,topicButtons,topicNodes,selected:topics[0][0]});
    action.addEventListener("click",() => {
      if(activeChapter===key){closeAll();scrollTo(guide);return;}
      const first=state.get(key).selected;
      select(key,first,{hash:"#"+first,target:document.getElementById(first),scroll:true});
    });
    card.addEventListener("click",event=>{
      if(event.target.closest("a,button"))return;
      action.click();
    });
    card.addEventListener("keydown",event=>{
      if(event.target!==card || !["Enter"," "].includes(event.key))return;
      event.preventDefault();action.click();
    });
    card.tabIndex=0;
    card.setAttribute("role","group");
  });
  guide.insertAdjacentElement("afterend",decks);

  // The original Reference26 flowchart is kept in the architecture topic,
  // rather than occupying the short homepage.
  const diagram = document.querySelector(".model-hero .hero-visual");
  const architecture = document.querySelector("#arquitectura .shell");
  if (diagram && architecture) {
    diagram.classList.add("portal-method-figure");
    const heading = architecture.querySelector(".section-heading");
    if (heading) heading.insertAdjacentElement("afterend",diagram);
    else architecture.appendChild(diagram);
  }

  // Move the lists of links off the square tiles into the appropriate
  // expanded chapter. They remain keyboard-accessible, never discarded.
  cards.forEach((card,index) => {
    const links=card.querySelector(".chapter-subsections");
    if(!links)return;
    links.classList.add("portal-extra-links");
    state.get(definitions[index].key).panel.appendChild(links);
  });
  document.documentElement.classList.add("portal-ready");

  const markCard = (key,active) => {
    const item=state.get(key);
    item.card.classList.toggle("portal-active",active);
    item.action.setAttribute("aria-expanded",String(active));
    item.action.textContent=active?"Cerrar capítulo":"Abrir capítulo";
    item.action.setAttribute("aria-label",(active?"Cerrar":"Abrir")+" capítulo: "+
      definitions.find(d=>d.key===key).name);
  };
  const settle = (panel,token,open) => {
    if(timing.get(panel)!==token)return;
    if(!open)panel.hidden=true;
    panel.style.height=open?"auto":"0px";
    panel.style.opacity=open?"1":"0";
  };
  const showPanel = (panel,open) => {
    const token=(timing.get(panel)||0)+1;
    timing.set(panel,token);
    if(reducedMotion()){
      panel.hidden=!open;
      panel.classList.toggle("is-open",open);
      settle(panel,token,open);
      return;
    }
    if(open){
      panel.hidden=false;
      panel.style.height="0px";
      panel.style.opacity="0";
      panel.getBoundingClientRect(); // Establish transition start.
      panel.classList.add("is-open");
      panel.style.height=panel.scrollHeight+"px";
      panel.style.opacity="1";
    } else {
      panel.style.height=panel.scrollHeight+"px";
      panel.getBoundingClientRect();
      panel.classList.remove("is-open");
      panel.style.height="0px";
      panel.style.opacity="0";
    }
    window.setTimeout(()=>settle(panel,token,open),600);
  };
  const closeAll = () => {
    navigationCounter++;
    for(const [key,item] of state){
      if(!item.panel.hidden)showPanel(item.panel,false);
      markCard(key,false);
    }
    activeChapter=null;
    window.dispatchEvent(new Event("portal:change"));
  };
  const scrollTo = (element,token=navigationCounter) => {
    if(!element)return;
    window.setTimeout(()=>{
      if(token!==navigationCounter)return;
      element.scrollIntoView({behavior:reducedMotion()?"auto":"smooth",block:"start"});
    },reducedMotion()?0:615);
  };
  const select = (key,topicId,options={}) => {
    const selected=state.get(key);
    if(!selected || !selected.topicNodes.has(topicId))return;
    navigationCounter++;
    const token=navigationCounter;
    for(const [otherKey,item] of state){
      if(otherKey!==key && !item.panel.hidden)showPanel(item.panel,false);
      markCard(otherKey,otherKey===key);
    }
    selected.selected=topicId;
    for(const [id,node] of selected.topicNodes){
      const on=id===topicId;
      node.hidden=!on;
      const tab=selected.topicButtons.get(id);
      tab.classList.toggle("is-active",on);
      tab.setAttribute("aria-selected",String(on));
      tab.tabIndex=on?0:-1;
    }
    const hasOpened=activeChapter===key && !selected.panel.hidden;
    if(!hasOpened)showPanel(selected.panel,true);
    else if(selected.panel.style.height && selected.panel.style.height!=="auto")
      selected.panel.style.height=selected.panel.scrollHeight+"px";
    activeChapter=key;

    // Hidden Reference26 tab content must be enabled before following its
    // original #predicciones-59 link.
    if(options.target?.closest("#reference26-view")){
      const button=document.querySelector('[data-ensemble-tab="Reference26"]');
      if(button && button.getAttribute("aria-selected")!=="true") button.click();
    }
    if(options.hash && window.location.hash!==options.hash)
      window.history.pushState(null,"",options.hash);
    window.dispatchEvent(new Event("portal:change"));
    if(options.scroll)scrollTo(options.target||selected.panel,token);
  };

  // Preserve every old hash link, including references from inside figures,
  // and automatically expose the correct chapter + subsection on navigation.
  const route = (hash,options={}) => {
    const id=decodeURIComponent((hash||"").replace(/^#/,""));
    if(!id || ["inicio","recorrido","contenido","capitulos"].includes(id)){
      closeAll();
      const target=id?document.getElementById(id):document.getElementById("inicio");
      if(options.scroll)scrollTo(target);
      return;
    }
    const target=document.getElementById(id);
    const topic=target?.closest(".portal-topic");
    if(!topic){
      if(target && options.scroll)scrollTo(target);
      return;
    }
    const panel=topic.closest("[data-portal-chapter]");
    select(panel.dataset.portalChapter,topic.dataset.portalTopic,
      {target,scroll:options.scroll,hash:options.push?hash:null});
  };
  document.addEventListener("click",event => {
    const anchor=event.target.closest('a[href^="#"]');
    if(!anchor || event.defaultPrevented || event.button!==0 ||
        event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)return;
    const hash=anchor.getAttribute("href");
    const id=decodeURIComponent(hash.slice(1));
    if(!id || !document.getElementById(id))return;
    event.preventDefault();
    route(hash,{scroll:true,push:true});
    // Route to homepage/guide as well, with normal history semantics.
    if(window.location.hash!==hash)window.history.pushState(null,"",hash);
  });
  window.addEventListener("popstate",()=>route(window.location.hash,{scroll:true}));
  window.addEventListener("hashchange",()=>route(window.location.hash,{scroll:true}));

  for(const [key,item] of state){
    item.panel.hidden=true;
    item.panel.style.height="0px";
    item.panel.style.opacity="0";
    markCard(key,false);
    for(const [id,node] of item.topicNodes){
      const first=id===item.selected;
      node.hidden=!first;
      item.topicButtons.get(id).setAttribute("aria-selected",String(first));
    }
  }
  // Support deep links loaded directly or refreshed, including links into
  // the gallery embedded inside the ensemble's existing Reference26 tab.
  if(window.location.hash && window.location.hash!=="#inicio")
    window.requestAnimationFrame(()=>route(window.location.hash,{scroll:true}));
})();
