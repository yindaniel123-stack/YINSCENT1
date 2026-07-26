const fs = require("fs");
let h = fs.readFileSync("index.html", "utf8");

function once(from, to) {
  if (!h.includes(from)) {
    console.warn("MISS:", from.slice(0, 80));
    return;
  }
  h = h.replace(from, to);
}

once(
  '<p class="hero__badge">Collection</p>',
  '<p class="hero__badge" data-i18n="hero.badge">Collection</p>'
);
once(
  "<h1>Scented Tealight Candles</h1>",
  '<h1 data-i18n="hero.title">Scented Tealight Candles</h1>'
);
once(
  `        <p class="hero__tagline">
          Fill your space with 12 enchanting aromas — premium wax, long-lasting burn.
        </p>`,
  `        <p class="hero__tagline" data-i18n="hero.tagline">
          Fill your space with 12 enchanting aromas — premium wax, long-lasting burn.
        </p>`
);
once(
  '<a href="#tealights" class="btn btn--gold">Shop all scents</a>',
  '<a href="#tealights" class="btn btn--gold" data-i18n="btn.shop_scents">Shop all scents</a>'
);
once(
  '<section class="category-strip" aria-label="Shop by scent">',
  '<section class="category-strip" aria-label="Shop by scent" data-i18n-attr="aria-label:scent_strip">'
);
once("<h2>Top sellers</h2>", '<h2 data-i18n="top.title">Top sellers</h2>');
once(
  '<a href="#tealights" class="link-more">View all</a>',
  '<a href="#tealights" class="link-more" data-i18n="top.view_all">View all</a>'
);

h = h.replace(
  /<p class="category-intro__eyebrow">New collection<\/p>/g,
  '<p class="category-intro__eyebrow" data-i18n="cat.new">New collection</p>'
);
once(
  '<p class="category-intro__eyebrow">Shop the range</p>',
  '<p class="category-intro__eyebrow" data-i18n="cat.shop_range">Shop the range</p>'
);
h = h.replace(
  /aria-label="Product features"/g,
  'aria-label="Product features" data-i18n-attr="aria-label:cat.features"'
);

const titles = [
  ["All scents", "tealights.title"],
  ["Scented candles", "candles.title"],
  ["Reed diffusers", "diffusers.title"],
  ["Tealight holders", "holders.title"],
  ["Scented sachets", "sachets.title"],
  ["Essential oils", "oils.title"],
  ["Smart aroma diffuser", "smart.title"],
  ["Smart aroma diffuser refill", "refills.title"],
];
titles.forEach(([text, key]) => {
  once(`<h2>${text}</h2>`, `<h2 data-i18n="${key}">${text}</h2>`);
});

const ledes = [
  [
    "Choose from our full range of signature aromas — premium wax, long-lasting burn.",
    "tealights.lede",
  ],
  [
    "Glass jar candles in signature YINSCENT scents — fresh, soft, and made to linger up to 45 hours.",
    "candles.lede",
  ],
  [
    "Flameless home fragrance with natural rattan sticks — available in 35&nbsp;ml and 100&nbsp;ml. Sweet, steady scent for up to 8+ weeks.",
    "diffusers.lede",
  ],
  [
    "Elegant crystal clear glass holders in four beautiful shapes — sturdy, reusable, and perfect for home, parties, and weddings.",
    "holders.lede",
  ],
  [
    "Hangable fragrance sachets with natural fragrance oil — long-lasting aroma for closets, drawers, and any small space.",
    "sachets.lede",
  ],
  [
    "Natural &amp; pure home essences — long-lasting aroma for oil burners and ultrasonic diffusers. Pack of 16 bottles.",
    "oils.lede",
  ],
  [
    "Smart cool-mist diffusers with a digital timer and visible scent tank — three designs, one for every space. Pair with our 100&nbsp;ml refills.",
    "smart.lede",
  ],
  [
    "Fragrance refills for smart aroma diffusers — long-lasting scent with an easy-pour tip. Available in 100&nbsp;ml and 300&nbsp;ml. Pack of 12 bottles.",
    "refills.lede",
  ],
];
ledes.forEach(([text, key]) => {
  const from = `<p class="category-intro__lede">\n          ${text}\n        </p>`;
  const to = `<p class="category-intro__lede" data-i18n="${key}">\n          ${text}\n        </p>`;
  once(from, to);
});

