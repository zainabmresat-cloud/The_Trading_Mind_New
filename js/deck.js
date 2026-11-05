/**
 * The Trading Mind - Deck Engine
 * Handles slide transitions, keyboard/touch navigation, progress tracking,
 * overview modal, and slide lifecycle events.
 * Compatible with direct file:// loading (no ES module imports required).
 */

(function () {
  "use strict";

  class DeckEngine {
    constructor() {
      this.slides = Array.from(document.querySelectorAll(".slide"));
      this.totalSlides = this.slides.length;
      this.currentIndex = 0;

      // DOM Elements
      this.counterEl = document.querySelector(".slide-counter .current-idx");
      this.counterTotalEl = document.querySelector(".slide-counter .total-idx");
      this.progressFillEl = document.querySelector(".progress-fill");
      this.prevBtn = document.getElementById("btn-prev-slide");
      this.nextBtn = document.getElementById("btn-next-slide");
      this.overviewModal = document.getElementById("overview-modal");
      this.overviewGrid = document.getElementById("overview-grid");
      this.helpModal = document.getElementById("help-modal");

      // Touch variables
      this.touchStartX = 0;
      this.touchStartY = 0;

      this.init();
    }

    init() {
      if (this.totalSlides === 0) return;

      if (this.counterTotalEl) {
        this.counterTotalEl.textContent = String(this.totalSlides).padStart(2, "0");
      }

      this.buildOverviewCards();
      this.bindEvents();

      // Check initial URL hash (e.g. #slide-4)
      const hash = window.location.hash;
      const match = hash.match(/^#slide-(\d+)$/);
      if (match) {
        const targetIndex = parseInt(match[1], 10) - 1;
        this.goTo(targetIndex, false);
      } else {
        this.goTo(0, false);
      }
    }

    bindEvents() {
      // Navigation Buttons
      if (this.prevBtn) this.prevBtn.addEventListener("click", () => this.prev());
      if (this.nextBtn) this.nextBtn.addEventListener("click", () => this.next());

      // Header buttons
      const btnOverview = document.getElementById("btn-toggle-overview");
      if (btnOverview) btnOverview.addEventListener("click", () => this.toggleOverview());

      const btnCloseOverview = document.getElementById("btn-close-overview");
      if (btnCloseOverview) btnCloseOverview.addEventListener("click", () => this.toggleOverview(false));

      const btnHelp = document.getElementById("btn-toggle-help");
      if (btnHelp) btnHelp.addEventListener("click", () => this.toggleHelp());

      const btnCloseHelp = document.getElementById("btn-close-help");
      if (btnCloseHelp) btnCloseHelp.addEventListener("click", () => this.toggleHelp(false));

      const btnFullscreen = document.getElementById("btn-toggle-fullscreen");
      if (btnFullscreen) btnFullscreen.addEventListener("click", () => this.toggleFullscreen());

      // Keyboard Navigation
      window.addEventListener("keydown", (e) => this.handleKeyDown(e));

      // Hash change event (back/forward browser buttons)
      window.addEventListener("hashchange", () => {
        const match = window.location.hash.match(/^#slide-(\d+)$/);
        if (match) {
          const targetIndex = parseInt(match[1], 10) - 1;
          if (targetIndex !== this.currentIndex) {
            this.goTo(targetIndex, false);
          }
        }
      });

      // Touch swipe gestures
      window.addEventListener("touchstart", (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      window.addEventListener("touchend", (e) => {
        const deltaX = e.changedTouches[0].screenX - this.touchStartX;
        const deltaY = e.changedTouches[0].screenY - this.touchStartY;

        // Ensure horizontal swipe dominates and exceeds threshold
        if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
          if (deltaX < 0) {
            this.next();
          } else {
            this.prev();
          }
        }
      }, { passive: true });
    }

    handleKeyDown(e) {
      // Ignore hotkeys when typing in inputs
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          this.next();
          break;

        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          this.prev();
          break;

        case "Home":
          e.preventDefault();
          this.goTo(0);
          break;

        case "End":
          e.preventDefault();
          this.goTo(this.totalSlides - 1);
          break;

        case "o":
        case "O":
          e.preventDefault();
          this.toggleOverview();
          break;

        case "f":
        case "F":
          e.preventDefault();
          this.toggleFullscreen();
          break;

        case "?":
        case "h":
        case "H":
          e.preventDefault();
          this.toggleHelp();
          break;

        case "Escape":
          this.toggleOverview(false);
          this.toggleHelp(false);
          break;

        default:
          // Number keys 1-9 to jump directly
          if (e.key >= "1" && e.key <= "9") {
            const num = parseInt(e.key, 10);
            if (num <= this.totalSlides) {
              this.goTo(num - 1);
            }
          } else if (e.key === "0" && this.totalSlides >= 10) {
            this.goTo(9); // 10th slide
          }
          break;
      }
    }

    goTo(targetIndex, updateHash = true) {
      if (targetIndex < 0 || targetIndex >= this.totalSlides) return;

      const previousIndex = this.currentIndex;
      this.currentIndex = targetIndex;

      this.slides.forEach((slide, idx) => {
        slide.classList.remove("active", "prev", "next");
        if (idx === targetIndex) {
          slide.classList.add("active");
        } else if (idx < targetIndex) {
          slide.classList.add("prev");
        } else {
          slide.classList.add("next");
        }
      });

      // Update Counter & Progress Bar
      if (this.counterEl) {
        this.counterEl.textContent = String(targetIndex + 1).padStart(2, "0");
      }
      if (this.progressFillEl) {
        const pct = ((targetIndex + 1) / this.totalSlides) * 100;
        this.progressFillEl.style.width = `${pct}%`;
      }

      // Update Dock Button States
      if (this.prevBtn) this.prevBtn.disabled = targetIndex === 0;
      if (this.nextBtn) this.nextBtn.disabled = targetIndex === this.totalSlides - 1;

      // Update Overview Cards Active State
      if (this.overviewGrid) {
        const cards = this.overviewGrid.querySelectorAll(".overview-card");
        cards.forEach((card, idx) => {
          card.classList.toggle("current", idx === targetIndex);
        });
      }

      // Sync Hash safely across file:// and http:// protocols
      if (updateHash) {
        try {
          history.replaceState(null, "", `#slide-${targetIndex + 1}`);
        } catch (_) {
          try {
            window.location.hash = `#slide-${targetIndex + 1}`;
          } catch (__) {}
        }
      }

      // Close Modals on navigation
      this.toggleOverview(false);
      this.toggleHelp(false);

      // Dispatch Custom Event for Slide-Specific Components
      const currentSlideEl = this.slides[targetIndex];
      const event = new CustomEvent("deck:slidechange", {
        detail: {
          index: targetIndex,
          slideNumber: targetIndex + 1,
          previousIndex: previousIndex,
          slideId: currentSlideEl.id,
          slideElement: currentSlideEl,
        },
      });
      document.dispatchEvent(event);
    }

    next() {
      if (this.currentIndex < this.totalSlides - 1) {
        this.goTo(this.currentIndex + 1);
      }
    }

    prev() {
      if (this.currentIndex > 0) {
        this.goTo(this.currentIndex - 1);
      }
    }

    toggleOverview(forceState) {
      if (!this.overviewModal) return;
      const shouldOpen = forceState !== undefined ? forceState : !this.overviewModal.classList.contains("active");
      this.overviewModal.classList.toggle("active", shouldOpen);
    }

    toggleHelp(forceState) {
      if (!this.helpModal) return;
      const shouldOpen = forceState !== undefined ? forceState : !this.helpModal.classList.contains("active");
      this.helpModal.classList.toggle("active", shouldOpen);
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }

    buildOverviewCards() {
      if (!this.overviewGrid) return;
      this.overviewGrid.innerHTML = "";

      this.slides.forEach((slide, idx) => {
        const title = slide.querySelector(".slide-title")?.textContent || `Slide ${idx + 1}`;
        const category = slide.querySelector(".slide-category")?.textContent || "Module";

        const card = document.createElement("div");
        card.className = `overview-card ${idx === this.currentIndex ? "current" : ""}`;
        card.innerHTML = `
          <div>
            <div class="overview-card-num">SLIDE ${String(idx + 1).padStart(2, "0")}</div>
            <div class="overview-card-title">${title}</div>
          </div>
          <div class="overview-card-tag">${category}</div>
        `;

        card.addEventListener("click", () => this.goTo(idx));
        this.overviewGrid.appendChild(card);
      });
    }
  }

  // Expose to window for classic script usage
  window.DeckEngine = DeckEngine;
})();
