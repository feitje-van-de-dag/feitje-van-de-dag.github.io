// Namen voor random quizzen en themaquizzen: een naam per thema, en nooit twee keer dezelfde naam.
const NAAM_POOL = {
  "Geschiedenis": ["Tijdreizigers", "Oude Koeien", "Ridders van Toen", "Keizerlijke Kwebbels", "Romeinse Rebellen", "Toga Tijgers", "Middeleeuwse Mopperaars", "Kastelenkoppen"],
  "Aardrijkskunde": ["Wereldwijzen", "Kaartjesrijders", "Verre Reizigers", "Kompaskoppen", "Landkaartkoekjes", "Wereldreisvogels", "Zeilmaatjes", "Bergbeklimmers"],
  "Wetenschap": ["Slimme Snoeten", "Labratten", "Brein Brigade", "Atoomvriendjes", "Proefbuis Pips", "Molecuulmaatjes", "Denkfabriek", "Slimsnuiten"],
  "Natuur": ["Bladgroene Bende", "Boskonijnen", "Groene Gekken", "Bijenbrigade", "Zonnebloemzusjes", "Egeltjes Eigenwijs", "Bosbessenbende", "Vlinderlobbyisten"],
  "Cultuur": ["Kunstzinnige Kwasten", "Filmfreaks", "Muziekmonsters", "Schilderbende", "Operaspoken", "Popcornpiraten", "Toneelkoekjes", "Museumknoeiers"],
  "Sport": ["Snelle Sportkonijnen", "Balbaas", "Spierbalen", "Doelpuntenjagers", "Sprintsterren", "Pingpongpinguïns", "Balletjesbende", "Turnvrolijkheid"],
  "Filosofie": ["Denkers met Dakpannen", "Vraagtekenclub", "Zwijgende Wijzen", "Dwaaslichten", "Gedachtenspinners", "Vraagjesmachine", "Twijfelaars", "Socrates' Snuiters"],
  "Algemene kennis": ["Quizkwiebels", "Weetjesbende", "Slimmerikken", "Feitjesfeest", "Kwissen maar", "Quizmonsters", "Hersenkrakers", "Weetjeswolven"],
  "Gemengd": ["Quizgekken", "Wonderlijke Weetjes", "Kwiskwasten", "Vragenvreters", "Feitjesfeesters", "Kennispiraten", "Quizbalboys", "Kwartetvrienden", "Brainstormers"]
};
// Haalt alle namen op die al in gebruik zijn in deze verzameling.
async function haalGebruikteNamen(coll) {
  try {
    const db = await window.claude.use("db");
    const r = await db.collection(coll).get();
    return r.docs.filter(function (d) { return d.exists; }).map(function (d) { return d.data().naam; }).filter(Boolean);
  } catch (e) { return []; }
}
// bron: een lijst vragen (met onderwerp), of een lijst thema's (themaquiz).
async function kiesNaamVoor(bron, coll) {
  let thema = "Gemengd";
  if (bron.length && typeof bron[0] === "string") {
    if (bron.length === 1 && NAAM_POOL[bron[0]]) thema = bron[0];
  } else {
    const tel = {};
    bron.forEach(function (v) { if (v.onderwerp) tel[v.onderwerp] = (tel[v.onderwerp] || 0) + 1; });
    const top = Object.keys(tel).sort(function (a, b) { return tel[b] - tel[a]; })[0];
    if (top && tel[top] * 2 >= bron.length) thema = top;
  }
  const gebruikt = await haalGebruikteNamen(coll);
  const vrij = NAAM_POOL[thema].concat(NAAM_POOL.Gemengd).filter(function (n) { return gebruikt.indexOf(n) < 0; });
  if (vrij.length) return vrij[Math.floor(Math.random() * vrij.length)];
  return NAAM_POOL[thema][0] + " " + (gebruikt.length + 1);
}

