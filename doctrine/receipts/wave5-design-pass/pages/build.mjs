// Wave 5 design pass: static pages that write the markup the components would render,
// over the real tokens.css / system.css / app.css plus the proposed wave5.css.
import fs from "node:fs";
const out = new URL(".", import.meta.url).pathname;

const icon = (n) => `<svg class="icon sm" aria-hidden><use href="#i-${n}"/></svg>`;
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none"><symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></symbol><symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></symbol></svg>`;

const header = (current = "") => `
<header class="header public">
  <a class="wordmark" href="#">The Gallery</a>
  <span class="header-end">
    <a class="navlink wide" href="#"${current === "saved" ? ' aria-current="page"' : ""}>Saved</a>
    <a class="navlink wide" href="#"${current === "workshops" ? ' aria-current="page"' : ""}>Workshops</a>
    <a class="navlink wide" href="#"${current === "makers" ? ' aria-current="page"' : ""}>For Makers</a>
    <a class="navlink" href="#">Search</a>
    <button class="navlink menu-btn" type="button" aria-haspopup="dialog">Menu</button>
  </span>
</header>`;

const colophon = `
<footer class="colophon">
  <span class="sign">The Gallery, Bengaluru</span>
  <a href="#">About</a><a href="#">Participation</a><a href="#">Privacy</a>
</footer>`;

const page = (title, body, { extra = "" } = {}) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<link rel="stylesheet" href="gallery/app.css"><link rel="stylesheet" href="gallery/wave5.css"></head>
<body>${sprite}<div class="phone public-page">${body}</div>${extra}</body></html>`;

const W = {
  vessel: { img: "vessel", t: "Monsoon Vessel No. 4", m: "Anika Rao", p: "₹6,800", o: "portrait" },
  textile: { img: "textile", t: "Indigo Dabu Runner", m: "Dhaaga Studio", p: "₹4,200", o: "landscape" },
  paper: { img: "paper", t: "Folded Study I", m: "Paper Room Collective", p: "₹3,000", o: "square" },
  bowl: { img: "bowl", t: "Tea Bowl, Kiln Ash", m: "Anika Rao", p: "₹2,400", o: "square" },
  lota: { img: "lota", t: "Brass Lota", m: "Kasturi Metal Studio", s: "Sold", o: "portrait" },
  bottle: { img: "bottle", t: "Night Bottle", m: "Anika Rao", o: "portrait" },
  wood: { img: "wood", t: "Neem Platter", m: "Tarun Wood", p: "₹5,500", o: "landscape" },
  salt: { img: "salt", t: "Three Salt Bowls", m: "Anika Rao", p: "₹1,800", o: "landscape" },
};
const tile = (w, { wide = false, inGallery = false, cls = "" } = {}) => `
  <a class="tile${wide ? " wide" : ""}${cls ? " " + cls : ""}" href="#">
    <div class="frame ${wide || inGallery ? "" : "r45"}"><img src="img/${w.img}.jpg" alt=""></div>
    <div class="gt">${w.t}</div>
    ${inGallery ? "" : `<div class="gm">${w.m}</div>`}
    ${w.s ? `<div class="gs">${w.s}</div>` : w.p ? `<div class="gs"><span class="price">${w.p}</span></div>` : ""}
  </a>`;

// 1. The entrance while nothing is on view (the live site today).
const opening = `
${header()}
<main id="main">
  <section class="opening">
    <h1>The first works are being hung.</h1>
    <p>The Gallery shows art and craft by makers in Bengaluru, potters, weavers, woodworkers and metalworkers, each in a room of their own. The first rooms open soon.</p>
    <div class="links">
      <a href="#">What The Gallery is</a>
      <a class="quiet" href="#">Are you a maker? Open your gallery</a>
    </div>
  </section>
</main>
${colophon}`;
fs.writeFileSync(out + "entrance-empty.html", page("The Gallery", opening));

// 2. The menu, open, over the empty entrance (phone).
const menu = `
<div class="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu">
  <header class="header public"><a class="wordmark" href="#">The Gallery</a>
    <span class="header-end"><a class="navlink" href="#">Search</a><button class="navlink" type="button">Close</button></span></header>
  <ul><li><a href="#">Saved</a></li><li><a href="#">Workshops</a></li><li><a href="#">For Makers</a></li></ul>
  ${colophon}
