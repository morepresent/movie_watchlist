const searchResultsEl = document.getElementById("searchResults");
const searchEl = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchBar = document.querySelector(".searchBar");
const toggleBtn = document.getElementById("toggleBtn");

let watchList = JSON.parse(localStorage.getItem("watchList")) || [];

// Normalize data so both OMDb and watchlist data are handled the same
function normalizeMovie(movie) {
  return {
    imdbID: movie.imdbID,
    Title: movie.Title || "",
    Poster: movie.Poster || "/images/missing.gif",
    imdbRating: movie.imdbRating || "",
    Genre: movie.Genre || "",
    Runtime: movie.Runtime || "",
    Plot: movie.Plot || "",
  };
}

// HTML for each movie card
function buildHtml(movie, isWatchlistView = false) {
  const m = normalizeMovie(movie);

  const actionBtn = isWatchlistView
    ? `<button class="deleteBtn">
         <span class="minus">-</span>
         Remove
       </button>`
    : `<button class="addBtn">
         <span class="plus">+</span>
         Watchlist
       </button>`;

  return `
    <div class="movie" 
         id="${m.imdbID}"
         data-Title="${m.Title}"
         data-imdbRating="${m.imdbRating}"
         data-Genre="${m.Genre}"
         data-Runtime="${m.Runtime}"
         data-Plot="${m.Plot.replace(/"/g, "&quot;")}">
      <img src="${m.Poster}" 
           onerror="this.onerror=null;this.src='/images/missing.gif'" />
      <div class="details-container">
        <div class="movie-top">
          <h2>${m.Title}</h2>
          <i class="fa-solid fa-star"></i>
          <span>${m.imdbRating}</span>
        </div>
        <div class="movie-middle">
          <span>${m.Runtime}</span>
          <span>${m.Genre}</span>
          ${actionBtn}
        </div>
        <p class="plot">
          ${
            m.Plot.length > 90
              ? m.Plot.slice(0, 90) +
                "... <button class='readMore'>Read more</button>"
              : m.Plot
          }
        </p>
      </div>
    </div>
  `;
}

// Search OMDb for movies
async function getMovies(title) {
  let html = "";
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=5a147cf9&s=${title}`
    );
    const data = await res.json();

    if (data.Response !== "False") {
      for (const movie of data.Search) {
        const res2 = await fetch(
          `https://www.omdbapi.com/?apikey=5a147cf9&i=${movie.imdbID}`
        );
        const movieDetails = await res2.json();
        html += buildHtml(movieDetails, false);
      }
      searchResultsEl.innerHTML = html;
    } else {
      searchEl.placeholder = "No data";
      searchResultsEl.innerHTML = `
        <div class="noResults">
          Unable to find what you're looking for. Please try another search.
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
  }
}

// Click handling
document.addEventListener("click", (e) => {
  // Search button
  if (e.target === searchBtn) {
    getMovies(searchEl.value);
    searchEl.value = "";
    searchEl.placeholder = "Search for a movie";
  }

  // Add to watchlist
  else if (e.target.closest(".addBtn")) {
    const card = e.target.closest(".movie");

    const movieInfo = {
      imdbID: card.id,
      Title: card.dataset.title,
      imdbRating: card.dataset.imdbrating,
      Genre: card.dataset.genre,
      Runtime: card.dataset.runtime,
      Plot: card.dataset.plot,
      Poster: card.querySelector("img")?.src || "/images/missing.gif",
    };

    if (!watchList.find((m) => m.imdbID === movieInfo.imdbID)) {
      watchList.push(movieInfo);
      localStorage.setItem("watchList", JSON.stringify(watchList));
      console.log("✅ Added:", movieInfo.Title);
    } else {
      console.log("⚠️ Already added:", movieInfo.Title);
    }
  }

  // Remove from watchlist
  else if (e.target.closest(".deleteBtn")) {
    const card = e.target.closest(".movie");
    const id = card.id;

    watchList = watchList.filter((movie) => movie.imdbID !== id);
    localStorage.setItem("watchList", JSON.stringify(watchList));
    console.log("🗑️ Removed:", id);

    // Refresh watchlist view
    const html = watchList.map((movie) => buildHtml(movie, true)).join("");
    searchResultsEl.innerHTML =
      html || `<div class="noResults">Your watchlist is empty.</div>`;
  }

  // Toggle between search/watchlist
  else if (e.target === toggleBtn) {
    const isHidden = searchBar.classList.toggle("hide");
    toggleBtn.textContent = isHidden ? "Search for Movie" : "My Watchlist";

    if (isHidden) {
      if (watchList.length > 0) {
        const html = watchList.map((movie) => buildHtml(movie, true)).join("");
        searchResultsEl.innerHTML = html;
      } else {
        searchResultsEl.innerHTML = `<div class="noResults">Your watchlist is empty.</div>`;
      }
    } else {
      searchResultsEl.innerHTML = `
        <i class="fa-solid fa-film"></i>
        <span>Start exploring</span>
      `;
    }
  }
});
