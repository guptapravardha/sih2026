/* ===========================================================
   DECISION ENGINE — scoring, risk, schemes, mandi advice.
   Deterministic. Uses finance.js for all money maths.
   =========================================================== */
import { BUSINESSES, SCHEMES, locById, bizById } from "./data.js";
import * as F from "./finance.js";

/* ---------------- BUSINESS FIT SCORE (prototype advisory score) ------------- */
export function scoreBusiness(biz, profile) {
  const loc = locById(profile.locId);
  const capital = profile.capital || 0;
  const have = new Set(profile.resources || []);
  const parts = [];

  /* 1. Capital fit — can a pilot/balanced version be afforded? */
  const pilot = F.structure(F.buildAssumptions(biz, loc, "pilot"), capital);
  const bal   = F.structure(F.buildAssumptions(biz, loc, "balanced"), capital);
  let capScore;
  if (capital >= bal.total) capScore = 100;
  else if (capital >= bal.total * 0.6) capScore = 85;
  else if (capital >= pilot.total) capScore = 70;
  else if (capital >= pilot.total * 0.6) capScore = 45;
  else capScore = 18;
  parts.push({ key:"Capital Fit", score:capScore, weight:0.28,
    note: capital >= bal.total ? "Aapka paisa poora setup cover karta hai"
        : capital >= pilot.total ? "Chhote pilot ke liye paisa kaafi hai"
        : "Is business ke liye paisa kam pad raha hai" });

  /* 2. Resource fit */
  const need = biz.needs, nice = biz.nice || [];
  const needHit = need.filter(r => have.has(r)).length;
  const niceHit = nice.filter(r => have.has(r)).length;
  const resScore = need.length === 0 ? 85
      : Math.min(100, (needHit / need.length) * 80 + (nice.length ? (niceHit / nice.length) * 20 : 20));
  const missing = need.filter(r => !have.has(r));
  parts.push({ key:"Resource Fit", score:resScore, weight:0.22,
    note: missing.length ? "Chahiye: " + missing.join(", ") : "Zaroori cheezein aapke paas hain" });

  /* 3. Market / demand fit (hyper-local) */
  const d = loc ? (loc.demand[biz.tag] ?? 1) : 1;
  const comp = loc ? (loc.competitors[biz.tag] ?? 3) : 3;
  const compPenalty = Math.min(28, comp * 3.2);
  const mktScore = Math.max(10, Math.min(100, d * 78 + 22 - compPenalty));
  parts.push({ key:"Market Fit", score:mktScore, weight:0.2,
    note: loc ? `${loc.village} mein demand ${d >= 1.1 ? "achhi" : d >= 0.95 ? "theek" : "kamzor"}, ~${comp} competitor` : "Location select karein" });

  /* 4. Experience / skill fit */
  const interested = (profile.interests || []).includes(biz.id);
  const sameOcc = (profile.occupation || "").toLowerCase().includes(biz.tag);
  const exp = profile.experienceYears || 0;
  let expScore = 45 + (interested ? 22 : 0) + (sameOcc ? 15 : 0) + Math.min(18, exp * 3.5);
  expScore -= (biz.complexity - 2) * 7;
  expScore = Math.max(10, Math.min(100, expScore));
  parts.push({ key:"Experience Fit", score:expScore, weight:0.15,
    note: interested ? "Aapne is mein interest dikhaya hai" : "Naya kaam — seekhna padega" });

  /* 5. Risk & complexity (inverted) */
  const a = F.buildAssumptions(biz, loc, capital >= bal.total ? "balanced" : "pilot");
  const stress = F.stressTest(a, capital);
  const riskScore = stress.grade === "Resilient" ? 88 : stress.grade === "Manageable" ? 62 : 32;
  parts.push({ key:"Risk", score:riskScore, weight:0.15,
    note: stress.gradeHi });

  const total = Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0));
  const chosenScale = capital >= bal.total ? "balanced" : "pilot";
  const asm = F.buildAssumptions(biz, loc, chosenScale);
  return {
    biz, score:total, parts, scale:chosenScale, assumptions:asm,
    projection:F.project(asm), structure:F.structure(asm, capital),
    afford:F.affordability(asm, capital, profile.existingEmi || 0),
    ret:F.returns(asm, capital), stress
  };
}

