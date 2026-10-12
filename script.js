
/* =====================================================
   CLOSET GIRL — YOUR WARDROBE, YOUR RULES
   Hollywood Glam • Pink • Black • Gold
===================================================== */

"use strict";

const STORAGE_KEY = "closetGirlData_v1";

const CATEGORIES = [
  "Blusas",
  "Calças",
  "Saias",
  "Vestidos",
  "Shorts",
  "Jaquetas",
  "Casacos",
  "Sapatos",
  "Bolsas",
  "Acessórios",
  "Outros"
];

const CATEGORY_TYPES = {
  top: ["Blusas"],
  bottom: ["Calças", "Saias", "Shorts"],
  dress: ["Vestidos"],
  shoes: ["Sapatos"],
  outerwear: ["Jaquetas", "Casacos"],
  accessories: ["Bolsas", "Acessórios"],
  other: ["Outros"]
};

const OCCASIONS = {
  casual: ["casual", "dia a dia", "passeio"],
  school: ["escola", "faculdade", "estudo"],
  party: ["festa", "balada", "noite"],
  elegant: ["elegante", "chique", "formal"],
  date: ["encontro", "romântico", "jantar"],
  work: ["trabalho", "profissional"],
  summer: ["verão", "calor", "praia"],
  winter: ["inverno", "frio"]
};

const $ = (selector, root = document) =>
  root.querySelector(selector);

const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];

let state = loadState();
let currentOutfit = null;
let currentPhotoData = "";
let searchTerm = "";
let activeCategory = "all";
let activeFilter = "all";

/* =====================================================
   STORAGE
===================================================== */

function emptyState() {
  return {
    clothes: [],
    looks: [],
    favorites: [],
    worn: [],
    settings: {
      name: "",
      style: "chic"
    }
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return emptyState();

    const parsed = JSON.parse(saved);

    return {
      ...emptyState(),
      ...parsed,
      clothes: Array.isArray(parsed.clothes) ? parsed.clothes : [],
      looks: Array.isArray(parsed.looks) ? parsed.looks : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      worn: Array.isArray(parsed.worn) ? parsed.worn : []
    };
  } catch (error) {
    console.error("Não foi possível carregar o closet:", error);
    return emptyState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Erro ao salvar:", error);

    showToast(
      "Não foi possível salvar. As fotos podem estar ocupando muito espaço. Tente usar imagens menores.",
      "error"
    );

    return false;
  }
}

/* =====================================================
   HELPERS
===================================================== */

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getClothing(id) {
  return state.clothes.find(item => item.id === id);
}

function getCategoryType(category) {
  for (const [type, categories] of Object.entries(CATEGORY_TYPES)) {
    if (categories.includes(category)) return type;
  }

  return "other";
}

function getImage(item) {
  return item?.image || "";
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value + "T12:00:00");

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("pt-BR");
}

function getToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/* =====================================================
   NOTIFICATIONS
===================================================== */

function showToast(message, type = "success") {
  let container = $(".toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();

    if (!container.children.length) {
      container.remove();
    }
  }, 3500);
}

/* =====================================================
   NAVIGATION
===================================================== */

