# GramSaarthi

**"Aapke business ka faisla, aapke area aur aapke paison ke hisaab se."**

AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural Micro-Entrepreneurs — a mobile-first PWA prototype for Smart India Hackathon.

---

## Run it

No build step, no `npm install`. It is plain ES modules, so it needs to be served over HTTP (not opened as `file://`).

```bash
cd gramsaarthi
python3 -m http.server 8000
# open http://localhost:8000
```

Any static host works too (Netlify / Vercel / GitHub Pages) — drag the folder in and share the link or a QR code. On Android Chrome it offers **Add to Home Screen** and then runs standalone and offline.

**For judges:** open the app → **Demo Mode** (also on the welcome screen) → pick *Dairy Demo*. Everything is pre-filled.

---

## 2-minute demo script

1. **Demo Mode → Dairy Demo** (Ramesh, Bamhori village, ₹1,00,000)
2. **Kaunsa Business?** → three scored options; dairy is tagged *aapne poochha tha*
3. Pick **Choti Dairy** → **Business Plan** (investment, break-even, ROI, risks)
4. **Paisa Ka Plan** → setup vs working capital vs emergency buffer; pilot vs bada setup
5. **Loan Check** → EMI ₹1,224, "Comfortable", DSCR under *Details*
6. **Mera Market → Mandi Mind** → how much stock to buy this week
7. **Agar Main Ye Karun?** → drag milk price to **−10%**, feed cost to **+20%** → profit falls ₹9,865 → ₹927
8. **Stress Test** → *Vulnerable*
9. **Final Faisla** → flips from 🟢 START to 🔴 **DON'T START YET**, with reasons
10. **Scheme Matching** → relevant-not-eligible framing → **Ab Aage Kya Karein?** checklist

---

## Architecture

```
index.html          app shell
css/styles.css      design system (earthy palette, 360–430px first)
js/
  app.js            router, chrome, event delegation, PWA, voice wiring
  screens.js        all screens (presentation only)
  engine.js         business logic: scoring, decision, risk, schemes, Mandi Mind
  finance.js        deterministic financial engine — EMI, break-even, ROI,
                    working capital, stress test, scenarios, reverse planner
  ai.js             AI layer: intent parsing, follow-up questions, explanations
  data.js           mock data layer (locations, businesses, market, schemes)
  store.js          "Business Twin" — persistent profile (localStorage)
  ui.js             shared UI helpers + inline SVG charts (no chart library)
  adapters.js       interfaces for future real APIs; all report source:"demo"
sw.js               app-shell cache for low connectivity
manifest.json       PWA manifest
```

**Hard rule:** the LLM/AI layer never computes money. Every rupee comes from `finance.js`; `ai.js` only narrates the result. That is why the numbers are identical on every run and every device.

**Second hard rule:** nothing is labelled OFFICIAL DATA. Adapters return `source:"demo"`, screens carry `DEMO DATA / AAPKI JAANKARI / ESTIMATE / VERIFY KAREIN` badges, and `SchemeAdapter.verifyEligibility()` deliberately returns nothing — only a bank can confirm eligibility.

---

## Connecting real data later

Each adapter in `js/adapters.js` is a single function body to replace:

| Adapter | Real source |
|---|---|
| `MarketAdapter` | Agmarknet / eNAM / state mandi board |
| `WeatherAdapter` | IMD / OpenWeather |
| `SchemeAdapter` | myScheme.gov.in, PMEGP, state portals |
| `LocationAdapter` | LGD village codes, Maps geocoding |
| `SpeechAdapter` | Bhashini ASR/TTS (browser speech used today) |
| `VisionAdapter` | image model for shop/farm/livestock context |
| `LLMAdapter` | hosted model for free-form explanation |

---

## Disclaimer

All projections are estimates based on the information and assumptions provided. Market conditions, costs, government schemes and loan decisions may vary. Verify official information before making financial decisions. Demo mode uses sample data.
