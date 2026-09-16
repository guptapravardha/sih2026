/* ===========================================================
   BUSINESS TWIN — the persistent model of the entrepreneur.
   Every simulation in the app reads from this one object.
   =========================================================== */
const KEY = "gramsaarthi.twin.v1";

const blank = () => ({
  onboarded:false, lang:"hinglish", goal:null, demo:null,
  name:"", gender:"", category:"", occupation:"", experienceYears:0,
  locId:"loc1", capital:0, existingEmi:0, monthlyIncome:0, riskAppetite:"medium",
  resources:[], interests:[], newBusiness:true,
  selectedBiz:null, assumptions:null, scale:"balanced",
  deltas:{}, savedScenarios:[], photoNote:null,
  targetIncome:30000, mandiBudget:null, marketCommodity:"tomato", updatedAt:Date.now()
});

let state = load();
const subs = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch (e) { /* storage blocked — run in memory */ }
  return blank();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

export const twin = () => state;
export function set(patch) {
  state = { ...state, ...patch, updatedAt: Date.now() };
  persist(); subs.forEach(f => f(state));
  return state;
}
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
export function reset() { state = blank(); persist(); subs.forEach(f => f(state)); }

export function saveScenario(entry) {
  const list = [...(state.savedScenarios || []), { ...entry, at: Date.now() }].slice(-8);
  set({ savedScenarios: list });
}

/* --------- Demo profiles for Judge Demo Mode --------- */
export const DEMOS = {
  dairy: {
    id:"dairy", title:"Dairy Demo", icon:"🐄",
    who:"Ramesh — Bamhori (Indore), ₹1,00,000 capital, dairy start karna chahta hai",
    profile:{ onboarded:true, demo:"dairy", lang:"hinglish", goal:"new",
      name:"Ramesh", gender:"male", occupation:"Kheti", experienceYears:3,
      locId:"loc1", capital:100000, existingEmi:0, monthlyIncome:9000, riskAppetite:"medium",
      resources:["shed","water","labour","land","power"], interests:["dairy"],
      selectedBiz:null, assumptions:null, scale:"balanced", deltas:{} }
  },
  vegetable: {
    id:"vegetable", title:"Sabzi Trader Demo", icon:"🍅",
    who:"Sunita — Kheda (Indore), ₹20,000 capital, tamatar ka vyapar",
    profile:{ onboarded:true, demo:"vegetable", lang:"hinglish", goal:"market",
      name:"Sunita", gender:"female", occupation:"Sabzi bikri", experienceYears:5,
      locId:"loc2", capital:20000, existingEmi:0, monthlyIncome:7000, riskAppetite:"low",
      resources:["vehicle","customers","labour"], interests:["vegetable"],
      selectedBiz:"vegetable", assumptions:null, scale:"pilot", deltas:{} }
  },
  spice: {
    id:"spice", title:"Masala Unit Demo", icon:"🌶️",
    who:"Meena — Rampura (Sehore), ₹1,50,000 capital, masala processing",
    profile:{ onboarded:true, demo:"spice", lang:"hinglish", goal:"new",
      name:"Meena", gender:"female", category:"OBC", occupation:"Ghar ka kaam", experienceYears:1,
      locId:"loc3", capital:150000, existingEmi:2500, monthlyIncome:6000, riskAppetite:"medium",
      resources:["shop","power","labour","storage"], interests:["spice"],
      selectedBiz:"spice", assumptions:null, scale:"balanced", deltas:{} }
  }
};

export function loadDemo(id) {
  const d = DEMOS[id];
  if (!d) return;
  state = { ...blank(), ...d.profile };
  persist(); subs.forEach(f => f(state));
}
