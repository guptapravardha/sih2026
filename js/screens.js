/* ===========================================================
   SCREENS — presentation only. All numbers come from
   finance.js / engine.js; all narration from ai.js.
   =========================================================== */
import { BUSINESSES, LOCATIONS, RESOURCES, COMMODITIES, bizById, locById } from "./data.js";
import * as F from "./finance.js";
import * as E from "./engine.js";
import * as AI from "./ai.js";
import { twin, set, reset, loadDemo, DEMOS, saveScenario } from "./store.js";
import { esc, kv, pill, badge, bar, aibox, sparkline, hbars, DISCLAIMER, sheet, closeSheet, toast } from "./ui.js";

const inr = F.inr;
export const go = h => { location.hash = h; };

/* ---------- shared context ---------- */
export function ctx() {
  const p = twin();
  const loc = locById(p.locId);
  const biz = p.selectedBiz ? bizById(p.selectedBiz) : null;
  let a = p.assumptions;
  if (biz && (!a || a.bizId !== biz.id || a.locId !== p.locId)) {
    a = F.buildAssumptions(biz, loc, p.scale || "balanced");
  }
  const live = a ? F.applyDeltas(a, p.deltas || {}) : null;
  return { p, loc, biz, a, live };
}
function needBiz() {
  const { biz } = ctx();
  if (!biz) { return `<div class="empty"><div style="font-size:44px">🧭</div>
    <p>Pehle ek business chunein, phir yahan uska hisaab dikhega.</p>
    <button class="btn" data-act="go" data-arg="#/recommend">Business Suggest Karein</button></div>`; }
  return null;
}
const nextBtns = (list) => `<div style="margin-top:14px">${list.map(([t, h, c]) =>
  `<button class="btn ${c || ""}" data-act="go" data-arg="${h}">${t}</button>`).join("")}</div>`;

/* ===================== ONBOARDING ===================== */
export const welcome = () => ({
  bare:true,
  html:`<div class="onb">
    <div class="art">🌾</div>
    <h1>Namaste 👋</h1>
    <p class="sub" style="font-size:17px">Main <b>GramSaarthi</b> hoon.<br>Main aapke business ke faisle mein madad karunga.</p>
    <p class="small" style="margin-top:14px">“Aapke business ka faisla, aapke area aur aapke paison ke hisaab se.”</p>
    <button class="btn" data-act="go" data-arg="#/lang">Shuru Karein</button>
    <button class="btn sec" data-act="go" data-arg="#/demo">🎬 Judge Demo Mode</button>
  </div>`
});

export const lang = () => ({
  bare:true,
  html:`<div class="onb">
    <div class="art">🗣️</div>
    <h1>Aap kis language mein baat karna chahenge?</h1>
    <p class="sub">Baad mein badal sakte hain.</p>
    <div style="margin-top:16px">
      ${[["hindi","हिंदी"],["english","English"],["hinglish","Hinglish (mix)"]].map(([id, l]) =>
        `<button class="tile" data-act="lang" data-arg="${id}"><span class="ic">🔤</span><span><b>${l}</b>
        <small>${id === "hinglish" ? "Sabse aasan — recommended" : "Poori app is bhasha mein"}</small></span></button>`).join("")}
    </div>
    <p class="small">Aage regional bhashaon (Marathi, Bhojpuri, Marwari) ke liye architecture ready hai.</p>
  </div>`
});

export const goal = () => ({
  bare:true,
  html:`<div class="onb" style="justify-content:flex-start;padding-top:20px">
    <h1 style="text-align:left">Aap kya karna chahte hain?</h1>
    <p class="sub" style="text-align:left">Jo sabse zyada zaroori hai wahi chunein.</p>
    ${[["new","💡","Naya business shuru karna","Kaunsa kaam mere liye theek hai"],
       ["grow","📈","Apna business badhana","Jo chal raha hai use aage le jaana"],
       ["money","💰","Loan / paise ka plan banana","Kitna paisa, kahan se, EMI kitni"],
       ["market","📊","Apne market ko samajhna","Rate, demand, kitna maal lein"],
       ["scheme","🏛️","Government scheme dekhna","Mere liye kaunsi yojana"],
       ["check","✅","Bas ek idea check karna","Ye business chalega ya nahi"]
      ].map(([id, i, t, s]) => `<button class="tile" data-act="goal" data-arg="${id}">
        <span class="ic a">${i}</span><span><b>${t}</b><small>${s}</small></span></button>`).join("")}
  </div>`
});

export const intro = () => ({
  bare:true,
  html:`<div class="onb">
    <div class="art">🤝</div>
    <h1>Bas teen cheezein</h1>
    <p class="sub">Aap mujhe apne <b>business</b>, <b>jagah</b> aur <b>budget</b> ke baare mein batayenge.
    Main aapke liye plan, paisa aur risk aasan bhasha mein samjhaunga.</p>
    <div class="card" style="text-align:left;margin-top:16px">
      <div class="step"><span class="n">1</span><span>Aap apni jaankari bharenge (2 minute)</span></div>
      <div class="step"><span class="n">2</span><span>Main aapke area ke hisaab se business suggest karunga</span></div>
      <div class="step"><span class="n">3</span><span>Paisa, EMI aur risk ka poora hisaab dikhaunga</span></div>
      <div class="step"><span class="n">4</span><span>Aakhir mein saaf faisla: shuru karein ya nahi</span></div>
    </div>
    <button class="btn" data-act="finishOnboard">Chaliye</button>
  </div>`
});

/* ===================== HOME ===================== */
export function home() {
  const { p, loc } = ctx();
  const name = p.name || "dost";
  const tiles = [
    ["🏪","Mera Business","Profile banayein ya badlein","#/profile"],
    ["💡","Kaunsa Business?","Mere liye suitable business","#/recommend"],
    ["📊","Mera Market","Mere area ka rate aur demand","#/market"],
    ["💰","Paisa Ka Plan","Investment, working capital, loan","#/money"],
    ["🏛️","Mere Liye Kaunsi Scheme?","Sarkari yojana matching","#/schemes"],
    ["🔄","Agar Main Ye Karun?","Rate/lagat badal kar dekhein","#/whatif"],
    ["⚠️","Risk Check","Kya-kya galat ho sakta hai","#/risk"],
    ["🎯","Mujhe ₹30,000 Kamane Hain","Target se ulta plan","#/reverse"],
    ["🎙️","Bolkar Poochhein","Type karne ki zaroorat nahi","#/voice"],
    ["📷","Photo Se Bataiye","Apni dukaan/khet ki photo","#/photo"]
  ];
  const q = AI.nextQuestion(p);
  return {
    title:"GramSaarthi", sub: loc ? `${loc.village} · ${loc.district}` : "Aapka business co-pilot",
    html:`
    <div class="hero">
      <h1>Namaste, ${esc(name)} 🙏</h1>
      <p>Aaj main aapki kis cheez mein madad karun?</p>
      ${p.capital ? `<div style="margin-top:12px;background:rgba(255,255,255,.14);border-radius:12px;padding:10px 12px">
        <div style="font-size:12px;opacity:.85">Aapka available paisa</div>
        <div style="font-size:22px;font-weight:800">${inr(p.capital)}</div></div>` : ""}
    </div>
    ${q ? `<div class="card" style="border-left:4px solid var(--accent)">
      <b>🤝 Ek chhota sawal</b><p style="margin:6px 0 10px">${esc(q.q)}</p>
      <button class="btn warn" data-act="go" data-arg="#/profile">Abhi bhar dein</button></div>` : ""}
    ${p.selectedBiz ? `<button class="tile" data-act="go" data-arg="#/decision">
      <span class="ic a">🧭</span><span><b>Aapka faisla dekhein</b>
      <small>${esc(bizById(p.selectedBiz).hi)} — final recommendation</small></span></button>` : ""}
    ${tiles.map(([i, t, s, h]) => `<button class="tile" data-act="go" data-arg="${h}">
      <span class="ic">${i}</span><span><b>${t}</b><small>${s}</small></span></button>`).join("")}
    <button class="tile" data-act="go" data-arg="#/why"><span class="ic a">⭐</span>
      <span><b>Why GramSaarthi?</b><small>Ye alag kyun hai — judges ke liye</small></span></button>
    <button class="tile" data-act="go" data-arg="#/demo"><span class="ic a">🎬</span>
      <span><b>Demo Mode</b><small>Taiyar profile se poora flow dekhein</small></span></button>
    ${DISCLAIMER}`
  };
}