</div>`;
fs.writeFileSync(out + "menu.html", page("The Gallery", opening, { extra: menu }));

// 3. The entrance with work on view.
const f = W.vessel;
const entrance = `
${header()}
<main id="main">
  <div class="featured5">
    <a class="feature-img" href="#"><img src="img/${f.img}.jpg" alt="Monsoon Vessel No. 4, a tall wood-fired stoneware jar"></a>
    <div class="feature-label">
      <h1 class="title"><a href="#" style="color:inherit;text-decoration:none">${f.t}</a></h1>
      <div class="makerline"><a href="#">${f.m}</a>, wood-fired stoneware</div>
      <div class="status"><span class="price">${f.p}</span></div>
    </div>
  </div>
  <section class="wall5">
    <h2>Recently hung</h2>
    <div class="grid">
      ${tile(W.textile, { wide: true })}${tile(W.paper)}
      ${tile(W.bowl)}${tile(W.lota)}${tile(W.bottle)}
      ${tile(W.wood, { wide: true })}${tile(W.salt)}
    </div>
  </section>
  <nav class="materials-line" aria-label="Material"><span>By material</span>
    <a href="#">Clay</a><a href="#">Textile</a><a href="#">Wood</a><a href="#">Metal</a><a href="#">Paper</a></nav>
</main>
${colophon}`;
fs.writeFileSync(out + "entrance.html", page("The Gallery", entrance));

// 4. A work.
const work = `
${header()}
<main id="main" class="work5">
  <div class="imgs">
    <div class="strip" role="region" aria-label="Images of Monsoon Vessel No. 4" tabindex="0">
      <img src="img/vessel.jpg" alt="Monsoon Vessel No. 4, whole"><img src="img/vessel-2.jpg" alt="Monsoon Vessel No. 4, the shoulder"><img src="img/vessel-3.jpg" alt="Monsoon Vessel No. 4, the ash on the neck">
    </div>
    <div class="progress" aria-label="Image 1 of 3"><i class="on"></i><i></i><i></i></div>
  </div>
  <div class="side">
    <div class="label">
      <h1 class="title">Monsoon Vessel No. 4</h1>
      <div class="makerline"><a href="#">Anika Rao</a>, wood-fired stoneware</div>
      <div class="status available"><span>Available</span><span class="price">₹6,800</span></div>
      <p class="note5">Fired for three days in a shared wood kiln. The ash settled on the shoulder and ran where the flame turned.</p>
      <div class="facts">
        <div class="dims">H 34 × W 26 cm · 2026</div>
        <div class="when">Updated 3 days ago</div>
      </div>
      <div class="save"><a class="textlink plain" href="#">Save this work</a></div>
      <div class="contact-inline"><a class="btn primary" href="#">${icon("chat")} Message Anika</a></div>
    </div>
  </div>
</main>
${colophon}
<div style="height:76px" class="bar-room"></div>`;
fs.writeFileSync(out + "work.html", page("Monsoon Vessel No. 4 by Anika Rao",
  work, { extra: `<div class="workbar"><a class="btn primary" href="#">${icon("chat")} Message Anika</a></div>` }));

// 5. A maker's gallery.
const maker = `
${header()}
<main id="main">
  <section class="maker5">
    <h1>Anika Rao</h1>
    <div class="where">Bengaluru, India<br>Open to commissions</div>
    <p class="practice">I fire with wood twice a year, in a kiln I share with two potters at the edge of the city. The ash falls where it wants; I keep what it decides.</p>
  </section>
  <section class="hang5" aria-label="Work">
    ${tile(W.vessel, { inGallery: true, cls: "first" })}
    ${tile(W.bowl, { inGallery: true, cls: "second" })}
    ${tile(W.bottle, { inGallery: true })}
    ${tile(W.salt, { inGallery: true, wide: true })}
  </section>
  <section class="contact5">
    <h2>Talk to Anika</h2>
    <p>You'll be talking to Anika directly. Price, delivery and payment are agreed between you.</p>
    <a class="btn primary" href="#">${icon("chat")} Message Anika on WhatsApp</a>
    <div class="others"><a class="textlink plain" href="#">Email</a><a class="textlink plain" href="#">Website</a></div>
  </section>
</main>
${colophon}`;
fs.writeFileSync(out + "maker.html", page("Anika Rao", maker));

// 6. For Makers.
const makers = `
${header("makers")}
<main id="main" class="makers5">
  <div class="intro">
    <h1>Show your work the way a gallery would</h1>
    <p>A room of your own: your photographs at full size, your words beside them. Visitors message you directly, on WhatsApp or by email. There is no commission on your sales.</p>
    <div class="do"><a class="btn primary" href="#">Open your gallery</a><a class="textlink plain" href="#">I already have an account</a></div>
  </div>
  <div class="how-wrap">
    <ol class="how">
      <li><span><b>Make an account</b>With the email you sign in with. It is never shown.</span></li>
      <li><span><b>Hang your work</b>Photographs from your phone, a title, a few words.</span></li>
      <li><span><b>Open your gallery</b>Publish, and share its link wherever you like.</span></li>
    </ol>
    <p class="fine">Who can open a gallery, and what we act on: <a href="#" style="color:inherit">Participation</a>.</p>
  </div>
</main>
${colophon}`;
fs.writeFileSync(out + "for-makers.html", page("For Makers", makers));
console.log("built");
