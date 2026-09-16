/* ===========================================================
   APP SHELL — routing, chrome, event delegation.
   =========================================================== */
import * as S from "./screens.js";
import * as F from "./finance.js";
import * as E from "./engine.js";
import * as AI from "./ai.js";
import { twin, set, reset, loadDemo, saveScenario } from "./store.js";
import { bizById, locById } from "./data.js";
import { $, toast, sheet, closeSheet, esc, aibox, animateNums } from "./ui.js";

const ROUTES = {
  "/welcome":S.welcome, "/lang":S.lang, "/goal":S.goal, "/intro":S.intro,
  "/home":S.home, "/profile":S.profile, "/recommend":S.recommend, "/compare":S.compare,
  "/plan":S.plan, "/money":S.money, "/loan":S.loan, "/whatif":S.whatif,
  "/stress":S.stress, "/risk":S.risk, "/market":S.market, "/schemes":S.schemes,
  "/decision":S.decision, "/action":S.action, "/reverse":S.reverse,
  "/voice":S.voice, "/photo":S.photo, "/demo":S.demo, "/why":S.why
};
const NAV = [
  ["#/home","🏠","Home"], ["#/plan","🏪","Business"], ["#/whatif","🔄","What-If"],
  ["#/market","📊","Market"], ["#/profile","👤","Profile"]
];
const HISTORY = [];

function route() {
  const hash = location.hash.replace("#", "") || "/welcome";
  const p = twin();
  if (!p.onboarded && !["/welcome","/lang","/goal","/intro","/demo"].includes(hash)) {
    location.hash = "#/welcome"; return;
  }
  const fn = ROUTES[hash] || S.home;
  const view = fn();
  const main = $("#screen");
  main.innerHTML = view.html;
  main.scrollTop = 0; window.scrollTo(0, 0);
  renderTop(view, hash);
  renderNav(hash, view.bare);
  $("#mic").style.display = view.bare ? "none" : "block";
  if (HISTORY[HISTORY.length - 1] !== hash) HISTORY.push(hash);
  animateNums(main);
}

function renderTop(view, hash) {
  const t = $("#topbar");
  if (view.bare) { t.style.display = "none"; return; }
  t.style.display = "flex";
  const p = twin();
  t.innerHTML = `
    ${hash !== "/home" ? `<button data-act="back" aria-label="Wapas">←</button>` : `<span style="font-size:24px">🌾</span>`}
    <div style="flex:1;min-width:0">
      <div class="t-title">${esc(view.title || "GramSaarthi")}</div>
      ${view.sub ? `<div class="t-sub">${esc(view.sub)}</div>` : ""}
    </div>
    ${p.demo ? `<span class="chip">DEMO</span>` : ""}
    <button data-act="help" aria-label="Madad">?</button>`;
}

function renderNav(hash, bare) {
  const n = $("#bottomnav");
  if (bare) { n.style.display = "none"; return; }
  n.style.display = "grid";
  n.innerHTML = NAV.map(([h, i, l]) =>
    `<a href="${h}" class="${"#" + hash === h ? "on" : ""}"><span>${i}</span>${l}</a>`).join("");
}

