/**
 * Injects reusable HTML (header/footer) into a page placeholder element.
 */
async function injectHtmlInclude(targetElementId, includeFilePath) {
  const targetElement = document.getElementById(targetElementId);
  if (!targetElement) return;

  const response = await fetch(includeFilePath);
  targetElement.innerHTML = await response.text();
}

/**
 * Marks the current page link in the shared navigation.
 */
function highlightCurrentNavLink() {
  const currentFileName = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const normalizedFileName = currentFileName.startsWith("blog-") ? "blog.html" : currentFileName;
  document.querySelectorAll(".nav-link").forEach((navLink) => {
    const href = (navLink.getAttribute("href") || "").toLowerCase();
    if (href.endsWith(normalizedFileName)) navLink.classList.add("is-active");
  });
}

/**
 * Renders the current year in the shared footer.
 */
function renderCurrentYear() {
  const yearElement = document.getElementById("year");
  if (yearElement) yearElement.textContent = String(new Date().getFullYear());
}

/**
 * Enables left/right controls for review card carousels.
 */
function initializeReviewsCarousel() {
  const carousels = document.querySelectorAll("[data-reviews-carousel]");
  if (!carousels.length) return;

  carousels.forEach((carouselElement) => {
    const trackElement = carouselElement.querySelector("[data-reviews-track]");
    const prevButton = carouselElement.querySelector("[data-reviews-prev]");
    const nextButton = carouselElement.querySelector("[data-reviews-next]");
    if (!trackElement || !prevButton || !nextButton) return;

    const getStepSize = () => {
      const firstCard = trackElement.querySelector(".service-card");
      if (!firstCard) return 0;
      const columnGap = parseFloat(getComputedStyle(trackElement).columnGap || "0");
      return firstCard.getBoundingClientRect().width + columnGap;
    };

    const updateButtons = () => {
      const maxScrollLeft = trackElement.scrollWidth - trackElement.clientWidth;
      const atStart = trackElement.scrollLeft <= 1;
      const atEnd = trackElement.scrollLeft >= maxScrollLeft - 1;
      prevButton.disabled = atStart;
      nextButton.disabled = atEnd;
    };

    const scrollByCards = (direction) => {
      const stepSize = getStepSize();
      if (!stepSize) return;
      const distance = stepSize * direction;
      trackElement.scrollBy({ left: distance, behavior: "smooth" });
    };

    prevButton.addEventListener("click", () => scrollByCards(-1));
    nextButton.addEventListener("click", () => scrollByCards(1));
    trackElement.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
  });
}

/**
 * Opens/closes a lightweight modal review form.
 */
function initializeReviewModal() {
  const modalElement = document.querySelector("[data-review-modal]");
  const openButton = document.querySelector("[data-review-modal-open]");
  if (!modalElement || !openButton) return;

  const closeButtons = modalElement.querySelectorAll("[data-review-modal-close]");

  const openModal = () => {
    modalElement.hidden = false;
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modalElement.hidden = true;
    document.body.style.overflow = "";
  };

  openButton.addEventListener("click", openModal);
  closeButtons.forEach((button) => button.addEventListener("click", closeModal));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalElement.hidden) closeModal();
  });
}

/**
 * Bootstraps shared page chrome and global UI state.
 */
(async function initializeSiteLayout() {
  await Promise.all([
    injectHtmlInclude("site-header", "../includes/header.html"),
    injectHtmlInclude("site-footer", "../includes/footer.html"),
  ]);

  highlightCurrentNavLink();
  renderCurrentYear();
  initializeReviewsCarousel();
  initializeReviewModal();
})();