/* ===================== PROFILE ===================== */
export function profile() {
  const { p } = ctx();
  return {
    title:"Mera Business Twin", sub:"Aapki jaankari — sirf aapke phone mein",
    html:`
    ${aibox("Jitni sahi jaankari, utna sahi faisla. Jo abhi nahi pata, baad mein bhi bhar sakte hain.")}
    <div class="card">
      <h3>1. Aap kaun hain ${badge("user")}</h3>
      <label>Naam</label>
      <input id="f-name" value="${esc(p.name)}" placeholder="jaise Ramesh" />
      <label>Gaon / Block / District</label>
      <select id="f-loc">${LOCATIONS.map(l => `<option value="${l.id}" ${l.id === p.locId ? "selected" : ""}>
        ${l.village} · ${l.block} · ${l.district}, ${l.state}</option>`).join("")}</select>
      <label>Abhi kya karte hain?</label>
      <input id="f-occ" value="${esc(p.occupation)}" placeholder="jaise kheti, majdoori, dukaan" />
      <label>Kitne saal ka anubhav? <span class="small">(naya ho to 0)</span></label>
      <input id="f-exp" type="number" min="0" max="40" value="${p.experienceYears || 0}" />
    </div>

    <div class="card">
      <h3>2. Paisa ${badge("user")}</h3>
      <label>Aapke paas kitna paisa hai? <b>${inr(p.capital)}</b></label>
      <input id="f-cap" type="number" min="0" step="1000" value="${p.capital || 0}" />
      <label>Abhi koi EMI chal rahi hai? (mahine ka)</label>
      <input id="f-emi" type="number" min="0" step="500" value="${p.existingEmi || 0}" />
      <label>Ghar ki abhi ki mahine ki kamai</label>
      <input id="f-inc" type="number" min="0" step="500" value="${p.monthlyIncome || 0}" />
      <label>Risk ke bare mein aap kaise hain?</label>
      <div class="chips" data-group="risk">
        ${[["low","Bahut sambhal kar"],["medium","Thoda risk theek hai"],["high","Risk le sakta hoon"]].map(([id, l]) =>
          `<button class="chip-sel ${p.riskAppetite === id ? "on" : ""}" data-act="risk" data-arg="${id}">${l}</button>`).join("")}
      </div>
    </div>

    <div class="card">
      <h3>3. Aapke paas kya hai? ${badge("user")}</h3>
      <p class="small">Jo-jo hai, us par tap karein.</p>
      <div class="chips">
        ${RESOURCES.map(r => `<button class="chip-sel ${(p.resources || []).includes(r.id) ? "on" : ""}"
          data-act="res" data-arg="${r.id}">${r.icon} ${r.label}</button>`).join("")}
      </div>
    </div>

    <details><summary>4. Kis kaam mein interest hai? (optional)</summary>
      <div class="chips">
        ${BUSINESSES.map(b => `<button class="chip-sel ${(p.interests || []).includes(b.id) ? "on" : ""}"
          data-act="int" data-arg="${b.id}">${b.icon} ${b.hi}</button>`).join("")}
      </div>
    </details>

    <button class="btn" data-act="saveProfile">Save karke aage badhein</button>
    <button class="btn sec" data-act="resetAll">Sab kuch mita dein</button>
    ${DISCLAIMER}`
  };
}

/* ===================== RECOMMENDATIONS ===================== */
export function recommend() {
  const { p, loc } = ctx();
  if (!p.capital) return { title:"Kaunsa Business?", html:`
    ${aibox("Pehle ye batayein ki aapke paas kitna paisa hai — uske bina sahi suggestion nahi de paunga.")}
    <button class="btn" data-act="go" data-arg="#/profile">Jaankari bharein</button>` };
  const list = E.recommend(p, 3);
  return {
    title:"Aapke liye 3 options", sub: loc ? `${loc.village} ke hisaab se` : "",
    html:`
    ${aibox(`${inr(p.capital)}, aapke resources aur ${loc ? loc.village : "aapke area"} ki demand dekh kar maine ye teen chune hain. Ye score prototype advisory score hai — scientific rating nahi.`)}
    ${list.map((r, i) => card(r, i)).join("")}
    <button class="btn sec" data-act="go" data-arg="#/compare">📊 Teeno ko compare karein</button>
    ${DISCLAIMER}`
  };
  function card(r, i) {
    const p2 = r.projection, st = r.structure;
    return `<div class="card">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
        <div class="ic" style="width:48px;height:48px;border-radius:14px;background:var(--green-l);display:grid;place-items:center;font-size:24px">${r.biz.icon}</div>
        <div style="flex:1">
          <h3 style="margin:0">${i + 1}. ${esc(r.biz.hi)}</h3>
          <div class="small">${esc(r.biz.name)} · ${F.SCALES[r.scale].label}
          ${r.userAsked ? `<span class="spark">AAPNE POOCHHA THA</span>` : ""}</div>
        </div>
        <div style="text-align:right"><div style="font-size:22px;font-weight:800;color:var(--green)">${r.score}</div>
        <div class="small" style="font-size:10px">FIT /100</div></div>
      </div>
      ${bar(r.score, r.score >= 70 ? "" : r.score >= 50 ? "mid" : "bad")}
      ${kv("Kitna paisa lagega", inr(st.total))}
      ${kv("Mahine ka andaazan profit", inr(p2.profit))}
      ${kv("Loan chahiye", st.loanNeeded > 0 ? inr(st.loanNeeded) : "Nahi")}
      ${kv("Risk", pill(r.stress.grade === "Resilient" ? "ok" : r.stress.grade === "Manageable" ? "mid" : "bad", r.stress.grade))}
      <details><summary>Ye business kyun? / Details dekhein</summary>
        ${aibox(AI.explainRecommendation(r, loc), "Kyun ye upar aaya")}
        ${r.parts.map(pt => `<div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:14px">
            <span>${pt.key}</span><b>${E.labelOf(pt.score)}</b></div>
          ${bar(pt.score, pt.score >= 70 ? "" : pt.score >= 50 ? "mid" : "bad")}
          <div class="small">${esc(pt.note)}</div></div>`).join("")}
        <p class="small"><b>Assumptions:</b> ${esc(r.biz.assumptionsNote)} ${badge("est")}</p>
      </details>
      <button class="btn" data-act="pick" data-arg="${r.biz.id}|${r.scale}">Isko chunein aur plan banayein</button>
    </div>`;
  }
}

