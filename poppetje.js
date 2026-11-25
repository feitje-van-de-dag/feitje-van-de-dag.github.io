/* Levend poppetje: lopen (waggelen), hoofd naar links of rechts kijken, knipperen.
   Het poppetje bestaat uit twee lagen die vast aan elkaar zitten:
   - lichaam (lijf, voeten, vleugeltjes, buik) met de kleren van lijf, onder en borst;
   - kop (kuif of strik, ogen, wangetjes, snavel) met de items van gezicht, strik en hoofd.
   Bij het kijken schuift de kop-laag samen met de bijbehorende items, zodat een bril of hoed nooit van het gezicht af loopt.
   Alle lagen delen dezelfde 200x220-ruimte als de item-plaatjes; er wordt niets opnieuw getekend of verschoven op de pixel. */
(function () {
  "use strict";
  var BOUW = 7; // Ophogen als de plaatjes veranderen, zodat een toestel nooit een oud plaatje blijft tonen.
  var klemTeller = 0;
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Een mannetje en een vrouwtje kunnen verliefd zijn op elkaar (hartjes); twee gelijke niet.
  var GESLACHT = { Ritchie: "m", Rachel: "v" };
  var LICHAAM_PLEKKEN = ["lijf", "onder", "borst"];
  var KOP_PLEKKEN = ["gezicht", "strik", "hoofd"];
  var VOLGORDE = ["lijf", "onder", "borst", "gezicht", "strik", "hoofd"];
  // Hoeveel (in tekening-eenheden) een onderdeel meeschuift bij kijk = 1.
  var SCHUIF = { oog: 6, wang: 4, snavel: 9, kuif: 2, gezicht: 6, strik: 2, hoofd: 2.5 };

  var KLEUR = {
    Ritchie: { lijf: "#8fb8ff", vin: "#6c9ce6", buik: "#e6f0ff" },
    Rachel: { lijf: "#c9b3ff", vin: "#b39bf0", buik: "#e8dfff" }
  };
  var LICHAAM_PAD = "M100 26 C146 26 170 60 170 116 C170 172 140 198 100 198 C60 198 30 172 30 116 C30 60 54 26 100 26Z";

  function lichaamSvg(naam) {
    var k = KLEUR[naam];
    // De kuif van Ritchie zit achter het hoofd en loopt er een stuk in door: hij groeit uit het hoofd, dus hij kan er nooit los van komen als hij meekijkt (omhoog, opzij).
    var kuifAchter = naam === "Ritchie" ? '<path class="kuif s-haar" d="M78 50 L84 32 Q86 12 98 18 Q96 8 108 12 Q110 22 118 28 L124 50Z" fill="#ff4f9a"/>' : "";
    return '<svg class="pg-lichaam" viewBox="0 0 200 220" aria-hidden="true">' + kuifAchter +
      '<ellipse class="voet voet-l s-voet" cx="82" cy="196" rx="13" ry="8" fill="#ffb35c"/><ellipse class="voet voet-r s-voet" cx="118" cy="196" rx="13" ry="8" fill="#ffb35c"/>' +
      '<path class="s-vin" d="M34 118 Q18 138 28 164 Q44 160 50 138Z" fill="' + k.vin + '"/><path class="vin-r s-vin" d="M166 118 Q182 138 172 164 Q156 160 150 138Z" fill="' + k.vin + '"/>' +
      '<path class="s-lijf" d="' + LICHAAM_PAD + '" fill="' + k.lijf + '"/>' +
      '<ellipse class="s-buik" cx="100" cy="156" rx="40" ry="34" fill="' + k.buik + '"/></svg>';
  }
  function kopSvg(naam) {
    var kuif = naam === "Ritchie"
      ? ''
      : '<g class="kuif"><path class="s-haar" d="M100 40 Q84 18 72 26 Q62 36 74 52 Q86 56 100 40Z" fill="#ff4f9a"/><path class="s-haar" d="M100 40 Q116 18 128 26 Q138 36 126 52 Q114 56 100 40Z" fill="#ff4f9a"/><circle class="s-haarl" cx="100" cy="40" r="6" fill="#ff9fc0"/></g>';
    var wimpers = naam === "Rachel" ? '<path class="wimpers" d="M68 96 L64 90 M74 92 L71 86 M132 96 L136 90 M126 92 L129 86" stroke="#2b2333" stroke-width="2.5" stroke-linecap="round"/>' : "";
    return '<svg class="pg-kop" viewBox="0 0 200 220" aria-hidden="true">' + kuif +
      '<g class="wang"><ellipse class="s-wang" cx="56" cy="130" rx="10" ry="6" fill="#ff9fc0"/><ellipse class="s-wang" cx="144" cy="130" rx="10" ry="6" fill="#ff9fc0"/></g>' +
      '<g class="brauw"><path d="M64 86L92 97M136 86L108 97" stroke="#2b2333" stroke-width="5.5" stroke-linecap="round" fill="none"/></g>' +
      '<g class="oog"><ellipse cx="78" cy="106" rx="10" ry="13" fill="#2b2333"/><ellipse cx="122" cy="106" rx="10" ry="13" fill="#2b2333"/><circle cx="81" cy="101" r="3.5" fill="#fff"/><circle cx="125" cy="101" r="3.5" fill="#fff"/>' + wimpers + '</g>' +
      '<path class="snavel s-snavel" d="M94 122 Q100 128 106 122 Q100 134 94 122Z" fill="#ff9f3f"/></svg>';
  }

  function Poppetje(naam, kamer, breedte) {
    this.naam = naam;
    this.breedte = breedte || 128;
    this.x = 0; this.doel = 0; this.dir = 0; this.lopen = false;
    this.moe = 0;            // seconden wakker sinds het laatste slaapje: pas moe als dat lang is
    this.gebruikt = {};      // wanneer elke activiteit het laatst is gedaan (geen steeds hetzelfde)
    this.vertrekt = false; this.komtBinnen = false;
    this.bezig = null; // bezig met iets leuks (slapen, zwaaien, dansen, hupje) in plaats van lopen
    this.diep = 0.5; // 0 = achterste baan, 0.5 = gewone baan, 1 = voorste baan (loopt voorlangs)
    this.wacht = 1 + Math.random() * 2;
    this.kijk = 0; this.kijkDoel = 0; this.kijkWacht = 2 + Math.random() * 2;
    this.knip = 2 + Math.random() * 3;
    this.sig = null;
    var knop = document.createElement("button");
    knop.type = "button";
    knop.className = "vogel kam-vogel pg";
    knop.setAttribute("aria-label", naam + ". Tik om te springen.");
    knop.style.width = this.breedte + "px";
    knop.style.height = Math.round(this.breedte * 1.1) + "px";
    knop.style.setProperty("--eenheid", (this.breedte / 200) + "px");
    knop.innerHTML = '<span class="pg-schaduw"><svg viewBox="0 0 200 220" aria-hidden="true"><ellipse cx="100" cy="206" rx="46" ry="6" fill="#2b2333" opacity=".12"/></svg></span>' +
      '<span class="pg-zwaai">' + lichaamSvg(naam) + kopSvg(naam) + '<span class="pg-laag pg-l-lichaam"></span><span class="pg-laag pg-l-kop"></span><span class="pg-laag pg-l-kostuum"></span>' +
      '<span class="pg-vin"><svg viewBox="0 0 200 220" aria-hidden="true"><path class="s-vin" d="M166 118 Q182 138 172 164 Q156 160 150 138Z" fill="' + KLEUR[naam].vin + '"/></svg></span></span><span class="pg-fx" aria-hidden="true"></span><span class="pg-bel" aria-hidden="true"><i></i><i></i><i></i></span>';
    this.el = knop;
    this.fx = knop.querySelector(".pg-fx");
    this.lLichaam = knop.querySelector(".pg-l-lichaam");
    this.lKop = knop.querySelector(".pg-l-kop");
    this.lKostuum = knop.querySelector(".pg-l-kostuum");
    var zelf = this;
    knop.addEventListener("click", function () {
      if (window.Kamer && window.Kamer.lijst.indexOf(zelf) >= 0 && !REDUCE) { window.Kamer.aanraken(zelf); return; }
      knop.classList.remove("hup"); void knop.offsetWidth; knop.classList.add("hup");
    });
    knop.addEventListener("animationend", function (e) { if (e.animationName === "vogel-hup") knop.classList.remove("hup"); });
    kamer.appendChild(knop);
  }

  // Items: [{ icoon, plek }]. Alleen opnieuw opbouwen als er iets verandert, zodat het poppetje niet springt of knippert.
  Poppetje.prototype.zetItems = function (items) {
    this.lijfKleding = items.some(function (i) { return i.plek === "lijf"; }); // mouwen: dan zwaait het hele poppetje in plaats van een vinnetje
    // Een skin (kleur) heeft geen laag: die verandert de kleuren van het lichaam zelf.
    this.zetSkin(items.filter(function (i) { return window.Skins && Skins.isSkin(i); }));
    items = items.filter(function (i) { return !(window.Skins && Skins.isSkin(i)); });
    // Een kostuum (beer, konijn, hert) vervangt het hele poppetje: het pinguïn-lijf en -hoofd gaan weg.
    var kostuum = window.Kostuums ? items.filter(function (i) { return Kostuums.isKostuum(i); })[0] : null;
    var kSig = kostuum ? kostuum.id : "";
    if (kSig !== (this.kostuumSig || "")) {
      this.kostuumSig = kSig;
      this.lKostuum.innerHTML = kostuum ? Kostuums.svg(kostuum.id, this.naam) : "";
      this.el.classList.toggle("kostuum", !!kostuum);
    }
    items = items.filter(function (i) { return i.plek !== "kostuum"; });
    var gesorteerd = items.slice().sort(function (a, b) { return VOLGORDE.indexOf(a.plek) - VOLGORDE.indexOf(b.plek); });
    this.el.classList.toggle("flappen", items.some(function (i) { return i.plek === "hoofd" && /oorflap|bontmuts/.test(i.icoon); })); // muts met flappen langs het gezicht: de ogen mogen er niet onder schuiven
    this.el.classList.toggle("heeft-strik", items.some(function (i) { return i.plek === "strik"; }));
    var sig = gesorteerd.map(function (i) { return i.icoon; }).join("|");
    if (sig === this.sig) return;
    this.sig = sig;
    var l = "", k = "";
    gesorteerd.forEach(function (i) {
      var img = '<img class="laag-' + i.plek + '" src="icons/winkel/' + i.icoon + '?v=' + BOUW + '" alt="" draggable="false">';
      // Bril: tekening in een eigen svg, geknipt op de vaste lijf-omtrek (knippen binnen svg werkt in elke browser, ook Safari).
      if (i.plek === "gezicht") {
        var cid = "pgk" + (++klemTeller);
        img = '<svg class="pg-klem" viewBox="0 0 200 220" aria-hidden="true"><defs><clipPath id="' + cid + '"><path d="' + LICHAAM_PAD + '"/></clipPath></defs>' +
          '<g clip-path="url(#' + cid + ')"><image class="laag-gezicht" href="icons/winkel/' + i.icoon.replace(".png", "-lang.png") + '?v=' + BOUW + '" x="0" y="0" width="200" height="220"/></g></svg>';
      }
      if (LICHAAM_PLEKKEN.indexOf(i.plek) >= 0) l += img; else if (KOP_PLEKKEN.indexOf(i.plek) >= 0) k += img;
    });
    this.lLichaam.innerHTML = l;
    this.lKop.innerHTML = k;
  };

  // Kleuren van het lichaam (lijf, vleugels, buikje, voetjes) volgens de skin; zonder skin de standaardkleuren.
  Poppetje.prototype.zetSkin = function (skinItems) {
    var c = window.Skins ? Skins.delen(this.naam, skinItems) : KLEUR[this.naam];
    var sig = JSON.stringify(c);
    if (sig === this.skinSig) return;
    this.skinSig = sig;
    var v = { "s-lijf": c.lijf, "s-vin": c.vin, "s-buik": c.buik, "s-voet": c.voet, "s-wang": c.wang, "s-snavel": c.snavel, "s-haar": c.haar, "s-haarl": c.haarl };
    var el = this.el;
    Object.keys(v).forEach(function (k) { el.querySelectorAll("." + k).forEach(function (e) { e.setAttribute("fill", v[k]); }); });
  };

  Poppetje.prototype.zet = function () {
    this.el.style.left = Math.round(this.x) + "px";
    // Diepte: wie voorlangs loopt staat iets lager in de kamer en ligt over de ander heen.
    this.el.style.bottom = Math.round(12 - (this.diep - 0.5) * 14) + "px"; // de voeten staan midden op het vloerkleed (middelpunt op 30 px van de onderkant), de banen liggen er 7 px voor en achter
    this.el.style.zIndex = this.diep > 0.5 ? 4 : 2;
    this.el.style.setProperty("--kijk", this.kijk.toFixed(3));
    this.el.style.setProperty("--kijky", (this.kijkY || 0).toFixed(3));
    this.el.classList.toggle("loopt", this.lopen);
  };

  var Kamer = {
    lijst: [], breedte: 0, laatste: 0, loop: false,
    start: function (kamer, poppen) {
      var K = this;
      K.kamer = kamer; K.lijst = poppen;
      K.meet();
      poppen.forEach(function (p, i) {
        p.x = i === 0 ? 22 : Math.max(22, K.breedte - p.breedte - 22);
        p.doel = p.x; p.zet();
      });
      if (REDUCE) return;
      window.addEventListener("resize", function () { K.meet(); });
      document.addEventListener("visibilitychange", function () { K.laatste = 0; });
      if (!K.loop) { K.loop = true; requestAnimationFrame(function (t) { K.tik(t); }); }
    },
    voor: null, klok: 0, rust: 8,
    meet: function () { this.breedte = this.kamer.clientWidth || 340; },
    // Staat er maar één poppetje in de kamer, dan is de "ander" een onzichtbaar fantoom ver weg: alles wat naar de ander kijkt of reageert doet dan niets.
    FANTOOM: { x: -9999, doel: -9999, breedte: 128, lopen: false, bezig: null, antwoord: null, diep: 0.5, el: { classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } }, style: { setProperty: function () {} }, offsetWidth: 0 }, fx: {} },
    ander: function (p) { return this.lijst.length < 2 ? this.FANTOOM : (this.lijst[0] === p ? this.lijst[1] : this.lijst[0]); },
    // Wie er in de kamer is verandert (iemand komt binnen of gaat weg): wie weggaat verdwijnt, wie binnenkomt loopt van links of rechts naar binnen.
    // Elkaar weer zien (de een komt binnen waar de ander is): allebei blij, bij een mannetje en een vrouwtje met hartjes. Een slapende ander laat je slapen.
    begroet: function (p) {
      var K = this, o = this.ander(p);
      if (o === K.FANTOOM || (o.bezig && o.bezig.soort === "slaap")) return;
      var paar = GESLACHT[p.naam] && GESLACHT[o.naam] && GESLACHT[p.naam] !== GESLACHT[o.naam];
      var soort = paar ? "verliefd" : "blij";
      [o, p].forEach(function (q) {
        if (K.gesprek) K.stopGesprek(false);
        if (q.bezig) K.stopBezig(q);
        K.beginBezig(q, soort);
        var ander = q === p ? o : p;
        q.kijkDoel = ander.x > q.x ? 1 : -1;
        if (!paar) q.fx.textContent = q === p ? "hoi!" : "yay!";
      });
      K.rust = Math.max(K.rust, K.klok + 15);
      K.gesprekRust = Math.max(K.gesprekRust, K.klok + 20);
      // Een bezoeker is nieuwsgierig naar de nieuwe kamer: na het begroeten kijkt hij rond of loopt naar het raam.
      if (p.bezig) p.bezig.na = function () { K.beginBezig(p, Math.random() < 0.5 ? "raam" : "rondkijk"); };
    },
    // Weggaan: eerst doei zeggen tegen wie er is (die zwaait terug), dan de kamer uit.
    verlaat: function (p, richting, klaar) {
      var K = this, o = this.ander(p);
      if (REDUCE || !K.loop || o === K.FANTOOM || (o.bezig && o.bezig.soort === "slaap")) { K.gaUit(p, richting, klaar); return; }
      if (K.gesprek) K.stopGesprek(false);
      if (p.bezig) K.stopBezig(p);
      p.lopen = false; p.snelheid = 0;
      K.beginBezig(p, "afscheid", true);
      p.bezig.na = function () { K.gaUit(p, richting, klaar); };
    },
    // Loopt rustig naar een plek in de kamer en roept daarna klaar() aan.
    loopNaar: function (p, x, klaar) {
      var K = this;
      if (REDUCE || !K.loop) { klaar(); return; }
      if (p.bezig) { var na0 = p.bezig.na; p.bezig.na = null; K.stopBezig(p); }
      p.antwoord = null; p.snelheid = 0;
      p.doel = x; p.dir = x > p.x ? 1 : -1; p.lopen = true; p.kijkDoel = p.dir; p.uitgang = klaar;
    },
    // Er is in de kamer geklikt (niet op een poppetje): wie wil kijkt nieuwsgierig die kant op (niet verplicht, niet iedereen en niet altijd), en soms gaat er een poppetje kijken wat er is.
    // x en y zijn in pixels binnen de kamer, h is de hoogte van de kamer.
    klikIn: function (x, y, h) {
      var K = this;
      if (REDUCE || !K.loop) return;
      var vloer = y > h * 0.68;
      var dichtste = null, afstand = 1e9;
      K.lijst.forEach(function (p) {
        if (p.bezig && p.bezig.soort === "slaap") return; // wie slaapt kijkt niet
        if (p.uitgang) return;
        var mid = p.x + p.breedte / 2, dx = x - mid;
        if (Math.abs(dx) < afstand && !p.bezig && !p.lopen) { afstand = Math.abs(dx); dichtste = p; }
        if (Math.random() > 0.75) return; // hij hoeft je niet altijd te volgen
        var ogenY = h - 24 - p.breedte * 1.1 * 0.52;
        var kx = Math.max(-1, Math.min(1, dx / (K.breedte * 0.3)));
        var ky = Math.max(-1, Math.min(1, (y - ogenY) / (h * 0.3)));
        var vertraging = Math.random() * 0.5;
        setTimeout(function () { p.aandacht = { tot: K.klok + 2.5 + Math.random() * 2, kx: kx, ky: ky }; }, vertraging * 1000);
      });
      // Soms gaat iemand kijken wat er is: naar de plek lopen en snuffelen, of bij iets hoogs het kopje kantelen.
      if (dichtste && Math.random() < 0.35 && K.klok - (K.klikActie || -99) > 6) {
        K.klikActie = K.klok;
        var p = dichtste;
        if (vloer && Math.abs(x - (p.x + p.breedte / 2)) > p.breedte * 0.6) {
          var doel = Math.max(8, Math.min(K.breedte - p.breedte - 8, x - p.breedte / 2));
          K.loopNaar(p, doel, function () { K.beginBezig(p, Math.random() < 0.6 ? "snuffel" : "kantelen"); });
        } else if (!vloer) K.beginBezig(p, "kantelen");
      }
    },
    // Het poppetje loopt de kamer uit (richting 1 = rechts, -1 = links) en roept daarna klaar() aan: wie naar een andere kamer gaat, loopt eerst weg.
    gaUit: function (p, richting, klaar) {
      var K = this;
      if (REDUCE || !K.loop) { klaar(); return; }
      if (K.gesprek) K.stopGesprek(false);
      if (p.bezig) K.stopBezig(p);
      p.antwoord = null; p.snelheid = 100; p.el.classList.add("sprint");
      p.doel = richting > 0 ? K.breedte + 10 : -p.breedte - 10;
      p.dir = richting; p.lopen = true; p.kijkDoel = richting; p.uitgang = klaar;
    },
    // opties.instant: deze poppetjes staan er meteen (de gastheer die al in de kamer is); opties.opnieuw: deze poppetjes lopen opnieuw binnen (wie van kamer wisselt).
    zetLijst: function (poppen, opties) {
      opties = opties || {};
      var K = this, oud = K.lijst.slice();
      if (K.gesprek) K.stopGesprek(false);
      oud.forEach(function (p) {
        if (poppen.indexOf(p) < 0) { if (p.bezig) K.stopBezig(p); p.lopen = false; p.antwoord = null; p.snelheid = 0; p.el.classList.remove("sprint"); p.el.style.display = "none"; }
      });
      K.lijst = poppen;
      var volgorde = poppen.slice().sort(function (a, b) { return (opties.instant && opties.instant.indexOf(b) >= 0 ? 1 : 0) - (opties.instant && opties.instant.indexOf(a) >= 0 ? 1 : 0); });
      volgorde.forEach(function (p) {
        var nieuw = oud.indexOf(p) < 0 || p.el.style.display === "none" || (opties.opnieuw && opties.opnieuw.indexOf(p) >= 0);
        if (!nieuw) return;
        if (p.bezig) K.stopBezig(p);
        p.el.style.display = "";
        p.antwoord = null; p.snelheid = 0; p.el.classList.remove("sprint");
        if (opties.instant && opties.instant.indexOf(p) >= 0) {
          // Staat er al (de gastheer): meteen op een plek in de kamer, niet binnenlopen.
          p.x = 20 + Math.random() * Math.max(10, K.breedte - p.breedte - 40);
          p.doel = p.x; p.lopen = false; p.wacht = 1 + Math.random() * 3; p.kijkDoel = 0; p.komtBinnen = false;
          p.zet();
          return;
        }
        p.komtBinnen = poppen.length > 1; // wie binnenkomt waar iemand is, begroet die
        var links = opties.vanLinks !== undefined ? opties.vanLinks : Math.random() < 0.5, binnen = 30 + Math.random() * 90;
        var dX = opties.doel ? opties.doel(p) : null;
        p.x = links ? -p.breedte : K.breedte;
        p.doel = (dX !== null && dX !== undefined) ? Math.max(8, Math.min(K.breedte - p.breedte - 8, dX)) : (links ? binnen : K.breedte - p.breedte - binnen);
        p.dir = links ? 1 : -1; p.lopen = true; p.kijkDoel = p.dir;
        if (opties.snel) { p.snelheid = 95; p.el.classList.add("sprint"); }
        p.zet();
      });
      // Wie er al is draait zich meteen naar de binnenkomer; de binnenkomer kijkt tijdens het binnenlopen naar wie er staat. Zo kijken ze elkaar aan voordat ze iets doen.
      poppen.forEach(function (p) {
        var ander = poppen.filter(function (q) { return q !== p; })[0];
        if (!ander) return;
        if (p.komtBinnen) { p.blik = { tot: K.klok + 30, soort: "ander" }; p.blikWacht = 30; }
        else if (ander.komtBinnen) { p.kijkDoel = ander.x > p.x ? 1 : -1; p.kijkYDoel = 0; p.kijkWacht = 6; p.blik = null; }
      });
      K.gesprekRust = Math.max(K.gesprekRust, K.klok + 20);
      K.rust = Math.max(K.rust, K.klok + 6);
      if (REDUCE) poppen.forEach(function (p, i) { p.lopen = false; p.x = i === 0 ? 22 : Math.max(22, K.breedte - p.breedte - 22); p.doel = p.x; p.zet(); });
    },
    // Een nieuw doel kiezen: ergens in de hele kamer (ook aan de andere kant van de ander), maar niet precies waar de ander blijft staan.
    kiesDoel: function (p) {
      var o = this.ander(p), min = 8, max = this.breedte - p.breedte - 8;
      var oPlek = o.lopen ? o.doel : o.x;
      var kruis = Math.random() < 0.5; // vaak naar de andere kant van de ander, dus erlangs
      for (var i = 0; i < 16; i++) {
        var d = min + Math.random() * (max - min);
        if (kruis && i < 10 && (d > oPlek) === (p.x > oPlek)) continue;
        if (Math.abs(d - p.x) > 40 && Math.abs(d - oPlek) > p.breedte * 0.65) return d; // mag deels voor of achter de ander staan (andere baan)
      }
      return null;
    },
    // Wie loopt voorlangs? Zodra ze elkaar naderen krijgt één poppetje de voorste baan en de ander de achterste; daarna weer gelijk.
    diepte: function (dt) {
      var K = this;
      if (K.lijst.length < 2) { K.voor = null; K.lijst.forEach(function (p) { p.diep += (0.5 - p.diep) * Math.min(1, dt * 4); }); return; }
      var a = K.lijst[0], b = K.lijst[1], dx = Math.abs(a.x - b.x), br = a.breedte;
      var naderen = (a.lopen || b.lopen) && dx < br * 1.7;
      if (K.voor === null || K.voor === undefined) {
        if (naderen || dx < br * 0.95) {
          if (a.lopen && !b.lopen) K.voor = 0;
          else if (b.lopen && !a.lopen) K.voor = 1;
          else K.voor = Math.random() < 0.5 ? 0 : 1;
        }
      } else if (dx > br * 2.0 || (!a.lopen && !b.lopen && dx > br * 1.05)) {
        K.voor = null;
      }
      K.lijst.forEach(function (p, i) {
        var doel = (K.voor === null || K.voor === undefined) ? 0.5 : (i === K.voor ? 1 : 0);
        p.diep += (doel - p.diep) * Math.min(1, dt * 4);
      });
    },
    tik: function (nu) {
      var K = this;
      var dt = K.laatste ? Math.min(0.1, (nu - K.laatste) / 1000) : 0.016;
      K.laatste = nu; K.klok += dt;
      if (!document.hidden) { K.lijst.forEach(function (p) { K.stap(p, dt); }); K.tikGesprek(dt); K.checkGesprek(dt); K.diepte(dt); K.lijst.forEach(function (p) { p.zet(); }); }
      requestAnimationFrame(function (t) { K.tik(t); });
    },
    stap: function (p, dt) {
      var o = this.ander(p);
      if (!(p.bezig && p.bezig.soort === "slaap")) p.moe += dt;
      if (p.antwoord) {
        p.antwoord.na -= dt;
        if (p.antwoord.na <= 0 && !p.bezig && !p.lopen) { var sk = p.antwoord.soort; p.antwoord = null; this.beginBezig(p, sk); }
        else if (p.antwoord && p.antwoord.na < -4) p.antwoord = null;
      }
      if (p.lopen) {
        var tot = p.doel - p.x, snelheid = p.snelheid || 34;
        // Door de ander heen lopen mag: die ligt dan op een andere baan (zie diepte).
        if (p.uitgang && Math.abs(tot) < 2) { var klaarF = p.uitgang; p.uitgang = null; p.snelheid = 0; p.el.classList.remove("sprint"); p.lopen = false; klaarF(); return; }
        if (Math.abs(tot) < 2) { p.snelheid = 0; p.el.classList.remove("sprint"); p.lopen = false; p.wacht = 4 + Math.random() * 6; if (p.komtBinnen) { p.komtBinnen = false; this.begroet(p); } this.kijkKeuze(p, true); }
        else { p.dir = tot > 0 ? 1 : -1; p.x += p.dir * snelheid * dt; p.kijkDoel = p.dir; p.kijkYDoel = 0; this.loopBlik(p, o, dt); }
      } else if (p.bezig) {
        p.bezig.rest -= dt;
        if (p.bezig.soort === "rondkijk" || p.bezig.soort === "vlinder") {
          p.bezig.t -= dt;
          if (p.bezig.t <= 0) {
            p.bezig.t = p.bezig.soort === "rondkijk" ? 1.1 : 0.8;
            var punten = [[-1, 0], [1, 0], [0.7, -0.9], [-0.7, -0.9], [0, 0.9], [0.9, 0.5], [-0.9, 0.5], [0, -1], [0, 0]];
            var kz = punten[Math.floor(Math.random() * punten.length)];
            p.kijkDoel = kz[0]; p.kijkYDoel = kz[1];
          }
        }
        if (p.bezig.rest <= 0) this.stopBezig(p);
      } else {
        p.wacht -= dt; p.kijkWacht -= dt;
        if (p.kijkWacht <= 0) { this.kijkKeuze(p, false); p.kijkWacht = 2.5 + Math.random() * 3.5; }
        if (p.wacht <= 0 && this.klok >= this.rust && Math.random() < 0.3) { this.beginBezig(p); }
        else if (p.wacht <= 0) {
          var d = this.kiesDoel(p);
          if (d === null) p.wacht = 1.5; else { p.doel = d; p.dir = d > p.x ? 1 : -1; p.lopen = true; p.kijkDoel = p.dir; }
        }
      }
      // Knipperen.
      p.knip -= dt;
      if (p.knip <= 0) { p.knip = 2.5 + Math.random() * 3.5; p.el.classList.add("knip"); setTimeout(function () { p.el.classList.remove("knip"); }, 130); }
      if (p.aandacht) { // iets in de kamer aangeklikt: even die kant op kijken
        if (this.klok < p.aandacht.tot && !(p.bezig && p.bezig.soort === "slaap")) { p.kijkDoel = p.aandacht.kx; p.kijkYDoel = p.aandacht.ky; }
        else p.aandacht = null;
      }
      // Diepte: kijkt dit poppetje naar de ander (die kant op, op ooghoogte) en staat de ander op een andere baan, dan kijken de ogen mee in de diepte:
      // wie voor staat kijkt schuin omhoog naar de achterste, wie achter staat schuin omlaag naar de voorste. Staan ze (bijna) boven elkaar, dan kijkt hij vooral omhoog of omlaag.
      var kx = p.kijkDoel, ky = p.kijkYDoel || 0, oo = this.ander(p);
      if (oo !== this.FANTOOM && ky === 0 && p.kijkDoel !== 0 && (oo.x > p.x) === (p.kijkDoel > 0) && Math.abs(oo.x - p.x) < p.breedte * 3.2) {
        var dd = (oo.diep - p.diep) * 1.1;
        if (Math.abs(dd) > 0.12) { ky = Math.max(-0.9, Math.min(0.9, dd)); kx = p.kijkDoel * (0.4 + 0.6 * Math.min(1, Math.abs(oo.x - p.x) / (p.breedte * 1.2))); }
      }
      p.kijk += (kx - p.kijk) * Math.min(1, dt * 7);
      p.kijkY = (p.kijkY || 0) + (ky - (p.kijkY || 0)) * Math.min(1, dt * 7);
      p.zet();
    },
    // Samen praten: als ze allebei rustig en dichtbij zijn kijken ze elkaar aan en praten ze om beurten (snavel beweegt, wolkje met puntjes), de ander luistert.
    // Geen echte woorden. Soms lachen ze samen aan het eind. Daarna weer een tijd ieder zijn eigen ding.
    gesprek: null, gesprekRust: 25,
    checkGesprek: function (dt) {
      var K = this, a = K.lijst[0], b = K.lijst[1];
      if (K.lijst.length < 2) return;
      if (K.gesprek || K.klok < K.gesprekRust || K.klok < K.rust) return;
      if (a.bezig || b.bezig || a.lopen || b.lopen || a.antwoord || b.antwoord) return;
      if (Math.abs(a.x - b.x) > a.breedte * 2.2) return;
      var u = K.tijdNu().uur;
      if (u >= 23 || u < 7) return; // 's nachts praten ze niet
      if (Math.random() > dt * 0.1) return;
      K.startGesprek();
    },
    startGesprek: function () {
      var K = this;
      K.gesprek = { rest: 9 + Math.random() * 8, beurt: Math.random() < 0.5 ? 0 : 1, wissel: 0 };
      K.lijst.forEach(function (p) { p.bezig = { soort: "gesprek", rest: 1e9, t: 0, dir: 1 }; p.fx.textContent = ""; p.laatste = "gesprek"; });
      K.zetBeurt();
    },
    zetBeurt: function () {
      var K = this, g = K.gesprek;
      K.lijst.forEach(function (p, i) {
        var o = K.lijst[1 - i];
        p.kijkDoel = o.x > p.x ? 1 : -1;
        p.el.classList.toggle("praat", i === g.beurt);
        p.el.classList.toggle("luistert", i !== g.beurt);
      });
      g.wissel = 1.4 + Math.random() * 2;
    },
    tikGesprek: function (dt) {
      var K = this, g = K.gesprek;
      if (!g) return;
      if (K.lijst.length < 2) { K.stopGesprek(false); return; }
      g.rest -= dt; g.wissel -= dt;
      if (Math.abs(K.lijst[0].x - K.lijst[1].x) > K.lijst[0].breedte * 3) { K.stopGesprek(false); return; }
      if (g.rest <= 0) { K.stopGesprek(true); return; }
      if (g.wissel <= 0) { g.beurt = 1 - g.beurt; K.zetBeurt(); }
    },
    stopGesprek: function (afsluiten) {
      var K = this;
      K.gesprek = null;
      K.lijst.forEach(function (p) { p.el.classList.remove("praat", "luistert"); p.bezig = null; p.wacht = 3 + Math.random() * 4; p.kijkWacht = 0.5; });
      K.gesprekRust = K.klok + 45 + Math.random() * 40;
      K.rust = K.klok + 12;
      if (afsluiten && Math.random() < 0.45) {
        K.lijst.forEach(function (p) { p.bezig = { soort: "lachen", rest: 2 + Math.random() * 0.6, t: 0, dir: 1 }; p.fx.textContent = "ha ha"; p.el.classList.add("lacht"); p.laatste = "lachen"; });
      }
    },
    // Iets leuks doen in plaats van lopen. Niet vaak: na elke activiteit is het even rustig (K.rust), en nooit twee keer hetzelfde achter elkaar.
    // Soorten: klas (css), fx (tekentjes erbij), duur (seconden), gewicht (kans). Sommige reacties van de ander staan in beginBezig.
    ACT: {
      slaap:    { klas: "slaapt",    fx: "z Z z",      duur: [14, 22], gewicht: 2 },
      dans:     { klas: "danst",     fx: "\u266a \u266b", duur: [4, 6],   gewicht: 2 },
      zwaai:    { klas: "zwaait",    fx: "hoi!",       duur: [2.2, 2.6], gewicht: 0, samen: true },
      hup:      { klas: "hup",       fx: "",           duur: [0.9, 0.9], gewicht: 1 },
      rekken:   { klas: "rekt",      fx: "aah~",       duur: [3, 3.4], gewicht: 2 },
      rondkijk: { klas: "rondkijkt", fx: "?",          duur: [3.6, 4.4], gewicht: 5 },
      blij:     { klas: "blij",      fx: "yay!",       duur: [2.6, 3.4], gewicht: 2 },
      niezen:   { klas: "niest",     fx: "hatsjoe!",   duur: [1.7, 1.7], gewicht: 1 },
      rillen:   { klas: "rilt",      fx: "brr",        duur: [2.2, 2.8], gewicht: 1 },
      draaien:  { klas: "draait",    fx: "",           duur: [1, 1],   gewicht: 1 },
      verbaasd: { klas: "verbaasd",  fx: "!",          duur: [1.5, 1.8], gewicht: 0 },
      nadenken: { klas: "peinst",    fx: "...",        duur: [3.5, 4.5], gewicht: 2 },
      lachen:   { klas: "lacht",     fx: "ha ha",      duur: [2, 2.6], gewicht: 1, samen: true },
      afscheid: { klas: "zwaait",    fx: "doei!",      duur: [2.2, 2.6], gewicht: 0, samen: true },
      vlinder:  { klas: "vlinder",   fx: "~",          duur: [4, 5],   gewicht: 2.2 },
      oeps:     { klas: "oeps",      fx: "oeps!",      duur: [1.5, 1.5], gewicht: 0.6 },
      snuffel:  { klas: "snuffelt",  fx: "snuf",       duur: [3, 4],   gewicht: 2.2 },
      stuiter:  { klas: "stuitert",  fx: "!",          duur: [2.2, 2.6], gewicht: 1 },
      verlegen: { klas: "verlegen",  fx: "\u2665",       duur: [2.2, 2.6], gewicht: 0, samen: true },
      raam:     { klas: "kijktuit",  fx: "",           duur: [0, 0],   gewicht: 3.5 },
      raamkijk: { klas: "kijktuit",  fx: "ooh",        duur: [5, 7],   gewicht: 0 },
      lamp:     { klas: "lampkijk",  fx: "?",          duur: [3, 4],   gewicht: 3 },
      kantelen: { klas: "kantelt",   fx: "?",          duur: [2, 2.6], gewicht: 3 },
      tevreden: { klas: "tevreden",  fx: "mmm",        duur: [2.5, 3], gewicht: 0 },
      buigen:   { klas: "buigt",     fx: "",           duur: [1.8, 1.8], gewicht: 1, samen: true },
      verliefd: { klas: "verliefd",  fx: "\u2665 \u2665", duur: [4, 5],   gewicht: 0, samen: true },
      knuffel:  { klas: "knuffelt",  fx: "\u2665",       duur: [3, 3.6], gewicht: 0, samen: true },
      zingen:   { klas: "zingt",     fx: "\u266a",      duur: [5, 7],   gewicht: 2 },
      puffen:   { klas: "puft",      fx: "pff",        duur: [2.6, 3.2], gewicht: 0 },
      // Zeldzamer, in de stijl van Finch: iets drinken of eten, sterren kijken, mediteren, hikken, zonnen en een sprintje.
      drinken:  { klas: "drinkt",    fx: "slurp~",     duur: [3.5, 4.5], gewicht: 0.5 },
      eten:     { klas: "eet",       fx: "nom nom",    duur: [3, 3.8], gewicht: 0.5 },
      sterren:  { klas: "sterrt",    fx: "\u2726 \u2727", duur: [5, 7],   gewicht: 0 },
      mediteren:{ klas: "mediteert", fx: "om",         duur: [6, 8],   gewicht: 0.5 },
      hikken:   { klas: "hikt",      fx: "hik!",       duur: [2.8, 3.4], gewicht: 0.4 },
      zonnen:   { klas: "zont",      fx: "ahh~",       duur: [6, 9],   gewicht: 0 },
      sprint:   { klas: "sprint",    fx: "",           duur: [0, 0],   gewicht: 0.6 }
    },
    // Logisch bij de echte wereld: de tijd (Amsterdam) bepaalt wat past. Brr alleen als het koud is, pff alleen in de zomer, slapen vooral 's avonds en 's nachts, rekken 's ochtends.
    tijdNu: function () {
      try {
        var d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
        return { maand: d.getMonth(), uur: d.getHours() };
      } catch (e) { var n = new Date(); return { maand: n.getMonth(), uur: n.getHours() }; }
    },
    pasGewicht: function (k, g, p) {
      var t = this.tijdNu(), m = t.maand, u = t.uur;
      var winter = m === 11 || m === 0 || m === 1, koel = m === 10 || m === 2, zomer = m >= 5 && m <= 7, warm = m === 4 || m === 8;
      var nacht = u >= 22 || u < 7, avond = u >= 20 && u < 22, ochtend = u >= 7 && u < 11;
      if (k === "rillen") g = winter ? 2 : (koel ? 1 : 0);
      if (k === "puffen") g = zomer ? (u >= 10 && u < 22 ? 2 : 0) : (warm && u >= 12 && u < 18 ? 1 : 0);
      // Slapen doen ze niet snel of vaak: pas als ze al lang wakker zijn (moe), 's nachts eerder.
      if (k === "slaap") { var moe = p ? p.moe : 0; g = nacht ? (moe > 600 ? 3 : 0.8) : (moe > 1800 ? (avond ? 2 : 1) : 0); }
      if (k === "vlinder") g = (u >= 9 && u < 19 && !winter) ? 1.2 : 0.2;
      if (k === "snuffel") g = (u >= 7 && u < 22) ? 1 : 0.2;
      if (k === "stuiter") g = (u >= 8 && u < 21) ? 1 : 0.1;
      if (k === "rekken") g = ochtend ? 4 : (nacht ? 0.5 : 1);
      if (k === "dans" || k === "blij" || k === "zingen") g = nacht ? g * 0.3 : g;
      var maaltijd = (u >= 7 && u < 9) || (u >= 12 && u < 14) || (u >= 17 && u < 20);
      if (k === "drinken") g = (winter || koel) ? ((u >= 7 && u < 10) || (u >= 15 && u < 22) ? 2 : 1) : (zomer ? 0 : 0.4);
      if (k === "eten") g = maaltijd ? 1.5 : 0.2;
      if (k === "sterren") g = (u >= 20 || u < 5) ? 1.5 : 0;
      if (k === "mediteren") g = ((u >= 6 && u < 9) || (u >= 20 && u < 22)) ? 1 : 0.3;
      if (k === "zonnen") g = zomer ? (u >= 11 && u < 17 ? 2 : 0) : (warm && u >= 12 && u < 17 ? 0.7 : 0);
      if (k === "sprint") g = nacht ? 0.2 : 0.7;
      return g;
    },
    beginBezig: function (p, gedwongen, mettReactie) {
      var K = this, o = this.ander(p), A = this.ACT;
      var dichtbij = Math.abs(o.x - p.x) < p.breedte * 2.4;
      var soort = gedwongen;
      if (!soort) {
        // Slim zijn: tegen een slapende ander zwaai je niet, en bij een slapende buur doe je niets luidruchtigs.
        var oSlaapt = !!(o.bezig && o.bezig.soort === "slaap");
        var keuzes = Object.keys(A).map(function (k) {
          var g = K.pasGewicht(k, A[k].gewicht, p);
          var samenMogelijk = dichtbij && !oSlaapt && o !== K.FANTOOM && !o.bezig; // samen-dingen alleen met een wakkere, rustige ander dichtbij
          if (A[k].samen && !samenMogelijk) g = 0;      // alleen: geen samen-dingen
          if (k === "zwaai" || k === "afscheid") g = 0; // hoi en doei zeg je alleen bij binnenkomen, weggaan of als iemand je aantikt, niet zomaar
          if (k === "verliefd" || k === "knuffel") g = (samenMogelijk && GESLACHT[p.naam] && GESLACHT[o.naam] && GESLACHT[p.naam] !== GESLACHT[o.naam]) ? (k === "verliefd" ? 0.9 : 0.5) : 0;
          if (oSlaapt && dichtbij && ["dans", "hup", "niezen", "blij", "lachen", "zingen", "sprint", "hikken", "eten", "verliefd", "knuffel"].indexOf(k) >= 0) g = 0;
          if (k === p.laatste) g = 0;
          var eerder = p.gebruikt[k];
          if (g > 0 && eerder !== undefined) { var sinds = K.klok - eerder; if (sinds < 180) g = 0; else if (sinds < 420) g *= 0.3; } // niet steeds hetzelfde
          return [k, g];
        });
        var tot = keuzes.reduce(function (t, k) { return t + k[1]; }, 0), r = Math.random() * tot;
        soort = "rondkijk";
        for (var i = 0; i < keuzes.length; i++) { r -= keuzes[i][1]; if (r <= 0 && keuzes[i][1] > 0) { soort = keuzes[i][0]; break; } }
        K.rust = K.klok + 40 + Math.random() * 35; // daarna een hele tijd niets nieuws, van wie dan ook (rustig rondlopen mag)
      }
      if (soort === "raam") {
        var rx = Math.max(8, Math.min(K.breedte - p.breedte - 8, K.breedte / 2 - p.breedte / 2 + (Math.random() * 40 - 20)));
        p.laatste = "raam"; p.gebruikt.raam = K.klok;
        K.rust = K.klok + 40 + Math.random() * 35;
        K.loopNaar(p, rx, function () { K.beginBezig(p, "raamkijk"); });
        return;
      }
      if (soort === "sprint") {
        var dd = this.kiesDoel(p);
        if (dd !== null) { p.doel = dd; p.dir = dd > p.x ? 1 : -1; p.lopen = true; p.kijkDoel = p.dir; p.snelheid = 95; p.el.classList.add("sprint"); p.laatste = "sprint"; return; }
        soort = "rondkijk";
      }
      var a = A[soort];
      p.laatste = soort;
      p.gebruikt[soort] = K.klok;
      p.bezig = { soort: soort, rest: a.duur[0] + Math.random() * (a.duur[1] - a.duur[0]), t: 0, dir: Math.random() < 0.5 ? 1 : -1 };
      p.kijkDoel = (soort === "zwaai" || soort === "afscheid" || soort === "dans" || soort === "verliefd" || soort === "knuffel" || soort === "buigen") ? (o.x > p.x ? 1 : -1) : (soort === "nadenken" ? -0.8 : 0);
      p.kijkYDoel = { sterren: -1, snuffel: 1, nadenken: -0.7, vlinder: -0.5, raamkijk: -0.9, lamp: -0.8 }[soort] || 0;
      if (soort === "raamkijk") p.kijkDoel = (K.breedte / 2 > p.x + p.breedte / 2) ? 0.35 : -0.35;
      if (soort === "lamp") p.kijkDoel = (K.breedte * 0.74 > p.x + p.breedte / 2) ? 0.9 : -0.9;
      // Nieuwsgierige toeschouwer: de ander kijkt even mee naar wat dit poppetje doet.
      if (!gedwongen && o !== K.FANTOOM && dichtbij && !o.bezig && !o.lopen && Math.random() < 0.6) { o.kijkDoel = p.x > o.x ? 1 : -1; o.kijkYDoel = 0; o.kijkWacht = 3.5; }
      p.fx.textContent = a.fx;
      if (soort === "hup") { p.el.classList.remove("hup"); void p.el.offsetWidth; p.el.classList.add("hup"); }
      else p.el.classList.add(a.klas);
      // Een kostuum vervangt het hele poppetje, dus ook met kledingdata eronder
      // moet het dezelfde zichtbare armzwaai krijgen als het basispoppetje.
      if ((soort === "zwaai" || soort === "afscheid") && (!p.lijfKleding || p.el.classList.contains("kostuum"))) p.el.classList.add("zwaait-arm");
      if (soort === "verliefd" || soort === "knuffel") p.el.style.setProperty("--naar", o.x > p.x ? 1 : -1);
      // Verlegen: kijkt weg, wordt rood, loopt een stukje weg en komt later terug naar de ander toe, blij.
      if (soort === "verlegen") {
        p.kijkDoel = o.x > p.x ? -0.9 : 0.9;
        p.bezig.na = function () {
          var weg = o.x > p.x ? -1 : 1, af = Math.max(8, Math.min(K.breedte - p.breedte - 8, p.x + weg * (90 + Math.random() * 60)));
          K.loopNaar(p, af, function () {
            p.wacht = 3 + Math.random() * 3; p.bezig = { soort: "wachten", rest: p.wacht, t: 0, dir: 1 };
            p.bezig.na = function () {
              var oo = K.ander(p);
              if (oo === K.FANTOOM) return;
              K.loopNaar(p, Math.max(8, Math.min(K.breedte - p.breedte - 8, oo.x + (p.x < oo.x ? -1 : 1) * 95)), function () { K.beginBezig(p, "blij"); p.kijkDoel = oo.x > p.x ? 1 : -1; });
            };
          });
        };
      }
      if (soort === "eten") p.bezig.na = function () { K.beginBezig(p, "tevreden"); };
      if (soort === "buigen") p.el.style.setProperty("--hoek", ((o.x > p.x ? 1 : -1) * 14) + "deg");
      // De ander kan reageren: terugzwaaien, meedansen, schrikken van een nies, meeslapen, meehuppen.
      if ((!gedwongen || mettReactie) && dichtbij && !o.bezig && !o.lopen && !o.antwoord) {
        var reactie = { zwaai: ["zwaai", 0.85], dans: ["dans", 0.6], niezen: ["verbaasd", 0.7], slaap: ["slaap", 0.25], hup: ["hup", 0.3], blij: ["blij", 0.3], verliefd: [Math.random() < 0.7 ? "verliefd" : "verlegen", 0.95], knuffel: ["knuffel", 0.95], afscheid: ["afscheid", 0.9] }[soort];
        if (reactie && Math.random() < reactie[1]) o.antwoord = { soort: reactie[0], na: 0.9 + Math.random() * 0.9 };
      }
    },
    // Aangetikt: stoppen met wat het poppetje deed (lopen of slapen) en zwaaien. De ander kan terugzwaaien.
    aanraken: function (p) {
      if (REDUCE) return;
      if (this.gesprek) this.stopGesprek(false);
      p.lopen = false; p.doel = p.x; p.antwoord = null; p.snelheid = 0; p.el.classList.remove("sprint");
      if (p.bezig) this.stopBezig(p);
      this.beginBezig(p, "zwaai", true);
      p.kijkDoel = 0; p.kijkYDoel = 0; p.kijkWacht = 3; // aangetikt: hij kijkt jou aan (de camera) terwijl hij zwaait
    },
    stopBezig: function (p) {
      var K = this;
      Object.keys(this.ACT).forEach(function (k) { p.el.classList.remove(K.ACT[k].klas); });
      p.el.classList.remove("zwaait-arm");
      var na = p.bezig && p.bezig.na;
      if (p.bezig && p.bezig.soort === "slaap") p.moe = 0;
      p.bezig = null; p.wacht = 6 + Math.random() * 6;
      p.kijkWacht = 0.5; p.kijkYDoel = 0;
      if (na) na();
    },
    // Waar kijkt het poppetje naartoe als het stilstaat: vaak naar de ander, soms rechtdoor of de andere kant op.
    // Waar kijkt het poppetje naartoe als het stilstaat. Samen: meestal naar de ander, soms naar de camera (jouw scherm) of ergens in de kamer (links, rechts, omhoog, omlaag).
    // Alleen: naar de camera of rondom. Zo kijken ze elkaar aan en lopen ze niet langs elkaar heen zonder te kijken.
    kijkKeuze: function (p, naStop) {
      var o = this.ander(p), r = Math.random();
      var samen = o !== this.FANTOOM && Math.abs(o.x - p.x) < p.breedte * 3.2;
      var naarAnder = o === this.FANTOOM ? (Math.random() < 0.5 ? 1 : -1) : (o.x > p.x ? 1 : -1);
      p.kijkYDoel = 0;
      var rondom = function () {
        var z = Math.random();
        if (z < 0.3) p.kijkDoel = -0.9; else if (z < 0.6) p.kijkDoel = 0.9;
        else { p.kijkDoel = (Math.random() < 0.5 ? -0.4 : 0.4); p.kijkYDoel = z < 0.8 ? -0.9 : 0.9; }
      };
      if (samen) {
        if (r < 0.62) p.kijkDoel = naarAnder;
        else if (r < 0.77) p.kijkDoel = 0;       // naar de camera
        else rondom();
      } else {
        if (r < 0.3) p.kijkDoel = 0; else rondom();
      }
    },
    // Tijdens het lopen: komt de ander dichtbij (of lopen ze langs elkaar), dan kijk je hem of haar even aan, soms naar de camera.
    loopBlik: function (p, o, dt) {
      var K = this;
      p.blikWacht = (p.blikWacht || 0) - dt;
      var dichtbij = o !== K.FANTOOM && Math.abs(o.x - p.x) < p.breedte * 2.8;
      if (!dichtbij && !(p.blik && p.blik.soort === "ander" && p.komtBinnen && o !== K.FANTOOM)) { p.blik = null; return; }
      if (!p.blik && p.blikWacht <= 0) { p.blik = { tot: K.klok + 1.5 + Math.random() * 1.5, soort: Math.random() < 0.8 ? "ander" : "camera" }; p.blikWacht = 2.5 + Math.random() * 3; }
      if (p.blik) {
        if (K.klok > p.blik.tot) { p.blik = null; return; }
        p.kijkDoel = p.blik.soort === "ander" ? (o.x > p.x ? 1 : -1) : 0;
        p.kijkYDoel = 0;
      }
    }
  };

  function zetKnip() {
    if (document.getElementById("pg-knip") || !document.body) return;
    // Het lichaam van het poppetje (200x220), omgerekend naar 0..1 zodat het op elk formaat past.
    var d = "M0.5 0.1182C0.73 0.1182 0.85 0.2727 0.85 0.5273C0.85 0.7818 0.7 0.9 0.5 0.9C0.3 0.9 0.15 0.7818 0.15 0.5273C0.15 0.2727 0.27 0.1182 0.5 0.1182Z";
    document.body.insertAdjacentHTML("beforeend", '<svg id="pg-knip" width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="pg-klem" clipPathUnits="objectBoundingBox"><path d="' + d + '"/></clipPath></defs></svg>');
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", zetKnip); else zetKnip();

  window.Poppetje = Poppetje;
  window.Kamer = Kamer;
})();