function navigateTo(pageId) {
  const target = document.getElementById(pageId);

  if (!target || !target.classList.contains("page")) {
    return;
  }

  $$(".page").forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  $$(".nav-link").forEach(link => {
    const destination = link.dataset.page ||
      link.getAttribute("href")?.replace("#", "");

    link.classList.toggle("active", destination === pageId);

    if (destination === pageId) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const pageTitle = target.dataset.title ||
    target.querySelector("h1")?.textContent?.trim() ||
    target.querySelector("h2")?.textContent?.trim() ||
    "Closet Girl";

  const currentName = $("#currentPageName");

  if (currentName) currentName.textContent = pageTitle;

  const breadcrumb = $(".breadcrumb strong");

  if (breadcrumb) breadcrumb.textContent = pageTitle;

  $("#sidebar")?.classList.remove("open");

  if (window.location.hash !== `#${pageId}`) {
    history.replaceState(null, "", `#${pageId}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setupNavigation() {
  $$(".nav-link, [data-go-to]").forEach(element => {
    element.addEventListener("click", event => {
      const pageId = element.dataset.page ||
        element.dataset.goTo ||
        element.getAttribute("href")?.replace("#", "");

      if (!pageId || !document.getElementById(pageId)?.classList.contains("page")) {
        return;
      }

      event.preventDefault();
      navigateTo(pageId);
    });
  });

  $("#menuToggle")?.addEventListener("click", () => {
    $("#sidebar")?.classList.toggle("open");
  });

  document.addEventListener("click", event => {
    const sidebar = $("#sidebar");
    const toggle = $("#menuToggle");

    if (
      sidebar &&
      window.innerWidth <= 760 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !toggle?.contains(event.target)
    ) {
      sidebar.classList.remove("open");
    }
  });

  const initialPage = location.hash.slice(1);

  if (initialPage && document.getElementById(initialPage)?.classList.contains("page")) {
    navigateTo(initialPage);
  }
}

/* =====================================================
   PHOTO UPLOAD
===================================================== */

function setupPhotoUpload() {
  const input = $("#clothingImage");
  const preview = $("#imagePreview");

  if (!input) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];

    currentPhotoData = "";

    if (preview) preview.innerHTML = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Escolhe um arquivo de imagem válido.", "error");
      input.value = "";
      return;
    }

    // Limita o tamanho para evitar lotar o armazenamento do navegador.
    if (file.size > 5 * 1024 * 1024) {
      showToast("A foto precisa ter até 5 MB.", "error");
      input.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDimension = 900;

        let width = image.width;
        let height = image.height;

        if (width > maxDimension || height > maxDimension) {
          const scale = Math.min(
            maxDimension / width,
            maxDimension / height
          );

          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          showToast("Não foi possível processar essa imagem.", "error");
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        currentPhotoData = canvas.toDataURL("image/jpeg", 0.78);

        if (preview) {
          preview.innerHTML = `
            <img
              src="${currentPhotoData}"
              alt="Prévia da roupa selecionada"
            >
          `;
        }
      };

      image.onerror = () => {
        showToast("Não consegui abrir essa imagem.", "error");
      };

      image.src = event.target.result;
    };

    reader.onerror = () => {
      showToast("Erro ao ler a imagem.", "error");
    };

    reader.readAsDataURL(file);
  });
}

/* =====================================================
   ADD CLOTHING
===================================================== */

function setupClothingForm() {
  const form = $("#clothingForm");

  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = $("#clothingName")?.value.trim();
    const category = $("#clothingCategory")?.value;
    const color = $("#clothingColor")?.value.trim();
    const season = $("#clothingSeason")?.value || "Todas";
    const occasion = $("#clothingOccasion")?.value || "Qualquer ocasião";
    const style = $("#clothingStyle")?.value || "chic";
    const notes = $("#clothingNotes")?.value.trim() || "";

    if (!name || !category) {
      showToast("Preenche o nome e a categoria da roupa.", "error");
      return;
    }

    const clothing = {
      id: createId(),
      name,
      category,
      color,
      season,
      occasion,
      style,
      notes,
      image: currentPhotoData,
      createdAt: new Date().toISOString(),
      timesWorn: 0
    };

    state.clothes.unshift(clothing);

    if (!saveState()) {
      state.clothes = state.clothes.filter(item => item.id !== clothing.id);
      return;
    }

    form.reset();
    currentPhotoData = "";

    const preview = $("#imagePreview");
    if (preview) preview.innerHTML = "";

    renderAll();

    showToast("Peça adicionada ao closet! 💗");
  });
}

/* =====================================================
   CLOTHING CARDS
===================================================== */

function createClothingCard(item) {
  const favorite = state.favorites.includes(item.id);

  const imageHTML = getImage(item)
    ? `<img src="${getImage(item)}" alt="${escapeHTML(item.name)}" loading="lazy">`
    : `<span class="piece-placeholder" aria-hidden="true">♡</span>`;

  return `
    <article class="piece-card">
      <div class="piece-menu">
        <button
          type="button"
          data-favorite="${item.id}"
          aria-label="${favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
          title="${favorite ? "Remover dos favoritos" : "Favoritar"}"
        >${favorite ? "♥" : "♡"}</button>

        <button
          type="button"
          data-delete-clothing="${item.id}"
          aria-label="Excluir ${escapeHTML(item.name)}"
          title="Excluir peça"
        >×</button>
      </div>

      <div class="piece-image">${imageHTML}</div>

      <div class="piece-info">
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.category)}${item.color ? ` · ${escapeHTML(item.color)}` : ""}</p>

        <div class="piece-tags">
          <span class="piece-tag">${escapeHTML(item.season || "Todas as estações")}</span>
          <span class="piece-tag">${escapeHTML(item.style || "chic")}</span>
        </div>
      </div>
    </article>
  `;
}

function getFilteredClothes() {
  return state.clothes.filter(item => {
    const text = normalize([
      item.name,
      item.category,
      item.color,
      item.season,
      item.occasion,
      item.style,
      item.notes
    ].join(" "));

    const matchesSearch = text.includes(normalize(searchTerm));

    const matchesCategory =
      activeCategory === "all" ||
      item.category === activeCategory;

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "favorites" && state.favorites.includes(item.id)) ||
      (activeFilter === "unworn" && !(item.timesWorn > 0));

    return matchesSearch && matchesCategory && matchesFilter;
  });
}

function renderClothes() {
  const container =
    $("#clothingGrid") ||
    $("#piecesGrid") ||
    $("#closetGrid");

  if (!container) return;

  const clothes = getFilteredClothes();

  if (!clothes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>♡</span>
        <h3>${state.clothes.length ? "Nenhuma peça encontrada" : "Seu closet começa aqui"}</h3>
        <p>
          ${state.clothes.length
            ? "Tenta mudar os filtros ou pesquisar por outro nome."
            : "Adiciona fotos das tuas roupas e começa a montar looks incríveis."}
        </p>
        ${state.clothes.length ? "" : `
          <button class="button button-primary" type="button" data-go-to="add-clothing">
            Adicionar primeira peça
          </button>
        `}
      </div>
    `;

    return;
  }

  container.innerHTML = clothes.map(createClothingCard).join("");
}

function setupClothingFilters() {
  const searchInput = $("#clothingSearch") || $("#searchClothes");

  searchInput?.addEventListener("input", () => {
    searchTerm = searchInput.value;
    renderClothes();
  });

  const categorySelect = $("#filterCategory") || $("#clothingFilterCategory");

  categorySelect?.addEventListener("change", () => {
    activeCategory = categorySelect.value || "all";
    renderClothes();
  });

  const filterSelect = $("#filterType") || $("#clothingFilterType");

  filterSelect?.addEventListener("change", () => {
    activeFilter = filterSelect.value || "all";
    renderClothes();
  });

  document.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");
    const deleteButton = event.target.closest("[data-delete-clothing]");

    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.favorite);
    }

    if (deleteButton) {
      deleteClothing(deleteButton.dataset.deleteClothing);
    }
  });
}