export function compare() {
  const { p, loc } = ctx();
  const list = E.recommend(p, 3);
  if (!list.length) return { title:"Compare", html:"<p>Pehle profile bharein.</p>" };
  const row = (label, fn) => `<tr><td>${label}</td>${list.map(r => `<td>${fn(r)}</td>`).join("")}</tr>`;
  return {
    title:"Teeno ka comparison", sub:"Ek nazar mein farak",
    html:`<div class="card" style="overflow-x:auto">
      <table>
        <tr><th>—</th>${list.map(r => `<th>${r.biz.icon}<br>${esc(r.biz.hi.split(" ")[0])}</th>`).join("")}</tr>
        ${row("Fit score", r => `<b>${r.score}</b>`)}
        ${row("Total project", r => inr(r.structure.total))}
        ${row("Working capital", r => inr(r.structure.workingCapital))}
        ${row("Loan chahiye", r => r.structure.loanNeeded ? inr(r.structure.loanNeeded) : "—")}
        ${row("Mahine ka profit", r => inr(r.projection.profit))}
        ${row("Margin", r => Math.round(r.projection.margin) + "%")}
        ${row("Paisa wapas (mahine)", r => isFinite(r.ret.paybackMonths) ? Math.round(r.ret.paybackMonths) : "—")}
        ${row("Kaam ki mushkil", r => "★".repeat(r.biz.complexity))}
        ${row("Local demand", r => loc ? Math.round((loc.demand[r.biz.tag] ?? 1) * 100) + "%" : "—")}
        ${row("Stress test", r => r.stress.grade)}
      </table>
    </div>
    ${aibox("Sabse zyada profit wala business hamesha sabse sahi nahi hota. Dekhiye ki uske liye loan kitna lena pad raha hai aur bura market aane par kya hoga.")}
    <div class="scroller">${list.map(r => `<div class="card">
      <b>${r.biz.icon} ${esc(r.biz.hi)}</b>
      <p class="small">${esc(r.biz.why[0])}</p>
      <button class="btn sm" data-act="pick" data-arg="${r.biz.id}|${r.scale}">Chunein</button></div>`).join("")}</div>
    ${DISCLAIMER}`
  };
}

/* ===================== BUSINESS PLAN ===================== */
export function plan() {
  const miss = needBiz(); if (miss) return { title:"Business Plan", html:miss };
  const { p, loc, biz, live } = ctx();
  const pr = F.project(live), st = F.structure(live, p.capital);
  const af = F.affordability(live, p.capital, p.existingEmi);
  const ret = F.returns(live, p.capital);
  const sch = E.matchSchemes(p, biz.id).slice(0, 2);
  const rk = E.risks(p, biz, live);
  return {
    title:`${biz.icon} ${biz.hi}`, sub:"Aapka business plan",
    html:`
    ${aibox(`Ye plan aapki jaankari + ${loc ? loc.village : "aapke area"} ke demo market data par bana hai. Har number neeche "assumptions" mein khula hua hai — aap badal sakte hain.`)}
    <div class="card"><h3>Business idea</h3>
      <p>${esc(biz.name)} — ${esc(biz.assumptionsNote)} ${badge("est")}</p>
      <h3>Ye business kyun?</h3>
      <ul style="margin:0 0 10px 18px;padding:0">${biz.why.map(w => `<li>${esc(w)}</li>`).join("")}</ul>
      <h3>Customer kaun honge?</h3>
      <p class="small">${loc ? `${loc.village} aur aas-paas ke gaon, ${loc.mandi} (${loc.mandiKm} km), local dukaan/hotel aur society.` : "Local gaon aur mandi."}</p>
    </div>

    <div class="card"><h3>Paisa kitna lagega ${badge("est")}</h3>
      ${kv("Business setup cost (ek baar)", inr(st.fixedInvestment))}
      ${kv("Roz ke business ke liye paisa", inr(st.workingCapital))}
      ${kv("Emergency ke liye alag", inr(st.buffer))}
      ${kv("Total project", inr(st.total), "total")}
      ${bar(Math.min(100, st.capitalCoverage))}
      <p class="small">Aapka apna paisa ${inr(st.ownContribution)} · ${st.loanNeeded > 0 ? `Loan ${inr(st.loanNeeded)}` : "Loan ki zaroorat nahi"}</p>
    </div>

    <div class="card"><h3>Har mahine ka hisaab ${badge("est")}</h3>
      ${kv(`Bikri (${Math.round(live.units)} ${esc(biz.unit)})`, inr(pr.revenue))}
      ${kv("Kaccha maal / seedha kharch", "-" + inr(pr.variableCost))}
      ${kv("Fixed kharch (bijli, kiraya, majdoori)", "-" + inr(pr.fixedMonthly))}
      ${kv("Bachat (profit)", inr(pr.profit), "total")}
      ${kv("Profit margin", Math.round(pr.margin) + "%")}
      ${af.emi > 0 ? kv("EMI ke baad", inr(af.after)) : ""}
    </div>

    <div class="card"><h3>Break-even — kitna bechna zaroori hai?</h3>
      ${kv("Mahine ka fixed kharch", inr(pr.fixedMonthly))}
      ${kv(`Har ${esc(biz.unit)} par bachat`, inr(pr.contribution))}
      ${kv("Break-even", Math.ceil(pr.breakevenUnits) + " " + esc(biz.unit) + "/mahina", "total")}
      ${bar(Math.min(100, (pr.breakevenUnits / Math.max(live.units, 1)) * 100), "mid")}
      <p class="small">Aap ${Math.round(live.units)} bech rahe hain — break-even se
      ${live.units > pr.breakevenUnits ? `<b class="up">${Math.round(live.units - pr.breakevenUnits)} zyada</b> (safe)` : `<b class="down">${Math.round(pr.breakevenUnits - live.units)} kam</b> (khatra)`}</p>
      ${aibox(AI.explainBreakeven(pr, live))}
    </div>

    <div class="card"><h3>Paisa wapas kab? (ROI)</h3>
      ${kv("Saal ka andaazan profit", inr(ret.annualProfit))}
      ${kv("Approx ROI", isFinite(ret.roi) ? Math.round(ret.roi) + "% / saal" : "—")}
      ${kv("Lagaya paisa wapas", isFinite(ret.paybackMonths) ? Math.round(ret.paybackMonths) + " mahine" : "Is plan mein nahi")}
      <p class="small">⚠️ Ye guarantee nahi hai. Assumptions badle to ye bhi badlega.</p>
    </div>

    <div class="card"><h3>Risks aur bachav</h3>
      ${rk.list.slice(0, 3).map(r => `<div style="margin-bottom:10px">
        ${pill(r.sev, r.sev === "high" ? "Zyada" : r.sev === "medium" ? "Madhyam" : "Kam")}
        <b style="display:block;margin-top:4px">${esc(r.title)}</b>
        <div class="small">${esc(r.why)}<br>👉 ${esc(r.fix)}</div></div>`).join("")}
    </div>

    <div class="card"><h3>Sarkari madad ho sakti hai ${badge("verify")}</h3>
      ${sch.map(s => `<div class="kv"><span>${esc(s.scheme.name)}</span><b>${s.band}</b></div>`).join("")}
      <p class="small">Final eligibility bank/official verification par depend karegi.</p>
    </div>

    <details><summary>Ye calculation kin assumptions par based hai?</summary>${assumpTable(live, biz)}</details>

    <div class="card"><h3>Pehle 30 din / 90 din</h3>
      <div class="step"><span class="n">1</span><span>Supplier aur customer se rate khud confirm karein</span></div>
      <div class="step"><span class="n">2</span><span>Chhote scale par shuru karein, rozana hisaab likhein</span></div>
      <div class="step"><span class="n">3</span><span>90 din ke asli numbers app mein daal kar plan dobara dekhein</span></div>
      <div class="step"><span class="n">4</span><span>Tabhi bade loan/scale ka faisla lein</span></div>
    </div>
    ${nextBtns([["💰 Paisa Ka Plan dekhein","#/money"],["🔄 Agar Main Ye Karun?","#/whatif","sec"]])}
    ${DISCLAIMER}`
  };
}

