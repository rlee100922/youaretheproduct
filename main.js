/* =====================================================================
   MARKETPLACE OF _™
   All app logic: pricing formula, view routing, marketplace dataset,
   product detail, cart, and absorption animation.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. PRICING FORMULA  (deterministic, rule-based — per spec)
   ------------------------------------------------------------------- */
const PRICING = {
  base: 20,
  perScreenHour: 8,
  generation: { genz: 5, millennial: 3, genx: 1 },
  usage: { passive: 5, active: 10, messaging: 4, creator: 20, influencer: 35 },
  influencer100k: 50,
  postingFrequency: { low: 2, medium: 6, high: 12 },
  engagement: { low: 3, medium: 8, high: 15 },
  platform: { tiktok: 10, instagram: 8, youtube: 6, other: 4 },
};

function computeValue(input) {
  const breakdown = [];
  let total = PRICING.base;
  breakdown.push({ label: "Base listing fee", value: PRICING.base });

  // Screen time
  const screenBonus = PRICING.perScreenHour * (input.screenTime || 0);
  total += screenBonus;
  breakdown.push({ label: `Screen time (${input.screenTime}h × $${PRICING.perScreenHour})`, value: screenBonus });

  // Generation
  const genBonus = PRICING.generation[input.generation] || 0;
  total += genBonus;
  breakdown.push({ label: `Generation: ${labelize(input.generation)}`, value: genBonus });

  // Usage types (multi-select)
  let usageSum = 0;
  (input.usage || []).forEach(u => {
    const v = PRICING.usage[u] || 0;
    usageSum += v;
    breakdown.push({ label: `Usage — ${labelize(u)}`, value: v });
  });
  total += usageSum;

  // Influencer tier
  if (input.selfClass === "influencer100k") {
    total += PRICING.influencer100k;
    breakdown.push({ label: "100K+ influencer tier bonus", value: PRICING.influencer100k });
  }

  // Posting frequency
  const postBonus = PRICING.postingFrequency[input.postingFrequency] || 0;
  total += postBonus;
  breakdown.push({ label: `Posting frequency: ${labelize(input.postingFrequency)}`, value: postBonus });

  // Engagement
  const engBonus = PRICING.engagement[input.engagementLevel] || 0;
  total += engBonus;
  breakdown.push({ label: `Engagement: ${labelize(input.engagementLevel)}`, value: engBonus });

  // Primary platform
  const platBonus = PRICING.platform[input.primaryPlatform] || 0;
  total += platBonus;
  breakdown.push({ label: `Primary platform: ${labelize(input.primaryPlatform)}`, value: platBonus });

  // Secondary platform — half bonus
  if (input.secondaryPlatform) {
    const secBonus = Math.round((PRICING.platform[input.secondaryPlatform] || 0) / 2);
    total += secBonus;
    breakdown.push({ label: `Secondary platform: ${labelize(input.secondaryPlatform)}`, value: secBonus });
  }

  return {
    daily: total,
    monthly: total * 30,
    annual: total * 365,
    breakdown,
  };
}

function labelize(s) {
  if (!s) return "—";
  const map = {
    genz: "Gen Z", millennial: "Millennial", genx: "Gen X",
    passive: "Passive scrolling", active: "Active posting",
    messaging: "Messaging / networking", creator: "Creator", influencer: "Influencer",
    low: "Low", medium: "Medium", high: "High",
    tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube", other: "Other",
    casual: "Casual user", active_u: "Active user",
    influencer100k: "100K+ influencer",
  };
  return map[s] || (s.charAt(0).toUpperCase() + s.slice(1));
}

function tierFor(daily) {
  if (daily < 60)  return { key: "low",      label: "Low Yield User" };
  if (daily < 120) return { key: "moderate", label: "Moderate Asset" };
  if (daily < 180) return { key: "high",     label: "High Value Product" };
  return              { key: "premium",  label: "Premium Attention Inventory" };
}

function tagsFor(profile) {
  const tags = [];
  if (profile.screenTime >= 6)             tags.push("high-retention");
  if (profile.engagementLevel === "high")  tags.push("ad-responsive");
  if (profile.generation === "genz")       tags.push("trend-sensitive");
  if (["passive", "messaging"].some(u => profile.usage.includes(u))) tags.push("predictable consumer");
  if (profile.usage.includes("creator") || profile.usage.includes("influencer")) tags.push("creator-tier");
  if (profile.postingFrequency === "high") tags.push("content-surplus");
  return tags;
}

function badgesFor(profile) {
  const badges = [];
  if (profile.daily >= 150) badges.push({ text: "High Monetization Potential", cls: "badge-primary" });
  if (profile.engagementLevel === "high" || profile.daily >= 100)
    badges.push({ text: "Advertiser Preferred", cls: "badge-accent" });
  if (profile.generation === "genz")
    badges.push({ text: "Gen Z Segment", cls: "badge-blue" });
  if (profile.selfClass === "influencer100k" || profile.usage.includes("influencer"))
    badges.push({ text: "Verified Reach", cls: "badge-green" });
  return badges;
}

function formatMoney(n, { decimals = 2 } = {}) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function shortMoney(n) {
  const v = Math.round(Number(n) || 0);
  return "$" + v.toLocaleString("en-US");
}


/* ---------------------------------------------------------------------
   2. PROFILE DATASET  (~70 procedurally generated profiles)
   ------------------------------------------------------------------- */
