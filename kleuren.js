// Persoonskleuren: elke persoon heeft één kleur die overal terugkomt (balken, avatars, scores, berichten).
// Ritchie is groen en Rachel roze. Andere personen krijgen een vaste kleur uit dezelfde pool van 12.
// kern = de volle kleur, zacht = de lichte achtergrond, tekst = leesbare tekst op zacht.
const KLEUR_POOL = [
  { kern: "#1fae8c", zacht: "#d6f7ee", tekst: "#17694d" }, // 0 groen (Ritchie)
  { kern: "#ff4f9a", zacht: "#ffe0ef", tekst: "#9c2650" }, // 1 roze (Rachel)
  { kern: "#ffb35c", zacht: "#fff0dc", tekst: "#8a4b00" },
  { kern: "#8fb8ff", zacht: "#e3edff", tekst: "#1d4ed8" },
  { kern: "#c9b3ff", zacht: "#f0eaff", tekst: "#5b21b6" },
  { kern: "#ffe066", zacht: "#fff8cc", tekst: "#7a5a00" },
  { kern: "#b5e27a", zacht: "#eef9d9", tekst: "#3f6212" },
  { kern: "#e5484d", zacht: "#fde3e4", tekst: "#9f1d20" },
  { kern: "#0ea5a4", zacht: "#d3f3f2", tekst: "#0f5f5e" },
  { kern: "#3b5bdb", zacht: "#dfe6ff", tekst: "#1e3a8a" },
  { kern: "#a16207", zacht: "#f5ead6", tekst: "#5c3a05" },
  { kern: "#6b7280", zacht: "#e5e7eb", tekst: "#374151" }
];
const VASTE_KLEUR = { Ritchie: 0, Rachel: 1 };
function persoonKleur(naam) {
  if (VASTE_KLEUR[naam] !== undefined) return KLEUR_POOL[VASTE_KLEUR[naam]];
  // Vaste kleur per naam: dezelfde naam krijgt altijd dezelfde kleur (uit de overige 10).
  let h = 0;
  for (const c of String(naam)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return KLEUR_POOL[2 + (h % (KLEUR_POOL.length - 2))];
}
// Zet de kleur als CSS-variabelen op een element; de CSS gebruikt var(--p-kern), var(--p-zacht) en var(--p-tekst).
function zetPersoonKleur(el, naam) {
  const k = persoonKleur(naam);
  el.style.setProperty("--p-kern", k.kern);
  el.style.setProperty("--p-zacht", k.zacht);
  el.style.setProperty("--p-tekst", k.tekst);
}
// Vaste markup met data-persoon="Naam" krijgt de kleur van die persoon.
function kleurDataPersonen() {
  document.querySelectorAll("[data-persoon]").forEach(function (el) { zetPersoonKleur(el, el.dataset.persoon); });
}
kleurDataPersonen();
// Kroontje bij de koploper. blok = het kaartje van die persoon; aanwezig = true als die persoon voorstaat (bij gelijke stand geen kroon).
function zetKroon(blok, aanwezig) {
  if (!blok) return;
  blok.querySelectorAll(".kroon").forEach(function (k) { k.remove(); });
  if (!aanwezig) return;
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "kroon");
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", "Koploper");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z");
  s.appendChild(p);
  blok.prepend(s);
}

// Kroontje bij de weekkoploper: op elke avatar van die persoon, op elke pagina.
// punten.html bewaart de weekkoploper in het profiel (weekkoploper.week = weekVan(...), kroon = true).
// Een week loopt van maandag 00:00 tot en met zondag 23:59 (Amsterdamse tijd). Geeft de maandag waarop de week begint.
function weekVan(iso) {
  const delen = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(iso));
  const deel = function (soort) { return delen.find(function (p) { return p.type === soort; }).value; };
  const d = new Date(deel("year") + "-" + deel("month") + "-" + deel("day") + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
function kroonSvg() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "kroon");
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", "Koploper van de week");
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", "M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z");
  s.appendChild(p);
  return s;
}
// Zet de kroon op een avatar: de avatar krijgt een klein omhulsel, zodat de kroon niet wordt afgeknipt.
function zetKroonOpAvatar(el, aanwezig) {
  let omhulsel = el.parentElement && el.parentElement.classList.contains("koploper-wrap") ? el.parentElement : null;
  if (!omhulsel) {
    omhulsel = document.createElement("span");
    omhulsel.className = "koploper-wrap";
    el.parentNode.insertBefore(omhulsel, el);
    omhulsel.appendChild(el);
  }
  omhulsel.querySelectorAll(".kroon").forEach(function (k) { k.remove(); });
  if (aanwezig) omhulsel.appendChild(kroonSvg());
}
async function zetWeekKroon() {
  try {
    const db = await window.claude.use("db");
    const r = await db.collection("profielen").get();
    const ma = weekVan(new Date().toISOString());
    let leider = null;
    r.docs.filter(function (d) { return d.exists; }).forEach(function (d) {
      const k = d.data().weekkoploper;
      if (k && k.week === ma && k.kroon) leider = d.id;
    });
    document.querySelectorAll("[data-avatar]").forEach(function (el) { zetKroonOpAvatar(el, el.dataset.avatar === leider); });
  } catch (e) { /* zonder database geen kroon */ }
}
if (window.claude) setTimeout(zetWeekKroon, 1500);
