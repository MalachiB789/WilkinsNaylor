/**
 * Injects reusable HTML (header/footer) into a page placeholder element.
 */
async function injectHtmlInclude(targetElementId, includeFilePath) {
  const targetElement = document.getElementById(targetElementId);
  if (!targetElement) return;

  const response = await fetch(includeFilePath);
  targetElement.innerHTML = await response.text();
}

function isBlogDetailPage() {
  const segments = getNormalizedPath().split("/").filter(Boolean);
  return segments.at(-2) === "blog" && Boolean(segments.at(-1));
}

function getNormalizedPath() {
  return location.pathname
    .toLowerCase()
    .replace(/\/index\.html$/, "")
    .replace(/\/+$/, "");
}

function getPageDepth() {
  const segments = getNormalizedPath().split("/").filter(Boolean);
  const currentSegment = segments.at(-1) || "";
  const parentSegment = segments.at(-2) || "";

  if (parentSegment === "blog" && currentSegment) return 2;
  if (["about", "blog", "contact", "naylor-homes-ltd", "wilkins-naylor-ltd"].includes(currentSegment)) return 1;
  return 0;
}

function getCurrentSection() {
  const segments = getNormalizedPath().split("/").filter(Boolean);
  const currentSegment = segments.at(-1) || "";
  const parentSegment = segments.at(-2) || "";

  if (currentSegment === "blog" || parentSegment === "blog") return "blog";
  if (currentSegment === "about") return "about";
  if (currentSegment === "contact") return "contact";
  if (currentSegment === "naylor-homes-ltd") return "naylor-homes-ltd";
  if (currentSegment === "wilkins-naylor-ltd") return "wilkins-naylor-ltd";
  return "home";
}

function getSectionFromHref(href) {
  if (!href) return "";

  const resolvedPath = new URL(href, location.href).pathname
    .toLowerCase()
    .replace(/\/index\.html$/, "")
    .replace(/\/+$/, "");
  const segments = resolvedPath.split("/").filter(Boolean);
  const currentSegment = segments.at(-1) || "";
  const parentSegment = segments.at(-2) || "";

  if (resolvedPath === "") return "home";
  if (currentSegment === "blog" || parentSegment === "blog") return "blog";
  if (currentSegment === "about") return "about";
  if (currentSegment === "contact") return "contact";
  if (currentSegment === "naylor-homes-ltd") return "naylor-homes-ltd";
  if (currentSegment === "wilkins-naylor-ltd") return "wilkins-naylor-ltd";
  return "home";
}

function rewriteInjectedLinksForNestedPages() {
  const pageDepth = getPageDepth();
  if (pageDepth === 0) return;

  const prefix = "../".repeat(pageDepth);

  document.querySelectorAll("#site-header a[href], #site-footer a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("./")) return;
    link.setAttribute("href", `${prefix}${href.slice(2)}`);
  });

  document.querySelectorAll("#site-header img[src], #site-footer img[src]").forEach((image) => {
    const src = image.getAttribute("src");
    if (!src) return;
    if (src.startsWith("./assets/")) {
      image.setAttribute("src", `${prefix}${src.slice(2)}`);
    }
  });
}

/**
 * Marks the current page link in the shared navigation.
 */
