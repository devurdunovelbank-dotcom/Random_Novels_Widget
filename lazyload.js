// Random Posts Widget - Works for multiple widgets
document.addEventListener("DOMContentLoaded", () => {
  const BLOG_URL = "https://YOURBLOG.blogspot.com"; // Apna blog URL

  const widgets = document.querySelectorAll(".random-posts-widget");

  widgets.forEach(async (container) => {
    const label = container.dataset.label || "Novel Reviews";
    const number = parseInt(container.dataset.number) || 4;
    const chars = parseInt(container.dataset.chars) || 120;
    const details = container.dataset.details !== "false";
    const noThumb = container.dataset.nothumb || "";

    async function fetchTotalPosts() {
      const res = await fetch(`${BLOG_URL}/feeds/posts/summary/-/${encodeURIComponent(label)}?alt=json`);
      const data = await res.json();
      return parseInt(data.feed.openSearch$totalResults.$t) || 0;
    }

    async function fetchPosts(total) {
      const maxResults = Math.min(total, 50);
      const res = await fetch(`${BLOG_URL}/feeds/posts/summary/-/${encodeURIComponent(label)}?alt=json&max-results=${maxResults}`);
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
      const thumb = entry.media$thumbnail?.url?.replace(/s\d+-c/, "s1600") || noThumb;

      let content = entry.summary?.$t || entry.content?.$t || "";
      content = content.replace(/<[^>]*>/g, "");
      if (content.length > chars) {
        content = content.substring(0, chars).trim();
        const lastSpace = content.lastIndexOf(" ");
        content = lastSpace !== -1 ? content.substring(0, lastSpace) + "…" : content + "…";
      }

      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${link}" target="_blank">
          <img src="${noThumb}" data-src="${thumb}" alt="${title}" loading="lazy" class="lazy-thumb">
        </a>
        <div>
          <a href="${link}" target="_blank">${title}</a>
          ${details ? `<div class="random-info">${date.toLocaleDateString()} - ${comments}</div>` : ""}
          <div class="random-summary">${content}</div>
        </div>
      `;
      return li;
    }

    function lazyLoadImages() {
      const images = container.querySelectorAll("img.lazy-thumb");
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

    // Load posts
    try {
      container.innerHTML = "";
      const total = await fetchTotalPosts();
      if (total === 0) {
        container.innerHTML = `<li>No posts found for label: ${label}</li>`;
        return;
      }
      const posts = await fetchPosts(total);
      if (!posts.length) {
        container.innerHTML = `<li>No posts available.</li>`;
        return;
      }
      const indexes = getRandomIndexes(posts.length, number);
      indexes.forEach(idx => {
        const entry = posts[idx];
        if (entry) container.appendChild(createPostItem(entry));
      });
      lazyLoadImages();
    } catch (err) {
      console.error("Random posts widget error:", err);
      container.innerHTML = "<li>Failed to load posts.</li>";
    }
  });
});