export function recommend(profile, limit = 3) {
  const all = BUSINESSES.map(b => scoreBusiness(b, profile)).sort((a, b) => b.score - a.score);
  const picked = all.slice(0, limit);
  /* The entrepreneur asked about something specific. Even if it does not
     top the score, they deserve to see its real numbers — that is how the
     app can honestly say "yahan dikkat hai" instead of silently hiding it. */
  const wanted = profile.interests || [];
  for (const id of wanted) {
    if (picked.some(r => r.biz.id === id)) continue;
    const r = all.find(x => x.biz.id === id);
    if (!r) continue;
    r.userAsked = true;
    picked[picked.length - 1] = r;      // replace weakest slot
    picked.sort((a, b) => b.score - a.score);
  }
  return picked;
}

export function rank(level) {
  return level >= 75 ? "ok" : level >= 55 ? "mid" : "bad";
}
export const labelOf = s => s >= 75 ? "Strong" : s >= 60 ? "Good" : s >= 45 ? "Medium" : "Weak";

/* ---------------- FINAL DECISION ---------------- */
export function decide(profile, biz, assumptions) {
  const capital = profile.capital || 0;
  const a = assumptions;
  const p = F.project(a);
  const st = F.structure(a, capital);
  const af = F.affordability(a, capital, profile.existingEmi || 0);
  const stress = F.stressTest(a, capital, profile.existingEmi || 0);
  const ret = F.returns(a, capital);
  const reasons = [], watch = [];

  let score = 0;
  // capital coverage
  if (st.capitalCoverage >= 100) { score += 3; reasons.push("Aapka apna paisa poora project cover kar raha hai — loan ki zaroorat nahi."); }
  else if (st.capitalCoverage >= 60) { score += 2; reasons.push(`Project cost ka ${Math.round(st.capitalCoverage)}% aap khud laga sakte hain.`); }
  else if (st.capitalCoverage >= 35) { score += 1; watch.push(`Project ka ${Math.round(100 - st.capitalCoverage)}% loan se lena padega — burden zyada hai.`); }
  else { score -= 1; watch.push("Project ka bahut bada hissa loan se aayega — ye risky hai."); }

  // profit
  if (p.profit <= 0) { score -= 3; watch.push("Current assumptions par mahine ka profit hi nahi ban raha."); }
  else if (p.margin >= 18) { score += 2; reasons.push(`Estimated profit margin theek hai (~${Math.round(p.margin)}%).`); }
  else if (p.margin >= 8) { score += 1; reasons.push(`Profit margin patla hai (~${Math.round(p.margin)}%) — kharch control zaroori.`); }
  else { watch.push("Profit margin bahut patla hai."); }

  // EMI affordability
  if (af.level === "none" || af.level === "ok") { score += 2; reasons.push(af.hi); }
  else if (af.level === "mid") { score += 0; watch.push("EMI ke baad safety margin kam bachta hai."); }
  else { score -= 3; watch.push("Business ki kamai se EMI aaram se nahi nikal rahi."); }

  // stress
  if (stress.grade === "Resilient") { score += 2; reasons.push("Stress test mein business bure haalat bhi jhel gaya."); }
  else if (stress.grade === "Manageable") { score += 1; watch.push(`Sabse bada khatra: ${stress.worst.label}.`); }
  else { score -= 2; watch.push(`Stress test kamzor — "${stress.worst.label}" par business ghaate mein.`); }

  // buffer
  if (st.capitalCoverage >= 100 && st.capitalLeft > st.total * 0.08) { score += 1; reasons.push("Emergency ke liye kuch paisa bach bhi raha hai."); }

  // payback
  if (isFinite(ret.paybackMonths) && ret.paybackMonths <= 24) { score += 1; reasons.push(`Lagaya hua paisa lagbhag ${Math.round(ret.paybackMonths)} mahine mein wapas aa sakta hai.`); }
  else if (!isFinite(ret.paybackMonths)) { score -= 2; watch.push("Current numbers par lagaya paisa wapas aane ka rasta nahi dikh raha."); }

  let verdict, cls, title, line, next;
  if (score >= 7)      { verdict="START";         cls="start";  title="Shuru kar sakte hain"; line="Aaj ke assumptions par ye business aapke liye theek baith raha hai."; next="Supplier aur customer se rate confirm karke shuruaat karein."; }
  else if (score >= 4) { verdict="START SMALL";   cls="small";  title="Chhota shuru karein"; line="Idea theek hai, lekin poora paisa ek saath lagana samajhdari nahi hogi."; next="Pehle pilot scale par 2-3 mahine chala kar dekhein, phir badhayein."; }
  else if (score >= 1) { verdict="CHANGE PLAN";   cls="change"; title="Plan badalna padega"; line="Business chal sakta hai, lekin kuch cheezein badalni hongi — scale, loan ya lagat."; next="Loan amount kam karein ya chhote scale par assumptions dobara check karein."; }
  else                 { verdict="DON'T START YET"; cls="stop"; title="Abhi mat shuru kijiye"; line="Is situation mein expected cash flow EMI aur kharch ko comfortably cover nahi kar raha."; next="Pehle apna paisa thoda aur jodein, ya chhote pilot/kam loan wala rasta chunein."; }

  return { verdict, cls, title, line, next, score, reasons, watch,
           projection:p, structure:st, afford:af, stress, ret };
}