const FIRST = ["Ava","Noah","Emma","Liam","Mia","Ethan","Zoe","Lucas","Ivy","Owen",
               "Maya","Jules","Kai","Nora","Finn","Leo","Ada","Hugo","Eli","Ruby",
               "Otto","Sasha","Jin","Yuki","Aiden","Rae","Tessa","Milo","Kira","Dante",
               "Priya","Omar","Sana","Theo","Luna","Axel","Nia","Mateo","Iris","Arjun"];
const LAST  = ["Park","Chen","Silva","Ramos","Khan","Nguyen","Patel","Okafor","Adler","Brahms",
               "Voss","Moreau","Lindqvist","Takeda","Abebe","Ozaki","Delgado","Kumar","Fiori","Grey",
               "Novak","Ruiz","Quist","Bader","Mori","Hale","Wenz","Lo","Banerji","Shah"];

const GENS       = ["genz","millennial","genx"];
const PLATFORMS  = ["tiktok","instagram","youtube","other"];
const USAGES     = ["passive","active","messaging","creator","influencer"];
const FREQS      = ["low","medium","high"];
const ENGS       = ["low","medium","high"];
const CLASSES    = ["casual","active","creator","influencer","influencer100k"];

// seeded PRNG so the same grid renders every visit
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = seed;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function buildProfiles(n = 70) {
  const rand = mulberry32(20260423);
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  const pickN = (arr, count) => {
    const c = new Set();
    while (c.size < count) c.add(pick(arr));
    return [...c];
  };

  const out = [];
  for (let i = 0; i < n; i++) {
    // 35% anonymous IDs
    const anonymous = rand() < 0.35;
    const name = anonymous
      ? "@user_" + Math.floor(rand() * 90000 + 10000)
      : `${pick(FIRST)} ${pick(LAST)}`;

    const generation = pick(GENS);
    const primaryPlatform = pick(PLATFORMS);
    let secondaryPlatform = pick(PLATFORMS);
    if (secondaryPlatform === primaryPlatform) secondaryPlatform = "";

    const usage = pickN(USAGES, 1 + Math.floor(rand() * 3));
    const postingFrequency = pick(FREQS);
    const engagementLevel  = pick(ENGS);
    const selfClass        = pick(CLASSES);
    const screenTime       = Math.floor(rand() * 12) + 1;

    const base = {
      id: `MKT-${String(20000 + i).padStart(5,"0")}`,
      name,
      generation,
      primaryPlatform, secondaryPlatform,
      usage, postingFrequency, engagementLevel, selfClass, screenTime,
    };

    const priced = computeValue(base);
    const full = { ...base, daily: priced.daily, monthly: priced.monthly, annual: priced.annual, breakdown: priced.breakdown };
    full.tier = tierFor(full.daily);
    full.tags = tagsFor(full);
    full.badges = badgesFor(full);
    out.push(full);
  }
  return out;
}

const PROFILES = buildProfiles(70);


/* ---------------------------------------------------------------------
   3. STATE
   ------------------------------------------------------------------- */
const state = {
  userProfile: null,   // current user's computed profile (Phase 2)
  cart: [],            // array of profile objects
  absorbedIndex: null, // index into PROFILES that represents the user's card in the grid
  activeFilter: "all",
};


/* ---------------------------------------------------------------------
   4. VIEW ROUTING
   ------------------------------------------------------------------- */
const VIEWS = ["calculator","product","marketplace","detail","cart"];

function showView(name, opts = {}) {
  VIEWS.forEach(v => {
    document.getElementById("view-" + v).classList.toggle("active", v === name);
  });
  // Sync taskbar link active state (except the internal 'product' / 'detail' views)
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.nav === name);
  });
  // Tear down view-specific live timers when leaving
  if (name !== "cart" && typeof portfolioTimer !== "undefined") {
    clearInterval(portfolioTimer);
  }
  if (name !== "detail") {
    if (typeof clearDetailTimers === "function") clearDetailTimers();
  }
  if (!opts.preserveScroll) window.scrollTo({ top: 0, behavior: "instant" });
}

function revealTaskbar() {
  const t = document.getElementById("taskbar");
  if (t.classList.contains("hidden")) {
    t.classList.remove("hidden");
    t.setAttribute("aria-hidden", "false");
  }
}

// Delegate nav buttons
document.addEventListener("click", (e) => {
  const navBtn = e.target.closest("[data-nav]");
  if (!navBtn) return;
  const target = navBtn.dataset.nav;
  if (target === "marketplace") renderMarketplace();
  if (target === "cart") renderCart();
  showView(target);
});


/* ---------------------------------------------------------------------
   5. CALCULATOR INTERACTION
   ------------------------------------------------------------------- */
const form = document.getElementById("valueForm");
const screenSlider = document.getElementById("screenTime");
const screenOut = document.getElementById("screenTimeOut");
screenSlider.addEventListener("input", () => { screenOut.textContent = screenSlider.value; });

// Chip toggle visual state
document.querySelectorAll("#usageChips .chip input").forEach(inp => {
  inp.addEventListener("change", () => {
    inp.closest(".chip").classList.toggle("is-selected", inp.checked);
  });
});

const systemText = document.getElementById("systemText");
const calcBtn = document.getElementById("calcBtn");

const SYSTEM_LINES = [
  "Analyzing behavioral patterns…",
  "Estimating market value…",
  "Assigning product classification…",
  "Finalizing valuation report…",
];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = collectForm();
  if (!data) return;

  calcBtn.disabled = true;
  runSystemText(() => {
    const priced = computeValue(data);
    const profile = { ...data, ...priced };
    profile.id = "MKT-" + Math.floor(Math.random() * 89000 + 10000);
    profile.tier = tierFor(profile.daily);
    profile.tags = tagsFor(profile);
    profile.badges = badgesFor(profile);
    state.userProfile = profile;

    revealTaskbar();
    renderProductPage(profile);
    showView("product");
    calcBtn.disabled = false;

    // Trigger the absorption sequence after the user has time to read the product page
    scheduleAbsorption();
  });
});

