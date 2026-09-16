/* ===========================================================
   FINANCIAL CALCULATION ENGINE  — pure, deterministic.
   No AI/LLM touches these numbers. UI + AI only explain them.
   =========================================================== */

export const round = (n, step = 1) => Math.round(n / step) * step;
export const inr = n => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const neg = n < 0; n = Math.abs(Math.round(n));
  const s = n.toString();
  let last3 = s.slice(-3), rest = s.slice(0, -3);
  if (rest) last3 = "," + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return (neg ? "-₹" : "₹") + rest + last3;
};
export const pct = n => (isFinite(n) ? (Math.round(n * 10) / 10) + "%" : "—");

/* ---------- scale presets ---------- */
export const SCALES = {
  pilot:      { id:"pilot",      label:"Chhota Pilot",  f:0.45, hi:"Kam paisa, kam risk" },
  balanced:   { id:"balanced",   label:"Balanced",      f:1.00, hi:"Sanhitulit shuruaat" },
  aggressive: { id:"aggressive", label:"Bada Setup",    f:1.60, hi:"Zyada paisa, zyada risk" }
};

/* Build the editable assumption set for a business at a location + scale.
   Location factors change demand (units), transport (fixed cost), wages. */
export function buildAssumptions(biz, loc, scaleId = "balanced") {
  const f = SCALES[scaleId].f;
  const d = loc ? (loc.demand[biz.tag] ?? 1) : 1;
  const tf = loc ? loc.transportFactor : 1;
  const wf = loc ? loc.wageFactor : 1;
  const b = biz.base;
  return {
    bizId: biz.id, locId: loc ? loc.id : null, scale: scaleId,
    fixedInvestment: round(b.fixedInvestment * f, 500),
    units:           round(b.units * f * d, 1),
    price:           b.price,
    varCost:         round(b.varCost * (0.96 + 0.08 * tf), 0.5),
    fixedMonthly:    round(b.fixedMonthly * f * (0.6 * wf + 0.4 * tf), 100),
    wcMonths:        b.wcMonths,
    bufferPct:       10,
    interestRate:    11,          // % p.a. indicative
    tenureMonths:    36,
    unitLabel:       biz.unit
  };
}

/* ---------- core monthly P&L ---------- */
export function project(a) {
  const revenue      = a.units * a.price;
  const variableCost = a.units * a.varCost;
  const grossProfit  = revenue - variableCost;
  const profit       = grossProfit - a.fixedMonthly;
  const margin       = revenue > 0 ? (profit / revenue) * 100 : 0;
  const contribution = a.price - a.varCost;
  const breakevenUnits = contribution > 0 ? a.fixedMonthly / contribution : Infinity;
  const breakevenRevenue = breakevenUnits * a.price;
  return { revenue, variableCost, grossProfit, fixedMonthly:a.fixedMonthly,
           profit, margin, contribution, breakevenUnits, breakevenRevenue };
}

/* ---------- project cost structure ---------- */
export function structure(a, capital) {
  const p = project(a);
  const workingCapital = round((p.variableCost + a.fixedMonthly) * a.wcMonths, 100);
  const base = a.fixedInvestment + workingCapital;
  const buffer = round(base * (a.bufferPct / 100), 100);
  const total = a.fixedInvestment + workingCapital + buffer;
  const ownContribution = Math.min(capital, total);
  const loanNeeded = Math.max(0, total - capital);
  const capitalLeft = Math.max(0, capital - total);
  return { fixedInvestment:a.fixedInvestment, workingCapital, buffer, total,
           ownContribution, loanNeeded, capitalLeft,
           capitalCoverage: total > 0 ? (capital / total) * 100 : 100 };
}

/* ---------- EMI (reducing balance) ---------- */
export function emi(principal, annualRatePct, months) {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}
export function loanTotals(principal, rate, months) {
  const e = emi(principal, rate, months);
  return { emi:e, totalPaid:e * months, totalInterest:e * months - principal };
}

