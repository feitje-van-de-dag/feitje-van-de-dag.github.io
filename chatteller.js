/* Teller op het Chat-tabblad: het aantal berichten aan jou die je nog niet hebt gezien.
   Het gezien-moment staat op de server (profielen/<naam>.chatGezien) en lokaal; het nieuwste telt, zodat de teller op elk toestel klopt.
   Er tellen alleen berichten mee die de chat ook laat zien (geen uitnodigingen voor verwijderde quizzen, geen eigen berichten). */
(function () {
  "use strict";
  function wieNu() {
    try { var w = localStorage.getItem("wie"); return w === "Ritchie" || w === "Rachel" ? w : null; } catch (e) { return null; }
  }
  function lokaal(wie) { try { return localStorage.getItem("chatGezien-" + wie) || ""; } catch (e) { return ""; } }
  async function profiel(db, wie) {
    var d = await db.doc("profielen/" + wie).get();
    return d.exists ? d.data() : {};
  }
  // Zet het gezien-moment (lokaal en op de server). Alleen vooruit, nooit terug.
  window.zetChatGezien = async function (wie, tijd) {
    if (!wie || !tijd) return;
    try { if (tijd > lokaal(wie)) localStorage.setItem("chatGezien-" + wie, tijd); } catch (e) { /* geen opslag */ }
    try {
      var db = await window.claude.use("db");
      var data = await profiel(db, wie);
      if ((data.chatGezien || "") < tijd) { data.chatGezien = tijd; await db.doc("profielen/" + wie).set(data); }
    } catch (e) { /* later opnieuw */ }
  };
  async function tel() {
    try {
      var wie = wieNu();
      if (!wie) return;
      var db = await window.claude.use("db");
      var data = await profiel(db, wie);
      var gezien = data.chatGezien || "";
      var lok = lokaal(wie);
      if (lok > gezien) { gezien = lok; window.zetChatGezien(wie, lok); }
      var bericht = await db.collection("berichten").get();
      var oef = await db.collection("oefquizzen").get();
      var bestaat = new Set(oef.docs.filter(function (d) { return d.exists && !d.data().verwijderd; }).map(function (d) { return d.id; }));
      var n = bericht.docs.filter(function (d) { return d.exists; }).map(function (d) { return d.data(); })
        .filter(function (b) {
          if (!b || !b.tijd || !b.van || b.aan !== wie || b.van === wie || b.tijd <= gezien) return false;
          if (b.soort === "uitdaging" && b.link) {
            var m = /[?&]id=([^&]+)/.exec(b.link);
            if (m && !bestaat.has(decodeURIComponent(m[1]))) return false;
          }
          return true;
        }).length;
      var tab = document.querySelector('.tab[data-tab="chat"]');
      if (!tab) return;
      var teller = tab.querySelector(".tab-teller");
      if (!teller) { teller = document.createElement("span"); teller.className = "tab-teller"; tab.appendChild(teller); }
      teller.textContent = n;
      teller.hidden = n === 0;
    } catch (e) { /* geen teller als er geen verbinding is */ }
  }
  window.telChatMeldingen = tel;
  function aan() { tel(); setInterval(tel, 15000); document.addEventListener("visibilitychange", function () { if (!document.hidden) tel(); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aan); else aan();
})();
