/* ===========================================================
   DATA ADAPTERS
   Every external data source the product will eventually need
   is declared here behind one interface. Today each adapter
   returns the local demo dataset and reports source:"demo".
   Swapping in a real API = changing ONE function body.
   Nothing in the app calls an external API today, and no
   screen is allowed to label data OFFICIAL unless the adapter
   returns source:"official".
   =========================================================== */
import { LOCATIONS, COMMODITIES, SCHEMES } from "./data.js";

const demo = data => ({ source:"demo", fetchedAt:null, data });

export const MarketAdapter = {
  id:"market",
  connected:false,
  /* future: Agmarknet / eNAM / state mandi board API */
  async prices(commodityId, districtName) {
    const c = COMMODITIES.find(x => x.id === commodityId);
    return demo(c);
  }
};

export const WeatherAdapter = {
  id:"weather", connected:false,
  /* future: IMD / OpenWeather */
  async forecast(locId) {
    const l = LOCATIONS.find(x => x.id === locId);
    return demo({ water:l?.water, note:"Demo — mausam ka asar seasonality text mein shamil hai." });
  }
};

export const SchemeAdapter = {
  id:"schemes", connected:false,
  /* future: myScheme.gov.in / PMEGP / state portals */
  async list() { return demo(SCHEMES); },
  async verifyEligibility() {
    return { source:"none", data:null,
      note:"Eligibility verification is intentionally NOT implemented. Only a bank or the official authority can confirm it." };
  }
};

export const LocationAdapter = {
  id:"location", connected:false,
  /* future: LGD codes / Maps geocoding */
  async resolve(locId) { return demo(LOCATIONS.find(x => x.id === locId)); },
  async list() { return demo(LOCATIONS); }
};

export const SpeechAdapter = {
  id:"speech",
  connected: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  engine: (window.SpeechRecognition || window.webkitSpeechRecognition) ? "browser" : "none"
  /* future: Bhashini ASR/TTS for Indian languages */
};

export const VisionAdapter = {
  id:"vision", connected:false
  /* future: image model for shop/farm/livestock context */
};

export const LLMAdapter = {
  id:"llm", connected:false, engine:"on-device rules"
  /* future: hosted model for free-form explanation; all money maths
     stays in finance.js regardless. */
};

export const ADAPTERS = [MarketAdapter, WeatherAdapter, SchemeAdapter,
  LocationAdapter, SpeechAdapter, VisionAdapter, LLMAdapter];

export const connectionStatus = () =>
  ADAPTERS.map(a => ({ id:a.id, connected:!!a.connected, engine:a.engine || null }));
