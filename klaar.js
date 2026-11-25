// Gedeeld door de beginpagina en het logboek.
// Een dag is klaar als Ritchie én Rachel alle vragen van die dag hebben beantwoord (alle quizzen van die dag).

// vraagIds: alle vraag-id's uit de database. pogingen: de attempts-documenten.
function klaarDagen(vraagIds, pogingen) {
  const totaal = {};
  vraagIds.forEach(function (id) {
    const m = /^(\d{4}-\d{2}-\d{2})-\d+$/.exec(id) || /^(\d{4}-\d{2}-\d{2})-q\d+-\d+$/.exec(id);
    if (m) totaal[m[1]] = (totaal[m[1]] || 0) + 1;
  });
  const gedaan = {};
  pogingen.forEach(function (p) {
    if (!p || (p.wie !== "Ritchie" && p.wie !== "Rachel")) return;
    const m = /^(\d{4}-\d{2}-\d{2})-/.exec(p.vraag_id || "");
    if (!m) return;
    const sleutel = m[1] + "|" + p.wie;
    gedaan[sleutel] = (gedaan[sleutel] || 0) + 1;
  });
  const klaar = new Set();
  Object.keys(totaal).forEach(function (dag) {
    if (["Ritchie", "Rachel"].every(function (n) { return (gedaan[dag + "|" + n] || 0) >= totaal[dag]; })) klaar.add(dag);
  });
  return klaar;
}

// Milliseconden tot de volgende quiz: de volgende dag om QUIZ_UUR Nederlandse tijd (supabase-shim.js; nu 00:00, dus tot middernacht).
// Dezelfde moment als dagIsOpen in supabase-shim.js: de servertijd, niet de klok van het apparaat.
function tijdTotVolgendeQuiz() {
  const nu = window.serverNu ? window.serverNu() : Date.now();
  const delen = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(nu));
  const v = function (soort) { return Number(delen.find(function (p) { return p.type === soort; }).value); };
  // De Amsterdamse klok als UTC gelezen, minus de echte tijd, geeft het verschil (offset) met UTC.
  const alsUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  const offset = alsUtc - Math.floor(nu / 1000) * 1000;
  const uur = window.QUIZ_UUR || 0;
  const doel = Date.UTC(v("year"), v("month") - 1, v("day") + (v("hour") >= uur ? 1 : 0), uur);
  return Math.max(0, doel - offset - nu);
}

// Aftelling als uren:minuten:seconden, bijvoorbeeld 03:14:09.
function formatAftel(ms) {
  const totaal = Math.floor(ms / 1000);
  const pad = function (n) { return String(n).padStart(2, "0"); };
  return pad(Math.floor(totaal / 3600)) + ":" + pad(Math.floor((totaal % 3600) / 60)) + ":" + pad(totaal % 60);
}
