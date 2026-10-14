(() => {
  "use strict";
  const COLORS = ["#ffbf69","#ff805d","#6e9eff","#60d5a5","#be94ff","#f06f9b","#6fd3df","#c7d66b"];
  const DEFAULTS = {
    showName:"Francia Politique",
    status:"Résultats de la simulation",
    announcement:"Bienvenue sur Francia Politique. La soirée électorale va bientôt commencer.",
    candidates:[
      {name:"Nicolas Monclaire",percent:28,color:"#ffbf69"},
      {name:"Camille Durand",percent:24,color:"#ff805d"},
      {name:"Alexandre Morel",percent:19,color:"#6e9eff"},
      {name:"Sarah Bernard",percent:16,color:"#60d5a5"},
      {name:"Julien Lefèvre",percent:13,color:"#be94ff"}
    ]
  };
  const $ = id => document.getElementById(id);
  let data = null, token = null, toastTimer = null, pollTimer = null;
  const API = "/api/state";

  function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function colorSafe(c){return /^#[0-9a-f]{6}$/i.test(c||"")?c:COLORS[0];}
  function initials(name){return String(name||"").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"?";}
  function ranked(){return [...(data?.candidates||[])].sort((a,b)=>Number(b.percent)-Number(a.percent));}
  function total(){return (data?.candidates||[]).reduce((n,c)=>n+(Number(c.percent)||0),0);}
  function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),3000);}
  async function request(url,options={}) {
    const headers={...(options.headers||{})};
    if(token) headers.Authorization=`Bearer ${token}`;
    if(options.body) headers["Content-Type"]="application/json";
    const res=await fetch(url,{...options,headers,cache:"no-store"});
    const body=await res.json().catch(()=>({error:"Réponse serveur invalide"}));
    if(!res.ok) throw new Error(body.error||`Erreur serveur (${res.status})`);
    return body;
  }
  async function loadState(showError=false){
    try{
      data=await request(API);
      render();
      return true;
    }catch(err){
      $("statusText").textContent="Serveur indisponible";
      $("lastUpdate").textContent="Vérifiez le déploiement de l’API";
      if(showError) toast(err.message);
      return false;
    }
  }
  function render(){
    if(!data)return;
    document.title=`${data.showName||"Francia Politique"} — Soirée électorale`;
    document.querySelector(".brand span:nth-child(2)").innerHTML=`${escapeHtml((data.showName||"FRANCIA POLITIQUE").toUpperCase())}<small>LA SOIRÉE ÉLECTORALE</small>`;
    $("statusText").textContent=data.status||"Résultats de la simulation";
    $("announcementText").textContent=data.announcement||"Aucune annonce pour le moment.";
    const list=ranked(),sum=total();
    $("candidateList").innerHTML=list.map((c,i)=>{
      const p=Math.max(0,Math.min(100,Number(c.percent)||0)),norm=sum>0?p/sum*100:0;
      return `<div class="candidate-row"><div class="candidate-person"><div class="candidate-avatar" style="background:${colorSafe(c.color)}">${escapeHtml(initials(c.name))}</div><div><div class="candidate-name">${escapeHtml(c.name||"Candidat sans nom")}</div><div class="candidate-sub">${i===0?"En tête":`Position ${i+1}`}</div></div></div><div class="bar-track"><div class="bar-fill" style="width:${norm}%;background:${colorSafe(c.color)}"></div></div><div class="candidate-value">${p.toLocaleString("fr-FR",{maximumFractionDigits:1})}<small>% des voix</small></div></div>`;
    }).join("");
    $("totalPercent").textContent=`Total saisi : ${sum.toLocaleString("fr-FR",{maximumFractionDigits:1})} %`;
    $("chartCount").textContent=data.candidates.length;
    let acc=0;
    const slices=data.candidates.map(c=>{const share=sum>0?Math.max(0,Number(c.percent)||0)/sum*100:0;const start=acc;acc+=share;return `${colorSafe(c.color)} ${start}% ${acc}%`;});
    $("donut").style.background=sum>0?`conic-gradient(${slices.join(",")})`:"#30394a";
    $("chartLegend").innerHTML=list.map(c=>`<div class="legend-item"><span class="legend-swatch" style="background:${colorSafe(c.color)}"></span><span>${escapeHtml(c.name||"Candidat sans nom")}</span><b>${(Number(c.percent)||0).toLocaleString("fr-FR",{maximumFractionDigits:1})}%</b></div>`).join("");
    const leader=list[0];$("leaderName").textContent=leader?.name||"Aucun candidat";$("leaderScore").textContent=leader?`${(Number(leader.percent)||0).toLocaleString("fr-FR",{maximumFractionDigits:1})} %`:"—";$("leaderTrack").style.width=leader&&sum>0?`${Math.min(100,(Number(leader.percent)||0)/sum*100)}%`:"0%";
    $("lastUpdate").textContent="Mis à jour à "+new Date(data.updatedAt||Date.now()).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  }
  function renderEditor(){
    $("candidateEditor").innerHTML=data.candidates.map((c,i)=>`<div class="editor-row" data-index="${i}"><input type="text" data-field="name" aria-label="Nom du candidat" maxlength="70" value="${escapeHtml(c.name)}" placeholder="Nom du candidat"><input type="number" data-field="percent" aria-label="Pourcentage" min="0" max="100" step="0.1" value="${Number(c.percent)||0}"><input type="color" data-field="color" aria-label="Couleur" value="${colorSafe(c.color)}"><button type="button" class="remove-candidate" data-remove="${i}" aria-label="Supprimer">×</button></div>`).join("");
    $("addCandidate").disabled=data.candidates.length>=8;
  }
  function readEditor(){
    data.candidates=[...$("candidateEditor").querySelectorAll(".editor-row")].map(row=>{
      const get=f=>row.querySelector(`[data-field="${f}"]`).value;
      return {name:get("name").trim()||"Candidat sans nom",percent:Math.max(0,Math.min(100,Number(get("percent"))||0)),color:colorSafe(get("color"))};
    });
  }
  function openAdmin(){ $("adminOverlay").classList.add("open");$("adminOverlay").setAttribute("aria-hidden","false");if(token)showControls();else{$("adminLogin").hidden=false;$("adminControls").hidden=true;$("adminPassword").focus();} }
  function closeAdmin(){ $("adminOverlay").classList.remove("open");$("adminOverlay").setAttribute("aria-hidden","true"); }
  function showControls(){ $("adminLogin").hidden=true;$("adminControls").hidden=false;$("loginError").textContent="";$("showName").value=data.showName||"";$("statusInput").value=data.status||"";$("announcementInput").value=data.announcement||"";renderEditor(); }
  async function login(){
    const password=$("adminPassword").value;
    if(!password){$("loginError").textContent="Saisis le mot de passe.";return;}
    try{
      const result=await request("/api/login",{method:"POST",body:JSON.stringify({password})});
      token=result.token;
      sessionStorage.setItem("fp_admin_token",token);
      await loadState();
      showControls();
      toast("Connexion administrateur réussie.");
    }catch(err){$("loginError").textContent=err.message||"Connexion impossible.";}
  }
  async function saveSettings(){
    readEditor();
    const payload={showName:$("showName").value.trim()||"Francia Politique",status:$("statusInput").value.trim()||"Résultats de la simulation",announcement:$("announcementInput").value.trim()||"Aucune annonce pour le moment.",candidates:data.candidates};
    try{
      data=await request(API,{method:"PUT",body:JSON.stringify(payload)});
      render();renderEditor();toast("Modifications publiées pour tous les visiteurs.");
    }catch(err){toast(err.message);}
  }
  $("openAdmin").addEventListener("click",openAdmin);
  $("closeAdmin").addEventListener("click",closeAdmin);
  $("adminOverlay").addEventListener("click",e=>{if(e.target===$("adminOverlay"))closeAdmin();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAdmin();});
  $("loginButton").addEventListener("click",login);
  $("adminPassword").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();login();}});
  $("settingsForm").addEventListener("submit",async e=>{e.preventDefault();await saveSettings();});
  $("candidateEditor").addEventListener("input",e=>{if(e.target.matches("[data-field]")){readEditor();render();}});
  $("candidateEditor").addEventListener("click",e=>{
    const b=e.target.closest("[data-remove]");if(!b)return;
    if(data.candidates.length<=1){toast("Conservez au moins un candidat.");return;}
    data.candidates.splice(Number(b.dataset.remove),1);renderEditor();render();
  });
  $("addCandidate").addEventListener("click",()=>{if(data.candidates.length>=8)return;data.candidates.push({name:`Nouveau candidat ${data.candidates.length+1}`,percent:0,color:COLORS[data.candidates.length%COLORS.length]});renderEditor();});
  $("announceLeader").addEventListener("click",()=>{readEditor();const c=ranked()[0];if(c)$("announcementInput").value=`${c.name} est actuellement en tête de notre simulation avec ${(Number(c.percent)||0).toLocaleString("fr-FR",{maximumFractionDigits:1})} % des suffrages.`;});
  $("resetData").addEventListener("click",async()=>{
    if(!confirm("Réinitialiser les candidats et les annonces ?"))return;
    try{data=await request("/api/reset",{method:"POST",body:JSON.stringify({})});showControls();render();toast("Données réinitialisées.");}
    catch(err){toast(err.message);}
  });
  $("logoutButton").addEventListener("click",()=>{token=null;sessionStorage.removeItem("fp_admin_token");$("adminLogin").hidden=false;$("adminControls").hidden=true;$("adminPassword").value="";toast("Déconnecté.");});
  try{token=sessionStorage.getItem("fp_admin_token");}catch(_){}
  loadState(true);
  pollTimer=setInterval(()=>loadState(false),4000);
})();