function highlightCurrentNavLink() {
  const currentSection = getCurrentSection();
  document.querySelectorAll(".nav-link, .nav-sub-link").forEach((navLink) => {
    const targetSection = getSectionFromHref(navLink.getAttribute("href") || "");

    if (targetSection === currentSection) {
      navLink.classList.add("is-active");
      // If it's a sub-link, also highlight the parent dropdown toggle
      const parentDropdown = navLink.closest(".nav-dropdown");
      if (parentDropdown) parentDropdown.querySelector(".nav-dropdown-toggle")?.classList.add("is-active");
    }
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
 * Enables hamburger navigation for mobile breakpoints.
 */
function initializeMobileNavigation() {
  const siteHeader = document.querySelector(".site-header");
  const navToggleButton = document.querySelector("[data-nav-toggle]");
  const navElement = document.querySelector("[data-site-nav]");
  const servicesDropdown = navElement?.querySelector("[data-nav-dropdown]");
  const servicesToggleButton = navElement?.querySelector("[data-nav-dropdown-toggle]");
  if (!siteHeader || !(navToggleButton instanceof HTMLButtonElement) || !navElement) return;

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  const closeMenu = () => {
    siteHeader.classList.remove("is-menu-open");
    navToggleButton.setAttribute("aria-expanded", "false");
    navToggleButton.setAttribute("aria-label", "Open menu");
    if (servicesDropdown && servicesToggleButton instanceof HTMLButtonElement) {
      servicesDropdown.classList.remove("is-open");
      servicesToggleButton.setAttribute("aria-expanded", "false");
    }
  };

  const openMenu = () => {
    siteHeader.classList.add("is-menu-open");
    navToggleButton.setAttribute("aria-expanded", "true");
    navToggleButton.setAttribute("aria-label", "Close menu");
  };

  navToggleButton.addEventListener("click", () => {
    const isOpen = siteHeader.classList.contains("is-menu-open");
    if (isOpen) closeMenu();
    else openMenu();
  });

  if (servicesDropdown && servicesToggleButton instanceof HTMLButtonElement) {
    servicesToggleButton.addEventListener("click", () => {
      if (!mobileQuery.matches) return;
      const isOpen = servicesDropdown.classList.toggle("is-open");
      servicesToggleButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  navElement.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", (event) => {
      if (!event.matches) closeMenu();
    });
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener((event) => {
      if (!event.matches) closeMenu();
    });
  }
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
  const modalElements = document.querySelectorAll("[data-review-modal]");
  const openButtons = document.querySelectorAll("[data-review-modal-open]");
  if (!modalElements.length || !openButtons.length) return;

  modalElements.forEach((modalElement, index) => {
    const openButton = openButtons[index];
    if (!openButton) return;

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
  });
}

/**
 * Sends remote form submissions directly via HTTP.
 */
function initializeRemoteForms() {
  const formElements = document.querySelectorAll("[data-remote-form]");
  if (!formElements.length) return;

  formElements.forEach((formElement) => {
    const statusElement = formElement.querySelector("[data-form-status]");
    const submitButton = formElement.querySelector("button[type=\"submit\"]");
    const successMessage = (formElement.getAttribute("data-success-message") || "Sent!").trim();
    const errorMessage = (formElement.getAttribute("data-error-message") || "Message failed to send. Please try again.").trim();

    formElement.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!(submitButton instanceof HTMLButtonElement)) return;
      const formData = new FormData(formElement);
      const endpoint = (formElement.getAttribute("data-form-endpoint") || formElement.getAttribute("action") || "").trim();
      if (!endpoint) return;

      submitButton.disabled = true;
      const originalButtonText = submitButton.textContent;
      let wasSuccessful = false;
      submitButton.textContent = "Sending...";
      if (statusElement) statusElement.textContent = "";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error(`Unexpected status ${response.status}`);
        wasSuccessful = true;
        formElement.reset();
        if (statusElement) statusElement.textContent = "";
        submitButton.textContent = successMessage;

        const modalElement = formElement.closest("[data-review-modal]");
        if (modalElement instanceof HTMLElement) {
          setTimeout(() => {
            modalElement.hidden = true;
            document.body.style.overflow = "";
          }, 1200);
        }

        setTimeout(() => {
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        }, 1600);
      } catch (_error) {
        if (statusElement) statusElement.textContent = errorMessage;
      } finally {
        if (!wasSuccessful) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  });
}

/**
 * Groups the two service pages into a dropdown in the navigation.
 */
function organizeServicesDropdown() {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  // Avoid running if a dropdown already exists
  if (nav.querySelector("[data-nav-dropdown]")) return;

  const links = Array.from(nav.querySelectorAll(".nav-link"));
  // Identify the links to move based on their text content
  const servicesLinks = links.filter(link => {
    const text = link.textContent.toLowerCase();
    return text.includes("naylor home") || text.includes("wilkins naylor");
  });

  if (servicesLinks.length === 0) return;

  // Create the dropdown structure
  const dropdown = document.createElement("div");
  dropdown.className = "nav-dropdown";
  dropdown.setAttribute("data-nav-dropdown", "");

  const toggle = document.createElement("button");
  toggle.className = "nav-dropdown-toggle nav-link";
  toggle.setAttribute("data-nav-dropdown-toggle", "");
  toggle.textContent = "Services";
  
  const menu = document.createElement("div");
  menu.className = "nav-dropdown-menu";

  servicesLinks.forEach((link) => {
    const subLink = document.createElement("a");
    subLink.className = "nav-sub-link";
    subLink.href = link.getAttribute("href");
    subLink.textContent = link.textContent;
    menu.appendChild(subLink);
    link.remove();
  });

  dropdown.appendChild(toggle);
  dropdown.appendChild(menu);

  // Insert before Contact link if it exists, otherwise append
  const contactLink = nav.querySelector('a[href*="contact"]');
  if (contactLink) {
    nav.insertBefore(dropdown, contactLink);
  } else {
    nav.appendChild(dropdown);
  }
}

/**
 * Bootstraps shared page chrome and global UI state.
 */
(async function initializeSiteLayout() {
  const includeBasePath = `${"../".repeat(getPageDepth()) || "./"}includes`;

  await Promise.all([
    injectHtmlInclude("site-header", `${includeBasePath}/header.html`),
    injectHtmlInclude("site-footer", `${includeBasePath}/footer.html`),
  ]);

  rewriteInjectedLinksForNestedPages();
  organizeServicesDropdown();
  highlightCurrentNavLink();
  initializeMobileNavigation();
  renderCurrentYear();
  initializeReviewsCarousel();
  initializeReviewModal();
  initializeRemoteForms();
})();