/* ---------- loan affordability (cash-flow based, not bank eligibility) ---------- */
export function affordability(a, capital, existingEmi = 0) {
  const p = project(a);
  const st = structure(a, capital);
  const e = emi(st.loanNeeded, a.interestRate, a.tenureMonths);
  const totalObligation = e + existingEmi;
  const after = p.profit - totalObligation;
  const dscr = totalObligation > 0 ? p.profit / totalObligation : Infinity;
  let level, label, hi;
  if (st.loanNeeded === 0)      { level="none"; label="Loan ki zaroorat nahi"; hi="Aapka apna paisa poora project cover kar raha hai."; }
  else if (dscr >= 1.7 && after > 6000) { level="ok";  label="Comfortable"; hi="EMI ke baad theek paisa bachta hai."; }
  else if (dscr >= 1.25)        { level="mid"; label="Sambhal kar chalayein"; hi="EMI nikal jayegi, lekin safety margin kam hai."; }
  else                          { level="bad"; label="Abhi bahut risky"; hi="Business ki kamai se EMI aaram se nahi nikal rahi."; }
  return { emi:e, existingEmi, totalObligation, profit:p.profit, after, dscr, level, label, hi,
           loanNeeded: st.loanNeeded, rate:a.interestRate, tenure:a.tenureMonths,
           ...loanTotals(st.loanNeeded, a.interestRate, a.tenureMonths) };
}

/* ---------- payback & ROI ---------- */
export function returns(a, capital) {
  const p = project(a);
  const st = structure(a, capital);
  const af = affordability(a, capital);
  const netCash = p.profit - af.emi;
  const paybackMonths = netCash > 0 ? (st.fixedInvestment + st.workingCapital) / netCash : Infinity;
  const roi = st.total > 0 ? (p.profit * 12 / st.total) * 100 : 0;
  return { paybackMonths, roi, netCash, annualProfit: p.profit * 12 };
}

/* ---------- what-if: apply deltas to assumptions ---------- */
export function applyDeltas(a, d = {}) {
  const n = { ...a };
  if (d.pricePct)     n.price        = a.price * (1 + d.pricePct / 100);
  if (d.varCostPct)   n.varCost      = a.varCost * (1 + d.varCostPct / 100);
  if (d.unitsPct)     n.units        = a.units * (1 + d.unitsPct / 100);
  if (d.fixedPct)     n.fixedMonthly = a.fixedMonthly * (1 + d.fixedPct / 100);
  if (d.priceAbs  !== undefined) n.price        = d.priceAbs;
  if (d.varCostAbs!== undefined) n.varCost      = d.varCostAbs;
  if (d.unitsAbs  !== undefined) n.units        = d.unitsAbs;
  if (d.fixedAbs  !== undefined) n.fixedMonthly = d.fixedAbs;
  return n;
}

/* ---------- three named scenarios ---------- */
export function scenarios(a, capital) {
  const defs = [
    { id:"good",   label:"Achha Market", hi:"Rate +8%, bikri +10%",  d:{ pricePct:8,  unitsPct:10 } },
    { id:"normal", label:"Normal",       hi:"Aaj ke assumptions",    d:{} },
    { id:"bad",    label:"Bura Market",  hi:"Rate -12%, lagat +10%, bikri -15%", d:{ pricePct:-12, varCostPct:10, unitsPct:-15 } }
  ];
  const baseEmi = affordability(a, capital).emi;
  return defs.map(s => {
    const na = applyDeltas(a, s.d);
    const p = project(na);
    const net = p.profit - baseEmi;
    return { ...s, revenue:p.revenue, profit:p.profit, net, emi:baseEmi,
             risk: net > 8000 ? "ok" : net > 0 ? "mid" : "bad" };
  });
}