function toggleFavorite(id) {
  if (!getClothing(id)) return;

  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(favoriteId => favoriteId !== id);
    showToast("Peça removida dos favoritos.");
  } else {
    state.favorites.push(id);
    showToast("Peça favoritada! 💗");
  }

  saveState();
  renderAll();
}

function deleteClothing(id) {
  const item = getClothing(id);

  if (!item) return;

  const confirmed = window.confirm(
    `Excluir "${item.name}" do closet?`
  );

  if (!confirmed) return;

  state.clothes = state.clothes.filter(piece => piece.id !== id);
  state.favorites = state.favorites.filter(favoriteId => favoriteId !== id);

  state.looks = state.looks.map(look => ({
    ...look,
    pieces: look.pieces.filter(pieceId => pieceId !== id)
  }));

  state.looks = state.looks.filter(look => look.pieces.length > 0);
  state.worn = state.worn.filter(record => record.clothingId !== id);

  saveState();
  renderAll();

  showToast("Peça removida do closet.");
}

/* =====================================================
   OUTFIT GENERATOR
===================================================== */

function getOccasionValue() {
  return $("#outfitOccasion")?.value ||
    $("#occasionSelect")?.value ||
    "casual";
}

function getSeasonValue() {
  return $("#outfitSeason")?.value || "Todas";
}

function matchesOccasion(item, occasion) {
  if (!occasion || occasion === "all") return true;

  const itemOccasion = normalize(item.occasion);
  const keywords = OCCASIONS[occasion] || [occasion];

  return keywords.some(keyword =>
    itemOccasion.includes(normalize(keyword))
  ) ||
    itemOccasion === "" ||
    itemOccasion.includes("qualquer");
}