function collectForm() {
  const usage = [...document.querySelectorAll("#usageChips input:checked")].map(c => c.value);

  const data = {
    name: document.getElementById("userName").value.trim(),
    generation: document.getElementById("generation").value,
    screenTime: parseInt(document.getElementById("screenTime").value, 10),
    primaryPlatform: document.getElementById("primaryPlatform").value,
    secondaryPlatform: document.getElementById("secondaryPlatform").value,
    usage,
    postingFrequency: document.getElementById("postingFrequency").value,
    engagementLevel: document.getElementById("engagementLevel").value,
    selfClass: document.getElementById("selfClass").value,
  };

  if (!data.name || !data.generation || !data.primaryPlatform
      || !data.postingFrequency || !data.engagementLevel || !data.selfClass) {
    systemText.textContent = "Please complete all required fields.";
    return null;
  }
  return data;
}

function runSystemText(done) {
  let i = 0;
  systemText.textContent = SYSTEM_LINES[0];
  const iv = setInterval(() => {
    i++;
    if (i >= SYSTEM_LINES.length) {
      clearInterval(iv);
      systemText.textContent = "";
      done();
      return;
    }
    systemText.textContent = SYSTEM_LINES[i];
  }, 550);
}


/* ---------------------------------------------------------------------
   6. PRODUCT PAGE RENDER
   ------------------------------------------------------------------- */
function renderProductPage(p) {
  document.getElementById("pName").textContent = p.name;
  document.getElementById("pSku").textContent = p.id;
  document.getElementById("pGen").textContent = labelize(p.generation);
  document.getElementById("pDaily").textContent = formatMoney(p.daily);
  document.getElementById("pMonthly").textContent = shortMoney(p.monthly);
  document.getElementById("pAnnual").textContent = shortMoney(p.annual);

  const tierEl = document.getElementById("pTier");
  tierEl.textContent = p.tier.label;
  tierEl.className = "tier-pill tier-" + p.tier.key;

  // Badges
  const bEl = document.getElementById("pBadges");
  bEl.innerHTML = "";
  p.badges.forEach(b => {
    const s = document.createElement("span");
    s.className = "badge " + b.cls;
    s.textContent = b.text;
    bEl.appendChild(s);
  });

  // Tags
  const tEl = document.getElementById("pTags");
  tEl.innerHTML = "";
  p.tags.forEach(t => {
    const s = document.createElement("span");
    s.className = "tag";
    s.textContent = t;
    tEl.appendChild(s);
  });

  // Specs
  document.getElementById("pSpecScreen").textContent   = `${p.screenTime} hours / day`;
  document.getElementById("pSpecEng").textContent      = labelize(p.engagementLevel);
  const platforms = [labelize(p.primaryPlatform)];
  if (p.secondaryPlatform) platforms.push(labelize(p.secondaryPlatform));
  document.getElementById("pSpecPlatform").textContent = platforms.join(" · ");
  document.getElementById("pSpecPost").textContent     = labelize(p.postingFrequency);
}

document.getElementById("addToCartBtn").addEventListener("click", () => {
  if (!state.userProfile) return;
  addToCart(state.userProfile);
  flashSystemMessage("Asset acquired. Added to portfolio.");
});

document.getElementById("viewSimilarBtn").addEventListener("click", () => {
  // If absorption hasn't happened yet, trigger it now instead of bypassing.
  if (state.absorbedIndex === null && state.userProfile) {
    runAbsorption();
  } else {
    renderMarketplace();
    showView("marketplace");
  }
});


/* ---------------------------------------------------------------------
   7. ABSORPTION ANIMATION (Phase 3)
   ------------------------------------------------------------------- */
function scheduleAbsorption() {
  // Give the user ~3.5s to read the product page before it begins.
  setTimeout(() => {
    if (document.getElementById("view-product").classList.contains("active")) {
      runAbsorption();
    }
  }, 3500);
}

function runAbsorption() {
  // Pre-render the marketplace grid (invisible) with a reserved slot for user card
  const userCardProfile = { ...state.userProfile };
  // Insert user's profile into dataset at a stable random position
  const insertAt = 24 + Math.floor(Math.random() * 22); // middle-ish
  state.absorbedIndex = insertAt;
  // Make a copy of PROFILES with the user inserted
  PROFILES.splice(insertAt, 0, userCardProfile);

  // Build a "ghost" card mirroring the product card position so we can fly it into the grid
  const productCard = document.getElementById("productCard");
  const rect = productCard.getBoundingClientRect();

  const ghost = document.createElement("div");
  ghost.className = "ghost-card";
  ghost.innerHTML = buildCardInnerHTML(userCardProfile);
  ghost.style.top = rect.top + "px";
  ghost.style.left = (rect.left + rect.width / 2 - 130) + "px"; // centered (width 260)
  document.body.appendChild(ghost);

  // Start shrinking the product card, fading in overlay
  requestAnimationFrame(() => {
    productCard.classList.add("is-absorbing");
  });

  // After the shrink, swap to marketplace with the user card as a ghost landing into place
  setTimeout(() => {
    renderMarketplace({ preserveScroll: false, highlightIndex: insertAt });
    showView("marketplace");

    // Find the target card in the grid
    requestAnimationFrame(() => {
      const grid = document.getElementById("profileGrid");
      const targetCard = grid.querySelector(`[data-idx="${insertAt}"]`);
      if (!targetCard) {
        ghost.remove();
        return;
      }
      // Hide the real card momentarily; ghost will become it
      targetCard.style.visibility = "hidden";

      const tRect = targetCard.getBoundingClientRect();
      // Animate ghost to target position + target size
      ghost.style.width = tRect.width + "px";
      ghost.style.padding = "14px";
      ghost.style.transform =
        `translate(${tRect.left - (rect.left + rect.width/2 - 130)}px, ${tRect.top - rect.top}px)`;

      // After transition completes, reveal the real card and fade ghost
      setTimeout(() => {
        ghost.style.opacity = "0";
        targetCard.style.visibility = "visible";
        targetCard.classList.add("is-self");
        setTimeout(() => {
          ghost.remove();
          // After absorption settles, quietly update inventory count
          document.getElementById("inventoryCount").textContent = PROFILES.length;
        }, 700);
      }, 1250);
    });
  }, 900);
}


