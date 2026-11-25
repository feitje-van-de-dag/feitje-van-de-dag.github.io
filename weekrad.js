/* Weekwinnaar-rad: pop-up na de melding "de week is afgelopen".
   De winnaar van de afgelopen week draait één keer. De database kiest de prijs (rad_draai); deze pagina laat het alleen mooi zien.
   Eerste echte rad: de week die op maandag 2 november 2026 begint (dus de eerste keer op maandag 9 november).
   Testen zonder iets op te slaan: open een pagina met ?testrad=1 */
(function () {
  "use strict";
  var EERSTE_WEEK = "2026-11-02";
  var NAMEN_ = ["Ritchie", "Rachel"];
  var BASIS = { Ritchie: '<svg viewBox="0 0 200 220" aria-hidden="true"><ellipse cx="100" cy="206" rx="46" ry="6" fill="#2b2333" opacity=".12"/><ellipse cx="82" cy="196" rx="13" ry="8" fill="#ffb35c"/><ellipse cx="118" cy="196" rx="13" ry="8" fill="#ffb35c"/><path d="M34 118 Q18 138 28 164 Q44 160 50 138Z" fill="#6c9ce6"/><path d="M166 118 Q182 138 172 164 Q156 160 150 138Z" fill="#6c9ce6"/><path d="M100 26 C146 26 170 60 170 116 C170 172 140 198 100 198 C60 198 30 172 30 116 C30 60 54 26 100 26Z" fill="#8fb8ff"/><path d="M84 32 Q86 12 98 18 Q96 8 108 12 Q110 22 118 28 Q104 30 92 36Z" fill="#ff4f9a"/><ellipse cx="100" cy="156" rx="40" ry="34" fill="#e6f0ff"/><ellipse cx="78" cy="106" rx="10" ry="13" fill="#2b2333"/><ellipse cx="122" cy="106" rx="10" ry="13" fill="#2b2333"/><circle cx="81" cy="101" r="3.5" fill="#fff"/><circle cx="125" cy="101" r="3.5" fill="#fff"/><ellipse cx="56" cy="130" rx="10" ry="6" fill="#ff9fc0"/><ellipse cx="144" cy="130" rx="10" ry="6" fill="#ff9fc0"/><path d="M94 122 Q100 128 106 122 Q100 134 94 122Z" fill="#ff9f3f"/></svg>', Rachel: '<svg viewBox="0 0 200 220" aria-hidden="true"><ellipse cx="100" cy="206" rx="46" ry="6" fill="#2b2333" opacity=".12"/><ellipse cx="82" cy="196" rx="13" ry="8" fill="#ffb35c"/><ellipse cx="118" cy="196" rx="13" ry="8" fill="#ffb35c"/><path d="M34 118 Q18 138 28 164 Q44 160 50 138Z" fill="#b39bf0"/><path d="M166 118 Q182 138 172 164 Q156 160 150 138Z" fill="#b39bf0"/><path d="M100 26 C146 26 170 60 170 116 C170 172 140 198 100 198 C60 198 30 172 30 116 C30 60 54 26 100 26Z" fill="#c9b3ff"/><path d="M100 40 Q84 18 72 26 Q62 36 74 52 Q86 56 100 40Z" fill="#ff4f9a"/><path d="M100 40 Q116 18 128 26 Q138 36 126 52 Q114 56 100 40Z" fill="#ff4f9a"/><circle cx="100" cy="40" r="6" fill="#ff9fc0"/><ellipse cx="100" cy="156" rx="40" ry="34" fill="#e8dfff"/><ellipse cx="78" cy="106" rx="10" ry="13" fill="#2b2333"/><ellipse cx="122" cy="106" rx="10" ry="13" fill="#2b2333"/><circle cx="81" cy="101" r="3.5" fill="#fff"/><circle cx="125" cy="101" r="3.5" fill="#fff"/><path d="M68 96 L64 90 M74 92 L71 86 M132 96 L136 90 M126 92 L129 86" stroke="#2b2333" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="56" cy="130" rx="10" ry="6" fill="#ff9fc0"/><ellipse cx="144" cy="130" rx="10" ry="6" fill="#ff9fc0"/><path d="M94 122 Q100 128 106 122 Q100 134 94 122Z" fill="#ff9f3f"/></svg>' };
  var GEM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 9.6L7.4 4.6L10 9.6Z" fill="#b9d6ff" stroke="#b9d6ff" stroke-width="1.6" stroke-linejoin="round"/><path d="M7.4 4.6H16.6L14.2 9.6H9.8Z" fill="#e6f0ff" stroke="#e6f0ff" stroke-width="1.6" stroke-linejoin="round"/><path d="M16.6 4.6L20.6 9.6L14 9.6Z" fill="#8fb8ff" stroke="#8fb8ff" stroke-width="1.6" stroke-linejoin="round"/><path d="M3.4 9.6H9.8L12 19.6Z" fill="#6c9ce6" stroke="#6c9ce6" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.8 9.6H14.2L12 19.6Z" fill="#8fb8ff" stroke="#8fb8ff" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.2 9.6H20.6L12 19.6Z" fill="#5b86cf" stroke="#5b86cf" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var STER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z" fill="#ffd23f" stroke="#ffd23f" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var KLEUR = { xp: "#dcc8ff", munt: "#b8d4ff", item: "#ffe066" };

  function wieNu() { try { var w = localStorage.getItem("wie"); return NAMEN_.indexOf(w) >= 0 ? w : null; } catch (e) { return null; } }
  function bewaar(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* zonder opslag dan elke keer */ } }
  function heeft(k) { try { return !!localStorage.getItem(k); } catch (e) { return false; } }
  // "Gezien" staat ook op de server (profielen/<naam>.radGezien), zodat een pop-up niet terugkomt op een ander toestel, in een andere browser of na het wissen van de opslag.
  async function serverGezien(db, wie, week) {
    try { var d = await db.doc("profielen/" + wie).get(); var p = d.exists ? d.data() : {}; return !!(p.radGezien && p.radGezien[week]); } catch (e) { return false; }
  }
  async function zetServerGezien(wie, week) {
    try {
      var db = await window.claude.use("db"), ref = db.doc("profielen/" + wie), d = await ref.get(), p = d.exists ? d.data() : {};
      p.radGezien = p.radGezien || {};
      if (!p.radGezien[week]) { p.radGezien[week] = true; await ref.set(p); }
    } catch (e) { /* lokaal staat het al */ }
  }
  function zetGezien(week, wie) { bewaar("radGezien-" + week + "-" + wie, "1"); zetServerGezien(wie, week); }
  function plus(iso, d) { var t = new Date(iso + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + d); return t.toISOString().slice(0, 10); }
  function wacht(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function stijl() {
    if (document.getElementById("rad-stijl")) return;
    var s = document.createElement("style");
    s.id = "rad-stijl";
    s.textContent = [
      ".rad-overlay { position: fixed; inset: 0; z-index: 600; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(43,35,51,.55); animation: rad-in .3s ease-out; }",
      "@keyframes rad-in { from { opacity: 0; } to { opacity: 1; } }",
      ".rad-kaart { width: 100%; max-width: 380px; max-height: 96vh; overflow: auto; background: var(--vlak, #fff); border-radius: 26px; box-shadow: 0 8px 0 var(--lijn, #ffd1e6); padding: 20px 16px 18px; text-align: center; color: var(--inkt, #2b2333); }",
      ".rad-kaart h2 { margin: 2px 0 4px; font-size: 24px; }",
      ".rad-kaart .rad-k { font-size: 12px; letter-spacing: .12em; font-weight: 800; color: var(--roze-diep, #e0307f); }",
      ".rad-kaart .rad-sub { margin: 0 0 8px; min-height: 1.3em; color: var(--zacht, #6b5f86); font-weight: 700; }",
      ".rad-stand { display: flex; justify-content: center; gap: 26px; margin: 6px 0 4px; }",
      ".rad-stand div { text-align: center; font-weight: 700; } .rad-stand b { display: block; font-size: 30px; line-height: 1.1; }",
      ".rad-stand .win b { color: var(--roze-diep, #e0307f); }",
      ".rad-wiel { position: relative; width: 300px; height: 300px; margin: 14px auto 8px; }",
      ".rad-in { position: absolute; left: 0; top: 0; width: 380px; height: 380px; transform: scale(.7895); transform-origin: 0 0; }",
      ".rad-draai { position: absolute; inset: 0; will-change: transform; }",
      ".rad-draai > svg { position: absolute; inset: 0; width: 380px; height: 380px; filter: drop-shadow(0 6px 0 rgba(255,209,230,.9)); }",
      ".rad-draai > svg path { transition: fill .35s ease; }",
      ".rad-lab { position: absolute; transform: translate(-50%, -50%); opacity: 0; transition: opacity .3s ease; }",
      ".rad-lab > div { display: flex; flex-direction: column; align-items: center; gap: 2px; font-weight: 800; transform: scale(.4); transition: transform .35s cubic-bezier(.3,1.6,.5,1); }",
      ".rad-lab.aan { opacity: 1; } .rad-lab.aan > div { transform: scale(1); }",
      ".rad-lab svg { width: 30px; height: 30px; display: block; }",
      ".rad-lab .rl-t { font-size: 17px; color: #2b2333; }",
      ".rad-naaf { position: absolute; left: 50%; top: 50%; width: 62px; height: 62px; margin: -31px 0 0 -31px; border-radius: 50%; background: #ff5fa2; box-shadow: 0 4px 0 #d63a85; }",
      ".rad-wijzer { position: absolute; left: 50%; top: -12px; margin-left: -14px; border-left: 14px solid transparent; border-right: 14px solid transparent; border-top: 26px solid #2b2333; z-index: 2; }",
      ".rad-knop { margin-top: 8px; }",
      ".rad-pop { position: relative; width: 56px; height: 62px; display: inline-block; }",
      ".rad-pop svg.basis, .rad-pop img { position: absolute; inset: 0; width: 100%; height: 100%; }",
      ".rad-uitslag { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 6px 0; animation: rad-hup .6s cubic-bezier(.3,1.6,.5,1); }",
      "@keyframes rad-hup { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }",
      ".rad-groot { width: 150px; height: 165px; } .rad-groot svg { width: 100%; height: 100%; }",
      ".rad-uitslag .rad-ico { width: 96px; height: 96px; } .rad-uitslag .rad-ico svg { width: 100%; height: 100%; }",
      "@media (prefers-reduced-motion: reduce) { .rad-lab > div { transition: none; } .rad-overlay, .rad-uitslag { animation: none; } }"
    ].join("\n");
    document.head.appendChild(s);
  }

  function pop(naam, itemId, w, items) {
    var laag = "";
    var it = itemId && items[itemId];
    if (it) laag = '<img src="icons/winkel/' + it.icoon + '?v=5" alt="" draggable="false">';
    return '<span class="rad-pop" style="width:' + w + 'px;height:' + Math.round(w * 1.1) + 'px">' + BASIS[naam].replace("<svg ", '<svg class="basis" ') + laag + "</span>";
  }

  function wielHTML(seg, wie, items) {
    var cx = 190, R = 185, n = seg.length, wed = "", lab = "";
    seg.forEach(function (s, i) {
      var a0 = (-90 + i * 360 / n) * Math.PI / 180, a1 = (-90 + (i + 1) * 360 / n) * Math.PI / 180;
      var x0 = cx + R * Math.cos(a0), y0 = cx + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cx + R * Math.sin(a1);
      wed += '<path data-i="' + i + '" d="M' + cx + " " + cx + "L" + x0.toFixed(1) + " " + y0.toFixed(1) + "A" + R + " " + R + " 0 0 1 " + x1.toFixed(1) + " " + y1.toFixed(1) + 'Z" style="fill:#ece8f5" stroke="#fff" stroke-width="4"/>';
      var mid = (-90 + (i + .5) * 360 / n) * Math.PI / 180, r = 122;
      var lx = cx + r * Math.cos(mid), ly = cx + r * Math.sin(mid), rot = (i + .5) * 360 / n;
      var inner;
      if (s.type === "item") inner = pop(wie, s.item, 56, items);
      else if (s.type === "munt") inner = GEM + '<span class="rl-t">' + s.waarde + "</span>";
      else inner = STER + '<span class="rl-t" style="font-size:14px">+' + s.waarde + " XP</span>";
      lab += '<div class="rad-lab" data-i="' + i + '" style="left:' + lx.toFixed(1) + "px;top:" + ly.toFixed(1) + 'px;transform:translate(-50%,-50%) rotate(' + rot + 'deg)"><div>' + inner + "</div></div>";
    });
    return '<div class="rad-wiel"><div class="rad-in"><div class="rad-draai" id="rad-draai"><svg viewBox="0 0 380 380"><circle cx="190" cy="190" r="188" fill="#fff"/>' + wed + "</svg>" + lab + '</div><div class="rad-naaf"></div></div><div class="rad-wijzer"></div></div>';
  }

  function confetti() {
    var c = document.createElement("canvas");
    c.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:700";
    document.body.appendChild(c);
    var dpr = window.devicePixelRatio || 1;
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    var ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    var kl = ["#ff4f9a", "#1fae8c", "#ffb35c", "#8fb8ff", "#ffe066", "#b5e27a"], st = [], start = performance.now(), duur = 3600;
    for (var i = 0; i < 150; i++) st.push({ x: innerWidth / 2 + (Math.random() - .5) * 120, y: innerHeight * .4, vx: (Math.random() - .5) * 11, vy: -Math.random() * 12 - 5, r: Math.random() * 6 + 5, k: kl[i % kl.length], h: Math.random() * 6, d: (Math.random() - .5) * .3 });
    (function tik(nu) {
      var t = nu - start; ctx.clearRect(0, 0, innerWidth, innerHeight);
      st.forEach(function (s) { s.vy += .3; s.vx *= .99; s.x += s.vx; s.y += s.vy; s.h += s.d; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.h); ctx.globalAlpha = Math.max(0, 1 - t / duur); ctx.fillStyle = s.k; ctx.fillRect(-s.r / 2, -s.r / 4, s.r, s.r / 2); ctx.restore(); });
      if (t < duur) requestAnimationFrame(tik); else c.remove();
    })(start);
  }

  function overlay() {
    var o = document.createElement("div");
    o.className = "rad-overlay";
    o.innerHTML = '<div class="rad-kaart" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(o);
    return { o: o, k: o.firstChild, sluit: function () { o.remove(); } };
  }

  function prijsTekst(u, items) {
    if (u.type === "item") { var it = items[u.item]; return it ? it.naam : "Nieuw item"; }
    if (u.type === "xp") return "+" + u.waarde + " XP";
    return u.waarde + " diamanten";
  }
  function prijsBeeld(u, naam, items) {
    if (u.type === "item") return '<div class="rad-groot">' + pop(naam, u.item, 150, items) + "</div>";
    if (u.type === "xp") return '<div class="rad-ico">' + STER + "</div>";
    return '<div class="rad-ico">' + GEM + "</div>";
  }

  // De pop-up: eerst de winnaar en de stand, dan bouwt het rad zich op, dan draait de winnaar.
  async function toonRad(rad, wie, items, test) {
    stijl();
    var ov = overlay(), k = ov.k, winnaar = rad.winnaar, ik = winnaar === wie;
    var p = rad.punten || {};
    var stand = (p.Ritchie != null && p.Rachel != null)
      ? '<div class="rad-stand">' + NAMEN_.map(function (n) { return '<div class="' + (n === winnaar ? "win" : "") + '">' + pop(n, null, 52, items) + "<b>" + p[n] + "</b>" + n + "</div>"; }).join("") + "</div>" : "";
    var gratis = rad.soort === "gratis";
    k.innerHTML = '<div class="rad-k">' + (gratis ? "GRATIS DRAAI" : "WEEKWINNAAR") + "</div><h2>" + (gratis ? "Een gratis draai voor jou!" : (ik ? "Jij wint de week!" : winnaar + " wint de week!")) + "</h2>" + (gratis ? "" : stand) + '<p class="rad-sub" id="rad-sub">Het rad wordt opgebouwd...</p>' + wielHTML(rad.segmenten, winnaar, items) + '<div id="rad-onder"></div>';
    var sub = k.querySelector("#rad-sub"), onder = k.querySelector("#rad-onder"), draai = k.querySelector("#rad-draai");
    await wacht(500);
    for (var i = 0; i < rad.segmenten.length; i++) {
      var w = draai.querySelector('path[data-i="' + i + '"]'), l = draai.querySelector('.rad-lab[data-i="' + i + '"]');
      w.style.fill = KLEUR[rad.segmenten[i].type]; l.classList.add("aan");
      if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* niet overal */ } }
      await wacht(300);
    }
    if (!ik && !rad.gedraaid) {
      sub.textContent = winnaar + " mag aan het rad draaien.";
      onder.innerHTML = '<button type="button" class="opnieuw rad-knop" id="rad-sluit">Sluiten</button>';
      onder.querySelector("#rad-sluit").onclick = ov.sluit;
      return;
    }
    sub.textContent = ik ? "Draai aan het rad voor een prijs." : "";
    onder.innerHTML = ik ? '<button type="button" class="tq-knop rad-knop" id="rad-start">Draai het rad</button>' : "";
    if (!ik) { return; }
    onder.querySelector("#rad-start").onclick = async function () {
      this.disabled = true;
      sub.textContent = "Spannend...";
      var uitkomst;
      if (test) {
        var idx = Math.floor(Math.random() * rad.segmenten.length);
        uitkomst = Object.assign({ index: idx }, rad.segmenten[idx]);
      } else {
        var r;
        try { r = await window.dbRpc("rad_draai", { p_week: rad.week, p_wie: wie }); } catch (e) { r = { ok: false, reden: "geen verbinding" }; }
        if (!r || !r.ok) {
          if (r && r.uitkomst) { uitkomst = r.uitkomst; } else {
            sub.textContent = "Dat lukte niet: " + ((r && r.reden) || "probeer het nog eens") + ".";
            this.disabled = false; return;
          }
        } else uitkomst = r.uitkomst;
      }
      var doel = 360 * 6 - (uitkomst.index + .5) * 360 / rad.segmenten.length;
      draai.style.transition = "transform 7s cubic-bezier(.08,.62,.12,1)";
      void draai.offsetWidth;
      draai.style.transform = "rotate(" + doel + "deg)";
      setTimeout(function () { sub.textContent = "Het rad vertraagt..."; }, 4300);
      await wacht(7300);
      sub.textContent = "...";
      await wacht(700);
      zetGezien(rad.week, wie);
      confetti();
      k.innerHTML = '<div class="rad-k">JE WINT</div><h2>' + prijsTekst(uitkomst, items) + '!</h2><p class="rad-sub">' + (uitkomst.type === "item" ? "Staat nu in jouw kast" : (test ? "Test: er is niets opgeslagen" : "Erbij gedaan")) + '</p><div class="rad-uitslag">' + prijsBeeld(uitkomst, wie, items) + '</div><button type="button" class="tq-knop rad-knop" id="rad-mooi">Claim</button>' + (test && uitkomst.type === "item" ? '<p class="rad-sub" style="margin-top:8px">Test: er is niets opgeslagen</p>' : "");
      k.querySelector("#rad-mooi").onclick = function () { ov.sluit(); if (!test && /catalogus/.test(location.pathname)) location.reload(); };
    };
  }

  // Uitkomst van iemand anders (of van jezelf op een ander toestel), één keer.
  function toonUitkomst(rad, wie, items) {
    stijl();
    var ov = overlay(), u = rad.uitkomst, k = ov.k;
    k.innerHTML = '<div class="rad-k">WEEKWINNAAR</div><h2>' + (rad.winnaar === wie ? "Jij won" : rad.winnaar + " won") + ": " + prijsTekst(u, items) + '</h2><div class="rad-uitslag">' + prijsBeeld(u, rad.winnaar, items) + '</div><button type="button" class="tq-knop rad-knop" id="rad-mooi">Claim</button>';
    k.querySelector("#rad-mooi").onclick = ov.sluit;
    zetGezien(rad.week, wie);
  }

  async function laadItems() {
    var lijst = await window.dbRpc("shop_lijst", {});
    var m = {};
    (lijst || []).forEach(function (i) { m[i.id] = i; });
    return m;
  }

  function laad(src) {
    return new Promise(function (ok, fout) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fout; document.head.appendChild(s); });
  }

  async function start() {
    var wie = wieNu();
    if (!wie || !window.dbRpc || !window.claude) return;
    var test = /[?&]testrad=1/.test(location.search);
    var items = await laadItems();
    if (test) {
      var mijn = Object.keys(items).filter(function (id) { return items[id].voor === wie && items[id].plek; });
      var kies = mijn.sort(function () { return Math.random() - .5; }).slice(0, 3);
      var s = function (t, w) { return { type: t, waarde: w }; };
      var it = function (i) { return i ? { type: "item", item: i } : s("munt", 150); };
      await toonRad({ winnaar: wie, week: "test", gedraaid: false, punten: { Ritchie: 4, Rachel: 3 },
        segmenten: [s("xp", 250), s("munt", 100), it(kies[0]), s("xp", 500), s("munt", 200), it(kies[1]), s("xp", 1000), it(kies[2])] }, wie, items, true);
      return;
    }
    var db = await window.claude.use("db");
    // Eenmalige gratis draai (zonder verdiend te hebben): docs coll 'rad', id 'gratis-1-<naam>'.
    var gr = await db.doc("rad/gratis-1-" + wie).get();
    if (gr.exists) {
      var g = gr.data();
      if (!g.gedraaid) { await toonRad(g, wie, items, false); return; }
      if (!heeft("radGezien-" + g.week + "-" + wie) && !(await serverGezien(db, wie, g.week))) { toonUitkomst(g, wie, items); return; }
    }
    var maandag = weekVan(new Date().toISOString());
    var vorige = plus(maandag, -7);
    if (vorige < EERSTE_WEEK) return;
    var doc = await db.doc("rad/" + vorige).get();
    var rad = doc.exists ? doc.data() : null;
    if (!rad && !heeft("radGeen-" + vorige)) {
      if (typeof berekenStand === "undefined") { await laad("uitslagen.js?v=2"); }
      var stand = await berekenStand(db);
      var at = await db.collection("attempts").get();
      var pogingen = at.docs.filter(function (d) { return d.exists; }).map(function (d) { return d.data(); });
      var pt = puntenVanWeek(vorige, stand.rijen, pogingen);
      if (pt.Ritchie === pt.Rachel) { bewaar("radGeen-" + vorige, "1"); return; }
      var winnaar = pt.Ritchie > pt.Rachel ? "Ritchie" : "Rachel";
      rad = await window.dbRpc("rad_klaarzetten", { p_week: vorige, p_winnaar: winnaar, p_ritchie: pt.Ritchie, p_rachel: pt.Rachel });
    }
    if (!rad) return;
    var gezien = heeft("radGezien-" + vorige + "-" + wie) || await serverGezien(db, wie, vorige);
    if (gezien) zetGezien(vorige, wie);
    if (rad.gedraaid) { if (!gezien) toonUitkomst(rad, wie, items); return; }
    if (rad.winnaar === wie) { await toonRad(rad, wie, items, false); return; }
    var dag = new Date().toISOString().slice(0, 10), sl = "radWacht-" + vorige + "-" + wie + "-" + dag;
    if (!heeft(sl)) { bewaar(sl, "1"); await toonRad(rad, wie, items, false); }
  }

  window.startWeekrad = start;
  function aan() { setTimeout(function () { start().catch(function () { /* later opnieuw */ }); }, 1200); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aan); else aan();
})();