/* ---------- stress test ---------- */
export const STRESS_TESTS = [
  { id:"price",   label:"Bikri ka rate 10% gir gaya",       d:{ pricePct:-10 } },
  { id:"input",   label:"Kaccha maal / feed 15% mehnga",    d:{ varCostPct:15 } },
  { id:"demand",  label:"Demand 20% kam ho gayi",           d:{ unitsPct:-20 } },
  { id:"transport",label:"Transport/fixed kharch 20% upar", d:{ fixedPct:20 } },
  { id:"combo",   label:"Sab ek saath (worst case)",        d:{ pricePct:-10, varCostPct:15, unitsPct:-20, fixedPct:10 } }
];

export function stressTest(a, capital, existingEmi = 0) {
  const e = affordability(a, capital).emi + existingEmi;
  const results = STRESS_TESTS.map(t => {
    const p = project(applyDeltas(a, t.d));
    const net = p.profit - e;
    return { ...t, profit:p.profit, net,
             verdict: net > 5000 ? "ok" : net > 0 ? "mid" : "bad" };
  });
  const fails = results.filter(r => r.verdict === "bad").length;
  const weak  = results.filter(r => r.verdict === "mid").length;
  let grade, gradeHi;
  if (fails === 0 && weak <= 1) { grade="Resilient";  gradeHi="Bure haalat mein bhi business sambhal sakta hai."; }
  else if (fails <= 1)          { grade="Manageable"; gradeHi="Zyadatar situation mein chal jayega, ek-do jagah dhyan chahiye."; }
  else                          { grade="Vulnerable"; gradeHi="Thodi si bhi kharabi par business ghaate mein chala jayega."; }
  const worst = results.slice().sort((x, y) => x.net - y.net)[0];
  return { results, grade, gradeHi, worst, emi:e, fails, weak };
}

/* ---------- sensitivity: which single factor hurts most ---------- */
export function sensitivity(a) {
  const base = project(a).profit;
  const tests = [
    { id:"price",  label:"Bikri ka rate", d:{ pricePct:-10 } },
    { id:"cost",   label:"Kaccha maal",   d:{ varCostPct:10 } },
    { id:"demand", label:"Bikri (units)", d:{ unitsPct:-10 } },
    { id:"fixed",  label:"Fixed kharch",  d:{ fixedPct:10 } }
  ];
  return tests.map(t => {
    const p = project(applyDeltas(a, t.d)).profit;
    return { ...t, impact: base - p, pctImpact: base !== 0 ? ((base - p) / Math.abs(base)) * 100 : 0 };
  }).sort((x, y) => y.impact - x.impact);
}

/* ---------- reverse planner: target income -> required scale ---------- */
export function reversePlan(biz, loc, targetProfit) {
  const a = buildAssumptions(biz, loc, "balanced");
  const contribution = a.price - a.varCost;
  if (contribution <= 0) return null;
  const unitsNeeded = (targetProfit + a.fixedMonthly) / contribution;
  const factor = unitsNeeded / a.units;
  const scaled = { ...a, units: unitsNeeded,
                   fixedInvestment: round(a.fixedInvestment * Math.max(0.3, factor), 500) };
  // fixed cost grows with scale too (step-wise, 60% of factor)
  scaled.fixedMonthly = round(a.fixedMonthly * (1 + (factor - 1) * 0.6), 100);
  const units2 = (targetProfit + scaled.fixedMonthly) / contribution;
  scaled.units = round(units2, 1);
  const p = project(scaled);
  const st = structure(scaled, 0);
  return { biz, assumptions:scaled, projection:p, structure:st,
           unitsNeeded: scaled.units, perDay: scaled.units / 30,
           revenueNeeded: p.revenue, capitalNeeded: st.total, feasibleFactor: factor };
}

/* ---------- capital allocation options for "Mere paas ₹X hai" ---------- */
export function allocationPlans(biz, loc, capital) {
  return ["pilot", "balanced", "aggressive"].map(s => {
    const a = buildAssumptions(biz, loc, s);
    const st = structure(a, capital);
    const p = project(a);
    const af = affordability(a, capital);
    const stress = stressTest(a, capital);
    return { scale:SCALES[s], assumptions:a, structure:st, projection:p,
             afford:af, stress, ret:returns(a, capital),
             fitsOwnMoney: st.loanNeeded === 0 };
  });
}
