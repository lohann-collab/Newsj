(() => {
  const COLORS = ["#ffbf69","#ff805d","#6e9eff","#60d5a5","#be94ff","#f06f9b","#6fd3df","#c7d66b"];
  const defaults = {
    showName: "Francia Politique",
    status: "Résultats de la simulation",
    announcement: "Bienvenue sur Francia Politique. La soirée électorale va bientôt commencer.",
    candidates: [
      {name:"Nicolas Monclaire", percent:28, color:"#ffbf69"},
      {name:"Camille Durand", percent:24, color:"#ff805d"},
      {name:"Alexandre Morel", percent:19, color:"#6e9eff"},
      {name:"Sarah Bernard", percent:16, color:"#60d5a5"},
      {name:"Julien Lefèvre", percent:13, color:"#be94ff"}
    ]
  };
  const $ = id => document.getElementById(id);
  let data = loadData();
  let micStream = null;

  function loadData() {
    try {
      const saved = localStorage.getItem("francia-politique-data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.candidates) && parsed.candidates.length) return parsed;
      }
    } catch (_) {}
    return structuredClone(defaults);
  }
  function saveData() {
    try { localStorage.setItem("francia-politique-data", JSON.stringify(data)); }
    catch (_) { /* Le site reste utilisable même si le stockage est désactivé. */ }
  }
  function esc(str) {
    return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function initials(name) {
    return name.trim().split(/\s+/).slice(0,2).map(part => part[0] || "").join("").toUpperCase() || "?";
  }
  function total() { return data.candidates.reduce((sum, c) => sum + (Number(c.percent) || 0), 0); }
  function ranked() { return [...data.candidates].sort((a,b) => Number(b.percent)-Number(a.percent)); }
  function render() {
    document.title = `${data.showName || "Francia Politique"} — Soirée électorale`;
    document.querySelector(".brand span:nth-child(2)").innerHTML = `${esc(data.showName || "FRANCIA POLITIQUE").toUpperCase()}<small>LA SOIRÉE ÉLECTORALE</small>`;
    $("statusText").textContent = data.status || "Résultats de la simulation";
    $("announcementText").textContent = data.announcement || "Aucune annonce pour le moment.";
    const list = ranked();
    const sum = total();
    $("candidateList").innerHTML = list.map((c, i) => {
      const p = Math.max(0, Math.min(100, Number(c.percent) || 0));
      const normalized = sum > 0 ? p / sum * 100 : 0;
      return `<div class="candidate-row">
        <div class="candidate-person"><div class="candidate-avatar" style="background:${safeColor(c.color)}">${esc(initials(c.name))}</div>
          <div><div class="candidate-name">${esc(c.name || "Candidat sans nom")}</div><div class="candidate-sub">${i === 0 ? "En tête" : `Position ${i+1}`}</div></div></div>
        <div class="bar-track"><div class="bar-fill" style="width:${normalized}%;background:${safeColor(c.color)}"></div></div>
        <div class="candidate-value">${p.toLocaleString("fr-FR",{maximumFractionDigits:1})}<small>% des voix</small></div>
      </div>`;
    }).join("");
    $("totalPercent").textContent = `Total saisi : ${sum.toLocaleString("fr-FR",{maximumFractionDigits:1})} %`;
    $("chartCount").textContent = data.candidates.length;
    let acc = 0;
    const slices = data.candidates.map(c => {
      const share = sum > 0 ? Math.max(0, Number(c.percent)||0) / sum * 100 : 0;
      const start = acc; acc += share;
      return `${safeColor(c.color)} ${start}% ${acc}%`;
    });
    $("donut").style.background = sum > 0 ? `conic-gradient(${slices.join(",")})` : "#30394a";
    $("chartLegend").innerHTML = list.map(c => `<div class="legend-item"><span class="legend-swatch" style="background:${safeColor(c.color)}"></span><span>${esc(c.name || "Candidat sans nom")}</span><b>${(Number(c.percent)||0).toLocaleString("fr-FR",{maximumFractionDigits:1})}%</b></div>`).join("");
    const leader = list[0];
    $("leaderName").textContent = leader ? leader.name : "Aucun candidat";
    $("leaderScore").textContent = leader ? `${(Number(leader.percent)||0).toLocaleString("fr-FR",{maximumFractionDigits:1})} %` : "—";
    $("leaderTrack").style.width = leader && sum > 0 ? `${Math.min(100,(Number(leader.percent)||0)/sum*100)}%` : "0%";
    $("lastUpdate").textContent = "Mis à jour à " + new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  }
  function safeColor(color) { return /^#[0-9a-f]{6}$/i.test(color || "") ? color : COLORS[0]; }
  function openAdmin() {
    $("showName").value = data.showName || "";
    $("statusInput").value = data.status || "";
    $("announcementInput").value = data.announcement || "";
    renderEditor();
    $("adminOverlay").classList.add("open");
    $("adminOverlay").setAttribute("aria-hidden","false");
  }
  function closeAdmin() {
    $("adminOverlay").classList.remove("open");
    $("adminOverlay").setAttribute("aria-hidden","true");
  }
  function renderEditor() {
    $("candidateEditor").innerHTML = data.candidates.map((c,i) => `
      <div class="editor-row" data-index="${i}">
        <input type="text" aria-label="Nom du candidat ${i+1}" data-field="name" maxlength="70" value="${esc(c.name)}" placeholder="Nom du candidat">
        <input type="number" aria-label="Pourcentage du candidat ${i+1}" data-field="percent" min="0" max="100" step="0.1" value="${Number(c.percent)||0}">
        <input type="color" aria-label="Couleur du candidat ${i+1}" data-field="color" value="${safeColor(c.color)}">
        <button type="button" class="remove-candidate" data-remove="${i}" aria-label="Supprimer le candidat ${i+1}" title="Supprimer">×</button>
      </div>`).join("");
    $("addCandidate").disabled = data.candidates.length >= 8;
    $("addCandidate").style.opacity = data.candidates.length >= 8 ? ".45" : "1";
  }
  function readEditor() {
    const rows = [...$("candidateEditor").querySelectorAll(".editor-row")];
    data.candidates = rows.map(row => {
      const get = field => row.querySelector(`[data-field="${field}"]`).value;
      return {name:get("name").trim() || "Candidat sans nom", percent:Math.max(0,Math.min(100,Number(get("percent"))||0)), color:safeColor(get("color"))};
    });
  }
  $("openAdmin").addEventListener("click", openAdmin);
  $("closeAdmin").addEventListener("click", closeAdmin);
  $("adminOverlay").addEventListener("click", e => { if (e.target === $("adminOverlay")) closeAdmin(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeAdmin(); });
  $("candidateEditor").addEventListener("click", e => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    if (data.candidates.length <= 1) { alert("Il faut conserver au moins un candidat."); return; }
    data.candidates.splice(Number(btn.dataset.remove),1);
    renderEditor();
  });
  $("candidateEditor").addEventListener("input", e => {
    if (e.target.matches("[data-field]")) {
      readEditor();
      render();
    }
  });
  $("addCandidate").addEventListener("click", () => {
    if (data.candidates.length >= 8) return;
    data.candidates.push({name:`Nouveau candidat ${data.candidates.length+1}`,percent:0,color:COLORS[data.candidates.length % COLORS.length]});
    renderEditor();
  });
  $("settingsForm").addEventListener("submit", e => {
    e.preventDefault();
    readEditor();
    data.showName = $("showName").value.trim() || "Francia Politique";
    data.status = $("statusInput").value.trim() || "Résultats de la simulation";
    data.announcement = $("announcementInput").value.trim() || "Aucune annonce pour le moment.";
    saveData(); render(); closeAdmin();
  });
  $("announceLeader").addEventListener("click", () => {
    readEditor();
    const leader = ranked()[0];
    if (!leader) return;
    $("announcementInput").value = `${leader.name} est actuellement en tête de notre simulation avec ${(Number(leader.percent)||0).toLocaleString("fr-FR",{maximumFractionDigits:1})} % des suffrages.`;
  });
  $("resetData").addEventListener("click", () => {
    if (!confirm("Réinitialiser tous les candidats et les annonces ?")) return;
    data = structuredClone(defaults);
    saveData(); openAdmin(); render();
  });
  $("micButton").addEventListener("click", async () => {
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
      $("micAudio").srcObject = null;
      $("micButton").textContent = "🎙 Activer le micro";
      $("micStatus").textContent = "Micro désactivé";
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $("micStatus").textContent = "Micro indisponible : utilisez HTTPS ou localhost.";
      return;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({audio:true});
      $("micAudio").srcObject = micStream;
      $("micAudio").muted = true;
      $("micButton").textContent = "Arrêter le micro";
      $("micStatus").textContent = "Micro autorisé (local uniquement)";
    } catch (err) {
      $("micStatus").textContent = err && err.name === "NotAllowedError" ? "Autorisation du micro refusée." : "Impossible d’accéder au micro.";
    }
  });
  window.addEventListener("storage", e => {
    if (e.key === "francia-politique-data" && e.newValue) {
      try { data = JSON.parse(e.newValue); render(); } catch (_) {}
    }
  });
  render();
})();