// Gedeelde uitslagberekening: punten (week) en logboek (alle quizzen) gebruiken dezelfde regels.
const NAMEN = ["Ritchie", "Rachel"];

const MND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function amsterdamDatum(iso) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  } catch (e) { return ""; }
}

// Moment van een antwoord in ms. Oude antwoorden zonder tijdstip tellen op 12:00 van hun quizdag.
function tijdVan(x, dag) {
  return Date.parse(x.gezet_op || "") || (dag ? Date.parse(dag + "T12:00:00Z") : 0);
}

function datumPlus(iso, dagen) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dagen);
  return d.toISOString().slice(0, 10);
}

function datumKort(dag) {
  const d = new Date(dag + "T12:00:00Z");
  return d.getUTCDate() + " " + MND[d.getUTCMonth()];
}

function quizNaam(dag, sleutel, dagNamen) {
  const naam = dagNamen[dag] || "Dagquiz";
  return sleutel === "main" ? naam + " · Dagquiz " + datumKort(dag) : naam + " · Quiz " + sleutel.slice(1) + " · " + datumKort(dag);
}

function beslisRij(links, rechts, label, punten) {
  return { label: label, punten: punten, winnaar: links.g === rechts.g ? "Gelijk" : (links.g > rechts.g ? "Ritchie" : "Rachel") };
}

// Puntenregel voor dagquizzen vanaf deze datum (2026-11-02): een quiz geeft pas een weekpunt als hij is afgerond.
// De uitslag van de quiz gebruikt alle antwoorden zodra beide spelers hem hebben afgemaakt, ook als iemand een dag later antwoordt.
// De beginscore op index.html is strenger: die telt alleen antwoorden die op de quizdag zelf zijn gegeven.
const NIEUWE_PUNTENREGEL_VANAF = "2026-11-02";

// Wie wint een rij? Bij een ongelijk aantal beantwoorde vragen (alleen bij een gedeeltelijke quiz) telt het aandeel goed, anders het aantal goed.
function rijWinnaar(r) {
  let a = r.r, b = r.c;
  if (r.rn && r.cn && r.rn !== r.cn) { a = r.r / r.rn; b = r.c / r.cn; }
  return a > b ? "Ritchie" : (b > a ? "Rachel" : "Gelijk");
}

// Elke afgeronde quiz geeft precies één punt: de winnaar krijgt het punt, bij gelijkspel krijgen beiden één punt.
function puntenVanRij(r) {
  const punten = { Ritchie: 0, Rachel: 0 };
  const w = rijWinnaar(r);
  if (w === "Ritchie") punten.Ritchie = 1;
  else if (w === "Rachel") punten.Rachel = 1;
  else { punten.Ritchie = 1; punten.Rachel = 1; }
  return punten;
}

// Alle quizzen met de week waarin ze zijn afgemaakt (maandag tot en met zondag) (rij.week). Punten van één week filtert de aanroeper op rij.week.
// Diamanten: 50 per gewonnen quiz, 150 per gewonnen week.
const MUNTEN_PER_QUIZ = 50;
const MUNTEN_PER_WEEK = 150;