function assumpTable(a, biz) {
  return `
    ${kv("Bikri ka rate", inr(a.price) + " / " + esc(biz.unit))}
    ${kv("Har unit ki lagat", inr(a.varCost))}
    ${kv("Mahine ki bikri", Math.round(a.units) + " " + esc(biz.unit))}
    ${kv("Fixed kharch", inr(a.fixedMonthly) + " /mahina")}
    ${kv("Working capital", a.wcMonths + " mahine ka kharch")}
    ${kv("Emergency buffer", a.bufferPct + "%")}
    ${kv("Interest rate (indicative)", a.interestRate + "% p.a.")}
    ${kv("Loan tenure", a.tenureMonths + " mahine")}
    <p class="small">${badge("demo")} Ye demo assumptions hain (${esc(biz.assumptionsNote)}). Aap inhe
    <b>Agar Main Ye Karun?</b> screen par badal sakte hain.</p>`;
}

/* ===================== PAISA KA PLAN ===================== */
export function money() {
  const miss = needBiz(); if (miss) return { title:"Paisa Ka Plan", html:miss };
  const { p, loc, biz } = ctx();
  const plans = F.allocationPlans(biz, loc, p.capital);
  const cur = plans.find(x => x.scale.id === (p.scale || "balanced")) || plans[1];
  const st = cur.structure;
  return {
    title:"Paisa Ka Plan", sub:`${biz.icon} ${biz.hi} · ${inr(p.capital)} available`,
    html:`
    ${aibox(AI.explainAllocation(plans), "₹ ka bantwara")}
    <h2>Aapke ${inr(p.capital)} mein kya-kya ho sakta hai?</h2>
    <div class="scroller">
      ${plans.map(pl => `<div class="card" style="border:${pl.scale.id === cur.scale.id ? "2px solid var(--green)" : "1px solid var(--line)"}">
        <b>${esc(pl.scale.label)}</b><div class="small">${esc(pl.scale.hi)}</div>
        <div style="margin:8px 0">${pill(pl.structure.loanNeeded === 0 ? "ok" : pl.afford.level, pl.structure.loanNeeded === 0 ? "Bina loan" : pl.afford.label)}</div>
        ${kv("Setup", inr(pl.structure.fixedInvestment))}
        ${kv("Working capital", inr(pl.structure.workingCapital))}
        ${kv("Buffer", inr(pl.structure.buffer))}
        ${kv("Loan", pl.structure.loanNeeded ? inr(pl.structure.loanNeeded) : "—")}
        ${kv("Profit/mahina", inr(pl.projection.profit))}
        ${kv("Stress", pl.stress.grade)}
        <button class="btn sm" data-act="scale" data-arg="${pl.scale.id}">Ye chunein</button>
      </div>`).join("")}
    </div>

    <div class="card"><h3>Chuna hua plan: ${esc(cur.scale.label)} ${badge("est")}</h3>
      ${kv("Business setup cost", inr(st.fixedInvestment))}
      ${kv("Roz ke business ka paisa", inr(st.workingCapital))}
      ${kv("Emergency buffer", inr(st.buffer))}
      ${kv("Total project cost", inr(st.total), "total")}
      <div style="margin-top:12px">${hbars([
        { label:"Apna paisa", value:st.ownContribution, display:inr(st.ownContribution) },
        { label:"Loan", value:st.loanNeeded, display:st.loanNeeded ? inr(st.loanNeeded) : "Zaroorat nahi", tone:"mid" }
      ])}</div>
      <p class="small">Sarkari scheme se madad mil sakti hai — lekin ratio har scheme mein alag hota hai,
      isliye hum koi fixed percentage nahi maan rahe. ${badge("verify")}</p>
    </div>

    <div class="card" style="border-left:4px solid var(--accent)">
      <h3>⚠️ Poora paisa ek saath mat lagaiye</h3>
      <p class="small">Agar aap saara ${inr(p.capital)} setup mein laga denge to roz ke kharch aur achanak aane wale
      kharch ke liye kuch nahi bachega. Ek bimari, ek kharab mahina, aur business ruk jata hai.</p>
      ${kv("Safe plan mein buffer", inr(plans[0].structure.buffer))}
      ${kv("Bade setup mein buffer", inr(plans[2].structure.buffer))}
    </div>
    ${nextBtns([["🏦 Loan Check Karein","#/loan"],["⚠️ Risk Test Karein","#/risk","sec"]])}
    ${DISCLAIMER}`
  };
}

