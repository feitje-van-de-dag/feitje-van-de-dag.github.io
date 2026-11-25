/* Kamer inrichten in de stijl van Finch: elk kamerspul is een eigen, gekleurd tekeningetje met een thema (retro, kamperen, ruimte, onderwater, bloesem, ...).
   Alles wordt getekend (geen plaatjes) en past op de vaste kamer van 360 x 280. De winkelitems staan in de database (plek: muur, vloer, raam, lamp, kleed);
   hier staat hoe elk item eruitziet, op id. Het raam laat altijd de echte tijd en het seizoen zien; alleen de vorm en versiering verschillen. */
(function () {
  "use strict";
  var PLEKKEN = ["muur", "vloer", "raam", "lamp", "kleed"];

  function hex(c) { return [1, 3, 5].map(function (i) { return parseInt(c.slice(i, i + 2), 16); }); }
  function mixk(c1, c2, t) { var a = hex(c1), b = hex(c2); return "#" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0"); }).join(""); }
  function lichter(c, t) { return mixk(c, "#ffffff", t); }
  function donkerder(c, t) { return mixk(c, "#2d2347", t); }
  // Een stervormig tekentje (5 punten) en een glinstering (4 punten), gecentreerd op x,y.
  function ster(x, y, r, kleur, op) { return '<path transform="translate(' + x + " " + y + ") scale(" + (r / 8.4).toFixed(2) + ')" d="M0-8L2.4-2.6L8.4-2.2L3.8 1.6L5.2 7.4L0 4.2L-5.2 7.4L-3.8 1.6L-8.4-2.2L-2.4-2.6Z" fill="' + kleur + '" stroke="' + kleur + '" stroke-width="1.6" stroke-linejoin="round"' + (op ? ' opacity="' + op + '"' : "") + "/>"; }
  function glans(x, y, r, kleur, op) { return '<path transform="translate(' + x + " " + y + ')" d="M0-' + r + "Q0 0 " + r + " 0Q0 0 0 " + r + "Q0 0 -" + r + " 0Q0 0 0 -" + r + 'Z" fill="' + kleur + '"' + (op ? ' opacity="' + op + '"' : "") + "/>"; }
  function bloem(x, y, r, bladkleur, hartkleur, n) {
    var s = "", k = n || 5;
    for (var i = 0; i < k; i++) { var a = i * 360 / k; s += '<ellipse transform="rotate(' + a + " " + x + " " + y + ") translate(0 " + (-r * 0.62) + ')" cx="' + x + '" cy="' + y + '" rx="' + (r * 0.4) + '" ry="' + (r * 0.52) + '" fill="' + bladkleur + '"/>'; }
    return s + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.34) + '" fill="' + hartkleur + '"/>';
  }

  // ---------- MUUR ----------
  // 360 breed, loopt tot de plint op y = 186 (de plint zelf is 12 hoog).
  var MUREN = {
    "muur-creme": { naam: "Crèmewitte muur", prijs: 120, soort: "effen", basis: "#fbf5ea", plint: "#e9dcc4" },
    "muur-lambris-mint": { naam: "Mint met lambrisering", prijs: 250, soort: "lambris", basis: "#d9f1e6", onder: "#bfe4d2", plint: "#ffffff" },
    "muur-lambris-roze": { naam: "Roze met lambrisering", prijs: 250, soort: "lambris", basis: "#ffe6f0", onder: "#ffcfe1", plint: "#ffffff" },
    "muur-retro": { naam: "Retro regenboog", prijs: 350, soort: "retro", basis: "#cf6b3d", plint: "#a9502a" },
    "muur-kamp": { naam: "Kampeerhut", prijs: 350, soort: "kamp", basis: "#6f7e60", plint: "#4a5740" },
    "muur-sterrenhemel": { naam: "Sterrenhemel", prijs: 350, soort: "sterrenhemel", basis: "#2a3470", onder: "#4b57a6", plint: "#222b5c" },
    "muur-zonnebloemen": { naam: "Zonnebloemen", prijs: 350, soort: "zonnebloemen", basis: "#ffeaa8", plint: "#e7c76d" },
    "muur-ruimte": { naam: "Ruimtereis", prijs: 350, soort: "ruimte", basis: "#3b2a73", onder: "#5a3f9a", plint: "#2e2060" },
    "muur-bloesem": { naam: "Lentebloesem", prijs: 350, soort: "bloesem", basis: "#e5f1d9", plint: "#c4d8b0" },
    "muur-zee": { naam: "Onder water", prijs: 350, soort: "zee", basis: "#8fdcec", onder: "#35a8c8", plint: "#2c93b0" },
    "muur-sneeuw": { naam: "Sneeuwdag", prijs: 350, soort: "sneeuw", basis: "#d2e9f8", plint: "#ffffff" }
  };
  // De standaard muur is de oude met verticale banen, per eigenaar een eigen kleur.
  var MUUR_STANDAARD = {
    Ritchie: { soort: "verticaal", basis: "#d9e4ff" },
    Rachel: { soort: "verticaal", basis: "#ffe6f1" }
  };
  function muurDef(id, eigenaar) { return MUREN[id] || MUUR_STANDAARD[eigenaar] || MUUR_STANDAARD.Ritchie; }

  function muurSvg(d, uid) {
    var id = "pw" + uid, s = "";
    var gradient = function (boven, onder) { return '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + boven + '"/><stop offset="1" stop-color="' + onder + '"/></linearGradient></defs><rect width="360" height="196" fill="url(#' + id + 'g)"/>'; };
    s += '<rect width="360" height="280" fill="' + d.basis + '"/>';
    if (d.soort === "verticaal") {
      s += '<g opacity=".55">' + [0,1,2,3,4,5,6,7,8,9,10,11].map(function (i) { return '<rect x="' + (i * 30) + '" y="0" width="15" height="196" fill="' + lichter(d.basis, 0.45) + '"/>'; }).join("") + "</g>";
    } else if (d.soort === "lambris") {
      s += '<rect y="118" width="360" height="78" fill="' + d.onder + '"/>';
      for (var x = 12; x < 360; x += 58) s += '<rect x="' + x + '" y="132" width="46" height="46" rx="7" fill="' + lichter(d.onder, 0.16) + '" stroke="' + lichter(d.onder, 0.55) + '" stroke-width="2.6"/>';
      s += '<rect y="110" width="360" height="10" rx="3" fill="#ffffff"/><rect y="120" width="360" height="3" fill="' + donkerder(d.onder, 0.25) + '" opacity=".3"/>';
    } else if (d.soort === "retro") {
      var ring = function (cx, cy, rs, kleuren) { return rs.map(function (r, i) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + kleuren[i] + '"/>'; }).join(""); };
      s += ring(0, 196, [176, 146, 116, 86, 56], ["#2c8f94", "#f5b83d", "#f8e6c8", "#e0663a", d.basis]);
      s += ring(360, 0, [140, 112, 84, 56], ["#f5b83d", "#2c8f94", "#f8e6c8", d.basis]);
      [[150, 40, 10, "#f8e6c8"], [212, 118, 8, "#f5b83d"], [300, 150, 12, "#f8e6c8"], [190, 168, 6, "#f5b83d"], [112, 92, 7, "#f8e6c8"], [262, 70, 9, "#2c8f94"]].forEach(function (t) { s += ster(t[0], t[1], t[2], t[3]); });
    } else if (d.soort === "kamp") {
      for (var i = 0; i < 12; i++) s += '<rect x="' + (i * 30) + '" width="30" height="196" fill="' + (i % 2 ? "#6a795b" : "#76856a") + '"/><rect x="' + (i * 30) + '" width="2.4" height="196" fill="#4a5740" opacity=".55"/>';
      [[44, 70], [118, 130], [196, 52], [262, 112], [330, 80]].forEach(function (k) { s += '<ellipse cx="' + k[0] + '" cy="' + k[1] + '" rx="4" ry="6.5" fill="#5b6a4e" opacity=".8"/>'; });
      var pad = "M0 12", wimp = "", kl = ["#e0553f", "#f8e6c8", "#2c8f94", "#f5b83d"];
      for (var x2 = 0; x2 <= 360; x2 += 10) pad += "L" + x2 + " " + (12 + 24 * Math.sin(Math.PI * (x2 % 180) / 180)).toFixed(1);
      s += '<path d="' + pad + '" fill="none" stroke="#3a4630" stroke-width="2.4"/>';
      for (var x3 = 14, n = 0; x3 < 360; x3 += 26, n++) { var y3 = 12 + 24 * Math.sin(Math.PI * (x3 % 180) / 180); wimp += '<path d="M' + (x3 - 9) + " " + y3.toFixed(1) + "L" + (x3 + 9) + " " + y3.toFixed(1) + "L" + x3 + " " + (y3 + 22).toFixed(1) + 'Z" fill="' + kl[n % 4] + '"/>'; }
      s += wimp;
      [[34, 186, 1.1], [326, 186, 1.2], [92, 186, 0.8]].forEach(function (t) { s += '<g transform="translate(' + t[0] + " " + t[1] + ") scale(" + t[2] + ')" fill="#3f4e36"><path d="M0-62L16-30H-16Z"/><path d="M0-48L20-12H-20Z"/><path d="M0-30L24 0H-24Z"/><rect x="-3" y="0" width="6" height="8"/></g>'; });
    } else if (d.soort === "sterrenhemel") {
      s += gradient(d.basis, d.onder);
      [[26,22,7],[64,70,5],[102,28,6],[138,98,5],[178,16,8],[216,74,5],[246,36,6],[290,100,7],[330,30,5],[346,82,5],[48,128,6],[122,142,6],[200,130,5],[274,152,7],[332,138,5],[18,164,5],[164,168,6]].forEach(function (t) { s += ster(t[0], t[1], t[2], "#fff3b0", 0.95); });
      [[84,48],[240,60],[310,56],[30,96],[150,60],[96,110],[260,120]].forEach(function (t) { s += glans(t[0], t[1], 6, "#ffffff", 0.9); });
      s += '<circle cx="52" cy="62" r="24" fill="#fff6c8"/><circle cx="61" cy="55" r="21" fill="' + mixk(d.basis, d.onder, 0.25) + '"/>';
      s += '<path d="M0 172Q60 150 120 168T240 164T360 166V196H0Z" fill="#3a479a"/><path d="M0 184Q70 168 140 182T280 180T360 178V196H0Z" fill="#323e8a"/>';
    } else if (d.soort === "zonnebloemen") {
      s += gradient("#fff1bd", d.basis);
      [[28, 0], [92, 12], [156, -4], [222, 10], [286, 0], [344, 8]].forEach(function (t) {
        var x4 = t[0], y4 = 142 + t[1];
        s += '<path d="M' + x4 + " " + (y4 + 20) + 'V190" stroke="#5fa84f" stroke-width="5" stroke-linecap="round"/><path d="M' + x4 + " 168Q" + (x4 + 22) + " 156 " + (x4 + 26) + " 170Q" + (x4 + 10) + " 178 " + x4 + ' 168Z" fill="#79c262"/>';
        s += bloem(x4, y4, 24, "#ffc22e", "#7b4a2b", 12) + '<circle cx="' + (x4 - 3) + '" cy="' + (y4 - 3) + '" r="2" fill="#a7693f"/><circle cx="' + (x4 + 4) + '" cy="' + (y4 + 2) + '" r="2" fill="#a7693f"/>';
      });
      [[40, 40], [130, 70], [230, 36], [310, 66], [90, 100], [270, 104]].forEach(function (t) { s += '<circle cx="' + t[0] + '" cy="' + t[1] + '" r="2.6" fill="#ffd45a" opacity=".8"/>'; });
    } else if (d.soort === "ruimte") {
      s += gradient(d.basis, d.onder);
      [[30,30,5],[70,140,6],[118,38,4],[170,96,5],[232,30,5],[262,150,4],[320,36,6],[344,110,4],[200,160,5],[20,100,4]].forEach(function (t) { s += ster(t[0], t[1], t[2], "#ffffff", 0.9); });
      s += '<path d="M10 150Q90 110 170 142" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4 6" opacity=".5"/><path d="M180 40Q260 70 350 30" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="4 6" opacity=".5"/>';
      s += '<g transform="translate(46 78)"><circle r="26" fill="#f6a03e"/><path d="M-24 -6Q0 4 24 -6M-22 8Q0 18 22 8" stroke="#e07d22" stroke-width="5" fill="none" opacity=".7"/><ellipse rx="44" ry="10" fill="none" stroke="#ffe7a8" stroke-width="5" transform="rotate(-18)" opacity=".95"/></g>';
      s += '<circle cx="324" cy="138" r="17" fill="#43c6b4"/><circle cx="318" cy="132" r="5" fill="#7ee3d3"/><circle cx="330" cy="146" r="3.4" fill="#2da594"/>';
      s += '<circle cx="236" cy="150" r="13" fill="#d9d4e8"/><circle cx="232" cy="146" r="3.4" fill="#bdb6d6"/><circle cx="241" cy="155" r="2.4" fill="#bdb6d6"/>';
      s += '<g transform="translate(146 150) rotate(30)"><path d="M0 -20Q9 -8 8 10H-8Q-9 -8 0 -20Z" fill="#f3f0fa"/><circle cy="-4" r="4" fill="#5ac8fa"/><path d="M-8 6L-16 16L-8 12ZM8 6L16 16L8 12Z" fill="#ff7a6b"/><path d="M-4 10L0 20L4 10Z" fill="#ffc83d"/></g>';
    } else if (d.soort === "bloesem") {
      s += gradient("#eef7e3", "#d8e9c8");
      s += '<path d="M-6 8Q34 40 66 30Q96 22 104 58" fill="none" stroke="#7d5a45" stroke-width="7" stroke-linecap="round"/><path d="M66 30Q74 66 50 88M28 28Q20 4 -2 -2M94 28Q102 6 100 -2" fill="none" stroke="#7d5a45" stroke-width="4" stroke-linecap="round"/>';
      [[10,22],[34,34],[60,30],[84,26],[102,44],[103,66],[52,86],[22,12],[98,6],[46,64]].forEach(function (t, i) { s += bloem(t[0], t[1], 11 + (i % 3) * 2, i % 2 ? "#ffb4cf" : "#ff9fc1", "#fff0a0", 5); });
      [[60,110],[30,140],[250,130],[300,100],[170,160],[330,150],[12,170]].forEach(function (t, i) { s += '<ellipse cx="' + t[0] + '" cy="' + t[1] + '" rx="4" ry="2.6" fill="#ffb4cf" transform="rotate(' + (i * 40) + " " + t[0] + " " + t[1] + ')" opacity=".85"/>'; });
    } else if (d.soort === "zee") {
      s += gradient(d.basis, d.onder);
      [[40,40,7],[70,90,4],[22,128,5],[120,50,5],[222,70,8],[260,30,4],[300,110,6],[340,60,5],[190,120,4],[150,150,6]].forEach(function (t) { s += '<circle cx="' + t[0] + '" cy="' + t[1] + '" r="' + t[2] + '" fill="none" stroke="#ffffff" stroke-width="2.2" opacity=".7"/><circle cx="' + (t[0] - t[2] * 0.3) + '" cy="' + (t[1] - t[2] * 0.3) + '" r="' + (t[2] * 0.22) + '" fill="#ffffff" opacity=".8"/>'; });
      var vis = function (x, y, k, kl, sp) { return '<g transform="translate(' + x + " " + y + ") scale(" + sp + ' 1)"><ellipse rx="' + 17 * k + '" ry="' + 11 * k + '" fill="' + kl + '"/><path d="M' + 14 * k + " 0L" + 30 * k + " -" + 11 * k + "V" + 11 * k + 'Z" fill="' + kl + '"/><circle cx="-' + 7 * k + '" cy="-' + 2 * k + '" r="' + 2.4 * k + '" fill="#2a1f4a"/><path d="M0 -' + 10 * k + "Q4 0 0 " + 10 * k + '" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".6"/></g>'; };
      s += vis(84, 70, 1, "#ff9a5a", 1) + vis(250, 54, 0.8, "#ffd04a", -1) + vis(322, 128, 0.9, "#ff7aa8", -1);
      s += '<path d="M0 196Q20 150 12 120Q32 150 30 196ZM44 196Q60 160 54 136Q74 164 70 196ZM300 196Q320 156 312 126Q336 156 330 196ZM338 196Q352 168 348 150Q362 170 360 196Z" fill="#3fb37a"/>';
    } else if (d.soort === "sneeuw") {
      s += gradient("#e8f4fc", d.basis);
      var vlok = function (x, y, r) { var a = ""; for (var k = 0; k < 3; k++) a += '<path transform="rotate(' + k * 60 + " " + x + " " + y + ')" d="M' + x + " " + (y - r) + "V" + (y + r) + '" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><path transform="rotate(' + k * 60 + " " + x + " " + y + ')" d="M' + (x - r * 0.28) + " " + (y - r * 0.7) + "L" + x + " " + (y - r * 0.42) + "L" + (x + r * 0.28) + " " + (y - r * 0.7) + "M" + (x - r * 0.28) + " " + (y + r * 0.7) + "L" + x + " " + (y + r * 0.42) + "L" + (x + r * 0.28) + " " + (y + r * 0.7) + '" stroke="#ffffff" stroke-width="2.4" fill="none" stroke-linecap="round"/>'; return a; };
      [[34,36,16],[96,98,11],[154,34,13],[236,80,18],[300,30,12],[334,104,14],[60,140,10],[190,140,12],[280,150,9]].forEach(function (t) { s += vlok(t[0], t[1], t[2]); });
      s += '<path d="M0 160Q60 140 120 156T240 150T360 156V196H0Z" fill="#ffffff"/><path d="M0 176Q80 164 160 174T360 172V196H0Z" fill="#eaf4fb"/>';
      s += '<g transform="translate(300 156)"><path d="M0-34L14-10H-14Z" fill="#4f9b73"/><path d="M0-22L18 4H-18Z" fill="#3f8a63"/><path d="M0-8L22 20H-22Z" fill="#2f7a55"/><rect x="-3" y="20" width="6" height="8" fill="#7b5a43"/><circle cy="-36" r="3.2" fill="#ffd45a"/></g>';
    }
    s += '<rect x="0" y="186" width="360" height="12" fill="' + (d.plint || donkerder(d.basis, 0.14)) + '"/>';
    return s;
  }

  // ---------- VLOER ----------
  // De vloer loopt van y = 198 tot 280. Het kleedje in het midden blijft voor alle vloeren hetzelfde.
  var VLOEREN = {
    "vloer-donker": { naam: "Donkere houten vloer", prijs: 200, soort: "planken", basis: "#a8744a", lijn: "#8d5f3b", knoop: "#7b5233" },
    "vloer-gras": { naam: "Madeliefjesgras", prijs: 300, soort: "gras", basis: "#a8dd8c" },
    "vloer-strand": { naam: "Zandstrand", prijs: 300, soort: "strand", basis: "#f6e0b0" },
    "vloer-retro": { naam: "Retro ruiten", prijs: 300, soort: "retro", basis: "#f7e5c8", lijn: "#dc7a4a" },
    "vloer-roze": { naam: "Roze schaakbord", prijs: 250, soort: "schaak", basis: "#fff3f8", lijn: "#ffb3cd" },
    "vloer-wolken": { naam: "Wolkenvloer", prijs: 300, soort: "wolken", basis: "#bfe0ff" },
    "vloer-tapijt": { naam: "Zacht lila tapijt", prijs: 250, soort: "tapijt", basis: "#e3d6fb", lijn: "#cdbaf3" }
  };
  var VLOER_STANDAARD = { soort: "planken", basis: "#e9c9a0", lijn: "#d9b685" };
  function vloerDef(id) { return VLOEREN[id] || VLOER_STANDAARD; }
  function vloerSvg(d, uid) {
    var id = "pv" + uid, s = '<rect x="0" y="198" width="360" height="82" fill="' + d.basis + '"/>';
    var patroon = function (b, h, inhoud) { return '<defs><pattern id="' + id + '" width="' + b + '" height="' + h + '" patternUnits="userSpaceOnUse">' + inhoud + '</pattern></defs><rect x="0" y="198" width="360" height="82" fill="url(#' + id + ')"/>'; };
    if (d.soort === "planken") {
      s += [0, 1, 2, 3].map(function (i) { return '<path d="M0 ' + (214 + i * 20) + "Q180 " + (208 + i * 20) + " 360 " + (214 + i * 20) + '" stroke="' + d.lijn + '" stroke-width="2" fill="none"/>'; }).join("");
      if (d.knoop) [[60, 226], [250, 208], [150, 262], [320, 248]].forEach(function (k) { s += '<ellipse cx="' + k[0] + '" cy="' + k[1] + '" rx="6" ry="3" fill="' + d.knoop + '" opacity=".7"/>'; });
    } else if (d.soort === "gras") {
      s += patroon(40, 26, '<path d="M8 22l2-9l2 9M24 14l2-9l2 9" stroke="#7fc267" stroke-width="2.6" stroke-linecap="round" fill="none"/>');
      [[30, 214, "#ffffff"], [96, 246, "#fff3a8"], [170, 222, "#ffffff"], [240, 262, "#ffffff"], [300, 220, "#fff3a8"], [340, 256, "#ffffff"], [60, 268, "#ffffff"], [206, 270, "#fff3a8"], [130, 206, "#ffffff"]].forEach(function (b) { s += bloem(b[0], b[1], 8, b[2], "#ffc22e", 6); });
    } else if (d.soort === "strand") {
      s += '<path d="M0 198V206Q30 214 60 206T120 206T180 206T240 206T300 206T360 206V198Z" fill="#7fd6e8"/><path d="M0 206Q30 214 60 206T120 206T180 206T240 206T300 206T360 206" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>';
      s += patroon(30, 24, '<circle cx="6" cy="8" r="1.4" fill="#e9c98a"/><circle cx="20" cy="18" r="1.4" fill="#e9c98a"/>');
      s += ster(52, 236, 9, "#ff9a7a") + '<path transform="translate(280 250)" d="M-10 4Q-12-8 0-10Q12-8 10 4Q0 8-10 4Z" fill="#ffd9c0"/><path transform="translate(280 250)" d="M-6 2L0-8L6 2M0 4V-8" stroke="#f2b896" stroke-width="1.6" fill="none"/>' + ster(164, 268, 7, "#ffb8d0") + '<path transform="translate(330 226)" d="M-8 3Q-10-6 0-8Q10-6 8 3Z" fill="#fff2de"/>';
    } else if (d.soort === "retro") {
      s += patroon(60, 40, '<path d="M30 0L60 20L30 40L0 20Z" fill="' + d.lijn + '"/><path d="M30 8L48 20L30 32L12 20Z" fill="#2c8f94"/><circle cx="30" cy="20" r="3.6" fill="#f5b83d"/>');
    } else if (d.soort === "schaak") {
      s += patroon(56, 44, '<rect width="28" height="22" fill="' + d.lijn + '"/><rect x="28" y="22" width="28" height="22" fill="' + d.lijn + '"/>');
    } else if (d.soort === "wolken") {
      s += '<g fill="#ffffff" opacity=".95">' + [[40, 226, 1], [150, 252, 1.2], [260, 220, 0.9], [330, 258, 1.1], [90, 266, 0.8], [210, 236, 0.7]].map(function (c) { return '<g transform="translate(' + c[0] + " " + c[1] + ") scale(" + c[2] + ')"><circle cx="-14" cy="3" r="9"/><circle cx="0" cy="-2" r="12"/><circle cx="15" cy="3" r="9"/><rect x="-14" y="2" width="29" height="10" rx="5"/></g>'; }).join("") + "</g>";
    } else if (d.soort === "tapijt") {
      s += patroon(24, 24, '<circle cx="6" cy="6" r="2.2" fill="' + d.lijn + '"/><circle cx="18" cy="18" r="2.2" fill="' + d.lijn + '"/>');
    }
    return s;
  }


  // ---------- KLEED ----------
  // Vloerkleden liggen midden op de vloer (middelpunt 180,250; maximaal 160 breed en 44 hoog, de vloer loopt tot y = 280). Rond en ovaal liggen plat, vierkant en rechthoekig staan in perspectief (voor breder dan achter).
  function kg(inhoud) { return '<g transform="translate(180 250)">' + inhoud + "</g>"; }
  function trap(w1, w2, h, vul, extra) { return '<polygon points="' + (-w1) + "," + (-h) + " " + w1 + "," + (-h) + " " + w2 + "," + h + " " + (-w2) + "," + h + '" fill="' + vul + '"' + (extra || "") + "/>"; }
  function vlok(r, kleur, dik) {
    var s = "";
    for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3, x = Math.cos(a) * r, y = Math.sin(a) * r; s += '<path d="M' + (-x).toFixed(1) + " " + (-y).toFixed(1) + "L" + x.toFixed(1) + " " + y.toFixed(1) + '"/>'; }
    return '<g stroke="' + kleur + '" stroke-width="' + dik + '" stroke-linecap="round" fill="none">' + s + "</g>";
  }
  function sterPunten(r, n) { var p = []; for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * 0.45 : r; p.push((Math.cos(a) * rr).toFixed(1) + "," + (Math.sin(a) * rr).toFixed(1)); } return p.join(" "); }
  var KLEED_STANDAARD = { naam: "Mintgroen kleedje", teken: function () { return '<ellipse cx="180" cy="250" rx="160" ry="20" fill="#b7e4d0"/><ellipse cx="180" cy="250" rx="140" ry="14" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>'; } };
  var KLEDEN = {
    "kleed-sneeuwvlok": { naam: "Sneeuwvlokkenkleed", prijs: 300, teken: function () { var s = ""; [[-92, 0, .5], [92, 0, .5], [0, 0, .85]].forEach(function (f) { s += '<g transform="translate(' + f[0] + " " + f[1] + ") scale(" + (f[2] * 1.5).toFixed(2) + " " + (f[2] * .62).toFixed(2) + ')">' + vlok(22, "#ffffff", 3.4) + '<g stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M-6 -17l6 -4l6 4M-6 17l6 4l6 -4M-19 -3l-5 -6M-19 3l-5 6M19 -3l5 -6M19 3l5 6"/></g><circle r="3.6" fill="#fff"/></g>'; }); return kg('<ellipse rx="158" ry="21" fill="#9fd2f5"/><ellipse rx="144" ry="16" fill="#d3ecff"/>' + s + '<g fill="#fff"><circle cx="-50" cy="-8" r="2.6"/><circle cx="50" cy="9" r="2.6"/><circle cx="-130" cy="4" r="2.6"/><circle cx="130" cy="-4" r="2.6"/></g>'); } },
    "kleed-schaap": { naam: "Zacht schapenvachtkleed", prijs: 300, teken: function () { var s = ""; for (var i = 0; i < 18; i++) { var a = i * Math.PI / 9; s += '<ellipse cx="' + (Math.cos(a) * 138).toFixed(1) + '" cy="' + (Math.sin(a) * 15).toFixed(1) + '" rx="22" ry="9" fill="#fff6e6"/>'; } return kg(s + '<ellipse rx="138" ry="16" fill="#fffbf2"/><g stroke="#f0dfc4" stroke-width="2" stroke-linecap="round" fill="none"><path d="M-60 -4q6-5 12 0M-10 6q6-5 12 0M40 -6q6-5 12 0M70 7q6-5 12 0M-95 6q6-5 12 0"/></g>'); } },
    "kleed-kerst": { naam: "Kerstkleed", prijs: 300, teken: function () { var s = ""; for (var x = -90; x <= 90; x += 30) s += '<path d="M' + x + ' -8l7 14h-14z" fill="#2f9e5b"/>'; var f = ""; for (var y = -15; y <= 15; y += 7.5) { var e = 100 + (y + 21) * 28 / 42; f += '<path d="M' + (-(e - 2)).toFixed(1) + ' ' + y + 'h' + (-18) + 'M' + (e - 2).toFixed(1) + ' ' + y + 'h18" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>'; } return kg(f + trap(100, 128, 21, "#d6283a") + trap(90, 116, 15, "#f0525f") + s + '<g fill="#fff"><circle cx="-110" cy="-2" r="3"/><circle cx="108" cy="8" r="3"/><circle cx="-30" cy="12" r="2.6"/><circle cx="30" cy="-12" r="2.6"/></g>'); } },
    "kleed-noors": { naam: "Noors winterkleed", prijs: 350, teken: function () { var s = ""; for (var x = -90; x <= 90; x += 30) s += '<path d="M' + x + " -8l9 8l-9 8l-9 -8z" + '" fill="#ffffff"/><circle cx="' + (x + 15) + '" cy="0" r="2.6" fill="#ff8fa3"/>'; var z = ""; for (var j = -100; j < 100; j += 16) z += (j === -100 ? "M" : "L") + j + (Math.round((j + 100) / 16) % 2 ? " -17" : " -12"); return kg(trap(100, 128, 21, "#263a6b") + trap(90, 116, 15, "#34508f") + s + '<path d="' + z + '" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>'); } },
    "kleed-voetjes": { naam: "Pinguïnvoetjes op ijs", prijs: 300, teken: function () { var s = ""; [[-92, 6, -12], [-48, -6, 10], [-2, 6, -8], [44, -6, 12], [90, 6, -10]].forEach(function (p) { s += '<g transform="translate(' + p[0] + " " + p[1] + ") rotate(" + p[2] + ')" fill="#3a6fa8"><ellipse rx="7" ry="3.2"/><circle cx="-8" cy="-3" r="1.8"/><circle cx="0" cy="-5" r="1.8"/><circle cx="8" cy="-3" r="1.8"/></g>'; }); return kg('<ellipse rx="158" ry="21" fill="#7fc4e3"/><ellipse rx="146" ry="17" fill="#c4eaf7"/><path d="M-120 -8L-70 -12M80 10L130 4" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' + s); } },
    "kleed-pepermunt": { naam: "Pepermuntkleed", prijs: 250, teken: function () { var s = ""; for (var i = 0; i < 12; i++) { var a0 = i * Math.PI / 6, a1 = (i + 1) * Math.PI / 6; if (i % 2) continue; s += '<path d="M0 0L' + (Math.cos(a0) * 150).toFixed(1) + " " + (Math.sin(a0) * 150).toFixed(1) + "A150 150 0 0 1 " + (Math.cos(a1) * 150).toFixed(1) + " " + (Math.sin(a1) * 150).toFixed(1) + 'Z" fill="#e8344a"/>'; } return kg('<g transform="scale(1.06 .14)"><circle r="150" fill="#fff"/>' + s + '<circle r="150" fill="none" stroke="#e8344a" stroke-width="10"/><circle r="22" fill="#fff"/></g>'); } },
    "kleed-krans": { naam: "Kerstkrans", prijs: 300, teken: function () { var b = "", t = ""; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; b += '<ellipse cx="' + (Math.cos(a) * 118).toFixed(1) + '" cy="' + (Math.sin(a) * 16).toFixed(1) + '" rx="26" ry="9" fill="' + (i % 2 ? "#2f9e5b" : "#247f49") + '" transform="rotate(' + (a * 180 / Math.PI * 0.12).toFixed(1) + " " + (Math.cos(a) * 118).toFixed(1) + " " + (Math.sin(a) * 16).toFixed(1) + ')"/>'; } for (var j = 0; j < 9; j++) { var c = j * Math.PI / 4.5 + .3; t += '<circle cx="' + (Math.cos(c) * 118).toFixed(1) + '" cy="' + (Math.sin(c) * 16 - 2).toFixed(1) + '" r="4.2" fill="#e8344a"/>'; } return kg('<ellipse rx="146" ry="20" fill="#2c7d4a"/><ellipse rx="92" ry="9" fill="#e9c98a"/>' + b + t + '<g transform="translate(0 17)"><path d="M0 0l-22 -10v20z M0 0l22 -10v20z" fill="#e8344a"/><circle r="5" fill="#ff7a8a"/></g>'); } },
    "kleed-dennen": { naam: "Dennenboomkleed", prijs: 300, teken: function () { var s = ""; [[-92, 5, .85], [-46, -5, 1], [0, 5, .9], [46, -5, 1], [92, 5, .85]].forEach(function (b) { s += '<g transform="translate(' + b[0] + " " + b[1] + ") scale(" + b[2] + ')"><path d="M0 -14l8 12h-4l7 10h-22l7 -10h-4z" fill="#2f9e5b"/><path d="M0 -14l5 7q-5 3 -10 0z" fill="#fff"/><rect x="-2" y="8" width="4" height="4" fill="#8a5a3c"/></g>'; }); return kg(trap(100, 128, 21, "#1f5c43") + trap(90, 116, 16, "#2a7556") + s + '<g fill="#fff"><circle cx="-112" cy="6" r="2.4"/><circle cx="112" cy="8" r="2.4"/><circle cx="-24" cy="14" r="2.2"/><circle cx="26" cy="-14" r="2.2"/></g>'); } },
    "kleed-peperkoek": { naam: "Peperkoekhart", prijs: 300, teken: function () { var h = "M0 30C-60 -5 -50 -45 -20 -40C-8 -38 0 -28 0 -22C0 -28 8 -38 20 -40C50 -45 60 -5 0 30Z"; return kg('<g transform="translate(0 -2) scale(2.9 .7)"><path d="' + h + '" fill="#a85f2e"/><path d="' + h + '" fill="#c77b40" transform="scale(.9) translate(0 1.5)"/></g><path d="M-108 0Q-90 -12 -72 0T-36 0T0 0T36 0T72 0T108 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><g fill="#ff5a6e"><circle cx="-50" cy="6" r="4"/><circle cx="0" cy="10" r="4"/><circle cx="50" cy="6" r="4"/></g>'); } },
    "kleed-ijskristal": { naam: "IJskristalkleed", prijs: 350, teken: function () { var p = ""; for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3 + Math.PI / 6; p += (i ? "L" : "M") + (Math.cos(a) * 150).toFixed(1) + " " + (Math.sin(a) * 150 * .19).toFixed(1); } return kg('<path d="' + p + 'Z" fill="#8ec9ee"/><g transform="scale(.92)"><path d="' + p + 'Z" fill="#d9f0ff"/></g><g transform="scale(1.7 .26)">' + vlok(54, "#8ec9ee", 6) + '<g stroke="#8ec9ee" stroke-width="4" stroke-linecap="round" fill="none"><path d="M-14 -44l14 -9l14 9M-14 44l14 9l14 -9M-48 -6l-10 -12M-48 6l-10 12M48 -6l10 -12M48 6l10 12"/></g><circle r="7" fill="#8ec9ee"/></g>'); } },
    "kleed-gebreid": { naam: "Gebreid kleed met pompons", prijs: 350, teken: function (uid) { var s = "", id = "kg" + uid; for (var x = -110; x <= 110; x += 14) s += '<path d="M' + x + " -21v42M" + (x + 7) + ' -21v42" stroke="#ffffff" stroke-width="3" opacity=".6"/>'; var pom = ""; [[-122, -16], [122, -16], [-146, 18], [146, 18]].forEach(function (p) { pom += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#fff6e6"/><circle cx="' + (p[0] - 2) + '" cy="' + (p[1] - 2) + '" r="3.4" fill="#fffdf6"/>'; }); return kg('<defs><clipPath id="' + id + '"><polygon points="-100,-21 100,-21 128,21 -128,21"/></clipPath></defs>' + trap(100, 128, 21, "#e88aa0") + '<g clip-path="url(#' + id + ')">' + s + '<rect x="-140" y="-3" width="280" height="6" fill="#fff" opacity=".7"/></g>' + pom); } }
  };
  function kleedDef(id) { return KLEDEN[id] || KLEED_STANDAARD; }

  // ---------- RAAM ----------
  // Ruimte van het raam: 0..80 breed, 0..88 hoog (bovenhoek op 140,28 in de kamer). clip = de ruit, frame = de rand (achter de ruit), kruis = de raamstijlen,
  // voor = versiering vóór het raam (gordijnen, luifel, luiken, planten). voor(dn) krijgt een functie om kleuren bij nacht te verdonkeren.
  var RAMEN = {
    klassiek: { naam: "Klassiek raam", clip: '<rect width="80" height="88" rx="9"/>', frame: '<rect x="-8" y="-8" width="96" height="104" rx="14" fill="#fff"/>', kruis: "M40 0V88M0 44H80", voor: null },
    "raam-gordijn": { naam: "Raam met gordijnen", prijs: 350, clip: '<rect width="80" height="88" rx="9"/>', frame: '<rect x="-8" y="-8" width="96" height="104" rx="14" fill="#fff"/>', kruis: "M40 0V88M0 44H80",
      voor: function (dn) { var g = dn("#f7a8c4"), g2 = dn("#e07c9d"), goud = dn("#f2c14e"); return '<path d="M-6 -6H30Q22 24 24 50Q26 76 20 96H-6Z" fill="' + g + '"/><path d="M86 -6H50Q58 24 56 50Q54 76 60 96H86Z" fill="' + g + '"/><path d="M6 -4Q10 40 6 94M16 -4Q20 40 16 90M74 -4Q70 40 74 94M64 -4Q60 40 64 90" stroke="' + g2 + '" stroke-width="2.4" fill="none" opacity=".7"/><path d="M-10 -10H90V4Q80 10 70 4Q60 10 50 4Q40 10 30 4Q20 10 10 4Q0 10 -10 4Z" fill="' + g2 + '"/><circle cx="22" cy="52" r="3.4" fill="' + goud + '"/><circle cx="58" cy="52" r="3.4" fill="' + goud + '"/>'; } },
    "raam-boog": { naam: "Boograam met luifel", prijs: 350, clip: '<path d="M0 88V40A40 40 0 0 1 80 40V88Z"/>', frame: '<path d="M-8 96V40A48 48 0 0 1 88 40V96Z" fill="#b5764a"/><path d="M-3 92V40A43 43 0 0 1 83 40V92Z" fill="#d79a68"/>', kruis: "M40 0V88M0 58H80",
      voor: function (dn) { var a = dn("#5fae68"), b = dn("#fff4dc"), bak = dn("#9a5d3a"), luifel = ""; for (var i = 0; i < 6; i++) luifel += '<path d="M' + (-12 + i * 17.3) + ' 2h17.3v12a8.65 8.65 0 0 1 -17.3 0Z" fill="' + (i % 2 ? b : a) + '"/>'; return luifel + '<path d="M-12 -2Q40 -26 92 -2V4H-12Z" fill="' + dn("#4e9757") + '"/><rect x="-10" y="90" width="100" height="14" rx="4" fill="' + bak + '"/>' + [6, 22, 38, 54, 70].map(function (x, i) { return '<path d="M' + x + " 90Q" + (x - 4) + " 80 " + x + " 76Q" + (x + 4) + " 80 " + x + ' 90Z" fill="#5fae68"/>' + bloem(x, 76, 7, dn(["#ff6b8a", "#ffd04a", "#ff9fc1", "#ffffff", "#ff8a5a"][i]), "#ffe27a", 5); }).join(""); } },
    "raam-rond": { naam: "Rond raam met krans", prijs: 350, clip: '<circle cx="40" cy="44" r="36"/>', frame: '<circle cx="40" cy="44" r="42" fill="#fff"/>', kruis: "M40 8V80M4 44H76",
      voor: function (dn) { var s = ""; for (var i = 0; i < 18; i++) { var a = i * 20 * Math.PI / 180, x = 40 + 45 * Math.cos(a), y = 44 + 45 * Math.sin(a); s += '<ellipse transform="rotate(' + (i * 20 + 90) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="5" ry="10" fill="' + dn(i % 2 ? "#5fae68" : "#7cc673") + '"/>'; } [[0.4, "#ff8fb4"], [1.6, "#ffd04a"], [2.8, "#ff8fb4"], [4.0, "#ffffff"], [5.2, "#ffd04a"]].forEach(function (p) { var x = 40 + 45 * Math.cos(p[0]), y = 44 + 45 * Math.sin(p[0]); s += bloem(x.toFixed(1), y.toFixed(1), 8, dn(p[1]), "#ffe27a", 5); }); return s; } },
    "raam-luiken": { naam: "Raam met blauwe luiken", prijs: 350, clip: '<rect width="80" height="88" rx="9"/>', frame: '<rect x="-8" y="-8" width="96" height="104" rx="14" fill="#fff"/>', kruis: "M40 0V88M0 44H80",
      voor: function (dn) { var l = dn("#58a7d8"), d = dn("#3f86b6"); var luik = function (x) { var s = '<rect x="' + x + '" y="-8" width="26" height="104" rx="6" fill="' + l + '"/>'; for (var y = 4; y < 90; y += 9) s += '<rect x="' + (x + 3) + '" y="' + y + '" width="20" height="5" rx="2.4" fill="' + d + '"/>'; return s; }; return luik(-36) + luik(90) + '<rect x="-14" y="96" width="108" height="7" rx="3.5" fill="' + dn("#b98a5c") + '"/><path d="M30 86h20l-2.4 10H32.4Z" fill="' + dn("#c9694a") + '"/><rect x="28" y="84" width="24" height="4.5" rx="2.2" fill="' + dn("#d9805f") + '"/><path d="M40 84V76" stroke="#5fae68" stroke-width="2.6" stroke-linecap="round"/>' + bloem(40, 72, 8.5, dn("#ff6b8a"), "#ffe27a", 4.6); } },
    "raam-panorama": { naam: "Panoramaraam met plantjes", prijs: 400, clip: '<rect x="-16" y="16" width="112" height="56" rx="12"/>', frame: '<rect x="-24" y="8" width="128" height="72" rx="18" fill="#fff"/>', kruis: "M24 16V72M56 16V72",
      voor: function (dn) { var pot = dn("#c9694a"), gr = dn("#5fae68"); return '<rect x="-30" y="70" width="140" height="9" rx="4" fill="' + dn("#b5764a") + '"/><g><rect x="-16" y="56" width="16" height="14" rx="3" fill="' + pot + '"/><path d="M-8 56V40M-8 52Q-16 46 -14 38M-8 48Q0 42 -2 34" stroke="' + gr + '" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="-8" cy="38" r="3" fill="#ff6b8a"/></g><g><rect x="32" y="58" width="16" height="12" rx="3" fill="' + dn("#8fb3e8") + '"/><path d="M40 58Q30 48 34 38Q40 46 40 58ZM40 58Q50 48 46 38Q40 46 40 58ZM40 58V34" fill="' + gr + '" stroke="' + gr + '" stroke-width="2.6" stroke-linejoin="round"/></g><g><rect x="74" y="56" width="16" height="14" rx="3" fill="' + dn("#f2c14e") + '"/><circle cx="82" cy="46" r="8" fill="' + gr + '"/><circle cx="82" cy="46" r="3.6" fill="' + dn("#8be0a0") + '"/></g>'; } },
    "raam-hart": { naam: "Hartraam met klimop", prijs: 400, clip: '<path d="M40 84C8 62-6 32 12 14C26 2 38 10 40 22C42 10 54 2 68 14C86 32 72 62 40 84Z"/>', frame: '<path transform="translate(40 46) scale(1.2) translate(-40 -46)" d="M40 84C8 62-6 32 12 14C26 2 38 10 40 22C42 10 54 2 68 14C86 32 72 62 40 84Z" fill="#ffd0e0"/><path transform="translate(40 46) scale(1.12) translate(-40 -46)" d="M40 84C8 62-6 32 12 14C26 2 38 10 40 22C42 10 54 2 68 14C86 32 72 62 40 84Z" fill="#fff"/>', kruis: "",
      voor: function (dn) { var g = dn("#5fae68"), g2 = dn("#7cc673"); var blad = function (x, y, r, k) { return '<path transform="translate(' + x + " " + y + ") rotate(" + r + ')" d="M0 0C8-8 18-4 18 6C8 10 0 8 0 0Z" fill="' + k + '"/>'; }; return '<path d="M-6 30Q0 50 10 66Q22 82 34 90" fill="none" stroke="' + dn("#6b8f4e") + '" stroke-width="3" stroke-linecap="round"/><path d="M86 18Q80 40 70 60" fill="none" stroke="' + dn("#6b8f4e") + '" stroke-width="3" stroke-linecap="round"/>' + blad(-4, 36, -30, g) + blad(2, 52, 10, g2) + blad(12, 70, 30, g) + blad(24, 82, 40, g2) + blad(82, 28, 190, g) + blad(76, 46, 160, g2) + blad(70, 58, 150, g); } },
    "raam-patrijs": { naam: "Patrijspoort", prijs: 350, clip: '<circle cx="40" cy="44" r="34"/>', frame: '<circle cx="40" cy="44" r="48" fill="#e8b84a"/><circle cx="40" cy="44" r="42" fill="#f9dc8a"/><circle cx="40" cy="44" r="36" fill="#d79c2f"/>', kruis: "",
      voor: function (dn) { var s = ""; for (var i = 0; i < 8; i++) { var a = i * 45 * Math.PI / 180; s += '<circle cx="' + (40 + 42 * Math.cos(a)).toFixed(1) + '" cy="' + (44 + 42 * Math.sin(a)).toFixed(1) + '" r="3.2" fill="' + dn("#fff0b8") + '"/>'; } return s + '<path d="M16 30Q22 16 36 12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>'; } }
  };
  function raamDef(id) { return RAMEN[id] || RAMEN.klassiek; }

  // ---------- LAMP ----------
  // Elke lamp hangt aan een koord aan het plafond rond x = 268. teken(aan, uid) geeft de tekening; "aan" ('s nachts) is warmer en lichter.
  function snoer(y) { return '<path d="M259 0h18l-3 7h-12z" fill="#d8c7ad"/><path d="M268 7V' + y + '" stroke="#a98b6b" stroke-width="3" stroke-linecap="round"/>'; }
  function lg(id, boven, onder) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + boven + '"/><stop offset="1" stop-color="' + onder + '"/></linearGradient>'; }
  function rg(id, binnen, buiten) { return '<radialGradient id="' + id + '" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="' + binnen + '"/><stop offset="1" stop-color="' + buiten + '"/></radialGradient>'; }
  var LAMPEN = {
    klassiek: { naam: "Klassieke lamp", teken: function (aan, u) {
      var g = "lk" + u;
      return { svg: snoer(52) + "<defs>" + lg(g, aan ? "#fff0a0" : "#ffe27a", aan ? "#ffd04a" : "#f4b92f") + '</defs><path d="M240 86Q240 56 268 52Q296 56 296 86Z" fill="url(#' + g + ')"/><path d="M251 72Q255 63 264 60" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".65"/><ellipse cx="268" cy="86" rx="28" ry="5.5" fill="' + (aan ? "#ffc93d" : "#e8a823") + '"/><ellipse cx="268" cy="90" rx="9" ry="6" fill="' + (aan ? "#fffbe0" : "#fff3b8") + '"/>', gx: 268, gy: 94 }; } },
    "lamp-tulp": { naam: "Roze lampenkap", prijs: 300, teken: function (aan, u) {
      var g = "lt" + u, kap = aan ? "#ff8aa6" : "#f2688a", licht = aan ? "#ffc1d1" : "#ff9db6", kwast = "";
      for (var i = 0; i < 7; i++) { var x = 242 + i * 9; kwast += '<path d="M' + x + ' 88V97" stroke="#e8a93a" stroke-width="1.6" stroke-linecap="round"/><circle cx="' + x + '" cy="99.5" r="3.2" fill="#ffd45a"/><circle cx="' + (x - 1) + '" cy="98.5" r="1" fill="#fff" opacity=".7"/>'; }
      return { svg: snoer(55) + "<defs>" + lg(g, licht, kap) + "</defs>" + kwast + '<ellipse cx="268" cy="93" rx="10" ry="5" fill="' + (aan ? "#fffbe0" : "#fff3b8") + '"/><path d="M252 58H284L302 92Q294 98 287 93Q278 99 268 93Q258 99 249 93Q242 98 234 92Z" fill="url(#' + g + ')"/><g stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".18"><path d="M260 59L252 94"/><path d="M268 59V94"/><path d="M276 59L284 94"/></g><path d="M257 63Q254 76 248 86" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".32"/><ellipse cx="268" cy="58" rx="16" ry="3.6" fill="' + licht + '"/><ellipse cx="268" cy="58" rx="16" ry="3.6" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>', gx: 268, gy: 96 }; } },
    "lamp-paddo": { naam: "Paddenstoellamp", prijs: 350, teken: function (aan, u) {
      var g = "lp" + u;
      return { svg: snoer(58) + "<defs>" + rg(g, aan ? "#ff7a6e" : "#f0553f", aan ? "#e8453c" : "#c93a2e") + '</defs><rect x="261" y="86" width="14" height="22" rx="6" fill="' + (aan ? "#fff5dc" : "#f7ead0") + '"/><path d="M236 90Q236 56 268 54Q300 56 300 90Q284 98 268 94Q252 98 236 90Z" fill="url(#' + g + ')"/><g fill="#fff" opacity=".95"><circle cx="254" cy="72" r="5.4"/><circle cx="276" cy="64" r="4.6"/><circle cx="288" cy="80" r="4.2"/><circle cx="262" cy="86" r="3"/></g><path d="M244 72Q246 62 256 58" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".5"/>', gx: 268, gy: 96 }; } },
    "lamp-planeet": { naam: "Planeetlamp", prijs: 350, teken: function (aan, u) {
      var g = "lq" + u;
      return { svg: snoer(60) + "<defs>" + rg(g, aan ? "#ffc27a" : "#ffb057", aan ? "#f58a2e" : "#e8741f") + '</defs><g transform="translate(268 88) rotate(-16)"><path d="M-42 0A42 9 0 0 1 42 0" stroke="#e8cf8a" stroke-width="5" fill="none"/></g><circle cx="268" cy="86" r="24" fill="url(#' + g + ')"/><path d="M247 80Q268 90 289 80M246 94Q268 104 290 94" stroke="' + (aan ? "#ee7d26" : "#d4661a") + '" stroke-width="4" fill="none" opacity=".55"/><g transform="translate(268 88) rotate(-16)"><path d="M-42 0A42 9 0 0 0 42 0" stroke="#ffeab0" stroke-width="5" fill="none"/></g><path d="M250 77.5A20 20 0 0 1 261 67.2" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/><circle cx="312" cy="64" r="4.4" fill="#d9d4e8"/>' + ster(226, 70, 4, "#ffe27a"), gx: 268, gy: 90 }; } },
    "lamp-maan": { naam: "Maanmobile", prijs: 400, teken: function (aan, u) {
      var g = "lm" + u, gl = "lmg" + u;
      // Een echte maansikkel: twee cirkels, het snijpunt geeft de twee punten (hoorns)
      var c1 = { x: 266, y: 86, r: 28 }, c2 = { x: 280, y: 78, r: 23 };
      var dx = c2.x - c1.x, dy = c2.y - c1.y, d = Math.sqrt(dx * dx + dy * dy);
      var aa = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d), h = Math.sqrt(c1.r * c1.r - aa * aa);
      var mx = c1.x + aa * dx / d, my = c1.y + aa * dy / d;
      var p1 = { x: mx + h * dy / d, y: my - h * dx / d }, p2 = { x: mx - h * dy / d, y: my + h * dx / d };
      var f = function (n) { return n.toFixed(1); };
      var sik = "M" + f(p1.x) + " " + f(p1.y) + "A" + c1.r + " " + c1.r + " 0 1 0 " + f(p2.x) + " " + f(p2.y) + "A" + c2.r + " " + c2.r + " 0 1 1 " + f(p1.x) + " " + f(p1.y) + "Z";
      var touw = function (x, y, len) { return '<path d="M' + x + " " + y + "V" + (y + len) + '" stroke="#b79a78" stroke-width="1.8" stroke-linecap="round"/>'; };
      return { svg: snoer(60) + '<g transform="translate(12 0)">' + touw(256, 59, 9) + touw(244, 98, 12) + touw(262, 106, 18) + "<defs>" + rg(g, aan ? "#fff6b8" : "#fff0a0", aan ? "#ffd43f" : "#ffc933") + '<radialGradient id="' + gl + '"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs><path d="' + sik + '" fill="url(#' + g + ')"/><path d="M247 70Q252 62 262 59" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/><path d="M252 88q4 4.2 8 0" stroke="#a9792a" stroke-width="2.2" stroke-linecap="round" fill="none"/><ellipse cx="248" cy="94" rx="4.4" ry="3" fill="#ff9aa8" opacity=".65"/><path d="M254 98q3 2.4 6 0" stroke="#a9792a" stroke-width="1.8" stroke-linecap="round" fill="none"/>' + ster(244, 114, 5.5, "#ffe27a") + ster(262, 127, 7, "#ffd23f") + '</g>', gx: 274, gy: 86 }; } },
    "lamp-kroon": { naam: "Kroonluchter", prijs: 400, teken: function (aan, u) {
      var g = "lr" + u, vg = "lv" + u, kr = "lc" + u;
      var goud = "#c99a3a", glans = "#f6d98a";
      var vlam = function (x, y) { return '<circle cx="' + x + '" cy="' + (y - 22) + '" r="10" fill="#ffe9a0" opacity="' + (aan ? ".6" : ".28") + '"/><path d="M' + x + " " + (y - 14) + "Q" + (x - 5.5) + " " + (y - 20) + " " + x + " " + (y - 29) + "Q" + (x + 5.5) + " " + (y - 20) + " " + x + " " + (y - 14) + 'Z" fill="url(#' + vg + ')"/>'; };
      var kaars = function (x, y) { return '<path d="M' + (x - 6) + " " + (y + 2) + "h12l-2.4 6h-7.2Z" + '" fill="' + goud + '"/><rect x="' + (x - 3.8) + '" y="' + (y - 14) + '" width="7.6" height="16" rx="2.2" fill="#fff7e4"/><rect x="' + (x - 3.8) + '" y="' + (y - 14) + '" width="2.6" height="16" rx="1.3" fill="#fff" opacity=".7"/>' + vlam(x, y); };
      var kristal = function (x, y, l, b) { return '<path d="M' + x + " " + y + "l" + (-b) + " " + (l * 0.45) + "L" + x + " " + (y + l) + "l" + b + " " + (-l * 0.55) + 'Z" fill="url(#' + kr + ')"/><path d="M' + x + " " + (y + 2) + "l" + (-b * 0.45) + " " + (l * 0.3) + '" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85" fill="none"/>'; };
      var arm = function (d) { return '<path d="' + d + '" fill="none" stroke="' + goud + '" stroke-width="5" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="' + glans + '" stroke-width="1.6" stroke-linecap="round" opacity=".7" transform="translate(0 -1.2)"/>'; };
      return { svg: snoer(82) + '<g transform="translate(0 22)">' + "<defs>" + lg(vg, "#fff2b0", "#ffb62e") + lg(kr, "#ffffff", "#a9d8ff") + '</defs><path d="M268 60V74" stroke="' + goud + '" stroke-width="4" stroke-linecap="round"/>'
        + arm("M268 84C252 92 236 88 234 76") + arm("M268 84C284 92 300 88 302 76") + arm("M268 84C260 90 252 86 252 74") + arm("M268 84C276 90 284 86 284 74")
        + '<circle cx="268" cy="78" r="7" fill="' + goud + '"/><circle cx="266" cy="76" r="2.2" fill="' + glans + '"/><path d="M268 85v6" stroke="' + goud + '" stroke-width="3" stroke-linecap="round"/>'
        + kaars(234, 76) + kaars(302, 76) + kaars(252, 74) + kaars(284, 74)
        + kristal(268, 90, 20, 5.5) + kristal(248, 90, 14, 4) + kristal(288, 90, 14, 4) + kristal(238, 86, 11, 3.2) + kristal(298, 86, 11, 3.2) + '</g>', gx: 268, gy: 100 }; } },
    "lamp-regenboog": { naam: "Regenboogkap", prijs: 350, teken: function (aan, u) {
      var kl = aan ? ["#ff8a7a", "#ffb86a", "#ffe27a", "#8fe0a0", "#7ec4ff"] : ["#ef5d50", "#f99a3c", "#ffd23f", "#5fc97a", "#4aa8f0"];
      var bogen = [34, 28, 22, 16, 10].map(function (r, i) { return '<path d="M' + (268 - r) + " 88A" + r + " " + r + " 0 0 1 " + (268 + r) + ' 88Z" fill="' + kl[i] + '"/>'; }).join("");
      return { svg: snoer(52) + bogen + '<ellipse cx="268" cy="89" rx="35" ry="4.6" fill="' + (aan ? "#fffbe0" : "#fff") + '"/><g fill="#fff"><circle cx="234" cy="92" r="7"/><circle cx="244" cy="95" r="7"/><circle cx="292" cy="95" r="7"/><circle cx="302" cy="92" r="7"/></g><path d="M240 78Q244 66 254 62" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>', gx: 268, gy: 94 }; } },
    "lamp-druppels": { naam: "Wolk met druppels", prijs: 350, teken: function (aan, u) {
      var g = "ld" + u, dr = aan ? "#ffe9a8" : "#8fd0ff";
      var druppel = function (x, len) { return '<path d="M' + x + " 94V" + (94 + len) + '" stroke="#a98b6b" stroke-width="1.8"/><path d="M' + x + " " + (94 + len) + 'q-5 8 0 13q5 -5 0 -13Z" fill="' + dr + '"/>'; };
      return { svg: snoer(60) + "<defs>" + lg(g, "#ffffff", aan ? "#fff0c4" : "#dcecff") + '</defs><g fill="url(#' + g + ')"><circle cx="248" cy="82" r="13"/><circle cx="268" cy="72" r="18"/><circle cx="289" cy="82" r="13"/><rect x="248" y="80" width="41" height="14" rx="7"/></g><ellipse cx="260" cy="68" rx="6" ry="3.4" fill="#fff"/>' + druppel(252, 10) + druppel(260, 22) + druppel(268, 14) + druppel(276, 26) + druppel(284, 12), gx: 268, gy: 96 }; } },
    "lamp-snoer": { naam: "Lichtsnoer", prijs: 400, vast: true, teken: function (aan, u) {
      var pad = "M238 4", bol = "", kl = aan ? ["#ffe27a", "#ffb4cf", "#9fe3ff", "#b8f0a8"] : ["#ffd04a", "#ff8fb4", "#6cc8f5", "#8fdc78"];
      for (var x = 238; x <= 360; x += 8) pad += "L" + x + " " + (4 + 26 * Math.sin(Math.PI * (x - 238) / 122 * 1.5)).toFixed(1);
      var n = 0;
      for (var x2 = 254; x2 <= 342; x2 += 22, n++) { var y = 4 + 26 * Math.sin(Math.PI * (x2 - 238) / 122 * 1.5); bol += '<rect x="' + (x2 - 2.6) + '" y="' + y.toFixed(1) + '" width="5.2" height="5" rx="1.6" fill="#7b6a5a"/><circle cx="' + x2 + '" cy="' + (y + 10).toFixed(1) + '" r="6" fill="' + kl[n % 4] + '"/><circle cx="' + (x2 - 2) + '" cy="' + (y + 8).toFixed(1) + '" r="1.8" fill="#fff" opacity=".8"/>'; }
      return { svg: '<path d="' + pad + '" fill="none" stroke="#7b6a5a" stroke-width="2.4"/>' + bol, gx: 298, gy: 30 }; } }
  };
  function lampDef(id) { return LAMPEN[id] || LAMPEN.klassiek; }

  // Alle te koop staande kamerspullen (id -> plek, naam, prijs), voor de winkel.
  var ITEMS = {};
  Object.keys(MUREN).forEach(function (id) { ITEMS[id] = { plek: "muur", naam: MUREN[id].naam, prijs: MUREN[id].prijs }; });
  Object.keys(VLOEREN).forEach(function (id) { ITEMS[id] = { plek: "vloer", naam: VLOEREN[id].naam, prijs: VLOEREN[id].prijs }; });
  Object.keys(RAMEN).forEach(function (id) { if (id !== "klassiek") ITEMS[id] = { plek: "raam", naam: RAMEN[id].naam, prijs: RAMEN[id].prijs }; });
  Object.keys(LAMPEN).forEach(function (id) { if (id !== "klassiek") ITEMS[id] = { plek: "lamp", naam: LAMPEN[id].naam, prijs: LAMPEN[id].prijs }; });

  Object.keys(KLEDEN).forEach(function (id) { ITEMS[id] = { plek: "kleed", naam: KLEDEN[id].naam, prijs: KLEDEN[id].prijs }; });

  function isKamer(item) { return !!item && PLEKKEN.indexOf(item.plek) >= 0; }

  window.KamerStijlen = {
    PLEKKEN: PLEKKEN, ITEMS: ITEMS, isKamer: isKamer,
    muurDef: muurDef, muurSvg: muurSvg, vloerDef: vloerDef, vloerSvg: vloerSvg, raamDef: raamDef, lampDef: lampDef, kleedDef: kleedDef,
    mix: mixk
  };
})();