function matchesSeason(item, season) {
  if (!season || season === "Todas" || season === "all") return true;

  const itemSeason = normalize(item.season);
  const selectedSeason = normalize(season);

  return itemSeason === selectedSeason ||
    itemSeason === "todas" ||
    itemSeason === "todas as estacoes";
}

function chooseRandom(items) {
  if (!items.length) return null;

  return items[Math.floor(Math.random() * items.length)];
}

function generateOutfit() {
  if (!state.clothes.length) {
    showToast("Adiciona algumas roupas primeiro, florzinha! 💗", "error");
    navigateTo("add-clothing");
    return;
  }

  const occasion = getOccasionValue();
  const season = getSeasonValue();

  const available = state.clothes.filter(item =>
    matchesOccasion(item, occasion) &&
    matchesSeason(item, season)
  );

  const dresses = available.filter(item =>
    getCategoryType(item.category) === "dress"
  );

  const tops = available.filter(item =>
    getCategoryType(item.category) === "top"
  );

  const bottoms = available.filter(item =>
    getCategoryType(item.category) === "bottom"
  );

  const shoes = available.filter(item =>
    getCategoryType(item.category) === "shoes"
  );

  const outerwear = available.filter(item =>
    getCategoryType(item.category) === "outerwear"
  );

  const accessories = available.filter(item =>
    getCategoryType(item.category) === "accessories"
  );

  let combination = [];

  // Se houver vestido, ele pode formar a base do look.
  if (dresses.length && (Math.random() > 0.45 || !tops.length || !bottoms.length)) {
    combination.push(chooseRandom(dresses));
  } else {
    if (tops.length) combination.push(chooseRandom(tops));
    if (bottoms.length) combination.push(chooseRandom(bottoms));
  }

  if (shoes.length) combination.push(chooseRandom(shoes));

  // Adiciona uma camada extra e/ou acessório quando houver.
  if (outerwear.length && Math.random() > 0.45) {
    combination.push(chooseRandom(outerwear));
  }

  if (accessories.length && Math.random() > 0.25) {
    combination.push(chooseRandom(accessories));
  }

  combination = combination.filter(Boolean);

  const unique = [...new Map(
    combination.map(item => [item.id, item])
  ).values()];

  if (!unique.length) {
    showToast("Não achei uma combinação. Tenta mudar a ocasião ou a estação.", "error");
    return;
  }

  currentOutfit = {
    id: createId(),
    pieces: unique.map(item => item.id),
    occasion,
    season,
    createdAt: new Date().toISOString()
  };

  renderCurrentOutfit();
}

