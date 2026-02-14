const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const POSTS_FILE = path.join(ROOT, "src/js/posts.js");
const PAGES_DIR = path.join(ROOT, "src/pages");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadPosts() {
  const source = fs.readFileSync(POSTS_FILE, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(source, context);
  const posts = context.window.BLOG_POSTS;
  if (!Array.isArray(posts)) {
    throw new Error("BLOG_POSTS is missing or invalid in src/js/posts.js");
  }
  return posts;
}

function renderPostHtml(post) {
  const paragraphs = (Array.isArray(post.content) && post.content.length ? post.content : [post.excerpt])
    .map((paragraph) => `          <p class="muted">${escapeHtml(paragraph)}</p>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <title>${escapeHtml(post.title)} | Blog</title>
  <meta
    name="description"
    content="${escapeHtml(post.excerpt)}"
  />

  <link rel="stylesheet" href="../css/base.css" />
  <link rel="stylesheet" href="../css/components.css" />
  <link rel="stylesheet" href="../css/pages.css" />
</head>

<body>
  <div id="site-header"></div>

  <main>
    <section class="page-hero">
      <div class="container">
        <p class="kicker"><span class="hero-badge">Blog</span></p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="lead">${escapeHtml(post.dateLabel)} · ${escapeHtml(post.category)} · ${escapeHtml(post.readTime)}</p>
      </div>
    </section>
    <div class="section-divider" aria-hidden="true"></div>

    <section class="section">
      <div class="container about-grid">
        <div class="about-body">
${paragraphs}
          <p><a class="text-link" href="./blog.html">Back to blog</a></p>
        </div>
      </div>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="../js/main.js" defer></script>
</body>
</html>
`;
}

function generate() {
  const posts = loadPosts();
  posts.forEach((post) => {
    if (!post.slug || !post.title || !post.excerpt) {
      throw new Error(`Invalid post entry: ${JSON.stringify(post)}`);
    }
    const outputPath = path.join(PAGES_DIR, `blog-${post.slug}.html`);
    fs.writeFileSync(outputPath, renderPostHtml(post), "utf8");
    console.log(`Generated ${path.relative(ROOT, outputPath)}`);
  });
}

generate();