/* ---------------------------------------------------------------------
   8. MARKETPLACE RENDER
   ------------------------------------------------------------------- */
function renderMarketplace({ highlightIndex } = {}) {
  const grid = document.getElementById("profileGrid");
  grid.innerHTML = "";
  document.getElementById("inventoryCount").textContent = PROFILES.length;

  const filter = state.activeFilter;
  PROFILES.forEach((p, idx) => {
    if (filter !== "all" && p.tier.key !== filter) return;

    const card = document.createElement("button");
    card.className = "card";
    card.setAttribute("data-idx", idx);
    card.innerHTML = buildCardInnerHTML(p);
    card.addEventListener("click", (e) => {
      // Allow overlay CTA to also open detail without bubbling twice
      e.preventDefault();
      openDetail(idx);
    });
    attachCardTargeting(card, p);
    if (idx === highlightIndex) card.classList.add("is-self");
    grid.appendChild(card);
  });
}

/* --- Card hover = active targeting + live valuation ------------------- */
function attachCardTargeting(card, profile) {
  let sparkTimer = null;
  let priceTimer = null;

  const priceEl = card.querySelector(".card-price");
  const deltaEl = card.querySelector(".card-delta");
  const ovValEl = card.querySelector(".ov-value");
  const sparkPoly = card.querySelector(".ov-spark-line");

  // Seed sparkline history from current daily value
  const history = [];
  for (let i = 0; i < 24; i++) history.push(profile.daily * (0.96 + Math.random() * 0.08));

  function renderSpark() {
    if (!sparkPoly) return;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = Math.max(0.01, max - min);
    const pts = history.map((v, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 28 - ((v - min) / range) * 24 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    sparkPoly.setAttribute("points", pts);
  }

  function tickSpark() {
    // small drift ±2%
    const last = history[history.length - 1];
    const drift = last * (Math.random() * 0.04 - 0.02);
    const next = Math.max(5, last + drift);
    history.push(next);
    if (history.length > 24) history.shift();
    renderSpark();
  }

  function tickPrice() {
    // Small fluctuation ±1–3%
    const pct = (Math.random() * 0.06 - 0.03);
    const delta = Math.round(profile.daily * pct * 100) / 100;
    const next = Math.max(5, profile.daily + delta);
    const diff = next - profile.daily;
    profile.daily = Math.round(next * 100) / 100;

    const deltaSign = diff >= 0 ? "up" : "down";
    const deltaText = (diff >= 0 ? "+" : "") + diff.toFixed(2);
    priceEl.textContent = shortMoney(profile.daily) + "/day";
    priceEl.classList.remove("up","down"); priceEl.classList.add(deltaSign);
    if (deltaEl) {
      deltaEl.textContent = deltaText;
      deltaEl.classList.remove("up","down"); deltaEl.classList.add(deltaSign);
    }
    if (ovValEl) {
      ovValEl.textContent = shortMoney(profile.daily);
      ovValEl.classList.remove("up","down"); ovValEl.classList.add(deltaSign);
    }
  }

  card.addEventListener("mouseenter", () => {
    document.getElementById("profileGrid").classList.add("is-targeting");
    card.classList.add("is-targeted");

    // Set scan-line travel distance based on avatar height
    const avatar = card.querySelector(".card-avatar");
    if (avatar) {
      card.style.setProperty("--avatar-h", avatar.offsetHeight + "px");
    }

    // Render initial sparkline right away (before timed reveal)
    renderSpark();

    // Price fluctuation (400–800ms)
    priceTimer = setInterval(tickPrice, 450 + Math.random() * 350);
    // Continuous spark animation
    sparkTimer = setInterval(tickSpark, 350);
  });

  card.addEventListener("mouseleave", () => {
    document.getElementById("profileGrid").classList.remove("is-targeting");
    card.classList.remove("is-targeted");
    clearInterval(priceTimer);
    clearInterval(sparkTimer);
  });

  // CTA click inside overlay
  const cta = card.querySelector(".ov-cta");
  if (cta) cta.addEventListener("click", (e) => {
    e.stopPropagation();
    const idx = parseInt(card.dataset.idx, 10);
    openDetail(idx);
  });
}

function buildCardInnerHTML(p) {
  const initial = (p.name || "?").replace(/^@/, "").trim().charAt(0).toUpperCase() || "?";
  const tierCls = "tier-" + p.tier.key;
  const sku = p.id.replace("MKT-", "HN-") + "-X";
  const engPct = p.engagementLevel === "high" ? 85 : p.engagementLevel === "medium" ? 60 : 35;
  const retPct = Math.min(95, 30 + p.screenTime * 6);
  const adPct  = Math.min(95, 25 + (p.daily / 2.2));

  return `
    <div class="card-head">
      <span>HUMAN UNIT</span>
      <span class="card-id">ID: #${escapeHtml(p.id.replace(/\D/g, "").slice(-5))}</span>
    </div>
    <div class="card-avatar">
      ${initial}
      <div class="scan-line"></div>
    </div>
    <div class="card-meta">
      <span>${labelize(p.generation).toUpperCase()}</span>
      <span>${p.screenTime}H/D</span>
    </div>
    <div class="card-price-row">
      <span class="card-price" data-price="${p.daily}">${shortMoney(p.daily)}/day</span>
      <span class="card-delta">—</span>
    </div>
    <div class="card-barcode"></div>
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span class="card-sku">SKU: ${escapeHtml(sku)}</span>
      <span class="card-tier tier-pill ${tierCls}">${p.tier.label}</span>
    </div>

    <div class="card-overlay">
      <div class="ov-processing">processing behavioral data<span class="dots">...</span></div>

      <div class="ov-bars ov-row" style="animation-delay:.7s">
        <span class="bar-label">ENGAGEMENT</span>
        <span class="bar-track"><span class="bar-fill" style="--w:${(engPct/100).toFixed(2)}"></span></span>
        <span class="bar-label">RETENTION</span>
        <span class="bar-track"><span class="bar-fill" style="--w:${(retPct/100).toFixed(2)}"></span></span>
        <span class="bar-label">AD RESPONSE</span>
        <span class="bar-track"><span class="bar-fill" style="--w:${(adPct/100).toFixed(2)}"></span></span>
      </div>

      <div class="ov-tags">
        ${p.tags.slice(0,6).map((t,i) =>
          `<span class="ov-tag" style="animation-delay:${1 + i*0.1}s">${escapeHtml(t)}</span>`
        ).join("")}
      </div>

      <div class="ov-value-line" style="opacity:0; animation: fadeInUp .3s ease 1.2s forwards">
        <span>
          <span class="ov-cat">DAILY VALUE</span><br>
          <span class="ov-value" data-live="${p.daily}">${shortMoney(p.daily)}</span>
        </span>
        <span class="ov-cat" style="text-align:right">${p.tier.label}</span>
      </div>

      <div class="ov-behavior">
        Behavior Pattern: ${behaviorPattern(p)}
      </div>

      <svg class="ov-spark" viewBox="0 0 100 30" preserveAspectRatio="none">
        <polyline class="ov-spark-line" points=""/>
      </svg>

      <div class="ov-status">status: ${statusFor(p)}</div>

      <button class="ov-cta">view more →</button>
    </div>
  `;
}

function behaviorPattern(p) {
  const parts = [];
  if (p.engagementLevel === "high") parts.push("High engagement");
  else if (p.engagementLevel === "medium") parts.push("Moderate engagement");
  else parts.push("Low engagement");
  if (p.postingFrequency === "high") parts.push("high-frequency posting");
  else if (p.postingFrequency === "medium") parts.push("mid-frequency posting");
  else parts.push("low-frequency posting");
  return parts.join(", ");
}

function statusFor(p) {
  if (p.tier.key === "premium") return "high-demand segment";
  if (p.tier.key === "high") return "advertiser-ready";
  if (p.daily >= 90) return "monetization optimized";
  return "active inventory";
}

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.activeFilter = btn.dataset.filter;
    renderMarketplace();
  });
});


