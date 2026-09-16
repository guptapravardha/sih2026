/* ===========================================================
   AI LAYER
   Responsibilities: understand what the user said, decide what
   to ask next, and translate deterministic numbers into simple
   Hinglish. It NEVER computes money — it only narrates results
   produced by finance.js / engine.js.

   For the prototype this is a local rule-based NLU + template
   generator so it works offline and gives identical output in
   every judge demo. `callLLM()` below is the single seam where a
   hosted model can be plugged in later.
   =========================================================== */
import { BUSINESSES, COMMODITIES, LOCATIONS } from "./data.js";
import { inr } from "./finance.js";

export const AI_MODE = "on-device rules"; // shown in UI, no false claims

/* ---- future seam: swap for a real model call ---- */
export async function callLLM(/* prompt, context */) {
  throw new Error("LLM not connected in prototype");
}

/* ---------------- INTENT + ENTITY EXTRACTION ---------------- */
const NUM_WORDS = { ek:1, do:2, teen:3, char:4, paanch:5, pachaas:50, pachas:50, bees:20,
  tees:30, chalis:40, saath:60, sattar:70, assi:80, nabbe:90, sau:100, das:10, pandrah:15, pachchees:25 };

export function parseAmount(text) {
  const t = text.toLowerCase().replace(/,/g, "");
  let m = t.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|lakhs|लाख)/);
  if (m) return Math.round(parseFloat(m[1]) * 100000);
  m = t.match(/(\d+(?:\.\d+)?)\s*(hazaar|hazar|thousand|k|हज़ार|हजार)/);
  if (m) return Math.round(parseFloat(m[1]) * 1000);
  for (const w in NUM_WORDS) {
    if (new RegExp(`\\b${w}\\b.*\\b(hazaar|hazar|हज़ार|हजार)`).test(t)) return NUM_WORDS[w] * 1000;
    if (new RegExp(`\\b${w}\\b.*\\b(lakh|lac|लाख)`).test(t)) return NUM_WORDS[w] * 100000;
  }
  m = t.match(/(?:₹|rs\.?|rupay|rupaye)\s*(\d{3,7})/);
  if (m) return parseInt(m[1]);
  m = t.match(/\b(\d{4,7})\b/);
  if (m) return parseInt(m[1]);
  return null;
}

const BIZ_WORDS = {
  dairy:["dairy","doodh","milk","gaay","gay","bhains","डेयरी","दूध"],
  vegetable:["sabzi","sabji","vegetable","tamatar","pyaz","pyaaz","aalu","mandi","सब्जी"],
  spice:["masala","spice","mirchi","haldi","मसाला"],
  kirana:["kirana","dukaan","shop","grocery","किराना"],
  poultry:["murgi","poultry","chicken","anda","मुर्गी"],
  tailoring:["silai","tailor","kapda","stitch","सिलाई"],
  flour:["chakki","atta","flour","pisai","चक्की"],
  goat:["bakri","goat","बकरी"],
  mushroom:["mushroom","khumbi","मशरूम"],
  repair:["repair","mobile","electric","मरम्मत"]
};

export function parseIntent(text) {
  const t = (text || "").toLowerCase();
  const out = { raw:text, amount:parseAmount(t), bizId:null, commodityId:null, intent:"advice" };
  for (const id in BIZ_WORDS) if (BIZ_WORDS[id].some(w => t.includes(w))) { out.bizId = id; break; }
  const com = COMMODITIES.find(c => t.includes(c.name.toLowerCase()) ||
    (c.id === "tomato" && t.includes("tamatar")) || (c.id === "onion" && t.includes("pyaz")));
  if (com) out.commodityId = com.id;

  if (/loan|emi|karz|kist|क़र्ज़/.test(t)) out.intent = "loan";
  else if (/scheme|yojana|sarkari|subsidy|योजना/.test(t)) out.intent = "scheme";
  else if (/rate|bhav|mandi|price|kitna maal|daam/.test(t)) out.intent = "market";
  else if (/risk|khatra|nuksan|dar/.test(t)) out.intent = "risk";
  else if (/kamaana|kamana|income|mahina.*chahiye|target/.test(t)) out.intent = "reverse";
  else if (/agar|what if|kam ho|gir jaye|badh jaye/.test(t)) out.intent = "whatif";
  else if (/kaunsa|konsa|kya business|suggest|batao/.test(t)) out.intent = "recommend";
  return out;
}

