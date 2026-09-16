/* ===========================================================
   DATA LAYER  —  all values here are DEMO DATA.
   Replace each export with a real adapter (see js/adapters.js)
   =========================================================== */

export const STATES = ["Madhya Pradesh", "Rajasthan", "Maharashtra", "Uttar Pradesh"];

/* Village -> Block -> District -> State, with local economic factors.
   demand: relative demand index per business tag (1.0 = average)
   transportFactor: multiplies transport costs (distance to main mandi)
   wageFactor: local daily wage level                                    */
export const LOCATIONS = [
  { id:"loc1", village:"Bamhori (Demo)", block:"Sanwer", district:"Indore", state:"Madhya Pradesh",
    mandi:"Indore Choithram Mandi", mandiKm:22, transportFactor:0.9, wageFactor:1.1, water:"Good (borewell)", power:"18-20 hrs",
    demand:{ dairy:1.15, vegetable:1.2, kirana:1.0, spice:1.05, poultry:1.0, tailoring:0.9, flour:1.0, goat:0.95, mushroom:1.1, repair:1.0 },
    competitors:{ dairy:6, vegetable:11, kirana:4, spice:2, poultry:3, tailoring:5, flour:2, goat:7, mushroom:1, repair:2 } },

  { id:"loc2", village:"Kheda (Demo)", block:"Depalpur", district:"Indore", state:"Madhya Pradesh",
    mandi:"Depalpur Mandi", mandiKm:9, transportFactor:0.75, wageFactor:1.0, water:"Moderate (canal)", power:"16-18 hrs",
    demand:{ dairy:1.05, vegetable:1.1, kirana:1.1, spice:0.95, poultry:1.1, tailoring:1.0, flour:1.1, goat:1.0, mushroom:0.9, repair:1.1 },
    competitors:{ dairy:4, vegetable:8, kirana:3, spice:1, poultry:2, tailoring:3, flour:1, goat:5, mushroom:0, repair:1 } },

  { id:"loc3", village:"Rampura (Demo)", block:"Ashta", district:"Sehore", state:"Madhya Pradesh",
    mandi:"Ashta Krishi Upaj Mandi", mandiKm:34, transportFactor:1.25, wageFactor:0.9, water:"Limited (well)", power:"12-16 hrs",
    demand:{ dairy:0.9, vegetable:0.85, kirana:1.0, spice:1.1, poultry:0.95, tailoring:1.05, flour:1.0, goat:1.15, mushroom:0.8, repair:0.95 },
    competitors:{ dairy:9, vegetable:6, kirana:6, spice:1, poultry:4, tailoring:2, flour:3, goat:4, mushroom:0, repair:3 } },

  { id:"loc4", village:"Dhanora (Demo)", block:"Bhilwara Rural", district:"Bhilwara", state:"Rajasthan",
    mandi:"Bhilwara Mandi", mandiKm:28, transportFactor:1.15, wageFactor:0.95, water:"Scarce (tanker in summer)", power:"14-16 hrs",
    demand:{ dairy:1.1, vegetable:0.8, kirana:1.0, spice:1.0, poultry:0.85, tailoring:1.2, flour:1.05, goat:1.25, mushroom:0.6, repair:1.0 },
    competitors:{ dairy:5, vegetable:9, kirana:5, spice:3, poultry:5, tailoring:2, flour:2, goat:6, mushroom:0, repair:2 } },

  { id:"loc5", village:"Sonkhed (Demo)", block:"Loha", district:"Nanded", state:"Maharashtra",
    mandi:"Nanded APMC", mandiKm:41, transportFactor:1.3, wageFactor:1.05, water:"Moderate", power:"16-18 hrs",
    demand:{ dairy:1.0, vegetable:1.05, kirana:0.95, spice:1.2, poultry:1.05, tailoring:0.95, flour:0.95, goat:1.05, mushroom:1.0, repair:1.05 },
    competitors:{ dairy:7, vegetable:10, kirana:7, spice:2, poultry:3, tailoring:6, flour:4, goat:5, mushroom:1, repair:4 } }
];

