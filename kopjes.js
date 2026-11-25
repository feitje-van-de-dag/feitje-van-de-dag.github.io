/* Hoofdjes bij "Score van vandaag": per speler het hoofd van het poppetje, met het kostuum en alle items die die persoon draagt (zelfde tekening als in de kamer, via poppetje.js).
   Het hoofdje loopt niet, maar kijkt, knippert en toont emoties: wie voor staat is trots en blij, wie achter staat is jaloers of vastbesloten om in te halen.
   Gelijk of nog niemand bezig: vriendelijk en nieuwsgierig. Aanroepen: Kopjes.zet(koploper, bezig), koploper = "Ritchie", "Rachel" of null. */
(function () {
  "use strict";
  var NAMEN = ["Ritchie", "Rachel"];
  var KAMER = ["muur", "vloer", "raam", "lamp", "kleed"];
  var KLEDING = ["lijf", "onder", "borst"];   // alleen het hoofd: kleding blijft weg; kostuum, hoed, muts, bril, strik en kleuren blijven
  var CACHE = "kopjes-v1";
  var toestand = { items: [], draagt: { Ritchie: [], Rachel: [] } };
  var kopjes = {};          // naam -> { p, houder, stemming, doelKijk, ... }
  var stand = { leider: null, bezig: false };
  var scriptsKlaar = null;
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function laadScript(src) {
    return new Promise(function (ok) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ok; document.body.appendChild(s); });
  }
  function kostuumNodig() { return NAMEN.some(function (n) { return draagtItems(n).some(function (i) { return i.plek === "kostuum"; }); }); }
  function zorgVoorScripts() {
    if (scriptsKlaar) return scriptsKlaar;
    var rij = [];
    if (!window.Skins) rij.push(laadScript("skins.js?v=2"));
    scriptsKlaar = Promise.all(rij).then(function () {
      if (!kostuumNodig() || window.Kostuums) return null;
      return laadScript("kostuum-vec.js?v=8").then(function () { return laadScript("kostuums.js?v=56"); });
    }).then(function () { return window.Poppetje ? null : laadScript("poppetje.js?v=34"); });
    return scriptsKlaar;
  }
  function draagtItems(naam) {
    var ids = toestand.draagt[naam] || [];
    return ids.map(function (id) { return toestand.items.filter(function (i) { return i.id === id; })[0]; })
      .filter(function (i) { return i && KAMER.indexOf(i.plek) < 0 && KLEDING.indexOf(i.plek) < 0; });
  }

  // ---------- gegevens ----------
  function lees() { try { var c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c && c.items) toestand = c; } catch (e) { /* zonder opslag */ } }
  function bewaar() { try { localStorage.setItem(CACHE, JSON.stringify(toestand)); } catch (e) { /* te groot */ } }
  function haal() {
    return Promise.all([window.dbRpc("shop_lijst", {}), window.dbRpc("uitrusting_van", { p_wie: "Ritchie" }), window.dbRpc("uitrusting_van", { p_wie: "Rachel" })]).then(function (r) {
      var items = (r[0] || []).filter(function (i) { return i.plek && KAMER.indexOf(i.plek) < 0; });
      var nieuw = { items: items, draagt: { Ritchie: r[1] || [], Rachel: r[2] || [] } };
      var veranderd = JSON.stringify(nieuw.draagt) !== JSON.stringify(toestand.draagt) || nieuw.items.length !== toestand.items.length;
      toestand = nieuw; bewaar();
      return veranderd;
    });
  }

  // ---------- tekenen ----------
  function bouw(naam) {
    var houder = document.querySelector('.person[data-persoon="' + naam + '"] .kopje');
    if (!houder) {
      var kaart = document.querySelector('.person[data-persoon="' + naam + '"]');
      if (!kaart) return null;
      houder = document.createElement("div"); houder.className = "kopje"; houder.setAttribute("aria-hidden", "true");
      kaart.insertBefore(houder, kaart.firstChild);
    }
    var items = draagtItems(naam), kostuum = items.some(function (i) { return i.plek === "kostuum"; });
    var sig = JSON.stringify(items.map(function (i) { return i.id; }));
    var k = kopjes[naam];
    if (k && k.sig === sig) return k;
    houder.innerHTML = "";
    // Gloed (stralen of jaloerse nevel) achter het hoofd, en het hoofd zelf in een binnenvak met een ronde onderkant (alleen het hoofd, onder de kin afgesneden).
    var glans = document.createElement("div"); glans.className = "kop-glans";
    var binnen = document.createElement("div"); binnen.className = "kop-in" + (kostuum ? " kostuum" : "");
    houder.appendChild(glans); houder.appendChild(binnen);
    var breedte = kostuum ? 104 : 112;
    var p = new window.Poppetje(naam, binnen, breedte);
    p.el.style.left = Math.round(88 - breedte / 2) + "px"; p.el.style.top = (30 + (kostuum ? -2 : -4)) + "px"; p.el.style.bottom = "auto";
    p.el.setAttribute("tabindex", "-1");
    p.zetItems(items);
    k = { p: p, sig: sig, naam: naam, kijk: 0, kijkY: 0, doelX: 0, doelY: 0, knip: 2 + Math.random() * 3, stemming: "", tot: 0 };
    kopjes[naam] = k;
    return k;
  }

  // ---------- stemmingen ----------
  var KLASSEN = ["trots", "tevreden", "lacht", "jaloers", "vastbesloten", "verbaasd", "verlegen"];
  function zetKlas(k, klas) { KLASSEN.forEach(function (c) { k.p.el.classList.toggle(c, c === klas); }); }
  function naarAnder(naam) { return naam === "Ritchie" ? 1 : -1; }
  function kies(k, nu) {
    var n = k.naam, r = Math.random();
    var rol = !stand.bezig ? "rust" : stand.leider === n ? "leider" : stand.leider ? "achter" : "gelijk";
    if (k.p.el.parentNode && k.p.el.parentNode.parentNode) k.p.el.parentNode.parentNode.dataset.rol = rol;
    if (rol === "leider") {
      // blij en trots: afwisselend gelukkig dichte ogen, stralend naar jou kijken en een tevreden blik opzij naar de ander
      if (r < 0.4) { zetKlas(k, "tevreden"); k.doelX = 0; k.doelY = 0; k.duur = 2.4; }
      else if (r < 0.75) { zetKlas(k, "trots"); k.doelX = 0; k.doelY = -0.1; k.duur = 2.6; }
      else { zetKlas(k, "lacht"); k.doelX = naarAnder(n) * 0.5; k.doelY = 0; k.duur = 1.2; }
    } else if (rol === "achter") {
      // jaloers en vastbesloten: scheef naar de ander kijken met een frons, dan met vuur in de ogen naar jou
      if (r < 0.5) { zetKlas(k, "jaloers"); k.doelX = naarAnder(n) * 0.95; k.doelY = -0.15; k.duur = 2.6; }
      else if (r < 0.85) { zetKlas(k, "vastbesloten"); k.doelX = 0; k.doelY = 0.1; k.duur = 2.2; }
      else { zetKlas(k, "verbaasd"); k.doelX = naarAnder(n) * 0.8; k.doelY = -0.4; k.duur = 1.1; }
    } else if (rol === "gelijk") {
      if (r < 0.55) { zetKlas(k, ""); k.doelX = naarAnder(n) * 0.9; k.doelY = 0; k.duur = 2.2; }
      else if (r < 0.8) { zetKlas(k, "vastbesloten"); k.doelX = 0; k.doelY = 0; k.duur = 1.6; }
      else { zetKlas(k, "lacht"); k.doelX = 0; k.doelY = 0; k.duur = 1; }
    } else {
      zetKlas(k, "");
      var z = Math.random(); k.doelX = z < 0.4 ? 0 : (z < 0.7 ? -0.7 : 0.7); k.doelY = Math.random() < 0.2 ? -0.7 : 0; k.duur = 2 + Math.random() * 2;
    }
    k.tot = nu + k.duur;
  }
  // Bliksem onder het wolkje van de achterstaander: drie verschillende kantige vormen, willekeurige plek, soms twee tegelijk.
  var BLIKSEMS = [
    '<path d="M15 0L9 13L16 15L7 34"/>',
    '<path d="M14 0L8 12L17 14L9 30M17 14L24 23L19 24"/>',
    '<path d="M9 0L5 10L11 12L6 26M19 4L15 14L21 16L17 30"/>'
  ];
  function flits(k) {
    var glans = k.p.el.parentNode && k.p.el.parentNode.parentNode && k.p.el.parentNode.parentNode.querySelector(".kop-glans");
    if (!glans) return;
    function een(vertraging) {
      setTimeout(function () {
        var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        s.setAttribute("class", "kop-bliksem"); s.setAttribute("viewBox", "0 0 26 34");
        s.innerHTML = BLIKSEMS[Math.floor(Math.random() * BLIKSEMS.length)];
        var schaal = 0.8 + Math.random() * 0.45;
        s.style.left = (10 + Math.random() * 34).toFixed(0) + "px";
        s.style.transform = "rotate(" + (Math.random() * 30 - 15).toFixed(0) + "deg) scale(" + schaal.toFixed(2) + ") scaleX(" + (Math.random() < 0.5 ? 1 : -1) + ")";
        glans.appendChild(s);
        setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 520);
      }, vertraging);
    }
    een(0);
    if (Math.random() < 0.3) een(140);
  }
  var laatste = 0;
  function tik(ms) {
    var dt = Math.min(0.1, (ms - laatste) / 1000 || 0.03); laatste = ms;
    var nu = ms / 1000;
    NAMEN.forEach(function (n) {
      var k = kopjes[n]; if (!k) return;
      if (nu >= k.tot) kies(k, nu);
      if (k.p.el.parentNode && k.p.el.parentNode.parentNode && k.p.el.parentNode.parentNode.dataset.rol === "achter") { k.bliksem = (k.bliksem === undefined ? 1 : k.bliksem) - dt; if (k.bliksem <= 0) { k.bliksem = 2.4 + Math.random() * 2.8; flits(k); } }
      k.knip -= dt;
      if (k.knip <= 0) { k.knip = 2.5 + Math.random() * 3.5; k.p.el.classList.add("knip"); setTimeout(function () { k.p.el.classList.remove("knip"); }, 130); }
      k.kijk += (k.doelX - k.kijk) * Math.min(1, dt * 7);
      k.kijkY += (k.doelY - k.kijkY) * Math.min(1, dt * 7);
      k.p.el.style.setProperty("--kijk", k.kijk.toFixed(3));
      k.p.el.style.setProperty("--kijky", k.kijkY.toFixed(3));
    });
    if (!REDUCE || true) requestAnimationFrame(tik);
  }
  var loopt = false;
  function start() { if (loopt) return; loopt = true; requestAnimationFrame(tik); }

  function teken() {
    return zorgVoorScripts().then(function () {
      if (!window.Poppetje) return;
      NAMEN.forEach(bouw);
      start();
    });
  }

  window.Kopjes = {
    zet: function (leider, bezig) {
      var nieuw = stand.leider !== (leider || null) || stand.bezig !== !!bezig;
      stand.leider = leider || null; stand.bezig = !!bezig;
      if (nieuw) NAMEN.forEach(function (n) { if (kopjes[n]) kopjes[n].tot = 0; });
      if (!window.Kopjes.gestart) { window.Kopjes.gestart = true; lees(); teken().then(function () { haal().then(function (v) { if (v) { scriptsKlaar = null; teken(); } }).catch(function () { /* oude stand blijft */ }); }); }
    }
  };
})();