const feats = {
  "Signature aromas": "tealights.f1",
  "Long-lasting burn": "tealights.f2",
  "Premium quality wax": "tealights.f3",
  "Perfect for any space": "tealights.f4",
  "Fresh cotton": "candles.f1",
  "Up to 45 hours": "candles.f2",
  "260g premium wax": "candles.f3",
  "Natural rattan sticks": "diffusers.f1",
  "Up to 8+ weeks": "diffusers.f2",
  "Paraben free": "diffusers.f3",
  "Crystal clear glass": "holders.f1",
  "Sturdy &amp; durable": "holders.f2",
  "12 pcs value pack": "holders.f3",
  "Fits standard tealights": "holders.f4",
  "Natural fragrance oil": "sachets.f1",
  "Long-lasting aroma": "sachets.f2",
  "Built-in hang hook": "sachets.f3",
  "Ideal for any space": "sachets.f4",
  "Natural &amp; pure essence": "oils.f1",
  "Warm &amp; cozy atmosphere": "oils.f2",
  "For burners &amp; diffusers": "oils.f4",
  "Ultra-fine cool mist": "smart.f1",
  "Smart timer display": "smart.f2",
  "Visible scent tank": "smart.f3",
  "Whisper-quiet operation": "smart.f4",
  "Rich fragrance refill": "refills.f1",
  "100&nbsp;ml &amp; 300&nbsp;ml sizes": "refills.f2",
  "For smart aroma diffusers": "refills.f3",
  "12 pcs display pack": "refills.f4",
};

// Feature list items — replace text after icon spans carefully by unique strings
Object.entries(feats).forEach(([text, key]) => {
  const re = new RegExp(
    `(<li><span class="category-features__icon"[^>]*>[^<]*</span>)\\s*${text.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}(</li>)`,
    "g"
  );
  const next = h.replace(re, `$1 <span data-i18n="${key}">${text}</span>$2`);
  if (next === h) console.warn("feat miss", text);
  h = next;
});
// oils Long-lasting aroma shares sachets.f2 translation key (same wording)

// Editorial
once(
  `            <p>
              A home transforms when the air tells stories — with
              <strong>scented tealight candles</strong> that fill every corner with warmth.
            </p>`,
  `            <p data-i18n="editorial.p1" data-i18n-html="true">
              A home transforms when the air tells stories — with
              <strong>scented tealight candles</strong> that fill every corner with warmth.
            </p>`
);
once(
  `          <p>
            Small daily rituals that stir memory and calm:
            <strong>apple, lavender, cinnamon, rose</strong> and twelve more signature scents.
          </p>`,
  `          <p data-i18n="editorial.p2" data-i18n-html="true">
            Small daily rituals that stir memory and calm:
            <strong>apple, lavender, cinnamon, rose</strong> and twelve more signature scents.
          </p>`
);
once(
  `          <p>
            Premium quality wax, a long-lasting burn, and aromas crafted to make any space feel like home.
          </p>`,
  `          <p data-i18n="editorial.p3">
            Premium quality wax, a long-lasting burn, and aromas crafted to make any space feel like home.
          </p>`
);
once(
  '<p class="editorial__closing">Because living beautifully is also breathing beautifully.</p>',
  '<p class="editorial__closing" data-i18n="editorial.closing">Because living beautifully is also breathing beautifully.</p>'
);
once(
  '<span class="editorial__cta">Read our story →</span>',
  '<span class="editorial__cta" data-i18n="editorial.cta">Read our story →</span>'
);

once(
  '<p class="newsletter__eyebrow">Inspiration every week</p>',
  '<p class="newsletter__eyebrow" data-i18n="news.eyebrow">Inspiration every week</p>'
);
once("<h2>Newsletter</h2>", '<h2 data-i18n="news.title">Newsletter</h2>');
once(
  `        <p class="newsletter__lede">
          Subscribe and receive 20% off your first order.<br />
          Scents that surprise you each week — new arrivals, home ideas, and launches
          before anyone else, straight to your inbox.
        </p>`,
  `        <p class="newsletter__lede" data-i18n="news.lede" data-i18n-html="true">
          Subscribe and receive 20% off your first order.<br />
          Scents that surprise you each week — new arrivals, home ideas, and launches
          before anyone else, straight to your inbox.
        </p>`
);
once(
  '<label class="visually-hidden" for="email">Email</label>',
  '<label class="visually-hidden" for="email" data-i18n="news.email">Email</label>'
);
once(
  'placeholder="Your email"',
  'placeholder="Your email" data-i18n-placeholder="news.placeholder"'
);
once(
  '<button type="submit" class="btn btn--gold">Subscribe</button>',
  '<button type="submit" class="btn btn--gold" data-i18n="btn.subscribe">Subscribe</button>'
);