async function berekenStand(db) {
  // Themaquiz-namen per dag: een dagquiz van die dag krijgt dezelfde naam.
  const themaNamen = {};
  (await db.collection("themaquizzen").get()).docs.filter((d) => d.exists).forEach((d) => {
    const q = d.data();
    const dg = amsterdamDatum(q.aangemaakt || "");
    if (dg && q.naam && !themaNamen[dg]) themaNamen[dg] = q.naam;
  });
  // Dagnamen over de hele geschiedenis, zodat elke dag een eigen naam heeft: de themaquiz-naam van die dag, anders de eerstvolgende nog niet gebruikte naam uit de pool.
  const dagNamen = {};
  const questionIds = await db.collection("questions").ids();
  const dagen = [...new Set(questionIds.map((id) => (/^(\d{4}-\d{2}-\d{2})-/.exec(id) || [])[1]).filter(Boolean))].sort();
  const gebruikt = new Set(Object.values(themaNamen));
  const pool = [].concat(...Object.values(NAAM_POOL)).filter((n, i, a) => a.indexOf(n) === i);
  let teller = 1;
  dagen.forEach((dag) => {
    if (themaNamen[dag]) { dagNamen[dag] = themaNamen[dag]; return; }
    const vrij = pool.find((n) => !gebruikt.has(n));
    dagNamen[dag] = vrij || pool[0] + " " + (++teller);
    gebruikt.add(dagNamen[dag]);
  });
  const regex = /^(\d{4}-\d{2}-\d{2})-(q(\d+)-)?(\d+)$/;
  const goedVragen = { Ritchie: 0, Rachel: 0 };
  // Dagquizzen: aantal vragen per quiz (main = 8, extra quizzen = q2, q3, ...)
  const ids = await db.collection("questions").ids();
  const totaal = {};
  ids.forEach(function (id) {
    const m = regex.exec(id);
    if (!m) return;
    const k = m[1] + "|" + (m[3] ? "q" + m[3] : "main");
    totaal[k] = (totaal[k] || 0) + 1;
  });
  const at = await db.collection("attempts").get();
  const pogingen = at.docs.filter(function (d) { return d.exists; }).map(function (d) { return d.data(); });
  const stand = {};
  at.docs.forEach(function (d) {
    const pog = d.data();
    if (!pog || NAMEN.indexOf(pog.wie) < 0) return;
    const m = regex.exec(pog.vraag_id || "");
    if (!m) return;
    const k = m[1] + "|" + (m[3] ? "q" + m[3] : "main");
    stand[k] = stand[k] || { Ritchie: { g: 0, n: 0 }, Rachel: { g: 0, n: 0 }, t: 0 };
    stand[k].t = Math.max(stand[k].t, tijdVan(pog, m[1]));
    stand[k][pog.wie].n += 1;
    if (pog.goed === true) { stand[k][pog.wie].g += 1; goedVragen[pog.wie] += 1; }
  });
  const rijen = [];
  const gespeeld = { Ritchie: 0, Rachel: 0 };
  const gewonnen = { Ritchie: 0, Rachel: 0 };
  Object.keys(totaal).forEach(function (k) {
    const s = stand[k];
    if (!s) return;
    NAMEN.forEach(function (n) { if (s[n].n >= totaal[k]) gespeeld[n] += 1; });
    const parts = k.split("|");
    if (parts[0] >= NIEUWE_PUNTENREGEL_VANAF) {
      if (s.Ritchie.n < totaal[k] || s.Rachel.n < totaal[k]) return;
      rijen.push({ dag: parts[0], soort: "dag", sleutel: k, label: quizNaam(parts[0], parts[1], dagNamen), r: s.Ritchie.g, c: s.Rachel.g, rn: s.Ritchie.n, cn: s.Rachel.n, n: totaal[k], week: weekVan(new Date(s.t).toISOString()) });
      return;
    }
    if (s.Ritchie.n < totaal[k] || s.Rachel.n < totaal[k]) return;
    rijen.push({ dag: parts[0], soort: "dag", sleutel: k, label: quizNaam(parts[0], parts[1], dagNamen), r: s.Ritchie.g, c: s.Rachel.g, n: totaal[k], week: weekVan(new Date(s.t).toISOString()) });
  });
  // Themaquizzen
  const qs = await db.collection("themaquizzen").get();
  const ta = await db.collection("themaantwoorden").get();
  qs.docs.filter(function (d) { return d.exists; }).forEach(function (d) {
    const q = d.data();
    const dag = amsterdamDatum(q.aangemaakt || "");
    if (!dag || !q.aantal) return;
    const telling = { Ritchie: { g: 0, n: 0 }, Rachel: { g: 0, n: 0 }, t: 0 };
    ta.docs.forEach(function (a) {
      const x = a.data();
      if (!x || x.quiz !== d.id || !telling[x.wie]) return;
      telling[x.wie].n += 1;
      telling.t = Math.max(telling.t, tijdVan(x, dag));
      if (x.goed === true) telling[x.wie].g += 1;
    });
    NAMEN.forEach(function (n) { if (telling[n].n >= q.aantal) gespeeld[n] += 1; goedVragen[n] += telling[n].g; });
    if (telling.Ritchie.n < q.aantal || telling.Rachel.n < q.aantal) return;
    rijen.push({ dag: dag, soort: "thema", sleutel: "thema|" + d.id, label: (q.naam || dagNamen[dag] || "Themaquiz") + " · Themaquiz " + datumKort(dag), r: telling.Ritchie.g, c: telling.Rachel.g, n: q.aantal, week: weekVan(new Date(telling.t).toISOString()) });
  });
  // Random quizzen samen (Ritchie tegen Rachel) tellen mee in de weekstand. Alleen spelen (tegen jezelf) niet.
  const oefQuizzen = await db.collection("oefquizzen").get();
  const oefKeuzes = await db.collection("keuzes").where("kind", "==", "oef").get();
  const goedPer = {};
  const beantPer = {};
  const tijdOef = {};
  oefKeuzes.docs.filter((d) => d.exists).forEach((d) => {
    const x = d.data();
    if (!x || !x.oefquiz || !x.wie) return;
    const sl = x.oefquiz + "|" + x.wie;
    (beantPer[sl] = beantPer[sl] || new Set()).add(x.vraag_id);
    if (x.goed === true) (goedPer[sl] = goedPer[sl] || new Set()).add(x.vraag_id);
    tijdOef[x.oefquiz] = Math.max(tijdOef[x.oefquiz] || 0, tijdVan(x));
  });
  oefQuizzen.docs.filter((d) => d.exists).forEach((d) => {
    const q = d.data();
    if (!q || q.modus !== "samen" || q.verwijderd) return;
    const dag = amsterdamDatum(q.aangemaakt || "");
    if (!dag || !q.aantal) return;
    const klaar = ["Ritchie", "Rachel"].every((n) => beantPer[d.id + "|" + n] && beantPer[d.id + "|" + n].size >= q.aantal);
    if (!klaar) return;
    const r = goedPer[d.id + "|Ritchie"] ? goedPer[d.id + "|Ritchie"].size : 0;
    const c = goedPer[d.id + "|Rachel"] ? goedPer[d.id + "|Rachel"].size : 0;
    rijen.push({ dag: dag, soort: "oef", sleutel: "oef|" + d.id, label: (q.naam || "Random quiz") + " · Random quiz " + datumKort(dag), r: r, c: c, n: q.aantal, week: weekVan(new Date(tijdOef[d.id]).toISOString()) });
    NAMEN.forEach(function (n) { gespeeld[n] += 1; });
    goedVragen.Ritchie += r;
    goedVragen.Rachel += c;
  });
  // Gewonnen quizzen (over alle weken): elke afgeronde quiz die één speler wint, gelijk telt niet. Random quizzen samen tellen mee; quizzen tegen jezelf niet.
  rijen.forEach(function (r) {
    const w = rijWinnaar(r);
    if (w === "Ritchie") gewonnen.Ritchie += 1;
    else if (w === "Rachel") gewonnen.Rachel += 1;
  });
  // XP (zie Systeemkaart): 25 per goed antwoord, 50 per afgemaakte quiz,
  // dagwinnaar 150 (gelijk 75 elk), themaquiz-winnaar 500 (gelijk 250 elk),
  // weekwinnaar 1500 (meeste punten in die week, zelfde regel als de puntenpagina; gelijk geen bonus; alleen afgesloten weken).
  const xp = { Ritchie: goedVragen.Ritchie * 25 + gespeeld.Ritchie * 50, Rachel: goedVragen.Rachel * 25 + gespeeld.Rachel * 50 };
  rijen.forEach(function (r) {
    const winst = r.soort === "dag" ? 150 : 500;
    const gelijk = r.soort === "dag" ? 75 : 250;
    const w = rijWinnaar(r);
    if (w === "Ritchie") xp.Ritchie += winst;
    else if (w === "Rachel") xp.Rachel += winst;
    else { xp.Ritchie += gelijk; xp.Rachel += gelijk; }
  });
  const nuWeek = weekVan(new Date().toISOString());
  const weken = new Set(rijen.map((r) => r.week));
  pogingen.forEach((p) => { if (NAMEN.includes(p.wie) && /^\d{4}-\d{2}-\d{2}-/.test(p.vraag_id || "")) weken.add(weekVan(new Date(tijdVan(p, p.vraag_id.slice(0, 10))).toISOString())); });
  const wekenGewonnen = { Ritchie: 0, Rachel: 0 };
  weken.forEach(function (wk) {
    if (wk >= nuWeek) return;
    const w = puntenVanWeek(wk, rijen, pogingen);
    if (w.Ritchie > w.Rachel) { xp.Ritchie += 1500; wekenGewonnen.Ritchie += 1; }
    else if (w.Rachel > w.Ritchie) { xp.Rachel += 1500; wekenGewonnen.Rachel += 1; }
  });
  // XP uit het weekrad (docs coll 'rad', uitkomst type xp).
  try {
    (await db.collection("rad").get()).docs.filter((d) => d.exists).forEach((d) => {
      const r = d.data();
      const u = r && r.uitkomst;
      if (u && u.type === "xp" && xp[r.winnaar] != null) xp[r.winnaar] += u.waarde || 0;
    });
  } catch (e) { /* zonder rad blijft de XP zoals hij was */ }
  return { rijen: rijen, gespeeld: gespeeld, gewonnen: gewonnen, xp: xp, wekenGewonnen: wekenGewonnen };
}