/* ---------------- RISK REGISTER ---------------- */
export function risks(profile, biz, a) {
  const loc = locById(profile.locId);
  const capital = profile.capital || 0;
  const p = F.project(a), st = F.structure(a, capital);
  const af = F.affordability(a, capital, profile.existingEmi || 0);
  const sens = F.sensitivity(a);
  const out = [];
  const add = (cat, sev, title, why, fix) => out.push({ cat, sev, title, why, fix });

  // Financial
  if (st.capitalCoverage < 60) add("Financial Risk", "high", "Apna paisa kam, loan zyada",
    `Project cost ${F.inr(st.total)} hai lekin aapke paas ${F.inr(capital)} hai.`,
    "Chhote scale se shuru karein taaki loan kam lena pade.");
  else if (st.buffer < st.total * 0.08) add("Financial Risk", "medium", "Emergency buffer kam",
    "Achanak kharch aane par paisa nahi hoga.", "Kam se kam 1 mahine ka kharch alag rakhein.");
  else add("Financial Risk", "low", "Capital structure theek",
    "Investment, working capital aur buffer sab cover ho rahe hain.", "Buffer ko business mein mat lagayein.");

  // Debt
  if (af.loanNeeded > 0) {
    const sev = af.level === "bad" ? "high" : af.level === "mid" ? "medium" : "low";
    add("Debt Risk", sev, `EMI ${F.inr(af.emi)}/mahina`,
      `Estimated profit ${F.inr(p.profit)} hai, EMI ke baad ${F.inr(af.after)} bachta hai.`,
      sev === "low" ? "Time par EMI bharein, interest subvention ka fayda lein."
                    : "Loan amount kam karein ya tenure badhayein (total interest badhega).");
  }

  // Market
  const top = sens[0];
  add("Market Risk", top.pctImpact > 45 ? "high" : top.pctImpact > 25 ? "medium" : "low",
    `${top.label} mein choti si gir-badh ka bada asar`,
    `Sirf 10% badlav se profit ${F.inr(top.impact)} kam ho jata hai.`,
    "Rate lock/advance booking ya do-teen buyer banayein.");

  // Competition
  const comp = loc ? (loc.competitors[biz.tag] ?? 3) : 3;
  add("Competition Risk", comp >= 7 ? "high" : comp >= 4 ? "medium" : "low",
    `${loc ? loc.village : "Aapke area"} mein ~${comp} similar business`,
    comp >= 7 ? "Bhav girane ka dabav rahega." : "Competition sambhalne layak hai.",
    comp >= 4 ? "Quality/home-delivery/credit-free model se alag dikhein." : "Jaldi customer base bana lein.");

  // Transport / supply
  if (loc) add("Supply & Transport Risk", loc.transportFactor >= 1.2 ? "high" : loc.transportFactor >= 1.0 ? "medium" : "low",
    `Mandi ${loc.mandiKm} km door (${loc.mandi})`,
    loc.transportFactor >= 1.2 ? "Transport aapka margin kha sakta hai." : "Transport cost manageable hai.",
    loc.transportFactor >= 1.2 ? "Pehle block/gaon market mein bechein, ya doosron ke saath gaadi share karein." : "Weekly trip plan karke trips kam karein.");

  // Operational
  add("Operational Risk", biz.complexity >= 4 ? "high" : biz.complexity >= 3 ? "medium" : "low",
    `${biz.skill} ka kaam`,
    biz.complexity >= 4 ? "Bina training ke galti hone ka risk zyada hai." : "Kaam seekhne layak hai.",
    "KVK / DIC / RSETI ki free training pehle le lein.");

  // Seasonal
  add("Seasonal Risk", "medium", "Season ka asar", biz.seasonality,
    "Achhe season ki kamai ka ek hissa bure season ke liye bachayein.");

  // Resource mismatch
  const have = new Set(profile.resources || []);
  const missing = biz.needs.filter(r => !have.has(r));
  if (missing.length) add("Resource Risk", "high", "Zaroori resource nahi hai",
    "Missing: " + missing.join(", "), "Kiraye par lein ya woh business chunein jisme ye zaroori na ho.");

  const sevScore = { high:3, medium:2, low:1 };
  out.sort((x, y) => sevScore[y.sev] - sevScore[x.sev]);
  const overall = out.filter(r => r.sev === "high").length >= 3 ? "High"
                : out.filter(r => r.sev === "high").length >= 1 ? "Medium" : "Low";
  return { list:out, overall, sensitivity:sens };
}