/* ===================== LOAN ===================== */
export function loan() {
  const miss = needBiz(); if (miss) return { title:"Loan Check", html:miss };
  const { p, biz, live } = ctx();
  const af = F.affordability(live, p.capital, p.existingEmi);
  const pr = F.project(live);
  return {
    title:"Kya main ye loan afford kar sakta hoon?", sub:"Kamai ke hisaab se, bank ke faisle se nahi",
    html:`
    <div class="card" style="text-align:center">
      <div style="font-size:14px;color:var(--muted)">EMI ke baad har mahine bachega</div>
      <div style="font-size:34px;font-weight:800;color:${af.after > 0 ? "var(--ok)" : "var(--red)"}" class="num">${inr(af.after)}</div>
      <div style="margin-top:8px">${pill(af.level, af.label)}</div>
    </div>
    ${aibox(AI.explainAffordability(af))}
    <div class="card"><h3>Hisaab ${badge("est")}</h3>
      ${kv("Loan chahiye", af.loanNeeded ? inr(af.loanNeeded) : "Nahi")}
      ${kv("Interest (indicative)", af.rate + "% saalana")}
      ${kv("Kitne mahine", af.tenure + " mahine")}
      ${kv("Mahine ki EMI", inr(af.emi), "total")}
      ${kv("Business se mahine ki kamai", inr(pr.profit))}
      ${p.existingEmi ? kv("Pehle se chal rahi EMI", "-" + inr(p.existingEmi)) : ""}
      ${kv("EMI ke baad bachat", inr(af.after))}
    </div>
    <div class="card"><h3>Loan badal kar dekhein</h3>
      <label>Interest rate: <b id="lr">${live.interestRate}%</b></label>
      <input type="range" min="7" max="24" step="0.5" value="${live.interestRate}" data-act="rate" />
      <label>Kitne mahine: <b id="lt">${live.tenureMonths}</b></label>
      <input type="range" min="12" max="84" step="6" value="${live.tenureMonths}" data-act="tenure" />
      ${kv("Total interest jo aap denge", inr(af.totalInterest))}
      ${kv("Total wapsi", inr(af.totalPaid))}
      <p class="small">Zyada mahine = kam EMI, lekin kul interest zyada.</p>
    </div>
    <details><summary>Technical details dekhein</summary>
      ${kv("Debt Service Coverage (profit ÷ EMI)", isFinite(af.dscr) ? af.dscr.toFixed(2) : "—")}
      <p class="small">1.00 ka matlab poori kamai EMI mein chali jayegi. 1.5 se upar aaram maana jata hai.
      Formula: reducing-balance EMI = P·r·(1+r)ⁿ / ((1+r)ⁿ−1).</p>
    </details>
    <div class="disclaim"><b>Ye bank ka faisla nahi hai.</b> Ye sirf ek affordability estimate hai —
    loan approval, eligibility aur rate bank khud decide karta hai.</div>
    ${nextBtns([["⚠️ Stress Test Chalayein","#/stress"],["🏛️ Scheme Dekhein","#/schemes","sec"]])}`
  };
}

/* ===================== WHAT-IF ===================== */
export function whatif() {
  const miss = needBiz(); if (miss) return { title:"Agar Main Ye Karun?", html:miss };
  const { p, biz, a, live } = ctx();
  const basePr = F.project(a), pr = F.project(live);
  const af = F.affordability(live, p.capital, p.existingEmi);
  const baseAf = F.affordability(a, p.capital, p.existingEmi);
  const d = p.deltas || {};
  const scen = F.scenarios(live, p.capital);
  const diff = pr.profit - basePr.profit;
  const slider = (key, label, val, min, max, unit) => `
    <label>${label}: <b>${val > 0 ? "+" : ""}${val}${unit}</b></label>
    <input type="range" min="${min}" max="${max}" step="1" value="${val}" data-act="delta" data-arg="${key}" />`;
  return {
    title:"Agar Main Ye Karun?", sub:`${biz.icon} ${biz.hi}`,
    html:`
    <div class="card" style="text-align:center">
      <div class="small">Mahine ka profit</div>
      <div style="font-size:34px;font-weight:800;color:${pr.profit > 0 ? "var(--ok)" : "var(--red)"}" class="num">${inr(pr.profit)}</div>
      <div class="${diff >= 0 ? "up" : "down"}" style="font-weight:700">${diff >= 0 ? "▲" : "▼"} ${inr(Math.abs(diff))} pehle se</div>
      <div style="margin-top:10px">${pill(af.level, "EMI ke baad " + inr(af.after))}</div>
    </div>

    <div class="card"><h3>Cheezein badal kar dekhein</h3>
      ${slider("pricePct", `Bikri ka rate (abhi ${inr(live.price)})`, d.pricePct || 0, -40, 40, "%")}
      ${slider("varCostPct", `Kaccha maal ki lagat (abhi ${inr(live.varCost)})`, d.varCostPct || 0, -30, 60, "%")}
      ${slider("unitsPct", `Bikri kitni (abhi ${Math.round(live.units)} ${esc(biz.unit)})`, d.unitsPct || 0, -60, 40, "%")}
      ${slider("fixedPct", `Transport/fixed kharch (abhi ${inr(live.fixedMonthly)})`, d.fixedPct || 0, -30, 60, "%")}
      <div class="btnrow">
        <button class="btn sec" data-act="resetDeltas">Wapas normal</button>
        <button class="btn" data-act="saveScen">Ye scenario save karein</button>
      </div>
    </div>

    <div class="card"><h3>Kya-kya badla</h3>
      <table>
        <tr><th>—</th><th>Pehle</th><th>Ab</th></tr>
        <tr><td>Bikri</td><td>${inr(basePr.revenue)}</td><td><b>${inr(pr.revenue)}</b></td></tr>
        <tr><td>Kharch</td><td>${inr(basePr.variableCost + basePr.fixedMonthly)}</td><td><b>${inr(pr.variableCost + pr.fixedMonthly)}</b></td></tr>
        <tr><td>Profit</td><td>${inr(basePr.profit)}</td><td><b class="${diff >= 0 ? "up" : "down"}">${inr(pr.profit)}</b></td></tr>
        <tr><td>Break-even</td><td>${Math.ceil(basePr.breakevenUnits)}</td><td><b>${isFinite(pr.breakevenUnits) ? Math.ceil(pr.breakevenUnits) : "—"}</b></td></tr>
        <tr><td>EMI ke baad</td><td>${inr(baseAf.after)}</td><td><b>${inr(af.after)}</b></td></tr>
      </table>
    </div>

    <div class="card"><h3>Teen haalat ${badge("est")}</h3>
      ${scen.map(s => `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>${esc(s.label)}</b> ${pill(s.risk, inr(s.net) + " bachega")}</div>
        <div class="small">${esc(s.hi)} · Bikri ${inr(s.revenue)}</div>
        ${bar(Math.max(2, Math.min(100, (s.net / Math.max(...scen.map(x => Math.abs(x.net)), 1)) * 100)), s.risk === "ok" ? "" : s.risk === "mid" ? "mid" : "bad")}
      </div>`).join("")}
      ${aibox(AI.explainScenarios(scen))}
    </div>
    ${p.savedScenarios && p.savedScenarios.length ? `<div class="card"><h3>Save kiye hue scenarios</h3>
      ${p.savedScenarios.slice().reverse().map(s => `<div class="kv"><span>${esc(s.label)}</span><b>${inr(s.profit)}</b></div>`).join("")}</div>` : ""}
    ${nextBtns([["⚠️ Stress Test","#/stress"],["🧭 Final Faisla","#/decision","sec"]])}
    ${DISCLAIMER}`
  };
}

