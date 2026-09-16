/* ===========================================================
   UI UTILITIES — small helpers shared by all screens.
   =========================================================== */
export const $ = s => document.querySelector(s);
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

export function toast(msg, ms = 2200) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), ms);
}

export function sheet(html) {
  const s = $("#sheet"), b = $("#sheet-backdrop");
  s.innerHTML = `<div style="text-align:center;margin:-6px 0 10px"><span style="display:inline-block;width:44px;height:5px;border-radius:3px;background:#D9D0BE"></span></div>` + html;
  s.classList.add("open"); b.classList.add("open");
}
export function closeSheet() {
  $("#sheet").classList.remove("open"); $("#sheet-backdrop").classList.remove("open");
}

export const badge = (type) => {
  const m = { demo:["demo","DEMO DATA"], user:["user","AAPKI JAANKARI"], est:["est","ESTIMATE"],
              official:["", "OFFICIAL DATA"], verify:["verify","VERIFY KAREIN"] }[type];
  return m ? `<span class="badge ${m[0]}">${m[1]}</span>` : "";
};

export const pill = (level, text) => {
  const icon = { ok:"🟢", mid:"🟡", bad:"🔴", none:"🟢", high:"🔴", medium:"🟡", low:"🟢" }[level] || "⚪";
  const cls  = { ok:"ok", none:"ok", low:"ok", mid:"mid", medium:"mid", bad:"bad", high:"bad" }[level] || "mid";
  return `<span class="pill ${cls}">${icon} ${esc(text)}</span>`;
};

export const kv = (k, v, cls = "") => `<div class="kv ${cls}"><span>${k}</span><b class="num">${v}</b></div>`;

export const bar = (pctVal, tone = "") =>
  `<div class="bar"><i class="${tone}" style="width:${Math.max(2, Math.min(100, pctVal))}%"></i></div>`;

export const aibox = (text, title = "Saarthi kehta hai") =>
  `<div class="aibox"><b>🤝 ${title}</b><br>${esc(text)}</div>`;

/* ---------- tiny SVG sparkline (no chart library) ---------- */
export function sparkline(values, w = 300, h = 70) {
  const min = Math.min(...values), max = Math.max(...values), pad = 6;
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + i * ((w - pad * 2) / (values.length - 1));
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y];
  });
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = d + ` L${pts[pts.length-1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z`;
  const up = values[values.length - 1] >= values[0];
  const col = up ? "#3E7C4E" : "#B3452F";
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" role="img" aria-label="7 din ka rate trend">
    <path d="${area}" fill="${col}" opacity=".12"/>
    <path d="${d}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="4.5" fill="${col}"/>
  </svg>`;
}

/* ---------- horizontal comparison bars ---------- */
export function hbars(items) {
  const max = Math.max(...items.map(i => Math.abs(i.value)), 1);
  return items.map(i => {
    const tone = i.value < 0 ? "bad" : i.tone || "";
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:14px">
        <span>${esc(i.label)}</span><b class="num ${i.value < 0 ? "down" : ""}">${esc(i.display)}</b></div>
      ${bar((Math.abs(i.value) / max) * 100, tone)}
    </div>`;
  }).join("");
}

/* ---------- animated number counting ---------- */
export function animateNums(root = document) {
  root.querySelectorAll(".num").forEach(el => {
    el.style.transition = "none"; el.style.opacity = ".3";
    requestAnimationFrame(() => { el.style.transition = "opacity .35s"; el.style.opacity = "1"; });
  });
}

export const DISCLAIMER = `<div class="disclaim">
  <b>Zaroori soochna:</b> Yahan dikhaye gaye sab numbers aapki di hui jaankari aur demo assumptions par aadharit
  <b>estimate</b> hain — guarantee nahi. Market rate, lagat, sarkari yojana aur bank ka faisla alag ho sakta hai.
  Koi bhi paisa lagane se pehle official jaankari aur apne bank se confirm karein.
  Demo mode sample data use karta hai.
</div>`;
