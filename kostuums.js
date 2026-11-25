/* Kostuums voor de poppetjes: beer, konijn, hert, vos, eekhoorn en kikker (Kleding > Kostuum). Een kostuum vervangt het hele pinguïn-poppetje.
   Elk kostuum is echte vector (gladde paden uit kostuum-vec.js), net als het gewone poppetje, en gemaakt uit de plaatjes van de gebruiker
   (Referentie/Kostuums/). Alles staat in de 200x220-ruimte van de poppetjes.
   Opbouw van een kostuum, van achter naar voren:
   - basis (k-basis): het complete poppetje in rust, met armen en voetjes, zonder ogen, wangen en neus/mond (die zijn opgevuld);
   - voetjes (voet-l, voet-r; alleen bij lopen) en de zwaaiarm (k-arm; alleen bij zwaaien): losse stukken; dan is de basis bijgeknipt (--k-klip-voet of --k-klip-arm). De andere arm blijft in de basis;
   - wangen (wang), ogen (oog: open en dicht) en neus met mond (snavel): losse stukken die meekijken, knipperen en blozen.
   Zo werken dezelfde animatieklassen als bij het gewone poppetje. Item-id = "kostuum-<dier>-<naam>", bijvoorbeeld "kostuum-beer-rachel".
   Opnieuw maken: scripts/kostuum-tests/bouw-vector/ (LEESMIJ.md). */
(function () {
  "use strict";
  var DIEREN = [{ dier: "beer", label: "Beer" }, { dier: "konijn", label: "Konijn" }, { dier: "hert", label: "Hert" }, { dier: "vos", label: "Vos" }, { dier: "eekhoorn", label: "Eekhoorn" }, { dier: "kikker", label: "Kikker" }];
  var teller = 0;
  function isKostuum(item) { return !!item && item.plek === "kostuum"; }
  function r(n) { return Math.round(n * 100) / 100; }
  function laag(lijst) {
    return (lijst || []).map(function (p) { return '<path d="' + p[1] + '" fill="' + p[0] + '"/>'; }).join("");
  }
  // Draaipunt in de 200x220-ruimte.
  function px(p) { return "transform-origin:" + r(p[0]) + "px " + r(p[1]) + "px"; }
  // Dichte ogen (slapen, knipperen, lachen): een rustig streepje per oog, zoals bij het gewone poppetje.
  function dicht(d) {
    return d.oogC.map(function (o) {
      var rw = o[2] * 0.95;
      return '<path d="M' + r(o[0] - rw) + " " + r(o[1]) + "Q" + r(o[0]) + " " + r(o[1] + rw * 0.28) + " " + r(o[0] + rw) + " " + r(o[1]) + '" fill="none" stroke="#2b2333" stroke-width="' + r(rw * 0.32) + '" stroke-linecap="round"/>';
    }).join("");
  }
  // Wenkbrauwen voor boze, jaloerse of vastberaden blikken (alleen zichtbaar bij .jaloers en .vastbesloten): schuin naar binnen, vlak boven elk oog.
  function brauwen(d) {
    return d.oogC.map(function (o, i) {
      var rw = o[2], dir = i === 0 ? 1 : -1, x0 = o[0] - dir * rw * 1.15, x1 = o[0] + dir * rw * 1.0;
      return '<path d="M' + r(x0) + " " + r(o[1] - rw * 1.75) + "L" + r(x1) + " " + r(o[1] - rw * 1.05) + '" stroke="#2b2333" stroke-width="' + r(rw * 0.42) + '" stroke-linecap="round" fill="none"/>';
    }).join("");
  }
  function svg(id, naam) {
    var d = String(id).split("-");
    var dier = d[1], eigenaar = d[2] || String(naam).toLowerCase();
    var V = window.KostuumVec;
    var D = V && (V[dier + "-" + eigenaar] || V[dier + "-ritchie"]);
    if (!D) return "";
    var u = "ks" + (++teller), P = D.parts, pv = D.piv;
    // De arm die zwaait is de rechter; heeft een dier maar één arm (eekhoorn: links), dan zwaait die, gespiegeld.
    var solo = !P.armR && !!P.armL;
    function stuk(klas, lijst, punt) { return lijst ? '<g class="' + klas + '" style="' + px(punt) + '">' + laag(lijst) + "</g>" : ""; }
    return '<svg class="pg-kostuumsvg dier-' + dier + '" viewBox="0 0 200 220" aria-hidden="true" style="--k-klip-voet:url(#' + u + 'v);--k-klip-arm:url(#' + u + 'a)">' +
      '<defs><clipPath id="' + u + 'v" clipPathUnits="userSpaceOnUse"><path clip-rule="evenodd" d="M0 0H200V220H0Z' + D.klipV + '"/></clipPath>' +
      '<clipPath id="' + u + 'a" clipPathUnits="userSpaceOnUse"><path clip-rule="evenodd" d="M0 0H200V220H0Z' + D.klipA + '"/></clipPath></defs>' +
      '<ellipse class="k-schaduw" cx="100" cy="201" rx="46" ry="6" fill="#2b2333" opacity=".12"/>' +
      '<g class="k-fig">' +
      '<g class="k-basis">' + laag(P.base) + "</g>" +
      stuk("voet voet-l k-voetdeel", P.voetL, pv.voetL) + stuk("voet voet-r k-voetdeel", P.voetR, pv.voetR) +
      stuk("k-arm k-armdeel k-arm-l k-arm-solo", P.armL, pv.armL) + stuk("k-arm k-armdeel k-arm-r", P.armR, pv.armR) +
      '<g class="wang">' + laag(P.wang) + "</g>" +
      '<g class="brauw">' + brauwen(D) + "</g>" +
      '<g class="oog"><g class="open">' + laag(P.oog) + '<g class="wimper">' + laag(P.wimper) + '</g></g><g class="dicht" opacity="0">' + dicht(D) + "</g></g>" +
      '<g class="snavel">' + laag(P.snavel) + "</g>" +
      "</g></svg>";
  }
  window.Kostuums = { DIEREN: DIEREN, isKostuum: isKostuum, svg: svg };
})();