/* ===================== STRESS TEST ===================== */
export function stress() {
  const miss = needBiz(); if (miss) return { title:"Stress Test", html:miss };
  const { p, biz, live } = ctx();
  const s = F.stressTest(live, p.capital, p.existingEmi);
  const tone = s.grade === "Resilient" ? "ok" : s.grade === "Manageable" ? "mid" : "bad";
  return {
    title:"Business Stress Test", sub:"Bure haalat pehle se check kar lein",
    html:`
    <div class="card" style="text-align:center">
      <div class="small">Aapka business kitna mazboot hai?</div>
      <div style="font-size:30px;font-weight:800;margin:6px 0">${s.grade}</div>
      ${pill(tone, s.grade === "Resilient" ? "Mazboot" : s.grade === "Manageable" ? "Sambhal jayega" : "Kamzor")}
      <p class="small" style="margin-top:10px">${esc(s.gradeHi)}</p>
    </div>
    <div class="card"><h3>5 mushkil haalat ${badge("est")}</h3>
      ${s.results.map(r => `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <span style="flex:1">${esc(r.label)}</span>${pill(r.verdict, inr(r.net))}</div>
        ${bar(Math.max(2, Math.min(100, ((r.net + 20000) / 45000) * 100)), r.verdict === "ok" ? "" : r.verdict === "mid" ? "mid" : "bad")}
        <div class="small">EMI ${inr(s.emi)} nikalne ke baad har mahine ${r.net >= 0 ? "bachega" : "kam padega"} ${inr(Math.abs(r.net))}</div>
      </div>`).join("")}
    </div>
    ${aibox(AI.explainStress(s))}
    <div class="card"><h3>Sabse zyada asar kis cheez ka?</h3>
      ${hbars(F.sensitivity(live).map(x => ({ label:x.label + " (10% badlav)", value:x.impact, display:inr(x.impact) })))}
      <p class="small">Jis cheez ki bar sabse lambi hai, uspar sabse zyada dhyan dijiye.</p>
    </div>
    ${nextBtns([["🧭 Final Faisla Dekhein","#/decision"],["⚠️ Poora Risk Check","#/risk","sec"]])}`
  };
}

/* ===================== RISK ===================== */
export function risk() {
  const miss = needBiz(); if (miss) return { title:"Risk Check", html:miss };
  const { p, biz, live } = ctx();
  const r = E.risks(p, biz, live);
  return {
    title:"Risk Check", sub:`${biz.icon} ${biz.hi}`,
    html:`
    <div class="card" style="text-align:center">
      <div class="small">Kul milakar risk</div>
      <div style="font-size:28px;font-weight:800;margin:4px 0">${r.overall}</div>
      ${pill(r.overall.toLowerCase(), r.overall === "High" ? "Zyada risk" : r.overall === "Medium" ? "Madhyam risk" : "Kam risk")}
    </div>
    ${r.list.map(x => `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <span class="small"><b>${esc(x.cat)}</b></span>
        ${pill(x.sev, x.sev === "high" ? "Zyada" : x.sev === "medium" ? "Madhyam" : "Kam")}
      </div>
      <h3 style="margin:6px 0 4px">${esc(x.title)}</h3>
      <p class="small" style="margin:0 0 8px">${esc(x.why)}</p>
      <div style="background:var(--green-l);border-radius:10px;padding:9px;font-size:14px">
        <b>Kya karein:</b> ${esc(x.fix)}</div>
    </div>`).join("")}
    ${nextBtns([["🧭 Final Faisla","#/decision"],["🏛️ Scheme Dekhein","#/schemes","sec"]])}
    ${DISCLAIMER}`
  };
}

/* ===================== MARKET ===================== */
export function market() {
  const { p, loc } = ctx();
  const sel = p.marketCommodity || "tomato";
  const c = COMMODITIES.find(x => x.id === sel) || COMMODITIES[0];
  const budget = p.mandiBudget || p.capital || 20000;
  const m = E.mandiAdvice(c, budget, loc);
  const trendUp = m.trendPct >= 0;
  return {
    title:"Mera Market", sub: loc ? `${loc.village} · ${loc.mandi} (${loc.mandiKm} km)` : "",
    html:`
    <div class="chips" style="margin-bottom:12px">
      ${COMMODITIES.map(x => `<button class="chip-sel ${x.id === c.id ? "on" : ""}" data-act="commodity" data-arg="${x.id}">${x.icon} ${x.name}</button>`).join("")}
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><div class="small">Aaj ka indicative rate ${badge("demo")}</div>
        <div style="font-size:30px;font-weight:800">${inr(c.price)}<span style="font-size:15px;font-weight:500">/${c.unit}</span></div></div>
        <div style="text-align:right">${pill(trendUp ? "ok" : "bad", (trendUp ? "▲ " : "▼ ") + Math.abs(Math.round(m.trendPct)) + "% (7 din)")}</div>
      </div>
      ${sparkline(c.prev7)}
      <p class="small">${esc(c.note)}</p>
    </div>
    <div class="card"><h3>Market ki haalat ${badge("demo")}</h3>
      ${kv("Demand", c.demand)}
      ${kv("Supply / aavak", c.supply)}
      ${kv("Paas ki mandi", loc ? `${loc.mandi} · ${loc.mandiKm} km` : "—")}
      ${kv("Transport lagat", inr(m.transportPerKg) + " per " + c.unit)}
      ${kv("Kharab hone ka nuksan", Math.round(c.spoilage * 100) + "%")}
      ${kv("Season", c.festivalBoost >= 0.1 ? "Tyohar par demand badhti hai" : "Saadharan")}
      ${loc ? kv("Local competition", (loc.competitors.vegetable ?? 5) + " similar sellers") : ""}
    </div>
    <h2>🧠 Mandi Mind</h2>
    ${aibox(AI.explainMandi(m, budget), "Is hafte kitna maal lein?")}
    <div class="card"><h3>Aapke budget mein 3 rasta ${badge("est")}</h3>
      <label>Is hafte ka budget: <b>${inr(budget)}</b></label>
      <input type="range" min="2000" max="200000" step="1000" value="${budget}" data-act="mandiBudget" />
      ${m.plans.map(pl => `<div class="card flat" style="border:${pl.id === m.pick.id ? "2px solid var(--green)" : "1px solid var(--line)"}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>${esc(pl.label)}${pl.id === m.pick.id ? " ⭐" : ""}</b>${pill(pl.risk, pl.risk === "ok" ? "Safe" : pl.risk === "mid" ? "Dhyan se" : "Risky")}</div>
        <div class="small">${esc(pl.hi)}</div>
        ${kv("Kitna maal", pl.qty + " " + c.unit)}
        ${kv("Lagat (transport ke saath)", inr(pl.cost))}
        ${kv("Andaazan bikri", inr(pl.revenue))}
        ${kv("Andaazan bachat", inr(pl.gross))}
        ${kv("Agar rate 12% gir gaya", inr(pl.downside))}
        ${kv("Paisa bachega", inr(pl.leftover))}
      </div>`).join("")}
      <p class="small">${badge("demo")} Rate aur demand sample data hain — asli mandi rate khud confirm karein.</p>
    </div>
    ${nextBtns([["🔄 What-If Chalayein","#/whatif"],["🏠 Home","#/home","sec"]])}
    ${DISCLAIMER}`
  };
}

