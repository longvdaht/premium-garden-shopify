/*
  Potager: current-topic marker for the Sidebar section's topic list (FAQ, wireframe 07).

  - A clicked topic is marked straight away and stays marked while the page scrolls to it.
  - While scrolling, the current topic is the last one whose heading has passed the top
    quarter of the screen.
  - At the bottom of the page the last topic is marked, even when its section is too short
    to reach the top.
  - On mobile, where the topics form a sideways-scrolling row, the marked topic is kept in view.
*/
(function () {
  'use strict';

  if (customElements.get('sidebar-anchors')) return;

  class SidebarAnchors extends HTMLElement {
    connectedCallback() {
      this.links = Array.from(this.querySelectorAll('[data-anchor-target]'));
      this.targets = this.links.map((link) => document.querySelector(link.dataset.anchorTarget));
      this.locked = false;
      this.onScroll = this.onScroll.bind(this);

      this.links.forEach((link, index) => {
        link.addEventListener('click', () => {
          this.select(index);
          this.lock();
        });
      });

      window.addEventListener('scroll', this.onScroll, {passive: true});
      this.update();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
      clearTimeout(this.lockTimer);
    }

    // Keep a clicked topic marked until its scroll has finished
    lock() {
      this.locked = true;
      clearTimeout(this.lockTimer);
      this.lockTimer = setTimeout(() => (this.locked = false), 1000);
    }

    onScroll() {
      if (this.locked) {
        clearTimeout(this.lockTimer);
        this.lockTimer = setTimeout(() => (this.locked = false), 200);
        return;
      }

      this.update();
    }

    update() {
      const line = window.innerHeight * 0.25;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      let current = 0;

      this.targets.forEach((target, index) => {
        if (target && target.getBoundingClientRect().top <= line) current = index;
      });

      if (atBottom) current = this.targets.length - 1;

      this.select(current);
    }

    select(index) {
      this.links.forEach((link, i) => {
        const isCurrent = i === index;
        link.classList.toggle('is-selected', isCurrent);

        if (isCurrent) {
          link.setAttribute('aria-current', 'true');
          this.reveal(link);
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    // Scroll a sideways topic row (mobile) so the marked topic is visible, without moving the page
    reveal(link) {
      const row = this.querySelector('.widget__links');
      if (!row || row.scrollWidth <= row.clientWidth) return;

      const linkBox = link.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();

      if (linkBox.left < rowBox.left || linkBox.right > rowBox.right) {
        row.scrollLeft += linkBox.left - rowBox.left;
      }
    }
  }

  customElements.define('sidebar-anchors', SidebarAnchors);
})();