/* ---------------------------------------------------------------------
   9. PRODUCT DETAIL
   ------------------------------------------------------------------- */
let detailTimers = [];
function clearDetailTimers() { detailTimers.forEach(clearInterval); detailTimers = []; }

function openDetail(idx) {
  const p = PROFILES[idx];
  if (!p) return;
  clearDetailTimers();

  const initial = (p.name || "?").replace(/^@/, "").charAt(0).toUpperCase();
  document.getElementById("detailAvatar").textContent = initial;
  document.getElementById("dSku").textContent = p.id.replace("MKT-","HN-") + "-X";
  document.getElementById("dName").textContent = p.name;
  document.getElementById("dGen").textContent = labelize(p.generation).toUpperCase();

  const dailyEl = document.getElementById("dDaily");
  dailyEl.textContent = formatMoney(p.daily);
  document.getElementById("dMonthly").textContent = shortMoney(p.monthly);
  document.getElementById("dAnnual").textContent = shortMoney(p.annual);

  const tierEl = document.getElementById("dTier");
  tierEl.textContent = p.tier.label;
  tierEl.className = "tier-pill tier-" + p.tier.key;

  const tEl = document.getElementById("dTags");
  tEl.innerHTML = "";
  p.tags.forEach(t => {
    const s = document.createElement("span"); s.className = "tag"; s.textContent = t;
    tEl.appendChild(s);
  });

  // COLD VALUATION BREAKDOWN — aggregate to specified line items
  renderColdBreakdown(p);

  // Rationale (mechanical tone)
  document.getElementById("dBehavioral").textContent = rationaleText(p);

  // Asset metrics
  const seed = parseInt(p.id.replace(/\D/g, ""), 10) || 1;
  const r = mulberry32(seed);
  const conv = (3 + r() * 5 + p.daily / 90).toFixed(1) + "%";
  const cons = (60 + r() * 35).toFixed(0) + "%";
  const influence = p.selfClass === "influencer100k" ? "High-tier"
                  : p.usage.includes("influencer") ? "Mid-to-High-tier"
                  : p.usage.includes("creator") ? "Mid-tier"
                  : p.daily >= 120 ? "Mid-tier" : "Low-tier";
  const vol = p.engagementLevel === "high" ? "Moderate"
            : p.engagementLevel === "low"  ? "Low"
            : "Moderate";
  const imp = Math.round(p.daily * (45 + r() * 85)).toLocaleString("en-US");
  const ret = (65 + Math.min(30, p.screenTime * 2.5) + r() * 5).toFixed(0);

  document.getElementById("dConv").textContent = conv;
  document.getElementById("dCons").textContent = cons;
  document.getElementById("dInf").textContent = influence;
  document.getElementById("dVol").textContent = vol;
  document.getElementById("dImp").textContent = imp;
  document.getElementById("dRet").textContent = ret + " / 100";

  // Big chart — seeded 30-point series
  const series = [];
  let v = p.daily * 0.85;
  for (let i = 0; i < 30; i++) {
    v += (r() - 0.48) * p.daily * 0.05;
    v = Math.max(p.daily * 0.6, Math.min(p.daily * 1.2, v));
    series.push(v);
  }
  series.push(p.daily);
  renderDetailChart(series);

  // Live fluctuation on the big price (±1–3%) and chart tick
  const deltaEl = document.getElementById("dDelta");
  let livePrice = p.daily;
  const priceTimer = setInterval(() => {
    const pct = (Math.random() * 0.06 - 0.03);
    const diff = Math.round(livePrice * pct * 100) / 100;
    const next = Math.max(5, livePrice + diff);
    const sign = diff >= 0 ? "up" : "down";

    livePrice = Math.round(next * 100) / 100;
    dailyEl.textContent = formatMoney(livePrice);
    dailyEl.classList.remove("up","down"); dailyEl.classList.add(sign);
    deltaEl.textContent = (diff >= 0 ? "▲ +" : "▼ ") + Math.abs(diff).toFixed(2);
    deltaEl.classList.remove("up","down"); deltaEl.classList.add(sign);

    // Update chart by appending new point
    series.shift();
    series.push(livePrice);
    renderDetailChart(series);
  }, 700);
  detailTimers.push(priceTimer);

  document.getElementById("detailAddCart").onclick = () => {
    // Add a snapshot so the portfolio has its own ticking state
    const snapshot = { ...p, daily: livePrice };
    snapshot.tier = tierFor(snapshot.daily);
    addToCart(snapshot);
    flashSystemMessage("Asset acquired. Added to portfolio.");
  };

  showView("detail");
}

