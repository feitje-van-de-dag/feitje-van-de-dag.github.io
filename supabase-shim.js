/* Klok: een nieuwe dag (en zijn quiz) gaat om QUIZ_UUR Nederlandse tijd open; sinds 2026-11-03 is dat 00:00 (voor die tijd was het 07:00). Eén plek: alle pagina's lezen window.QUIZ_UUR. We gebruiken de tijd van de server (niet van het apparaat) en altijd de tijdzone Europe/Amsterdam. */
window.QUIZ_UUR = 0;
window.quizUurTekst = function () { return String(window.QUIZ_UUR).padStart(2, "0") + ":00"; };
// Instapanimaties spelen alleen bij het eerste laden. Daarna wordt de pagina soms opnieuw opgebouwd, en dan mag niets opnieuw inschuiven of flitsen.
setTimeout(function () { document.documentElement.setAttribute("data-geladen", ""); }, 1200);
(function () {
  var verschil = 0;
  function sync() {
    try {
      var t0 = Date.now();
      fetch("supabase-shim.js", { method: "HEAD", cache: "no-store" }).then(function (r) {
        var d = r.headers.get("date");
        if (d) { var t1 = Date.now(); verschil = Date.parse(d) - (t0 + t1) / 2; }
      }).catch(function () { /* apparaatklok blijft */ });
    } catch (e) { /* apparaatklok blijft */ }
  }
  // Huidige servertijd in ms (zelfde klok als amsterdamNu), voor de aftelling naar de volgende quiz.
  window.serverNu = function () { return Date.now() + verschil; };
  window.amsterdamNu = function () {
    var delen = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(Date.now() + verschil)).reduce(function (a, p) { a[p.type] = p.value; return a; }, {});
    return { datum: delen.year + "-" + delen.month + "-" + delen.day, uur: parseInt(delen.hour, 10), minuut: parseInt(delen.minute, 10) };
  };
  // Staat deze dag open? Vroegere dagen altijd, vandaag vanaf QUIZ_UUR, later niet.
  window.dagIsOpen = function (dag) {
    var nu = window.amsterdamNu();
    if (dag < nu.datum) return true;
    return dag === nu.datum && nu.uur >= window.QUIZ_UUR;
  };
  sync();
  setInterval(sync, 10 * 60 * 1000);
})();

/* Wie ben je (Ritchie of Rachel): bewaard in localStorage en in een cookie van een jaar, zodat de keuze blijft staan tot je zelf wisselt. */
(function () {
  function cookie() { var m = document.cookie.match(/(?:^|; )wie=(Ritchie|Rachel)/); return m ? m[1] : null; }
  window.bewaarWie = function (w) {
    try { if (w) localStorage.setItem("wie", w); else localStorage.removeItem("wie"); } catch (e) { /* geen opslag */ }
    try { document.cookie = w ? "wie=" + w + "; max-age=31536000; path=/; SameSite=Lax" : "wie=; max-age=0; path=/; SameSite=Lax"; } catch (e) { /* geen cookies */ }
  };
  try {
    var ls = null;
    try { ls = localStorage.getItem("wie"); } catch (e) { /* geen opslag */ }
    var ck = cookie();
    if (!ls && ck) { try { localStorage.setItem("wie", ck); } catch (e) { /* geen opslag */ } }
    else if (ls && !ck) window.bewaarWie(ls);
  } catch (e) { /* niets te herstellen */ }
})();

/* Opslag in Supabase. Zelfde vorm als de database van de Claude-artifact (doc/collection/where/onSnapshot),
   zodat de dagpagina's ongewijzigd werken. Eén tabel "docs" met kolommen coll, id, data. */
