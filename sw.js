// Service worker van Feitje van de dag: toont meldingen op het beginscherm (iPhone: alleen als de app is toegevoegd aan het beginscherm).
// De melding zelf bevat geen tekst. De service worker zoekt het eigen abonnement op, en daarmee wie je bent,
// en haalt de nieuwste melding op die voor die persoon is.

const SUPA = "https://jsbgpvvpckydxaoomcps.supabase.co/rest/v1/docs";
const SLEUTEL = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzYmdwdnZwY2t5ZHhhb29tY3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTY0NzMsImV4cCI6MjEwODA5MjQ3M30.yc0JG4i--jTdPlIcwWz7tYnd_lH4-wvD8kZVdpXX8u8";
const KOP = { apikey: SLEUTEL, Authorization: "Bearer " + SLEUTEL };

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

async function haalTekst(endpoint) {
  let wie = null;
  if (endpoint) {
    const a = await fetch(SUPA + "?coll=eq.pushabonnementen&select=data&data-%3E%3Eendpoint=eq." + encodeURIComponent(endpoint), { headers: KOP });
    const rijen = await a.json();
    wie = rijen[0] && rijen[0].data ? rijen[0].data.wie : null;
  }
  const m = await fetch(SUPA + "?coll=eq.meldingen&select=id,data&order=updated_at.desc&limit=10", { headers: KOP });
  const meldingen = await m.json();
  const nu = Date.now();
  const kandidaten = meldingen.filter((r) => {
    const voor = r.data.voor;
    const past = !voor || voor === wie;
    const vers = r.data.gezet_op && nu - Date.parse(r.data.gezet_op) < 5 * 60 * 1000;
    return past && vers;
  });
  // Toon de nieuwste melding die dit toestel nog niet heeft getoond, zodat twee meldingen kort na elkaar niet twee keer dezelfde tekst laten zien.
  const getoond = await caches.open("feitje-getoond");
  for (const r of kandidaten) {
    const sleutel = "/getoond/" + encodeURIComponent(r.id);
    if (!(await getoond.match(sleutel))) {
      await getoond.put(sleutel, new Response("1"));
      return { tekst: r.data.tekst, id: r.id };
    }
  }
  const laatste = kandidaten[0];
  return { tekst: laatste ? laatste.data.tekst : "Er is iets nieuws voor je in Feitje van de dag.", id: laatste ? laatste.id : "feitje" };
}

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let tekst = "Er is iets nieuws voor je in Feitje van de dag.";
    let id = "feitje";
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const r = await haalTekst(sub ? sub.endpoint : null);
      tekst = r.tekst; id = r.id;
    } catch (e) { /* bij geen verbinding de algemene tekst */ }
    await self.registration.showNotification("Feitje van de dag", {
      body: tekst,
      icon: "icon-192.png?v=4",
      badge: "icon-192.png?v=4",
      tag: id, // eigen tag per melding: dezelfde melding vervangt zichzelf, een andere komt erbij
      data: { url: "index.html" },
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const lijst = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of lijst) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("index.html");
  })());
});
