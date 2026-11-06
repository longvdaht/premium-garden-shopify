/*
  Potager: slide counter for the product gallery on mobile (wireframe 03, note 2).
  Shows one segment per image and "current / total", following the gallery swiper.
*/
(function () {
  'use strict';

  if (customElements.get('product-slides-progress')) return;

  class ProductSlidesProgress extends HTMLElement {
    connectedCallback() {
      this.swiperEl = document.getElementById(this.dataset.swiper);
      this.segments = Array.from(this.querySelectorAll('[data-segment]'));
      this.current = this.querySelector('[data-current]');
      this.onChange = this.update.bind(this);

      if (!this.swiperEl) return;

      this.swiperEl.addEventListener('swiperslidechange', this.onChange);
      this.swiperEl.addEventListener('swiperinit', this.onChange);
      this.update();
    }

    disconnectedCallback() {
      if (!this.swiperEl) return;
      this.swiperEl.removeEventListener('swiperslidechange', this.onChange);
      this.swiperEl.removeEventListener('swiperinit', this.onChange);
    }

    update() {
      const swiper = this.swiperEl && this.swiperEl.swiper;
      const index = swiper && !swiper.destroyed ? swiper.activeIndex : 0;

      this.segments.forEach((segment, i) => segment.classList.toggle('is-active', i === index));
      if (this.current) this.current.textContent = index + 1;
    }
  }

  customElements.define('product-slides-progress', ProductSlidesProgress);
})();