(function () {
  var URL_ = "https://jsbgpvvpckydxaoomcps.supabase.co";
  var KEY_ = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYmdwdnZwY2t5ZHhhb29tY3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTY0NzMsImV4cCI6MjEwODA5MjQ3M30.yc0JG4i--jTdPlIcwWz7tYnd_lH4-wvD8kZVdpXX8u8";
  var H = { apikey: KEY_, Authorization: "Bearer " + KEY_, "Content-Type": "application/json" };

  function fout(status, tekst) {
    var e = new Error("HTTP " + status + (tekst ? ": " + String(tekst).slice(0, 100) : ""));
    e.code = (status >= 400 && status < 500) ? "invalid_argument" : "unavailable";
    return e;
  }

  function split(path) {
    var i = path.indexOf("/");
    return [path.slice(0, i), path.slice(i + 1)];
  }

  function snapDoc(id, data) {
    return { id: id, exists: data != null, data: function () { return data == null ? undefined : data; } };
  }

  // Supabase geeft per verzoek hooguit 1000 rijen, ook als er een hogere limit staat. Daarom in stukken ophalen tot er niets meer komt.
  async function haal(query) {
    var stuk = 1000, alles = [], van = 0;
    for (;;) {
      var r;
      try { r = await fetch(URL_ + "/rest/v1/docs?" + query + "&order=id.asc&limit=" + stuk + "&offset=" + van, { headers: H }); }
      catch (e) { var x = new Error("geen verbinding"); x.code = "unavailable"; throw x; }
      if (!r.ok) throw fout(r.status, await r.text().catch(function () { return ""; }));
      var rijen = await r.json();
      alles = alles.concat(rijen);
      if (rijen.length < stuk) return alles;
      van += stuk;
    }
  }

  function doc(path) {
    var p = split(path), coll = p[0], id = p[1];
    return {
      id: id,
      get: async function () {
        var rows = await haal("coll=eq." + encodeURIComponent(coll) + "&id=eq." + encodeURIComponent(id) + "&select=data");
        return snapDoc(id, rows.length ? rows[0].data : null);
      },
      set: async function (data) {
        var h = Object.assign({}, H, {
          Prefer: ((coll === "attempts" || coll === "themaantwoorden") ? "resolution=ignore-duplicates," : "resolution=merge-duplicates,") + "return=minimal"
        });
        var r;
        try {
          r = await fetch(URL_ + "/rest/v1/docs?on_conflict=coll,id", {
            method: "POST", headers: h,
            body: JSON.stringify({ coll: coll, id: id, data: data, updated_at: new Date().toISOString() })
          });
        } catch (e) { var x = new Error("geen verbinding"); x.code = "unavailable"; throw x; }
        if (!r.ok) throw fout(r.status, await r.text().catch(function () { return ""; }));
      }
    };
  }

  function query(coll, wheres) {
    function pas(d) {
      return wheres.every(function (w) {
        var v = d[w[0]];
        if (w[1] === "==") return v === w[2];
        if (w[1] === "!=") return v !== w[2];
        return true;
      });
    }
    var q = {
      where: function (f, op, v) { return query(coll, wheres.concat([[f, op, v]])); },
      get: async function () {
        // Filters op tekst en getallen gaan naar de server, zodat niet elke keer de hele collectie binnenkomt.
        var extra = wheres.filter(function (w) {
          return w[1] === "==" && /^[A-Za-z_]+$/.test(w[0]) && (typeof w[2] === "string" || typeof w[2] === "number");
        }).map(function (w) { return "&data-%3E%3E" + w[0] + "=eq." + encodeURIComponent(String(w[2])); }).join("");
        var rows = await haal("coll=eq." + encodeURIComponent(coll) + extra + "&select=id,data");
        var docs = rows.filter(function (r) { return pas(r.data || {}); })
          .map(function (r) { return snapDoc(r.id, r.data); });
        return { docs: docs, size: docs.length, empty: docs.length === 0 };
      },
      // Eén veld van alle documenten ophalen (bijvoorbeeld het onderwerp van elke vraag), zonder de rest.
      veld: async function (naam) {
        if (!/^[A-Za-z_]+$/.test(naam)) throw new Error("ongeldig veld");
        var rows = await haal("coll=eq." + encodeURIComponent(coll) + "&select=id,w:data-%3E%3E" + naam);
        var uit = {};
        rows.forEach(function (r) { uit[r.id] = r.w; });
        return uit;
      },
      ids: async function () {
        var rows = await haal("coll=eq." + encodeURIComponent(coll) + "&select=id");
        return rows.map(function (r) { return r.id; });
      },
      onSnapshot: function (next, err) {
        var stop = false, vorige = "";
        async function tik() {
          if (stop) return;
          try {
            var s = await q.get();
            var sig = JSON.stringify(s.docs.map(function (d) { return [d.id, d.data()]; }));
            if (sig !== vorige) { vorige = sig; if (!stop) next(s); }
          } catch (e) { /* volgende ronde opnieuw */ }
        }
        tik();
        var t = setInterval(tik, 10000);
        return function () { stop = true; clearInterval(t); };
      }
    };
    return q;
  }

  var db = {
    doc: doc,
    collection: function (coll) { return query(coll, []); }
  };

  // Een database-functie aanroepen (bijvoorbeeld een quiz verwijderen).
  window.dbRpc = async function (naam, args) {
    var r;
    try { r = await fetch(URL_ + "/rest/v1/rpc/" + encodeURIComponent(naam), { method: "POST", headers: H, body: JSON.stringify(args || {}) }); }
    catch (e) { var x = new Error("geen verbinding"); x.code = "unavailable"; throw x; }
    if (!r.ok) throw fout(r.status, await r.text().catch(function () { return ""; }));
    return r.json();
  };

  window.claude = window.claude || {};
  window.claude.use = function (naam) {
    return Promise.resolve(naam === "db" ? db : null);
  };
})();