/* ---------------- PROGRESSIVE FOLLOW-UP QUESTIONS ---------------- */
/* Returns the ONE next question that matters most. Never 15 at once. */
export function nextQuestion(profile) {
  if (!profile.capital)        return { field:"capital",  q:"Aapke paas abhi kitna paisa hai jo business mein laga sakte hain?",
                                        type:"amount", help:"Sirf wahi paisa jo aap sach mein laga sakte hain." };
  if (!profile.locId)          return { field:"locId",    q:"Aap kis gaon/block se hain?", type:"location" };
  if (!(profile.resources || []).length)
                               return { field:"resources", q:"Aapke paas in mein se kya-kya pehle se hai?", type:"resources" };
  if (!(profile.interests || []).length)
                               return { field:"interests", q:"Kis tarah ke kaam mein aapka mann lagta hai?", type:"interests" };
  if (!profile.experienceYears)return { field:"experienceYears", q:"Is tarah ke kaam ka kitne saal ka anubhav hai?",
                                        type:"years", help:"Bilkul naya hai to 0 chunein." };
  return null;
}

export function missingInfoNote(profile) {
  const q = nextQuestion(profile);
  return q ? `Ek cheez aur poochhunga: ${q.q}` : null;
}

/* ---------------- EXPLANATION TEMPLATES ---------------- */
export function explainRecommendation(r, loc) {
  const p = r.projection, st = r.structure;
  const cap = r.parts.find(x => x.key === "Capital Fit");
  const mkt = r.parts.find(x => x.key === "Market Fit");
  return [
    `${r.biz.hi} isliye upar aaya kyunki ${cap.note.toLowerCase()}.`,
    loc ? `${loc.village} mein ${mkt.note.toLowerCase()}.` : "",
    `Is scale par poora project lagbhag ${inr(st.total)} ka banta hai.`,
    p.profit > 0
      ? `Normal haalat mein mahine ka andaazan ${inr(p.profit)} bach sakta hai.`
      : `Lekin in assumptions par mahine ka profit nahi ban raha — scale ya lagat badalni padegi.`,
    `Sabse badi dhyan dene wali baat: ${r.biz.risks[0].toLowerCase()}.`
  ].filter(Boolean).join(" ");
}

export function explainAffordability(af) {
  if (af.loanNeeded <= 0)
    return "Aapka apna paisa poore project ko cover kar raha hai, isliye abhi loan ki zaroorat hi nahi dikh rahi. Ye achhi baat hai — bina karz ke shuruaat sabse safe hoti hai.";
  const base = `Loan ${inr(af.loanNeeded)} ka lagega. ${af.rate}% saalana par ${af.tenure} mahine mein EMI lagbhag ${inr(af.emi)} banti hai. Business se mahine ka andaazan ${inr(af.profit)} aata hai, to EMI ke baad ${inr(af.after)} bachega.`;
  const verdict = {
    ok:  "Ye aaram se sambhal sakta hai — phir bhi 1 mahine ka kharch alag rakhein.",
    mid: "EMI nikal to jayegi, lekin safety margin zyada nahi hai. Ek bura mahina aapko dabav mein daal sakta hai.",
    bad: "Ye bahut tight hai. Kam loan lena ya chhote scale se shuru karna zyada samajhdari hoga."
  }[af.level] || "";
  return base + " " + verdict;
}

export function explainStress(s) {
  return `${s.results.filter(r => r.verdict === "ok").length} mein business aaram se chala, ${s.weak} mein kaam chala, aur ${s.fails} situation mein ghaata hua. Sabse bada khatra: "${s.worst.label}" — us haalat mein EMI ke baad ${inr(s.worst.net)} bachta hai. ${s.gradeHi}`;
}

