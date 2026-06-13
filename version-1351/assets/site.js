document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelector("[data-nav-links]");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("is-open");
    });
  }

  const slides = Array.from(document.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(document.querySelectorAll("[data-hero-dot]"));
  let currentSlide = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentSlide);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentSlide);
    });
  }

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", () => showSlide(dotIndex));
  });

  if (slides.length > 1) {
    setInterval(() => showSlide(currentSlide + 1), 5200);
  }

  document.querySelectorAll("[data-filter-panel]").forEach((panel) => {
    const root = panel.parentElement || document;
    const input = panel.querySelector("[data-filter-input]");
    const typeSelect = panel.querySelector("[data-filter-type]");
    const regionSelect = panel.querySelector("[data-filter-region]");
    const yearSelect = panel.querySelector("[data-filter-year]");
    const cards = Array.from(root.querySelectorAll("[data-card]"));
    const empty = root.querySelector("[data-filter-empty]");

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function applyFilter() {
      const query = normalize(input && input.value);
      const typeValue = normalize(typeSelect && typeSelect.value);
      const regionValue = normalize(regionSelect && regionSelect.value);
      const yearValue = normalize(yearSelect && yearSelect.value);
      let visibleCount = 0;

      cards.forEach((card) => {
        const title = normalize(card.dataset.title);
        const tags = normalize(card.dataset.tags);
        const type = normalize(card.dataset.type);
        const region = normalize(card.dataset.region);
        const year = normalize(card.dataset.year);
        const textHit = !query || title.includes(query) || tags.includes(query) || type.includes(query) || region.includes(query) || year.includes(query);
        const typeHit = !typeValue || type === typeValue;
        const regionHit = !regionValue || region === regionValue;
        const yearHit = !yearValue || year === yearValue;
        const visible = textHit && typeHit && regionHit && yearHit;
        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
        }
      });

      if (empty) {
        empty.hidden = visibleCount !== 0;
      }
    }

    [input, typeSelect, regionSelect, yearSelect].forEach((control) => {
      if (control) {
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      }
    });
  });
});
