/* "Gezien" voor pop-ups en uitslagschermen: staat lokaal én op de server (profielen/<naam>.gezien), zodat een pop-up niet terugkomt op een ander toestel,
   in een andere browser of na het wissen van de opslag. Zolang de serverstand nog niet is geladen telt alles als gezien (liever even niets dan dubbel). */
(function () {
  "use strict";
  var cache = null, laden = null;
  function lok(k) { try { return !!localStorage.getItem(k); } catch (e) { return false; } }
  function wieNu() { try { var w = localStorage.getItem("wie"); return w === "Ritchie" || w === "Rachel" ? w : null; } catch (e) { return null; } }
  window.Gezien = {
    laad: function (wie) {
      wie = wie || wieNu();
      if (!wie || !window.claude) return Promise.resolve();
      if (!laden) laden = (async function () {
        try { var db = await window.claude.use("db"), d = await db.doc("profielen/" + wie).get(); cache = (d.exists && d.data().gezien) || {}; } catch (e) { cache = {}; }
      })();
      return laden;
    },
    is: function (sleutel) { return lok(sleutel) || cache === null || !!cache[sleutel]; },
    zet: async function (wie, sleutel) {
      wie = wie || wieNu();
      try { localStorage.setItem(sleutel, "1"); } catch (e) { /* geen opslag */ }
      if (cache) cache[sleutel] = true;
      if (!wie || !window.claude) return;
      try {
        var db = await window.claude.use("db"), ref = db.doc("profielen/" + wie), d = await ref.get(), p = d.exists ? d.data() : {};
        p.gezien = p.gezien || {};
        if (!p.gezien[sleutel]) { p.gezien[sleutel] = true; await ref.set(p); }
      } catch (e) { /* lokaal staat het al */ }
    }
  };
  function aan() { Gezien.laad(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", aan); else aan();
})();