/* Resource keys used across the app */
export const RESOURCES = [
  { id:"land",     label:"Apni zameen",        icon:"🌾" },
  { id:"shop",     label:"Dukaan / jagah",     icon:"🏪" },
  { id:"shed",     label:"Shed / pashu ghar",  icon:"🏚️" },
  { id:"water",    label:"Paani ki suvidha",   icon:"💧" },
  { id:"power",    label:"Bijli connection",   icon:"⚡" },
  { id:"vehicle",  label:"Gaadi / thela",      icon:"🛺" },
  { id:"livestock",label:"Pashu (pehle se)",   icon:"🐄" },
  { id:"storage",  label:"Storage / godown",   icon:"📦" },
  { id:"labour",   label:"Ghar ke log kaam ke liye", icon:"👨‍👩‍👧" },
  { id:"customers",label:"Pehle se customers", icon:"🤝" }
];

/* ---------- BUSINESS CATALOGUE (base case = "balanced" scale) ----------
   All money in ₹. unit economics are per month at base scale.          */
export const BUSINESSES = [
  {
    id:"dairy", tag:"dairy", name:"Small Dairy Unit", hi:"Choti Dairy (doodh)", icon:"🐄",
    unit:"litre doodh", complexity:3, skill:"Pashupalan",
    base:{ fixedInvestment:180000, units:1800, price:42, varCost:26, fixedMonthly:9000, wcMonths:1.5 },
    needs:["shed","water","labour"], nice:["land","livestock"],
    seasonality:"Garmi mein doodh production 10-15% girta hai, feed mehnga hota hai.",
    why:["Doodh ki demand roz hoti hai — cash daily aata hai","Gaon mein collection centre/dairy society se sale aasan","Gobar se khet ya gobar-gas ka extra fayda"],
    risks:["Feed (chara/khal) ka daam badhna","Pashu bimaar hone par doodh rukna","Doodh ka rate society par depend karta hai"],
    assumptionsNote:"2 desi/crossbred gaay, ~10 litre/din/gaay, 30 din"
  },
  {
    id:"vegetable", tag:"vegetable", name:"Vegetable Trading", hi:"Sabzi ka vyapar", icon:"🍅",
    unit:"kg sabzi", complexity:2, skill:"Mandi/bikri",
    base:{ fixedInvestment:35000, units:6000, price:26, varCost:20, fixedMonthly:6000, wcMonths:0.6 },
    needs:["vehicle"], nice:["storage","customers","shop"],
    seasonality:"Barish mein spoilage zyada, tyohar par demand upar.",
    why:["Kam paisa lagta hai, rozana paisa ghoomta hai","Seekhna aasan — koi machine nahi","Aap ke gaon se mandi paas hai to margin achha"],
    risks:["Maal sadne ka nuksan (spoilage)","Mandi rate ek din mein gir sakta hai","Bahut competition"],
    assumptionsNote:"~200 kg/din khareed-bikri, 6-8% spoilage"
  },
  {
    id:"spice", tag:"spice", name:"Spice / Masala Processing", hi:"Masala packing unit", icon:"🌶️",
    unit:"kg masala", complexity:4, skill:"Processing + packaging",
    base:{ fixedInvestment:150000, units:900, price:190, varCost:140, fixedMonthly:14000, wcMonths:1.2 },
    needs:["shop","power"], nice:["storage","labour"],
    seasonality:"Shaadi aur tyohar season mein demand 20-30% upar.",
    why:["Value addition — kaccha maal se zyada margin","Local brand banaya ja sakta hai","Shelf life lambi, rozana bechne ka dabav nahi"],
    risks:["FSSAI license aur packaging cost","Branded companies se competition","Bikri chain banane mein time lagta hai"],
    assumptionsNote:"Pulveriser + packing machine, ~30 kg/din"
  },
  {
    id:"kirana", tag:"kirana", name:"Kirana Shop", hi:"Kirana dukaan", icon:"🏪",
    unit:"din ki bikri", complexity:2, skill:"Retail",
    base:{ fixedInvestment:70000, units:30, price:5200, varCost:4500, fixedMonthly:7000, wcMonths:1.0 },
    needs:["shop"], nice:["storage","customers"],
    seasonality:"Fasal katne ke baad gaon mein kharch badhta hai.",
    why:["Gaon mein roz ki zaroorat","Udhaar control kiya to steady income","Ghar se hi chalayi ja sakti hai"],
    risks:["Udhaar (credit) phas jaana","Stock mein paisa block hona","Paas mein doosri dukaan"],
    assumptionsNote:"~₹5,200/din bikri, ~13% average margin"
  },
  {
    id:"poultry", tag:"poultry", name:"Backyard Poultry", hi:"Murgi palan", icon:"🐔",
    unit:"kg / anda", complexity:3, skill:"Pashupalan",
    base:{ fixedInvestment:90000, units:1100, price:120, varCost:88, fixedMonthly:6500, wcMonths:1.2 },
    needs:["shed","water"], nice:["land","labour"],
    seasonality:"Sardi mein rate achha, garmi mein mortality zyada.",
    why:["45 din mein batch taiyar — jaldi paisa ghoomta hai","Kam jagah chahiye","Local dhaba/hotel ko direct bikri"],
    risks:["Bimari se poora batch ja sakta hai","Feed price volatile","Rate market par depend"],
    assumptionsNote:"~500 birds/batch, 1.5 batch/month equivalent"
  },
  {
    id:"tailoring", tag:"tailoring", name:"Tailoring / Silai Centre", hi:"Silai ka kaam", icon:"🧵",
    unit:"kapda silai", complexity:2, skill:"Silai",
    base:{ fixedInvestment:45000, units:260, price:260, varCost:70, fixedMonthly:5500, wcMonths:0.6 },
    needs:[], nice:["shop","labour","customers","power"],
    seasonality:"Tyohar aur shaadi season mein kaam double.",
    why:["Ghar se shuru ho sakta hai","Mahilaon ke liye achha option","Kam investment, kam risk"],
    risks:["Off-season mein kaam kam","Ek aadmi ki capacity limited","Readymade kapdon se competition"],
    assumptionsNote:"2 machine, ~10 piece/din"
  },
  {
    id:"flour", tag:"flour", name:"Atta Chakki / Flour Mill", hi:"Aata chakki", icon:"🌾",
    unit:"quintal pisai", complexity:3, skill:"Machine chalana",
    base:{ fixedInvestment:130000, units:150, price:320, varCost:150, fixedMonthly:8000, wcMonths:0.5 },
    needs:["shop","power"], nice:["storage"],
    seasonality:"Fasal ke baad 2-3 mahine peak.",
    why:["Gaon mein sabko zaroorat","Service business — stock kam","Bhusa/chokar se extra income"],
    risks:["Bijli jaana = kaam band","Motor repair cost","Gaon mein pehle se chakki ho to demand batega"],
    assumptionsNote:"~5 quintal/din pisai, bijli 3-phase"
  },
  {
    id:"goat", tag:"goat", name:"Goat Rearing", hi:"Bakri palan", icon:"🐐",
    unit:"kg live weight", complexity:3, skill:"Pashupalan",
    base:{ fixedInvestment:120000, units:200, price:420, varCost:250, fixedMonthly:4500, wcMonths:2.5 },
    needs:["shed","land"], nice:["water","labour"],
    seasonality:"Bakrid aur tyohar par rate sabse achha.",
    why:["Kam paani chahiye — sukhe ilaake ke liye achha","Bakri 'chalti-firti FD' hai — zaroorat par bech sakte hain","Chara khet se mil sakta hai"],
    risks:["Paisa 6-8 mahine baad aata hai (lambi cycle)","Bimari/mortality","Chori ka risk"],
    assumptionsNote:"20+1 unit, sale cycle ~8 mahine, monthly average dikhaya gaya"
  },
  {
    id:"mushroom", tag:"mushroom", name:"Mushroom Farming", hi:"Mushroom ki kheti", icon:"🍄",
    unit:"kg mushroom", complexity:4, skill:"Technical training zaroori",
    base:{ fixedInvestment:85000, units:600, price:160, varCost:95, fixedMonthly:7000, wcMonths:1.2 },
    needs:["shed","water","power"], nice:["labour"],
    seasonality:"Sardi mein sabse achha; garmi mein cooling cost.",
    why:["Choti jagah mein achhi kamai","Sirf 25-30 din ka cycle","Hotel/city market mein demand badh rahi hai"],
    risks:["Temperature control fail = poori fasal kharab","Local gaon mein bikri kam — city bhejni padegi","Training ke bina failure rate zyada"],
    assumptionsNote:"~300 bags/cycle, 2 cycle/2 mahine"
  },
  {
    id:"repair", tag:"repair", name:"Mobile & Electric Repair", hi:"Mobile/electric repair", icon:"🔧",
    unit:"repair job", complexity:2, skill:"Technical training",
    base:{ fixedInvestment:55000, units:170, price:320, varCost:130, fixedMonthly:5000, wcMonths:0.8 },
    needs:["shop","power"], nice:["customers"],
    seasonality:"Saal bhar steady.",
    why:["Har ghar mein mobile hai","Kam stock, high margin service","Recharge/accessories se extra income"],
    risks:["Skill ke bina kaam nahi chalega","Spare parts ke liye city jaana padta hai","Block mein pehle se shops"],
    assumptionsNote:"~6 job/din, spare parts cost included"
  }
];