function renderColdBreakdown(p) {
  // Aggregate raw breakdown into the five specified high-level lines.
  let screen = 0, genBonus = 0, engMult = 0, postAdj = 0, influencer = 0, platformSum = 0;
  p.breakdown.forEach(b => {
    if (b.label.startsWith("Screen time")) screen += b.value;
    else if (b.label.startsWith("Generation")) genBonus += b.value;
    else if (b.label.startsWith("Engagement")) engMult += b.value;
    else if (b.label.startsWith("Posting")) postAdj += b.value;
    else if (b.label === "100K+ influencer tier bonus") influencer += b.value;
    else if (b.label.startsWith("Usage — Creator") || b.label.startsWith("Usage — Influencer")) influencer += b.value;
    else if (b.label.startsWith("Primary platform") || b.label.startsWith("Secondary platform")) platformSum += b.value;
  });

  const genLabel = p.generation === "genz" ? "Gen Z Demographic Bonus"
                 : p.generation === "millennial" ? "Millennial Demographic Bonus"
                 : "Gen X Demographic Bonus";

  const lines = [
    { label: "Base Value",                          value: PRICING.base, base: true },
    { label: "Screen Time Premium",                 value: screen },
    { label: genLabel,                              value: genBonus },
    { label: "Engagement Multiplier",               value: engMult },
    { label: "Posting Frequency Adjustment",        value: postAdj },
    { label: "Influencer Visibility Premium",       value: influencer },
    { label: "Platform Distribution Multiplier",    value: platformSum },
  ];

  const bd = document.getElementById("dBreakdown");
  bd.innerHTML = "";
  lines.forEach(l => {
    const li = document.createElement("li");
    const prefix = l.base ? "" : "+ ";
    li.innerHTML = `
      <span class="bd-label">${prefix}${escapeHtml(l.label)}:</span>
      <span class="bd-value">${l.base ? shortMoney(l.value) : "+" + shortMoney(l.value)}</span>`;
    bd.appendChild(li);
  });
  const totalLi = document.createElement("li");
  totalLi.className = "bd-total";
  totalLi.innerHTML = `
    <span class="bd-label">Final Daily Value</span>
    <span class="bd-value">${formatMoney(p.daily)}</span>`;
  bd.appendChild(totalLi);
}

function renderDetailChart(series) {
  const svg = document.getElementById("dBigChart");
  if (!svg) return;
  const W = 300, H = 80;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(0.01, max - min);
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const fillPts = `0,${H} ${pts} ${W},${H}`;
  svg.innerHTML = `
    <polyline class="fill" points="${fillPts}"/>
    <polyline class="line" points="${pts}"/>
  `;
}

function rationaleText(p) {
  const parts = [];
  parts.push("Valuation derived from behavioral consistency and demographic demand.");
  if (p.screenTime >= 7) parts.push("Extended screen time correlates with elevated impression inventory; ad-density ceiling raised.");
  else if (p.screenTime >= 4) parts.push("Screen time supports consistent impression delivery within standard bands.");
  else parts.push("Screen time constrains monetization ceiling to conservative bracket.");

  if (p.generation === "genz") parts.push("Gen Z cohort exhibits highest advertiser bidding pressure in current media markets.");
  else if (p.generation === "millennial") parts.push("Millennial cohort shows stable, spend-heavy downstream behavior.");
  else parts.push("Gen X cohort yields lower CPM but elevated conversion reliability.");

  if (p.engagementLevel === "high") parts.push("Engagement profile supports predictable click-through modeling.");
  if (p.usage.includes("creator") || p.usage.includes("influencer"))
    parts.push("Creator-tier activity contributes content-licensing revenue adjacency.");
  if (p.postingFrequency === "high") parts.push("Posting cadence amplifies algorithmic distribution and resale value.");
  return parts.join(" ");
}


