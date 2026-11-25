/* Skins (kleuren) voor de poppetjes. Elk onderdeel is een apart winkel-item (plek = onderdeel), met 12 kleuren per onderdeel:
   lichaam (lijf + vleugels), buikje, voetjes, wangetjes, snavel en haar (bij Rachel de strik). Item-id = "<onderdeel>-<kleur>", bijvoorbeeld "voeten-geel".
   De standaardkleuren komen overeen met de tekening in poppetje.js, catalogus.html en weekrad.js. */
(function () {
  "use strict";
  var DELEN = [
    { deel: "lichaam", label: "Lichaam", prijs: 250 },
    { deel: "buik", label: "Buikje", prijs: 150 },
    { deel: "voeten", label: "Voetjes", prijs: 100 },
    { deel: "wangen", label: "Wangetjes", prijs: 100 },
    { deel: "snavel", label: "Snavel", prijs: 100 },
    { deel: "haar", label: "Haar", prijs: 150 }
  ];
  var KLEUREN = [
    { id: "zwart", naam: "Zwart", hex: "#4b5170" },
    { id: "wit", naam: "Wit", hex: "#f4f7fb" },
    { id: "groen", naam: "Groen", hex: "#7fcf9b" },
    { id: "geel", naam: "Geel", hex: "#ffd45e" },
    { id: "turkoois", naam: "Turkoois", hex: "#59cfd6" },
    { id: "rood", naam: "Rood", hex: "#ff6b5e" },
    { id: "roze", naam: "Roze", hex: "#ff9ec4" },
    { id: "perzik", naam: "Perzik", hex: "#ffb48f" },
    { id: "munt", naam: "Munt", hex: "#a8e6cf" },
    { id: "framboos", naam: "Framboos", hex: "#ee5f8f" },
    { id: "oranje", naam: "Oranje", hex: "#ffa64d" },
    { id: "hemel", naam: "Hemelblauw", hex: "#8fc8ff" }
  ];
  var STANDAARD = {
    Ritchie: { lijf: "#8fb8ff", vin: "#6c9ce6", buik: "#e6f0ff", voet: "#ffb35c", wang: "#ff9fc0", snavel: "#ff9f3f", haar: "#ff4f9a", haarl: "#ff9fc0" },
    Rachel: { lijf: "#c9b3ff", vin: "#b39bf0", buik: "#e8dfff", voet: "#ffb35c", wang: "#ff9fc0", snavel: "#ff9f3f", haar: "#ff4f9a", haarl: "#ff9fc0" }
  };
  function menger(hex, naar, t) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(naar.slice(1), 16), u = "#";
    [16, 8, 0].forEach(function (s) { var x = Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); u += (x < 16 ? "0" : "") + x.toString(16); });
    return u;
  }
  function isSkin(item) { return !!item && DELEN.some(function (d) { return d.deel === item.plek; }); }
  function kleurVan(item) {
    var k = item.id.slice(item.plek.length + 1);
    return KLEUREN.filter(function (c) { return c.id === k; })[0] || null;
  }
  // Kleuren van een poppetje: standaard, met de gekozen onderdelen erover.
  function delen(naam, items) {
    var c = Object.assign({}, STANDAARD[naam] || STANDAARD.Ritchie);
    (items || []).forEach(function (i) {
      if (!isSkin(i)) return;
      var k = kleurVan(i);
      if (!k) return;
      var h = k.hex;
      if (i.plek === "lichaam") { c.lijf = h; c.vin = menger(h, "#000000", 0.12); }
      else if (i.plek === "buik") c.buik = menger(h, "#ffffff", 0.55);
      else if (i.plek === "voeten") c.voet = h;
      else if (i.plek === "wangen") c.wang = h;
      else if (i.plek === "snavel") c.snavel = h;
      else if (i.plek === "haar") { c.haar = h; c.haarl = menger(h, "#ffffff", 0.45); }
    });
    return c;
  }
  // Een figuur-svg (tekst) van Ritchie of Rachel in de kleuren van de gekozen onderdelen.
  function pas(svg, naam, items) {
    var d = STANDAARD[naam], c = delen(naam, items);
    function ruil(van, naar) { return function (s) { return s.split(van).join(naar); }; }
    var stappen = [
      ruil('fill="' + d.lijf + '"', 'fill="' + c.lijf + '"'), ruil('fill="' + d.vin + '"', 'fill="' + c.vin + '"'),
      ruil('fill="' + d.buik + '"', 'fill="' + c.buik + '"'), ruil('fill="' + d.voet + '"', 'fill="' + c.voet + '"'),
      ruil('<circle cx="100" cy="40" r="6" fill="' + d.haarl + '"', '<circle cx="100" cy="40" r="6" fill="' + c.haarl + '"'),
      ruil('<ellipse cx="56" cy="130" rx="10" ry="6" fill="' + d.wang + '"', '<ellipse cx="56" cy="130" rx="10" ry="6" fill="' + c.wang + '"'),
      ruil('<ellipse cx="144" cy="130" rx="10" ry="6" fill="' + d.wang + '"', '<ellipse cx="144" cy="130" rx="10" ry="6" fill="' + c.wang + '"'),
      ruil('fill="' + d.snavel + '"', 'fill="' + c.snavel + '"'), ruil('fill="' + d.haar + '"', 'fill="' + c.haar + '"')
    ];
    return stappen.reduce(function (s, f) { return f(s); }, svg);
  }
  window.Skins = { DELEN: DELEN, KLEUREN: KLEUREN, STANDAARD: STANDAARD, isSkin: isSkin, delen: delen, pas: pas };
})();