once("<h2>Inspiration</h2>", '<h2 data-i18n="inspire.title">Inspiration</h2>');
once(
  '<p class="section__sub">Details that transform spaces</p>',
  '<p class="section__sub" data-i18n="inspire.sub">Details that transform spaces</p>'
);
once("<h2>As featured in</h2>", '<h2 data-i18n="press.title">As featured in</h2>');
once(
  '<p class="section__sub">What the press says about us</p>',
  '<p class="section__sub" data-i18n="press.sub">What the press says about us</p>'
);
once(
  '<a href="#" class="link-more">View more</a>',
  '<a href="#" class="link-more" data-i18n="press.more">View more</a>'
);

once("<h4>Your account</h4>", '<h4 data-i18n="footer.account">Your account</h4>');
once("<h4>Legal</h4>", '<h4 data-i18n="footer.legal">Legal</h4>');
once("<h4>More</h4>", '<h4 data-i18n="footer.more">More</h4>');
once("<h4>Discover</h4>", '<h4 data-i18n="footer.discover">Discover</h4>');

const footer = [
  ['        <a href="#">My account</a>', '        <a href="#" data-i18n="account.mine">My account</a>'],
  ['        <a href="#">Orders</a>', '        <a href="#" data-i18n="account.orders">Orders</a>'],
  ['        <a href="#">Account details</a>', '        <a href="#" data-i18n="account.details">Account details</a>'],
  ['        <a href="#">Cart</a>', '        <a href="#" data-i18n="account.cart">Cart</a>'],
  ['        <a href="#">Terms &amp; conditions</a>', '        <a href="#" data-i18n="footer.terms">Terms &amp; conditions</a>'],
  ['        <a href="#">Returns</a>', '        <a href="#" data-i18n="footer.returns">Returns</a>'],
  ['        <a href="#">Privacy policy</a>', '        <a href="#" data-i18n="footer.privacy">Privacy policy</a>'],
  ['        <a href="#">Cookie policy</a>', '        <a href="#" data-i18n="footer.cookies">Cookie policy</a>'],
  ['        <a href="#">Contact</a>', '        <a href="#" data-i18n="footer.contact">Contact</a>'],
  ['        <a href="?page=story">About us</a>', '        <a href="?page=story" data-i18n="footer.about">About us</a>'],
  ['        <a href="#" id="pro">Professional access</a>', '        <a href="#" id="pro" data-i18n="footer.pro">Professional access</a>'],
  ['        <a href="#">FAQs</a>', '        <a href="#" data-i18n="footer.faqs">FAQs</a>'],
  ['        <a href="#">Blog</a>', '        <a href="#" data-i18n="footer.blog">Blog</a>'],
  ['        <a href="#">Work with us</a>', '        <a href="#" data-i18n="footer.work">Work with us</a>'],
  ['        <a href="#">Promo codes</a>', '        <a href="#" data-i18n="footer.promo">Promo codes</a>'],
  ['        <a href="#">Student discount</a>', '        <a href="#" data-i18n="footer.student">Student discount</a>'],
];
footer.forEach(([a, b]) => once(a, b));

once(
  '<p class="footer__copy">© <span id="year"></span> YINSCENT. All rights reserved.</p>',
  '<p class="footer__copy" data-i18n="footer.copy" data-i18n-html="true">© {year} YINSCENT. All rights reserved.</p>'
);

once(
  '  <script src="js/paths.js"></script>\n  <script src="js/auth.js"></script>\n  <script src="js/products.js"></script>',
  '  <script src="js/paths.js"></script>\n  <script src="js/i18n.js"></script>\n  <script src="js/auth.js"></script>\n  <script src="js/products.js"></script>'
);

// inspire scent names
["Apple", "Cherry", "Lavender", "Ocean", "Vanilla"].forEach((s) => {
  once(`<span>${s}</span>`, `<span data-i18n-scent="${s}">${s}</span>`);
});

fs.writeFileSync("index.html", h);
console.log("patched main sections");