/* ---------------------------------------------------------------------
   10. CART SYSTEM
   ------------------------------------------------------------------- */
function addToCart(profile) {
  // Prevent duplicates
  if (state.cart.find(x => x.id === profile.id)) return;
  state.cart.push(profile);
  updateCartBadge();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(x => x.id !== id);
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  document.getElementById("cartCount").textContent = state.cart.length;
}

let portfolioTimer = null;
function renderCart() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("cartEmpty");
  const summary = document.getElementById("cartSummary");
  const actions = document.querySelector(".portfolio-actions");
  const holdingsHeader = document.querySelector(".section-h-portfolio");

  clearInterval(portfolioTimer);
  list.innerHTML = "";

  if (state.cart.length === 0) {
    empty.style.display = "block";
    summary.style.display = "none";
    if (actions) actions.style.display = "none";
    if (holdingsHeader) holdingsHeader.style.display = "none";
    return;
  }
  empty.style.display = "none";
  summary.style.display = "grid";
  if (actions) actions.style.display = "flex";
  if (holdingsHeader) holdingsHeader.style.display = "block";

  // Initialize sparkline history per holding (stored on the cart entry)
  state.cart.forEach(p => {
    if (!p._hist) {
      p._hist = [];
      for (let i = 0; i < 16; i++) p._hist.push(p.daily * (0.96 + Math.random() * 0.08));
      p._base = p.daily; // reference for portfolio-performance calculation
    }
  });

  state.cart.forEach(p => {
    const item = document.createElement("div");
    item.className = "cart-item";
    item.dataset.pid = p.id;
    const initial = (p.name || "?").replace(/^@/, "").charAt(0).toUpperCase();
    item.innerHTML = `
      <div class="cart-avatar">${initial}</div>
      <div class="cart-info">
        <div class="cart-name">${escapeHtml(p.name)}</div>
        <div class="cart-tags">${p.tags.slice(0,3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      </div>
      <svg class="cart-sparkline" viewBox="0 0 100 28" preserveAspectRatio="none">
        <polyline class="line-up" points=""/>
      </svg>
      <div style="text-align:right;">
        <div class="cart-price" data-price>${formatMoney(p.daily)}</div>
        <div class="cart-delta" data-delta>—</div>
      </div>
      <button class="cart-remove" data-remove="${escapeHtml(p.id)}">Remove</button>
    `;
    list.appendChild(item);
    drawCartSparkline(item, p);
  });

  list.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromCart(btn.dataset.remove);
    });
  });

  // Clicking anywhere else on the item opens detail
  list.querySelectorAll(".cart-item").forEach(item => {
    item.addEventListener("click", () => {
      const pid = item.dataset.pid;
      const idx = PROFILES.findIndex(x => x.id === pid);
      if (idx >= 0) openDetail(idx);
    });
  });

  updatePortfolioTotals();

  // Live portfolio ticking — fluctuate each asset, refresh totals
  portfolioTimer = setInterval(() => {
    state.cart.forEach(p => {
      const pct = (Math.random() * 0.04 - 0.02);
      const diff = p.daily * pct;
      p.daily = Math.max(5, Math.round((p.daily + diff) * 100) / 100);
      p._hist.push(p.daily);
      if (p._hist.length > 16) p._hist.shift();

      const row = list.querySelector(`.cart-item[data-pid="${CSS.escape(p.id)}"]`);
      if (!row) return;
      const priceEl = row.querySelector("[data-price]");
      const deltaEl = row.querySelector("[data-delta]");
      const sign = diff >= 0 ? "up" : "down";
      priceEl.textContent = formatMoney(p.daily);
      priceEl.classList.remove("up","down"); priceEl.classList.add(sign);
      deltaEl.textContent = (diff >= 0 ? "▲ +" : "▼ ") + Math.abs(diff).toFixed(2);
      deltaEl.classList.remove("up","down"); deltaEl.classList.add(sign);
      drawCartSparkline(row, p);
    });
    updatePortfolioTotals();
  }, 900);
}