/* ---------------- MANDI / MARKET DEMO DATA ---------------- */
export const COMMODITIES = [
  { id:"tomato", name:"Tamatar", icon:"🍅", unit:"kg",
    price:18, prev7:[14,15,17,16,19,20,18], buyPrice:12, demand:"High", supply:"Medium",
    spoilage:0.08, note:"Barish ke baad aavak kam, rate upar gaya.", festivalBoost:0.1 },
  { id:"onion", name:"Pyaaz", icon:"🧅", unit:"kg",
    price:26, prev7:[30,29,28,27,26,26,26], buyPrice:21, demand:"Medium", supply:"High",
    spoilage:0.04, note:"Nayi aavak zyada, rate neeche aa raha hai.", festivalBoost:0.05 },
  { id:"potato", name:"Aalu", icon:"🥔", unit:"kg",
    price:16, prev7:[15,15,16,16,16,17,16], buyPrice:12.5, demand:"Steady", supply:"High",
    spoilage:0.03, note:"Cold storage stock ke wajah se rate stable.", festivalBoost:0.08 },
  { id:"milk", name:"Doodh", icon:"🥛", unit:"litre",
    price:42, prev7:[41,41,42,42,42,43,42], buyPrice:0, demand:"High", supply:"Medium",
    spoilage:0.01, note:"Society rate mein halka sudhar.", festivalBoost:0.12 },
  { id:"wheat", name:"Gehun", icon:"🌾", unit:"quintal",
    price:2450, prev7:[2400,2410,2420,2430,2440,2455,2450], buyPrice:2300, demand:"Medium", supply:"Medium",
    spoilage:0.01, note:"MSP ke aas-paas rate chal raha hai.", festivalBoost:0.03 }
];