/* ---------------- SCHEME MATCHING (never claims eligibility) ---------------- */
export function matchSchemes(profile, bizId) {
  const capital = profile.capital || 0;
  return SCHEMES.map(s => {
    let pts = 0; const why = [], check = [];
    if (bizId && s.tags.includes(bizId)) { pts += 40; why.push("Aapke business type ke liye bani hai"); }
    else if (!bizId) pts += 10;
    if (capital >= s.minCapital) { pts += 20; why.push("Aapka apna yogdan (own contribution) range mein lagta hai"); }
    else check.push(`Is scheme mein aam taur par kam se kam ${F.inr(s.minCapital)} apna yogdan expect kiya jata hai`);
    if (profile.gender === "female" && /mahila|stand/i.test(s.id + s.name)) { pts += 25; why.push("Mahila entrepreneurs ke liye special provision"); }
    if (profile.newBusiness !== false && /pmegp|standup/i.test(s.id)) { pts += 15; why.push("Naye (greenfield) unit ke liye"); }
    if (/mudra/.test(s.id)) { pts += 12; why.push("Collateral-free chhote loan ke liye aam tor par use hoti hai"); }
    if (profile.category && /sc|st/i.test(profile.category) && /standup/.test(s.id)) { pts += 20; why.push("SC/ST applicants ke liye"); }
    check.push("Final eligibility bank/official authority ki verification par depend karegi");
    return { scheme:s, score:Math.min(100, pts), why, check,
             band: pts >= 55 ? "Likely relevant" : pts >= 30 ? "Ho sakta hai relevant" : "Kam relevant" };
  }).sort((a, b) => b.score - a.score);
}