/* ===================== SCHEMES ===================== */
export function schemes() {
  const { p, biz } = ctx();
  const list = E.matchSchemes(p, biz ? biz.id : null);
  return {
    title:"Mere Liye Kaunsi Scheme?", sub:"Sirf sambhavna — eligibility nahi",
    html:`
    <div class="disclaim" style="margin:0 0 12px"><b>Dhyan dein:</b> Ye app ye nahi keh sakta ki aap eligible hain.
    Ye sirf batata hai ki aapke profile ke basis par kaun si scheme <b>relevant ho sakti hai</b>.
    Final eligibility bank/official authority ki verification par depend karegi. ${badge("verify")}</div>
    ${list.map(s => `<div class="card">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
        <h3 style="margin:0">${esc(s.scheme.name)}</h3>
        ${pill(s.score >= 55 ? "ok" : s.score >= 30 ? "mid" : "bad", s.band)}
      </div>
      <p class="small" style="margin:6px 0">${esc(s.scheme.purpose)}</p>
      ${kv("Kiske liye", esc(s.scheme.forWhom))}
      ${kv("Kis tarah ki madad", esc(s.scheme.supportType))}
      <details><summary>Details aur documents</summary>
        <p class="small">${esc(s.scheme.maxSupportNote)} ${badge("demo")}</p>
        ${s.why.length ? `<p class="small"><b>Kyun relevant lagti hai:</b><br>${s.why.map(w => "• " + esc(w)).join("<br>")}</p>` : ""}
        <p class="small"><b>Zaroori documents:</b><br>${s.scheme.docs.map(d => "• " + esc(d)).join("<br>")}</p>
        <p class="small"><b>Kahan jaana hai:</b> ${esc(s.scheme.route)}</p>
        <p class="small" style="color:var(--red)"><b>Confirm karna zaroori:</b><br>${s.check.map(c => "• " + esc(c)).join("<br>")}</p>
      </details>
    </div>`).join("")}
    <div class="card"><h3>Comparison</h3>
      <div style="overflow-x:auto"><table>
        <tr><th>Scheme</th><th>Kis liye</th><th>Relevance</th></tr>
        ${list.slice(0, 4).map(s => `<tr><td>${esc(s.scheme.name.split("(")[0])}</td>
          <td style="text-align:left">${esc(s.scheme.supportType.split("(")[0])}</td><td>${s.band}</td></tr>`).join("")}
      </table></div>
      <p class="small">Hum koi fixed subsidy ratio (jaise 10:90) nahi dikhate — har scheme ke rules alag hain.</p>
    </div>
    ${nextBtns([["📋 Ab Aage Kya Karein?","#/action"],["🏠 Home","#/home","sec"]])}`
  };
}

/* ===================== DECISION ===================== */
export function decision() {
  const miss = needBiz(); if (miss) return { title:"Final Faisla", html:miss };
  const { p, biz, live } = ctx();
  const d = E.decide(p, biz, live);
  return {
    title:"Aapka Faisla", sub:`${biz.icon} ${biz.hi} · ${F.SCALES[p.scale || "balanced"].label}`,
    html:`
    <div class="decision ${d.cls}">
      <div style="font-size:13px;opacity:.85">GramSaarthi ka faisla</div>
      <div class="big">${d.verdict === "START" ? "🟢" : d.verdict === "START SMALL" ? "🟡" : d.verdict === "CHANGE PLAN" ? "🟠" : "🔴"} ${d.verdict}</div>
      <div style="font-size:17px;font-weight:700">${esc(d.title)}</div>
      <p class="sub" style="margin-top:6px">${esc(d.line)}</p>
    </div>
    <div class="card"><h3>Ye kyun? ${badge("est")}</h3>
      ${d.reasons.map(x => `<div class="step"><span class="n">✓</span><span>${esc(x)}</span></div>`).join("")}
      ${d.watch.map(x => `<div class="step"><span class="n" style="background:var(--red-l);color:var(--red)">!</span><span>${esc(x)}</span></div>`).join("")}
    </div>
    <div class="card"><h3>Ek nazar mein</h3>
      ${kv("Total project", inr(d.structure.total))}
      ${kv("Aapka paisa", inr(d.structure.ownContribution))}
      ${kv("Loan", d.structure.loanNeeded ? inr(d.structure.loanNeeded) : "Zaroorat nahi")}
      ${kv("EMI", d.afford.emi ? inr(d.afford.emi) : "—")}
      ${kv("Mahine ka profit", inr(d.projection.profit))}
      ${kv("EMI ke baad bachat", inr(d.afford.after))}
      ${kv("Stress test", d.stress.grade)}
      ${kv("Paisa wapas", isFinite(d.ret.paybackMonths) ? Math.round(d.ret.paybackMonths) + " mahine" : "—")}
    </div>
    <div class="card" style="border-left:4px solid var(--green)">
      <h3>Agla kadam</h3><p>${esc(d.next)}</p>
    </div>
    <div class="btnrow">
      <button class="btn sec" data-act="go" data-arg="#/plan">Plan dekhein</button>
      <button class="btn sec" data-act="go" data-arg="#/whatif">Doosra scenario</button>
    </div>
    ${nextBtns([["📋 Ab Aage Kya Karein?","#/action"],["🏛️ Scheme Dekhein","#/schemes","sec"]])}
    ${DISCLAIMER}`
  };
}

/* ===================== ACTION PLAN ===================== */
export function action() {
  const miss = needBiz(); if (miss) return { title:"Ab Aage Kya?", html:miss };
  const { p, biz, live } = ctx();
  const d = E.decide(p, biz, live);
  const ap = E.actionPlan(p, biz, d);
  const list = (title, items) => `<div class="card"><h3>${title}</h3>
    ${items.map((t, i) => `<label class="check"><input type="checkbox" /><span>${esc(t)}</span></label>`).join("")}</div>`;
  return {
    title:"Ab Aage Kya Karein?", sub:"Faisle ko kaam mein badlein",
    html:`
    ${aibox("Ye list tick karte jaayein. Har kadam chhota hai — lekin isi se business shuru hota hai.")}
    ${list("📅 Agle 7 din", ap.d7)}
    ${list("📆 Agle 30 din", ap.d30)}
    ${list("🏦 Loan lene se pehle", ap.beforeLoan)}
    ${nextBtns([["🧭 Faisla dobara dekhein","#/decision"],["🏠 Home","#/home","sec"]])}
    ${DISCLAIMER}`
  };
}

/* ===================== REVERSE PLANNER ===================== */
export function reverse() {
  const { p, loc } = ctx();
  const target = p.targetIncome || 30000;
  const plans = BUSINESSES.map(b => F.reversePlan(b, loc, target)).filter(Boolean)
    .sort((a, b) => a.capitalNeeded - b.capitalNeeded).slice(0, 4);
  return {
    title:"Mujhe itna kamaana hai", sub:"Target se ulta plan",
    html:`
    <div class="card">
      <h3>Mahine mein kitna kamaana chahte hain?</h3>
      <div style="font-size:32px;font-weight:800;color:var(--green)" class="num">${inr(target)}</div>
      <input type="range" min="5000" max="150000" step="1000" value="${target}" data-act="target" />
      <div class="chips">${[15000, 30000, 50000, 100000].map(v =>
        `<button class="chip-sel ${target === v ? "on" : ""}" data-act="targetSet" data-arg="${v}">${inr(v)}</button>`).join("")}</div>
    </div>
    ${aibox(`${inr(target)} mahina kamane ke liye alag-alag business mein alag-alag paisa aur mehnat lagegi. Neeche wo options hain jinme sabse kam paisa chahiye.`)}
    ${plans.map(r => `<div class="card">
      <h3>${r.biz.icon} ${esc(r.biz.hi)}</h3>
      ${kv("Har mahine bechna hoga", Math.ceil(r.unitsNeeded) + " " + esc(r.biz.unit))}
      ${kv("Yaani rozana", Math.ceil(r.perDay) + " " + esc(r.biz.unit))}
      ${kv("Mahine ki bikri", inr(r.revenueNeeded))}
      ${kv("Kitna paisa lagana hoga", inr(r.capitalNeeded), "total")}
      ${kv("Aapke paas hai", inr(p.capital))}
      ${pill(p.capital >= r.capitalNeeded ? "ok" : p.capital >= r.capitalNeeded * 0.5 ? "mid" : "bad",
        p.capital >= r.capitalNeeded ? "Paisa kaafi hai" : p.capital >= r.capitalNeeded * 0.5 ? "Aadha paisa hai — loan lagega" : "Abhi bahut kam paisa hai")}
      <button class="btn sm" data-act="pick" data-arg="${r.biz.id}|balanced">Is par plan banayein</button>
    </div>`).join("")}
    ${DISCLAIMER}`
  };
}