function renderCurrentOutfit() {
  const container =
    $("#outfitResult") ||
    $("#outfitCombination") ||
    $("#generatedOutfit");

  if (!container || !currentOutfit) return;

  const pieces = currentOutfit.pieces
    .map(getClothing)
    .filter(Boolean);

  if (!pieces.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>♡</span>
        <h3>Monte seu primeiro look</h3>
        <p>Adiciona roupas ao closet e deixa a gente combinar tudo.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="outfit-combination">
      ${pieces.map(item => `
        <article class="outfit-piece">
          ${item.image
            ? `<img src="${item.image}" alt="${escapeHTML(item.name)}">`
            : `<div class="piece-image"><span class="piece-placeholder">♡</span></div>`}

          <div class="outfit-piece-info">
            <span>${escapeHTML(item.category)}</span>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.color || "Sem cor informada")}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function saveCurrentLook() {
  if (!currentOutfit) {
    showToast("Gera um look primeiro!", "error");
    return;
  }

  const name = window.prompt("Dá um nome lindo pra esse look:");

  if (name === null) return;

  const cleanName = name.trim() || "Meu look favorito";

  state.looks.unshift({
    ...currentOutfit,
    id: createId(),
    name: cleanName,
    pieces: [...currentOutfit.pieces]
  });

  if (!saveState()) {
    state.looks.shift();
    return;
  }

  renderAll();
  showToast("Look salvo com sucesso! ✨");
}

function setupOutfitGenerator() {
  const generateButtons = [
    "#generateOutfit",
    "#generateLook",
    "#createOutfit",
    "#surpriseMe"
  ];

  generateButtons.forEach(selector => {
    $(selector)?.addEventListener("click", generateOutfit);
  });

  const saveButtons = ["#saveOutfit", "#saveLook"];

  saveButtons.forEach(selector => {
    $(selector)?.addEventListener("click", saveCurrentLook);
  });

  $("#regenerateOutfit")?.addEventListener("click", generateOutfit);
}

/* =====================================================
   SAVED LOOKS
===================================================== */

function renderLooks() {
  const container = $("#looksGrid") || $("#savedLooksGrid");

  if (!container) return;

  if (!state.looks.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>✧</span>
        <h3>Nenhum look salvo ainda</h3>
        <p>Gera combinações com as tuas roupas e salva as favoritas aqui.</p>
        <button class="button button-primary" type="button" data-go-to="outfit">
          Montar meu look
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = state.looks.map(look => {
    const pieces = look.pieces
      .map(getClothing)
      .filter(Boolean);

    const images = pieces.slice(0, 3).map(item =>
      item.image
        ? `<img src="${item.image}" alt="${escapeHTML(item.name)}" loading="lazy">`
        : `<div class="piece-placeholder">♡</div>`
    ).join("");

    return `
      <article class="look-card">
        <div class="look-card-images">${images}</div>

        <div class="look-card-content">
          <h3>${escapeHTML(look.name || "Meu look")}</h3>
          <p>${pieces.length} ${pieces.length === 1 ? "peça" : "peças"} · ${escapeHTML(look.season || "Qualquer estação")}</p>

          <div class="look-card-actions">
            <button type="button" data-wear-look="${look.id}">Usei esse look</button>
            <button type="button" data-delete-look="${look.id}">Excluir</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function setupSavedLooks() {
  document.addEventListener("click", event => {
    const deleteButton = event.target.closest("[data-delete-look]");
    const wearButton = event.target.closest("[data-wear-look]");

    if (deleteButton) {
      const id = deleteButton.dataset.deleteLook;

      state.looks = state.looks.filter(look => look.id !== id);

      saveState();
      renderAll();

      showToast("Look removido.");
    }

    if (wearButton) {
      const look = state.looks.find(item => item.id === wearButton.dataset.wearLook);

      if (!look) return;

      look.pieces.forEach(id => {
        const item = getClothing(id);

        if (item) item.timesWorn = (item.timesWorn || 0) + 1;

        state.worn.push({
          clothingId: id,
          date: getToday(),
          lookId: look.id
        });
      });

      saveState();
      renderAll();

      showToast("Look registrado! Arrasou 💋");
    }
  });
}

/* =====================================================
   OCCASION BUTTONS
===================================================== */

function setupOccasions() {
  $$(".occasion-card, [data-occasion]").forEach(button => {
    button.addEventListener("click", () => {
      const occasion = button.dataset.occasion ||
        button.dataset.value;

      const selector = $("#outfitOccasion") || $("#occasionSelect");

      if (selector && occasion) {
        selector.value = occasion;
      }

      navigateTo("outfit");
      generateOutfit();
    });
  });
}

/* =====================================================
   SEARCH
===================================================== */

function setupGlobalSearch() {
  const input = $("#globalSearch") || $("#searchInput");

  if (!input) return;

  input.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    searchTerm = input.value.trim();

    if (!searchTerm) return;

    const clothingPage = $("#closet") ||
      $("#wardrobe") ||
      $("#my-clothes");

    if (clothingPage) {
      navigateTo(clothingPage.id);
      renderClothes();
    } else {
      showToast("Pesquisa disponível na página do closet.");
    }
  });
}

/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {
  const totalPieces = state.clothes.length;
  const totalLooks = state.looks.length;
  const totalFavorites = state.favorites.length;
  const totalWorn = state.worn.length;

  const counters = {
    totalPieces,
    totalLooks,
    totalFavorites,
    totalWorn
  };

  Object.entries(counters).forEach(([id, value]) => {
    const element = document.getElementById(id);

    if (element) element.textContent = value;
  });

  const countTargets = {
    "[data-total-clothes]": totalPieces,
    "[data-total-looks]": totalLooks,
    "[data-total-favorites]": totalFavorites,
    "[data-total-worn]": totalWorn
  };

  Object.entries(countTargets).forEach(([selector, value]) => {
    $$(selector).forEach(element => {
      element.textContent = value;
    });
  });

  const recentContainer = $("#recentClothes");

  if (recentContainer) {
    const recent = state.clothes.slice(0, 4);

    recentContainer.innerHTML = recent.length
      ? recent.map(createClothingCard).join("")
      : `
        <div class="empty-state">
          <span>♡</span>
          <h3>O closet tá esperando!</h3>
          <p>Adiciona a primeira peça e começa a criar looks.</p>
        </div>
      `;
  }

  const favoriteContainer = $("#favoriteClothes");

  if (favoriteContainer) {
    const favorites = state.favorites
      .map(getClothing)
      .filter(Boolean)
      .slice(0, 4);

    favoriteContainer.innerHTML = favorites.length
      ? favorites.map(createClothingCard).join("")
      : `
        <div class="empty-state">
          <span>♡</span>
          <h3>Favorita tuas peças</h3>
          <p>Marca as roupas que mais gosta pra encontrá-las rapidinho.</p>
        </div>
      `;
  }
}

/* =====================================================
   STYLE STATISTICS
===================================================== */

function renderStatistics() {
  const container = $("#styleStatistics") || $("#statisticsList");

  if (!container) return;

  if (!state.clothes.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>✧</span>
        <h3>Estatísticas do teu estilo</h3>
        <p>Elas aparecem conforme adiciona roupas ao closet.</p>
      </div>
    `;
    return;
  }

  const counts = {};

  state.clothes.forEach(item => {
    const category = item.category || "Outros";
    counts[category] = (counts[category] || 0) + 1;
  });

  const max = Math.max(...Object.values(counts), 1);

  container.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `
      <div class="stat-row">
        <span>${escapeHTML(category)}</span>
        <div
          class="stat-bar"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="${max}"
          aria-valuenow="${count}"
        >
          <span style="width:${(count / max) * 100}%"></span>
        </div>
        <strong>${count}</strong>
      </div>
    `)
    .join("");
}

/* =====================================================
   EXPORT / BACKUP
===================================================== */

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function exportCloset() {
  const backup = {
    app: "Closet Girl",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state
  };

  downloadFile(
    "closet-girl-backup.json",
    JSON.stringify(backup, null, 2),
    "application/json;charset=utf-8"
  );

  showToast("Backup baixado! Guarda esse arquivo com carinho 💗");
}

function importCloset(file) {
  if (!file) return;

  if (file.size > 20 * 1024 * 1024) {
    showToast("O arquivo é muito grande.", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = parsed.data || parsed;

      if (!Array.isArray(imported.clothes) ||
          !Array.isArray(imported.looks)) {
        throw new Error("Formato inválido");
      }

      const confirmed = window.confirm(
        "Importar esse backup vai substituir os dados atuais. Continuar?"
      );

      if (!confirmed) return;

      state = {
        ...emptyState(),
        ...imported,
        clothes: imported.clothes,
        looks: imported.looks,
        favorites: Array.isArray(imported.favorites) ? imported.favorites : [],
        worn: Array.isArray(imported.worn) ? imported.worn : []
      };

      if (saveState()) {
        renderAll();
        showToast("Backup restaurado com sucesso!");
      }
    } catch (error) {
      showToast("Esse arquivo não parece ser um backup válido.", "error");
    }
  };

  reader.readAsText(file);
}

function setupBackup() {
  $("#exportData")?.addEventListener("click", exportCloset);
  $("#exportBackup")?.addEventListener("click", exportCloset);

  const importInput = $("#importBackup");

  importInput?.addEventListener("change", () => {
    importCloset(importInput.files?.[0]);
    importInput.value = "";
  });

  $("#clearCloset")?.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Apagar todas as roupas, looks e favoritos? Essa ação não pode ser desfeita."
    );

    if (!confirmed) return;

    state = emptyState();
    currentOutfit = null;
    currentPhotoData = "";

    saveState();
    renderAll();

    showToast("Closet limpo.");
  });
}

/* =====================================================
   RENDER EVERYTHING
===================================================== */

function renderAll() {
  renderDashboard();
  renderClothes();
  renderCurrentOutfit();
  renderLooks();
  renderStatistics();
}

/* =====================================================
   START APP
===================================================== */

function initializeCloset() {
  setupNavigation();
  setupPhotoUpload();
  setupClothingForm();
  setupClothingFilters();
  setupOutfitGenerator();
  setupSavedLooks();
  setupOccasions();
  setupGlobalSearch();
  setupBackup();

  renderAll();

  console.log("Closet Girl carregado 💗");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCloset);
} else {
  initializeCloset();
}