/* ---------------- MANDI MIND ---------------- */
export function mandiAdvice(commodity, budget, loc) {
  const c = commodity;
  const tf = loc ? loc.transportFactor : 1;
  const km = loc ? loc.mandiKm : 20;
  const transportPerKg = Math.max(0.6, (km * 0.045) * tf);   // ₹/kg indicative
  const trend = c.prev7[6] - c.prev7[0];
  const trendPct = (trend / c.prev7[0]) * 100;
  const demandMult = { High:1.08, Medium:1.0, Steady:1.0, Low:0.92 }[c.demand] ?? 1;
  const supplyMult = { High:0.94, Medium:1.0, Low:1.07 }[c.supply] ?? 1;
  const expectedSell = c.price * demandMult * supplyMult;
  const costPerKg = c.buyPrice + transportPerKg;

  const plans = [
    { id:"cons", label:"Conservative", hi:"Kam maal, kam risk", use:0.55 },
    { id:"bal",  label:"Balanced",     hi:"Sanhitulit",         use:0.8  },
    { id:"agg",  label:"Aggressive",   hi:"Poora paisa lagana", use:1.0  }
  ].map(p => {
    const spend = budget * p.use;
    const qty = Math.floor(spend / costPerKg);
    const cost = qty * costPerKg;
    const sellable = qty * (1 - c.spoilage);
    const revenue = sellable * expectedSell;
    const gross = revenue - cost;
    const downside = sellable * (expectedSell * 0.88) - cost;   // rate 12% gira
    return { ...p, qty, cost, revenue, gross, downside,
             marginPct: cost > 0 ? (gross / cost) * 100 : 0,
             leftover: budget - cost,
             risk: downside > 0 ? (p.use >= 1 ? "mid" : "ok") : "bad" };
  });

  let pick = plans.find(p => p.risk === "ok") || plans[0];
  if (trendPct < -5) pick = plans[0];
  else if (trendPct > 8 && c.demand === "High") pick = plans[1];

  return { commodity:c, transportPerKg, costPerKg, expectedSell, trend, trendPct, plans, pick,
           reason: trendPct < -5 ? "Pichhle hafte rate gir raha hai — aaj kam maal lena safe hai."
                 : trendPct > 8  ? "Rate upar ja raha hai aur demand achhi hai — thoda zyada maal liya ja sakta hai."
                 : "Rate lagbhag stable hai — balanced quantity theek rahegi." };
}

/* ---------------- ACTION PLAN ---------------- */
export function actionPlan(profile, biz, decision) {
  const loc = locById(profile.locId);
  const needsLoan = decision.afford.loanNeeded > 0;
  return {
    d7: [
      `${loc ? loc.mandi : "Paas ki mandi"} ya 2 suppliers se ${biz.unit} ka aaj ka rate khud confirm karein`,
      "3 sambhavit customers se baat karein — kya wo aapse khareedenge?",
      `${biz.skill} ki free training (KVK / RSETI / DIC) ke baare mein pata karein`,
      "Aadhaar, bank passbook, Udyam registration jaisi zaroori documents ready karein"
    ],
    d30: [
      `Chhote pilot se shuru karein — poora ${F.inr(decision.structure.total)} ek saath mat lagayein`,
      "Rozana bikri aur kharch ek copy/phone mein likhein",
      "Pehle mahine ke asli numbers app mein daal kar plan dobara check karein",
      "Kam se kam 2 buyer/market banayein taaki ek jagah rate gire to nuksan na ho"
    ],
    beforeLoan: needsLoan ? [
      `Bank se EMI khud confirm karein — hamara estimate ${F.inr(decision.afford.emi)}/mahina hai`,
      "Interest rate aur processing charges likhit mein lein",
      `Kam se kam ${F.inr(Math.max(10000, decision.structure.buffer))} emergency ke liye alag rakhein`,
      "Scheme ki eligibility bank shakha se confirm karein — app ka matching sirf indicative hai"
    ] : [
      "Abhi loan ki zaroorat nahi — apne paise se pilot chalayein",
      "3 mahine ke asli numbers ke baad hi loan ka sochein"
    ]
  };
}