/* ---------------- ACTION DISPATCH ---------------- */
const actions = {
  go: a => { location.hash = a; },
  back: () => { HISTORY.pop(); const prev = HISTORY.pop(); location.hash = "#" + (prev || "/home"); },
  help: () => sheet(`<h2 style="margin-top:0">Madad</h2>
    <p class="small">Har screen par neeche bade button hote hain — wahi agla kadam hai.
    Koi number samajh na aaye to "Details dekhein" par tap karein.</p>
    ${aibox("Kabhi bhi 🎙️ button dabakar apni baat bol sakte hain.")}
    <button class="btn" data-act="closeSheet">Theek hai</button>
    <button class="btn sec" data-act="go" data-arg="#/why">Ye app alag kyun hai?</button>`),
  closeSheet: () => closeSheet(),

  lang: a => { set({ lang:a }); location.hash = "#/goal"; },
  goal: a => { set({ goal:a }); location.hash = "#/intro"; },
  finishOnboard: () => { set({ onboarded:true }); location.hash = "#/profile"; },

  saveProfile: () => {
    const v = id => (document.getElementById(id) || {}).value;
    set({
      name: v("f-name") || "dost",
      locId: v("f-loc"),
      occupation: v("f-occ") || "",
      experienceYears: parseInt(v("f-exp")) || 0,
      capital: parseInt(v("f-cap")) || 0,
      existingEmi: parseInt(v("f-emi")) || 0,
      monthlyIncome: parseInt(v("f-inc")) || 0,
      onboarded:true, assumptions:null
    });
    toast("Save ho gaya ✅");
    location.hash = twin().goal === "market" ? "#/market" : "#/recommend";
  },
  res: a => {
    const r = new Set(twin().resources || []);
    r.has(a) ? r.delete(a) : r.add(a);
    set({ resources:[...r] }); route();
  },
  int: a => {
    const r = new Set(twin().interests || []);
    r.has(a) ? r.delete(a) : r.add(a);
    set({ interests:[...r] }); route();
  },
  risk: a => { set({ riskAppetite:a }); route(); },
  resetAll: () => {
    if (confirm("Sari jaankari mit jayegi. Aage badhein?")) { reset(); location.hash = "#/welcome"; route(); }
  },

  pick: a => {
    const [id, scale] = a.split("|");
    const biz = bizById(id), loc = locById(twin().locId);
    set({ selectedBiz:id, scale, assumptions:F.buildAssumptions(biz, loc, scale), deltas:{} });
    toast(biz.hi + " chuna gaya");
    location.hash = "#/plan";
  },
  scale: a => {
    const p = twin(), biz = bizById(p.selectedBiz), loc = locById(p.locId);
    set({ scale:a, assumptions:F.buildAssumptions(biz, loc, a), deltas:{} });
    route();
  },
  resetDeltas: () => { set({ deltas:{} }); route(); },
  saveScen: () => {
    const { p, live } = S.ctx();
    const pr = F.project(live);
    const d = p.deltas || {};
    const label = Object.keys(d).length
      ? Object.entries(d).map(([k, v]) => `${k.replace("Pct","")} ${v > 0 ? "+" : ""}${v}%`).join(", ")
      : "Normal";
    saveScenario({ label, profit:pr.profit });
    toast("Scenario save ho gaya"); route();
  },
  commodity: a => { set({ marketCommodity:a }); route(); },
  targetSet: a => { set({ targetIncome:parseInt(a) }); route(); },
  demo: a => { loadDemo(a); toast("Demo profile load ho gaya 🎬"); location.hash = "#/home"; },

  mic: () => startListening(),
  example: a => { const t = document.getElementById("v-text"); if (t) { t.value = a; actions.ask(); } },
  ask: () => {
    const el = document.getElementById("v-text");
    const text = el ? el.value.trim() : "";
    if (!text) { toast("Pehle kuch likhein ya boliye"); return; }
    handleUtterance(text);
  },
  photoPick: () => {},
  applyPhoto: () => {
    const p = twin(); const note = p.photoNote;
    if (!note) return;
    const r = new Set(p.resources || []);
    note.items.forEach(i => r.add(i.tag));
    set({ resources:[...r] });
    toast("Resources update ho gaye ✅");
    location.hash = "#/profile";
  }
};

document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  if (el.tagName === "INPUT") return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el.dataset.arg); }
});
$("#sheet-backdrop").addEventListener("click", closeSheet);

/* ---------- range / file inputs ---------- */
document.addEventListener("input", e => {
  const el = e.target;
  const act = el.dataset.act;
  if (!act) return;
  const p = twin();
  if (act === "delta") {
    const d = { ...(p.deltas || {}) }; d[el.dataset.arg] = parseFloat(el.value);
    set({ deltas:d }); debouncedRoute();
  } else if (act === "rate" || act === "tenure") {
    const a = { ...(p.assumptions || S.ctx().a) };
    if (act === "rate") a.interestRate = parseFloat(el.value); else a.tenureMonths = parseInt(el.value);
    set({ assumptions:a }); debouncedRoute();
  } else if (act === "mandiBudget") {
    set({ mandiBudget:parseInt(el.value) }); debouncedRoute();
  } else if (act === "target") {
    set({ targetIncome:parseInt(el.value) }); debouncedRoute();
  }
});
document.addEventListener("change", e => {
  if (e.target.id === "ph-file") {
    const f = e.target.files[0]; if (!f) return;
    const r = AI.analysePhoto(f.name);
    set({ photoNote:r });
    document.getElementById("ph-out").innerHTML = S.photoResult(r);
    toast("Photo analyse ki gayi (demo)");
  }
});
let rt; function debouncedRoute() { clearTimeout(rt); rt = setTimeout(route, 130); }

