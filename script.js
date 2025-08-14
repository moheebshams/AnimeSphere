// API settings
const API_URL = "https://graphql.anilist.co";
const DEFAULT_IMG =
  "https://via.placeholder.com/300x450/0f172a/64748b?text=No+Image";

// DOM elements
const elements = {
  search: document.getElementById("search-input"),
  btn: document.getElementById("search-btn"),
  results: document.getElementById("results"),
  grid: document.getElementById("results-grid"),
  count: document.getElementById("result-count"),
  loading: document.getElementById("loading"),
  empty: document.getElementById("empty"),
  modal: document.getElementById("modal"),
  closeModal: document.getElementById("close-modal"),
  modalImg: document.getElementById("modal-img"),
  modalTitle: document.getElementById("modal-title"),
  modalScore: document.getElementById("modal-score"),
  modalFormat: document.getElementById("modal-format"),
  modalStatus: document.getElementById("modal-status"),
  modalGenres: document.getElementById("modal-genres"),
  modalDesc: document.getElementById("modal-desc"),
};

// Event listeners
elements.btn.addEventListener("click", searchAnime);
elements.search.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchAnime();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !elements.modal.classList.contains("hidden")) {
    closeModal();
  }
});

// Main search function
async function searchAnime() {
  const query = elements.search.value.trim();
  if (!query) return;

  showLoadingState();

  try {
    const anime = await fetchAnime(query);
    if (anime.length) {
      showResults(anime);
    } else {
      elements.results.classList.add("hidden");
      showEmptyState(`No results found for "${query}"`);
    }
  } catch (error) {
    console.error("Search error:", error);
    elements.results.classList.add("hidden");
    showEmptyState("An error occurred while searching. Please try again.");
  } finally {
    elements.loading.classList.add("hidden");
  }
}

// Show loading state
function showLoadingState() {
  elements.loading.classList.remove("hidden");
  elements.results.classList.add("hidden");
  elements.empty.classList.add("hidden");
  elements.grid.innerHTML = Array(10)
    .fill(
      '<div class="bg-slate-800 rounded-xl h-72 animate-pulse shadow-md"></div>'
    )
    .join("");
  elements.results.classList.remove("hidden");
}

// Fetch anime data
async function fetchAnime(query) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query ($search: String) {
            Page(page: 1, perPage: 24) {
              media(search: $search, type: ANIME) {
                id
                title { romaji english native }
                coverImage { extraLarge large }
                averageScore
                status
                format
                genres
                description(asHtml: false)
              }
            }
          }`,
      variables: { search: query },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.data.Page.media;
}

// Display results
function showResults(anime) {
  elements.grid.innerHTML = anime
    .map(
      (anime) => `
        <div class="anime-card bg-slate-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <div class="relative h-72">
            <img src="${
              anime.coverImage?.extraLarge ||
              anime.coverImage?.large ||
              DEFAULT_IMG
            }" 
                 alt="${
                   anime.title.english || anime.title.romaji || "Untitled Anime"
                 }" 
                 class="w-full h-full object-cover transition-opacity duration-300"
                 loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div class="absolute bottom-0 left-0 p-4 w-full">
              <h3 class="text-white font-semibold text-base line-clamp-2">${
                anime.title.english || anime.title.romaji || "Untitled"
              }</h3>
              <div class="flex items-center mt-3 gap-2">
                <span class="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full font-medium">
                  <i class="fas fa-star text-pink-400 mr-1"></i>
                  ${
                    anime.averageScore
                      ? (anime.averageScore / 10).toFixed(1)
                      : "N/A"
                  }
                </span>
                <span class="bg-slate-700 text-white text-sm px-3 py-1 rounded-full font-medium">
                  ${anime.format || "TV"}
                </span>
              </div>
            </div>
          </div>
        </div>
      `
    )
    .join("");

  elements.count.textContent = `${anime.length} ${
    anime.length === 1 ? "result" : "results"
  }`;
  elements.results.classList.remove("hidden");

  // Add click handlers
  document.querySelectorAll(".anime-card").forEach((card, i) => {
    card.addEventListener("click", () => showAnimeDetails(anime[i]));
  });
}

// Show anime details in modal
function showAnimeDetails(anime) {
  const title = anime.title.english || anime.title.romaji || "Untitled";

  elements.modalImg.src =
    anime.coverImage?.extraLarge || anime.coverImage?.large || DEFAULT_IMG;
  elements.modalImg.alt = `${title} Cover Image`;
  elements.modalTitle.textContent = title;
  elements.modalScore.textContent = anime.averageScore
    ? (anime.averageScore / 10).toFixed(1)
    : "N/A";
  elements.modalFormat.textContent = anime.format || "TV";
  elements.modalStatus.textContent = anime.status || "Unknown";
  elements.modalDesc.textContent = anime.description
    ? anime.description.replace(/<\/?[^>]+(>|$)/g, "")
    : "No synopsis available.";

  elements.modalGenres.innerHTML = anime.genres?.length
    ? anime.genres
        .map(
          (genre) =>
            `<span class="bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-300 font-medium">${genre}</span>`
        )
        .join("")
    : '<span class="bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-300 font-medium">No genres listed</span>';

  elements.modal.classList.remove("hidden");
  elements.modal.querySelector("div.relative").classList.add("scale-100");
  document.body.style.overflow = "hidden";
}

// Close modal
function closeModal() {
  elements.modal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

// Show empty state
function showEmptyState(message) {
  elements.empty.innerHTML = `
        <i class="fas fa-exclamation-circle text-5xl text-slate-500 mb-4"></i>
        <p class="text-slate-400 text-lg">${message}</p>
      `;
  elements.empty.classList.remove("hidden");
}

// Initial state
elements.empty.classList.remove("hidden");
