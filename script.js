// API settings
const API_URL = "https://graphql.anilist.co";
const DEFAULT_IMG = "https://via.placeholder.com/300x450/1f2937/9ca3af?text=No+Image";

// Get all HTML elements we need
const el = {
  search: document.getElementById("search-input"),
  btn: document.getElementById("search-btn"), 
  results: document.getElementById("results"),
  grid: document.getElementById("results-grid"),
  count: document.getElementById("result-count"),
  loading: document.getElementById("loading"),
  empty: document.getElementById("empty"),
  modal: document.getElementById("modal"),
  closeModal: document.getElementById("close-modal"),
};

// Set up click and keyboard events
el.btn.addEventListener("click", searchAnime);
el.search.addEventListener("keypress", (e) => e.key === "Enter" && searchAnime());
el.closeModal.addEventListener("click", () => el.modal.classList.add("hidden"));

// Main search function
async function searchAnime() {
  const query = el.search.value.trim();
  if (!query) return;
  
  // Show loading, hide other states
  el.loading.classList.remove("hidden");
  el.results.classList.add("hidden");
  el.empty.classList.add("hidden");
  
  try {
    // Get anime data from API
    const anime = await fetchAnime(query);
    
    // Show results or empty message
    if (anime.length) {
      showResults(anime);
    } else {
      showEmpty(`No results for "${query}"`);
    }
  } catch {
    showEmpty("Error searching. Try again.");
  } finally {
    el.loading.classList.add("hidden");
  }
}

// Get anime data from AniList API
async function fetchAnime(query) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `query ($search: String) {
        Page(page: 1, perPage: 24) {
          media(search: $search, type: ANIME) {
            id title { romaji english native }
            coverImage { extraLarge large }
            averageScore status format genres description
          }
        }
      }`,
      variables: { search: query },
    }),
  });
  const data = await res.json();
  return data.data.Page.media;
}

// Display search results
function showResults(anime) {
  // Create HTML cards for each anime
  el.grid.innerHTML = anime.map(createCard).join("");
  el.count.textContent = `${anime.length} ${anime.length === 1 ? "result" : "results"}`;
  el.results.classList.remove("hidden");
  
  // Add click handler to each card
  document.querySelectorAll(".anime-card").forEach((card, i) => {
    card.addEventListener("click", () => showModal(anime[i]));
  });
}

// Create HTML for single anime card
function createCard(anime) {
  const title = anime.title.english || anime.title.romaji || "Untitled";
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A";
  const img = anime.coverImage?.extraLarge || anime.coverImage?.large || DEFAULT_IMG;
  
  return `
    <div class="anime-card bg-gray-800 rounded-lg overflow-hidden cursor-pointer">
      <div class="relative h-64 group">
        <img src="${img}" alt="${title}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
        <div class="absolute bottom-0 left-0 p-3 w-full">
          <h3 class="text-white font-medium text-sm line-clamp-2">${title}</h3>
          <div class="flex items-center mt-2">
            <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded mr-2">
              <i class="fas fa-star mr-1 text-yellow-400"></i> ${score}
            </span>
            <span class="bg-gray-700 text-white text-xs px-2 py-1 rounded">
              ${anime.format || "TV"}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Show detailed anime info in modal
function showModal(anime) {
  const title = anime.title.english || anime.title.romaji || "Untitled";
  const img = anime.coverImage?.extraLarge || anime.coverImage?.large || DEFAULT_IMG;
  
  // Fill modal with anime data
  document.getElementById("modal-img").src = img;
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-score").textContent = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A";
  document.getElementById("modal-format").textContent = anime.format || "TV";
  document.getElementById("modal-status").textContent = anime.status || "Unknown";
  document.getElementById("modal-desc").textContent = anime.description ? anime.description.replace(/<\/?[^>]+(>|$)/g, "") : "No synopsis available.";
  
  // Add genres
  const genresEl = document.getElementById("modal-genres");
  genresEl.innerHTML = anime.genres?.length
    ? anime.genres.map(g => `<span class="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300 genre-tag">${g}</span>`).join("")
    : '<span class="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">No genres listed</span>';
  
  // Show modal
  el.modal.classList.remove("hidden");
}

// Show empty state message
function showEmpty(message) {
  el.empty.innerHTML = `
    <i class="fas fa-exclamation-circle text-5xl text-gray-500 mb-4"></i>
    <p class="text-gray-400 text-lg">${message}</p>
  `;
  el.empty.classList.remove("hidden");
}