/* ---------------- VOICE + NLU ---------------- */
function startListening() {
  if (location.hash !== "#/voice") { location.hash = "#/voice"; setTimeout(startListening, 260); return; }
  const btn = $("#mic"), status = document.getElementById("v-status");
  if (!AI.speechSupported()) {
    toast("Is browser mein voice nahi chalti — likh kar poochhein");
    if (status) status.textContent = "Voice support nahi hai — neeche type karein";
    return;
  }
  btn.classList.add("listening");
  if (status) status.textContent = "Sun raha hoon… boliye";
  AI.listen(
    text => {
      btn.classList.remove("listening");
      const t = document.getElementById("v-text"); if (t) t.value = text;
      handleUtterance(text);
    },
    err => {
      btn.classList.remove("listening");
      if (status) status.textContent = "Sunai nahi diya — dobara try karein ya type karein";
      toast("Voice mein dikkat aayi — type kar dijiye");
    },
    twin().lang === "english" ? "en-IN" : "hi-IN"
  );
}

function handleUtterance(text) {
  const intent = AI.parseIntent(text);
  const p = twin();
  const patch = {};
  if (intent.amount) patch.capital = intent.amount;
  if (intent.bizId) {
    patch.interests = [...new Set([...(p.interests || []), intent.bizId])];
    patch.selectedBiz = intent.bizId;
    patch.assumptions = null; patch.deltas = {};
  }
  if (intent.commodityId) patch.marketCommodity = intent.commodityId;
  if (Object.keys(patch).length) set(patch);

  const p2 = twin();
  const heard = [
    intent.amount ? `Paisa: ${F.inr(intent.amount)}` : null,
    intent.bizId ? `Business: ${bizById(intent.bizId).hi}` : null,
    intent.commodityId ? `Cheez: ${intent.commodityId}` : null
  ].filter(Boolean).join(" · ");

  const q = AI.nextQuestion(p2);
  const dest = { loan:"#/loan", scheme:"#/schemes", market:"#/market", risk:"#/risk",
                 reverse:"#/reverse", whatif:"#/whatif", recommend:"#/recommend",
                 advice: intent.bizId ? "#/plan" : "#/recommend" }[intent.intent] || "#/recommend";

  const out = document.getElementById("v-answer");
  if (out) {
    out.innerHTML = `<div class="card">
      <h3>Maine ye samjha</h3>
      <p class="small">“${esc(text)}”</p>
      ${heard ? `<div class="kv"><span>Nikali gayi jaankari</span><b>${esc(heard)}</b></div>` : ""}
      ${aibox(q ? `${q.q}` : "Aapki jaankari kaafi hai — main seedha hisaab dikha deta hoon.")}
      <button class="btn" data-act="go" data-arg="${q ? "#/profile" : dest}">${q ? "Jaankari bharein" : "Aage badhein"}</button>
    </div>`;
    out.scrollIntoView({ behavior:"smooth", block:"nearest" });
  } else {
    location.hash = dest;
  }
}

/* ---------------- BOOT ---------------- */
window.addEventListener("hashchange", route);
window.addEventListener("error", e => {
  console.error(e.error || e.message);
  const m = $("#screen");
  if (m && !m.dataset.errored) {
    m.dataset.errored = "1";
    m.insertAdjacentHTML("afterbegin", `<div class="card" style="border-left:4px solid var(--red)">
      <h3>Abhi kuch dikkat aa rahi hai</h3>
      <p class="small">Aapki saved jaankari surakshit hai.</p>
      <button class="btn" data-act="go" data-arg="#/home">Wapas Home</button></div>`);
  }
});
$("#mic").addEventListener("click", startListening);
route();

/* PWA */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
let deferred;
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferred = e;
  setTimeout(() => {
    if (!twin().onboarded) return;
    sheet(`<h2 style="margin-top:0">📲 Phone mein add karein</h2>
      <p class="small">GramSaarthi ko home screen par lagayein — app ki tarah khulega aur internet slow ho tab bhi chalega.</p>
      <button class="btn" data-act="install">Add to Home Screen</button>
      <button class="btn sec" data-act="closeSheet">Abhi nahi</button>`);
  }, 12000);
});
actions.install = async () => {
  closeSheet();
  if (deferred) { deferred.prompt(); deferred = null; }
  else toast("Browser menu se 'Add to Home screen' chunein");
};
window.addEventListener("offline", () => toast("Internet nahi hai — calculations phir bhi chalenge"));