function drawCartSparkline(item, p) {
  const svg = item.querySelector("svg.cart-sparkline polyline");
  if (!svg || !p._hist) return;
  const min = Math.min(...p._hist);
  const max = Math.max(...p._hist);
  const range = Math.max(0.01, max - min);
  const pts = p._hist.map((v, i) => {
    const x = (i / (p._hist.length - 1)) * 100;
    const y = 28 - ((v - min) / range) * 24 - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  svg.setAttribute("points", pts);
  const first = p._hist[0], last = p._hist[p._hist.length - 1];
  svg.setAttribute("class", last >= first ? "line-up" : "line-down");
}

function updatePortfolioTotals() {
  const totalDaily = state.cart.reduce((s, p) => s + p.daily, 0);
  const totalBase  = state.cart.reduce((s, p) => s + (p._base || p.daily), 0);
  const totalAnnual = totalDaily * 365;

  const perf = totalBase ? ((totalDaily - totalBase) / totalBase) * 100 : 0;
  const sign = perf >= 0 ? "up" : "down";

  const valEl = document.getElementById("cartTotalDaily");
  const deltaEl = document.getElementById("psumDelta");
  valEl.innerHTML = `${formatMoney(totalDaily)}<span class="psum-unit">/day</span>`;
  valEl.classList.remove("up","down"); valEl.classList.add(sign);
  deltaEl.textContent = (perf >= 0 ? "▲ " : "▼ ") + Math.abs(perf).toFixed(2) + "% since acquisition";
  deltaEl.classList.remove("up","down"); deltaEl.classList.add(sign);

  document.getElementById("cartItemCount").textContent = state.cart.length;
  document.getElementById("cartTotalAnnual").textContent = shortMoney(totalAnnual);
  document.getElementById("pfPerf").textContent = (perf >= 0 ? "+" : "") + perf.toFixed(2) + "%";

  // Volatility: stdev of cart returns / mean
  const returns = state.cart.map(p => ((p.daily - (p._base || p.daily)) / (p._base || 1)));
  const mean = returns.reduce((a,b)=>a+b, 0) / Math.max(1, returns.length);
  const variance = returns.reduce((a,b) => a + (b - mean) ** 2, 0) / Math.max(1, returns.length);
  const stdev = Math.sqrt(variance);
  const volText = stdev < 0.01 ? "Low" : stdev < 0.025 ? "Moderate" : "Elevated";
  document.getElementById("pfVol").textContent = volText;

  // Asset distribution: look at tier spread
  const tierCounts = {};
  state.cart.forEach(p => {
    const t = tierFor(p.daily).key;
    tierCounts[t] = (tierCounts[t] || 0) + 1;
  });
  const unique = Object.keys(tierCounts).length;
  const distText = unique >= 3 ? "Balanced" : unique === 2 ? "Concentrated" : "Single-segment";
  document.getElementById("pfDist").textContent = distText;
}

document.getElementById("checkoutBtn").addEventListener("click", () => {
  flashSystemMessage("Acquisition simulated. No live transactions in this environment.");
});


/* ---------------------------------------------------------------------
   11. UTILITIES
   ------------------------------------------------------------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

let sysTimeout;
function flashSystemMessage(msg) {
  const el = document.getElementById("systemText");
  if (!el) return;
  el.textContent = msg;
  clearTimeout(sysTimeout);
  sysTimeout = setTimeout(() => { el.textContent = ""; }, 2200);
}


/* ---------------------------------------------------------------------
   12. THUMBNAIL GALLERY (decorative product page thumbs)
   ------------------------------------------------------------------- */
document.querySelectorAll(".product-gallery .thumb").forEach(th => {
  th.addEventListener("click", () => {
    document.querySelectorAll(".product-gallery .thumb").forEach(t => t.classList.remove("active"));
    th.classList.add("active");
  });
});


/* ---------------------------------------------------------------------
   13. GLOBAL MARKET TICKER
   ------------------------------------------------------------------- */
const TICKER_ITEMS = [
  { key: "AEI", label: "ATTENTION ECONOMY INDEX",  value: 1842.37 },
  { key: "ENG", label: "ENGAGEMENT ETF",           value:  248.61 },
  { key: "CFT", label: "CREATOR FUTURES",          value:   94.22 },
  { key: "ADY", label: "AD YIELD INDEX",           value:   32.08 },
  { key: "RTN", label: "RETENTION MARKET RATE",    value:  118.75 },
  { key: "ALG", label: "ALGORITHMIC DEMAND",       value:   76.41 },
];

function initTicker() {
  const track = document.getElementById("tickerTrack");
  if (!track) return;

  // Each item carries its own history
  TICKER_ITEMS.forEach(it => {
    it.hist = [];
    for (let i = 0; i < 18; i++) it.hist.push(it.value * (0.985 + Math.random() * 0.03));
  });

  // Render items twice in a row for the infinite scroll effect
  const render = () => {
    const html = TICKER_ITEMS.map(it => {
      const first = it.hist[0], last = it.hist[it.hist.length - 1];
      const up = last >= first;
      const diff = last - first;
      const pct = (diff / first) * 100;
      const min = Math.min(...it.hist), max = Math.max(...it.hist);
      const range = Math.max(0.0001, max - min);
      const pts = it.hist.map((v, i) => {
        const x = (i / (it.hist.length - 1)) * 48;
        const y = 14 - ((v - min) / range) * 12 - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      return `
        <div class="ticker-item">
          <span class="ticker-label">${it.label}</span>
          <span class="ticker-value ${up ? "up" : "down"}">${it.value.toFixed(2)}</span>
          <svg class="ticker-spark" viewBox="0 0 48 14" preserveAspectRatio="none">
            <polyline class="${up ? "up" : "down"}" points="${pts}"/>
          </svg>
          <span class="ticker-delta ${up ? "up" : "down"}">
            ${up ? "↑" : "↓"} ${Math.abs(pct).toFixed(2)}%
          </span>
        </div>
      `;
    }).join("");
    track.innerHTML = html + html; // double for seamless scroll
  };

  render();

  // Fluctuate values continuously
  setInterval(() => {
    TICKER_ITEMS.forEach(it => {
      const drift = it.value * ((Math.random() - 0.5) * 0.012);
      it.value = Math.max(1, Math.round((it.value + drift) * 100) / 100);
      it.hist.push(it.value);
      if (it.hist.length > 18) it.hist.shift();
    });
    render();
  }, 1800);
}


/* ---------------------------------------------------------------------
   14. INITIALIZATION
   ------------------------------------------------------------------- */
// Start on calculator (per spec, strictly no landing page)
showView("calculator");
updateCartBadge();
initTicker();
