async function fetchTotalPosts() {
  const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(randomPostsConfig.label)}?alt=json`);
  const data = await res.json();
  return data.feed.openSearch$totalResults.$t;
}

async function fetchPosts(total) {
  const maxResults = Math.min(total, 50); // زیادہ سے زیادہ 50 posts
  const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(randomPostsConfig.label)}?alt=json&max-results=${maxResults}`);
  const data = await res.json();
  return data.feed.entry || [];
}

function getRandomIndexes(total, count) {
  const indexes = new Set();
  while (indexes.size < count && indexes.size < total) {
    indexes.add(Math.floor(Math.random() * total));
  }
  return [...indexes];
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
    if (lastSpace !== -1) {
      content = content.substring(0, lastSpace) + "…";
    } else {
      content = content.substring(0, randomPostsConfig.chars) + "…";
    }
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
  container.innerHTML = "";
  try {
    const total = await fetchTotalPosts();
    if (total === 0) {
      container.innerHTML = `<li>No posts found for label: ${randomPostsConfig.label}</li>`;
      return;
    }
    const posts = await fetchPosts(total);
    const indexes = getRandomIndexes(posts.length, randomPostsConfig.number);
    for (const idx of indexes) {
      const entry = posts[idx];
      if (entry) container.appendChild(createPostItem(entry));
    }
    lazyLoadImages();
  } catch (error) {
    console.error("Error loading random posts:", error);
    container.innerHTML = "<li>Failed to load posts. Please try again later.</li>";
  }
}

document.addEventListener("DOMContentLoaded", loadRandomPosts);
