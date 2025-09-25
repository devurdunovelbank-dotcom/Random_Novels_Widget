// lazyload_ok.js - Fixed Version
// Author: Dev Urdu Novel Bank
// Description: Random posts widget for Blogger

const randomPostsConfig = window.randomPostsConfig || {
  number: 4,
  chars: 120,
  details: true,
  label: "Novel Reviews",
  noThumb: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_uaVcB3KlHuitdCw0dVYL8lBAcOcICS3aj8dvWC0wUAs6EbN1hICL5yQ7WfaNjfdIPwTK_UtNPOE2J1Kvh8i73M16y2L2q8TVdaLiNLRXHEmNjeNbTsijplhyHBjkSkTxq3nDsEmBMLz7CUYI6fcSFaZ5ValdB9AlYyX-c6tZQPjCwEnHxWZRk07eLm_8/s1080/urdu%20novel%20bank.webp"
};

async function fetchTotalPosts() {
  const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(randomPostsConfig.label)}?alt=json`);
  const data = await res.json();
  return parseInt(data.feed.openSearch$totalResults.$t) || 0;
}

async function fetchPosts(total) {
  const maxResults = Math.min(total, 50);
  const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(randomPostsConfig.label)}?alt=json&max-results=${maxResults}`);
  const data = await res.json();
  return (data.feed.entry || []).slice(0, maxResults);
}

function getRandomIndexes(arrayLength, count) {
  const indexes = new Set();
  while (indexes.size < Math.min(count, arrayLength)) {
    indexes.add(Math.floor(Math.random() * arrayLength));
  }
  return Array.from(indexes);
}

function createPostItem(entry) {
  const title = entry.title.$t;
  const link = entry.link.find(l => l.rel === "alternate").href;
  const date = new Date(entry.published.$t);
  const comments = entry.thr$total ? entry.thr$total.$t + " Comments" : "Comments Disabled";
  const thumb = entry.media$thumbnail?.url?.replace(/s\d+-c/, "s1600") || randomPostsConfig.noThumb;

  let content = entry.summary?.$t || entry.content?.$t || "";
  content = content.replace(/<[^>]*>/g, "");
  if (content.length > randomPostsConfig.chars) {
    content = content.substring(0, randomPostsConfig.chars).trim();
    const lastSpace = content.lastIndexOf(" ");
    content = lastSpace !== -1 ? content.substring(0, lastSpace) + "…" : content + "…";
  }

  const li = document.createElement("li");
  li.innerHTML = `
    <a href="${link}" target="_blank">
      <img src="${randomPostsConfig.noThumb}" data-src="${thumb}" alt="${title}" loading="lazy" class="lazy-thumb">
    </a>
    <div>
      <a href="${link}" target="_blank">${title}</a>
      ${randomPostsConfig.details ? `<div class="random-info">${date.toLocaleDateString()} - ${comments}</div>` : ""}
      <div class="random-summary">${content}</div>
    </div>
  `;
  return li;
}

function lazyLoadImages() {
  const images = document.querySelectorAll("img.lazy-thumb");
  if (!images.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin: "50px" });

  images.forEach(img => observer.observe(img));
}

async function loadRandomPosts() {
  const container = document.getElementById("random-posts");
  if (!container) return;
  container.innerHTML = "";

  try {
    const total = await fetchTotalPosts();
    if (total === 0) {
      container.innerHTML = `<li>No posts found for label: ${randomPostsConfig.label}</li>`;
      return;
    }

    const posts = await fetchPosts(total);
    if (!posts.length) {
      container.innerHTML = `<li>No posts available.</li>`;
      return;
    }

    const indexes = getRandomIndexes(posts.length, randomPostsConfig.number);
    indexes.forEach(idx => {
      const entry = posts[idx];
      if (entry) container.appendChild(createPostItem(entry));
    });

    lazyLoadImages();
  } catch (error) {
    console.error("Error loading random posts:", error);
    container.innerHTML = "<li>Failed to load posts. Please refresh the page.</li>";
  }
}

document.addEventListener("DOMContentLoaded", loadRandomPosts);