/* ---------------- GOVERNMENT SCHEMES (DEMO RECORDS) ----------------
   NOTE: these are simplified demo records for the prototype. Real
   eligibility must be verified with the bank / official portal.     */
export const SCHEMES = [
  { id:"pmfme", name:"PM FME (Micro Food Processing)", purpose:"Food/masala processing unit lagane ke liye credit-linked support",
    forWhom:"Micro food processing entrepreneurs, SHG, FPO", tags:["spice","flour","dairy"],
    supportType:"Credit-linked subsidy (project cost ka ek hissa, scheme rules ke hisaab se)",
    maxSupportNote:"Demo record — actual cap aur ratio official guidelines par depend karta hai",
    minCapital:20000, maxProject:1000000,
    docs:["Aadhaar","Bank account","Project report","Udyam registration","FSSAI (processing ke liye)"],
    route:"District Resource Person / State Nodal Agency / pmfme portal" },
  { id:"pmegp", name:"PMEGP", purpose:"Naya micro-enterprise shuru karne ke liye margin money support ke saath loan",
    forWhom:"18+ naye entrepreneurs, naya unit (existing unit nahi)", tags:["dairy","spice","tailoring","flour","repair","poultry","mushroom","kirana"],
    supportType:"Bank loan + margin money subsidy (category & area ke hisaab se alag)",
    maxSupportNote:"Demo record — rural/urban aur category ke hisaab se percentage alag hota hai",
    minCapital:10000, maxProject:2500000,
    docs:["Aadhaar","Caste/category certificate (agar applicable)","Project report","Education proof (agar maanga jaye)"],
    route:"KVIC / KVIB / DIC — online PMEGP e-portal" },
  { id:"mudra", name:"PM MUDRA Yojana (Shishu/Kishor)", purpose:"Chhote business ke liye bina collateral loan",
    forWhom:"Non-farm micro units — trading, service, manufacturing", tags:["kirana","vegetable","tailoring","repair","spice","flour"],
    supportType:"Term loan / working capital loan (Shishu, Kishor, Tarun categories)",
    maxSupportNote:"Demo record — amount category aur bank appraisal par depend karta hai",
    minCapital:0, maxProject:1000000,
    docs:["Aadhaar","PAN","Business proof","Bank statement","Quotation of machinery"],
    route:"Koi bhi bank / NBFC / MFI shakha" },
  { id:"kcc-ah", name:"KCC — Animal Husbandry & Dairy", purpose:"Pashupalan ke rozana kharch (working capital) ke liye",
    forWhom:"Dairy, poultry, goat, fisheries farmers", tags:["dairy","poultry","goat"],
    supportType:"Working capital limit, interest subvention timely repayment par",
    maxSupportNote:"Demo record — limit animal count aur scale of finance par depend karti hai",
    minCapital:0, maxProject:300000,
    docs:["Aadhaar","Land/animal proof","Bank account","Photo"],
    route:"Nearest bank branch / pashu chikitsalay camp" },
  { id:"nlm", name:"National Livestock Mission", purpose:"Bakri/murgi/chara unit ke liye capital subsidy support",
    forWhom:"Individual, SHG, FPO, section-8 companies", tags:["goat","poultry"],
    supportType:"Capital subsidy (project-linked, instalments mein)",
    maxSupportNote:"Demo record — project size aur approval par depend",
    minCapital:50000, maxProject:5000000,
    docs:["Aadhaar","Land proof/lease","Project report","Training certificate","Bank appraisal letter"],
    route:"State Animal Husbandry Dept / NLM portal" },
  { id:"mahila", name:"Mahila Udyam / SHG Credit Linkage", purpose:"Mahila entrepreneurs ko SHG ke through sasta credit",
    forWhom:"SHG member mahilayein", tags:["tailoring","kirana","vegetable","spice","mushroom","dairy"],
    supportType:"SHG bank linkage loan, kam interest rate",
    maxSupportNote:"Demo record — SHG grading aur savings par depend",
    minCapital:0, maxProject:500000,
    docs:["SHG membership proof","Aadhaar","Bank account","Group resolution"],
    route:"NRLM block office / SHG federation" },
  { id:"standup", name:"Stand-Up India", purpose:"SC/ST aur mahila entrepreneurs ke liye greenfield project loan",
    forWhom:"SC/ST ya mahila entrepreneur, naya (greenfield) unit", tags:["spice","flour","dairy","mushroom","repair"],
    supportType:"Bank term loan + working capital (composite)",
    maxSupportNote:"Demo record — bank appraisal par depend",
    minCapital:100000, maxProject:10000000,
    docs:["Aadhaar","Caste certificate / gender proof","Project report","Quotations"],
    route:"Scheduled commercial bank / standupmitra portal" }
];

/* Helper look-ups */
export const byId = (arr, id) => arr.find(x => x.id === id);
export const bizById = id => BUSINESSES.find(b => b.id === id);
export const locById = id => LOCATIONS.find(l => l.id === id);