export function explainBreakeven(p, a) {
  return `Har ${a.unitLabel} par aapko lagbhag ${inr(p.contribution)} bachta hai. Mahine ka fixed kharch ${inr(p.fixedMonthly)} hai. Iska matlab jab tak aap mahine mein ${Math.ceil(p.breakevenUnits)} ${a.unitLabel} nahi bech lete, tab tak na nafa na nuksan.`;
}

export function explainScenarios(list) {
  const good = list[0], bad = list[2];
  return `Achhe market mein mahine ka ${inr(good.net)} tak ja sakta hai, lekin bure market mein ${inr(bad.net)} — yaani ${inr(good.net - bad.net)} ka farak. Isiliye poora paisa ek saath lagane se pehle bura scenario zaroor dekh lijiye.`;
}

export function explainMandi(m, budget) {
  const p = m.pick;
  return `${m.reason} ${m.commodity.name} ka aaj ka indicative rate ${inr(m.commodity.price)}/${m.commodity.unit} hai aur khareed ${inr(m.commodity.buyPrice)} par. Transport jodkar aapki lagat ${inr(m.costPerKg)} per ${m.commodity.unit} baithti hai. ${inr(budget)} mein mera suggestion: ${p.label} — lagbhag ${p.qty} ${m.commodity.unit} lein. Agar rate 12% gir gaya to bhi aap ${p.downside >= 0 ? inr(p.downside) + " bacha lenge" : inr(Math.abs(p.downside)) + " ka nuksan hoga"}.`;
}

export function explainAllocation(plans) {
  const safe = plans[0], agg = plans[2];
  return `Ek hi paisa do tarah se laga sakte hain. Chhote pilot mein setup ${inr(safe.structure.fixedInvestment)} ka hai aur ${inr(safe.structure.buffer)} emergency ke liye bachta hai. Bade setup mein setup ${inr(agg.structure.fixedInvestment)} ka hai lekin loan ${inr(agg.structure.loanNeeded)} ka lena padega. Zyada paisa lagane ka matlab zyada kamai nahi — iska matlab hai ki galti ki gunjaish khatam.`;
}

/* ---------------- PHOTO "ANALYSIS" (clearly labelled demo) ---------------- */
export function analysePhoto(fileName = "") {
  const guesses = [
    { tag:"shed", label:"Pashu shed / khula shed jaisa dhaancha", conf:"Medium" },
    { tag:"land", label:"Khuli zameen", conf:"Medium" },
    { tag:"power", label:"Bijli ka connection (taar/meter)", conf:"Low" }
  ];
  const n = fileName.toLowerCase();
  if (/shop|dukaan|kirana/.test(n)) guesses.unshift({ tag:"shop", label:"Dukaan ka counter aur shelf", conf:"Medium" });
  if (/cow|gaay|dairy|animal/.test(n)) guesses.unshift({ tag:"livestock", label:"Pashu (gaay/bhains jaisa)", conf:"Medium" });
  return {
    demo:true,
    summary:"Photo se kuch visible resources identify hue hain. Ye sirf ek suggestion hai — final decision ke liye actual details khud confirm karein.",
    items: guesses.slice(0, 3)
  };
}

/* ---------------- VOICE ---------------- */
export function speechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
export function listen(onResult, onError, lang = "hi-IN") {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError("unsupported"); return null; }
  const r = new SR();
  r.lang = lang; r.interimResults = false; r.maxAlternatives = 1;
  r.onresult = e => onResult(e.results[0][0].transcript);
  r.onerror = e => onError(e.error || "error");
  try { r.start(); } catch (e) { onError("busy"); }
  return r;
}

/* Example prompts shown when voice is unavailable */
export const VOICE_EXAMPLES = [
  "Mere paas ek lakh rupaye hain aur main dairy start karna chahta hoon",
  "Main tamatar bechta hoon, bees hazaar mein is week kitna maal loon?",
  "Kya main ye loan afford kar sakta hoon?",
  "Mujhe tees hazaar mahina kamana hai",
  "Mere liye kaunsi sarkari yojana hai?"
];