/* ===================== VOICE ===================== */
export function voice() {
  const sup = AI.speechSupported();
  return {
    title:"Bolkar Poochhein", sub:"Type karne ki zaroorat nahi",
    html:`
    <div class="card" style="text-align:center">
      <button data-act="mic" style="width:110px;height:110px;border-radius:50%;border:0;background:var(--accent);font-size:44px;cursor:pointer">🎙️</button>
      <p style="margin-top:12px"><b id="v-status">${sup ? "Button dabakar boliye" : "Is browser mein voice support nahi hai"}</b></p>
      <p class="small">${sup ? "Hindi ya Hinglish mein bol sakte hain." : "Koi baat nahi — neeche type kar dijiye, sab kaam waise hi chalega."}</p>
    </div>
    <div class="card">
      <label>Ya yahan likhein</label>
      <textarea id="v-text" rows="3" placeholder="Mere paas ek lakh rupaye hain aur main dairy start karna chahta hoon"></textarea>
      <button class="btn" data-act="ask">Poochhein</button>
    </div>
    <div class="card"><h3>Aise poochh sakte hain</h3>
      ${AI.VOICE_EXAMPLES.map(x => `<button class="tile" data-act="example" data-arg="${esc(x)}">
        <span class="ic a">💬</span><span><b style="font-weight:500;font-size:15px">${esc(x)}</b></span></button>`).join("")}
    </div>
    <div id="v-answer"></div>
    <div class="disclaim">Voice browser ke apne speech engine se chalti hai. Bhashini jaisi Indian-language
    speech services ke liye adapter ready hai, lekin is prototype mein connected nahi hai.</div>`
  };
}

/* ===================== PHOTO ===================== */
export function photo() {
  const { p } = ctx();
  return {
    title:"Photo Se Bataiye", sub:"Apni dukaan, khet ya pashu ki photo",
    html:`
    <div class="card" style="text-align:center">
      <div style="font-size:50px">📷</div>
      <p class="small">Photo se hum sirf ye samajhne ki koshish karte hain ki aapke paas kya-kya hai.</p>
      <input type="file" accept="image/*" id="ph-file" data-act="photoPick" />
    </div>
    <div id="ph-out">${p.photoNote ? photoResult(p.photoNote) : ""}</div>
    <div class="disclaim"><b>Demo simulation:</b> Is prototype mein photo analysis ek demo module hai —
    ye aapki zameen ya pashu ki keemat nahi bata sakta. Vision model ke liye adapter ready hai.</div>`
  };
}
export function photoResult(r) {
  return `<div class="card"><h3>Photo se kya dikha ${badge("demo")}</h3>
    <p class="small">${esc(r.summary)}</p>
    ${r.items.map(i => `<div class="kv"><span>${esc(i.label)}</span><b>${i.conf} confidence</b></div>`).join("")}
    <button class="btn sec" data-act="applyPhoto">Inhe mere resources mein jodein</button></div>`;
}

/* ===================== DEMO MODE ===================== */
export function demo() {
  return {
    title:"Demo Mode", sub:"SIH judges ke liye — 2 minute mein poora flow",
    html:`
    ${aibox("Koi bhi profile chunein — sab jaankari apne aap bhar jayegi. Phir neeche wale 6 kadam follow karein.")}
    ${Object.values(DEMOS).map(d => `<button class="tile" data-act="demo" data-arg="${d.id}">
      <span class="ic a">${d.icon}</span><span><b>${d.title}</b><small>${esc(d.who)}</small></span></button>`).join("")}
    <div class="card"><h3>2-minute demo flow</h3>
      ${["Profile chunein (Ramesh, ₹1,00,000)",
         "Kaunsa Business? → 3 options aur fit score",
         "Ek chunein → Business Plan + Paisa Ka Plan",
         "Loan Check → EMI affordability",
         "Mera Market → Mandi Mind",
         "Agar Main Ye Karun? → doodh ka rate −10%",
         "Stress Test → Resilient/Vulnerable",
         "Final Faisla → START / START SMALL / DON'T START YET",
         "Scheme Matching + Action Plan"
        ].map((t, i) => `<div class="step"><span class="n">${i + 1}</span><span>${esc(t)}</span></div>`).join("")}
    </div>
    <button class="btn sec" data-act="resetAll">App reset karein</button>`
  };
}

/* ===================== WHY ===================== */
export function why() {
  const pts = [
    ["📍","Hyper-local","Sawal ye nahi ki 'kaun sa business profitable hai', sawal ye hai ki 'mere gaon mein kya chalega'. Har calculation mein gaon ki demand, mandi ki doori aur local competition shamil hai."],
    ["👤","Personalized","Aapka paisa, aapka hunar, aapke paas jo cheezein hain — sab par alag score."],
    ["💰","Financially grounded","Sirf 'total investment' nahi. Setup + roz ka paisa + emergency buffer + EMI + cash flow, sab alag-alag."],
    ["⚠️","Risk-aware","Paisa lagane se pehle bure haalat test hote hain — rate girna, lagat badhna, demand kam hona."],
    ["🚫","Mana bhi karta hai","Ye app har baar 'haan kar lo' nahi kehta. Numbers theek na hon to saaf kehta hai — abhi mat shuru kijiye."],
    ["🎯","Action-oriented","Faisla, scheme aur agle 7/30 din ki checklist ke saath khatam hota hai."]
  ];
  return {
    title:"Why GramSaarthi?", sub:"Ye alag kyun hai",
    html:`${pts.map(([i, t, s]) => `<div class="card"><h3>${i} ${t}</h3><p class="small" style="margin:0">${esc(s)}</p></div>`).join("")}
    <div class="card"><h3>🔒 Responsible AI</h3>
      <p class="small">Ye app kabhi profit, loan approval ya scheme eligibility ki guarantee nahi deta.
      Har number par saaf label hai: ${badge("demo")} ${badge("user")} ${badge("est")} ${badge("verify")}.
      Sab paise ka hisaab deterministic code se hota hai — AI sirf use aasan bhasha mein samjhata hai.</p>
    </div>
    <div class="card"><h3>🧩 Architecture</h3>
      <p class="small">UI → Business Logic (engine.js) → Financial Engine (finance.js) → AI Layer (ai.js) →
      Data Layer (data.js) → Adapters (adapters.js, real APIs ke liye ready).
      Business Twin (store.js) sab screens ko ek hi profile par jodta hai.</p>
    </div>`
  };
}

export { assumpTable };