// Punten van één week (maandag 00:00 tot zondag 23:59). Een quiz telt mee in de week waarin hij is afgemaakt.
// Het punt van de dag: wie op die dag het hoogste aandeel goed heeft; die dag telt mee in de week van het laatste antwoord van die dag.
function puntenVanWeek(week, rijen, pogingen) {
  const punten = { Ritchie: 0, Rachel: 0 };
  const dagen = {};
  pogingen.forEach(function (p) {
    if (!NAMEN.includes(p.wie) || !/^\d{4}-\d{2}-\d{2}-(q\d+-)?\d+$/.test(p.vraag_id || "")) return;
    const dag = p.vraag_id.slice(0, 10);
    const s = dagen[dag] = dagen[dag] || { Ritchie: { g: 0, n: 0 }, Rachel: { g: 0, n: 0 }, t: 0 };
    s.t = Math.max(s.t, tijdVan(p, dag));
    s[p.wie].n += 1;
    if (p.goed === true) s[p.wie].g += 1;
  });
  Object.keys(dagen).forEach(function (dag) {
    const s = dagen[dag];
    if (dag >= NIEUWE_PUNTENREGEL_VANAF) return; // vanaf 2026-11-02 geen punt van de dag meer: alleen afgeronde quizzen geven punten
    if (weekVan(new Date(s.t).toISOString()) !== week) return;
    if (!s.Ritchie.n || !s.Rachel.n) return;
    const r = s.Ritchie.g / s.Ritchie.n, c = s.Rachel.g / s.Rachel.n;
    if (r > c) punten.Ritchie += 1;
    else if (c > r) punten.Rachel += 1;
  });
  rijen.forEach(function (r) {
    if (r.week !== week) return;
    const p = puntenVanRij(r);
    punten.Ritchie += p.Ritchie;
    punten.Rachel += p.Rachel;
  });
  return punten;
}
