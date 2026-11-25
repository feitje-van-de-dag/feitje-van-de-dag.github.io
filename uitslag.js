// Uitslag-scherm: volledig scherm bij het einde van een quiz en bij grote gebeurtenissen (dagwinnaar, weekwinnaar).
// Een vraag goed of fout geeft hier geen melding; dat gebeurt op de quizpagina zelf.
function confetti(duur) {
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:400";
  document.body.appendChild(c);
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr);
  const kleuren = ["#ff4f9a", "#1fae8c", "#ffb35c", "#8fb8ff", "#ffe066", "#b5e27a"];
  const stukjes = [];
  for (let i = 0; i < 140; i++) {
    stukjes.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 5, r: Math.random() * 6 + 5, k: kleuren[i % kleuren.length], hoek: Math.random() * 6, draai: (Math.random() - 0.5) * 0.3 });
  }
  const start = performance.now();
  function tik(nu) {
    const t = nu - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    stukjes.forEach(function (s) {
      s.vy += 0.3; s.vx *= 0.99; s.x += s.vx; s.y += s.vy; s.hoek += s.draai;
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.hoek);
      ctx.globalAlpha = Math.max(0, 1 - t / duur); ctx.fillStyle = s.k;
      ctx.fillRect(-s.r / 2, -s.r / 4, s.r, s.r / 2); ctx.restore();
    });
    if (t < duur) requestAnimationFrame(tik); else c.remove();
  }
  requestAnimationFrame(tik);
}
// o: { kop, titel, scores: [{ naam, aantal }, { naam, aantal }], xp, confetti }
function toonUitslagScherm(o) {
  const over = document.createElement("div");
  over.className = "uitslag-overlay";
  const kaart = document.createElement("div");
  kaart.className = "uitslag-kaart";
  const kop = document.createElement("p");
  kop.className = "uitslag-kop";
  kop.textContent = o.kop || "";
  const titel = document.createElement("h2");
  titel.className = "uitslag-titel";
  titel.textContent = o.titel || "";
  kaart.append(kop, titel);
  if (o.scores && o.scores.length) {
    // Scorelijn: naam en getal per persoon; de hoogste score krijgt het accent.
    const hoogste = Math.max.apply(null, o.scores.map(function (s) { return s.aantal; }));
    const rij = document.createElement("div");
    rij.className = "uitslag-scores";
    o.scores.forEach(function (s) {
      const blok = document.createElement("div");
      blok.className = "uitslag-score" + (s.aantal === hoogste ? " hoogste" : "");
      const naam = document.createElement("span");
      naam.className = "uitslag-score-naam";
      naam.textContent = s.naam;
      const getal = document.createElement("span");
      getal.className = "uitslag-score-getal";
      getal.textContent = String(s.aantal);
      blok.append(naam, getal);
      rij.appendChild(blok);
    });
    kaart.appendChild(rij);
  }
  if (typeof o.xp === "number") {
    const xp = document.createElement("p");
    xp.className = "uitslag-xp";
    // XP telt op als in een game: van 0 naar de echte waarde.
    xp.textContent = "+0 XP";
    const doel = o.xp;
    const start = performance.now();
    const duur = 1400;
    (function tel(nu) {
      const t = Math.min(1, (nu - start) / duur);
      xp.textContent = "+" + Math.round(doel * (1 - Math.pow(1 - t, 3))).toLocaleString("nl-NL") + " XP";
      if (t < 1) requestAnimationFrame(tel);
    })(start);
    kaart.appendChild(xp);
  }
  const knop = document.createElement("button");
  knop.type = "button";
  knop.className = "tq-knop uitslag-knop";
  knop.textContent = "Verder";
  kaart.appendChild(knop);
  over.appendChild(kaart);
  document.body.appendChild(over);
  const sluit = function () { over.remove(); };
  knop.addEventListener("click", sluit);
  over.addEventListener("click", function (e) { if (e.target === over) sluit(); });
  if (o.confetti) confetti(3000);
}
