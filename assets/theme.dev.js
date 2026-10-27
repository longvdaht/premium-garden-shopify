
/*
* @license
* Headlands (c) Presidio Creative
*
* This file is included for advanced development by
* Shopify Agencies.  Modified versions of the theme
* code are not supported by Shopify or Presidio Creative.
*
* In order to use this file you will need to change
* theme.js to theme.dev.js in /layout/theme.liquid
*
*/

(function () {
    'use strict';

    (function() {
        const env = {"NODE_ENV":"production"};
        try {
            if (process) {
                process.env = Object.assign({}, process.env);
                Object.assign(process.env, env);
                return;
            }
        } catch (e) {} // avoid ReferenceError: process is not defined
        globalThis.process = { env:env };
    })();

    window.theme = window.theme || {};

    window.theme.sizes = {
      mobile: 480,
      small: 750,
      large: 990,
      widescreen: 1400,
    };

    window.theme.keyboardKeys = {
      TAB: 'Tab',
      ENTER: 'Enter',
      NUMPADENTER: 'NumpadEnter',
      ESCAPE: 'Escape',
      SPACE: 'Space',
      LEFTARROW: 'ArrowLeft',
      RIGHTARROW: 'ArrowRight',
    };

    window.theme.focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const PUB_SUB_EVENTS = {
      cartUpdate: 'cart-update',
      quantityUpdate: 'quantity-update',
      optionValueSelectionChange: 'option-value-selection-change',
      variantChange: 'variant-change',
      cartError: 'cart-error',
    };

    window.theme.PUB_SUB_EVENTS = PUB_SUB_EVENTS;

    let subscribers = {};

    function subscribe$1(eventName, callback) {
      if (subscribers[eventName] === undefined) {
        subscribers[eventName] = [];
      }

      subscribers[eventName] = [...subscribers[eventName], callback];

      return function unsubscribe() {
        subscribers[eventName] = subscribers[eventName].filter((cb) => {
          return cb !== callback;
        });
      };
    }

    function publish$1(eventName, data) {
      if (subscribers[eventName]) {
        const promises = subscribers[eventName].map((callback) => callback(data));
        return Promise.all(promises);
      } else {
        return Promise.resolve();
      }
    }

    window.publish = publish$1;
    window.subscribe = subscribe$1;

    /**
     * Currency Helpers
     * -----------------------------------------------------------------------------
     * A collection of useful functions that help with currency formatting
     *
     * Current contents
     * - formatMoney - Takes an amount in cents and returns it as a formatted dollar value.
     *
     */

    const moneyFormat = '${{amount}}';

    /**
     * Format money values based on your shop currency settings
     * @param  {Number|string} cents - value in cents or dollar amount e.g. 300 cents
     * or 3.00 dollars
     * @param  {String} format - shop money_format setting
     * @return {String} value - formatted value
     */
    window.theme.formatMoney = function (cents, format) {
      if (typeof cents === 'string') {
        cents = cents.replace('.', '');
      }
      let value = '';
      const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      const formatString = format || moneyFormat;

      function formatWithDelimiters(number, precision = 2, thousands = ',', decimal = '.') {
        if (isNaN(number) || number == null) {
          return 0;
        }

        number = (number / 100.0).toFixed(precision);

        const parts = number.split('.');
        const dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, `$1${thousands}`);
        const centsAmount = parts[1] ? decimal + parts[1] : '';

        return dollarsAmount + centsAmount;
      }

      switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
          value = formatWithDelimiters(cents, 2);
          break;
        case 'amount_no_decimals':
          value = formatWithDelimiters(cents, 0);
          break;
        case 'amount_with_comma_separator':
          value = formatWithDelimiters(cents, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          value = formatWithDelimiters(cents, 0, '.', ',');
          break;
        case 'amount_with_apostrophe_separator':
          value = formatWithDelimiters(cents, 2, "'", '.');
          break;
        case 'amount_no_decimals_with_space_separator':
          value = formatWithDelimiters(cents, 0, ' ', '');
          break;
        case 'amount_with_space_separator':
          value = formatWithDelimiters(cents, 2, ' ', ',');
          break;
        case 'amount_with_period_and_space_separator':
          value = formatWithDelimiters(cents, 2, ' ', '.');
          break;
      }

      return formatString.replace(placeholderRegex, value);
    };

    window.theme.debounce = function (fn, time) {
      let timeout;
      return function () {
        // eslint-disable-next-line prefer-rest-params
        if (fn) {
          const functionCall = () => fn.apply(this, arguments);
          clearTimeout(timeout);
          timeout = setTimeout(functionCall, time);
        }
      };
    };

    let screenOrientation = getScreenOrientation();
    let firstLoad = true;
    let frame = null;

    const root = document.documentElement;
    const cachedVars = {};

    function getScreenOrientation() {
      return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
    }

    function getViewportHeight() {
      return window.visualViewport?.height || window.innerHeight || theme.windowHeight;
    }

    function getHeight(selector) {
      return document.querySelector(selector)?.offsetHeight || 0;
    }

    function setRootVar(name, value) {
      const nextValue = `${Math.round(value)}px`;

      if (cachedVars[name] === nextValue) return;

      root.style.setProperty(name, nextValue);
      cachedVars[name] = nextValue;
    }

    function readHeights() {
      const headerHeight = getHeight('[data-header-height]');
      let enableHeaderSticky = true;
      const floatingHeader = document.querySelector('[data-header-floating]');
      const preventStickyHeader = document.querySelector('[data-prevent-sticky-header]');

      if (floatingHeader && preventStickyHeader) {
        enableHeaderSticky = false;
      }

      return {
        windowHeight: getViewportHeight(),
        headerHeight,
        stickyHeaderHeight: document.querySelector('[data-header-sticky]') && enableHeaderSticky ? headerHeight : 0,
        collectionNavHeight: getHeight('[data-filters-nav]'),
      };
    }

    window.theme.readHeights = readHeights;

    function setVars() {
      const heights = readHeights();
      const currentScreenOrientation = getScreenOrientation();

      const shouldUpdateViewportHeights = firstLoad || currentScreenOrientation !== screenOrientation || theme.windowWidth > window.theme.sizes.mobile;

      if (shouldUpdateViewportHeights) {
        setRootVar('--full-height', heights.windowHeight);
        setRootVar('--three-quarters', heights.windowHeight * 0.75);
        setRootVar('--two-thirds', heights.windowHeight * (2 / 3));
        setRootVar('--one-half', heights.windowHeight * 0.5);
        setRootVar('--one-third', heights.windowHeight / 3);

        screenOrientation = currentScreenOrientation;
        firstLoad = false;
      }

      setRootVar('--filters-nav-height', heights.collectionNavHeight);
      setRootVar('--header-height', heights.headerHeight);
    }

    function requestSetVars() {
      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = null;
        setVars();
      });
    }

    requestSetVars();

    window.addEventListener('DOMContentLoaded', requestSetVars);
    document.addEventListener('theme:resize', requestSetVars);
    document.addEventListener('shopify:section:load', requestSetVars);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', requestSetVars);
    }

    window.theme.scrollTo = (elementTop) => {
      const {stickyHeaderHeight} = window.theme.readHeights();

      window.scrollTo({
        top: elementTop + window.scrollY - stickyHeaderHeight,
        left: 0,
        behavior: 'smooth',
      });
    };

    /**
     * SSR Window 5.0.1
     * Better handling for window object in SSR environment
     * https://github.com/nolimits4web/ssr-window
     *
     * Copyright 2025, Vladimir Kharlampidi
     *
     * Licensed under MIT
     *
     * Released on: June 27, 2025
     */
    /* eslint-disable no-param-reassign */
    function isObject$2(obj) {
      return obj !== null && typeof obj === 'object' && 'constructor' in obj && obj.constructor === Object;
    }
    function extend$2(target = {}, src = {}) {
      const noExtend = ['__proto__', 'constructor', 'prototype'];
      Object.keys(src).filter(key => noExtend.indexOf(key) < 0).forEach(key => {
        if (typeof target[key] === 'undefined') target[key] = src[key];else if (isObject$2(src[key]) && isObject$2(target[key]) && Object.keys(src[key]).length > 0) {
          extend$2(target[key], src[key]);
        }
      });
    }
    const ssrDocument = {
      body: {},
      addEventListener() {},
      removeEventListener() {},
      activeElement: {
        blur() {},
        nodeName: ''
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementById() {
        return null;
      },
      createEvent() {
        return {
          initEvent() {}
        };
      },
      createElement() {
        return {
          children: [],
          childNodes: [],
          style: {},
          setAttribute() {},
          getElementsByTagName() {
            return [];
          }
        };
      },
      createElementNS() {
        return {};
      },
      importNode() {
        return null;
      },
      location: {
        hash: '',
        host: '',
        hostname: '',
        href: '',
        origin: '',
        pathname: '',
        protocol: '',
        search: ''
      }
    };
    function getDocument() {
      const doc = typeof document !== 'undefined' ? document : {};
      extend$2(doc, ssrDocument);
      return doc;
    }
    const ssrWindow = {
      document: ssrDocument,
      navigator: {
        userAgent: ''
      },
      location: {
        hash: '',
        host: '',
        hostname: '',
        href: '',
        origin: '',
        pathname: '',
        protocol: '',
        search: ''
      },
      history: {
        replaceState() {},
        pushState() {},
        go() {},
        back() {}
      },
      CustomEvent: function CustomEvent() {
        return this;
      },
      addEventListener() {},
      removeEventListener() {},
      getComputedStyle() {
        return {
          getPropertyValue() {
            return '';
          }
        };
      },
      Image() {},
      Date() {},
      screen: {},
      setTimeout() {},
      clearTimeout() {},
      matchMedia() {
        return {};
      },
      requestAnimationFrame(callback) {
        if (typeof setTimeout === 'undefined') {
          callback();
          return null;
        }
        return setTimeout(callback, 0);
      },
      cancelAnimationFrame(id) {
        if (typeof setTimeout === 'undefined') {
          return;
        }
        clearTimeout(id);
      }
    };
    function getWindow() {
      const win = typeof window !== 'undefined' ? window : {};
      extend$2(win, ssrWindow);
      return win;
    }

    function classesToTokens(classes = '') {
      return classes.trim().split(' ').filter(c => !!c.trim());
    }

    function deleteProps(obj) {
      const object = obj;
      Object.keys(object).forEach(key => {
        try {
          object[key] = null;
        } catch (e) {
          // no getter for object
        }
        try {
          delete object[key];
        } catch (e) {
          // something got wrong
        }
      });
    }
    function nextTick(callback, delay = 0) {
      return setTimeout(callback, delay);
    }
    function now() {
      return Date.now();
    }
    function getComputedStyle$1(el) {
      const window = getWindow();
      let style;
      if (window.getComputedStyle) {
        style = window.getComputedStyle(el, null);
      }
      if (!style && el.currentStyle) {
        style = el.currentStyle;
      }
      if (!style) {
        style = el.style;
      }
      return style;
    }
    function getTranslate(el, axis = 'x') {
      const window = getWindow();
      let matrix;
      let curTransform;
      let transformMatrix;
      const curStyle = getComputedStyle$1(el);
      if (window.WebKitCSSMatrix) {
        curTransform = curStyle.transform || curStyle.webkitTransform;
        if (curTransform.split(',').length > 6) {
          curTransform = curTransform.split(', ').map(a => a.replace(',', '.')).join(', ');
        }
        // Some old versions of Webkit choke when 'none' is passed; pass
        // empty string instead in this case
        transformMatrix = new window.WebKitCSSMatrix(curTransform === 'none' ? '' : curTransform);
      } else {
        transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue('transform').replace('translate(', 'matrix(1, 0, 0, 1,');
        matrix = transformMatrix.toString().split(',');
      }
      if (axis === 'x') {
        // Latest Chrome and webkits Fix
        if (window.WebKitCSSMatrix) curTransform = transformMatrix.m41;
        // Crazy IE10 Matrix
        else if (matrix.length === 16) curTransform = parseFloat(matrix[12]);
        // Normal Browsers
        else curTransform = parseFloat(matrix[4]);
      }
      if (axis === 'y') {
        // Latest Chrome and webkits Fix
        if (window.WebKitCSSMatrix) curTransform = transformMatrix.m42;
        // Crazy IE10 Matrix
        else if (matrix.length === 16) curTransform = parseFloat(matrix[13]);
        // Normal Browsers
        else curTransform = parseFloat(matrix[5]);
      }
      return curTransform || 0;
    }
    function isObject$1(o) {
      return typeof o === 'object' && o !== null && o.constructor && Object.prototype.toString.call(o).slice(8, -1) === 'Object';
    }
    function isNode(node) {
      // eslint-disable-next-line
      if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
        return node instanceof HTMLElement;
      }
      return node && (node.nodeType === 1 || node.nodeType === 11);
    }
    function extend$1(...args) {
      const to = Object(args[0]);
      for (let i = 1; i < args.length; i += 1) {
        const nextSource = args[i];
        if (nextSource !== undefined && nextSource !== null && !isNode(nextSource)) {
          const keysArray = Object.keys(Object(nextSource)).filter(key => key !== '__proto__' && key !== 'constructor' && key !== 'prototype');
          for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
            const nextKey = keysArray[nextIndex];
            const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
            if (desc !== undefined && desc.enumerable) {
              if (isObject$1(to[nextKey]) && isObject$1(nextSource[nextKey])) {
                if (nextSource[nextKey].__swiper__) {
                  to[nextKey] = nextSource[nextKey];
                } else {
                  extend$1(to[nextKey], nextSource[nextKey]);
                }
              } else if (!isObject$1(to[nextKey]) && isObject$1(nextSource[nextKey])) {
                to[nextKey] = {};
                if (nextSource[nextKey].__swiper__) {
                  to[nextKey] = nextSource[nextKey];
                } else {
                  extend$1(to[nextKey], nextSource[nextKey]);
                }
              } else {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
      }
      return to;
    }
    function setCSSProperty(el, varName, varValue) {
      el.style.setProperty(varName, varValue);
    }
    function animateCSSModeScroll({
      swiper,
      targetPosition,
      side
    }) {
      const window = getWindow();
      const startPosition = -swiper.translate;
      let startTime = null;
      let time;
      const duration = swiper.params.speed;
      swiper.wrapperEl.style.scrollSnapType = 'none';
      window.cancelAnimationFrame(swiper.cssModeFrameID);
      const dir = targetPosition > startPosition ? 'next' : 'prev';
      const isOutOfBound = (current, target) => {
        return dir === 'next' && current >= target || dir === 'prev' && current <= target;
      };
      const animate = () => {
        time = new Date().getTime();
        if (startTime === null) {
          startTime = time;
        }
        const progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
        const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
        let currentPosition = startPosition + easeProgress * (targetPosition - startPosition);
        if (isOutOfBound(currentPosition, targetPosition)) {
          currentPosition = targetPosition;
        }
        swiper.wrapperEl.scrollTo({
          [side]: currentPosition
        });
        if (isOutOfBound(currentPosition, targetPosition)) {
          swiper.wrapperEl.style.overflow = 'hidden';
          swiper.wrapperEl.style.scrollSnapType = '';
          setTimeout(() => {
            swiper.wrapperEl.style.overflow = '';
            swiper.wrapperEl.scrollTo({
              [side]: currentPosition
            });
          });
          window.cancelAnimationFrame(swiper.cssModeFrameID);
          return;
        }
        swiper.cssModeFrameID = window.requestAnimationFrame(animate);
      };
      animate();
    }
    function getSlideTransformEl(slideEl) {
      return slideEl.querySelector('.swiper-slide-transform') || slideEl.shadowRoot && slideEl.shadowRoot.querySelector('.swiper-slide-transform') || slideEl;
    }
    function elementChildren(element, selector = '') {
      const window = getWindow();
      const children = [...element.children];
      if (window.HTMLSlotElement && element instanceof HTMLSlotElement) {
        children.push(...element.assignedElements());
      }
      if (!selector) {
        return children;
      }
      return children.filter(el => el.matches(selector));
    }
    function elementIsChildOfSlot(el, slot) {
      // Breadth-first search through all parent's children and assigned elements
      const elementsQueue = [slot];
      while (elementsQueue.length > 0) {
        const elementToCheck = elementsQueue.shift();
        if (el === elementToCheck) {
          return true;
        }
        elementsQueue.push(...elementToCheck.children, ...(elementToCheck.shadowRoot ? elementToCheck.shadowRoot.children : []), ...(elementToCheck.assignedElements ? elementToCheck.assignedElements() : []));
      }
    }
    function elementIsChildOf(el, parent) {
      const window = getWindow();
      let isChild = parent.contains(el);
      if (!isChild && window.HTMLSlotElement && parent instanceof HTMLSlotElement) {
        const children = [...parent.assignedElements()];
        isChild = children.includes(el);
        if (!isChild) {
          isChild = elementIsChildOfSlot(el, parent);
        }
      }
      return isChild;
    }
    function showWarning(text) {
      try {
        console.warn(text);
        return;
      } catch (err) {
        // err
      }
    }
    function createElement(tag, classes = []) {
      const el = document.createElement(tag);
      el.classList.add(...(Array.isArray(classes) ? classes : classesToTokens(classes)));
      return el;
    }
    function elementOffset(el) {
      const window = getWindow();
      const document = getDocument();
      const box = el.getBoundingClientRect();
      const body = document.body;
      const clientTop = el.clientTop || body.clientTop || 0;
      const clientLeft = el.clientLeft || body.clientLeft || 0;
      const scrollTop = el === window ? window.scrollY : el.scrollTop;
      const scrollLeft = el === window ? window.scrollX : el.scrollLeft;
      return {
        top: box.top + scrollTop - clientTop,
        left: box.left + scrollLeft - clientLeft
      };
    }
    function elementPrevAll(el, selector) {
      const prevEls = [];
      while (el.previousElementSibling) {
        const prev = el.previousElementSibling; // eslint-disable-line
        if (selector) {
          if (prev.matches(selector)) prevEls.push(prev);
        } else prevEls.push(prev);
        el = prev;
      }
      return prevEls;
    }
    function elementNextAll(el, selector) {
      const nextEls = [];
      while (el.nextElementSibling) {
        const next = el.nextElementSibling; // eslint-disable-line
        if (selector) {
          if (next.matches(selector)) nextEls.push(next);
        } else nextEls.push(next);
        el = next;
      }
      return nextEls;
    }
    function elementStyle(el, prop) {
      const window = getWindow();
      return window.getComputedStyle(el, null).getPropertyValue(prop);
    }
    function elementIndex(el) {
      let child = el;
      let i;
      if (child) {
        i = 0;
        // eslint-disable-next-line
        while ((child = child.previousSibling) !== null) {
          if (child.nodeType === 1) i += 1;
        }
        return i;
      }
      return undefined;
    }
    function elementParents(el, selector) {
      const parents = []; // eslint-disable-line
      let parent = el.parentElement; // eslint-disable-line
      while (parent) {
        if (selector) {
          if (parent.matches(selector)) parents.push(parent);
        } else {
          parents.push(parent);
        }
        parent = parent.parentElement;
      }
      return parents;
    }
    function elementTransitionEnd(el, callback) {
      function fireCallBack(e) {
        if (e.target !== el) return;
        callback.call(el, e);
        el.removeEventListener('transitionend', fireCallBack);
      }
      if (callback) {
        el.addEventListener('transitionend', fireCallBack);
      }
    }
    function elementOuterSize(el, size, includeMargins) {
      const window = getWindow();
      if (includeMargins) {
        return el[size === 'width' ? 'offsetWidth' : 'offsetHeight'] + parseFloat(window.getComputedStyle(el, null).getPropertyValue(size === 'width' ? 'margin-right' : 'margin-top')) + parseFloat(window.getComputedStyle(el, null).getPropertyValue(size === 'width' ? 'margin-left' : 'margin-bottom'));
      }
      return el.offsetWidth;
    }
    function makeElementsArray(el) {
      return (Array.isArray(el) ? el : [el]).filter(e => !!e);
    }
    function getRotateFix(swiper) {
      return v => {
        if (Math.abs(v) > 0 && swiper.browser && swiper.browser.need3dFix && Math.abs(v) % 90 === 0) {
          return v + 0.001;
        }
        return v;
      };
    }
    function setInnerHTML(el, html = '') {
      if (typeof trustedTypes !== 'undefined') {
        el.innerHTML = trustedTypes.createPolicy('html', {
          createHTML: s => s
        }).createHTML(html);
      } else {
        el.innerHTML = html;
      }
    }

    let support;
    function calcSupport() {
      const window = getWindow();
      const document = getDocument();
      return {
        smoothScroll: document.documentElement && document.documentElement.style && 'scrollBehavior' in document.documentElement.style,
        touch: !!('ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch)
      };
    }
    function getSupport() {
      if (!support) {
        support = calcSupport();
      }
      return support;
    }

    let deviceCached;
    function calcDevice({
      userAgent
    } = {}) {
      const support = getSupport();
      const window = getWindow();
      const platform = window.navigator.platform;
      const ua = userAgent || window.navigator.userAgent;
      const device = {
        ios: false,
        android: false
      };
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/); // eslint-disable-line
      let ipad = ua.match(/(iPad)(?!\1).*OS\s([\d_]+)/);
      const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
      const iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
      const windows = platform === 'Win32';
      let macos = platform === 'MacIntel';

      // iPadOs 13 fix
      const iPadScreens = ['1024x1366', '1366x1024', '834x1194', '1194x834', '834x1112', '1112x834', '768x1024', '1024x768', '820x1180', '1180x820', '810x1080', '1080x810'];
      if (!ipad && macos && support.touch && iPadScreens.indexOf(`${screenWidth}x${screenHeight}`) >= 0) {
        ipad = ua.match(/(Version)\/([\d.]+)/);
        if (!ipad) ipad = [0, 1, '13_0_0'];
        macos = false;
      }

      // Android
      if (android && !windows) {
        device.os = 'android';
        device.android = true;
      }
      if (ipad || iphone || ipod) {
        device.os = 'ios';
        device.ios = true;
      }

      // Export object
      return device;
    }
    function getDevice(overrides = {}) {
      if (!deviceCached) {
        deviceCached = calcDevice(overrides);
      }
      return deviceCached;
    }

    let browser;
    function calcBrowser() {
      const window = getWindow();
      const device = getDevice();
      let needPerspectiveFix = false;
      function isSafari() {
        const ua = window.navigator.userAgent.toLowerCase();
        return ua.indexOf('safari') >= 0 && ua.indexOf('chrome') < 0 && ua.indexOf('android') < 0;
      }
      if (isSafari()) {
        const ua = String(window.navigator.userAgent);
        if (ua.includes('Version/')) {
          const [major, minor] = ua.split('Version/')[1].split(' ')[0].split('.').map(num => Number(num));
          needPerspectiveFix = major < 16 || major === 16 && minor < 2;
        }
      }
      const isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(window.navigator.userAgent);
      const isSafariBrowser = isSafari();
      const need3dFix = isSafariBrowser || isWebView && device.ios;
      return {
        isSafari: needPerspectiveFix || isSafariBrowser,
        needPerspectiveFix,
        need3dFix,
        isWebView
      };
    }
    function getBrowser() {
      if (!browser) {
        browser = calcBrowser();
      }
      return browser;
    }

    function Resize({
      swiper,
      on,
      emit
    }) {
      const window = getWindow();
      let observer = null;
      let animationFrame = null;
      const resizeHandler = () => {
        if (!swiper || swiper.destroyed || !swiper.initialized) return;
        emit('beforeResize');
        emit('resize');
      };
      const createObserver = () => {
        if (!swiper || swiper.destroyed || !swiper.initialized) return;
        observer = new ResizeObserver(entries => {
          animationFrame = window.requestAnimationFrame(() => {
            const {
              width,
              height
            } = swiper;
            let newWidth = width;
            let newHeight = height;
            entries.forEach(({
              contentBoxSize,
              contentRect,
              target
            }) => {
              if (target && target !== swiper.el) return;
              newWidth = contentRect ? contentRect.width : (contentBoxSize[0] || contentBoxSize).inlineSize;
              newHeight = contentRect ? contentRect.height : (contentBoxSize[0] || contentBoxSize).blockSize;
            });
            if (newWidth !== width || newHeight !== height) {
              resizeHandler();
            }
          });
        });
        observer.observe(swiper.el);
      };
      const removeObserver = () => {
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
        }
        if (observer && observer.unobserve && swiper.el) {
          observer.unobserve(swiper.el);
          observer = null;
        }
      };
      const orientationChangeHandler = () => {
        if (!swiper || swiper.destroyed || !swiper.initialized) return;
        emit('orientationchange');
      };
      on('init', () => {
        if (swiper.params.resizeObserver && typeof window.ResizeObserver !== 'undefined') {
          createObserver();
          return;
        }
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('orientationchange', orientationChangeHandler);
      });
      on('destroy', () => {
        removeObserver();
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('orientationchange', orientationChangeHandler);
      });
    }

    function Observer({
      swiper,
      extendParams,
      on,
      emit
    }) {
      const observers = [];
      const window = getWindow();
      const attach = (target, options = {}) => {
        const ObserverFunc = window.MutationObserver || window.WebkitMutationObserver;
        const observer = new ObserverFunc(mutations => {
          // The observerUpdate event should only be triggered
          // once despite the number of mutations.  Additional
          // triggers are redundant and are very costly
          if (swiper.__preventObserver__) return;
          if (mutations.length === 1) {
            emit('observerUpdate', mutations[0]);
            return;
          }
          const observerUpdate = function observerUpdate() {
            emit('observerUpdate', mutations[0]);
          };
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(observerUpdate);
          } else {
            window.setTimeout(observerUpdate, 0);
          }
        });
        observer.observe(target, {
          attributes: typeof options.attributes === 'undefined' ? true : options.attributes,
          childList: swiper.isElement || (typeof options.childList === 'undefined' ? true : options).childList,
          characterData: typeof options.characterData === 'undefined' ? true : options.characterData
        });
        observers.push(observer);
      };
      const init = () => {
        if (!swiper.params.observer) return;
        if (swiper.params.observeParents) {
          const containerParents = elementParents(swiper.hostEl);
          for (let i = 0; i < containerParents.length; i += 1) {
            attach(containerParents[i]);
          }
        }
        // Observe container
        attach(swiper.hostEl, {
          childList: swiper.params.observeSlideChildren
        });

        // Observe wrapper
        attach(swiper.wrapperEl, {
          attributes: false
        });
      };
      const destroy = () => {
        observers.forEach(observer => {
          observer.disconnect();
        });
        observers.splice(0, observers.length);
      };
      extendParams({
        observer: false,
        observeParents: false,
        observeSlideChildren: false
      });
      on('init', init);
      on('destroy', destroy);
    }

    /* eslint-disable no-underscore-dangle */

    var eventsEmitter = {
      on(events, handler, priority) {
        const self = this;
        if (!self.eventsListeners || self.destroyed) return self;
        if (typeof handler !== 'function') return self;
        const method = priority ? 'unshift' : 'push';
        events.split(' ').forEach(event => {
          if (!self.eventsListeners[event]) self.eventsListeners[event] = [];
          self.eventsListeners[event][method](handler);
        });
        return self;
      },
      once(events, handler, priority) {
        const self = this;
        if (!self.eventsListeners || self.destroyed) return self;
        if (typeof handler !== 'function') return self;
        function onceHandler(...args) {
          self.off(events, onceHandler);
          if (onceHandler.__emitterProxy) {
            delete onceHandler.__emitterProxy;
          }
          handler.apply(self, args);
        }
        onceHandler.__emitterProxy = handler;
        return self.on(events, onceHandler, priority);
      },
      onAny(handler, priority) {
        const self = this;
        if (!self.eventsListeners || self.destroyed) return self;
        if (typeof handler !== 'function') return self;
        const method = priority ? 'unshift' : 'push';
        if (self.eventsAnyListeners.indexOf(handler) < 0) {
          self.eventsAnyListeners[method](handler);
        }
        return self;
      },
      offAny(handler) {
        const self = this;
        if (!self.eventsListeners || self.destroyed) return self;
        if (!self.eventsAnyListeners) return self;
        const index = self.eventsAnyListeners.indexOf(handler);
        if (index >= 0) {
          self.eventsAnyListeners.splice(index, 1);
        }
        return self;
      },
      off(events, handler) {
        const self = this;
        if (!self.eventsListeners || self.destroyed) return self;
        if (!self.eventsListeners) return self;
        events.split(' ').forEach(event => {
          if (typeof handler === 'undefined') {
            self.eventsListeners[event] = [];
          } else if (self.eventsListeners[event]) {
            self.eventsListeners[event].forEach((eventHandler, index) => {
              if (eventHandler === handler || eventHandler.__emitterProxy && eventHandler.__emitterProxy === handler) {
                self.eventsListeners[event].splice(index, 1);
              }
            });
          }
        });
        return self;
      },
      emit(...args) {
        const self = this;
        if (!self.eventsListeners || self.destroyed) return self;
        if (!self.eventsListeners) return self;
        let events;
        let data;
        let context;
        if (typeof args[0] === 'string' || Array.isArray(args[0])) {
          events = args[0];
          data = args.slice(1, args.length);
          context = self;
        } else {
          events = args[0].events;
          data = args[0].data;
          context = args[0].context || self;
        }
        data.unshift(context);
        const eventsArray = Array.isArray(events) ? events : events.split(' ');
        eventsArray.forEach(event => {
          if (self.eventsAnyListeners && self.eventsAnyListeners.length) {
            self.eventsAnyListeners.forEach(eventHandler => {
              eventHandler.apply(context, [event, ...data]);
            });
          }
          if (self.eventsListeners && self.eventsListeners[event]) {
            self.eventsListeners[event].forEach(eventHandler => {
              eventHandler.apply(context, data);
            });
          }
        });
        return self;
      }
    };

    function updateSize() {
      const swiper = this;
      let width;
      let height;
      const el = swiper.el;
      if (typeof swiper.params.width !== 'undefined' && swiper.params.width !== null) {
        width = swiper.params.width;
      } else {
        width = el.clientWidth;
      }
      if (typeof swiper.params.height !== 'undefined' && swiper.params.height !== null) {
        height = swiper.params.height;
      } else {
        height = el.clientHeight;
      }
      if (width === 0 && swiper.isHorizontal() || height === 0 && swiper.isVertical()) {
        return;
      }

      // Subtract paddings
      width = width - parseInt(elementStyle(el, 'padding-left') || 0, 10) - parseInt(elementStyle(el, 'padding-right') || 0, 10);
      height = height - parseInt(elementStyle(el, 'padding-top') || 0, 10) - parseInt(elementStyle(el, 'padding-bottom') || 0, 10);
      if (Number.isNaN(width)) width = 0;
      if (Number.isNaN(height)) height = 0;
      Object.assign(swiper, {
        width,
        height,
        size: swiper.isHorizontal() ? width : height
      });
    }

    function updateSlides() {
      const swiper = this;
      function getDirectionPropertyValue(node, label) {
        return parseFloat(node.getPropertyValue(swiper.getDirectionLabel(label)) || 0);
      }
      const params = swiper.params;
      const {
        wrapperEl,
        slidesEl,
        rtlTranslate: rtl,
        wrongRTL
      } = swiper;
      const isVirtual = swiper.virtual && params.virtual.enabled;
      const previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
      const slides = elementChildren(slidesEl, `.${swiper.params.slideClass}, swiper-slide`);
      const slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
      let snapGrid = [];
      const slidesGrid = [];
      const slidesSizesGrid = [];
      let offsetBefore = params.slidesOffsetBefore;
      if (typeof offsetBefore === 'function') {
        offsetBefore = params.slidesOffsetBefore.call(swiper);
      }
      let offsetAfter = params.slidesOffsetAfter;
      if (typeof offsetAfter === 'function') {
        offsetAfter = params.slidesOffsetAfter.call(swiper);
      }
      const previousSnapGridLength = swiper.snapGrid.length;
      const previousSlidesGridLength = swiper.slidesGrid.length;
      const swiperSize = swiper.size - offsetBefore - offsetAfter;
      let spaceBetween = params.spaceBetween;
      let slidePosition = -offsetBefore;
      let prevSlideSize = 0;
      let index = 0;
      if (typeof swiperSize === 'undefined') {
        return;
      }
      if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
        spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * swiperSize;
      } else if (typeof spaceBetween === 'string') {
        spaceBetween = parseFloat(spaceBetween);
      }
      swiper.virtualSize = -spaceBetween - offsetBefore - offsetAfter;

      // reset margins
      slides.forEach(slideEl => {
        if (rtl) {
          slideEl.style.marginLeft = '';
        } else {
          slideEl.style.marginRight = '';
        }
        slideEl.style.marginBottom = '';
        slideEl.style.marginTop = '';
      });

      // reset cssMode offsets
      if (params.centeredSlides && params.cssMode) {
        setCSSProperty(wrapperEl, '--swiper-centered-offset-before', '');
        setCSSProperty(wrapperEl, '--swiper-centered-offset-after', '');
      }

      // set cssMode offsets
      if (params.cssMode) {
        setCSSProperty(wrapperEl, '--swiper-slides-offset-before', `${offsetBefore}px`);
        setCSSProperty(wrapperEl, '--swiper-slides-offset-after', `${offsetAfter}px`);
      }
      const gridEnabled = params.grid && params.grid.rows > 1 && swiper.grid;
      if (gridEnabled) {
        swiper.grid.initSlides(slides);
      } else if (swiper.grid) {
        swiper.grid.unsetSlides();
      }

      // Calc slides
      let slideSize;
      const shouldResetSlideSize = params.slidesPerView === 'auto' && params.breakpoints && Object.keys(params.breakpoints).filter(key => {
        return typeof params.breakpoints[key].slidesPerView !== 'undefined';
      }).length > 0;
      for (let i = 0; i < slidesLength; i += 1) {
        slideSize = 0;
        const slide = slides[i];
        if (slide) {
          if (gridEnabled) {
            swiper.grid.updateSlide(i, slide, slides);
          }
          if (elementStyle(slide, 'display') === 'none') continue; // eslint-disable-line
        }

        if (isVirtual && params.slidesPerView === 'auto') {
          if (params.virtual.slidesPerViewAutoSlideSize) {
            slideSize = params.virtual.slidesPerViewAutoSlideSize;
          }
          if (slideSize && slide) {
            if (params.roundLengths) slideSize = Math.floor(slideSize);
            slide.style[swiper.getDirectionLabel('width')] = `${slideSize}px`;
          }
        } else if (params.slidesPerView === 'auto') {
          if (shouldResetSlideSize) {
            slide.style[swiper.getDirectionLabel('width')] = ``;
          }
          const slideStyles = getComputedStyle(slide);
          const currentTransform = slide.style.transform;
          const currentWebKitTransform = slide.style.webkitTransform;
          if (currentTransform) {
            slide.style.transform = 'none';
          }
          if (currentWebKitTransform) {
            slide.style.webkitTransform = 'none';
          }
          if (params.roundLengths) {
            slideSize = swiper.isHorizontal() ? elementOuterSize(slide, 'width', true) : elementOuterSize(slide, 'height', true);
          } else {
            // eslint-disable-next-line
            const width = getDirectionPropertyValue(slideStyles, 'width');
            const paddingLeft = getDirectionPropertyValue(slideStyles, 'padding-left');
            const paddingRight = getDirectionPropertyValue(slideStyles, 'padding-right');
            const marginLeft = getDirectionPropertyValue(slideStyles, 'margin-left');
            const marginRight = getDirectionPropertyValue(slideStyles, 'margin-right');
            const boxSizing = slideStyles.getPropertyValue('box-sizing');
            if (boxSizing && boxSizing === 'border-box') {
              slideSize = width + marginLeft + marginRight;
            } else {
              const {
                clientWidth,
                offsetWidth
              } = slide;
              slideSize = width + paddingLeft + paddingRight + marginLeft + marginRight + (offsetWidth - clientWidth);
            }
          }
          if (currentTransform) {
            slide.style.transform = currentTransform;
          }
          if (currentWebKitTransform) {
            slide.style.webkitTransform = currentWebKitTransform;
          }
          if (params.roundLengths) slideSize = Math.floor(slideSize);
        } else {
          slideSize = (swiperSize - (params.slidesPerView - 1) * spaceBetween) / params.slidesPerView;
          if (params.roundLengths) slideSize = Math.floor(slideSize);
          if (slide) {
            slide.style[swiper.getDirectionLabel('width')] = `${slideSize}px`;
          }
        }
        if (slide) {
          slide.swiperSlideSize = slideSize;
        }
        slidesSizesGrid.push(slideSize);
        if (params.centeredSlides) {
          slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
          if (prevSlideSize === 0 && i !== 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
          if (i === 0) slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
          if (Math.abs(slidePosition) < 1 / 1000) slidePosition = 0;
          if (params.roundLengths) slidePosition = Math.floor(slidePosition);
          if (index % params.slidesPerGroup === 0) snapGrid.push(slidePosition);
          slidesGrid.push(slidePosition);
        } else {
          if (params.roundLengths) slidePosition = Math.floor(slidePosition);
          if ((index - Math.min(swiper.params.slidesPerGroupSkip, index)) % swiper.params.slidesPerGroup === 0) snapGrid.push(slidePosition);
          slidesGrid.push(slidePosition);
          slidePosition = slidePosition + slideSize + spaceBetween;
        }
        swiper.virtualSize += slideSize + spaceBetween;
        prevSlideSize = slideSize;
        index += 1;
      }
      swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;
      if (rtl && wrongRTL && (params.effect === 'slide' || params.effect === 'coverflow')) {
        wrapperEl.style.width = `${swiper.virtualSize + spaceBetween}px`;
      }
      if (params.setWrapperSize) {
        wrapperEl.style[swiper.getDirectionLabel('width')] = `${swiper.virtualSize + spaceBetween}px`;
      }
      if (gridEnabled) {
        swiper.grid.updateWrapperSize(slideSize, snapGrid);
      }

      // Remove last grid elements depending on width
      if (!params.centeredSlides) {
        // Check if snapToSlideEdge should be applied
        const isFractionalSlidesPerView = params.slidesPerView !== 'auto' && params.slidesPerView % 1 !== 0;
        const shouldSnapToSlideEdge = params.snapToSlideEdge && !params.loop && (params.slidesPerView === 'auto' || isFractionalSlidesPerView);

        // Calculate the last allowed snap index when snapToSlideEdge is enabled
        // This ensures minimum slides are visible at the end
        let lastAllowedSnapIndex = snapGrid.length;
        if (shouldSnapToSlideEdge) {
          let minVisibleSlides;
          if (params.slidesPerView === 'auto') {
            // For 'auto' mode, calculate how many slides fit based on actual sizes
            minVisibleSlides = 1;
            let accumulatedSize = 0;
            for (let i = slidesSizesGrid.length - 1; i >= 0; i -= 1) {
              accumulatedSize += slidesSizesGrid[i] + (i < slidesSizesGrid.length - 1 ? spaceBetween : 0);
              if (accumulatedSize <= swiperSize) {
                minVisibleSlides = slidesSizesGrid.length - i;
              } else {
                break;
              }
            }
          } else {
            minVisibleSlides = Math.floor(params.slidesPerView);
          }
          lastAllowedSnapIndex = Math.max(slidesLength - minVisibleSlides, 0);
        }
        const newSlidesGrid = [];
        for (let i = 0; i < snapGrid.length; i += 1) {
          let slidesGridItem = snapGrid[i];
          if (params.roundLengths) slidesGridItem = Math.floor(slidesGridItem);
          if (shouldSnapToSlideEdge) {
            // When snapToSlideEdge is enabled, only keep snaps up to lastAllowedSnapIndex
            if (i <= lastAllowedSnapIndex) {
              newSlidesGrid.push(slidesGridItem);
            }
          } else if (snapGrid[i] <= swiper.virtualSize - swiperSize) {
            // When snapToSlideEdge is disabled, keep snaps that fit within scrollable area
            newSlidesGrid.push(slidesGridItem);
          }
        }
        snapGrid = newSlidesGrid;
        if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
          // Only add edge-aligned snap if snapToSlideEdge is not enabled
          if (!shouldSnapToSlideEdge) {
            snapGrid.push(swiper.virtualSize - swiperSize);
          }
        }
      }
      if (isVirtual && params.loop) {
        const size = slidesSizesGrid[0] + spaceBetween;
        if (params.slidesPerGroup > 1) {
          const groups = Math.ceil((swiper.virtual.slidesBefore + swiper.virtual.slidesAfter) / params.slidesPerGroup);
          const groupSize = size * params.slidesPerGroup;
          for (let i = 0; i < groups; i += 1) {
            snapGrid.push(snapGrid[snapGrid.length - 1] + groupSize);
          }
        }
        for (let i = 0; i < swiper.virtual.slidesBefore + swiper.virtual.slidesAfter; i += 1) {
          if (params.slidesPerGroup === 1) {
            snapGrid.push(snapGrid[snapGrid.length - 1] + size);
          }
          slidesGrid.push(slidesGrid[slidesGrid.length - 1] + size);
          swiper.virtualSize += size;
        }
      }
      if (snapGrid.length === 0) snapGrid = [0];
      if (spaceBetween !== 0) {
        const key = swiper.isHorizontal() && rtl ? 'marginLeft' : swiper.getDirectionLabel('marginRight');
        slides.filter((_, slideIndex) => {
          if (!params.cssMode || params.loop) return true;
          if (slideIndex === slides.length - 1) {
            return false;
          }
          return true;
        }).forEach(slideEl => {
          slideEl.style[key] = `${spaceBetween}px`;
        });
      }
      if (params.centeredSlides && params.centeredSlidesBounds) {
        let allSlidesSize = 0;
        slidesSizesGrid.forEach(slideSizeValue => {
          allSlidesSize += slideSizeValue + (spaceBetween || 0);
        });
        allSlidesSize -= spaceBetween;
        const maxSnap = allSlidesSize > swiperSize ? allSlidesSize - swiperSize : 0;
        snapGrid = snapGrid.map(snap => {
          if (snap <= 0) return -offsetBefore;
          if (snap > maxSnap) return maxSnap + offsetAfter;
          return snap;
        });
      }
      if (params.centerInsufficientSlides) {
        let allSlidesSize = 0;
        slidesSizesGrid.forEach(slideSizeValue => {
          allSlidesSize += slideSizeValue + (spaceBetween || 0);
        });
        allSlidesSize -= spaceBetween;
        if (allSlidesSize < swiperSize) {
          const allSlidesOffset = (swiperSize - allSlidesSize) / 2;
          snapGrid.forEach((snap, snapIndex) => {
            snapGrid[snapIndex] = snap - allSlidesOffset;
          });
          slidesGrid.forEach((snap, snapIndex) => {
            slidesGrid[snapIndex] = snap + allSlidesOffset;
          });
        }
      }
      Object.assign(swiper, {
        slides,
        snapGrid,
        slidesGrid,
        slidesSizesGrid
      });
      if (params.centeredSlides && params.cssMode && !params.centeredSlidesBounds) {
        setCSSProperty(wrapperEl, '--swiper-centered-offset-before', `${-snapGrid[0]}px`);
        setCSSProperty(wrapperEl, '--swiper-centered-offset-after', `${swiper.size / 2 - slidesSizesGrid[slidesSizesGrid.length - 1] / 2}px`);
        const addToSnapGrid = -swiper.snapGrid[0];
        const addToSlidesGrid = -swiper.slidesGrid[0];
        swiper.snapGrid = swiper.snapGrid.map(v => v + addToSnapGrid);
        swiper.slidesGrid = swiper.slidesGrid.map(v => v + addToSlidesGrid);
      }
      if (slidesLength !== previousSlidesLength) {
        swiper.emit('slidesLengthChange');
      }
      if (snapGrid.length !== previousSnapGridLength) {
        if (swiper.params.watchOverflow) swiper.checkOverflow();
        swiper.emit('snapGridLengthChange');
      }
      if (slidesGrid.length !== previousSlidesGridLength) {
        swiper.emit('slidesGridLengthChange');
      }
      if (params.watchSlidesProgress) {
        swiper.updateSlidesOffset();
      }
      swiper.emit('slidesUpdated');
      if (!isVirtual && !params.cssMode && (params.effect === 'slide' || params.effect === 'fade')) {
        const backFaceHiddenClass = `${params.containerModifierClass}backface-hidden`;
        const hasClassBackfaceClassAdded = swiper.el.classList.contains(backFaceHiddenClass);
        if (slidesLength <= params.maxBackfaceHiddenSlides) {
          if (!hasClassBackfaceClassAdded) swiper.el.classList.add(backFaceHiddenClass);
        } else if (hasClassBackfaceClassAdded) {
          swiper.el.classList.remove(backFaceHiddenClass);
        }
      }
    }

    function updateAutoHeight(speed) {
      const swiper = this;
      const activeSlides = [];
      const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
      let newHeight = 0;
      let i;
      if (typeof speed === 'number') {
        swiper.setTransition(speed);
      } else if (speed === true) {
        swiper.setTransition(swiper.params.speed);
      }
      const getSlideByIndex = index => {
        if (isVirtual) {
          return swiper.slides[swiper.getSlideIndexByData(index)];
        }
        return swiper.slides[index];
      };
      // Find slides currently in view
      if (swiper.params.slidesPerView !== 'auto' && swiper.params.slidesPerView > 1) {
        if (swiper.params.centeredSlides) {
          (swiper.visibleSlides || []).forEach(slide => {
            activeSlides.push(slide);
          });
        } else {
          for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
            const index = swiper.activeIndex + i;
            if (index > swiper.slides.length && !isVirtual) break;
            activeSlides.push(getSlideByIndex(index));
          }
        }
      } else {
        activeSlides.push(getSlideByIndex(swiper.activeIndex));
      }

      // Find new height from highest slide in view
      for (i = 0; i < activeSlides.length; i += 1) {
        if (typeof activeSlides[i] !== 'undefined') {
          const height = activeSlides[i].offsetHeight;
          newHeight = height > newHeight ? height : newHeight;
        }
      }

      // Update Height
      if (newHeight || newHeight === 0) swiper.wrapperEl.style.height = `${newHeight}px`;
    }

    function updateSlidesOffset() {
      const swiper = this;
      const slides = swiper.slides;
      // eslint-disable-next-line
      const minusOffset = swiper.isElement ? swiper.isHorizontal() ? swiper.wrapperEl.offsetLeft : swiper.wrapperEl.offsetTop : 0;
      for (let i = 0; i < slides.length; i += 1) {
        slides[i].swiperSlideOffset = (swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop) - minusOffset - swiper.cssOverflowAdjustment();
      }
    }

    const toggleSlideClasses$1 = (slideEl, condition, className) => {
      if (condition && !slideEl.classList.contains(className)) {
        slideEl.classList.add(className);
      } else if (!condition && slideEl.classList.contains(className)) {
        slideEl.classList.remove(className);
      }
    };
    function updateSlidesProgress(translate = this && this.translate || 0) {
      const swiper = this;
      const params = swiper.params;
      const {
        slides,
        rtlTranslate: rtl,
        snapGrid
      } = swiper;
      if (slides.length === 0) return;
      if (typeof slides[0].swiperSlideOffset === 'undefined') swiper.updateSlidesOffset();
      let offsetCenter = -translate;
      if (rtl) offsetCenter = translate;
      swiper.visibleSlidesIndexes = [];
      swiper.visibleSlides = [];
      let spaceBetween = params.spaceBetween;
      if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
        spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * swiper.size;
      } else if (typeof spaceBetween === 'string') {
        spaceBetween = parseFloat(spaceBetween);
      }
      for (let i = 0; i < slides.length; i += 1) {
        const slide = slides[i];
        let slideOffset = slide.swiperSlideOffset;
        if (params.cssMode && params.centeredSlides) {
          slideOffset -= slides[0].swiperSlideOffset;
        }
        const slideProgress = (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide.swiperSlideSize + spaceBetween);
        const originalSlideProgress = (offsetCenter - snapGrid[0] + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide.swiperSlideSize + spaceBetween);
        const slideBefore = -(offsetCenter - slideOffset);
        const slideAfter = slideBefore + swiper.slidesSizesGrid[i];
        const isFullyVisible = slideBefore >= 0 && slideBefore <= swiper.size - swiper.slidesSizesGrid[i];
        const isVisible = slideBefore >= 0 && slideBefore < swiper.size - 1 || slideAfter > 1 && slideAfter <= swiper.size || slideBefore <= 0 && slideAfter >= swiper.size;
        if (isVisible) {
          swiper.visibleSlides.push(slide);
          swiper.visibleSlidesIndexes.push(i);
        }
        toggleSlideClasses$1(slide, isVisible, params.slideVisibleClass);
        toggleSlideClasses$1(slide, isFullyVisible, params.slideFullyVisibleClass);
        slide.progress = rtl ? -slideProgress : slideProgress;
        slide.originalProgress = rtl ? -originalSlideProgress : originalSlideProgress;
      }
    }

    function updateProgress(translate) {
      const swiper = this;
      if (typeof translate === 'undefined') {
        const multiplier = swiper.rtlTranslate ? -1 : 1;
        // eslint-disable-next-line
        translate = swiper && swiper.translate && swiper.translate * multiplier || 0;
      }
      const params = swiper.params;
      const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
      let {
        progress,
        isBeginning,
        isEnd,
        progressLoop
      } = swiper;
      const wasBeginning = isBeginning;
      const wasEnd = isEnd;
      if (translatesDiff === 0) {
        progress = 0;
        isBeginning = true;
        isEnd = true;
      } else {
        progress = (translate - swiper.minTranslate()) / translatesDiff;
        const isBeginningRounded = Math.abs(translate - swiper.minTranslate()) < 1;
        const isEndRounded = Math.abs(translate - swiper.maxTranslate()) < 1;
        isBeginning = isBeginningRounded || progress <= 0;
        isEnd = isEndRounded || progress >= 1;
        if (isBeginningRounded) progress = 0;
        if (isEndRounded) progress = 1;
      }
      if (params.loop) {
        const firstSlideIndex = swiper.getSlideIndexByData(0);
        const lastSlideIndex = swiper.getSlideIndexByData(swiper.slides.length - 1);
        const firstSlideTranslate = swiper.slidesGrid[firstSlideIndex];
        const lastSlideTranslate = swiper.slidesGrid[lastSlideIndex];
        const translateMax = swiper.slidesGrid[swiper.slidesGrid.length - 1];
        const translateAbs = Math.abs(translate);
        if (translateAbs >= firstSlideTranslate) {
          progressLoop = (translateAbs - firstSlideTranslate) / translateMax;
        } else {
          progressLoop = (translateAbs + translateMax - lastSlideTranslate) / translateMax;
        }
        if (progressLoop > 1) progressLoop -= 1;
      }
      Object.assign(swiper, {
        progress,
        progressLoop,
        isBeginning,
        isEnd
      });
      if (params.watchSlidesProgress || params.centeredSlides && params.autoHeight) swiper.updateSlidesProgress(translate);
      if (isBeginning && !wasBeginning) {
        swiper.emit('reachBeginning toEdge');
      }
      if (isEnd && !wasEnd) {
        swiper.emit('reachEnd toEdge');
      }
      if (wasBeginning && !isBeginning || wasEnd && !isEnd) {
        swiper.emit('fromEdge');
      }
      swiper.emit('progress', progress);
    }

    const toggleSlideClasses = (slideEl, condition, className) => {
      if (condition && !slideEl.classList.contains(className)) {
        slideEl.classList.add(className);
      } else if (!condition && slideEl.classList.contains(className)) {
        slideEl.classList.remove(className);
      }
    };
    function updateSlidesClasses() {
      const swiper = this;
      const {
        slides,
        params,
        slidesEl,
        activeIndex
      } = swiper;
      const isVirtual = swiper.virtual && params.virtual.enabled;
      const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
      const getFilteredSlide = selector => {
        return elementChildren(slidesEl, `.${params.slideClass}${selector}, swiper-slide${selector}`)[0];
      };
      let activeSlide;
      let prevSlide;
      let nextSlide;
      if (isVirtual) {
        if (params.loop) {
          let slideIndex = activeIndex - swiper.virtual.slidesBefore;
          if (slideIndex < 0) slideIndex = swiper.virtual.slides.length + slideIndex;
          if (slideIndex >= swiper.virtual.slides.length) slideIndex -= swiper.virtual.slides.length;
          activeSlide = getFilteredSlide(`[data-swiper-slide-index="${slideIndex}"]`);
        } else {
          activeSlide = getFilteredSlide(`[data-swiper-slide-index="${activeIndex}"]`);
        }
      } else {
        if (gridEnabled) {
          activeSlide = slides.find(slideEl => slideEl.column === activeIndex);
          nextSlide = slides.find(slideEl => slideEl.column === activeIndex + 1);
          prevSlide = slides.find(slideEl => slideEl.column === activeIndex - 1);
        } else {
          activeSlide = slides[activeIndex];
        }
      }
      if (activeSlide) {
        if (!gridEnabled) {
          // Next Slide
          nextSlide = elementNextAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
          if (params.loop && !nextSlide) {
            nextSlide = slides[0];
          }

          // Prev Slide
          prevSlide = elementPrevAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
          if (params.loop && !prevSlide === 0) {
            prevSlide = slides[slides.length - 1];
          }
        }
      }
      slides.forEach(slideEl => {
        toggleSlideClasses(slideEl, slideEl === activeSlide, params.slideActiveClass);
        toggleSlideClasses(slideEl, slideEl === nextSlide, params.slideNextClass);
        toggleSlideClasses(slideEl, slideEl === prevSlide, params.slidePrevClass);
      });
      swiper.emitSlidesClasses();
    }

    const processLazyPreloader = (swiper, imageEl) => {
      if (!swiper || swiper.destroyed || !swiper.params) return;
      const slideSelector = () => swiper.isElement ? `swiper-slide` : `.${swiper.params.slideClass}`;
      const slideEl = imageEl.closest(slideSelector());
      if (slideEl) {
        let lazyEl = slideEl.querySelector(`.${swiper.params.lazyPreloaderClass}`);
        if (!lazyEl && swiper.isElement) {
          if (slideEl.shadowRoot) {
            lazyEl = slideEl.shadowRoot.querySelector(`.${swiper.params.lazyPreloaderClass}`);
          } else {
            // init later
            requestAnimationFrame(() => {
              if (slideEl.shadowRoot) {
                lazyEl = slideEl.shadowRoot.querySelector(`.${swiper.params.lazyPreloaderClass}`);
                if (lazyEl && !lazyEl.lazyPreloaderManaged) lazyEl.remove();
              }
            });
          }
        }
        // Skip removal if managed by React/Vue component
        if (lazyEl && !lazyEl.lazyPreloaderManaged) lazyEl.remove();
      }
    };
    const unlazy = (swiper, index) => {
      if (!swiper.slides[index]) return;
      const imageEl = swiper.slides[index].querySelector('[loading="lazy"]');
      if (imageEl) imageEl.removeAttribute('loading');
    };
    const preload = swiper => {
      if (!swiper || swiper.destroyed || !swiper.params) return;
      let amount = swiper.params.lazyPreloadPrevNext;
      const len = swiper.slides.length;
      if (!len || !amount || amount < 0) return;
      amount = Math.min(amount, len);
      const slidesPerView = swiper.params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : Math.ceil(swiper.params.slidesPerView);
      const activeIndex = swiper.activeIndex;
      if (swiper.params.grid && swiper.params.grid.rows > 1) {
        const activeColumn = activeIndex;
        const preloadColumns = [activeColumn - amount];
        preloadColumns.push(...Array.from({
          length: amount
        }).map((_, i) => {
          return activeColumn + slidesPerView + i;
        }));
        swiper.slides.forEach((slideEl, i) => {
          if (preloadColumns.includes(slideEl.column)) unlazy(swiper, i);
        });
        return;
      }
      const slideIndexLastInView = activeIndex + slidesPerView - 1;
      if (swiper.params.rewind || swiper.params.loop) {
        for (let i = activeIndex - amount; i <= slideIndexLastInView + amount; i += 1) {
          const realIndex = (i % len + len) % len;
          if (realIndex < activeIndex || realIndex > slideIndexLastInView) unlazy(swiper, realIndex);
        }
      } else {
        for (let i = Math.max(activeIndex - amount, 0); i <= Math.min(slideIndexLastInView + amount, len - 1); i += 1) {
          if (i !== activeIndex && (i > slideIndexLastInView || i < activeIndex)) {
            unlazy(swiper, i);
          }
        }
      }
    };

    function getActiveIndexByTranslate(swiper) {
      const {
        slidesGrid,
        params
      } = swiper;
      const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
      let activeIndex;
      for (let i = 0; i < slidesGrid.length; i += 1) {
        if (typeof slidesGrid[i + 1] !== 'undefined') {
          if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1] - (slidesGrid[i + 1] - slidesGrid[i]) / 2) {
            activeIndex = i;
          } else if (translate >= slidesGrid[i] && translate < slidesGrid[i + 1]) {
            activeIndex = i + 1;
          }
        } else if (translate >= slidesGrid[i]) {
          activeIndex = i;
        }
      }
      // Normalize slideIndex
      if (params.normalizeSlideIndex) {
        if (activeIndex < 0 || typeof activeIndex === 'undefined') activeIndex = 0;
      }
      return activeIndex;
    }
    function updateActiveIndex(newActiveIndex) {
      const swiper = this;
      const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
      const {
        snapGrid,
        params,
        activeIndex: previousIndex,
        realIndex: previousRealIndex,
        snapIndex: previousSnapIndex
      } = swiper;
      let activeIndex = newActiveIndex;
      let snapIndex;
      const getVirtualRealIndex = aIndex => {
        let realIndex = aIndex - swiper.virtual.slidesBefore;
        if (realIndex < 0) {
          realIndex = swiper.virtual.slides.length + realIndex;
        }
        if (realIndex >= swiper.virtual.slides.length) {
          realIndex -= swiper.virtual.slides.length;
        }
        return realIndex;
      };
      if (typeof activeIndex === 'undefined') {
        activeIndex = getActiveIndexByTranslate(swiper);
      }
      if (snapGrid.indexOf(translate) >= 0) {
        snapIndex = snapGrid.indexOf(translate);
      } else {
        const skip = Math.min(params.slidesPerGroupSkip, activeIndex);
        snapIndex = skip + Math.floor((activeIndex - skip) / params.slidesPerGroup);
      }
      if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;
      if (activeIndex === previousIndex && !swiper.params.loop) {
        if (snapIndex !== previousSnapIndex) {
          swiper.snapIndex = snapIndex;
          swiper.emit('snapIndexChange');
        }
        return;
      }
      if (activeIndex === previousIndex && swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
        swiper.realIndex = getVirtualRealIndex(activeIndex);
        return;
      }
      const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;

      // Get real index
      let realIndex;
      if (swiper.virtual && params.virtual.enabled) {
        if (params.loop) {
          realIndex = getVirtualRealIndex(activeIndex);
        } else {
          realIndex = activeIndex;
        }
      } else if (gridEnabled) {
        const firstSlideInColumn = swiper.slides.find(slideEl => slideEl.column === activeIndex);
        let activeSlideIndex = parseInt(firstSlideInColumn.getAttribute('data-swiper-slide-index'), 10);
        if (Number.isNaN(activeSlideIndex)) {
          activeSlideIndex = Math.max(swiper.slides.indexOf(firstSlideInColumn), 0);
        }
        realIndex = Math.floor(activeSlideIndex / params.grid.rows);
      } else if (swiper.slides[activeIndex]) {
        const slideIndex = swiper.slides[activeIndex].getAttribute('data-swiper-slide-index');
        if (slideIndex) {
          realIndex = parseInt(slideIndex, 10);
        } else {
          realIndex = activeIndex;
        }
      } else {
        realIndex = activeIndex;
      }
      Object.assign(swiper, {
        previousSnapIndex,
        snapIndex,
        previousRealIndex,
        realIndex,
        previousIndex,
        activeIndex
      });
      if (swiper.initialized) {
        preload(swiper);
      }
      swiper.emit('activeIndexChange');
      swiper.emit('snapIndexChange');
      if (swiper.initialized || swiper.params.runCallbacksOnInit) {
        if (previousRealIndex !== realIndex) {
          swiper.emit('realIndexChange');
        }
        swiper.emit('slideChange');
      }
    }

    function updateClickedSlide(el, path) {
      const swiper = this;
      const params = swiper.params;
      let slide = el.closest(`.${params.slideClass}, swiper-slide`);
      if (!slide && swiper.isElement && path && path.length > 1 && path.includes(el)) {
        [...path.slice(path.indexOf(el) + 1, path.length)].forEach(pathEl => {
          if (!slide && pathEl.matches && pathEl.matches(`.${params.slideClass}, swiper-slide`)) {
            slide = pathEl;
          }
        });
      }
      let slideFound = false;
      let slideIndex;
      if (slide) {
        for (let i = 0; i < swiper.slides.length; i += 1) {
          if (swiper.slides[i] === slide) {
            slideFound = true;
            slideIndex = i;
            break;
          }
        }
      }
      if (slide && slideFound) {
        swiper.clickedSlide = slide;
        if (swiper.virtual && swiper.params.virtual.enabled) {
          swiper.clickedIndex = parseInt(slide.getAttribute('data-swiper-slide-index'), 10);
        } else {
          swiper.clickedIndex = slideIndex;
        }
      } else {
        swiper.clickedSlide = undefined;
        swiper.clickedIndex = undefined;
        return;
      }
      if (params.slideToClickedSlide && swiper.clickedIndex !== undefined && swiper.clickedIndex !== swiper.activeIndex) {
        swiper.slideToClickedSlide();
      }
    }

    var update = {
      updateSize,
      updateSlides,
      updateAutoHeight,
      updateSlidesOffset,
      updateSlidesProgress,
      updateProgress,
      updateSlidesClasses,
      updateActiveIndex,
      updateClickedSlide
    };

    function getSwiperTranslate(axis = this.isHorizontal() ? 'x' : 'y') {
      const swiper = this;
      const {
        params,
        rtlTranslate: rtl,
        translate,
        wrapperEl
      } = swiper;
      if (params.virtualTranslate) {
        return rtl ? -translate : translate;
      }
      if (params.cssMode) {
        return translate;
      }
      let currentTranslate = getTranslate(wrapperEl, axis);
      currentTranslate += swiper.cssOverflowAdjustment();
      if (rtl) currentTranslate = -currentTranslate;
      return currentTranslate || 0;
    }

    function setTranslate(translate, byController) {
      const swiper = this;
      const {
        rtlTranslate: rtl,
        params,
        wrapperEl,
        progress
      } = swiper;
      let x = 0;
      let y = 0;
      const z = 0;
      if (swiper.isHorizontal()) {
        x = rtl ? -translate : translate;
      } else {
        y = translate;
      }
      if (params.roundLengths) {
        x = Math.floor(x);
        y = Math.floor(y);
      }
      swiper.previousTranslate = swiper.translate;
      swiper.translate = swiper.isHorizontal() ? x : y;
      if (params.cssMode) {
        wrapperEl[swiper.isHorizontal() ? 'scrollLeft' : 'scrollTop'] = swiper.isHorizontal() ? -x : -y;
      } else if (!params.virtualTranslate) {
        if (swiper.isHorizontal()) {
          x -= swiper.cssOverflowAdjustment();
        } else {
          y -= swiper.cssOverflowAdjustment();
        }
        wrapperEl.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
      }

      // Check if we need to update progress
      let newProgress;
      const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
      if (translatesDiff === 0) {
        newProgress = 0;
      } else {
        newProgress = (translate - swiper.minTranslate()) / translatesDiff;
      }
      if (newProgress !== progress) {
        swiper.updateProgress(translate);
      }
      swiper.emit('setTranslate', swiper.translate, byController);
    }

    function minTranslate() {
      return -this.snapGrid[0];
    }

    function maxTranslate() {
      return -this.snapGrid[this.snapGrid.length - 1];
    }

    function translateTo(translate = 0, speed = this.params.speed, runCallbacks = true, translateBounds = true, internal) {
      const swiper = this;
      const {
        params,
        wrapperEl
      } = swiper;
      if (swiper.animating && params.preventInteractionOnTransition) {
        return false;
      }
      const minTranslate = swiper.minTranslate();
      const maxTranslate = swiper.maxTranslate();
      let newTranslate;
      if (translateBounds && translate > minTranslate) newTranslate = minTranslate;else if (translateBounds && translate < maxTranslate) newTranslate = maxTranslate;else newTranslate = translate;

      // Update progress
      swiper.updateProgress(newTranslate);
      if (params.cssMode) {
        const isH = swiper.isHorizontal();
        if (speed === 0) {
          wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = -newTranslate;
        } else {
          if (!swiper.support.smoothScroll) {
            animateCSSModeScroll({
              swiper,
              targetPosition: -newTranslate,
              side: isH ? 'left' : 'top'
            });
            return true;
          }
          wrapperEl.scrollTo({
            [isH ? 'left' : 'top']: -newTranslate,
            behavior: 'smooth'
          });
        }
        return true;
      }
      if (speed === 0) {
        swiper.setTransition(0);
        swiper.setTranslate(newTranslate);
        if (runCallbacks) {
          swiper.emit('beforeTransitionStart', speed, internal);
          swiper.emit('transitionEnd');
        }
      } else {
        swiper.setTransition(speed);
        swiper.setTranslate(newTranslate);
        if (runCallbacks) {
          swiper.emit('beforeTransitionStart', speed, internal);
          swiper.emit('transitionStart');
        }
        if (!swiper.animating) {
          swiper.animating = true;
          if (!swiper.onTranslateToWrapperTransitionEnd) {
            swiper.onTranslateToWrapperTransitionEnd = function transitionEnd(e) {
              if (!swiper || swiper.destroyed) return;
              if (e.target !== this) return;
              swiper.wrapperEl.removeEventListener('transitionend', swiper.onTranslateToWrapperTransitionEnd);
              swiper.onTranslateToWrapperTransitionEnd = null;
              delete swiper.onTranslateToWrapperTransitionEnd;
              swiper.animating = false;
              if (runCallbacks) {
                swiper.emit('transitionEnd');
              }
            };
          }
          swiper.wrapperEl.addEventListener('transitionend', swiper.onTranslateToWrapperTransitionEnd);
        }
      }
      return true;
    }

    var translate = {
      getTranslate: getSwiperTranslate,
      setTranslate,
      minTranslate,
      maxTranslate,
      translateTo
    };

    function setTransition(duration, byController) {
      const swiper = this;
      if (!swiper.params.cssMode) {
        swiper.wrapperEl.style.transitionDuration = `${duration}ms`;
        swiper.wrapperEl.style.transitionDelay = duration === 0 ? `0ms` : '';
      }
      swiper.emit('setTransition', duration, byController);
    }

    function transitionEmit({
      swiper,
      runCallbacks,
      direction,
      step
    }) {
      const {
        activeIndex,
        previousIndex
      } = swiper;
      let dir = direction;
      if (!dir) {
        if (activeIndex > previousIndex) dir = 'next';else if (activeIndex < previousIndex) dir = 'prev';else dir = 'reset';
      }
      swiper.emit(`transition${step}`);
      if (runCallbacks && dir === 'reset') {
        swiper.emit(`slideResetTransition${step}`);
      } else if (runCallbacks && activeIndex !== previousIndex) {
        swiper.emit(`slideChangeTransition${step}`);
        if (dir === 'next') {
          swiper.emit(`slideNextTransition${step}`);
        } else {
          swiper.emit(`slidePrevTransition${step}`);
        }
      }
    }

    function transitionStart(runCallbacks = true, direction) {
      const swiper = this;
      const {
        params
      } = swiper;
      if (params.cssMode) return;
      if (params.autoHeight) {
        swiper.updateAutoHeight();
      }
      transitionEmit({
        swiper,
        runCallbacks,
        direction,
        step: 'Start'
      });
    }

    function transitionEnd(runCallbacks = true, direction) {
      const swiper = this;
      const {
        params
      } = swiper;
      swiper.animating = false;
      if (params.cssMode) return;
      swiper.setTransition(0);
      transitionEmit({
        swiper,
        runCallbacks,
        direction,
        step: 'End'
      });
    }

    var transition = {
      setTransition,
      transitionStart,
      transitionEnd
    };

    function slideTo(index = 0, speed, runCallbacks = true, internal, initial) {
      if (typeof index === 'string') {
        index = parseInt(index, 10);
      }
      const swiper = this;
      let slideIndex = index;
      if (slideIndex < 0) slideIndex = 0;
      const {
        params,
        snapGrid,
        slidesGrid,
        previousIndex,
        activeIndex,
        rtlTranslate: rtl,
        wrapperEl,
        enabled
      } = swiper;
      if (!enabled && !internal && !initial || swiper.destroyed || swiper.animating && params.preventInteractionOnTransition) {
        return false;
      }
      if (typeof speed === 'undefined') {
        speed = swiper.params.speed;
      }
      const skip = Math.min(swiper.params.slidesPerGroupSkip, slideIndex);
      let snapIndex = skip + Math.floor((slideIndex - skip) / swiper.params.slidesPerGroup);
      if (snapIndex >= snapGrid.length) snapIndex = snapGrid.length - 1;
      const translate = -snapGrid[snapIndex];
      // Normalize slideIndex
      if (params.normalizeSlideIndex) {
        for (let i = 0; i < slidesGrid.length; i += 1) {
          const normalizedTranslate = -Math.floor(translate * 100);
          const normalizedGrid = Math.floor(slidesGrid[i] * 100);
          const normalizedGridNext = Math.floor(slidesGrid[i + 1] * 100);
          if (typeof slidesGrid[i + 1] !== 'undefined') {
            if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext - (normalizedGridNext - normalizedGrid) / 2) {
              slideIndex = i;
            } else if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext) {
              slideIndex = i + 1;
            }
          } else if (normalizedTranslate >= normalizedGrid) {
            slideIndex = i;
          }
        }
      }
      // Directions locks
      if (swiper.initialized && slideIndex !== activeIndex) {
        if (!swiper.allowSlideNext && (rtl ? translate > swiper.translate && translate > swiper.minTranslate() : translate < swiper.translate && translate < swiper.minTranslate())) {
          return false;
        }
        if (!swiper.allowSlidePrev && translate > swiper.translate && translate > swiper.maxTranslate()) {
          if ((activeIndex || 0) !== slideIndex) {
            return false;
          }
        }
      }
      if (slideIndex !== (previousIndex || 0) && runCallbacks) {
        swiper.emit('beforeSlideChangeStart');
      }

      // Update progress
      swiper.updateProgress(translate);
      let direction;
      if (slideIndex > activeIndex) direction = 'next';else if (slideIndex < activeIndex) direction = 'prev';else direction = 'reset';

      // initial virtual
      const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
      const isInitialVirtual = isVirtual && initial;
      // Update Index
      if (!isInitialVirtual && (rtl && -translate === swiper.translate || !rtl && translate === swiper.translate)) {
        swiper.updateActiveIndex(slideIndex);
        // Update Height
        if (params.autoHeight) {
          swiper.updateAutoHeight();
        }
        swiper.updateSlidesClasses();
        if (params.effect !== 'slide') {
          swiper.setTranslate(translate);
        }
        if (direction !== 'reset') {
          swiper.transitionStart(runCallbacks, direction);
          swiper.transitionEnd(runCallbacks, direction);
        }
        return false;
      }
      if (params.cssMode) {
        const isH = swiper.isHorizontal();
        const t = rtl ? translate : -translate;
        if (speed === 0) {
          if (isVirtual) {
            swiper.wrapperEl.style.scrollSnapType = 'none';
            swiper._immediateVirtual = true;
          }
          if (isVirtual && !swiper._cssModeVirtualInitialSet && swiper.params.initialSlide > 0) {
            swiper._cssModeVirtualInitialSet = true;
            requestAnimationFrame(() => {
              wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = t;
            });
          } else {
            wrapperEl[isH ? 'scrollLeft' : 'scrollTop'] = t;
          }
          if (isVirtual) {
            requestAnimationFrame(() => {
              swiper.wrapperEl.style.scrollSnapType = '';
              swiper._immediateVirtual = false;
            });
          }
        } else {
          if (!swiper.support.smoothScroll) {
            animateCSSModeScroll({
              swiper,
              targetPosition: t,
              side: isH ? 'left' : 'top'
            });
            return true;
          }
          wrapperEl.scrollTo({
            [isH ? 'left' : 'top']: t,
            behavior: 'smooth'
          });
        }
        return true;
      }
      const browser = getBrowser();
      const isSafari = browser.isSafari;
      if (isVirtual && !initial && isSafari && swiper.isElement) {
        swiper.virtual.update(false, false, slideIndex);
      }
      swiper.setTransition(speed);
      swiper.setTranslate(translate);
      swiper.updateActiveIndex(slideIndex);
      swiper.updateSlidesClasses();
      swiper.emit('beforeTransitionStart', speed, internal);
      swiper.transitionStart(runCallbacks, direction);
      if (speed === 0) {
        swiper.transitionEnd(runCallbacks, direction);
      } else if (!swiper.animating) {
        swiper.animating = true;
        if (!swiper.onSlideToWrapperTransitionEnd) {
          swiper.onSlideToWrapperTransitionEnd = function transitionEnd(e) {
            if (!swiper || swiper.destroyed) return;
            if (e.target !== this) return;
            swiper.wrapperEl.removeEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
            swiper.onSlideToWrapperTransitionEnd = null;
            delete swiper.onSlideToWrapperTransitionEnd;
            swiper.transitionEnd(runCallbacks, direction);
          };
        }
        swiper.wrapperEl.addEventListener('transitionend', swiper.onSlideToWrapperTransitionEnd);
      }
      return true;
    }

    function slideToLoop(index = 0, speed, runCallbacks = true, internal) {
      if (typeof index === 'string') {
        const indexAsNumber = parseInt(index, 10);
        index = indexAsNumber;
      }
      const swiper = this;
      if (swiper.destroyed) return;
      if (typeof speed === 'undefined') {
        speed = swiper.params.speed;
      }
      const gridEnabled = swiper.grid && swiper.params.grid && swiper.params.grid.rows > 1;
      let newIndex = index;
      if (swiper.params.loop) {
        if (swiper.virtual && swiper.params.virtual.enabled) {
          // eslint-disable-next-line
          newIndex = newIndex + swiper.virtual.slidesBefore;
        } else {
          let targetSlideIndex;
          if (gridEnabled) {
            const slideIndex = newIndex * swiper.params.grid.rows;
            targetSlideIndex = swiper.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') * 1 === slideIndex).column;
          } else {
            targetSlideIndex = swiper.getSlideIndexByData(newIndex);
          }
          const cols = gridEnabled ? Math.ceil(swiper.slides.length / swiper.params.grid.rows) : swiper.slides.length;
          const {
            centeredSlides,
            slidesOffsetBefore,
            slidesOffsetAfter
          } = swiper.params;
          const bothDirections = centeredSlides || !!slidesOffsetBefore || !!slidesOffsetAfter;
          let slidesPerView = swiper.params.slidesPerView;
          if (slidesPerView === 'auto') {
            slidesPerView = swiper.slidesPerViewDynamic();
          } else {
            slidesPerView = Math.ceil(parseFloat(swiper.params.slidesPerView, 10));
            if (bothDirections && slidesPerView % 2 === 0) {
              slidesPerView = slidesPerView + 1;
            }
          }
          let needLoopFix = cols - targetSlideIndex < slidesPerView;
          if (bothDirections) {
            needLoopFix = needLoopFix || targetSlideIndex < Math.ceil(slidesPerView / 2);
          }
          if (internal && bothDirections && swiper.params.slidesPerView !== 'auto' && !gridEnabled) {
            needLoopFix = false;
          }
          if (needLoopFix) {
            const direction = bothDirections ? targetSlideIndex < swiper.activeIndex ? 'prev' : 'next' : targetSlideIndex - swiper.activeIndex - 1 < swiper.params.slidesPerView ? 'next' : 'prev';
            swiper.loopFix({
              direction,
              slideTo: true,
              activeSlideIndex: direction === 'next' ? targetSlideIndex + 1 : targetSlideIndex - cols + 1,
              slideRealIndex: direction === 'next' ? swiper.realIndex : undefined
            });
          }
          if (gridEnabled) {
            const slideIndex = newIndex * swiper.params.grid.rows;
            newIndex = swiper.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') * 1 === slideIndex).column;
          } else {
            newIndex = swiper.getSlideIndexByData(newIndex);
          }
        }
      }
      requestAnimationFrame(() => {
        swiper.slideTo(newIndex, speed, runCallbacks, internal);
      });
      return swiper;
    }

    /* eslint no-unused-vars: "off" */
    function slideNext(speed, runCallbacks = true, internal) {
      const swiper = this;
      const {
        enabled,
        params,
        animating
      } = swiper;
      if (!enabled || swiper.destroyed) return swiper;
      if (typeof speed === 'undefined') {
        speed = swiper.params.speed;
      }
      let perGroup = params.slidesPerGroup;
      if (params.slidesPerView === 'auto' && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
        perGroup = Math.max(swiper.slidesPerViewDynamic('current', true), 1);
      }
      const increment = swiper.activeIndex < params.slidesPerGroupSkip ? 1 : perGroup;
      const isVirtual = swiper.virtual && params.virtual.enabled;
      if (params.loop) {
        if (animating && !isVirtual && params.loopPreventsSliding) return false;
        swiper.loopFix({
          direction: 'next'
        });
        // eslint-disable-next-line
        swiper._clientLeft = swiper.wrapperEl.clientLeft;
        if (swiper.activeIndex === swiper.slides.length - 1 && params.cssMode) {
          requestAnimationFrame(() => {
            swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
          });
          return true;
        }
      }
      if (params.rewind && swiper.isEnd) {
        return swiper.slideTo(0, speed, runCallbacks, internal);
      }
      return swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slidePrev(speed, runCallbacks = true, internal) {
      const swiper = this;
      const {
        params,
        snapGrid,
        slidesGrid,
        rtlTranslate,
        enabled,
        animating
      } = swiper;
      if (!enabled || swiper.destroyed) return swiper;
      if (typeof speed === 'undefined') {
        speed = swiper.params.speed;
      }
      const isVirtual = swiper.virtual && params.virtual.enabled;
      if (params.loop) {
        if (animating && !isVirtual && params.loopPreventsSliding) return false;
        swiper.loopFix({
          direction: 'prev'
        });
        // eslint-disable-next-line
        swiper._clientLeft = swiper.wrapperEl.clientLeft;
      }
      const translate = rtlTranslate ? swiper.translate : -swiper.translate;
      function normalize(val) {
        if (val < 0) return -Math.floor(Math.abs(val));
        return Math.floor(val);
      }
      const normalizedTranslate = normalize(translate);
      const normalizedSnapGrid = snapGrid.map(val => normalize(val));
      const isFreeMode = params.freeMode && params.freeMode.enabled;
      let prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];
      if (typeof prevSnap === 'undefined' && (params.cssMode || isFreeMode)) {
        let prevSnapIndex;
        snapGrid.forEach((snap, snapIndex) => {
          if (normalizedTranslate >= snap) {
            // prevSnap = snap;
            prevSnapIndex = snapIndex;
          }
        });
        if (typeof prevSnapIndex !== 'undefined') {
          prevSnap = isFreeMode ? snapGrid[prevSnapIndex] : snapGrid[prevSnapIndex > 0 ? prevSnapIndex - 1 : prevSnapIndex];
        }
      }
      let prevIndex = 0;
      if (typeof prevSnap !== 'undefined') {
        prevIndex = slidesGrid.indexOf(prevSnap);
        if (prevIndex < 0) prevIndex = swiper.activeIndex - 1;
        if (params.slidesPerView === 'auto' && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
          prevIndex = prevIndex - swiper.slidesPerViewDynamic('previous', true) + 1;
          prevIndex = Math.max(prevIndex, 0);
        }
      }
      if (params.rewind && swiper.isBeginning) {
        const lastIndex = swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
        return swiper.slideTo(lastIndex, speed, runCallbacks, internal);
      } else if (params.loop && swiper.activeIndex === 0 && params.cssMode) {
        requestAnimationFrame(() => {
          swiper.slideTo(prevIndex, speed, runCallbacks, internal);
        });
        return true;
      }
      return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideReset(speed, runCallbacks = true, internal) {
      const swiper = this;
      if (swiper.destroyed) return;
      if (typeof speed === 'undefined') {
        speed = swiper.params.speed;
      }
      return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
    }

    /* eslint no-unused-vars: "off" */
    function slideToClosest(speed, runCallbacks = true, internal, threshold = 0.5) {
      const swiper = this;
      if (swiper.destroyed) return;
      if (typeof speed === 'undefined') {
        speed = swiper.params.speed;
      }
      let index = swiper.activeIndex;
      const skip = Math.min(swiper.params.slidesPerGroupSkip, index);
      const snapIndex = skip + Math.floor((index - skip) / swiper.params.slidesPerGroup);
      const translate = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
      if (translate >= swiper.snapGrid[snapIndex]) {
        // The current translate is on or after the current snap index, so the choice
        // is between the current index and the one after it.
        const currentSnap = swiper.snapGrid[snapIndex];
        const nextSnap = swiper.snapGrid[snapIndex + 1];
        if (translate - currentSnap > (nextSnap - currentSnap) * threshold) {
          index += swiper.params.slidesPerGroup;
        }
      } else {
        // The current translate is before the current snap index, so the choice
        // is between the current index and the one before it.
        const prevSnap = swiper.snapGrid[snapIndex - 1];
        const currentSnap = swiper.snapGrid[snapIndex];
        if (translate - prevSnap <= (currentSnap - prevSnap) * threshold) {
          index -= swiper.params.slidesPerGroup;
        }
      }
      index = Math.max(index, 0);
      index = Math.min(index, swiper.slidesGrid.length - 1);
      return swiper.slideTo(index, speed, runCallbacks, internal);
    }

    function slideToClickedSlide() {
      const swiper = this;
      if (swiper.destroyed) return;
      const {
        params,
        slidesEl
      } = swiper;
      const slidesPerView = params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : params.slidesPerView;
      let slideToIndex = swiper.getSlideIndexWhenGrid(swiper.clickedIndex);
      let realIndex;
      const slideSelector = swiper.isElement ? `swiper-slide` : `.${params.slideClass}`;
      const isGrid = swiper.grid && swiper.params.grid && swiper.params.grid.rows > 1;
      if (params.loop) {
        if (swiper.animating) return;
        realIndex = parseInt(swiper.clickedSlide.getAttribute('data-swiper-slide-index'), 10);
        if (params.centeredSlides) {
          swiper.slideToLoop(realIndex);
        } else if (slideToIndex > (isGrid ? (swiper.slides.length - slidesPerView) / 2 - (swiper.params.grid.rows - 1) : swiper.slides.length - slidesPerView)) {
          swiper.loopFix();
          slideToIndex = swiper.getSlideIndex(elementChildren(slidesEl, `${slideSelector}[data-swiper-slide-index="${realIndex}"]`)[0]);
          nextTick(() => {
            swiper.slideTo(slideToIndex);
          });
        } else {
          swiper.slideTo(slideToIndex);
        }
      } else {
        swiper.slideTo(slideToIndex);
      }
    }

    var slide = {
      slideTo,
      slideToLoop,
      slideNext,
      slidePrev,
      slideReset,
      slideToClosest,
      slideToClickedSlide
    };

    function loopCreate(slideRealIndex, initial) {
      const swiper = this;
      const {
        params,
        slidesEl
      } = swiper;
      if (!params.loop || swiper.virtual && swiper.params.virtual.enabled) return;
      const initSlides = () => {
        const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
        slides.forEach((el, index) => {
          el.setAttribute('data-swiper-slide-index', index);
        });
      };
      const clearBlankSlides = () => {
        const slides = elementChildren(slidesEl, `.${params.slideBlankClass}`);
        slides.forEach(el => {
          el.remove();
        });
        if (slides.length > 0) {
          swiper.recalcSlides();
          swiper.updateSlides();
        }
      };
      const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
      if (params.loopAddBlankSlides && (params.slidesPerGroup > 1 || gridEnabled)) {
        clearBlankSlides();
      }
      const slidesPerGroup = params.slidesPerGroup * (gridEnabled ? params.grid.rows : 1);
      const shouldFillGroup = swiper.slides.length % slidesPerGroup !== 0;
      const shouldFillGrid = gridEnabled && swiper.slides.length % params.grid.rows !== 0;
      const addBlankSlides = amountOfSlides => {
        for (let i = 0; i < amountOfSlides; i += 1) {
          const slideEl = swiper.isElement ? createElement('swiper-slide', [params.slideBlankClass]) : createElement('div', [params.slideClass, params.slideBlankClass]);
          swiper.slidesEl.append(slideEl);
        }
      };
      if (shouldFillGroup) {
        if (params.loopAddBlankSlides) {
          const slidesToAdd = slidesPerGroup - swiper.slides.length % slidesPerGroup;
          addBlankSlides(slidesToAdd);
          swiper.recalcSlides();
          swiper.updateSlides();
        } else {
          showWarning('Swiper Loop Warning: The number of slides is not even to slidesPerGroup, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)');
        }
        initSlides();
      } else if (shouldFillGrid) {
        if (params.loopAddBlankSlides) {
          const slidesToAdd = params.grid.rows - swiper.slides.length % params.grid.rows;
          addBlankSlides(slidesToAdd);
          swiper.recalcSlides();
          swiper.updateSlides();
        } else {
          showWarning('Swiper Loop Warning: The number of slides is not even to grid.rows, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)');
        }
        initSlides();
      } else {
        initSlides();
      }
      const bothDirections = params.centeredSlides || !!params.slidesOffsetBefore || !!params.slidesOffsetAfter;
      swiper.loopFix({
        slideRealIndex,
        direction: bothDirections ? undefined : 'next',
        initial
      });
    }

    function loopFix({
      slideRealIndex,
      slideTo = true,
      direction,
      setTranslate,
      activeSlideIndex,
      initial,
      byController,
      byMousewheel
    } = {}) {
      const swiper = this;
      if (!swiper.params.loop) return;
      swiper.emit('beforeLoopFix');
      const {
        slides,
        allowSlidePrev,
        allowSlideNext,
        slidesEl,
        params
      } = swiper;
      const {
        centeredSlides,
        slidesOffsetBefore,
        slidesOffsetAfter,
        initialSlide
      } = params;
      const bothDirections = centeredSlides || !!slidesOffsetBefore || !!slidesOffsetAfter;
      swiper.allowSlidePrev = true;
      swiper.allowSlideNext = true;
      if (swiper.virtual && params.virtual.enabled) {
        if (slideTo) {
          if (!bothDirections && swiper.snapIndex === 0) {
            swiper.slideTo(swiper.virtual.slides.length, 0, false, true);
          } else if (bothDirections && swiper.snapIndex < params.slidesPerView) {
            swiper.slideTo(swiper.virtual.slides.length + swiper.snapIndex, 0, false, true);
          } else if (swiper.snapIndex === swiper.snapGrid.length - 1) {
            swiper.slideTo(swiper.virtual.slidesBefore, 0, false, true);
          }
        }
        swiper.allowSlidePrev = allowSlidePrev;
        swiper.allowSlideNext = allowSlideNext;
        swiper.emit('loopFix');
        return;
      }
      let slidesPerView = params.slidesPerView;
      if (slidesPerView === 'auto') {
        slidesPerView = swiper.slidesPerViewDynamic();
      } else {
        slidesPerView = Math.ceil(parseFloat(params.slidesPerView, 10));
        if (bothDirections && slidesPerView % 2 === 0) {
          slidesPerView = slidesPerView + 1;
        }
      }
      const slidesPerGroup = params.slidesPerGroupAuto ? slidesPerView : params.slidesPerGroup;
      let loopedSlides = bothDirections ? Math.max(slidesPerGroup, Math.ceil(slidesPerView / 2)) : slidesPerGroup;
      if (loopedSlides % slidesPerGroup !== 0) {
        loopedSlides += slidesPerGroup - loopedSlides % slidesPerGroup;
      }
      loopedSlides += params.loopAdditionalSlides;
      swiper.loopedSlides = loopedSlides;
      const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
      if (slides.length < slidesPerView + loopedSlides || swiper.params.effect === 'cards' && slides.length < slidesPerView + loopedSlides * 2) {
        showWarning('Swiper Loop Warning: The number of slides is not enough for loop mode, it will be disabled or not function properly. You need to add more slides (or make duplicates) or lower the values of slidesPerView and slidesPerGroup parameters');
      } else if (gridEnabled && params.grid.fill === 'row') {
        showWarning('Swiper Loop Warning: Loop mode is not compatible with grid.fill = `row`');
      }
      const prependSlidesIndexes = [];
      const appendSlidesIndexes = [];
      const cols = gridEnabled ? Math.ceil(slides.length / params.grid.rows) : slides.length;
      const isInitialOverflow = initial && cols - initialSlide < slidesPerView && !bothDirections;
      let activeIndex = isInitialOverflow ? initialSlide : swiper.activeIndex;
      if (typeof activeSlideIndex === 'undefined') {
        activeSlideIndex = swiper.getSlideIndex(slides.find(el => el.classList.contains(params.slideActiveClass)));
      } else {
        activeIndex = activeSlideIndex;
      }
      const isNext = direction === 'next' || !direction;
      const isPrev = direction === 'prev' || !direction;
      let slidesPrepended = 0;
      let slidesAppended = 0;
      const activeColIndex = gridEnabled ? slides[activeSlideIndex].column : activeSlideIndex;
      const activeColIndexWithShift = activeColIndex + (bothDirections && typeof setTranslate === 'undefined' ? -slidesPerView / 2 + 0.5 : 0);
      // prepend last slides before start
      if (activeColIndexWithShift < loopedSlides) {
        slidesPrepended = Math.max(loopedSlides - activeColIndexWithShift, slidesPerGroup);
        for (let i = 0; i < loopedSlides - activeColIndexWithShift; i += 1) {
          const index = i - Math.floor(i / cols) * cols;
          if (gridEnabled) {
            const colIndexToPrepend = cols - index - 1;
            for (let i = slides.length - 1; i >= 0; i -= 1) {
              if (slides[i].column === colIndexToPrepend) prependSlidesIndexes.push(i);
            }
            // slides.forEach((slide, slideIndex) => {
            //   if (slide.column === colIndexToPrepend) prependSlidesIndexes.push(slideIndex);
            // });
          } else {
            prependSlidesIndexes.push(cols - index - 1);
          }
        }
      } else if (activeColIndexWithShift + slidesPerView > cols - loopedSlides) {
        slidesAppended = Math.max(activeColIndexWithShift - (cols - loopedSlides * 2), slidesPerGroup);
        if (isInitialOverflow) {
          slidesAppended = Math.max(slidesAppended, slidesPerView - cols + initialSlide + 1);
        }
        for (let i = 0; i < slidesAppended; i += 1) {
          const index = i - Math.floor(i / cols) * cols;
          if (gridEnabled) {
            slides.forEach((slide, slideIndex) => {
              if (slide.column === index) appendSlidesIndexes.push(slideIndex);
            });
          } else {
            appendSlidesIndexes.push(index);
          }
        }
      }
      swiper.__preventObserver__ = true;
      requestAnimationFrame(() => {
        swiper.__preventObserver__ = false;
      });
      if (swiper.params.effect === 'cards' && slides.length < slidesPerView + loopedSlides * 2) {
        if (appendSlidesIndexes.includes(activeSlideIndex)) {
          appendSlidesIndexes.splice(appendSlidesIndexes.indexOf(activeSlideIndex), 1);
        }
        if (prependSlidesIndexes.includes(activeSlideIndex)) {
          prependSlidesIndexes.splice(prependSlidesIndexes.indexOf(activeSlideIndex), 1);
        }
      }
      if (isPrev) {
        prependSlidesIndexes.forEach(index => {
          slides[index].swiperLoopMoveDOM = true;
          slidesEl.prepend(slides[index]);
          slides[index].swiperLoopMoveDOM = false;
        });
      }
      if (isNext) {
        appendSlidesIndexes.forEach(index => {
          slides[index].swiperLoopMoveDOM = true;
          slidesEl.append(slides[index]);
          slides[index].swiperLoopMoveDOM = false;
        });
      }
      swiper.recalcSlides();
      if (params.slidesPerView === 'auto') {
        swiper.updateSlides();
      } else if (gridEnabled && (prependSlidesIndexes.length > 0 && isPrev || appendSlidesIndexes.length > 0 && isNext)) {
        swiper.slides.forEach((slide, slideIndex) => {
          swiper.grid.updateSlide(slideIndex, slide, swiper.slides);
        });
      }
      if (params.watchSlidesProgress) {
        swiper.updateSlidesOffset();
      }
      if (slideTo) {
        if (prependSlidesIndexes.length > 0 && isPrev) {
          if (typeof slideRealIndex === 'undefined') {
            const currentSlideTranslate = swiper.slidesGrid[activeIndex];
            const newSlideTranslate = swiper.slidesGrid[activeIndex + slidesPrepended];
            const diff = newSlideTranslate - currentSlideTranslate;
            if (byMousewheel) {
              swiper.setTranslate(swiper.translate - diff);
            } else {
              swiper.slideTo(activeIndex + Math.ceil(slidesPrepended), 0, false, true);
              if (setTranslate) {
                swiper.touchEventsData.startTranslate = swiper.touchEventsData.startTranslate - diff;
                swiper.touchEventsData.currentTranslate = swiper.touchEventsData.currentTranslate - diff;
              }
            }
          } else {
            if (setTranslate) {
              const shift = gridEnabled ? prependSlidesIndexes.length / params.grid.rows : prependSlidesIndexes.length;
              swiper.slideTo(swiper.activeIndex + shift, 0, false, true);
              swiper.touchEventsData.currentTranslate = swiper.translate;
            }
          }
        } else if (appendSlidesIndexes.length > 0 && isNext) {
          if (typeof slideRealIndex === 'undefined') {
            const currentSlideTranslate = swiper.slidesGrid[activeIndex];
            const newSlideTranslate = swiper.slidesGrid[activeIndex - slidesAppended];
            const diff = newSlideTranslate - currentSlideTranslate;
            if (byMousewheel) {
              swiper.setTranslate(swiper.translate - diff);
            } else {
              swiper.slideTo(activeIndex - slidesAppended, 0, false, true);
              if (setTranslate) {
                swiper.touchEventsData.startTranslate = swiper.touchEventsData.startTranslate - diff;
                swiper.touchEventsData.currentTranslate = swiper.touchEventsData.currentTranslate - diff;
              }
            }
          } else {
            const shift = gridEnabled ? appendSlidesIndexes.length / params.grid.rows : appendSlidesIndexes.length;
            swiper.slideTo(swiper.activeIndex - shift, 0, false, true);
          }
        }
      }
      swiper.allowSlidePrev = allowSlidePrev;
      swiper.allowSlideNext = allowSlideNext;
      if (swiper.controller && swiper.controller.control && !byController) {
        const loopParams = {
          slideRealIndex,
          direction,
          setTranslate,
          activeSlideIndex,
          byController: true
        };
        if (Array.isArray(swiper.controller.control)) {
          swiper.controller.control.forEach(c => {
            if (!c.destroyed && c.params.loop) c.loopFix({
              ...loopParams,
              slideTo: c.params.slidesPerView === params.slidesPerView ? slideTo : false
            });
          });
        } else if (swiper.controller.control instanceof swiper.constructor && swiper.controller.control.params.loop) {
          swiper.controller.control.loopFix({
            ...loopParams,
            slideTo: swiper.controller.control.params.slidesPerView === params.slidesPerView ? slideTo : false
          });
        }
      }
      swiper.emit('loopFix');
    }

    function loopDestroy() {
      const swiper = this;
      const {
        params,
        slidesEl
      } = swiper;
      if (!params.loop || !slidesEl || swiper.virtual && swiper.params.virtual.enabled) return;
      swiper.recalcSlides();
      const newSlidesOrder = [];
      swiper.slides.forEach(slideEl => {
        const index = typeof slideEl.swiperSlideIndex === 'undefined' ? slideEl.getAttribute('data-swiper-slide-index') * 1 : slideEl.swiperSlideIndex;
        newSlidesOrder[index] = slideEl;
      });
      swiper.slides.forEach(slideEl => {
        slideEl.removeAttribute('data-swiper-slide-index');
      });
      newSlidesOrder.forEach(slideEl => {
        slidesEl.append(slideEl);
      });
      swiper.recalcSlides();
      swiper.slideTo(swiper.realIndex, 0);
    }

    var loop = {
      loopCreate,
      loopFix,
      loopDestroy
    };

    function setGrabCursor(moving) {
      const swiper = this;
      if (!swiper.params.simulateTouch || swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) return;
      const el = swiper.params.touchEventsTarget === 'container' ? swiper.el : swiper.wrapperEl;
      if (swiper.isElement) {
        swiper.__preventObserver__ = true;
      }
      el.style.cursor = 'move';
      el.style.cursor = moving ? 'grabbing' : 'grab';
      if (swiper.isElement) {
        requestAnimationFrame(() => {
          swiper.__preventObserver__ = false;
        });
      }
    }

    function unsetGrabCursor() {
      const swiper = this;
      if (swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) {
        return;
      }
      if (swiper.isElement) {
        swiper.__preventObserver__ = true;
      }
      swiper[swiper.params.touchEventsTarget === 'container' ? 'el' : 'wrapperEl'].style.cursor = '';
      if (swiper.isElement) {
        requestAnimationFrame(() => {
          swiper.__preventObserver__ = false;
        });
      }
    }

    var grabCursor = {
      setGrabCursor,
      unsetGrabCursor
    };

    // Modified from https://stackoverflow.com/questions/54520554/custom-element-getrootnode-closest-function-crossing-multiple-parent-shadowd
    function closestElement(selector, base = this) {
      function __closestFrom(el) {
        if (!el || el === getDocument() || el === getWindow()) return null;
        if (el.assignedSlot) el = el.assignedSlot;
        const found = el.closest(selector);
        if (!found && !el.getRootNode) {
          return null;
        }
        return found || __closestFrom(el.getRootNode().host);
      }
      return __closestFrom(base);
    }
    function preventEdgeSwipe(swiper, event, startX) {
      const window = getWindow();
      const {
        params
      } = swiper;
      const edgeSwipeDetection = params.edgeSwipeDetection;
      const edgeSwipeThreshold = params.edgeSwipeThreshold;
      if (edgeSwipeDetection && (startX <= edgeSwipeThreshold || startX >= window.innerWidth - edgeSwipeThreshold)) {
        if (edgeSwipeDetection === 'prevent') {
          event.preventDefault();
          return true;
        }
        return false;
      }
      return true;
    }
    function onTouchStart(event) {
      const swiper = this;
      const document = getDocument();
      let e = event;
      if (e.originalEvent) e = e.originalEvent;
      const data = swiper.touchEventsData;
      if (e.type === 'pointerdown') {
        if (data.pointerId !== null && data.pointerId !== e.pointerId) {
          return;
        }
        data.pointerId = e.pointerId;
      } else if (e.type === 'touchstart' && e.targetTouches.length === 1) {
        data.touchId = e.targetTouches[0].identifier;
      }
      if (e.type === 'touchstart') {
        // don't proceed touch event
        preventEdgeSwipe(swiper, e, e.targetTouches[0].pageX);
        return;
      }
      const {
        params,
        touches,
        enabled
      } = swiper;
      if (!enabled) return;
      if (!params.simulateTouch && e.pointerType === 'mouse') return;
      if (swiper.animating && params.preventInteractionOnTransition) {
        return;
      }
      if (!swiper.animating && params.cssMode && params.loop) {
        swiper.loopFix();
      }
      let targetEl = e.target;
      if (params.touchEventsTarget === 'wrapper') {
        if (!elementIsChildOf(targetEl, swiper.wrapperEl)) return;
      }
      if ('which' in e && e.which === 3) return;
      if ('button' in e && e.button > 0) return;
      if (data.isTouched && data.isMoved) return;

      // change target el for shadow root component
      const swipingClassHasValue = !!params.noSwipingClass && params.noSwipingClass !== '';
      // eslint-disable-next-line
      const eventPath = e.composedPath ? e.composedPath() : e.path;
      if (swipingClassHasValue && e.target && e.target.shadowRoot && eventPath) {
        targetEl = eventPath[0];
      }
      const noSwipingSelector = params.noSwipingSelector ? params.noSwipingSelector : `.${params.noSwipingClass}`;
      const isTargetShadow = !!(e.target && e.target.shadowRoot);

      // use closestElement for shadow root element to get the actual closest for nested shadow root element
      if (params.noSwiping && (isTargetShadow ? closestElement(noSwipingSelector, targetEl) : targetEl.closest(noSwipingSelector))) {
        swiper.allowClick = true;
        return;
      }
      if (params.swipeHandler) {
        if (!targetEl.closest(params.swipeHandler)) return;
      }
      touches.currentX = e.pageX;
      touches.currentY = e.pageY;
      const startX = touches.currentX;
      const startY = touches.currentY;

      // Do NOT start if iOS edge swipe is detected. Otherwise iOS app cannot swipe-to-go-back anymore

      if (!preventEdgeSwipe(swiper, e, startX)) {
        return;
      }
      Object.assign(data, {
        isTouched: true,
        isMoved: false,
        allowTouchCallbacks: true,
        isScrolling: undefined,
        startMoving: undefined
      });
      touches.startX = startX;
      touches.startY = startY;
      data.touchStartTime = now();
      swiper.allowClick = true;
      swiper.updateSize();
      swiper.swipeDirection = undefined;
      if (params.threshold > 0) data.allowThresholdMove = false;
      let preventDefault = true;
      if (targetEl.matches(data.focusableElements)) {
        preventDefault = false;
        if (targetEl.nodeName === 'SELECT') {
          data.isTouched = false;
        }
      }
      if (document.activeElement && document.activeElement.matches(data.focusableElements) && document.activeElement !== targetEl && (e.pointerType === 'mouse' || e.pointerType !== 'mouse' && !targetEl.matches(data.focusableElements))) {
        document.activeElement.blur();
      }
      const shouldPreventDefault = preventDefault && swiper.allowTouchMove && params.touchStartPreventDefault;
      if ((params.touchStartForcePreventDefault || shouldPreventDefault) && !targetEl.isContentEditable) {
        e.preventDefault();
      }
      if (params.freeMode && params.freeMode.enabled && swiper.freeMode && swiper.animating && !params.cssMode) {
        swiper.freeMode.onTouchStart();
      }
      swiper.emit('touchStart', e);
    }

    function onTouchMove(event) {
      const document = getDocument();
      const swiper = this;
      const data = swiper.touchEventsData;
      const {
        params,
        touches,
        rtlTranslate: rtl,
        enabled
      } = swiper;
      if (!enabled) return;
      if (!params.simulateTouch && event.pointerType === 'mouse') return;
      let e = event;
      if (e.originalEvent) e = e.originalEvent;
      if (e.type === 'pointermove') {
        if (data.touchId !== null) return; // return from pointer if we use touch
        const id = e.pointerId;
        if (id !== data.pointerId) return;
      }
      let targetTouch;
      if (e.type === 'touchmove') {
        targetTouch = [...e.changedTouches].find(t => t.identifier === data.touchId);
        if (!targetTouch || targetTouch.identifier !== data.touchId) return;
      } else {
        targetTouch = e;
      }
      if (!data.isTouched) {
        if (data.startMoving && data.isScrolling) {
          swiper.emit('touchMoveOpposite', e);
        }
        return;
      }
      const pageX = targetTouch.pageX;
      const pageY = targetTouch.pageY;
      if (e.preventedByNestedSwiper) {
        touches.startX = pageX;
        touches.startY = pageY;
        return;
      }
      if (!swiper.allowTouchMove) {
        if (!e.target.matches(data.focusableElements)) {
          swiper.allowClick = false;
        }
        if (data.isTouched) {
          Object.assign(touches, {
            startX: pageX,
            startY: pageY,
            currentX: pageX,
            currentY: pageY
          });
          data.touchStartTime = now();
        }
        return;
      }
      if (params.touchReleaseOnEdges && !params.loop) {
        if (swiper.isVertical()) {
          // Vertical
          if (pageY < touches.startY && swiper.translate <= swiper.maxTranslate() || pageY > touches.startY && swiper.translate >= swiper.minTranslate()) {
            data.isTouched = false;
            data.isMoved = false;
            return;
          }
        } else if (rtl && (pageX > touches.startX && -swiper.translate <= swiper.maxTranslate() || pageX < touches.startX && -swiper.translate >= swiper.minTranslate())) {
          return;
        } else if (!rtl && (pageX < touches.startX && swiper.translate <= swiper.maxTranslate() || pageX > touches.startX && swiper.translate >= swiper.minTranslate())) {
          return;
        }
      }
      if (document.activeElement && document.activeElement.matches(data.focusableElements) && document.activeElement !== e.target && e.pointerType !== 'mouse') {
        document.activeElement.blur();
      }
      if (document.activeElement) {
        if (e.target === document.activeElement && e.target.matches(data.focusableElements)) {
          data.isMoved = true;
          swiper.allowClick = false;
          return;
        }
      }
      if (data.allowTouchCallbacks) {
        swiper.emit('touchMove', e);
      }
      touches.previousX = touches.currentX;
      touches.previousY = touches.currentY;
      touches.currentX = pageX;
      touches.currentY = pageY;
      const diffX = touches.currentX - touches.startX;
      const diffY = touches.currentY - touches.startY;
      if (swiper.params.threshold && Math.sqrt(diffX ** 2 + diffY ** 2) < swiper.params.threshold) return;
      if (typeof data.isScrolling === 'undefined') {
        let touchAngle;
        if (swiper.isHorizontal() && touches.currentY === touches.startY || swiper.isVertical() && touches.currentX === touches.startX) {
          data.isScrolling = false;
        } else {
          // eslint-disable-next-line
          if (diffX * diffX + diffY * diffY >= 25) {
            touchAngle = Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180 / Math.PI;
            data.isScrolling = swiper.isHorizontal() ? touchAngle > params.touchAngle : 90 - touchAngle > params.touchAngle;
          }
        }
      }
      if (data.isScrolling) {
        swiper.emit('touchMoveOpposite', e);
      }
      if (typeof data.startMoving === 'undefined') {
        if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
          data.startMoving = true;
        }
      }
      if (data.isScrolling || e.type === 'touchmove' && data.preventTouchMoveFromPointerMove) {
        data.isTouched = false;
        return;
      }
      if (!data.startMoving) {
        return;
      }
      swiper.allowClick = false;
      if (!params.cssMode && e.cancelable) {
        e.preventDefault();
      }
      if (params.touchMoveStopPropagation && !params.nested) {
        e.stopPropagation();
      }
      let diff = swiper.isHorizontal() ? diffX : diffY;
      let touchesDiff = swiper.isHorizontal() ? touches.currentX - touches.previousX : touches.currentY - touches.previousY;
      if (params.oneWayMovement) {
        diff = Math.abs(diff) * (rtl ? 1 : -1);
        touchesDiff = Math.abs(touchesDiff) * (rtl ? 1 : -1);
      }
      touches.diff = diff;
      diff *= params.touchRatio;
      if (rtl) {
        diff = -diff;
        touchesDiff = -touchesDiff;
      }
      const prevTouchesDirection = swiper.touchesDirection;
      swiper.swipeDirection = diff > 0 ? 'prev' : 'next';
      swiper.touchesDirection = touchesDiff > 0 ? 'prev' : 'next';
      const isLoop = swiper.params.loop && !params.cssMode;
      const allowLoopFix = swiper.touchesDirection === 'next' && swiper.allowSlideNext || swiper.touchesDirection === 'prev' && swiper.allowSlidePrev;
      if (!data.isMoved) {
        if (isLoop && allowLoopFix) {
          swiper.loopFix({
            direction: swiper.swipeDirection
          });
        }
        data.startTranslate = swiper.getTranslate();
        swiper.setTransition(0);
        if (swiper.animating) {
          const evt = new window.CustomEvent('transitionend', {
            bubbles: true,
            cancelable: true,
            detail: {
              bySwiperTouchMove: true
            }
          });
          swiper.wrapperEl.dispatchEvent(evt);
        }
        data.allowMomentumBounce = false;
        // Grab Cursor
        if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
          swiper.setGrabCursor(true);
        }
        swiper.emit('sliderFirstMove', e);
      }
      let loopFixed;
      new Date().getTime();
      if (params._loopSwapReset !== false && data.isMoved && data.allowThresholdMove && prevTouchesDirection !== swiper.touchesDirection && isLoop && allowLoopFix && Math.abs(diff) >= 1) {
        Object.assign(touches, {
          startX: pageX,
          startY: pageY,
          currentX: pageX,
          currentY: pageY,
          startTranslate: data.currentTranslate
        });
        data.loopSwapReset = true;
        data.startTranslate = data.currentTranslate;
        return;
      }
      swiper.emit('sliderMove', e);
      data.isMoved = true;
      data.currentTranslate = diff + data.startTranslate;
      let disableParentSwiper = true;
      let resistanceRatio = params.resistanceRatio;
      if (params.touchReleaseOnEdges) {
        resistanceRatio = 0;
      }
      if (diff > 0) {
        if (isLoop && allowLoopFix && !loopFixed && data.allowThresholdMove && data.currentTranslate > (params.centeredSlides ? swiper.minTranslate() - swiper.slidesSizesGrid[swiper.activeIndex + 1] - (params.slidesPerView !== 'auto' && swiper.slides.length - params.slidesPerView >= 2 ? swiper.slidesSizesGrid[swiper.activeIndex + 1] + swiper.params.spaceBetween : 0) - swiper.params.spaceBetween : swiper.minTranslate())) {
          swiper.loopFix({
            direction: 'prev',
            setTranslate: true,
            activeSlideIndex: 0
          });
        }
        if (data.currentTranslate > swiper.minTranslate()) {
          disableParentSwiper = false;
          if (params.resistance) {
            data.currentTranslate = swiper.minTranslate() - 1 + (-swiper.minTranslate() + data.startTranslate + diff) ** resistanceRatio;
          }
        }
      } else if (diff < 0) {
        if (isLoop && allowLoopFix && !loopFixed && data.allowThresholdMove && data.currentTranslate < (params.centeredSlides ? swiper.maxTranslate() + swiper.slidesSizesGrid[swiper.slidesSizesGrid.length - 1] + swiper.params.spaceBetween + (params.slidesPerView !== 'auto' && swiper.slides.length - params.slidesPerView >= 2 ? swiper.slidesSizesGrid[swiper.slidesSizesGrid.length - 1] + swiper.params.spaceBetween : 0) : swiper.maxTranslate())) {
          swiper.loopFix({
            direction: 'next',
            setTranslate: true,
            activeSlideIndex: swiper.slides.length - (params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : Math.ceil(parseFloat(params.slidesPerView, 10)))
          });
        }
        if (data.currentTranslate < swiper.maxTranslate()) {
          disableParentSwiper = false;
          if (params.resistance) {
            data.currentTranslate = swiper.maxTranslate() + 1 - (swiper.maxTranslate() - data.startTranslate - diff) ** resistanceRatio;
          }
        }
      }
      if (disableParentSwiper) {
        e.preventedByNestedSwiper = true;
      }

      // Directions locks
      if (!swiper.allowSlideNext && swiper.swipeDirection === 'next' && data.currentTranslate < data.startTranslate) {
        data.currentTranslate = data.startTranslate;
      }
      if (!swiper.allowSlidePrev && swiper.swipeDirection === 'prev' && data.currentTranslate > data.startTranslate) {
        data.currentTranslate = data.startTranslate;
      }
      if (!swiper.allowSlidePrev && !swiper.allowSlideNext) {
        data.currentTranslate = data.startTranslate;
      }

      // Threshold
      if (params.threshold > 0) {
        if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
          if (!data.allowThresholdMove) {
            data.allowThresholdMove = true;
            touches.startX = touches.currentX;
            touches.startY = touches.currentY;
            data.currentTranslate = data.startTranslate;
            touches.diff = swiper.isHorizontal() ? touches.currentX - touches.startX : touches.currentY - touches.startY;
            return;
          }
        } else {
          data.currentTranslate = data.startTranslate;
          return;
        }
      }
      if (!params.followFinger || params.cssMode) return;

      // Update active index in free mode
      if (params.freeMode && params.freeMode.enabled && swiper.freeMode || params.watchSlidesProgress) {
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      }
      if (params.freeMode && params.freeMode.enabled && swiper.freeMode) {
        swiper.freeMode.onTouchMove();
      }
      // Update progress
      swiper.updateProgress(data.currentTranslate);
      // Update translate
      swiper.setTranslate(data.currentTranslate);
    }

    function onTouchEnd(event) {
      const swiper = this;
      const data = swiper.touchEventsData;
      let e = event;
      if (e.originalEvent) e = e.originalEvent;
      let targetTouch;
      const isTouchEvent = e.type === 'touchend' || e.type === 'touchcancel';
      if (!isTouchEvent) {
        if (data.touchId !== null) return; // return from pointer if we use touch
        if (e.pointerId !== data.pointerId) return;
        targetTouch = e;
      } else {
        targetTouch = [...e.changedTouches].find(t => t.identifier === data.touchId);
        if (!targetTouch || targetTouch.identifier !== data.touchId) return;
      }
      if (['pointercancel', 'pointerout', 'pointerleave', 'contextmenu'].includes(e.type)) {
        const proceed = ['pointercancel', 'contextmenu'].includes(e.type) && (swiper.browser.isSafari || swiper.browser.isWebView);
        if (!proceed) {
          return;
        }
      }
      data.pointerId = null;
      data.touchId = null;
      const {
        params,
        touches,
        rtlTranslate: rtl,
        slidesGrid,
        enabled
      } = swiper;
      if (!enabled) return;
      if (!params.simulateTouch && e.pointerType === 'mouse') return;
      if (data.allowTouchCallbacks) {
        swiper.emit('touchEnd', e);
      }
      data.allowTouchCallbacks = false;
      if (!data.isTouched) {
        if (data.isMoved && params.grabCursor) {
          swiper.setGrabCursor(false);
        }
        data.isMoved = false;
        data.startMoving = false;
        return;
      }

      // Return Grab Cursor
      if (params.grabCursor && data.isMoved && data.isTouched && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
        swiper.setGrabCursor(false);
      }

      // Time diff
      const touchEndTime = now();
      const timeDiff = touchEndTime - data.touchStartTime;

      // Tap, doubleTap, Click
      if (swiper.allowClick) {
        const pathTree = e.path || e.composedPath && e.composedPath();
        swiper.updateClickedSlide(pathTree && pathTree[0] || e.target, pathTree);
        swiper.emit('tap click', e);
        if (timeDiff < 300 && touchEndTime - data.lastClickTime < 300) {
          swiper.emit('doubleTap doubleClick', e);
        }
      }
      data.lastClickTime = now();
      nextTick(() => {
        if (!swiper.destroyed) swiper.allowClick = true;
      });
      if (!data.isTouched || !data.isMoved || !swiper.swipeDirection || touches.diff === 0 && !data.loopSwapReset || data.currentTranslate === data.startTranslate && !data.loopSwapReset) {
        data.isTouched = false;
        data.isMoved = false;
        data.startMoving = false;
        return;
      }
      data.isTouched = false;
      data.isMoved = false;
      data.startMoving = false;
      let currentPos;
      if (params.followFinger) {
        currentPos = rtl ? swiper.translate : -swiper.translate;
      } else {
        currentPos = -data.currentTranslate;
      }
      if (params.cssMode) {
        return;
      }
      if (params.freeMode && params.freeMode.enabled) {
        swiper.freeMode.onTouchEnd({
          currentPos
        });
        return;
      }

      // Find current slide
      const swipeToLast = currentPos >= -swiper.maxTranslate() && !swiper.params.loop;
      let stopIndex = 0;
      let groupSize = swiper.slidesSizesGrid[0];
      for (let i = 0; i < slidesGrid.length; i += i < params.slidesPerGroupSkip ? 1 : params.slidesPerGroup) {
        const increment = i < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
        if (typeof slidesGrid[i + increment] !== 'undefined') {
          if (swipeToLast || currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + increment]) {
            stopIndex = i;
            groupSize = slidesGrid[i + increment] - slidesGrid[i];
          }
        } else if (swipeToLast || currentPos >= slidesGrid[i]) {
          stopIndex = i;
          groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
        }
      }
      let rewindFirstIndex = null;
      let rewindLastIndex = null;
      if (params.rewind) {
        if (swiper.isBeginning) {
          rewindLastIndex = params.virtual && params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
        } else if (swiper.isEnd) {
          rewindFirstIndex = 0;
        }
      }
      // Find current slide size
      const ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;
      const increment = stopIndex < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
      if (timeDiff > params.longSwipesMs) {
        // Long touches
        if (!params.longSwipes) {
          swiper.slideTo(swiper.activeIndex);
          return;
        }
        if (swiper.swipeDirection === 'next') {
          if (ratio >= params.longSwipesRatio) swiper.slideTo(params.rewind && swiper.isEnd ? rewindFirstIndex : stopIndex + increment);else swiper.slideTo(stopIndex);
        }
        if (swiper.swipeDirection === 'prev') {
          if (ratio > 1 - params.longSwipesRatio) {
            swiper.slideTo(stopIndex + increment);
          } else if (rewindLastIndex !== null && ratio < 0 && Math.abs(ratio) > params.longSwipesRatio) {
            swiper.slideTo(rewindLastIndex);
          } else {
            swiper.slideTo(stopIndex);
          }
        }
      } else {
        // Short swipes
        if (!params.shortSwipes) {
          swiper.slideTo(swiper.activeIndex);
          return;
        }
        const isNavButtonTarget = swiper.navigation && (e.target === swiper.navigation.nextEl || e.target === swiper.navigation.prevEl);
        if (!isNavButtonTarget) {
          if (swiper.swipeDirection === 'next') {
            swiper.slideTo(rewindFirstIndex !== null ? rewindFirstIndex : stopIndex + increment);
          }
          if (swiper.swipeDirection === 'prev') {
            swiper.slideTo(rewindLastIndex !== null ? rewindLastIndex : stopIndex);
          }
        } else if (e.target === swiper.navigation.nextEl) {
          swiper.slideTo(stopIndex + increment);
        } else {
          swiper.slideTo(stopIndex);
        }
      }
    }

    function onResize() {
      const swiper = this;
      const {
        params,
        el
      } = swiper;
      if (el && el.offsetWidth === 0) return;

      // Breakpoints
      if (params.breakpoints) {
        swiper.setBreakpoint();
      }

      // Save locks
      const {
        allowSlideNext,
        allowSlidePrev,
        snapGrid
      } = swiper;
      const isVirtual = swiper.virtual && swiper.params.virtual.enabled;

      // Disable locks on resize
      swiper.allowSlideNext = true;
      swiper.allowSlidePrev = true;
      swiper.updateSize();
      swiper.updateSlides();
      swiper.updateSlidesClasses();
      const isVirtualLoop = isVirtual && params.loop;
      if ((params.slidesPerView === 'auto' || params.slidesPerView > 1) && swiper.isEnd && !swiper.isBeginning && !swiper.params.centeredSlides && !isVirtualLoop) {
        swiper.slideTo(swiper.slides.length - 1, 0, false, true);
      } else {
        if (swiper.params.loop && !isVirtual) {
          swiper.slideToLoop(swiper.realIndex, 0, false, true);
        } else {
          swiper.slideTo(swiper.activeIndex, 0, false, true);
        }
      }
      if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
        clearTimeout(swiper.autoplay.resizeTimeout);
        swiper.autoplay.resizeTimeout = setTimeout(() => {
          if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
            swiper.autoplay.resume();
          }
        }, 500);
      }
      // Return locks after resize
      swiper.allowSlidePrev = allowSlidePrev;
      swiper.allowSlideNext = allowSlideNext;
      if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
        swiper.checkOverflow();
      }
    }

    function onClick(e) {
      const swiper = this;
      if (!swiper.enabled) return;
      if (!swiper.allowClick) {
        if (swiper.params.preventClicks) e.preventDefault();
        if (swiper.params.preventClicksPropagation && swiper.animating) {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    }

    function onScroll() {
      const swiper = this;
      const {
        wrapperEl,
        rtlTranslate,
        enabled
      } = swiper;
      if (!enabled) return;
      swiper.previousTranslate = swiper.translate;
      if (swiper.isHorizontal()) {
        swiper.translate = -wrapperEl.scrollLeft;
      } else {
        swiper.translate = -wrapperEl.scrollTop;
      }
      // eslint-disable-next-line
      if (swiper.translate === 0) swiper.translate = 0;
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
      let newProgress;
      const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
      if (translatesDiff === 0) {
        newProgress = 0;
      } else {
        newProgress = (swiper.translate - swiper.minTranslate()) / translatesDiff;
      }
      if (newProgress !== swiper.progress) {
        swiper.updateProgress(rtlTranslate ? -swiper.translate : swiper.translate);
      }
      swiper.emit('setTranslate', swiper.translate, false);
    }

    function onLoad(e) {
      const swiper = this;
      processLazyPreloader(swiper, e.target);
      if (swiper.params.cssMode || swiper.params.slidesPerView !== 'auto' && !swiper.params.autoHeight) {
        return;
      }
      swiper.update();
    }

    function onDocumentTouchStart() {
      const swiper = this;
      if (swiper.documentTouchHandlerProceeded) return;
      swiper.documentTouchHandlerProceeded = true;
      if (swiper.params.touchReleaseOnEdges) {
        swiper.el.style.touchAction = 'auto';
      }
    }

    const events = (swiper, method) => {
      const document = getDocument();
      const {
        params,
        el,
        wrapperEl,
        device
      } = swiper;
      const capture = !!params.nested;
      const domMethod = method === 'on' ? 'addEventListener' : 'removeEventListener';
      const swiperMethod = method;
      if (!el || typeof el === 'string') return;

      // Touch Events
      document[domMethod]('touchstart', swiper.onDocumentTouchStart, {
        passive: false,
        capture
      });
      el[domMethod]('touchstart', swiper.onTouchStart, {
        passive: false
      });
      el[domMethod]('pointerdown', swiper.onTouchStart, {
        passive: false
      });
      document[domMethod]('touchmove', swiper.onTouchMove, {
        passive: false,
        capture
      });
      document[domMethod]('pointermove', swiper.onTouchMove, {
        passive: false,
        capture
      });
      document[domMethod]('touchend', swiper.onTouchEnd, {
        passive: true
      });
      document[domMethod]('pointerup', swiper.onTouchEnd, {
        passive: true
      });
      document[domMethod]('pointercancel', swiper.onTouchEnd, {
        passive: true
      });
      document[domMethod]('touchcancel', swiper.onTouchEnd, {
        passive: true
      });
      document[domMethod]('pointerout', swiper.onTouchEnd, {
        passive: true
      });
      document[domMethod]('pointerleave', swiper.onTouchEnd, {
        passive: true
      });
      document[domMethod]('contextmenu', swiper.onTouchEnd, {
        passive: true
      });

      // Prevent Links Clicks
      if (params.preventClicks || params.preventClicksPropagation) {
        el[domMethod]('click', swiper.onClick, true);
      }
      if (params.cssMode) {
        wrapperEl[domMethod]('scroll', swiper.onScroll);
      }

      // Resize handler
      if (params.updateOnWindowResize) {
        swiper[swiperMethod](device.ios || device.android ? 'resize orientationchange observerUpdate' : 'resize observerUpdate', onResize, true);
      } else {
        swiper[swiperMethod]('observerUpdate', onResize, true);
      }

      // Images loader
      el[domMethod]('load', swiper.onLoad, {
        capture: true
      });
    };
    function attachEvents() {
      const swiper = this;
      const {
        params
      } = swiper;
      swiper.onTouchStart = onTouchStart.bind(swiper);
      swiper.onTouchMove = onTouchMove.bind(swiper);
      swiper.onTouchEnd = onTouchEnd.bind(swiper);
      swiper.onDocumentTouchStart = onDocumentTouchStart.bind(swiper);
      if (params.cssMode) {
        swiper.onScroll = onScroll.bind(swiper);
      }
      swiper.onClick = onClick.bind(swiper);
      swiper.onLoad = onLoad.bind(swiper);
      events(swiper, 'on');
    }
    function detachEvents() {
      const swiper = this;
      events(swiper, 'off');
    }
    var events$1 = {
      attachEvents,
      detachEvents
    };

    const isGridEnabled = (swiper, params) => {
      return swiper.grid && params.grid && params.grid.rows > 1;
    };
    function setBreakpoint() {
      const swiper = this;
      const {
        realIndex,
        initialized,
        params,
        el
      } = swiper;
      const breakpoints = params.breakpoints;
      if (!breakpoints || breakpoints && Object.keys(breakpoints).length === 0) return;
      const document = getDocument();

      // Get breakpoint for window/container width and update parameters
      const breakpointsBase = params.breakpointsBase === 'window' || !params.breakpointsBase ? params.breakpointsBase : 'container';
      const breakpointContainer = ['window', 'container'].includes(params.breakpointsBase) || !params.breakpointsBase ? swiper.el : document.querySelector(params.breakpointsBase);
      const breakpoint = swiper.getBreakpoint(breakpoints, breakpointsBase, breakpointContainer);
      if (!breakpoint || swiper.currentBreakpoint === breakpoint) return;
      const breakpointOnlyParams = breakpoint in breakpoints ? breakpoints[breakpoint] : undefined;
      const breakpointParams = breakpointOnlyParams || swiper.originalParams;
      const wasMultiRow = isGridEnabled(swiper, params);
      const isMultiRow = isGridEnabled(swiper, breakpointParams);
      const wasGrabCursor = swiper.params.grabCursor;
      const isGrabCursor = breakpointParams.grabCursor;
      const wasEnabled = params.enabled;
      if (wasMultiRow && !isMultiRow) {
        el.classList.remove(`${params.containerModifierClass}grid`, `${params.containerModifierClass}grid-column`);
        swiper.emitContainerClasses();
      } else if (!wasMultiRow && isMultiRow) {
        el.classList.add(`${params.containerModifierClass}grid`);
        if (breakpointParams.grid.fill && breakpointParams.grid.fill === 'column' || !breakpointParams.grid.fill && params.grid.fill === 'column') {
          el.classList.add(`${params.containerModifierClass}grid-column`);
        }
        swiper.emitContainerClasses();
      }
      if (wasGrabCursor && !isGrabCursor) {
        swiper.unsetGrabCursor();
      } else if (!wasGrabCursor && isGrabCursor) {
        swiper.setGrabCursor();
      }

      // Toggle navigation, pagination, scrollbar
      ['navigation', 'pagination', 'scrollbar'].forEach(prop => {
        if (typeof breakpointParams[prop] === 'undefined') return;
        const wasModuleEnabled = params[prop] && params[prop].enabled;
        const isModuleEnabled = breakpointParams[prop] && breakpointParams[prop].enabled;
        if (wasModuleEnabled && !isModuleEnabled) {
          swiper[prop].disable();
        }
        if (!wasModuleEnabled && isModuleEnabled) {
          swiper[prop].enable();
        }
      });
      const directionChanged = breakpointParams.direction && breakpointParams.direction !== params.direction;
      const needsReLoop = params.loop && (breakpointParams.slidesPerView !== params.slidesPerView || directionChanged);
      const wasLoop = params.loop;
      if (directionChanged && initialized) {
        swiper.changeDirection();
      }
      extend$1(swiper.params, breakpointParams);
      const isEnabled = swiper.params.enabled;
      const hasLoop = swiper.params.loop;
      Object.assign(swiper, {
        allowTouchMove: swiper.params.allowTouchMove,
        allowSlideNext: swiper.params.allowSlideNext,
        allowSlidePrev: swiper.params.allowSlidePrev
      });
      if (wasEnabled && !isEnabled) {
        swiper.disable();
      } else if (!wasEnabled && isEnabled) {
        swiper.enable();
      }
      swiper.currentBreakpoint = breakpoint;
      swiper.emit('_beforeBreakpoint', breakpointParams);
      if (initialized) {
        if (needsReLoop) {
          swiper.loopDestroy();
          swiper.loopCreate(realIndex);
          swiper.updateSlides();
        } else if (!wasLoop && hasLoop) {
          swiper.loopCreate(realIndex);
          swiper.updateSlides();
        } else if (wasLoop && !hasLoop) {
          swiper.loopDestroy();
        }
      }
      swiper.emit('breakpoint', breakpointParams);
    }

    function getBreakpoint(breakpoints, base = 'window', containerEl) {
      if (!breakpoints || base === 'container' && !containerEl) return undefined;
      let breakpoint = false;
      const window = getWindow();
      const currentHeight = base === 'window' ? window.innerHeight : containerEl.clientHeight;
      const points = Object.keys(breakpoints).map(point => {
        if (typeof point === 'string' && point.indexOf('@') === 0) {
          const minRatio = parseFloat(point.substr(1));
          const value = currentHeight * minRatio;
          return {
            value,
            point
          };
        }
        return {
          value: point,
          point
        };
      });
      points.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
      for (let i = 0; i < points.length; i += 1) {
        const {
          point,
          value
        } = points[i];
        if (base === 'window') {
          if (window.matchMedia(`(min-width: ${value}px)`).matches) {
            breakpoint = point;
          }
        } else if (value <= containerEl.clientWidth) {
          breakpoint = point;
        }
      }
      return breakpoint || 'max';
    }

    var breakpoints = {
      setBreakpoint,
      getBreakpoint
    };

    function prepareClasses(entries, prefix) {
      const resultClasses = [];
      entries.forEach(item => {
        if (typeof item === 'object') {
          Object.keys(item).forEach(classNames => {
            if (item[classNames]) {
              resultClasses.push(prefix + classNames);
            }
          });
        } else if (typeof item === 'string') {
          resultClasses.push(prefix + item);
        }
      });
      return resultClasses;
    }
    function addClasses() {
      const swiper = this;
      const {
        classNames,
        params,
        rtl,
        el,
        device
      } = swiper;
      // prettier-ignore
      const suffixes = prepareClasses(['initialized', params.direction, {
        'free-mode': swiper.params.freeMode && params.freeMode.enabled
      }, {
        'autoheight': params.autoHeight
      }, {
        'rtl': rtl
      }, {
        'grid': params.grid && params.grid.rows > 1
      }, {
        'grid-column': params.grid && params.grid.rows > 1 && params.grid.fill === 'column'
      }, {
        'android': device.android
      }, {
        'ios': device.ios
      }, {
        'css-mode': params.cssMode
      }, {
        'centered': params.cssMode && params.centeredSlides
      }, {
        'watch-progress': params.watchSlidesProgress
      }], params.containerModifierClass);
      classNames.push(...suffixes);
      el.classList.add(...classNames);
      swiper.emitContainerClasses();
    }

    function removeClasses() {
      const swiper = this;
      const {
        el,
        classNames
      } = swiper;
      if (!el || typeof el === 'string') return;
      el.classList.remove(...classNames);
      swiper.emitContainerClasses();
    }

    var classes$c = {
      addClasses,
      removeClasses
    };

    function checkOverflow() {
      const swiper = this;
      const {
        isLocked: wasLocked,
        params
      } = swiper;
      const {
        slidesOffsetBefore
      } = params;
      if (slidesOffsetBefore) {
        const lastSlideIndex = swiper.slides.length - 1;
        const lastSlideRightEdge = swiper.slidesGrid[lastSlideIndex] + swiper.slidesSizesGrid[lastSlideIndex] + slidesOffsetBefore * 2;
        swiper.isLocked = swiper.size > lastSlideRightEdge;
      } else {
        swiper.isLocked = swiper.snapGrid.length === 1;
      }
      if (params.allowSlideNext === true) {
        swiper.allowSlideNext = !swiper.isLocked;
      }
      if (params.allowSlidePrev === true) {
        swiper.allowSlidePrev = !swiper.isLocked;
      }
      if (wasLocked && wasLocked !== swiper.isLocked) {
        swiper.isEnd = false;
      }
      if (wasLocked !== swiper.isLocked) {
        swiper.emit(swiper.isLocked ? 'lock' : 'unlock');
      }
    }
    var checkOverflow$1 = {
      checkOverflow
    };

    var defaults = {
      init: true,
      direction: 'horizontal',
      oneWayMovement: false,
      swiperElementNodeName: 'SWIPER-CONTAINER',
      touchEventsTarget: 'wrapper',
      initialSlide: 0,
      speed: 300,
      cssMode: false,
      updateOnWindowResize: true,
      resizeObserver: true,
      nested: false,
      createElements: false,
      eventsPrefix: 'swiper',
      enabled: true,
      focusableElements: 'input, select, option, textarea, button, video, label',
      // Overrides
      width: null,
      height: null,
      //
      preventInteractionOnTransition: false,
      // ssr
      userAgent: null,
      url: null,
      // To support iOS's swipe-to-go-back gesture (when being used in-app).
      edgeSwipeDetection: false,
      edgeSwipeThreshold: 20,
      // Autoheight
      autoHeight: false,
      // Set wrapper width
      setWrapperSize: false,
      // Virtual Translate
      virtualTranslate: false,
      // Effects
      effect: 'slide',
      // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'

      // Breakpoints
      breakpoints: undefined,
      breakpointsBase: 'window',
      // Slides grid
      spaceBetween: 0,
      slidesPerView: 1,
      slidesPerGroup: 1,
      slidesPerGroupSkip: 0,
      slidesPerGroupAuto: false,
      centeredSlides: false,
      centeredSlidesBounds: false,
      slidesOffsetBefore: 0,
      // in px
      slidesOffsetAfter: 0,
      // in px
      normalizeSlideIndex: true,
      centerInsufficientSlides: false,
      snapToSlideEdge: false,
      // Disable swiper and hide navigation when container not overflow
      watchOverflow: true,
      // Round length
      roundLengths: false,
      // Touches
      touchRatio: 1,
      touchAngle: 45,
      simulateTouch: true,
      shortSwipes: true,
      longSwipes: true,
      longSwipesRatio: 0.5,
      longSwipesMs: 300,
      followFinger: true,
      allowTouchMove: true,
      threshold: 5,
      touchMoveStopPropagation: false,
      touchStartPreventDefault: true,
      touchStartForcePreventDefault: false,
      touchReleaseOnEdges: false,
      // Unique Navigation Elements
      uniqueNavElements: true,
      // Resistance
      resistance: true,
      resistanceRatio: 0.85,
      // Progress
      watchSlidesProgress: false,
      // Cursor
      grabCursor: false,
      // Clicks
      preventClicks: true,
      preventClicksPropagation: true,
      slideToClickedSlide: false,
      // loop
      loop: false,
      loopAddBlankSlides: true,
      loopAdditionalSlides: 0,
      loopPreventsSliding: true,
      // rewind
      rewind: false,
      // Swiping/no swiping
      allowSlidePrev: true,
      allowSlideNext: true,
      swipeHandler: null,
      // '.swipe-handler',
      noSwiping: true,
      noSwipingClass: 'swiper-no-swiping',
      noSwipingSelector: null,
      // Passive Listeners
      passiveListeners: true,
      maxBackfaceHiddenSlides: 10,
      // NS
      containerModifierClass: 'swiper-',
      // NEW
      slideClass: 'swiper-slide',
      slideBlankClass: 'swiper-slide-blank',
      slideActiveClass: 'swiper-slide-active',
      slideVisibleClass: 'swiper-slide-visible',
      slideFullyVisibleClass: 'swiper-slide-fully-visible',
      slideNextClass: 'swiper-slide-next',
      slidePrevClass: 'swiper-slide-prev',
      wrapperClass: 'swiper-wrapper',
      lazyPreloaderClass: 'swiper-lazy-preloader',
      lazyPreloadPrevNext: 0,
      // Callbacks
      runCallbacksOnInit: true,
      // Internals
      _emitClasses: false
    };

    function moduleExtendParams(params, allModulesParams) {
      return function extendParams(obj = {}) {
        const moduleParamName = Object.keys(obj)[0];
        const moduleParams = obj[moduleParamName];
        if (typeof moduleParams !== 'object' || moduleParams === null) {
          extend$1(allModulesParams, obj);
          return;
        }
        if (params[moduleParamName] === true) {
          params[moduleParamName] = {
            enabled: true
          };
        }
        if (moduleParamName === 'navigation' && params[moduleParamName] && params[moduleParamName].enabled && !params[moduleParamName].prevEl && !params[moduleParamName].nextEl) {
          params[moduleParamName].auto = true;
        }
        if (['pagination', 'scrollbar'].indexOf(moduleParamName) >= 0 && params[moduleParamName] && params[moduleParamName].enabled && !params[moduleParamName].el) {
          params[moduleParamName].auto = true;
        }
        if (!(moduleParamName in params && 'enabled' in moduleParams)) {
          extend$1(allModulesParams, obj);
          return;
        }
        if (typeof params[moduleParamName] === 'object' && !('enabled' in params[moduleParamName])) {
          params[moduleParamName].enabled = true;
        }
        if (!params[moduleParamName]) params[moduleParamName] = {
          enabled: false
        };
        extend$1(allModulesParams, obj);
      };
    }

    /* eslint no-param-reassign: "off" */
    const prototypes = {
      eventsEmitter,
      update,
      translate,
      transition,
      slide,
      loop,
      grabCursor,
      events: events$1,
      breakpoints,
      checkOverflow: checkOverflow$1,
      classes: classes$c
    };
    const extendedDefaults = {};
    class Swiper {
      constructor(...args) {
        let el;
        let params;
        if (args.length === 1 && args[0].constructor && Object.prototype.toString.call(args[0]).slice(8, -1) === 'Object') {
          params = args[0];
        } else {
          [el, params] = args;
        }
        if (!params) params = {};
        params = extend$1({}, params);
        if (el && !params.el) params.el = el;
        const document = getDocument();
        if (params.el && typeof params.el === 'string' && document.querySelectorAll(params.el).length > 1) {
          const swipers = [];
          document.querySelectorAll(params.el).forEach(containerEl => {
            const newParams = extend$1({}, params, {
              el: containerEl
            });
            swipers.push(new Swiper(newParams));
          });
          // eslint-disable-next-line no-constructor-return
          return swipers;
        }

        // Swiper Instance
        const swiper = this;
        swiper.__swiper__ = true;
        swiper.support = getSupport();
        swiper.device = getDevice({
          userAgent: params.userAgent
        });
        swiper.browser = getBrowser();
        swiper.eventsListeners = {};
        swiper.eventsAnyListeners = [];
        swiper.modules = [...swiper.__modules__];
        if (params.modules && Array.isArray(params.modules)) {
          params.modules.forEach(mod => {
            if (typeof mod === 'function' && swiper.modules.indexOf(mod) < 0) {
              swiper.modules.push(mod);
            }
          });
        }
        const allModulesParams = {};
        swiper.modules.forEach(mod => {
          mod({
            params,
            swiper,
            extendParams: moduleExtendParams(params, allModulesParams),
            on: swiper.on.bind(swiper),
            once: swiper.once.bind(swiper),
            off: swiper.off.bind(swiper),
            emit: swiper.emit.bind(swiper)
          });
        });

        // Extend defaults with modules params
        const swiperParams = extend$1({}, defaults, allModulesParams);

        // Extend defaults with passed params
        swiper.params = extend$1({}, swiperParams, extendedDefaults, params);
        swiper.originalParams = extend$1({}, swiper.params);
        swiper.passedParams = extend$1({}, params);

        // add event listeners
        if (swiper.params && swiper.params.on) {
          Object.keys(swiper.params.on).forEach(eventName => {
            swiper.on(eventName, swiper.params.on[eventName]);
          });
        }
        if (swiper.params && swiper.params.onAny) {
          swiper.onAny(swiper.params.onAny);
        }

        // Extend Swiper
        Object.assign(swiper, {
          enabled: swiper.params.enabled,
          el,
          // Classes
          classNames: [],
          // Slides
          slides: [],
          slidesGrid: [],
          snapGrid: [],
          slidesSizesGrid: [],
          // isDirection
          isHorizontal() {
            return swiper.params.direction === 'horizontal';
          },
          isVertical() {
            return swiper.params.direction === 'vertical';
          },
          // Indexes
          activeIndex: 0,
          realIndex: 0,
          //
          isBeginning: true,
          isEnd: false,
          // Props
          translate: 0,
          previousTranslate: 0,
          progress: 0,
          velocity: 0,
          animating: false,
          cssOverflowAdjustment() {
            // Returns 0 unless `translate` is > 2**23
            // Should be subtracted from css values to prevent overflow
            return Math.trunc(this.translate / 2 ** 23) * 2 ** 23;
          },
          // Locks
          allowSlideNext: swiper.params.allowSlideNext,
          allowSlidePrev: swiper.params.allowSlidePrev,
          // Touch Events
          touchEventsData: {
            isTouched: undefined,
            isMoved: undefined,
            allowTouchCallbacks: undefined,
            touchStartTime: undefined,
            isScrolling: undefined,
            currentTranslate: undefined,
            startTranslate: undefined,
            allowThresholdMove: undefined,
            // Form elements to match
            focusableElements: swiper.params.focusableElements,
            // Last click time
            lastClickTime: 0,
            clickTimeout: undefined,
            // Velocities
            velocities: [],
            allowMomentumBounce: undefined,
            startMoving: undefined,
            pointerId: null,
            touchId: null
          },
          // Clicks
          allowClick: true,
          // Touches
          allowTouchMove: swiper.params.allowTouchMove,
          touches: {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            diff: 0
          },
          // Images
          imagesToLoad: [],
          imagesLoaded: 0
        });
        swiper.emit('_swiper');

        // Init
        if (swiper.params.init) {
          swiper.init();
        }

        // Return app instance
        // eslint-disable-next-line no-constructor-return
        return swiper;
      }
      getDirectionLabel(property) {
        if (this.isHorizontal()) {
          return property;
        }
        // prettier-ignore
        return {
          'width': 'height',
          'margin-top': 'margin-left',
          'margin-bottom ': 'margin-right',
          'margin-left': 'margin-top',
          'margin-right': 'margin-bottom',
          'padding-left': 'padding-top',
          'padding-right': 'padding-bottom',
          'marginRight': 'marginBottom'
        }[property];
      }
      getSlideIndex(slideEl) {
        const {
          slidesEl,
          params
        } = this;
        const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
        const firstSlideIndex = elementIndex(slides[0]);
        return elementIndex(slideEl) - firstSlideIndex;
      }
      getSlideIndexByData(index) {
        return this.getSlideIndex(this.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') * 1 === index));
      }
      getSlideIndexWhenGrid(index) {
        if (this.grid && this.params.grid && this.params.grid.rows > 1) {
          if (this.params.grid.fill === 'column') {
            index = Math.floor(index / this.params.grid.rows);
          } else if (this.params.grid.fill === 'row') {
            index = index % Math.ceil(this.slides.length / this.params.grid.rows);
          }
        }
        return index;
      }
      recalcSlides() {
        const swiper = this;
        const {
          slidesEl,
          params
        } = swiper;
        swiper.slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
      }
      enable() {
        const swiper = this;
        if (swiper.enabled) return;
        swiper.enabled = true;
        if (swiper.params.grabCursor) {
          swiper.setGrabCursor();
        }
        swiper.emit('enable');
      }
      disable() {
        const swiper = this;
        if (!swiper.enabled) return;
        swiper.enabled = false;
        if (swiper.params.grabCursor) {
          swiper.unsetGrabCursor();
        }
        swiper.emit('disable');
      }
      setProgress(progress, speed) {
        const swiper = this;
        progress = Math.min(Math.max(progress, 0), 1);
        const min = swiper.minTranslate();
        const max = swiper.maxTranslate();
        const current = (max - min) * progress + min;
        swiper.translateTo(current, typeof speed === 'undefined' ? 0 : speed);
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      }
      emitContainerClasses() {
        const swiper = this;
        if (!swiper.params._emitClasses || !swiper.el) return;
        const cls = swiper.el.className.split(' ').filter(className => {
          return className.indexOf('swiper') === 0 || className.indexOf(swiper.params.containerModifierClass) === 0;
        });
        swiper.emit('_containerClasses', cls.join(' '));
      }
      getSlideClasses(slideEl) {
        const swiper = this;
        if (swiper.destroyed) return '';
        return slideEl.className.split(' ').filter(className => {
          return className.indexOf('swiper-slide') === 0 || className.indexOf(swiper.params.slideClass) === 0;
        }).join(' ');
      }
      emitSlidesClasses() {
        const swiper = this;
        if (!swiper.params._emitClasses || !swiper.el) return;
        const updates = [];
        swiper.slides.forEach(slideEl => {
          const classNames = swiper.getSlideClasses(slideEl);
          updates.push({
            slideEl,
            classNames
          });
          swiper.emit('_slideClass', slideEl, classNames);
        });
        swiper.emit('_slideClasses', updates);
      }
      slidesPerViewDynamic(view = 'current', exact = false) {
        const swiper = this;
        const {
          params,
          slides,
          slidesGrid,
          slidesSizesGrid,
          size: swiperSize,
          activeIndex
        } = swiper;
        let spv = 1;
        if (typeof params.slidesPerView === 'number') return params.slidesPerView;
        if (params.centeredSlides) {
          let slideSize = slides[activeIndex] ? Math.ceil(slides[activeIndex].swiperSlideSize) : 0;
          let breakLoop;
          for (let i = activeIndex + 1; i < slides.length; i += 1) {
            if (slides[i] && !breakLoop) {
              slideSize += Math.ceil(slides[i].swiperSlideSize);
              spv += 1;
              if (slideSize > swiperSize) breakLoop = true;
            }
          }
          for (let i = activeIndex - 1; i >= 0; i -= 1) {
            if (slides[i] && !breakLoop) {
              slideSize += slides[i].swiperSlideSize;
              spv += 1;
              if (slideSize > swiperSize) breakLoop = true;
            }
          }
        } else {
          // eslint-disable-next-line
          if (view === 'current') {
            for (let i = activeIndex + 1; i < slides.length; i += 1) {
              const slideInView = exact ? slidesGrid[i] + slidesSizesGrid[i] - slidesGrid[activeIndex] < swiperSize : slidesGrid[i] - slidesGrid[activeIndex] < swiperSize;
              if (slideInView) {
                spv += 1;
              }
            }
          } else {
            // previous
            for (let i = activeIndex - 1; i >= 0; i -= 1) {
              const slideInView = slidesGrid[activeIndex] - slidesGrid[i] < swiperSize;
              if (slideInView) {
                spv += 1;
              }
            }
          }
        }
        return spv;
      }
      update() {
        const swiper = this;
        if (!swiper || swiper.destroyed) return;
        const {
          snapGrid,
          params
        } = swiper;
        // Breakpoints
        if (params.breakpoints) {
          swiper.setBreakpoint();
        }
        [...swiper.el.querySelectorAll('[loading="lazy"]')].forEach(imageEl => {
          if (imageEl.complete) {
            processLazyPreloader(swiper, imageEl);
          }
        });
        swiper.updateSize();
        swiper.updateSlides();
        swiper.updateProgress();
        swiper.updateSlidesClasses();
        function setTranslate() {
          const translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
          const newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
          swiper.setTranslate(newTranslate);
          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();
        }
        let translated;
        if (params.freeMode && params.freeMode.enabled && !params.cssMode) {
          setTranslate();
          if (params.autoHeight) {
            swiper.updateAutoHeight();
          }
        } else {
          if ((params.slidesPerView === 'auto' || params.slidesPerView > 1) && swiper.isEnd && !params.centeredSlides) {
            const slides = swiper.virtual && params.virtual.enabled ? swiper.virtual.slides : swiper.slides;
            translated = swiper.slideTo(slides.length - 1, 0, false, true);
          } else {
            translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
          }
          if (!translated) {
            setTranslate();
          }
        }
        if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
          swiper.checkOverflow();
        }
        swiper.emit('update');
      }
      changeDirection(newDirection, needUpdate = true) {
        const swiper = this;
        const currentDirection = swiper.params.direction;
        if (!newDirection) {
          // eslint-disable-next-line
          newDirection = currentDirection === 'horizontal' ? 'vertical' : 'horizontal';
        }
        if (newDirection === currentDirection || newDirection !== 'horizontal' && newDirection !== 'vertical') {
          return swiper;
        }
        swiper.el.classList.remove(`${swiper.params.containerModifierClass}${currentDirection}`);
        swiper.el.classList.add(`${swiper.params.containerModifierClass}${newDirection}`);
        swiper.emitContainerClasses();
        swiper.params.direction = newDirection;
        swiper.slides.forEach(slideEl => {
          if (newDirection === 'vertical') {
            slideEl.style.width = '';
          } else {
            slideEl.style.height = '';
          }
        });
        swiper.emit('changeDirection');
        if (needUpdate) swiper.update();
        return swiper;
      }
      changeLanguageDirection(direction) {
        const swiper = this;
        if (swiper.rtl && direction === 'rtl' || !swiper.rtl && direction === 'ltr') return;
        swiper.rtl = direction === 'rtl';
        swiper.rtlTranslate = swiper.params.direction === 'horizontal' && swiper.rtl;
        if (swiper.rtl) {
          swiper.el.classList.add(`${swiper.params.containerModifierClass}rtl`);
          swiper.el.dir = 'rtl';
        } else {
          swiper.el.classList.remove(`${swiper.params.containerModifierClass}rtl`);
          swiper.el.dir = 'ltr';
        }
        swiper.update();
      }
      mount(element) {
        const swiper = this;
        if (swiper.mounted) return true;

        // Find el
        let el = element || swiper.params.el;
        if (typeof el === 'string') {
          el = document.querySelector(el);
        }
        if (!el) {
          return false;
        }
        el.swiper = swiper;
        if (el.parentNode && el.parentNode.host && el.parentNode.host.nodeName === swiper.params.swiperElementNodeName.toUpperCase()) {
          swiper.isElement = true;
        }
        const getWrapperSelector = () => {
          return `.${(swiper.params.wrapperClass || '').trim().split(' ').join('.')}`;
        };
        const getWrapper = () => {
          if (el && el.shadowRoot && el.shadowRoot.querySelector) {
            const res = el.shadowRoot.querySelector(getWrapperSelector());
            // Children needs to return slot items
            return res;
          }
          return elementChildren(el, getWrapperSelector())[0];
        };
        // Find Wrapper
        let wrapperEl = getWrapper();
        if (!wrapperEl && swiper.params.createElements) {
          wrapperEl = createElement('div', swiper.params.wrapperClass);
          el.append(wrapperEl);
          elementChildren(el, `.${swiper.params.slideClass}`).forEach(slideEl => {
            wrapperEl.append(slideEl);
          });
        }
        Object.assign(swiper, {
          el,
          wrapperEl,
          slidesEl: swiper.isElement && !el.parentNode.host.slideSlots ? el.parentNode.host : wrapperEl,
          hostEl: swiper.isElement ? el.parentNode.host : el,
          mounted: true,
          // RTL
          rtl: el.dir.toLowerCase() === 'rtl' || elementStyle(el, 'direction') === 'rtl',
          rtlTranslate: swiper.params.direction === 'horizontal' && (el.dir.toLowerCase() === 'rtl' || elementStyle(el, 'direction') === 'rtl'),
          wrongRTL: elementStyle(wrapperEl, 'display') === '-webkit-box'
        });
        return true;
      }
      init(el) {
        const swiper = this;
        if (swiper.initialized) return swiper;
        const mounted = swiper.mount(el);
        if (mounted === false) return swiper;
        swiper.emit('beforeInit');

        // Set breakpoint
        if (swiper.params.breakpoints) {
          swiper.setBreakpoint();
        }

        // Add Classes
        swiper.addClasses();

        // Update size
        swiper.updateSize();

        // Update slides
        swiper.updateSlides();
        if (swiper.params.watchOverflow) {
          swiper.checkOverflow();
        }

        // Set Grab Cursor
        if (swiper.params.grabCursor && swiper.enabled) {
          swiper.setGrabCursor();
        }

        // Slide To Initial Slide
        if (swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
          swiper.slideTo(swiper.params.initialSlide + swiper.virtual.slidesBefore, 0, swiper.params.runCallbacksOnInit, false, true);
        } else {
          swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit, false, true);
        }

        // Create loop
        if (swiper.params.loop) {
          swiper.loopCreate(undefined, true);
        }

        // Attach events
        swiper.attachEvents();
        const lazyElements = [...swiper.el.querySelectorAll('[loading="lazy"]')];
        if (swiper.isElement) {
          lazyElements.push(...swiper.hostEl.querySelectorAll('[loading="lazy"]'));
        }
        lazyElements.forEach(imageEl => {
          if (imageEl.complete) {
            processLazyPreloader(swiper, imageEl);
          } else {
            imageEl.addEventListener('load', e => {
              processLazyPreloader(swiper, e.target);
            });
          }
        });
        preload(swiper);

        // Init Flag
        swiper.initialized = true;
        preload(swiper);

        // Emit
        swiper.emit('init');
        swiper.emit('afterInit');
        return swiper;
      }
      destroy(deleteInstance = true, cleanStyles = true) {
        const swiper = this;
        const {
          params,
          el,
          wrapperEl,
          slides
        } = swiper;
        if (typeof swiper.params === 'undefined' || swiper.destroyed) {
          return null;
        }
        swiper.emit('beforeDestroy');

        // Init Flag
        swiper.initialized = false;

        // Detach events
        swiper.detachEvents();

        // Destroy loop
        if (params.loop) {
          swiper.loopDestroy();
        }

        // Cleanup styles
        if (cleanStyles) {
          swiper.removeClasses();
          if (el && typeof el !== 'string') {
            el.removeAttribute('style');
          }
          if (wrapperEl) {
            wrapperEl.removeAttribute('style');
          }
          if (slides && slides.length) {
            slides.forEach(slideEl => {
              slideEl.classList.remove(params.slideVisibleClass, params.slideFullyVisibleClass, params.slideActiveClass, params.slideNextClass, params.slidePrevClass);
              slideEl.removeAttribute('style');
              slideEl.removeAttribute('data-swiper-slide-index');
            });
          }
        }
        swiper.emit('destroy');

        // Detach emitter events
        Object.keys(swiper.eventsListeners).forEach(eventName => {
          swiper.off(eventName);
        });
        if (deleteInstance !== false) {
          if (swiper.el && typeof swiper.el !== 'string') {
            swiper.el.swiper = null;
          }
          deleteProps(swiper);
        }
        swiper.destroyed = true;
        return null;
      }
      static extendDefaults(newDefaults) {
        extend$1(extendedDefaults, newDefaults);
      }
      static get extendedDefaults() {
        return extendedDefaults;
      }
      static get defaults() {
        return defaults;
      }
      static installModule(mod) {
        if (!Swiper.prototype.__modules__) Swiper.prototype.__modules__ = [];
        const modules = Swiper.prototype.__modules__;
        if (typeof mod === 'function' && modules.indexOf(mod) < 0) {
          modules.push(mod);
        }
      }
      static use(module) {
        if (Array.isArray(module)) {
          module.forEach(m => Swiper.installModule(m));
          return Swiper;
        }
        Swiper.installModule(module);
        return Swiper;
      }
    }
    Object.keys(prototypes).forEach(prototypeGroup => {
      Object.keys(prototypes[prototypeGroup]).forEach(protoMethod => {
        Swiper.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
      });
    });
    Swiper.use([Resize, Observer]);

    function Virtual({
      swiper,
      extendParams,
      on,
      emit
    }) {
      extendParams({
        virtual: {
          enabled: false,
          slides: [],
          cache: true,
          slidesPerViewAutoSlideSize: 320,
          renderSlide: null,
          renderExternal: null,
          renderExternalUpdate: true,
          addSlidesBefore: 0,
          addSlidesAfter: 0
        }
      });
      let cssModeTimeout;
      const document = getDocument();
      swiper.virtual = {
        cache: {},
        from: undefined,
        to: undefined,
        slides: [],
        offset: 0,
        slidesGrid: []
      };
      const tempDOM = document.createElement('div');
      function renderSlide(slide, index) {
        const params = swiper.params.virtual;
        if (params.cache && swiper.virtual.cache[index]) {
          return swiper.virtual.cache[index];
        }
        // eslint-disable-next-line
        let slideEl;
        if (params.renderSlide) {
          slideEl = params.renderSlide.call(swiper, slide, index);
          if (typeof slideEl === 'string') {
            setInnerHTML(tempDOM, slideEl);
            slideEl = tempDOM.children[0];
          }
        } else if (swiper.isElement) {
          slideEl = createElement('swiper-slide');
        } else {
          slideEl = createElement('div', swiper.params.slideClass);
        }
        slideEl.setAttribute('data-swiper-slide-index', index);
        if (!params.renderSlide) {
          setInnerHTML(slideEl, slide);
        }
        if (params.cache) {
          swiper.virtual.cache[index] = slideEl;
        }
        return slideEl;
      }
      function update(force, beforeInit, forceActiveIndex) {
        const {
          slidesPerGroup,
          centeredSlides,
          slidesPerView,
          loop: isLoop,
          initialSlide
        } = swiper.params;
        if (beforeInit && !isLoop && initialSlide > 0) {
          return;
        }
        const {
          addSlidesBefore,
          addSlidesAfter,
          slidesPerViewAutoSlideSize
        } = swiper.params.virtual;
        const {
          from: previousFrom,
          to: previousTo,
          slides,
          slidesGrid: previousSlidesGrid,
          offset: previousOffset
        } = swiper.virtual;
        if (!swiper.params.cssMode) {
          swiper.updateActiveIndex();
        }
        const activeIndex = typeof forceActiveIndex === 'undefined' ? swiper.activeIndex || 0 : forceActiveIndex;
        let offsetProp;
        if (swiper.rtlTranslate) offsetProp = 'right';else offsetProp = swiper.isHorizontal() ? 'left' : 'top';
        let slidesPerViewNumeric;
        if (slidesPerView === 'auto') {
          if (slidesPerViewAutoSlideSize) {
            let swiperSize = swiper.size;
            if (!swiperSize) {
              swiperSize = swiper.isHorizontal() ? swiper.el.getBoundingClientRect().width : swiper.el.getBoundingClientRect().height;
            }
            slidesPerViewNumeric = Math.max(1, Math.ceil(swiperSize / slidesPerViewAutoSlideSize));
          } else {
            slidesPerViewNumeric = 1;
          }
        } else {
          slidesPerViewNumeric = slidesPerView;
        }
        let slidesAfter;
        let slidesBefore;
        if (centeredSlides) {
          slidesAfter = Math.floor(slidesPerViewNumeric / 2) + slidesPerGroup + addSlidesAfter;
          slidesBefore = Math.floor(slidesPerViewNumeric / 2) + slidesPerGroup + addSlidesBefore;
        } else {
          slidesAfter = slidesPerViewNumeric + (slidesPerGroup - 1) + addSlidesAfter;
          slidesBefore = (isLoop ? slidesPerViewNumeric : slidesPerGroup) + addSlidesBefore;
        }
        let from = activeIndex - slidesBefore;
        let to = activeIndex + slidesAfter;
        if (!isLoop) {
          from = Math.max(from, 0);
          to = Math.min(to, slides.length - 1);
        }
        let offset = (swiper.slidesGrid[from] || 0) - (swiper.slidesGrid[0] || 0);
        if (isLoop && activeIndex >= slidesBefore) {
          from -= slidesBefore;
          if (!centeredSlides) offset += swiper.slidesGrid[0];
        } else if (isLoop && activeIndex < slidesBefore) {
          from = -slidesBefore;
          if (centeredSlides) offset += swiper.slidesGrid[0];
        }
        Object.assign(swiper.virtual, {
          from,
          to,
          offset,
          slidesGrid: swiper.slidesGrid,
          slidesBefore,
          slidesAfter
        });
        function onRendered() {
          swiper.updateSlides();
          swiper.updateProgress();
          swiper.updateSlidesClasses();
          emit('virtualUpdate');
        }
        if (previousFrom === from && previousTo === to && !force) {
          if (swiper.slidesGrid !== previousSlidesGrid && offset !== previousOffset) {
            swiper.slides.forEach(slideEl => {
              slideEl.style[offsetProp] = `${offset - Math.abs(swiper.cssOverflowAdjustment())}px`;
            });
          }
          swiper.updateProgress();
          emit('virtualUpdate');
          return;
        }
        if (swiper.params.virtual.renderExternal) {
          swiper.params.virtual.renderExternal.call(swiper, {
            offset,
            from,
            to,
            slides: function getSlides() {
              const slidesToRender = [];
              for (let i = from; i <= to; i += 1) {
                slidesToRender.push(slides[i]);
              }
              return slidesToRender;
            }()
          });
          if (swiper.params.virtual.renderExternalUpdate) {
            onRendered();
          } else {
            emit('virtualUpdate');
          }
          return;
        }
        const prependIndexes = [];
        const appendIndexes = [];
        const getSlideIndex = index => {
          let slideIndex = index;
          if (index < 0) {
            slideIndex = slides.length + index;
          } else if (slideIndex >= slides.length) {
            // eslint-disable-next-line
            slideIndex = slideIndex - slides.length;
          }
          return slideIndex;
        };
        if (force) {
          swiper.slides.filter(el => el.matches(`.${swiper.params.slideClass}, swiper-slide`)).forEach(slideEl => {
            slideEl.remove();
          });
        } else {
          for (let i = previousFrom; i <= previousTo; i += 1) {
            if (i < from || i > to) {
              const slideIndex = getSlideIndex(i);
              swiper.slides.filter(el => el.matches(`.${swiper.params.slideClass}[data-swiper-slide-index="${slideIndex}"], swiper-slide[data-swiper-slide-index="${slideIndex}"]`)).forEach(slideEl => {
                slideEl.remove();
              });
            }
          }
        }
        const loopFrom = isLoop ? -slides.length : 0;
        const loopTo = isLoop ? slides.length * 2 : slides.length;
        for (let i = loopFrom; i < loopTo; i += 1) {
          if (i >= from && i <= to) {
            const slideIndex = getSlideIndex(i);
            if (typeof previousTo === 'undefined' || force) {
              appendIndexes.push(slideIndex);
            } else {
              if (i > previousTo) appendIndexes.push(slideIndex);
              if (i < previousFrom) prependIndexes.push(slideIndex);
            }
          }
        }
        appendIndexes.forEach(index => {
          swiper.slidesEl.append(renderSlide(slides[index], index));
        });
        if (isLoop) {
          for (let i = prependIndexes.length - 1; i >= 0; i -= 1) {
            const index = prependIndexes[i];
            swiper.slidesEl.prepend(renderSlide(slides[index], index));
          }
        } else {
          prependIndexes.sort((a, b) => b - a);
          prependIndexes.forEach(index => {
            swiper.slidesEl.prepend(renderSlide(slides[index], index));
          });
        }
        elementChildren(swiper.slidesEl, '.swiper-slide, swiper-slide').forEach(slideEl => {
          slideEl.style[offsetProp] = `${offset - Math.abs(swiper.cssOverflowAdjustment())}px`;
        });
        onRendered();
      }
      function appendSlide(slides) {
        if (typeof slides === 'object' && 'length' in slides) {
          for (let i = 0; i < slides.length; i += 1) {
            if (slides[i]) swiper.virtual.slides.push(slides[i]);
          }
        } else {
          swiper.virtual.slides.push(slides);
        }
        update(true);
      }
      function prependSlide(slides) {
        const activeIndex = swiper.activeIndex;
        let newActiveIndex = activeIndex + 1;
        let numberOfNewSlides = 1;
        if (Array.isArray(slides)) {
          for (let i = 0; i < slides.length; i += 1) {
            if (slides[i]) swiper.virtual.slides.unshift(slides[i]);
          }
          newActiveIndex = activeIndex + slides.length;
          numberOfNewSlides = slides.length;
        } else {
          swiper.virtual.slides.unshift(slides);
        }
        if (swiper.params.virtual.cache) {
          const cache = swiper.virtual.cache;
          const newCache = {};
          Object.keys(cache).forEach(cachedIndex => {
            const cachedEl = cache[cachedIndex];
            const cachedElIndex = cachedEl.getAttribute('data-swiper-slide-index');
            if (cachedElIndex) {
              cachedEl.setAttribute('data-swiper-slide-index', parseInt(cachedElIndex, 10) + numberOfNewSlides);
            }
            newCache[parseInt(cachedIndex, 10) + numberOfNewSlides] = cachedEl;
          });
          swiper.virtual.cache = newCache;
        }
        update(true);
        swiper.slideTo(newActiveIndex, 0);
      }
      function removeSlide(slidesIndexes) {
        if (typeof slidesIndexes === 'undefined' || slidesIndexes === null) return;
        let activeIndex = swiper.activeIndex;
        if (Array.isArray(slidesIndexes)) {
          for (let i = slidesIndexes.length - 1; i >= 0; i -= 1) {
            if (swiper.params.virtual.cache) {
              delete swiper.virtual.cache[slidesIndexes[i]];
              // shift cache indexes
              Object.keys(swiper.virtual.cache).forEach(key => {
                if (key > slidesIndexes) {
                  swiper.virtual.cache[key - 1] = swiper.virtual.cache[key];
                  swiper.virtual.cache[key - 1].setAttribute('data-swiper-slide-index', key - 1);
                  delete swiper.virtual.cache[key];
                }
              });
            }
            swiper.virtual.slides.splice(slidesIndexes[i], 1);
            if (slidesIndexes[i] < activeIndex) activeIndex -= 1;
            activeIndex = Math.max(activeIndex, 0);
          }
        } else {
          if (swiper.params.virtual.cache) {
            delete swiper.virtual.cache[slidesIndexes];
            // shift cache indexes
            Object.keys(swiper.virtual.cache).forEach(key => {
              if (key > slidesIndexes) {
                swiper.virtual.cache[key - 1] = swiper.virtual.cache[key];
                swiper.virtual.cache[key - 1].setAttribute('data-swiper-slide-index', key - 1);
                delete swiper.virtual.cache[key];
              }
            });
          }
          swiper.virtual.slides.splice(slidesIndexes, 1);
          if (slidesIndexes < activeIndex) activeIndex -= 1;
          activeIndex = Math.max(activeIndex, 0);
        }
        update(true);
        swiper.slideTo(activeIndex, 0);
      }
      function removeAllSlides() {
        swiper.virtual.slides = [];
        if (swiper.params.virtual.cache) {
          swiper.virtual.cache = {};
        }
        update(true);
        swiper.slideTo(0, 0);
      }
      on('beforeInit', () => {
        if (!swiper.params.virtual.enabled) return;
        let domSlidesAssigned;
        if (typeof swiper.passedParams.virtual.slides === 'undefined') {
          const slides = [...swiper.slidesEl.children].filter(el => el.matches(`.${swiper.params.slideClass}, swiper-slide`));
          if (slides && slides.length) {
            swiper.virtual.slides = [...slides];
            domSlidesAssigned = true;
            slides.forEach((slideEl, slideIndex) => {
              slideEl.setAttribute('data-swiper-slide-index', slideIndex);
              swiper.virtual.cache[slideIndex] = slideEl;
              slideEl.remove();
            });
          }
        }
        if (!domSlidesAssigned) {
          swiper.virtual.slides = swiper.params.virtual.slides;
        }
        swiper.classNames.push(`${swiper.params.containerModifierClass}virtual`);
        swiper.params.watchSlidesProgress = true;
        swiper.originalParams.watchSlidesProgress = true;
        update(false, true);
      });
      on('setTranslate', () => {
        if (!swiper.params.virtual.enabled) return;
        if (swiper.params.cssMode && !swiper._immediateVirtual) {
          clearTimeout(cssModeTimeout);
          cssModeTimeout = setTimeout(() => {
            update();
          }, 100);
        } else {
          update();
        }
      });
      on('init update resize', () => {
        if (!swiper.params.virtual.enabled) return;
        if (swiper.params.cssMode) {
          setCSSProperty(swiper.wrapperEl, '--swiper-virtual-size', `${swiper.virtualSize}px`);
        }
      });
      Object.assign(swiper.virtual, {
        appendSlide,
        prependSlide,
        removeSlide,
        removeAllSlides,
        update
      });
    }

    /* eslint-disable consistent-return */
    function Keyboard({
      swiper,
      extendParams,
      on,
      emit
    }) {
      const document = getDocument();
      const window = getWindow();
      swiper.keyboard = {
        enabled: false
      };
      extendParams({
        keyboard: {
          enabled: false,
          onlyInViewport: true,
          pageUpDown: true,
          speed: undefined
        }
      });
      function handle(event) {
        if (!swiper.enabled) return;
        const {
          rtlTranslate: rtl
        } = swiper;
        let e = event;
        if (e.originalEvent) e = e.originalEvent; // jquery fix
        const kc = e.keyCode || e.charCode;
        const pageUpDown = swiper.params.keyboard.pageUpDown;
        const isPageUp = pageUpDown && kc === 33;
        const isPageDown = pageUpDown && kc === 34;
        const isArrowLeft = kc === 37;
        const isArrowRight = kc === 39;
        const isArrowUp = kc === 38;
        const isArrowDown = kc === 40;
        // Directions locks
        if (!swiper.allowSlideNext && (swiper.isHorizontal() && isArrowRight || swiper.isVertical() && isArrowDown || isPageDown)) {
          return false;
        }
        if (!swiper.allowSlidePrev && (swiper.isHorizontal() && isArrowLeft || swiper.isVertical() && isArrowUp || isPageUp)) {
          return false;
        }
        if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) {
          return undefined;
        }
        if (document.activeElement && (document.activeElement.isContentEditable || document.activeElement.nodeName && (document.activeElement.nodeName.toLowerCase() === 'input' || document.activeElement.nodeName.toLowerCase() === 'textarea'))) {
          return undefined;
        }
        if (swiper.params.keyboard.onlyInViewport && (isPageUp || isPageDown || isArrowLeft || isArrowRight || isArrowUp || isArrowDown)) {
          let inView = false;
          // Check that swiper should be inside of visible area of window
          if (elementParents(swiper.el, `.${swiper.params.slideClass}, swiper-slide`).length > 0 && elementParents(swiper.el, `.${swiper.params.slideActiveClass}`).length === 0) {
            return undefined;
          }
          const el = swiper.el;
          const swiperWidth = el.clientWidth;
          const swiperHeight = el.clientHeight;
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const swiperOffset = elementOffset(el);
          if (rtl) swiperOffset.left -= el.scrollLeft;
          const swiperCoord = [[swiperOffset.left, swiperOffset.top], [swiperOffset.left + swiperWidth, swiperOffset.top], [swiperOffset.left, swiperOffset.top + swiperHeight], [swiperOffset.left + swiperWidth, swiperOffset.top + swiperHeight]];
          for (let i = 0; i < swiperCoord.length; i += 1) {
            const point = swiperCoord[i];
            if (point[0] >= 0 && point[0] <= windowWidth && point[1] >= 0 && point[1] <= windowHeight) {
              if (point[0] === 0 && point[1] === 0) continue; // eslint-disable-line
              inView = true;
            }
          }
          if (!inView) return undefined;
        }
        const speed = swiper.params.keyboard.speed;
        if (swiper.isHorizontal()) {
          if (isPageUp || isPageDown || isArrowLeft || isArrowRight) {
            if (e.preventDefault) e.preventDefault();else e.returnValue = false;
          }
          if ((isPageDown || isArrowRight) && !rtl || (isPageUp || isArrowLeft) && rtl) swiper.slideNext(speed);
          if ((isPageUp || isArrowLeft) && !rtl || (isPageDown || isArrowRight) && rtl) swiper.slidePrev(speed);
        } else {
          if (isPageUp || isPageDown || isArrowUp || isArrowDown) {
            if (e.preventDefault) e.preventDefault();else e.returnValue = false;
          }
          if (isPageDown || isArrowDown) swiper.slideNext(speed);
          if (isPageUp || isArrowUp) swiper.slidePrev(speed);
        }
        emit('keyPress', kc);
        return undefined;
      }
      function enable() {
        if (swiper.keyboard.enabled) return;
        document.addEventListener('keydown', handle);
        swiper.keyboard.enabled = true;
      }
      function disable() {
        if (!swiper.keyboard.enabled) return;
        document.removeEventListener('keydown', handle);
        swiper.keyboard.enabled = false;
      }
      on('init', () => {
        if (swiper.params.keyboard.enabled) {
          enable();
        }
      });
      on('destroy', () => {
        if (swiper.keyboard.enabled) {
          disable();
        }
      });
      Object.assign(swiper.keyboard, {
        enable,
        disable
      });
    }

    /* eslint-disable consistent-return */
    function Mousewheel({
      swiper,
      extendParams,
      on,
      emit
    }) {
      const window = getWindow();
      extendParams({
        mousewheel: {
          enabled: false,
          releaseOnEdges: false,
          invert: false,
          forceToAxis: false,
          sensitivity: 1,
          eventsTarget: 'container',
          thresholdDelta: null,
          thresholdTime: null,
          noMousewheelClass: 'swiper-no-mousewheel'
        }
      });
      swiper.mousewheel = {
        enabled: false
      };
      let timeout;
      let lastScrollTime = now();
      let lastEventBeforeSnap;
      const recentWheelEvents = [];
      function normalize(e) {
        // Reasonable defaults
        const PIXEL_STEP = 10;
        const LINE_HEIGHT = 40;
        const PAGE_HEIGHT = 800;
        let sX = 0;
        let sY = 0; // spinX, spinY
        let pX = 0;
        let pY = 0; // pixelX, pixelY

        // Legacy
        if ('detail' in e) {
          sY = e.detail;
        }
        if ('wheelDelta' in e) {
          sY = -e.wheelDelta / 120;
        }
        if ('wheelDeltaY' in e) {
          sY = -e.wheelDeltaY / 120;
        }
        if ('wheelDeltaX' in e) {
          sX = -e.wheelDeltaX / 120;
        }

        // side scrolling on FF with DOMMouseScroll
        if ('axis' in e && e.axis === e.HORIZONTAL_AXIS) {
          sX = sY;
          sY = 0;
        }
        pX = sX * PIXEL_STEP;
        pY = sY * PIXEL_STEP;
        if ('deltaY' in e) {
          pY = e.deltaY;
        }
        if ('deltaX' in e) {
          pX = e.deltaX;
        }
        if (e.shiftKey && !pX) {
          // if user scrolls with shift he wants horizontal scroll
          pX = pY;
          pY = 0;
        }
        if ((pX || pY) && e.deltaMode) {
          if (e.deltaMode === 1) {
            // delta in LINE units
            pX *= LINE_HEIGHT;
            pY *= LINE_HEIGHT;
          } else {
            // delta in PAGE units
            pX *= PAGE_HEIGHT;
            pY *= PAGE_HEIGHT;
          }
        }

        // Fall-back if spin cannot be determined
        if (pX && !sX) {
          sX = pX < 1 ? -1 : 1;
        }
        if (pY && !sY) {
          sY = pY < 1 ? -1 : 1;
        }
        return {
          spinX: sX,
          spinY: sY,
          pixelX: pX,
          pixelY: pY
        };
      }
      function handleMouseEnter() {
        if (!swiper.enabled) return;
        swiper.mouseEntered = true;
      }
      function handleMouseLeave() {
        if (!swiper.enabled) return;
        swiper.mouseEntered = false;
      }
      function animateSlider(newEvent) {
        if (swiper.params.mousewheel.thresholdDelta && newEvent.delta < swiper.params.mousewheel.thresholdDelta) {
          // Prevent if delta of wheel scroll delta is below configured threshold
          return false;
        }
        if (swiper.params.mousewheel.thresholdTime && now() - lastScrollTime < swiper.params.mousewheel.thresholdTime) {
          // Prevent if time between scrolls is below configured threshold
          return false;
        }

        // If the movement is NOT big enough and
        // if the last time the user scrolled was too close to the current one (avoid continuously triggering the slider):
        //   Don't go any further (avoid insignificant scroll movement).
        if (newEvent.delta >= 6 && now() - lastScrollTime < 60) {
          // Return false as a default
          return true;
        }
        // If user is scrolling towards the end:
        //   If the slider hasn't hit the latest slide or
        //   if the slider is a loop and
        //   if the slider isn't moving right now:
        //     Go to next slide and
        //     emit a scroll event.
        // Else (the user is scrolling towards the beginning) and
        // if the slider hasn't hit the first slide or
        // if the slider is a loop and
        // if the slider isn't moving right now:
        //   Go to prev slide and
        //   emit a scroll event.
        if (newEvent.direction < 0) {
          if ((!swiper.isEnd || swiper.params.loop) && !swiper.animating) {
            swiper.slideNext();
            emit('scroll', newEvent.raw);
          }
        } else if ((!swiper.isBeginning || swiper.params.loop) && !swiper.animating) {
          swiper.slidePrev();
          emit('scroll', newEvent.raw);
        }
        // If you got here is because an animation has been triggered so store the current time
        lastScrollTime = new window.Date().getTime();
        // Return false as a default
        return false;
      }
      function releaseScroll(newEvent) {
        const params = swiper.params.mousewheel;
        if (newEvent.direction < 0) {
          if (swiper.isEnd && !swiper.params.loop && params.releaseOnEdges) {
            // Return true to animate scroll on edges
            return true;
          }
        } else if (swiper.isBeginning && !swiper.params.loop && params.releaseOnEdges) {
          // Return true to animate scroll on edges
          return true;
        }
        return false;
      }
      function handle(event) {
        let e = event;
        let disableParentSwiper = true;
        if (!swiper.enabled) return;

        // Ignore event if the target or its parents have the swiper-no-mousewheel class
        if (event.target.closest(`.${swiper.params.mousewheel.noMousewheelClass}`)) return;
        const params = swiper.params.mousewheel;
        if (swiper.params.cssMode) {
          e.preventDefault();
        }
        let targetEl = swiper.el;
        if (swiper.params.mousewheel.eventsTarget !== 'container') {
          targetEl = document.querySelector(swiper.params.mousewheel.eventsTarget);
        }
        const targetElContainsTarget = targetEl && targetEl.contains(e.target);
        if (!swiper.mouseEntered && !targetElContainsTarget && !params.releaseOnEdges) return true;
        if (e.originalEvent) e = e.originalEvent; // jquery fix
        let delta = 0;
        const rtlFactor = swiper.rtlTranslate ? -1 : 1;
        const data = normalize(e);
        if (params.forceToAxis) {
          if (swiper.isHorizontal()) {
            if (Math.abs(data.pixelX) > Math.abs(data.pixelY)) delta = -data.pixelX * rtlFactor;else return true;
          } else if (Math.abs(data.pixelY) > Math.abs(data.pixelX)) delta = -data.pixelY;else return true;
        } else {
          delta = Math.abs(data.pixelX) > Math.abs(data.pixelY) ? -data.pixelX * rtlFactor : -data.pixelY;
        }
        if (delta === 0) return true;
        if (params.invert) delta = -delta;

        // Get the scroll positions
        let positions = swiper.getTranslate() + delta * params.sensitivity;
        if (positions >= swiper.minTranslate()) positions = swiper.minTranslate();
        if (positions <= swiper.maxTranslate()) positions = swiper.maxTranslate();

        // When loop is true:
        //     the disableParentSwiper will be true.
        // When loop is false:
        //     if the scroll positions is not on edge,
        //     then the disableParentSwiper will be true.
        //     if the scroll on edge positions,
        //     then the disableParentSwiper will be false.
        disableParentSwiper = swiper.params.loop ? true : !(positions === swiper.minTranslate() || positions === swiper.maxTranslate());
        if (disableParentSwiper && swiper.params.nested) e.stopPropagation();
        if (!swiper.params.freeMode || !swiper.params.freeMode.enabled) {
          // Register the new event in a variable which stores the relevant data
          const newEvent = {
            time: now(),
            delta: Math.abs(delta),
            direction: Math.sign(delta),
            raw: event
          };

          // Keep the most recent events
          if (recentWheelEvents.length >= 2) {
            recentWheelEvents.shift(); // only store the last N events
          }

          const prevEvent = recentWheelEvents.length ? recentWheelEvents[recentWheelEvents.length - 1] : undefined;
          recentWheelEvents.push(newEvent);

          // If there is at least one previous recorded event:
          //   If direction has changed or
          //   if the scroll is quicker than the previous one:
          //     Animate the slider.
          // Else (this is the first time the wheel is moved):
          //     Animate the slider.
          if (prevEvent) {
            if (newEvent.direction !== prevEvent.direction || newEvent.delta > prevEvent.delta || newEvent.time > prevEvent.time + 150) {
              animateSlider(newEvent);
            }
          } else {
            animateSlider(newEvent);
          }

          // If it's time to release the scroll:
          //   Return now so you don't hit the preventDefault.
          if (releaseScroll(newEvent)) {
            return true;
          }
        } else {
          // Freemode or scrollContainer:

          // If we recently snapped after a momentum scroll, then ignore wheel events
          // to give time for the deceleration to finish. Stop ignoring after 500 msecs
          // or if it's a new scroll (larger delta or inverse sign as last event before
          // an end-of-momentum snap).
          const newEvent = {
            time: now(),
            delta: Math.abs(delta),
            direction: Math.sign(delta)
          };
          const ignoreWheelEvents = lastEventBeforeSnap && newEvent.time < lastEventBeforeSnap.time + 500 && newEvent.delta <= lastEventBeforeSnap.delta && newEvent.direction === lastEventBeforeSnap.direction;
          if (!ignoreWheelEvents) {
            lastEventBeforeSnap = undefined;
            let position = swiper.getTranslate() + delta * params.sensitivity;
            const wasBeginning = swiper.isBeginning;
            const wasEnd = swiper.isEnd;
            if (position >= swiper.minTranslate()) position = swiper.minTranslate();
            if (position <= swiper.maxTranslate()) position = swiper.maxTranslate();
            swiper.setTransition(0);
            swiper.setTranslate(position);
            swiper.updateProgress();
            swiper.updateActiveIndex();
            swiper.updateSlidesClasses();
            if (!wasBeginning && swiper.isBeginning || !wasEnd && swiper.isEnd) {
              swiper.updateSlidesClasses();
            }
            if (swiper.params.loop) {
              swiper.loopFix({
                direction: newEvent.direction < 0 ? 'next' : 'prev',
                byMousewheel: true
              });
            }
            if (swiper.params.freeMode.sticky) {
              // When wheel scrolling starts with sticky (aka snap) enabled, then detect
              // the end of a momentum scroll by storing recent (N=15?) wheel events.
              // 1. do all N events have decreasing or same (absolute value) delta?
              // 2. did all N events arrive in the last M (M=500?) msecs?
              // 3. does the earliest event have an (absolute value) delta that's
              //    at least P (P=1?) larger than the most recent event's delta?
              // 4. does the latest event have a delta that's smaller than Q (Q=6?) pixels?
              // If 1-4 are "yes" then we're near the end of a momentum scroll deceleration.
              // Snap immediately and ignore remaining wheel events in this scroll.
              // See comment above for "remaining wheel events in this scroll" determination.
              // If 1-4 aren't satisfied, then wait to snap until 500ms after the last event.
              clearTimeout(timeout);
              timeout = undefined;
              if (recentWheelEvents.length >= 15) {
                recentWheelEvents.shift(); // only store the last N events
              }

              const prevEvent = recentWheelEvents.length ? recentWheelEvents[recentWheelEvents.length - 1] : undefined;
              const firstEvent = recentWheelEvents[0];
              recentWheelEvents.push(newEvent);
              if (prevEvent && (newEvent.delta > prevEvent.delta || newEvent.direction !== prevEvent.direction)) {
                // Increasing or reverse-sign delta means the user started scrolling again. Clear the wheel event log.
                recentWheelEvents.splice(0);
              } else if (recentWheelEvents.length >= 15 && newEvent.time - firstEvent.time < 500 && firstEvent.delta - newEvent.delta >= 1 && newEvent.delta <= 6) {
                // We're at the end of the deceleration of a momentum scroll, so there's no need
                // to wait for more events. Snap ASAP on the next tick.
                // Also, because there's some remaining momentum we'll bias the snap in the
                // direction of the ongoing scroll because it's better UX for the scroll to snap
                // in the same direction as the scroll instead of reversing to snap.  Therefore,
                // if it's already scrolled more than 20% in the current direction, keep going.
                const snapToThreshold = delta > 0 ? 0.8 : 0.2;
                lastEventBeforeSnap = newEvent;
                recentWheelEvents.splice(0);
                timeout = nextTick(() => {
                  if (swiper.destroyed || !swiper.params) return;
                  swiper.slideToClosest(swiper.params.speed, true, undefined, snapToThreshold);
                }, 0); // no delay; move on next tick
              }

              if (!timeout) {
                // if we get here, then we haven't detected the end of a momentum scroll, so
                // we'll consider a scroll "complete" when there haven't been any wheel events
                // for 500ms.
                timeout = nextTick(() => {
                  if (swiper.destroyed || !swiper.params) return;
                  const snapToThreshold = 0.5;
                  lastEventBeforeSnap = newEvent;
                  recentWheelEvents.splice(0);
                  swiper.slideToClosest(swiper.params.speed, true, undefined, snapToThreshold);
                }, 500);
              }
            }

            // Emit event
            if (!ignoreWheelEvents) emit('scroll', e);

            // Stop autoplay
            if (swiper.params.autoplay && swiper.params.autoplay.disableOnInteraction) swiper.autoplay.stop();
            // Return page scroll on edge positions
            if (params.releaseOnEdges && (position === swiper.minTranslate() || position === swiper.maxTranslate())) {
              return true;
            }
          }
        }
        if (e.preventDefault) e.preventDefault();else e.returnValue = false;
        return false;
      }
      function events(method) {
        let targetEl = swiper.el;
        if (swiper.params.mousewheel.eventsTarget !== 'container') {
          targetEl = document.querySelector(swiper.params.mousewheel.eventsTarget);
        }
        targetEl[method]('mouseenter', handleMouseEnter);
        targetEl[method]('mouseleave', handleMouseLeave);
        targetEl[method]('wheel', handle);
      }
      function enable() {
        if (swiper.params.cssMode) {
          swiper.wrapperEl.removeEventListener('wheel', handle);
          return true;
        }
        if (swiper.mousewheel.enabled) return false;
        events('addEventListener');
        swiper.mousewheel.enabled = true;
        return true;
      }
      function disable() {
        if (swiper.params.cssMode) {
          swiper.wrapperEl.addEventListener(event, handle);
          return true;
        }
        if (!swiper.mousewheel.enabled) return false;
        events('removeEventListener');
        swiper.mousewheel.enabled = false;
        return true;
      }
      on('init', () => {
        if (!swiper.params.mousewheel.enabled && swiper.params.cssMode) {
          disable();
        }
        if (swiper.params.mousewheel.enabled) enable();
      });
      on('destroy', () => {
        if (swiper.params.cssMode) {
          enable();
        }
        if (swiper.mousewheel.enabled) disable();
      });
      Object.assign(swiper.mousewheel, {
        enable,
        disable
      });
    }

    function createElementIfNotDefined(swiper, originalParams, params, checkProps) {
      if (swiper.params.createElements) {
        Object.keys(checkProps).forEach(key => {
          if (!params[key] && params.auto === true) {
            let element = elementChildren(swiper.el, `.${checkProps[key]}`)[0];
            if (!element) {
              element = createElement('div', checkProps[key]);
              element.className = checkProps[key];
              swiper.el.append(element);
            }
            params[key] = element;
            originalParams[key] = element;
          }
        });
      }
      return params;
    }

    const arrowSvg = `<svg class="swiper-navigation-icon" width="11" height="20" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z" fill="currentColor"/></svg>`;
    function Navigation({
      swiper,
      extendParams,
      on,
      emit
    }) {
      extendParams({
        navigation: {
          nextEl: null,
          prevEl: null,
          addIcons: true,
          hideOnClick: false,
          disabledClass: 'swiper-button-disabled',
          hiddenClass: 'swiper-button-hidden',
          lockClass: 'swiper-button-lock',
          navigationDisabledClass: 'swiper-navigation-disabled'
        }
      });
      swiper.navigation = {
        nextEl: null,
        prevEl: null,
        arrowSvg
      };
      function getEl(el) {
        let res;
        if (el && typeof el === 'string' && swiper.isElement) {
          res = swiper.el.querySelector(el) || swiper.hostEl.querySelector(el);
          if (res) return res;
        }
        if (el) {
          if (typeof el === 'string') res = [...document.querySelectorAll(el)];
          if (swiper.params.uniqueNavElements && typeof el === 'string' && res && res.length > 1 && swiper.el.querySelectorAll(el).length === 1) {
            res = swiper.el.querySelector(el);
          } else if (res && res.length === 1) {
            res = res[0];
          }
        }
        if (el && !res) return el;
        // if (Array.isArray(res) && res.length === 1) res = res[0];
        return res;
      }
      function toggleEl(el, disabled) {
        const params = swiper.params.navigation;
        el = makeElementsArray(el);
        el.forEach(subEl => {
          if (subEl) {
            subEl.classList[disabled ? 'add' : 'remove'](...params.disabledClass.split(' '));
            if (subEl.tagName === 'BUTTON') subEl.disabled = disabled;
            if (swiper.params.watchOverflow && swiper.enabled) {
              subEl.classList[swiper.isLocked ? 'add' : 'remove'](params.lockClass);
            }
          }
        });
      }
      function update() {
        // Update Navigation Buttons
        const {
          nextEl,
          prevEl
        } = swiper.navigation;
        if (swiper.params.loop) {
          toggleEl(prevEl, false);
          toggleEl(nextEl, false);
          return;
        }
        toggleEl(prevEl, swiper.isBeginning && !swiper.params.rewind);
        toggleEl(nextEl, swiper.isEnd && !swiper.params.rewind);
      }
      function onPrevClick(e) {
        e.preventDefault();
        if (swiper.isBeginning && !swiper.params.loop && !swiper.params.rewind) return;
        swiper.slidePrev();
        emit('navigationPrev');
      }
      function onNextClick(e) {
        e.preventDefault();
        if (swiper.isEnd && !swiper.params.loop && !swiper.params.rewind) return;
        swiper.slideNext();
        emit('navigationNext');
      }
      function init() {
        const params = swiper.params.navigation;
        swiper.params.navigation = createElementIfNotDefined(swiper, swiper.originalParams.navigation, swiper.params.navigation, {
          nextEl: 'swiper-button-next',
          prevEl: 'swiper-button-prev'
        });
        if (!(params.nextEl || params.prevEl)) return;
        let nextEl = getEl(params.nextEl);
        let prevEl = getEl(params.prevEl);
        Object.assign(swiper.navigation, {
          nextEl,
          prevEl
        });
        nextEl = makeElementsArray(nextEl);
        prevEl = makeElementsArray(prevEl);
        const initButton = (el, dir) => {
          if (el) {
            if (params.addIcons && el.matches('.swiper-button-next,.swiper-button-prev') && !el.querySelector('svg')) {
              const tempEl = document.createElement('div');
              setInnerHTML(tempEl, arrowSvg);
              el.appendChild(tempEl.querySelector('svg'));
              tempEl.remove();
            }
            el.addEventListener('click', dir === 'next' ? onNextClick : onPrevClick);
          }
          if (!swiper.enabled && el) {
            el.classList.add(...params.lockClass.split(' '));
          }
        };
        nextEl.forEach(el => initButton(el, 'next'));
        prevEl.forEach(el => initButton(el, 'prev'));
      }
      function destroy() {
        let {
          nextEl,
          prevEl
        } = swiper.navigation;
        nextEl = makeElementsArray(nextEl);
        prevEl = makeElementsArray(prevEl);
        const destroyButton = (el, dir) => {
          el.removeEventListener('click', dir === 'next' ? onNextClick : onPrevClick);
          el.classList.remove(...swiper.params.navigation.disabledClass.split(' '));
        };
        nextEl.forEach(el => destroyButton(el, 'next'));
        prevEl.forEach(el => destroyButton(el, 'prev'));
      }
      on('init', () => {
        if (swiper.params.navigation.enabled === false) {
          // eslint-disable-next-line
          disable();
        } else {
          init();
          update();
        }
      });
      on('toEdge fromEdge lock unlock', () => {
        update();
      });
      on('destroy', () => {
        destroy();
      });
      on('enable disable', () => {
        let {
          nextEl,
          prevEl
        } = swiper.navigation;
        nextEl = makeElementsArray(nextEl);
        prevEl = makeElementsArray(prevEl);
        if (swiper.enabled) {
          update();
          return;
        }
        [...nextEl, ...prevEl].filter(el => !!el).forEach(el => el.classList.add(swiper.params.navigation.lockClass));
      });
      on('click', (_s, e) => {
        let {
          nextEl,
          prevEl
        } = swiper.navigation;
        nextEl = makeElementsArray(nextEl);
        prevEl = makeElementsArray(prevEl);
        const targetEl = e.target;
        let targetIsButton = prevEl.includes(targetEl) || nextEl.includes(targetEl);
        if (swiper.isElement && !targetIsButton) {
          const path = e.path || e.composedPath && e.composedPath();
          if (path) {
            targetIsButton = path.find(pathEl => nextEl.includes(pathEl) || prevEl.includes(pathEl));
          }
        }
        if (swiper.params.navigation.hideOnClick && !targetIsButton) {
          if (swiper.pagination && swiper.params.pagination && swiper.params.pagination.clickable && (swiper.pagination.el === targetEl || swiper.pagination.el.contains(targetEl))) return;
          let isHidden;
          if (nextEl.length) {
            isHidden = nextEl[0].classList.contains(swiper.params.navigation.hiddenClass);
          } else if (prevEl.length) {
            isHidden = prevEl[0].classList.contains(swiper.params.navigation.hiddenClass);
          }
          if (isHidden === true) {
            emit('navigationShow');
          } else {
            emit('navigationHide');
          }
          [...nextEl, ...prevEl].filter(el => !!el).forEach(el => el.classList.toggle(swiper.params.navigation.hiddenClass));
        }
      });
      const enable = () => {
        swiper.el.classList.remove(...swiper.params.navigation.navigationDisabledClass.split(' '));
        init();
        update();
      };
      const disable = () => {
        swiper.el.classList.add(...swiper.params.navigation.navigationDisabledClass.split(' '));
        destroy();
      };
      Object.assign(swiper.navigation, {
        enable,
        disable,
        update,
        init,
        destroy
      });
    }

    function classesToSelector(classes = '') {
      // Escape all CSS selector special characters
      return `.${classes.trim().replace(/([\.:!+\/()[\]#>~*^$|=,'"@{}\\])/g, '\\$1') // eslint-disable-line
  .replace(/ /g, '.')}`;
    }

    function Pagination({
      swiper,
      extendParams,
      on,
      emit
    }) {
      const pfx = 'swiper-pagination';
      extendParams({
        pagination: {
          el: null,
          bulletElement: 'span',
          clickable: false,
          hideOnClick: false,
          renderBullet: null,
          renderProgressbar: null,
          renderFraction: null,
          renderCustom: null,
          progressbarOpposite: false,
          type: 'bullets',
          // 'bullets' or 'progressbar' or 'fraction' or 'custom'
          dynamicBullets: false,
          dynamicMainBullets: 1,
          formatFractionCurrent: number => number,
          formatFractionTotal: number => number,
          bulletClass: `${pfx}-bullet`,
          bulletActiveClass: `${pfx}-bullet-active`,
          modifierClass: `${pfx}-`,
          currentClass: `${pfx}-current`,
          totalClass: `${pfx}-total`,
          hiddenClass: `${pfx}-hidden`,
          progressbarFillClass: `${pfx}-progressbar-fill`,
          progressbarOppositeClass: `${pfx}-progressbar-opposite`,
          clickableClass: `${pfx}-clickable`,
          lockClass: `${pfx}-lock`,
          horizontalClass: `${pfx}-horizontal`,
          verticalClass: `${pfx}-vertical`,
          paginationDisabledClass: `${pfx}-disabled`
        }
      });
      swiper.pagination = {
        el: null,
        bullets: []
      };
      let bulletSize;
      let dynamicBulletIndex = 0;
      function isPaginationDisabled() {
        return !swiper.params.pagination.el || !swiper.pagination.el || Array.isArray(swiper.pagination.el) && swiper.pagination.el.length === 0;
      }
      function setSideBullets(bulletEl, position) {
        const {
          bulletActiveClass
        } = swiper.params.pagination;
        if (!bulletEl) return;
        bulletEl = bulletEl[`${position === 'prev' ? 'previous' : 'next'}ElementSibling`];
        if (bulletEl) {
          bulletEl.classList.add(`${bulletActiveClass}-${position}`);
          bulletEl = bulletEl[`${position === 'prev' ? 'previous' : 'next'}ElementSibling`];
          if (bulletEl) {
            bulletEl.classList.add(`${bulletActiveClass}-${position}-${position}`);
          }
        }
      }
      function getMoveDirection(prevIndex, nextIndex, length) {
        prevIndex = prevIndex % length;
        nextIndex = nextIndex % length;
        if (nextIndex === prevIndex + 1) {
          return 'next';
        } else if (nextIndex === prevIndex - 1) {
          return 'previous';
        }
        return;
      }
      function onBulletClick(e) {
        const bulletEl = e.target.closest(classesToSelector(swiper.params.pagination.bulletClass));
        if (!bulletEl) {
          return;
        }
        e.preventDefault();
        const index = elementIndex(bulletEl) * swiper.params.slidesPerGroup;
        if (swiper.params.loop) {
          if (swiper.realIndex === index) return;
          const moveDirection = getMoveDirection(swiper.realIndex, index, swiper.slides.length);
          if (moveDirection === 'next') {
            swiper.slideNext();
          } else if (moveDirection === 'previous') {
            swiper.slidePrev();
          } else {
            swiper.slideToLoop(index);
          }
        } else {
          swiper.slideTo(index);
        }
      }
      function update() {
        // Render || Update Pagination bullets/items
        const rtl = swiper.rtl;
        const params = swiper.params.pagination;
        if (isPaginationDisabled()) return;
        let el = swiper.pagination.el;
        el = makeElementsArray(el);
        // Current/Total
        let current;
        let previousIndex;
        const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
        const total = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
        if (swiper.params.loop) {
          previousIndex = swiper.previousRealIndex || 0;
          current = swiper.params.slidesPerGroup > 1 ? Math.floor(swiper.realIndex / swiper.params.slidesPerGroup) : swiper.realIndex;
        } else if (typeof swiper.snapIndex !== 'undefined') {
          current = swiper.snapIndex;
          previousIndex = swiper.previousSnapIndex;
        } else {
          previousIndex = swiper.previousIndex || 0;
          current = swiper.activeIndex || 0;
        }
        // Types
        if (params.type === 'bullets' && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
          const bullets = swiper.pagination.bullets;
          let firstIndex;
          let lastIndex;
          let midIndex;
          if (params.dynamicBullets) {
            bulletSize = elementOuterSize(bullets[0], swiper.isHorizontal() ? 'width' : 'height', true);
            el.forEach(subEl => {
              subEl.style[swiper.isHorizontal() ? 'width' : 'height'] = `${bulletSize * (params.dynamicMainBullets + 4)}px`;
            });
            if (params.dynamicMainBullets > 1 && previousIndex !== undefined) {
              dynamicBulletIndex += current - (previousIndex || 0);
              if (dynamicBulletIndex > params.dynamicMainBullets - 1) {
                dynamicBulletIndex = params.dynamicMainBullets - 1;
              } else if (dynamicBulletIndex < 0) {
                dynamicBulletIndex = 0;
              }
            }
            firstIndex = Math.max(current - dynamicBulletIndex, 0);
            lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
            midIndex = (lastIndex + firstIndex) / 2;
          }
          bullets.forEach(bulletEl => {
            const classesToRemove = [...['', '-next', '-next-next', '-prev', '-prev-prev', '-main'].map(suffix => `${params.bulletActiveClass}${suffix}`)].map(s => typeof s === 'string' && s.includes(' ') ? s.split(' ') : s).flat();
            bulletEl.classList.remove(...classesToRemove);
          });
          if (el.length > 1) {
            bullets.forEach(bullet => {
              const bulletIndex = elementIndex(bullet);
              if (bulletIndex === current) {
                bullet.classList.add(...params.bulletActiveClass.split(' '));
              } else if (swiper.isElement) {
                bullet.setAttribute('part', 'bullet');
              }
              if (params.dynamicBullets) {
                if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
                  bullet.classList.add(...`${params.bulletActiveClass}-main`.split(' '));
                }
                if (bulletIndex === firstIndex) {
                  setSideBullets(bullet, 'prev');
                }
                if (bulletIndex === lastIndex) {
                  setSideBullets(bullet, 'next');
                }
              }
            });
          } else {
            const bullet = bullets[current];
            if (bullet) {
              bullet.classList.add(...params.bulletActiveClass.split(' '));
            }
            if (swiper.isElement) {
              bullets.forEach((bulletEl, bulletIndex) => {
                bulletEl.setAttribute('part', bulletIndex === current ? 'bullet-active' : 'bullet');
              });
            }
            if (params.dynamicBullets) {
              const firstDisplayedBullet = bullets[firstIndex];
              const lastDisplayedBullet = bullets[lastIndex];
              for (let i = firstIndex; i <= lastIndex; i += 1) {
                if (bullets[i]) {
                  bullets[i].classList.add(...`${params.bulletActiveClass}-main`.split(' '));
                }
              }
              setSideBullets(firstDisplayedBullet, 'prev');
              setSideBullets(lastDisplayedBullet, 'next');
            }
          }
          if (params.dynamicBullets) {
            const dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
            const bulletsOffset = (bulletSize * dynamicBulletsLength - bulletSize) / 2 - midIndex * bulletSize;
            const offsetProp = rtl ? 'right' : 'left';
            bullets.forEach(bullet => {
              bullet.style[swiper.isHorizontal() ? offsetProp : 'top'] = `${bulletsOffset}px`;
            });
          }
        }
        el.forEach((subEl, subElIndex) => {
          if (params.type === 'fraction') {
            subEl.querySelectorAll(classesToSelector(params.currentClass)).forEach(fractionEl => {
              fractionEl.textContent = params.formatFractionCurrent(current + 1);
            });
            subEl.querySelectorAll(classesToSelector(params.totalClass)).forEach(totalEl => {
              totalEl.textContent = params.formatFractionTotal(total);
            });
          }
          if (params.type === 'progressbar') {
            let progressbarDirection;
            if (params.progressbarOpposite) {
              progressbarDirection = swiper.isHorizontal() ? 'vertical' : 'horizontal';
            } else {
              progressbarDirection = swiper.isHorizontal() ? 'horizontal' : 'vertical';
            }
            const scale = (current + 1) / total;
            let scaleX = 1;
            let scaleY = 1;
            if (progressbarDirection === 'horizontal') {
              scaleX = scale;
            } else {
              scaleY = scale;
            }
            subEl.querySelectorAll(classesToSelector(params.progressbarFillClass)).forEach(progressEl => {
              progressEl.style.transform = `translate3d(0,0,0) scaleX(${scaleX}) scaleY(${scaleY})`;
              progressEl.style.transitionDuration = `${swiper.params.speed}ms`;
            });
          }
          if (params.type === 'custom' && params.renderCustom) {
            setInnerHTML(subEl, params.renderCustom(swiper, current + 1, total));
            if (subElIndex === 0) emit('paginationRender', subEl);
          } else {
            if (subElIndex === 0) emit('paginationRender', subEl);
            emit('paginationUpdate', subEl);
          }
          if (swiper.params.watchOverflow && swiper.enabled) {
            subEl.classList[swiper.isLocked ? 'add' : 'remove'](params.lockClass);
          }
        });
      }
      function render() {
        // Render Container
        const params = swiper.params.pagination;
        if (isPaginationDisabled()) return;
        const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.grid && swiper.params.grid.rows > 1 ? swiper.slides.length / Math.ceil(swiper.params.grid.rows) : swiper.slides.length;
        let el = swiper.pagination.el;
        el = makeElementsArray(el);
        let paginationHTML = '';
        if (params.type === 'bullets') {
          let numberOfBullets = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
          if (swiper.params.freeMode && swiper.params.freeMode.enabled && numberOfBullets > slidesLength) {
            numberOfBullets = slidesLength;
          }
          for (let i = 0; i < numberOfBullets; i += 1) {
            if (params.renderBullet) {
              paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
            } else {
              // prettier-ignore
              paginationHTML += `<${params.bulletElement} ${swiper.isElement ? 'part="bullet"' : ''} class="${params.bulletClass}"></${params.bulletElement}>`;
            }
          }
        }
        if (params.type === 'fraction') {
          if (params.renderFraction) {
            paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
          } else {
            paginationHTML = `<span class="${params.currentClass}"></span>` + ' / ' + `<span class="${params.totalClass}"></span>`;
          }
        }
        if (params.type === 'progressbar') {
          if (params.renderProgressbar) {
            paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
          } else {
            paginationHTML = `<span class="${params.progressbarFillClass}"></span>`;
          }
        }
        swiper.pagination.bullets = [];
        el.forEach(subEl => {
          if (params.type !== 'custom') {
            setInnerHTML(subEl, paginationHTML || '');
          }
          if (params.type === 'bullets') {
            swiper.pagination.bullets.push(...subEl.querySelectorAll(classesToSelector(params.bulletClass)));
          }
        });
        if (params.type !== 'custom') {
          emit('paginationRender', el[0]);
        }
      }
      function init() {
        swiper.params.pagination = createElementIfNotDefined(swiper, swiper.originalParams.pagination, swiper.params.pagination, {
          el: 'swiper-pagination'
        });
        const params = swiper.params.pagination;
        if (!params.el) return;
        let el;
        if (typeof params.el === 'string' && swiper.isElement) {
          el = swiper.el.querySelector(params.el);
        }
        if (!el && typeof params.el === 'string') {
          el = [...document.querySelectorAll(params.el)];
        }
        if (!el) {
          el = params.el;
        }
        if (!el || el.length === 0) return;
        if (swiper.params.uniqueNavElements && typeof params.el === 'string' && Array.isArray(el) && el.length > 1) {
          el = [...swiper.el.querySelectorAll(params.el)];
          // check if it belongs to another nested Swiper
          if (el.length > 1) {
            el = el.find(subEl => {
              if (elementParents(subEl, '.swiper')[0] !== swiper.el) return false;
              return true;
            });
          }
        }
        if (Array.isArray(el) && el.length === 1) el = el[0];
        Object.assign(swiper.pagination, {
          el
        });
        el = makeElementsArray(el);
        el.forEach(subEl => {
          if (params.type === 'bullets' && params.clickable) {
            subEl.classList.add(...(params.clickableClass || '').split(' '));
          }
          subEl.classList.add(params.modifierClass + params.type);
          subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
          if (params.type === 'bullets' && params.dynamicBullets) {
            subEl.classList.add(`${params.modifierClass}${params.type}-dynamic`);
            dynamicBulletIndex = 0;
            if (params.dynamicMainBullets < 1) {
              params.dynamicMainBullets = 1;
            }
          }
          if (params.type === 'progressbar' && params.progressbarOpposite) {
            subEl.classList.add(params.progressbarOppositeClass);
          }
          if (params.clickable) {
            subEl.addEventListener('click', onBulletClick);
          }
          if (!swiper.enabled) {
            subEl.classList.add(params.lockClass);
          }
        });
      }
      function destroy() {
        const params = swiper.params.pagination;
        if (isPaginationDisabled()) return;
        let el = swiper.pagination.el;
        if (el) {
          el = makeElementsArray(el);
          el.forEach(subEl => {
            subEl.classList.remove(params.hiddenClass);
            subEl.classList.remove(params.modifierClass + params.type);
            subEl.classList.remove(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
            if (params.clickable) {
              subEl.classList.remove(...(params.clickableClass || '').split(' '));
              subEl.removeEventListener('click', onBulletClick);
            }
          });
        }
        if (swiper.pagination.bullets) swiper.pagination.bullets.forEach(subEl => subEl.classList.remove(...params.bulletActiveClass.split(' ')));
      }
      on('changeDirection', () => {
        if (!swiper.pagination || !swiper.pagination.el) return;
        const params = swiper.params.pagination;
        let {
          el
        } = swiper.pagination;
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.classList.remove(params.horizontalClass, params.verticalClass);
          subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
        });
      });
      on('init', () => {
        if (swiper.params.pagination.enabled === false) {
          // eslint-disable-next-line
          disable();
        } else {
          init();
          render();
          update();
        }
      });
      on('activeIndexChange', () => {
        if (typeof swiper.snapIndex === 'undefined') {
          update();
        }
      });
      on('snapIndexChange', () => {
        update();
      });
      on('snapGridLengthChange', () => {
        render();
        update();
      });
      on('destroy', () => {
        destroy();
      });
      on('enable disable', () => {
        let {
          el
        } = swiper.pagination;
        if (el) {
          el = makeElementsArray(el);
          el.forEach(subEl => subEl.classList[swiper.enabled ? 'remove' : 'add'](swiper.params.pagination.lockClass));
        }
      });
      on('lock unlock', () => {
        update();
      });
      on('click', (_s, e) => {
        const targetEl = e.target;
        const el = makeElementsArray(swiper.pagination.el);
        if (swiper.params.pagination.el && swiper.params.pagination.hideOnClick && el && el.length > 0 && !targetEl.classList.contains(swiper.params.pagination.bulletClass)) {
          if (swiper.navigation && (swiper.navigation.nextEl && targetEl === swiper.navigation.nextEl || swiper.navigation.prevEl && targetEl === swiper.navigation.prevEl)) return;
          const isHidden = el[0].classList.contains(swiper.params.pagination.hiddenClass);
          if (isHidden === true) {
            emit('paginationShow');
          } else {
            emit('paginationHide');
          }
          el.forEach(subEl => subEl.classList.toggle(swiper.params.pagination.hiddenClass));
        }
      });
      const enable = () => {
        swiper.el.classList.remove(swiper.params.pagination.paginationDisabledClass);
        let {
          el
        } = swiper.pagination;
        if (el) {
          el = makeElementsArray(el);
          el.forEach(subEl => subEl.classList.remove(swiper.params.pagination.paginationDisabledClass));
        }
        init();
        render();
        update();
      };
      const disable = () => {
        swiper.el.classList.add(swiper.params.pagination.paginationDisabledClass);
        let {
          el
        } = swiper.pagination;
        if (el) {
          el = makeElementsArray(el);
          el.forEach(subEl => subEl.classList.add(swiper.params.pagination.paginationDisabledClass));
        }
        destroy();
      };
      Object.assign(swiper.pagination, {
        enable,
        disable,
        render,
        update,
        init,
        destroy
      });
    }

    function Scrollbar({
      swiper,
      extendParams,
      on,
      emit
    }) {
      const document = getDocument();
      let isTouched = false;
      let timeout = null;
      let dragTimeout = null;
      let dragStartPos;
      let dragSize;
      let trackSize;
      let divider;
      extendParams({
        scrollbar: {
          el: null,
          dragSize: 'auto',
          hide: false,
          draggable: false,
          snapOnRelease: true,
          lockClass: 'swiper-scrollbar-lock',
          dragClass: 'swiper-scrollbar-drag',
          scrollbarDisabledClass: 'swiper-scrollbar-disabled',
          horizontalClass: `swiper-scrollbar-horizontal`,
          verticalClass: `swiper-scrollbar-vertical`
        }
      });
      swiper.scrollbar = {
        el: null,
        dragEl: null
      };
      function setTranslate() {
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
        const {
          scrollbar,
          rtlTranslate: rtl
        } = swiper;
        const {
          dragEl,
          el
        } = scrollbar;
        const params = swiper.params.scrollbar;
        const progress = swiper.params.loop ? swiper.progressLoop : swiper.progress;
        let newSize = dragSize;
        let newPos = (trackSize - dragSize) * progress;
        if (rtl) {
          newPos = -newPos;
          if (newPos > 0) {
            newSize = dragSize - newPos;
            newPos = 0;
          } else if (-newPos + dragSize > trackSize) {
            newSize = trackSize + newPos;
          }
        } else if (newPos < 0) {
          newSize = dragSize + newPos;
          newPos = 0;
        } else if (newPos + dragSize > trackSize) {
          newSize = trackSize - newPos;
        }
        if (swiper.isHorizontal()) {
          dragEl.style.transform = `translate3d(${newPos}px, 0, 0)`;
          dragEl.style.width = `${newSize}px`;
        } else {
          dragEl.style.transform = `translate3d(0px, ${newPos}px, 0)`;
          dragEl.style.height = `${newSize}px`;
        }
        if (params.hide) {
          clearTimeout(timeout);
          el.style.opacity = 1;
          timeout = setTimeout(() => {
            el.style.opacity = 0;
            el.style.transitionDuration = '400ms';
          }, 1000);
        }
      }
      function setTransition(duration) {
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
        swiper.scrollbar.dragEl.style.transitionDuration = `${duration}ms`;
      }
      function updateSize() {
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
        const {
          scrollbar
        } = swiper;
        const {
          dragEl,
          el
        } = scrollbar;
        dragEl.style.width = '';
        dragEl.style.height = '';
        trackSize = swiper.isHorizontal() ? el.offsetWidth : el.offsetHeight;
        divider = swiper.size / (swiper.virtualSize + swiper.params.slidesOffsetBefore - (swiper.params.centeredSlides ? swiper.snapGrid[0] : 0));
        if (swiper.params.scrollbar.dragSize === 'auto') {
          dragSize = trackSize * divider;
        } else {
          dragSize = parseInt(swiper.params.scrollbar.dragSize, 10);
        }
        if (swiper.isHorizontal()) {
          dragEl.style.width = `${dragSize}px`;
        } else {
          dragEl.style.height = `${dragSize}px`;
        }
        if (divider >= 1) {
          el.style.display = 'none';
        } else {
          el.style.display = '';
        }
        if (swiper.params.scrollbar.hide) {
          el.style.opacity = 0;
        }
        if (swiper.params.watchOverflow && swiper.enabled) {
          scrollbar.el.classList[swiper.isLocked ? 'add' : 'remove'](swiper.params.scrollbar.lockClass);
        }
      }
      function getPointerPosition(e) {
        return swiper.isHorizontal() ? e.clientX : e.clientY;
      }
      function setDragPosition(e) {
        const {
          scrollbar,
          rtlTranslate: rtl
        } = swiper;
        const {
          el
        } = scrollbar;
        let positionRatio;
        positionRatio = (getPointerPosition(e) - elementOffset(el)[swiper.isHorizontal() ? 'left' : 'top'] - (dragStartPos !== null ? dragStartPos : dragSize / 2)) / (trackSize - dragSize);
        positionRatio = Math.max(Math.min(positionRatio, 1), 0);
        if (rtl) {
          positionRatio = 1 - positionRatio;
        }
        const position = swiper.minTranslate() + (swiper.maxTranslate() - swiper.minTranslate()) * positionRatio;
        swiper.updateProgress(position);
        swiper.setTranslate(position);
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      }
      function onDragStart(e) {
        const params = swiper.params.scrollbar;
        const {
          scrollbar,
          wrapperEl
        } = swiper;
        const {
          el,
          dragEl
        } = scrollbar;
        isTouched = true;
        dragStartPos = e.target === dragEl ? getPointerPosition(e) - e.target.getBoundingClientRect()[swiper.isHorizontal() ? 'left' : 'top'] : null;
        e.preventDefault();
        e.stopPropagation();
        wrapperEl.style.transitionDuration = '100ms';
        dragEl.style.transitionDuration = '100ms';
        setDragPosition(e);
        clearTimeout(dragTimeout);
        el.style.transitionDuration = '0ms';
        if (params.hide) {
          el.style.opacity = 1;
        }
        if (swiper.params.cssMode) {
          swiper.wrapperEl.style['scroll-snap-type'] = 'none';
        }
        emit('scrollbarDragStart', e);
      }
      function onDragMove(e) {
        const {
          scrollbar,
          wrapperEl
        } = swiper;
        const {
          el,
          dragEl
        } = scrollbar;
        if (!isTouched) return;
        if (e.preventDefault && e.cancelable) e.preventDefault();else e.returnValue = false;
        setDragPosition(e);
        wrapperEl.style.transitionDuration = '0ms';
        el.style.transitionDuration = '0ms';
        dragEl.style.transitionDuration = '0ms';
        emit('scrollbarDragMove', e);
      }
      function onDragEnd(e) {
        const params = swiper.params.scrollbar;
        const {
          scrollbar,
          wrapperEl
        } = swiper;
        const {
          el
        } = scrollbar;
        if (!isTouched) return;
        isTouched = false;
        if (swiper.params.cssMode) {
          swiper.wrapperEl.style['scroll-snap-type'] = '';
          wrapperEl.style.transitionDuration = '';
        }
        if (params.hide) {
          clearTimeout(dragTimeout);
          dragTimeout = nextTick(() => {
            el.style.opacity = 0;
            el.style.transitionDuration = '400ms';
          }, 1000);
        }
        emit('scrollbarDragEnd', e);
        if (params.snapOnRelease) {
          swiper.slideToClosest();
        }
      }
      function events(method) {
        const {
          scrollbar,
          params
        } = swiper;
        const el = scrollbar.el;
        if (!el) return;
        const target = el;
        const activeListener = params.passiveListeners ? {
          passive: false,
          capture: false
        } : false;
        const passiveListener = params.passiveListeners ? {
          passive: true,
          capture: false
        } : false;
        if (!target) return;
        const eventMethod = method === 'on' ? 'addEventListener' : 'removeEventListener';
        target[eventMethod]('pointerdown', onDragStart, activeListener);
        document[eventMethod]('pointermove', onDragMove, activeListener);
        document[eventMethod]('pointerup', onDragEnd, passiveListener);
      }
      function enableDraggable() {
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
        events('on');
      }
      function disableDraggable() {
        if (!swiper.params.scrollbar.el || !swiper.scrollbar.el) return;
        events('off');
      }
      function init() {
        const {
          scrollbar,
          el: swiperEl
        } = swiper;
        swiper.params.scrollbar = createElementIfNotDefined(swiper, swiper.originalParams.scrollbar, swiper.params.scrollbar, {
          el: 'swiper-scrollbar'
        });
        const params = swiper.params.scrollbar;
        if (!params.el) return;
        let el;
        if (typeof params.el === 'string' && swiper.isElement) {
          el = swiper.el.querySelector(params.el);
        }
        if (!el && typeof params.el === 'string') {
          el = document.querySelectorAll(params.el);
          if (!el.length) return;
        } else if (!el) {
          el = params.el;
        }
        if (swiper.params.uniqueNavElements && typeof params.el === 'string' && el.length > 1 && swiperEl.querySelectorAll(params.el).length === 1) {
          el = swiperEl.querySelector(params.el);
        }
        if (el.length > 0) el = el[0];
        el.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
        let dragEl;
        if (el) {
          dragEl = el.querySelector(classesToSelector(swiper.params.scrollbar.dragClass));
          if (!dragEl) {
            dragEl = createElement('div', swiper.params.scrollbar.dragClass);
            el.append(dragEl);
          }
        }
        Object.assign(scrollbar, {
          el,
          dragEl
        });
        if (params.draggable) {
          enableDraggable();
        }
        if (el) {
          el.classList[swiper.enabled ? 'remove' : 'add'](...classesToTokens(swiper.params.scrollbar.lockClass));
        }
      }
      function destroy() {
        const params = swiper.params.scrollbar;
        const el = swiper.scrollbar.el;
        if (el) {
          el.classList.remove(...classesToTokens(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass));
        }
        disableDraggable();
      }
      on('changeDirection', () => {
        if (!swiper.scrollbar || !swiper.scrollbar.el) return;
        const params = swiper.params.scrollbar;
        let {
          el
        } = swiper.scrollbar;
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.classList.remove(params.horizontalClass, params.verticalClass);
          subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
        });
      });
      on('init', () => {
        if (swiper.params.scrollbar.enabled === false) {
          // eslint-disable-next-line
          disable();
        } else {
          init();
          updateSize();
          setTranslate();
        }
      });
      on('update resize observerUpdate lock unlock changeDirection', () => {
        updateSize();
      });
      on('setTranslate', () => {
        setTranslate();
      });
      on('setTransition', (_s, duration) => {
        setTransition(duration);
      });
      on('enable disable', () => {
        const {
          el
        } = swiper.scrollbar;
        if (el) {
          el.classList[swiper.enabled ? 'remove' : 'add'](...classesToTokens(swiper.params.scrollbar.lockClass));
        }
      });
      on('destroy', () => {
        destroy();
      });
      const enable = () => {
        swiper.el.classList.remove(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
        if (swiper.scrollbar.el) {
          swiper.scrollbar.el.classList.remove(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
        }
        init();
        updateSize();
        setTranslate();
      };
      const disable = () => {
        swiper.el.classList.add(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
        if (swiper.scrollbar.el) {
          swiper.scrollbar.el.classList.add(...classesToTokens(swiper.params.scrollbar.scrollbarDisabledClass));
        }
        destroy();
      };
      Object.assign(swiper.scrollbar, {
        enable,
        disable,
        updateSize,
        setTranslate,
        init,
        destroy
      });
    }

    function Parallax({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        parallax: {
          enabled: false
        }
      });
      const elementsSelector = '[data-swiper-parallax], [data-swiper-parallax-x], [data-swiper-parallax-y], [data-swiper-parallax-opacity], [data-swiper-parallax-scale]';
      const setTransform = (el, progress) => {
        const {
          rtl
        } = swiper;
        const rtlFactor = rtl ? -1 : 1;
        const p = el.getAttribute('data-swiper-parallax') || '0';
        let x = el.getAttribute('data-swiper-parallax-x');
        let y = el.getAttribute('data-swiper-parallax-y');
        const scale = el.getAttribute('data-swiper-parallax-scale');
        const opacity = el.getAttribute('data-swiper-parallax-opacity');
        const rotate = el.getAttribute('data-swiper-parallax-rotate');
        if (x || y) {
          x = x || '0';
          y = y || '0';
        } else if (swiper.isHorizontal()) {
          x = p;
          y = '0';
        } else {
          y = p;
          x = '0';
        }
        if (x.indexOf('%') >= 0) {
          x = `${parseInt(x, 10) * progress * rtlFactor}%`;
        } else {
          x = `${x * progress * rtlFactor}px`;
        }
        if (y.indexOf('%') >= 0) {
          y = `${parseInt(y, 10) * progress}%`;
        } else {
          y = `${y * progress}px`;
        }
        if (typeof opacity !== 'undefined' && opacity !== null) {
          const currentOpacity = opacity - (opacity - 1) * (1 - Math.abs(progress));
          el.style.opacity = currentOpacity;
        }
        let transform = `translate3d(${x}, ${y}, 0px)`;
        if (typeof scale !== 'undefined' && scale !== null) {
          const currentScale = scale - (scale - 1) * (1 - Math.abs(progress));
          transform += ` scale(${currentScale})`;
        }
        if (rotate && typeof rotate !== 'undefined' && rotate !== null) {
          const currentRotate = rotate * progress * -1;
          transform += ` rotate(${currentRotate}deg)`;
        }
        el.style.transform = transform;
      };
      const setTranslate = () => {
        const {
          el,
          slides,
          progress,
          snapGrid,
          isElement
        } = swiper;
        const elements = elementChildren(el, elementsSelector);
        if (swiper.isElement) {
          elements.push(...elementChildren(swiper.hostEl, elementsSelector));
        }
        elements.forEach(subEl => {
          setTransform(subEl, progress);
        });
        slides.forEach((slideEl, slideIndex) => {
          let slideProgress = slideEl.progress;
          if (swiper.params.slidesPerGroup > 1 && swiper.params.slidesPerView !== 'auto') {
            slideProgress += Math.ceil(slideIndex / 2) - progress * (snapGrid.length - 1);
          }
          slideProgress = Math.min(Math.max(slideProgress, -1), 1);
          slideEl.querySelectorAll(`${elementsSelector}, [data-swiper-parallax-rotate]`).forEach(subEl => {
            setTransform(subEl, slideProgress);
          });
        });
      };
      const setTransition = (duration = swiper.params.speed) => {
        const {
          el,
          hostEl
        } = swiper;
        const elements = [...el.querySelectorAll(elementsSelector)];
        if (swiper.isElement) {
          elements.push(...hostEl.querySelectorAll(elementsSelector));
        }
        elements.forEach(parallaxEl => {
          let parallaxDuration = parseInt(parallaxEl.getAttribute('data-swiper-parallax-duration'), 10) || duration;
          if (duration === 0) parallaxDuration = 0;
          parallaxEl.style.transitionDuration = `${parallaxDuration}ms`;
        });
      };
      on('beforeInit', () => {
        if (!swiper.params.parallax.enabled) return;
        swiper.params.watchSlidesProgress = true;
        swiper.originalParams.watchSlidesProgress = true;
      });
      on('init', () => {
        if (!swiper.params.parallax.enabled) return;
        setTranslate();
      });
      on('setTranslate', () => {
        if (!swiper.params.parallax.enabled) return;
        setTranslate();
      });
      on('setTransition', (_swiper, duration) => {
        if (!swiper.params.parallax.enabled) return;
        setTransition(duration);
      });
    }

    function Zoom({
      swiper,
      extendParams,
      on,
      emit
    }) {
      const window = getWindow();
      extendParams({
        zoom: {
          enabled: false,
          limitToOriginalSize: false,
          maxRatio: 3,
          minRatio: 1,
          panOnMouseMove: false,
          toggle: true,
          containerClass: 'swiper-zoom-container',
          zoomedSlideClass: 'swiper-slide-zoomed'
        }
      });
      swiper.zoom = {
        enabled: false
      };
      let currentScale = 1;
      let isScaling = false;
      let isPanningWithMouse = false;
      let mousePanStart = {
        x: 0,
        y: 0
      };
      const mousePanSensitivity = -3; // Negative to invert pan direction
      let fakeGestureTouched;
      let fakeGestureMoved;
      const evCache = [];
      const gesture = {
        originX: 0,
        originY: 0,
        slideEl: undefined,
        slideWidth: undefined,
        slideHeight: undefined,
        imageEl: undefined,
        imageWrapEl: undefined,
        maxRatio: 3
      };
      const image = {
        isTouched: undefined,
        isMoved: undefined,
        currentX: undefined,
        currentY: undefined,
        minX: undefined,
        minY: undefined,
        maxX: undefined,
        maxY: undefined,
        width: undefined,
        height: undefined,
        startX: undefined,
        startY: undefined,
        touchesStart: {},
        touchesCurrent: {}
      };
      const velocity = {
        x: undefined,
        y: undefined,
        prevPositionX: undefined,
        prevPositionY: undefined,
        prevTime: undefined
      };
      let scale = 1;
      Object.defineProperty(swiper.zoom, 'scale', {
        get() {
          return scale;
        },
        set(value) {
          if (scale !== value) {
            const imageEl = gesture.imageEl;
            const slideEl = gesture.slideEl;
            emit('zoomChange', value, imageEl, slideEl);
          }
          scale = value;
        }
      });
      function getDistanceBetweenTouches() {
        if (evCache.length < 2) return 1;
        const x1 = evCache[0].pageX;
        const y1 = evCache[0].pageY;
        const x2 = evCache[1].pageX;
        const y2 = evCache[1].pageY;
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        return distance;
      }
      function getMaxRatio() {
        const params = swiper.params.zoom;
        const maxRatio = gesture.imageWrapEl.getAttribute('data-swiper-zoom') || params.maxRatio;
        if (params.limitToOriginalSize && gesture.imageEl && gesture.imageEl.naturalWidth) {
          const imageMaxRatio = gesture.imageEl.naturalWidth / gesture.imageEl.offsetWidth;
          return Math.min(imageMaxRatio, maxRatio);
        }
        return maxRatio;
      }
      function getScaleOrigin() {
        if (evCache.length < 2) return {
          x: null,
          y: null
        };
        const box = gesture.imageEl.getBoundingClientRect();
        return [(evCache[0].pageX + (evCache[1].pageX - evCache[0].pageX) / 2 - box.x - window.scrollX) / currentScale, (evCache[0].pageY + (evCache[1].pageY - evCache[0].pageY) / 2 - box.y - window.scrollY) / currentScale];
      }
      function getSlideSelector() {
        return swiper.isElement ? `swiper-slide` : `.${swiper.params.slideClass}`;
      }
      function eventWithinSlide(e) {
        const slideSelector = getSlideSelector();
        if (e.target.matches(slideSelector)) return true;
        if (swiper.slides.filter(slideEl => slideEl.contains(e.target)).length > 0) return true;
        return false;
      }
      function eventWithinZoomContainer(e) {
        const selector = `.${swiper.params.zoom.containerClass}`;
        if (e.target.matches(selector)) return true;
        if ([...swiper.hostEl.querySelectorAll(selector)].filter(containerEl => containerEl.contains(e.target)).length > 0) return true;
        return false;
      }

      // Events
      function onGestureStart(e) {
        if (e.pointerType === 'mouse') {
          evCache.splice(0, evCache.length);
        }
        if (!eventWithinSlide(e)) return;
        const params = swiper.params.zoom;
        fakeGestureTouched = false;
        fakeGestureMoved = false;
        evCache.push(e);
        if (evCache.length < 2) {
          return;
        }
        fakeGestureTouched = true;
        gesture.scaleStart = getDistanceBetweenTouches();
        if (!gesture.slideEl) {
          gesture.slideEl = e.target.closest(`.${swiper.params.slideClass}, swiper-slide`);
          if (!gesture.slideEl) gesture.slideEl = swiper.slides[swiper.activeIndex];
          let imageEl = gesture.slideEl.querySelector(`.${params.containerClass}`);
          if (imageEl) {
            imageEl = imageEl.querySelectorAll('picture, img, svg, canvas, .swiper-zoom-target')[0];
          }
          gesture.imageEl = imageEl;
          if (imageEl) {
            gesture.imageWrapEl = elementParents(gesture.imageEl, `.${params.containerClass}`)[0];
          } else {
            gesture.imageWrapEl = undefined;
          }
          if (!gesture.imageWrapEl) {
            gesture.imageEl = undefined;
            return;
          }
          gesture.maxRatio = getMaxRatio();
        }
        if (gesture.imageEl) {
          const [originX, originY] = getScaleOrigin();
          gesture.originX = originX;
          gesture.originY = originY;
          gesture.imageEl.style.transitionDuration = '0ms';
        }
        isScaling = true;
      }
      function onGestureChange(e) {
        if (!eventWithinSlide(e)) return;
        const params = swiper.params.zoom;
        const zoom = swiper.zoom;
        const pointerIndex = evCache.findIndex(cachedEv => cachedEv.pointerId === e.pointerId);
        if (pointerIndex >= 0) evCache[pointerIndex] = e;
        if (evCache.length < 2) {
          return;
        }
        fakeGestureMoved = true;
        gesture.scaleMove = getDistanceBetweenTouches();
        if (!gesture.imageEl) {
          return;
        }
        zoom.scale = gesture.scaleMove / gesture.scaleStart * currentScale;
        if (zoom.scale > gesture.maxRatio) {
          zoom.scale = gesture.maxRatio - 1 + (zoom.scale - gesture.maxRatio + 1) ** 0.5;
        }
        if (zoom.scale < params.minRatio) {
          zoom.scale = params.minRatio + 1 - (params.minRatio - zoom.scale + 1) ** 0.5;
        }
        gesture.imageEl.style.transform = `translate3d(0,0,0) scale(${zoom.scale})`;
      }
      function onGestureEnd(e) {
        if (!eventWithinSlide(e)) return;
        if (e.pointerType === 'mouse' && e.type === 'pointerout') return;
        const params = swiper.params.zoom;
        const zoom = swiper.zoom;
        const pointerIndex = evCache.findIndex(cachedEv => cachedEv.pointerId === e.pointerId);
        if (pointerIndex >= 0) evCache.splice(pointerIndex, 1);
        if (!fakeGestureTouched || !fakeGestureMoved) {
          return;
        }
        fakeGestureTouched = false;
        fakeGestureMoved = false;
        if (!gesture.imageEl) return;
        zoom.scale = Math.max(Math.min(zoom.scale, gesture.maxRatio), params.minRatio);
        gesture.imageEl.style.transitionDuration = `${swiper.params.speed}ms`;
        gesture.imageEl.style.transform = `translate3d(0,0,0) scale(${zoom.scale})`;
        currentScale = zoom.scale;
        isScaling = false;
        if (zoom.scale > 1 && gesture.slideEl) {
          gesture.slideEl.classList.add(`${params.zoomedSlideClass}`);
        } else if (zoom.scale <= 1 && gesture.slideEl) {
          gesture.slideEl.classList.remove(`${params.zoomedSlideClass}`);
        }
        if (zoom.scale === 1) {
          gesture.originX = 0;
          gesture.originY = 0;
          gesture.slideEl = undefined;
        }
      }
      let allowTouchMoveTimeout;
      function allowTouchMove() {
        swiper.touchEventsData.preventTouchMoveFromPointerMove = false;
      }
      function preventTouchMove() {
        clearTimeout(allowTouchMoveTimeout);
        swiper.touchEventsData.preventTouchMoveFromPointerMove = true;
        allowTouchMoveTimeout = setTimeout(() => {
          if (swiper.destroyed) return;
          allowTouchMove();
        });
      }
      function onTouchStart(e) {
        const device = swiper.device;
        if (!gesture.imageEl) return;
        if (image.isTouched) return;
        if (device.android && e.cancelable) e.preventDefault();
        image.isTouched = true;
        const event = evCache.length > 0 ? evCache[0] : e;
        image.touchesStart.x = event.pageX;
        image.touchesStart.y = event.pageY;
      }
      function onTouchMove(e) {
        const isMouseEvent = e.pointerType === 'mouse';
        const isMousePan = isMouseEvent && swiper.params.zoom.panOnMouseMove;
        if (!eventWithinSlide(e) || !eventWithinZoomContainer(e)) {
          return;
        }
        const zoom = swiper.zoom;
        if (!gesture.imageEl) {
          return;
        }
        if (!image.isTouched || !gesture.slideEl) {
          if (isMousePan) onMouseMove(e);
          return;
        }
        if (isMousePan) {
          onMouseMove(e);
          return;
        }
        if (!image.isMoved) {
          image.width = gesture.imageEl.offsetWidth || gesture.imageEl.clientWidth;
          image.height = gesture.imageEl.offsetHeight || gesture.imageEl.clientHeight;
          image.startX = getTranslate(gesture.imageWrapEl, 'x') || 0;
          image.startY = getTranslate(gesture.imageWrapEl, 'y') || 0;
          gesture.slideWidth = gesture.slideEl.offsetWidth;
          gesture.slideHeight = gesture.slideEl.offsetHeight;
          gesture.imageWrapEl.style.transitionDuration = '0ms';
        }
        // Define if we need image drag
        const scaledWidth = image.width * zoom.scale;
        const scaledHeight = image.height * zoom.scale;
        image.minX = Math.min(gesture.slideWidth / 2 - scaledWidth / 2, 0);
        image.maxX = -image.minX;
        image.minY = Math.min(gesture.slideHeight / 2 - scaledHeight / 2, 0);
        image.maxY = -image.minY;
        image.touchesCurrent.x = evCache.length > 0 ? evCache[0].pageX : e.pageX;
        image.touchesCurrent.y = evCache.length > 0 ? evCache[0].pageY : e.pageY;
        const touchesDiff = Math.max(Math.abs(image.touchesCurrent.x - image.touchesStart.x), Math.abs(image.touchesCurrent.y - image.touchesStart.y));
        if (touchesDiff > 5) {
          swiper.allowClick = false;
        }
        if (!image.isMoved && !isScaling) {
          if (swiper.isHorizontal() && (Math.floor(image.minX) === Math.floor(image.startX) && image.touchesCurrent.x < image.touchesStart.x || Math.floor(image.maxX) === Math.floor(image.startX) && image.touchesCurrent.x > image.touchesStart.x)) {
            image.isTouched = false;
            allowTouchMove();
            return;
          }
          if (!swiper.isHorizontal() && (Math.floor(image.minY) === Math.floor(image.startY) && image.touchesCurrent.y < image.touchesStart.y || Math.floor(image.maxY) === Math.floor(image.startY) && image.touchesCurrent.y > image.touchesStart.y)) {
            image.isTouched = false;
            allowTouchMove();
            return;
          }
        }
        if (e.cancelable) {
          e.preventDefault();
        }
        e.stopPropagation();
        preventTouchMove();
        image.isMoved = true;
        const scaleRatio = (zoom.scale - currentScale) / (gesture.maxRatio - swiper.params.zoom.minRatio);
        const {
          originX,
          originY
        } = gesture;
        image.currentX = image.touchesCurrent.x - image.touchesStart.x + image.startX + scaleRatio * (image.width - originX * 2);
        image.currentY = image.touchesCurrent.y - image.touchesStart.y + image.startY + scaleRatio * (image.height - originY * 2);
        if (image.currentX < image.minX) {
          image.currentX = image.minX + 1 - (image.minX - image.currentX + 1) ** 0.8;
        }
        if (image.currentX > image.maxX) {
          image.currentX = image.maxX - 1 + (image.currentX - image.maxX + 1) ** 0.8;
        }
        if (image.currentY < image.minY) {
          image.currentY = image.minY + 1 - (image.minY - image.currentY + 1) ** 0.8;
        }
        if (image.currentY > image.maxY) {
          image.currentY = image.maxY - 1 + (image.currentY - image.maxY + 1) ** 0.8;
        }

        // Velocity
        if (!velocity.prevPositionX) velocity.prevPositionX = image.touchesCurrent.x;
        if (!velocity.prevPositionY) velocity.prevPositionY = image.touchesCurrent.y;
        if (!velocity.prevTime) velocity.prevTime = Date.now();
        velocity.x = (image.touchesCurrent.x - velocity.prevPositionX) / (Date.now() - velocity.prevTime) / 2;
        velocity.y = (image.touchesCurrent.y - velocity.prevPositionY) / (Date.now() - velocity.prevTime) / 2;
        if (Math.abs(image.touchesCurrent.x - velocity.prevPositionX) < 2) velocity.x = 0;
        if (Math.abs(image.touchesCurrent.y - velocity.prevPositionY) < 2) velocity.y = 0;
        velocity.prevPositionX = image.touchesCurrent.x;
        velocity.prevPositionY = image.touchesCurrent.y;
        velocity.prevTime = Date.now();
        gesture.imageWrapEl.style.transform = `translate3d(${image.currentX}px, ${image.currentY}px,0)`;
      }
      function onTouchEnd() {
        const zoom = swiper.zoom;
        evCache.length = 0;
        if (!gesture.imageEl) return;
        if (!image.isTouched || !image.isMoved) {
          image.isTouched = false;
          image.isMoved = false;
          return;
        }
        image.isTouched = false;
        image.isMoved = false;
        let momentumDurationX = 300;
        let momentumDurationY = 300;
        const momentumDistanceX = velocity.x * momentumDurationX;
        const newPositionX = image.currentX + momentumDistanceX;
        const momentumDistanceY = velocity.y * momentumDurationY;
        const newPositionY = image.currentY + momentumDistanceY;

        // Fix duration
        if (velocity.x !== 0) momentumDurationX = Math.abs((newPositionX - image.currentX) / velocity.x);
        if (velocity.y !== 0) momentumDurationY = Math.abs((newPositionY - image.currentY) / velocity.y);
        const momentumDuration = Math.max(momentumDurationX, momentumDurationY);
        image.currentX = newPositionX;
        image.currentY = newPositionY;
        // Define if we need image drag
        const scaledWidth = image.width * zoom.scale;
        const scaledHeight = image.height * zoom.scale;
        image.minX = Math.min(gesture.slideWidth / 2 - scaledWidth / 2, 0);
        image.maxX = -image.minX;
        image.minY = Math.min(gesture.slideHeight / 2 - scaledHeight / 2, 0);
        image.maxY = -image.minY;
        image.currentX = Math.max(Math.min(image.currentX, image.maxX), image.minX);
        image.currentY = Math.max(Math.min(image.currentY, image.maxY), image.minY);
        gesture.imageWrapEl.style.transitionDuration = `${momentumDuration}ms`;
        gesture.imageWrapEl.style.transform = `translate3d(${image.currentX}px, ${image.currentY}px,0)`;
      }
      function onTransitionEnd() {
        const zoom = swiper.zoom;
        if (gesture.slideEl && swiper.activeIndex !== swiper.slides.indexOf(gesture.slideEl)) {
          if (gesture.imageEl) {
            gesture.imageEl.style.transform = 'translate3d(0,0,0) scale(1)';
          }
          if (gesture.imageWrapEl) {
            gesture.imageWrapEl.style.transform = 'translate3d(0,0,0)';
          }
          gesture.slideEl.classList.remove(`${swiper.params.zoom.zoomedSlideClass}`);
          zoom.scale = 1;
          currentScale = 1;
          gesture.slideEl = undefined;
          gesture.imageEl = undefined;
          gesture.imageWrapEl = undefined;
          gesture.originX = 0;
          gesture.originY = 0;
        }
      }
      function onMouseMove(e) {
        // Only pan if zoomed in and mouse panning is enabled
        if (currentScale <= 1 || !gesture.imageWrapEl) return;
        if (!eventWithinSlide(e) || !eventWithinZoomContainer(e)) return;
        const currentTransform = window.getComputedStyle(gesture.imageWrapEl).transform;
        const matrix = new window.DOMMatrix(currentTransform);
        if (!isPanningWithMouse) {
          isPanningWithMouse = true;
          mousePanStart.x = e.clientX;
          mousePanStart.y = e.clientY;
          image.startX = matrix.e;
          image.startY = matrix.f;
          image.width = gesture.imageEl.offsetWidth || gesture.imageEl.clientWidth;
          image.height = gesture.imageEl.offsetHeight || gesture.imageEl.clientHeight;
          gesture.slideWidth = gesture.slideEl.offsetWidth;
          gesture.slideHeight = gesture.slideEl.offsetHeight;
          return;
        }
        const deltaX = (e.clientX - mousePanStart.x) * mousePanSensitivity;
        const deltaY = (e.clientY - mousePanStart.y) * mousePanSensitivity;
        const scaledWidth = image.width * currentScale;
        const scaledHeight = image.height * currentScale;
        const slideWidth = gesture.slideWidth;
        const slideHeight = gesture.slideHeight;
        const minX = Math.min(slideWidth / 2 - scaledWidth / 2, 0);
        const maxX = -minX;
        const minY = Math.min(slideHeight / 2 - scaledHeight / 2, 0);
        const maxY = -minY;
        const newX = Math.max(Math.min(image.startX + deltaX, maxX), minX);
        const newY = Math.max(Math.min(image.startY + deltaY, maxY), minY);
        gesture.imageWrapEl.style.transitionDuration = '0ms';
        gesture.imageWrapEl.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        mousePanStart.x = e.clientX;
        mousePanStart.y = e.clientY;
        image.startX = newX;
        image.startY = newY;
        image.currentX = newX;
        image.currentY = newY;
      }
      function zoomIn(e) {
        const zoom = swiper.zoom;
        const params = swiper.params.zoom;
        if (!gesture.slideEl) {
          if (e && e.target) {
            gesture.slideEl = e.target.closest(`.${swiper.params.slideClass}, swiper-slide`);
          }
          if (!gesture.slideEl) {
            if (swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual) {
              gesture.slideEl = elementChildren(swiper.slidesEl, `.${swiper.params.slideActiveClass}`)[0];
            } else {
              gesture.slideEl = swiper.slides[swiper.activeIndex];
            }
          }
          let imageEl = gesture.slideEl.querySelector(`.${params.containerClass}`);
          if (imageEl) {
            imageEl = imageEl.querySelectorAll('picture, img, svg, canvas, .swiper-zoom-target')[0];
          }
          gesture.imageEl = imageEl;
          if (imageEl) {
            gesture.imageWrapEl = elementParents(gesture.imageEl, `.${params.containerClass}`)[0];
          } else {
            gesture.imageWrapEl = undefined;
          }
        }
        if (!gesture.imageEl || !gesture.imageWrapEl) return;
        gesture.maxRatio = getMaxRatio();
        if (swiper.params.cssMode) {
          swiper.wrapperEl.style.overflow = 'hidden';
          swiper.wrapperEl.style.touchAction = 'none';
        }
        gesture.slideEl.classList.add(`${params.zoomedSlideClass}`);
        let touchX;
        let touchY;
        let offsetX;
        let offsetY;
        let diffX;
        let diffY;
        let translateX;
        let translateY;
        let imageWidth;
        let imageHeight;
        let scaledWidth;
        let scaledHeight;
        let translateMinX;
        let translateMinY;
        let translateMaxX;
        let translateMaxY;
        let slideWidth;
        let slideHeight;
        if (typeof image.touchesStart.x === 'undefined' && e) {
          touchX = e.pageX;
          touchY = e.pageY;
        } else {
          touchX = image.touchesStart.x;
          touchY = image.touchesStart.y;
        }
        const prevScale = currentScale;
        const forceZoomRatio = typeof e === 'number' ? e : null;
        if (currentScale === 1 && forceZoomRatio) {
          touchX = undefined;
          touchY = undefined;
          image.touchesStart.x = undefined;
          image.touchesStart.y = undefined;
        }
        const maxRatio = getMaxRatio();
        zoom.scale = forceZoomRatio || maxRatio;
        currentScale = forceZoomRatio || maxRatio;
        if (e && !(currentScale === 1 && forceZoomRatio)) {
          slideWidth = gesture.slideEl.offsetWidth;
          slideHeight = gesture.slideEl.offsetHeight;
          offsetX = elementOffset(gesture.slideEl).left + window.scrollX;
          offsetY = elementOffset(gesture.slideEl).top + window.scrollY;
          diffX = offsetX + slideWidth / 2 - touchX;
          diffY = offsetY + slideHeight / 2 - touchY;
          imageWidth = gesture.imageEl.offsetWidth || gesture.imageEl.clientWidth;
          imageHeight = gesture.imageEl.offsetHeight || gesture.imageEl.clientHeight;
          scaledWidth = imageWidth * zoom.scale;
          scaledHeight = imageHeight * zoom.scale;
          translateMinX = Math.min(slideWidth / 2 - scaledWidth / 2, 0);
          translateMinY = Math.min(slideHeight / 2 - scaledHeight / 2, 0);
          translateMaxX = -translateMinX;
          translateMaxY = -translateMinY;
          if (prevScale > 0 && forceZoomRatio && typeof image.currentX === 'number' && typeof image.currentY === 'number') {
            translateX = image.currentX * zoom.scale / prevScale;
            translateY = image.currentY * zoom.scale / prevScale;
          } else {
            translateX = diffX * zoom.scale;
            translateY = diffY * zoom.scale;
          }
          if (translateX < translateMinX) {
            translateX = translateMinX;
          }
          if (translateX > translateMaxX) {
            translateX = translateMaxX;
          }
          if (translateY < translateMinY) {
            translateY = translateMinY;
          }
          if (translateY > translateMaxY) {
            translateY = translateMaxY;
          }
        } else {
          translateX = 0;
          translateY = 0;
        }
        if (forceZoomRatio && zoom.scale === 1) {
          gesture.originX = 0;
          gesture.originY = 0;
        }
        image.currentX = translateX;
        image.currentY = translateY;
        gesture.imageWrapEl.style.transitionDuration = '300ms';
        gesture.imageWrapEl.style.transform = `translate3d(${translateX}px, ${translateY}px,0)`;
        gesture.imageEl.style.transitionDuration = '300ms';
        gesture.imageEl.style.transform = `translate3d(0,0,0) scale(${zoom.scale})`;
      }
      function zoomOut() {
        const zoom = swiper.zoom;
        const params = swiper.params.zoom;
        if (!gesture.slideEl) {
          if (swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual) {
            gesture.slideEl = elementChildren(swiper.slidesEl, `.${swiper.params.slideActiveClass}`)[0];
          } else {
            gesture.slideEl = swiper.slides[swiper.activeIndex];
          }
          let imageEl = gesture.slideEl.querySelector(`.${params.containerClass}`);
          if (imageEl) {
            imageEl = imageEl.querySelectorAll('picture, img, svg, canvas, .swiper-zoom-target')[0];
          }
          gesture.imageEl = imageEl;
          if (imageEl) {
            gesture.imageWrapEl = elementParents(gesture.imageEl, `.${params.containerClass}`)[0];
          } else {
            gesture.imageWrapEl = undefined;
          }
        }
        if (!gesture.imageEl || !gesture.imageWrapEl) return;
        gesture.maxRatio = getMaxRatio();
        if (swiper.params.cssMode) {
          swiper.wrapperEl.style.overflow = '';
          swiper.wrapperEl.style.touchAction = '';
        }
        zoom.scale = 1;
        currentScale = 1;
        image.currentX = undefined;
        image.currentY = undefined;
        image.touchesStart.x = undefined;
        image.touchesStart.y = undefined;
        gesture.imageWrapEl.style.transitionDuration = '300ms';
        gesture.imageWrapEl.style.transform = 'translate3d(0,0,0)';
        gesture.imageEl.style.transitionDuration = '300ms';
        gesture.imageEl.style.transform = 'translate3d(0,0,0) scale(1)';
        gesture.slideEl.classList.remove(`${params.zoomedSlideClass}`);
        gesture.slideEl = undefined;
        gesture.originX = 0;
        gesture.originY = 0;
        if (swiper.params.zoom.panOnMouseMove) {
          mousePanStart = {
            x: 0,
            y: 0
          };
          if (isPanningWithMouse) {
            isPanningWithMouse = false;
            image.startX = 0;
            image.startY = 0;
          }
        }
      }

      // Toggle Zoom
      function zoomToggle(e) {
        const zoom = swiper.zoom;
        if (zoom.scale && zoom.scale !== 1) {
          // Zoom Out
          zoomOut();
        } else {
          // Zoom In
          zoomIn(e);
        }
      }
      function getListeners() {
        const passiveListener = swiper.params.passiveListeners ? {
          passive: true,
          capture: false
        } : false;
        const activeListenerWithCapture = swiper.params.passiveListeners ? {
          passive: false,
          capture: true
        } : true;
        return {
          passiveListener,
          activeListenerWithCapture
        };
      }

      // Attach/Detach Events
      function enable() {
        const zoom = swiper.zoom;
        if (zoom.enabled) return;
        zoom.enabled = true;
        const {
          passiveListener,
          activeListenerWithCapture
        } = getListeners();

        // Scale image
        swiper.wrapperEl.addEventListener('pointerdown', onGestureStart, passiveListener);
        swiper.wrapperEl.addEventListener('pointermove', onGestureChange, activeListenerWithCapture);
        ['pointerup', 'pointercancel', 'pointerout'].forEach(eventName => {
          swiper.wrapperEl.addEventListener(eventName, onGestureEnd, passiveListener);
        });

        // Move image
        swiper.wrapperEl.addEventListener('pointermove', onTouchMove, activeListenerWithCapture);
      }
      function disable() {
        const zoom = swiper.zoom;
        if (!zoom.enabled) return;
        zoom.enabled = false;
        const {
          passiveListener,
          activeListenerWithCapture
        } = getListeners();

        // Scale image
        swiper.wrapperEl.removeEventListener('pointerdown', onGestureStart, passiveListener);
        swiper.wrapperEl.removeEventListener('pointermove', onGestureChange, activeListenerWithCapture);
        ['pointerup', 'pointercancel', 'pointerout'].forEach(eventName => {
          swiper.wrapperEl.removeEventListener(eventName, onGestureEnd, passiveListener);
        });

        // Move image
        swiper.wrapperEl.removeEventListener('pointermove', onTouchMove, activeListenerWithCapture);
      }
      on('init', () => {
        if (swiper.params.zoom.enabled) {
          enable();
        }
      });
      on('destroy', () => {
        disable();
      });
      on('touchStart', (_s, e) => {
        if (!swiper.zoom.enabled) return;
        onTouchStart(e);
      });
      on('touchEnd', (_s, e) => {
        if (!swiper.zoom.enabled) return;
        onTouchEnd();
      });
      on('doubleTap', (_s, e) => {
        if (!swiper.animating && swiper.params.zoom.enabled && swiper.zoom.enabled && swiper.params.zoom.toggle) {
          zoomToggle(e);
        }
      });
      on('transitionEnd', () => {
        if (swiper.zoom.enabled && swiper.params.zoom.enabled) {
          onTransitionEnd();
        }
      });
      on('slideChange', () => {
        if (swiper.zoom.enabled && swiper.params.zoom.enabled && swiper.params.cssMode) {
          onTransitionEnd();
        }
      });
      Object.assign(swiper.zoom, {
        enable,
        disable,
        in: zoomIn,
        out: zoomOut,
        toggle: zoomToggle
      });
    }

    /* eslint no-bitwise: ["error", { "allow": [">>"] }] */
    function Controller({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        controller: {
          control: undefined,
          inverse: false,
          by: 'slide' // or 'container'
        }
      });

      swiper.controller = {
        control: undefined
      };
      function LinearSpline(x, y) {
        const binarySearch = function search() {
          let maxIndex;
          let minIndex;
          let guess;
          return (array, val) => {
            minIndex = -1;
            maxIndex = array.length;
            while (maxIndex - minIndex > 1) {
              guess = maxIndex + minIndex >> 1;
              if (array[guess] <= val) {
                minIndex = guess;
              } else {
                maxIndex = guess;
              }
            }
            return maxIndex;
          };
        }();
        this.x = x;
        this.y = y;
        this.lastIndex = x.length - 1;
        // Given an x value (x2), return the expected y2 value:
        // (x1,y1) is the known point before given value,
        // (x3,y3) is the known point after given value.
        let i1;
        let i3;
        this.interpolate = function interpolate(x2) {
          if (!x2) return 0;

          // Get the indexes of x1 and x3 (the array indexes before and after given x2):
          i3 = binarySearch(this.x, x2);
          i1 = i3 - 1;

          // We have our indexes i1 & i3, so we can calculate already:
          // y2 := ((x2−x1) × (y3−y1)) ÷ (x3−x1) + y1
          return (x2 - this.x[i1]) * (this.y[i3] - this.y[i1]) / (this.x[i3] - this.x[i1]) + this.y[i1];
        };
        return this;
      }
      function getInterpolateFunction(c) {
        swiper.controller.spline = swiper.params.loop ? new LinearSpline(swiper.slidesGrid, c.slidesGrid) : new LinearSpline(swiper.snapGrid, c.snapGrid);
      }
      function setTranslate(_t, byController) {
        const controlled = swiper.controller.control;
        let multiplier;
        let controlledTranslate;
        const Swiper = swiper.constructor;
        function setControlledTranslate(c) {
          if (c.destroyed) return;

          // this will create an Interpolate function based on the snapGrids
          // x is the Grid of the scrolled scroller and y will be the controlled scroller
          // it makes sense to create this only once and recall it for the interpolation
          // the function does a lot of value caching for performance
          const translate = swiper.rtlTranslate ? -swiper.translate : swiper.translate;
          if (swiper.params.controller.by === 'slide') {
            getInterpolateFunction(c);
            // i am not sure why the values have to be multiplicated this way, tried to invert the snapGrid
            // but it did not work out
            controlledTranslate = -swiper.controller.spline.interpolate(-translate);
          }
          if (!controlledTranslate || swiper.params.controller.by === 'container') {
            multiplier = (c.maxTranslate() - c.minTranslate()) / (swiper.maxTranslate() - swiper.minTranslate());
            if (Number.isNaN(multiplier) || !Number.isFinite(multiplier)) {
              multiplier = 1;
            }
            controlledTranslate = (translate - swiper.minTranslate()) * multiplier + c.minTranslate();
          }
          if (swiper.params.controller.inverse) {
            controlledTranslate = c.maxTranslate() - controlledTranslate;
          }
          c.updateProgress(controlledTranslate);
          c.setTranslate(controlledTranslate, swiper);
          c.updateActiveIndex();
          c.updateSlidesClasses();
        }
        if (Array.isArray(controlled)) {
          for (let i = 0; i < controlled.length; i += 1) {
            if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
              setControlledTranslate(controlled[i]);
            }
          }
        } else if (controlled instanceof Swiper && byController !== controlled) {
          setControlledTranslate(controlled);
        }
      }
      function setTransition(duration, byController) {
        const Swiper = swiper.constructor;
        const controlled = swiper.controller.control;
        let i;
        function setControlledTransition(c) {
          if (c.destroyed) return;
          c.setTransition(duration, swiper);
          if (duration !== 0) {
            c.transitionStart();
            if (c.params.autoHeight) {
              nextTick(() => {
                c.updateAutoHeight();
              });
            }
            elementTransitionEnd(c.wrapperEl, () => {
              if (!controlled) return;
              c.transitionEnd();
            });
          }
        }
        if (Array.isArray(controlled)) {
          for (i = 0; i < controlled.length; i += 1) {
            if (controlled[i] !== byController && controlled[i] instanceof Swiper) {
              setControlledTransition(controlled[i]);
            }
          }
        } else if (controlled instanceof Swiper && byController !== controlled) {
          setControlledTransition(controlled);
        }
      }
      function removeSpline() {
        if (!swiper.controller.control) return;
        if (swiper.controller.spline) {
          swiper.controller.spline = undefined;
          delete swiper.controller.spline;
        }
      }
      on('beforeInit', () => {
        if (typeof window !== 'undefined' && (
        // eslint-disable-line
        typeof swiper.params.controller.control === 'string' || swiper.params.controller.control instanceof HTMLElement)) {
          const controlElements = typeof swiper.params.controller.control === 'string' ? [...document.querySelectorAll(swiper.params.controller.control)] : [swiper.params.controller.control];
          controlElements.forEach(controlElement => {
            if (!swiper.controller.control) swiper.controller.control = [];
            if (controlElement && controlElement.swiper) {
              swiper.controller.control.push(controlElement.swiper);
            } else if (controlElement) {
              const eventName = `${swiper.params.eventsPrefix}init`;
              const onControllerSwiper = e => {
                swiper.controller.control.push(e.detail[0]);
                swiper.update();
                controlElement.removeEventListener(eventName, onControllerSwiper);
              };
              controlElement.addEventListener(eventName, onControllerSwiper);
            }
          });
          return;
        }
        swiper.controller.control = swiper.params.controller.control;
      });
      on('update', () => {
        removeSpline();
      });
      on('resize', () => {
        removeSpline();
      });
      on('observerUpdate', () => {
        removeSpline();
      });
      on('setTranslate', (_s, translate, byController) => {
        if (!swiper.controller.control || swiper.controller.control.destroyed) return;
        swiper.controller.setTranslate(translate, byController);
      });
      on('setTransition', (_s, duration, byController) => {
        if (!swiper.controller.control || swiper.controller.control.destroyed) return;
        swiper.controller.setTransition(duration, byController);
      });
      Object.assign(swiper.controller, {
        setTranslate,
        setTransition
      });
    }

    function A11y({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        a11y: {
          enabled: true,
          notificationClass: 'swiper-notification',
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          firstSlideMessage: 'This is the first slide',
          lastSlideMessage: 'This is the last slide',
          paginationBulletMessage: 'Go to slide {{index}}',
          slideLabelMessage: '{{index}} / {{slidesLength}}',
          containerMessage: null,
          containerRoleDescriptionMessage: null,
          containerRole: null,
          itemRoleDescriptionMessage: null,
          slideRole: 'group',
          id: null,
          scrollOnFocus: true,
          wrapperLiveRegion: true
        }
      });
      swiper.a11y = {
        clicked: false
      };
      let liveRegion = null;
      let preventFocusHandler;
      let focusTargetSlideEl;
      let visibilityChangedTimestamp = new Date().getTime();
      function notify(message) {
        const notification = liveRegion;
        if (notification.length === 0) return;
        setInnerHTML(notification, message);
      }
      function getRandomNumber(size = 16) {
        const randomChar = () => Math.round(16 * Math.random()).toString(16);
        return 'x'.repeat(size).replace(/x/g, randomChar);
      }
      function makeElFocusable(el) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('tabIndex', '0');
        });
      }
      function makeElNotFocusable(el) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('tabIndex', '-1');
        });
      }
      function addElRole(el, role) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('role', role);
        });
      }
      function addElRoleDescription(el, description) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('aria-roledescription', description);
        });
      }
      function addElControls(el, controls) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('aria-controls', controls);
        });
      }
      function addElLabel(el, label) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('aria-label', label);
        });
      }
      function addElId(el, id) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('id', id);
        });
      }
      function addElLive(el, live) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('aria-live', live);
        });
      }
      function disableEl(el) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('aria-disabled', true);
        });
      }
      function enableEl(el) {
        el = makeElementsArray(el);
        el.forEach(subEl => {
          subEl.setAttribute('aria-disabled', false);
        });
      }
      function onEnterOrSpaceKey(e) {
        if (e.keyCode !== 13 && e.keyCode !== 32) return;
        const params = swiper.params.a11y;
        const targetEl = e.target;
        if (swiper.pagination && swiper.pagination.el && (targetEl === swiper.pagination.el || swiper.pagination.el.contains(e.target))) {
          if (!e.target.matches(classesToSelector(swiper.params.pagination.bulletClass))) return;
        }
        if (swiper.navigation && swiper.navigation.prevEl && swiper.navigation.nextEl) {
          const prevEls = makeElementsArray(swiper.navigation.prevEl);
          const nextEls = makeElementsArray(swiper.navigation.nextEl);
          if (nextEls.includes(targetEl)) {
            if (!(swiper.isEnd && !swiper.params.loop)) {
              swiper.slideNext();
            }
            if (swiper.isEnd) {
              notify(params.lastSlideMessage);
            } else {
              notify(params.nextSlideMessage);
            }
          }
          if (prevEls.includes(targetEl)) {
            if (!(swiper.isBeginning && !swiper.params.loop)) {
              swiper.slidePrev();
            }
            if (swiper.isBeginning) {
              notify(params.firstSlideMessage);
            } else {
              notify(params.prevSlideMessage);
            }
          }
        }
        if (swiper.pagination && targetEl.matches(classesToSelector(swiper.params.pagination.bulletClass))) {
          targetEl.click();
        }
      }
      function updateNavigation() {
        if (swiper.params.loop || swiper.params.rewind || !swiper.navigation) return;
        const {
          nextEl,
          prevEl
        } = swiper.navigation;
        if (prevEl) {
          if (swiper.isBeginning) {
            disableEl(prevEl);
            makeElNotFocusable(prevEl);
          } else {
            enableEl(prevEl);
            makeElFocusable(prevEl);
          }
        }
        if (nextEl) {
          if (swiper.isEnd) {
            disableEl(nextEl);
            makeElNotFocusable(nextEl);
          } else {
            enableEl(nextEl);
            makeElFocusable(nextEl);
          }
        }
      }
      function hasPagination() {
        return swiper.pagination && swiper.pagination.bullets && swiper.pagination.bullets.length;
      }
      function hasClickablePagination() {
        return hasPagination() && swiper.params.pagination.clickable;
      }
      function updatePagination() {
        const params = swiper.params.a11y;
        if (!hasPagination()) return;
        swiper.pagination.bullets.forEach(bulletEl => {
          if (swiper.params.pagination.clickable) {
            makeElFocusable(bulletEl);
            if (!swiper.params.pagination.renderBullet) {
              addElRole(bulletEl, 'button');
              addElLabel(bulletEl, params.paginationBulletMessage.replace(/\{\{index\}\}/, elementIndex(bulletEl) + 1));
            }
          }
          if (bulletEl.matches(classesToSelector(swiper.params.pagination.bulletActiveClass))) {
            bulletEl.setAttribute('aria-current', 'true');
          } else {
            bulletEl.removeAttribute('aria-current');
          }
        });
      }
      const initNavEl = (el, wrapperId, message) => {
        makeElFocusable(el);
        if (el.tagName !== 'BUTTON') {
          addElRole(el, 'button');
          el.addEventListener('keydown', onEnterOrSpaceKey);
        }
        addElLabel(el, message);
        addElControls(el, wrapperId);
      };
      const handlePointerDown = e => {
        if (focusTargetSlideEl && focusTargetSlideEl !== e.target && !focusTargetSlideEl.contains(e.target)) {
          preventFocusHandler = true;
        }
        swiper.a11y.clicked = true;
      };
      const handlePointerUp = () => {
        preventFocusHandler = false;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!swiper.destroyed) {
              swiper.a11y.clicked = false;
            }
          });
        });
      };
      const onVisibilityChange = e => {
        visibilityChangedTimestamp = new Date().getTime();
      };
      const handleFocus = e => {
        if (swiper.a11y.clicked || !swiper.params.a11y.scrollOnFocus) return;
        if (new Date().getTime() - visibilityChangedTimestamp < 100) return;
        const slideEl = e.target.closest(`.${swiper.params.slideClass}, swiper-slide`);
        if (!slideEl || !swiper.slides.includes(slideEl)) return;
        focusTargetSlideEl = slideEl;
        const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
        const isActive = (isVirtual ? parseInt(slideEl.getAttribute('data-swiper-slide-index'), 10) : swiper.slides.indexOf(slideEl)) === swiper.activeIndex;
        const isVisible = swiper.params.watchSlidesProgress && swiper.visibleSlides && swiper.visibleSlides.includes(slideEl);
        if (isActive || isVisible) return;
        if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
        if (swiper.isHorizontal()) {
          swiper.el.scrollLeft = 0;
        } else {
          swiper.el.scrollTop = 0;
        }
        requestAnimationFrame(() => {
          if (preventFocusHandler) return;
          if (swiper.params.loop) {
            swiper.slideToLoop(swiper.getSlideIndexWhenGrid(parseInt(slideEl.getAttribute('data-swiper-slide-index'))), 0);
          } else if (isVirtual) {
            swiper.slideTo(swiper.getSlideIndexWhenGrid(parseInt(slideEl.getAttribute('data-swiper-slide-index'), 10)), 0);
          } else {
            swiper.slideTo(swiper.getSlideIndexWhenGrid(swiper.slides.indexOf(slideEl)), 0);
          }
          preventFocusHandler = false;
        });
      };
      const initSlides = () => {
        const params = swiper.params.a11y;
        if (params.itemRoleDescriptionMessage) {
          addElRoleDescription(swiper.slides, params.itemRoleDescriptionMessage);
        }
        if (params.slideRole) {
          addElRole(swiper.slides, params.slideRole);
        }
        const slidesLength = swiper.slides.length;
        if (params.slideLabelMessage) {
          swiper.slides.forEach((slideEl, index) => {
            const slideIndex = swiper.params.loop ? parseInt(slideEl.getAttribute('data-swiper-slide-index'), 10) : index;
            const ariaLabelMessage = params.slideLabelMessage.replace(/\{\{index\}\}/, slideIndex + 1).replace(/\{\{slidesLength\}\}/, slidesLength);
            addElLabel(slideEl, ariaLabelMessage);
          });
        }
      };
      const init = () => {
        const params = swiper.params.a11y;
        swiper.el.append(liveRegion);

        // Container
        const containerEl = swiper.el;
        if (params.containerRoleDescriptionMessage) {
          addElRoleDescription(containerEl, params.containerRoleDescriptionMessage);
        }
        if (params.containerMessage) {
          addElLabel(containerEl, params.containerMessage);
        }
        if (params.containerRole) {
          addElRole(containerEl, params.containerRole);
        }

        // Wrapper
        const wrapperEl = swiper.wrapperEl;
        const wrapperId = params.id || wrapperEl.getAttribute('id') || `swiper-wrapper-${getRandomNumber(16)}`;
        addElId(wrapperEl, wrapperId);
        if (params.wrapperLiveRegion) {
          const live = swiper.params.autoplay && swiper.params.autoplay.enabled ? 'off' : 'polite';
          addElLive(wrapperEl, live);
        }

        // Slide
        initSlides();

        // Navigation
        let {
          nextEl,
          prevEl
        } = swiper.navigation ? swiper.navigation : {};
        nextEl = makeElementsArray(nextEl);
        prevEl = makeElementsArray(prevEl);
        if (nextEl) {
          nextEl.forEach(el => initNavEl(el, wrapperId, params.nextSlideMessage));
        }
        if (prevEl) {
          prevEl.forEach(el => initNavEl(el, wrapperId, params.prevSlideMessage));
        }

        // Pagination
        if (hasClickablePagination()) {
          const paginationEl = makeElementsArray(swiper.pagination.el);
          paginationEl.forEach(el => {
            el.addEventListener('keydown', onEnterOrSpaceKey);
          });
        }

        // Tab focus
        const document = getDocument();
        document.addEventListener('visibilitychange', onVisibilityChange);
        swiper.el.addEventListener('focus', handleFocus, true);
        swiper.el.addEventListener('pointerdown', handlePointerDown, true);
        swiper.el.addEventListener('pointerup', handlePointerUp, true);
      };
      function destroy() {
        if (liveRegion) liveRegion.remove();
        let {
          nextEl,
          prevEl
        } = swiper.navigation ? swiper.navigation : {};
        nextEl = makeElementsArray(nextEl);
        prevEl = makeElementsArray(prevEl);
        if (nextEl) {
          nextEl.forEach(el => el.removeEventListener('keydown', onEnterOrSpaceKey));
        }
        if (prevEl) {
          prevEl.forEach(el => el.removeEventListener('keydown', onEnterOrSpaceKey));
        }

        // Pagination
        if (hasClickablePagination()) {
          const paginationEl = makeElementsArray(swiper.pagination.el);
          paginationEl.forEach(el => {
            el.removeEventListener('keydown', onEnterOrSpaceKey);
          });
        }
        const document = getDocument();
        document.removeEventListener('visibilitychange', onVisibilityChange);
        // Tab focus
        if (swiper.el && typeof swiper.el !== 'string') {
          swiper.el.removeEventListener('focus', handleFocus, true);
          swiper.el.removeEventListener('pointerdown', handlePointerDown, true);
          swiper.el.removeEventListener('pointerup', handlePointerUp, true);
        }
      }
      on('beforeInit', () => {
        liveRegion = createElement('span', swiper.params.a11y.notificationClass);
        liveRegion.setAttribute('aria-live', 'assertive');
        liveRegion.setAttribute('aria-atomic', 'true');
      });
      on('afterInit', () => {
        if (!swiper.params.a11y.enabled) return;
        init();
      });
      on('slidesLengthChange snapGridLengthChange slidesGridLengthChange', () => {
        if (!swiper.params.a11y.enabled) return;
        initSlides();
      });
      on('fromEdge toEdge afterInit lock unlock', () => {
        if (!swiper.params.a11y.enabled) return;
        updateNavigation();
      });
      on('paginationUpdate', () => {
        if (!swiper.params.a11y.enabled) return;
        updatePagination();
      });
      on('destroy', () => {
        if (!swiper.params.a11y.enabled) return;
        destroy();
      });
    }

    function History({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        history: {
          enabled: false,
          root: '',
          replaceState: false,
          key: 'slides',
          keepQuery: false
        }
      });
      let initialized = false;
      let paths = {};
      const slugify = text => {
        return text.toString().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
      };
      const getPathValues = urlOverride => {
        const window = getWindow();
        let location;
        if (urlOverride) {
          location = new URL(urlOverride);
        } else {
          location = window.location;
        }
        const pathArray = location.pathname.slice(1).split('/').filter(part => part !== '');
        const total = pathArray.length;
        const key = pathArray[total - 2];
        const value = pathArray[total - 1];
        return {
          key,
          value
        };
      };
      const setHistory = (key, index) => {
        const window = getWindow();
        if (!initialized || !swiper.params.history.enabled) return;
        let location;
        if (swiper.params.url) {
          location = new URL(swiper.params.url);
        } else {
          location = window.location;
        }
        const slide = swiper.virtual && swiper.params.virtual.enabled ? swiper.slidesEl.querySelector(`[data-swiper-slide-index="${index}"]`) : swiper.slides[index];
        let value = slugify(slide.getAttribute('data-history'));
        if (swiper.params.history.root.length > 0) {
          let root = swiper.params.history.root;
          if (root[root.length - 1] === '/') root = root.slice(0, root.length - 1);
          value = `${root}/${key ? `${key}/` : ''}${value}`;
        } else if (!location.pathname.includes(key)) {
          value = `${key ? `${key}/` : ''}${value}`;
        }
        if (swiper.params.history.keepQuery) {
          value += location.search;
        }
        const currentState = window.history.state;
        if (currentState && currentState.value === value) {
          return;
        }
        if (swiper.params.history.replaceState) {
          window.history.replaceState({
            value
          }, null, value);
        } else {
          window.history.pushState({
            value
          }, null, value);
        }
      };
      const scrollToSlide = (speed, value, runCallbacks) => {
        if (value) {
          for (let i = 0, length = swiper.slides.length; i < length; i += 1) {
            const slide = swiper.slides[i];
            const slideHistory = slugify(slide.getAttribute('data-history'));
            if (slideHistory === value) {
              const index = swiper.getSlideIndex(slide);
              swiper.slideTo(index, speed, runCallbacks);
            }
          }
        } else {
          swiper.slideTo(0, speed, runCallbacks);
        }
      };
      const setHistoryPopState = () => {
        paths = getPathValues(swiper.params.url);
        scrollToSlide(swiper.params.speed, paths.value, false);
      };
      const init = () => {
        const window = getWindow();
        if (!swiper.params.history) return;
        if (!window.history || !window.history.pushState) {
          swiper.params.history.enabled = false;
          swiper.params.hashNavigation.enabled = true;
          return;
        }
        initialized = true;
        paths = getPathValues(swiper.params.url);
        if (!paths.key && !paths.value) {
          if (!swiper.params.history.replaceState) {
            window.addEventListener('popstate', setHistoryPopState);
          }
          return;
        }
        scrollToSlide(0, paths.value, swiper.params.runCallbacksOnInit);
        if (!swiper.params.history.replaceState) {
          window.addEventListener('popstate', setHistoryPopState);
        }
      };
      const destroy = () => {
        const window = getWindow();
        if (!swiper.params.history.replaceState) {
          window.removeEventListener('popstate', setHistoryPopState);
        }
      };
      on('init', () => {
        if (swiper.params.history.enabled) {
          init();
        }
      });
      on('destroy', () => {
        if (swiper.params.history.enabled) {
          destroy();
        }
      });
      on('transitionEnd _freeModeNoMomentumRelease', () => {
        if (initialized) {
          setHistory(swiper.params.history.key, swiper.activeIndex);
        }
      });
      on('slideChange', () => {
        if (initialized && swiper.params.cssMode) {
          setHistory(swiper.params.history.key, swiper.activeIndex);
        }
      });
    }

    function HashNavigation({
      swiper,
      extendParams,
      emit,
      on
    }) {
      let initialized = false;
      const document = getDocument();
      const window = getWindow();
      extendParams({
        hashNavigation: {
          enabled: false,
          replaceState: false,
          watchState: false,
          getSlideIndex(_s, hash) {
            if (swiper.virtual && swiper.params.virtual.enabled) {
              const slideWithHash = swiper.slides.find(slideEl => slideEl.getAttribute('data-hash') === hash);
              if (!slideWithHash) return 0;
              const index = parseInt(slideWithHash.getAttribute('data-swiper-slide-index'), 10);
              return index;
            }
            return swiper.getSlideIndex(elementChildren(swiper.slidesEl, `.${swiper.params.slideClass}[data-hash="${hash}"], swiper-slide[data-hash="${hash}"]`)[0]);
          }
        }
      });
      const onHashChange = () => {
        emit('hashChange');
        const newHash = document.location.hash.replace('#', '');
        const activeSlideEl = swiper.virtual && swiper.params.virtual.enabled ? swiper.slidesEl.querySelector(`[data-swiper-slide-index="${swiper.activeIndex}"]`) : swiper.slides[swiper.activeIndex];
        const activeSlideHash = activeSlideEl ? activeSlideEl.getAttribute('data-hash') : '';
        if (newHash !== activeSlideHash) {
          const newIndex = swiper.params.hashNavigation.getSlideIndex(swiper, newHash);
          if (typeof newIndex === 'undefined' || Number.isNaN(newIndex)) return;
          swiper.slideTo(newIndex);
        }
      };
      const setHash = () => {
        if (!initialized || !swiper.params.hashNavigation.enabled) return;
        const activeSlideEl = swiper.virtual && swiper.params.virtual.enabled ? swiper.slidesEl.querySelector(`[data-swiper-slide-index="${swiper.activeIndex}"]`) : swiper.slides[swiper.activeIndex];
        const activeSlideHash = activeSlideEl ? activeSlideEl.getAttribute('data-hash') || activeSlideEl.getAttribute('data-history') : '';
        if (swiper.params.hashNavigation.replaceState && window.history && window.history.replaceState) {
          window.history.replaceState(null, null, `#${activeSlideHash}` || '');
          emit('hashSet');
        } else {
          document.location.hash = activeSlideHash || '';
          emit('hashSet');
        }
      };
      const init = () => {
        if (!swiper.params.hashNavigation.enabled || swiper.params.history && swiper.params.history.enabled) return;
        initialized = true;
        const hash = document.location.hash.replace('#', '');
        if (hash) {
          const speed = 0;
          const index = swiper.params.hashNavigation.getSlideIndex(swiper, hash);
          swiper.slideTo(index || 0, speed, swiper.params.runCallbacksOnInit, true);
        }
        if (swiper.params.hashNavigation.watchState) {
          window.addEventListener('hashchange', onHashChange);
        }
      };
      const destroy = () => {
        if (swiper.params.hashNavigation.watchState) {
          window.removeEventListener('hashchange', onHashChange);
        }
      };
      on('init', () => {
        if (swiper.params.hashNavigation.enabled) {
          init();
        }
      });
      on('destroy', () => {
        if (swiper.params.hashNavigation.enabled) {
          destroy();
        }
      });
      on('transitionEnd _freeModeNoMomentumRelease', () => {
        if (initialized) {
          setHash();
        }
      });
      on('slideChange', () => {
        if (initialized && swiper.params.cssMode) {
          setHash();
        }
      });
    }

    /* eslint no-underscore-dangle: "off" */
    /* eslint no-use-before-define: "off" */
    function Autoplay({
      swiper,
      extendParams,
      on,
      emit,
      params
    }) {
      swiper.autoplay = {
        running: false,
        paused: false,
        timeLeft: 0
      };
      extendParams({
        autoplay: {
          enabled: false,
          delay: 3000,
          waitForTransition: true,
          disableOnInteraction: false,
          stopOnLastSlide: false,
          reverseDirection: false,
          pauseOnMouseEnter: false
        }
      });
      let timeout;
      let raf;
      let autoplayDelayTotal = params && params.autoplay ? params.autoplay.delay : 3000;
      let autoplayDelayCurrent = params && params.autoplay ? params.autoplay.delay : 3000;
      let autoplayTimeLeft;
      let autoplayStartTime = new Date().getTime();
      let wasPaused;
      let isTouched;
      let pausedByTouch;
      let touchStartTimeout;
      let pausedByInteraction;
      let pausedByPointerEnter;
      function onTransitionEnd(e) {
        if (!swiper || swiper.destroyed || !swiper.wrapperEl) return;
        if (e.target !== swiper.wrapperEl) return;
        swiper.wrapperEl.removeEventListener('transitionend', onTransitionEnd);
        if (pausedByPointerEnter || e.detail && e.detail.bySwiperTouchMove) {
          return;
        }
        resume();
      }
      const calcTimeLeft = () => {
        if (swiper.destroyed || !swiper.autoplay.running) return;
        if (swiper.autoplay.paused) {
          wasPaused = true;
        } else if (wasPaused) {
          autoplayDelayCurrent = autoplayTimeLeft;
          wasPaused = false;
        }
        const timeLeft = swiper.autoplay.paused ? autoplayTimeLeft : autoplayStartTime + autoplayDelayCurrent - new Date().getTime();
        swiper.autoplay.timeLeft = timeLeft;
        emit('autoplayTimeLeft', timeLeft, timeLeft / autoplayDelayTotal);
        raf = requestAnimationFrame(() => {
          calcTimeLeft();
        });
      };
      const getSlideDelay = () => {
        let activeSlideEl;
        if (swiper.virtual && swiper.params.virtual.enabled) {
          activeSlideEl = swiper.slides.find(slideEl => slideEl.classList.contains('swiper-slide-active'));
        } else {
          activeSlideEl = swiper.slides[swiper.activeIndex];
        }
        if (!activeSlideEl) return undefined;
        const currentSlideDelay = parseInt(activeSlideEl.getAttribute('data-swiper-autoplay'), 10);
        return currentSlideDelay;
      };
      const getTotalDelay = () => {
        let totalDelay = swiper.params.autoplay.delay;
        const currentSlideDelay = getSlideDelay();
        if (!Number.isNaN(currentSlideDelay) && currentSlideDelay > 0) {
          totalDelay = currentSlideDelay;
        }
        return totalDelay;
      };
      const run = delayForce => {
        if (swiper.destroyed || !swiper.autoplay.running) return;
        cancelAnimationFrame(raf);
        calcTimeLeft();
        let delay = delayForce;
        if (typeof delay === 'undefined') {
          delay = getTotalDelay();
          autoplayDelayTotal = delay;
          autoplayDelayCurrent = delay;
        }
        autoplayTimeLeft = delay;
        const speed = swiper.params.speed;
        const proceed = () => {
          if (!swiper || swiper.destroyed) return;
          if (swiper.params.autoplay.reverseDirection) {
            if (!swiper.isBeginning || swiper.params.loop || swiper.params.rewind) {
              swiper.slidePrev(speed, true, true);
              emit('autoplay');
            } else if (!swiper.params.autoplay.stopOnLastSlide) {
              swiper.slideTo(swiper.slides.length - 1, speed, true, true);
              emit('autoplay');
            }
          } else {
            if (!swiper.isEnd || swiper.params.loop || swiper.params.rewind) {
              swiper.slideNext(speed, true, true);
              emit('autoplay');
            } else if (!swiper.params.autoplay.stopOnLastSlide) {
              swiper.slideTo(0, speed, true, true);
              emit('autoplay');
            }
          }
          if (swiper.params.cssMode) {
            autoplayStartTime = new Date().getTime();
            requestAnimationFrame(() => {
              run();
            });
          }
        };
        if (delay > 0) {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            proceed();
          }, delay);
        } else {
          requestAnimationFrame(() => {
            proceed();
          });
        }

        // eslint-disable-next-line
        return delay;
      };
      const start = () => {
        autoplayStartTime = new Date().getTime();
        swiper.autoplay.running = true;
        run();
        emit('autoplayStart');
      };
      const stop = () => {
        swiper.autoplay.running = false;
        clearTimeout(timeout);
        cancelAnimationFrame(raf);
        emit('autoplayStop');
      };
      const pause = (internal, reset) => {
        if (swiper.destroyed || !swiper.autoplay.running) return;
        clearTimeout(timeout);
        if (!internal) {
          pausedByInteraction = true;
        }
        const proceed = () => {
          emit('autoplayPause');
          if (swiper.params.autoplay.waitForTransition) {
            swiper.wrapperEl.addEventListener('transitionend', onTransitionEnd);
          } else {
            resume();
          }
        };
        swiper.autoplay.paused = true;
        if (reset) {
          proceed();
          return;
        }
        const delay = autoplayTimeLeft || swiper.params.autoplay.delay;
        autoplayTimeLeft = delay - (new Date().getTime() - autoplayStartTime);
        if (swiper.isEnd && autoplayTimeLeft < 0 && !swiper.params.loop) return;
        if (autoplayTimeLeft < 0) autoplayTimeLeft = 0;
        proceed();
      };
      const resume = () => {
        if (swiper.isEnd && autoplayTimeLeft < 0 && !swiper.params.loop || swiper.destroyed || !swiper.autoplay.running) return;
        autoplayStartTime = new Date().getTime();
        if (pausedByInteraction) {
          pausedByInteraction = false;
          run(autoplayTimeLeft);
        } else {
          run();
        }
        swiper.autoplay.paused = false;
        emit('autoplayResume');
      };
      const onVisibilityChange = () => {
        if (swiper.destroyed || !swiper.autoplay.running) return;
        const document = getDocument();
        if (document.visibilityState === 'hidden') {
          pausedByInteraction = true;
          pause(true);
        }
        if (document.visibilityState === 'visible') {
          resume();
        }
      };
      const onPointerEnter = e => {
        if (e.pointerType !== 'mouse') return;
        pausedByInteraction = true;
        pausedByPointerEnter = true;
        if (swiper.animating || swiper.autoplay.paused) return;
        pause(true);
      };
      const onPointerLeave = e => {
        if (e.pointerType !== 'mouse') return;
        pausedByPointerEnter = false;
        if (swiper.autoplay.paused) {
          resume();
        }
      };
      const attachMouseEvents = () => {
        if (swiper.params.autoplay.pauseOnMouseEnter) {
          swiper.el.addEventListener('pointerenter', onPointerEnter);
          swiper.el.addEventListener('pointerleave', onPointerLeave);
        }
      };
      const detachMouseEvents = () => {
        if (swiper.el && typeof swiper.el !== 'string') {
          swiper.el.removeEventListener('pointerenter', onPointerEnter);
          swiper.el.removeEventListener('pointerleave', onPointerLeave);
        }
      };
      const attachDocumentEvents = () => {
        const document = getDocument();
        document.addEventListener('visibilitychange', onVisibilityChange);
      };
      const detachDocumentEvents = () => {
        const document = getDocument();
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
      on('init', () => {
        if (swiper.params.autoplay.enabled) {
          attachMouseEvents();
          attachDocumentEvents();
          start();
        }
      });
      on('destroy', () => {
        detachMouseEvents();
        detachDocumentEvents();
        if (swiper.autoplay.running) {
          stop();
        }
      });
      on('_freeModeStaticRelease', () => {
        if (pausedByTouch || pausedByInteraction) {
          resume();
        }
      });
      on('_freeModeNoMomentumRelease', () => {
        if (!swiper.params.autoplay.disableOnInteraction) {
          pause(true, true);
        } else {
          stop();
        }
      });
      on('beforeTransitionStart', (_s, speed, internal) => {
        if (swiper.destroyed || !swiper.autoplay.running) return;
        if (internal || !swiper.params.autoplay.disableOnInteraction) {
          pause(true, true);
        } else {
          stop();
        }
      });
      on('sliderFirstMove', () => {
        if (swiper.destroyed || !swiper.autoplay.running) return;
        if (swiper.params.autoplay.disableOnInteraction) {
          stop();
          return;
        }
        isTouched = true;
        pausedByTouch = false;
        pausedByInteraction = false;
        touchStartTimeout = setTimeout(() => {
          pausedByInteraction = true;
          pausedByTouch = true;
          pause(true);
        }, 200);
      });
      on('touchEnd', () => {
        if (swiper.destroyed || !swiper.autoplay.running || !isTouched) return;
        clearTimeout(touchStartTimeout);
        clearTimeout(timeout);
        if (swiper.params.autoplay.disableOnInteraction) {
          pausedByTouch = false;
          isTouched = false;
          return;
        }
        if (pausedByTouch && swiper.params.cssMode) resume();
        pausedByTouch = false;
        isTouched = false;
      });
      on('slideChange', () => {
        if (swiper.destroyed || !swiper.autoplay.running) return;
        if (swiper.autoplay.paused) {
          autoplayTimeLeft = getTotalDelay();
          autoplayDelayTotal = getTotalDelay();
        }
      });
      Object.assign(swiper.autoplay, {
        start,
        stop,
        pause,
        resume
      });
    }

    function Thumb({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        thumbs: {
          swiper: null,
          multipleActiveThumbs: true,
          autoScrollOffset: 0,
          slideThumbActiveClass: 'swiper-slide-thumb-active',
          thumbsContainerClass: 'swiper-thumbs'
        }
      });
      let initialized = false;
      let swiperCreated = false;
      swiper.thumbs = {
        swiper: null
      };
      function isVirtualEnabled() {
        const thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper || thumbsSwiper.destroyed) return false;
        return thumbsSwiper.params.virtual && thumbsSwiper.params.virtual.enabled;
      }
      function onThumbClick() {
        const thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper || thumbsSwiper.destroyed) return;
        const clickedIndex = thumbsSwiper.clickedIndex;
        const clickedSlide = thumbsSwiper.clickedSlide;
        if (clickedSlide && clickedSlide.classList.contains(swiper.params.thumbs.slideThumbActiveClass)) return;
        if (typeof clickedIndex === 'undefined' || clickedIndex === null) return;
        let slideToIndex;
        if (thumbsSwiper.params.loop) {
          slideToIndex = parseInt(thumbsSwiper.clickedSlide.getAttribute('data-swiper-slide-index'), 10);
        } else {
          slideToIndex = clickedIndex;
        }
        if (swiper.params.loop) {
          swiper.slideToLoop(slideToIndex);
        } else {
          swiper.slideTo(slideToIndex);
        }
      }
      function init() {
        const {
          thumbs: thumbsParams
        } = swiper.params;
        if (initialized) return false;
        initialized = true;
        const SwiperClass = swiper.constructor;
        if (thumbsParams.swiper instanceof SwiperClass) {
          if (thumbsParams.swiper.destroyed) {
            initialized = false;
            return false;
          }
          swiper.thumbs.swiper = thumbsParams.swiper;
          Object.assign(swiper.thumbs.swiper.originalParams, {
            watchSlidesProgress: true,
            slideToClickedSlide: false
          });
          Object.assign(swiper.thumbs.swiper.params, {
            watchSlidesProgress: true,
            slideToClickedSlide: false
          });
          swiper.thumbs.swiper.update();
        } else if (isObject$1(thumbsParams.swiper)) {
          const thumbsSwiperParams = Object.assign({}, thumbsParams.swiper);
          Object.assign(thumbsSwiperParams, {
            watchSlidesProgress: true,
            slideToClickedSlide: false
          });
          swiper.thumbs.swiper = new SwiperClass(thumbsSwiperParams);
          swiperCreated = true;
        }
        swiper.thumbs.swiper.el.classList.add(swiper.params.thumbs.thumbsContainerClass);
        swiper.thumbs.swiper.on('tap', onThumbClick);
        if (isVirtualEnabled()) {
          swiper.thumbs.swiper.on('virtualUpdate', () => {
            update(false, {
              autoScroll: false
            });
          });
        }
        return true;
      }
      function update(initial, p) {
        const thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper || thumbsSwiper.destroyed) return;

        // Activate thumbs
        let thumbsToActivate = 1;
        const thumbActiveClass = swiper.params.thumbs.slideThumbActiveClass;
        if (swiper.params.slidesPerView > 1 && !swiper.params.centeredSlides) {
          thumbsToActivate = swiper.params.slidesPerView;
        }
        if (!swiper.params.thumbs.multipleActiveThumbs) {
          thumbsToActivate = 1;
        }
        thumbsToActivate = Math.floor(thumbsToActivate);
        thumbsSwiper.slides.forEach(slideEl => slideEl.classList.remove(thumbActiveClass));
        if (thumbsSwiper.params.loop || isVirtualEnabled()) {
          for (let i = 0; i < thumbsToActivate; i += 1) {
            elementChildren(thumbsSwiper.slidesEl, `[data-swiper-slide-index="${swiper.realIndex + i}"]`).forEach(slideEl => {
              slideEl.classList.add(thumbActiveClass);
            });
          }
        } else {
          for (let i = 0; i < thumbsToActivate; i += 1) {
            if (thumbsSwiper.slides[swiper.realIndex + i]) {
              thumbsSwiper.slides[swiper.realIndex + i].classList.add(thumbActiveClass);
            }
          }
        }
        if (p?.autoScroll ?? true) {
          autoScroll(initial ? 0 : undefined);
        }
      }
      function autoScroll(slideSpeed) {
        const thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper || thumbsSwiper.destroyed) return;
        const slidesPerView = thumbsSwiper.params.slidesPerView === 'auto' ? thumbsSwiper.slidesPerViewDynamic() : thumbsSwiper.params.slidesPerView;
        const autoScrollOffset = swiper.params.thumbs.autoScrollOffset;
        const useOffset = autoScrollOffset && !thumbsSwiper.params.loop;
        if (swiper.realIndex !== thumbsSwiper.realIndex || useOffset) {
          const currentThumbsIndex = thumbsSwiper.activeIndex;
          let newThumbsIndex;
          let direction;
          if (thumbsSwiper.params.loop) {
            const newThumbsSlide = thumbsSwiper.slides.find(slideEl => slideEl.getAttribute('data-swiper-slide-index') === `${swiper.realIndex}`);
            newThumbsIndex = thumbsSwiper.slides.indexOf(newThumbsSlide);
            direction = swiper.activeIndex > swiper.previousIndex ? 'next' : 'prev';
          } else {
            newThumbsIndex = swiper.realIndex;
            direction = newThumbsIndex > swiper.previousIndex ? 'next' : 'prev';
          }
          if (useOffset) {
            newThumbsIndex += direction === 'next' ? autoScrollOffset : -1 * autoScrollOffset;
          }
          if (thumbsSwiper.visibleSlidesIndexes && thumbsSwiper.visibleSlidesIndexes.indexOf(newThumbsIndex) < 0) {
            if (thumbsSwiper.params.centeredSlides) {
              if (newThumbsIndex > currentThumbsIndex) {
                newThumbsIndex = newThumbsIndex - Math.floor(slidesPerView / 2) + 1;
              } else {
                newThumbsIndex = newThumbsIndex + Math.floor(slidesPerView / 2) - 1;
              }
            } else if (newThumbsIndex > currentThumbsIndex && thumbsSwiper.params.slidesPerGroup === 1) ;
            thumbsSwiper.slideTo(newThumbsIndex, slideSpeed);
          }
        }
      }
      on('beforeInit', () => {
        const {
          thumbs
        } = swiper.params;
        if (!thumbs || !thumbs.swiper) return;
        if (typeof thumbs.swiper === 'string' || thumbs.swiper instanceof HTMLElement) {
          const document = getDocument();
          const getThumbsElementAndInit = () => {
            const thumbsElement = typeof thumbs.swiper === 'string' ? document.querySelector(thumbs.swiper) : thumbs.swiper;
            if (thumbsElement && thumbsElement.swiper) {
              thumbs.swiper = thumbsElement.swiper;
              init();
              update(true);
            } else if (thumbsElement) {
              const eventName = `${swiper.params.eventsPrefix}init`;
              const onThumbsSwiper = e => {
                thumbs.swiper = e.detail[0];
                thumbsElement.removeEventListener(eventName, onThumbsSwiper);
                init();
                update(true);
                thumbs.swiper.update();
                swiper.update();
              };
              thumbsElement.addEventListener(eventName, onThumbsSwiper);
            }
            return thumbsElement;
          };
          const watchForThumbsToAppear = () => {
            if (swiper.destroyed) return;
            const thumbsElement = getThumbsElementAndInit();
            if (!thumbsElement) {
              requestAnimationFrame(watchForThumbsToAppear);
            }
          };
          requestAnimationFrame(watchForThumbsToAppear);
        } else {
          init();
          update(true);
        }
      });
      on('slideChange update resize observerUpdate', () => {
        update();
      });
      on('setTransition', (_s, duration) => {
        const thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper || thumbsSwiper.destroyed) return;
        thumbsSwiper.setTransition(duration);
      });
      on('beforeDestroy', () => {
        const thumbsSwiper = swiper.thumbs.swiper;
        if (!thumbsSwiper || thumbsSwiper.destroyed) return;
        if (swiperCreated) {
          thumbsSwiper.destroy();
        }
      });
      Object.assign(swiper.thumbs, {
        init,
        update
      });
    }

    function freeMode({
      swiper,
      extendParams,
      emit,
      once
    }) {
      extendParams({
        freeMode: {
          enabled: false,
          momentum: true,
          momentumRatio: 1,
          momentumBounce: true,
          momentumBounceRatio: 1,
          momentumVelocityRatio: 1,
          sticky: false,
          minimumVelocity: 0.02
        }
      });
      function onTouchStart() {
        if (swiper.params.cssMode) return;
        const translate = swiper.getTranslate();
        swiper.setTranslate(translate);
        swiper.setTransition(0);
        swiper.touchEventsData.velocities.length = 0;
        swiper.freeMode.onTouchEnd({
          currentPos: swiper.rtl ? swiper.translate : -swiper.translate
        });
      }
      function onTouchMove() {
        if (swiper.params.cssMode) return;
        const {
          touchEventsData: data,
          touches
        } = swiper;
        // Velocity
        if (data.velocities.length === 0) {
          data.velocities.push({
            position: touches[swiper.isHorizontal() ? 'startX' : 'startY'],
            time: data.touchStartTime
          });
        }
        data.velocities.push({
          position: touches[swiper.isHorizontal() ? 'currentX' : 'currentY'],
          time: now()
        });
      }
      function onTouchEnd({
        currentPos
      }) {
        if (swiper.params.cssMode) return;
        const {
          params,
          wrapperEl,
          rtlTranslate: rtl,
          snapGrid,
          touchEventsData: data
        } = swiper;
        // Time diff
        const touchEndTime = now();
        const timeDiff = touchEndTime - data.touchStartTime;
        if (currentPos < -swiper.minTranslate()) {
          swiper.slideTo(swiper.activeIndex);
          return;
        }
        if (currentPos > -swiper.maxTranslate()) {
          if (swiper.slides.length < snapGrid.length) {
            swiper.slideTo(snapGrid.length - 1);
          } else {
            swiper.slideTo(swiper.slides.length - 1);
          }
          return;
        }
        if (params.freeMode.momentum) {
          if (data.velocities.length > 1) {
            const lastMoveEvent = data.velocities.pop();
            const velocityEvent = data.velocities.pop();
            const distance = lastMoveEvent.position - velocityEvent.position;
            const time = lastMoveEvent.time - velocityEvent.time;
            swiper.velocity = distance / time;
            swiper.velocity /= 2;
            if (Math.abs(swiper.velocity) < params.freeMode.minimumVelocity) {
              swiper.velocity = 0;
            }
            // this implies that the user stopped moving a finger then released.
            // There would be no events with distance zero, so the last event is stale.
            if (time > 150 || now() - lastMoveEvent.time > 300) {
              swiper.velocity = 0;
            }
          } else {
            swiper.velocity = 0;
          }
          swiper.velocity *= params.freeMode.momentumVelocityRatio;
          data.velocities.length = 0;
          let momentumDuration = 1000 * params.freeMode.momentumRatio;
          const momentumDistance = swiper.velocity * momentumDuration;
          let newPosition = swiper.translate + momentumDistance;
          if (rtl) newPosition = -newPosition;
          let doBounce = false;
          let afterBouncePosition;
          const bounceAmount = Math.abs(swiper.velocity) * 20 * params.freeMode.momentumBounceRatio;
          let needsLoopFix;
          if (newPosition < swiper.maxTranslate()) {
            if (params.freeMode.momentumBounce) {
              if (newPosition + swiper.maxTranslate() < -bounceAmount) {
                newPosition = swiper.maxTranslate() - bounceAmount;
              }
              afterBouncePosition = swiper.maxTranslate();
              doBounce = true;
              data.allowMomentumBounce = true;
            } else {
              newPosition = swiper.maxTranslate();
            }
            if (params.loop && params.centeredSlides) needsLoopFix = true;
          } else if (newPosition > swiper.minTranslate()) {
            if (params.freeMode.momentumBounce) {
              if (newPosition - swiper.minTranslate() > bounceAmount) {
                newPosition = swiper.minTranslate() + bounceAmount;
              }
              afterBouncePosition = swiper.minTranslate();
              doBounce = true;
              data.allowMomentumBounce = true;
            } else {
              newPosition = swiper.minTranslate();
            }
            if (params.loop && params.centeredSlides) needsLoopFix = true;
          } else if (params.freeMode.sticky) {
            let nextSlide;
            for (let j = 0; j < snapGrid.length; j += 1) {
              if (snapGrid[j] > -newPosition) {
                nextSlide = j;
                break;
              }
            }
            if (Math.abs(snapGrid[nextSlide] - newPosition) < Math.abs(snapGrid[nextSlide - 1] - newPosition) || swiper.swipeDirection === 'next') {
              newPosition = snapGrid[nextSlide];
            } else {
              newPosition = snapGrid[nextSlide - 1];
            }
            newPosition = -newPosition;
          }
          if (needsLoopFix) {
            once('transitionEnd', () => {
              swiper.loopFix();
            });
          }
          // Fix duration
          if (swiper.velocity !== 0) {
            if (rtl) {
              momentumDuration = Math.abs((-newPosition - swiper.translate) / swiper.velocity);
            } else {
              momentumDuration = Math.abs((newPosition - swiper.translate) / swiper.velocity);
            }
            if (params.freeMode.sticky) {
              // If freeMode.sticky is active and the user ends a swipe with a slow-velocity
              // event, then durations can be 20+ seconds to slide one (or zero!) slides.
              // It's easy to see this when simulating touch with mouse events. To fix this,
              // limit single-slide swipes to the default slide duration. This also has the
              // nice side effect of matching slide speed if the user stopped moving before
              // lifting finger or mouse vs. moving slowly before lifting the finger/mouse.
              // For faster swipes, also apply limits (albeit higher ones).
              const moveDistance = Math.abs((rtl ? -newPosition : newPosition) - swiper.translate);
              const currentSlideSize = swiper.slidesSizesGrid[swiper.activeIndex];
              if (moveDistance < currentSlideSize) {
                momentumDuration = params.speed;
              } else if (moveDistance < 2 * currentSlideSize) {
                momentumDuration = params.speed * 1.5;
              } else {
                momentumDuration = params.speed * 2.5;
              }
            }
          } else if (params.freeMode.sticky) {
            swiper.slideToClosest();
            return;
          }
          if (params.freeMode.momentumBounce && doBounce) {
            swiper.updateProgress(afterBouncePosition);
            swiper.setTransition(momentumDuration);
            swiper.setTranslate(newPosition);
            swiper.transitionStart(true, swiper.swipeDirection);
            swiper.animating = true;
            elementTransitionEnd(wrapperEl, () => {
              if (!swiper || swiper.destroyed || !data.allowMomentumBounce) return;
              emit('momentumBounce');
              swiper.setTransition(params.speed);
              setTimeout(() => {
                swiper.setTranslate(afterBouncePosition);
                elementTransitionEnd(wrapperEl, () => {
                  if (!swiper || swiper.destroyed) return;
                  swiper.transitionEnd();
                });
              }, 0);
            });
          } else if (swiper.velocity) {
            emit('_freeModeNoMomentumRelease');
            swiper.updateProgress(newPosition);
            swiper.setTransition(momentumDuration);
            swiper.setTranslate(newPosition);
            swiper.transitionStart(true, swiper.swipeDirection);
            if (!swiper.animating) {
              swiper.animating = true;
              elementTransitionEnd(wrapperEl, () => {
                if (!swiper || swiper.destroyed) return;
                swiper.transitionEnd();
              });
            }
          } else {
            swiper.updateProgress(newPosition);
          }
          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();
        } else if (params.freeMode.sticky) {
          swiper.slideToClosest();
          return;
        } else if (params.freeMode) {
          emit('_freeModeNoMomentumRelease');
        }
        if (!params.freeMode.momentum || timeDiff >= params.longSwipesMs) {
          emit('_freeModeStaticRelease');
          swiper.updateProgress();
          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();
        }
      }
      Object.assign(swiper, {
        freeMode: {
          onTouchStart,
          onTouchMove,
          onTouchEnd
        }
      });
    }

    function Grid({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        grid: {
          rows: 1,
          fill: 'column'
        }
      });
      let slidesNumberEvenToRows;
      let slidesPerRow;
      let numFullColumns;
      let wasMultiRow;
      const getSpaceBetween = () => {
        let spaceBetween = swiper.params.spaceBetween;
        if (typeof spaceBetween === 'string' && spaceBetween.indexOf('%') >= 0) {
          spaceBetween = parseFloat(spaceBetween.replace('%', '')) / 100 * swiper.size;
        } else if (typeof spaceBetween === 'string') {
          spaceBetween = parseFloat(spaceBetween);
        }
        return spaceBetween;
      };
      const initSlides = slides => {
        const {
          slidesPerView
        } = swiper.params;
        const {
          rows,
          fill
        } = swiper.params.grid;
        const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : slides.length;
        numFullColumns = Math.floor(slidesLength / rows);
        if (Math.floor(slidesLength / rows) === slidesLength / rows) {
          slidesNumberEvenToRows = slidesLength;
        } else {
          slidesNumberEvenToRows = Math.ceil(slidesLength / rows) * rows;
        }
        if (slidesPerView !== 'auto' && fill === 'row') {
          slidesNumberEvenToRows = Math.max(slidesNumberEvenToRows, slidesPerView * rows);
        }
        slidesPerRow = slidesNumberEvenToRows / rows;
      };
      const unsetSlides = () => {
        if (swiper.slides) {
          swiper.slides.forEach(slide => {
            if (slide.swiperSlideGridSet) {
              slide.style.height = '';
              slide.style[swiper.getDirectionLabel('margin-top')] = '';
            }
          });
        }
      };
      const updateSlide = (i, slide, slides) => {
        const {
          slidesPerGroup
        } = swiper.params;
        const spaceBetween = getSpaceBetween();
        const {
          rows,
          fill
        } = swiper.params.grid;
        const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : slides.length;
        // Set slides order
        let newSlideOrderIndex;
        let column;
        let row;
        if (fill === 'row' && slidesPerGroup > 1) {
          const groupIndex = Math.floor(i / (slidesPerGroup * rows));
          const slideIndexInGroup = i - rows * slidesPerGroup * groupIndex;
          const columnsInGroup = groupIndex === 0 ? slidesPerGroup : Math.min(Math.ceil((slidesLength - groupIndex * rows * slidesPerGroup) / rows), slidesPerGroup);
          row = Math.floor(slideIndexInGroup / columnsInGroup);
          column = slideIndexInGroup - row * columnsInGroup + groupIndex * slidesPerGroup;
          newSlideOrderIndex = column + row * slidesNumberEvenToRows / rows;
          slide.style.order = newSlideOrderIndex;
        } else if (fill === 'column') {
          column = Math.floor(i / rows);
          row = i - column * rows;
          if (column > numFullColumns || column === numFullColumns && row === rows - 1) {
            row += 1;
            if (row >= rows) {
              row = 0;
              column += 1;
            }
          }
        } else {
          row = Math.floor(i / slidesPerRow);
          column = i - row * slidesPerRow;
        }
        slide.row = row;
        slide.column = column;
        slide.style.height = `calc((100% - ${(rows - 1) * spaceBetween}px) / ${rows})`;
        slide.style[swiper.getDirectionLabel('margin-top')] = row !== 0 ? spaceBetween && `${spaceBetween}px` : '';
        slide.swiperSlideGridSet = true;
      };
      const updateWrapperSize = (slideSize, snapGrid) => {
        const {
          centeredSlides,
          roundLengths
        } = swiper.params;
        const spaceBetween = getSpaceBetween();
        const {
          rows
        } = swiper.params.grid;
        swiper.virtualSize = (slideSize + spaceBetween) * slidesNumberEvenToRows;
        swiper.virtualSize = Math.ceil(swiper.virtualSize / rows) - spaceBetween;
        if (!swiper.params.cssMode) {
          swiper.wrapperEl.style[swiper.getDirectionLabel('width')] = `${swiper.virtualSize + spaceBetween}px`;
        }
        if (centeredSlides) {
          const newSlidesGrid = [];
          for (let i = 0; i < snapGrid.length; i += 1) {
            let slidesGridItem = snapGrid[i];
            if (roundLengths) slidesGridItem = Math.floor(slidesGridItem);
            if (snapGrid[i] < swiper.virtualSize + snapGrid[0]) newSlidesGrid.push(slidesGridItem);
          }
          snapGrid.splice(0, snapGrid.length);
          snapGrid.push(...newSlidesGrid);
        }
      };
      const onInit = () => {
        wasMultiRow = swiper.params.grid && swiper.params.grid.rows > 1;
      };
      const onUpdate = () => {
        const {
          params,
          el
        } = swiper;
        const isMultiRow = params.grid && params.grid.rows > 1;
        if (wasMultiRow && !isMultiRow) {
          el.classList.remove(`${params.containerModifierClass}grid`, `${params.containerModifierClass}grid-column`);
          numFullColumns = 1;
          swiper.emitContainerClasses();
        } else if (!wasMultiRow && isMultiRow) {
          el.classList.add(`${params.containerModifierClass}grid`);
          if (params.grid.fill === 'column') {
            el.classList.add(`${params.containerModifierClass}grid-column`);
          }
          swiper.emitContainerClasses();
        }
        wasMultiRow = isMultiRow;
      };
      on('init', onInit);
      on('update', onUpdate);
      swiper.grid = {
        initSlides,
        unsetSlides,
        updateSlide,
        updateWrapperSize
      };
    }

    function appendSlide(slides) {
      const swiper = this;
      const {
        params,
        slidesEl
      } = swiper;
      if (params.loop) {
        swiper.loopDestroy();
      }
      const appendElement = slideEl => {
        if (typeof slideEl === 'string') {
          const tempDOM = document.createElement('div');
          setInnerHTML(tempDOM, slideEl);
          slidesEl.append(tempDOM.children[0]);
          setInnerHTML(tempDOM, '');
        } else {
          slidesEl.append(slideEl);
        }
      };
      if (typeof slides === 'object' && 'length' in slides) {
        for (let i = 0; i < slides.length; i += 1) {
          if (slides[i]) appendElement(slides[i]);
        }
      } else {
        appendElement(slides);
      }
      swiper.recalcSlides();
      if (params.loop) {
        swiper.loopCreate();
      }
      if (!params.observer || swiper.isElement) {
        swiper.update();
      }
    }

    function prependSlide(slides) {
      const swiper = this;
      const {
        params,
        activeIndex,
        slidesEl
      } = swiper;
      if (params.loop) {
        swiper.loopDestroy();
      }
      let newActiveIndex = activeIndex + 1;
      const prependElement = slideEl => {
        if (typeof slideEl === 'string') {
          const tempDOM = document.createElement('div');
          setInnerHTML(tempDOM, slideEl);
          slidesEl.prepend(tempDOM.children[0]);
          setInnerHTML(tempDOM, '');
        } else {
          slidesEl.prepend(slideEl);
        }
      };
      if (typeof slides === 'object' && 'length' in slides) {
        for (let i = 0; i < slides.length; i += 1) {
          if (slides[i]) prependElement(slides[i]);
        }
        newActiveIndex = activeIndex + slides.length;
      } else {
        prependElement(slides);
      }
      swiper.recalcSlides();
      if (params.loop) {
        swiper.loopCreate();
      }
      if (!params.observer || swiper.isElement) {
        swiper.update();
      }
      swiper.slideTo(newActiveIndex, 0, false);
    }

    function addSlide(index, slides) {
      const swiper = this;
      const {
        params,
        activeIndex,
        slidesEl
      } = swiper;
      let activeIndexBuffer = activeIndex;
      if (params.loop) {
        activeIndexBuffer -= swiper.loopedSlides;
        swiper.loopDestroy();
        swiper.recalcSlides();
      }
      const baseLength = swiper.slides.length;
      if (index <= 0) {
        swiper.prependSlide(slides);
        return;
      }
      if (index >= baseLength) {
        swiper.appendSlide(slides);
        return;
      }
      let newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + 1 : activeIndexBuffer;
      const slidesBuffer = [];
      for (let i = baseLength - 1; i >= index; i -= 1) {
        const currentSlide = swiper.slides[i];
        currentSlide.remove();
        slidesBuffer.unshift(currentSlide);
      }
      if (typeof slides === 'object' && 'length' in slides) {
        for (let i = 0; i < slides.length; i += 1) {
          if (slides[i]) slidesEl.append(slides[i]);
        }
        newActiveIndex = activeIndexBuffer > index ? activeIndexBuffer + slides.length : activeIndexBuffer;
      } else {
        slidesEl.append(slides);
      }
      for (let i = 0; i < slidesBuffer.length; i += 1) {
        slidesEl.append(slidesBuffer[i]);
      }
      swiper.recalcSlides();
      if (params.loop) {
        swiper.loopCreate();
      }
      if (!params.observer || swiper.isElement) {
        swiper.update();
      }
      if (params.loop) {
        swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
      } else {
        swiper.slideTo(newActiveIndex, 0, false);
      }
    }

    function removeSlide(slidesIndexes) {
      const swiper = this;
      const {
        params,
        activeIndex
      } = swiper;
      let activeIndexBuffer = activeIndex;
      if (params.loop) {
        activeIndexBuffer -= swiper.loopedSlides;
        swiper.loopDestroy();
      }
      let newActiveIndex = activeIndexBuffer;
      let indexToRemove;
      if (typeof slidesIndexes === 'object' && 'length' in slidesIndexes) {
        for (let i = 0; i < slidesIndexes.length; i += 1) {
          indexToRemove = slidesIndexes[i];
          if (swiper.slides[indexToRemove]) swiper.slides[indexToRemove].remove();
          if (indexToRemove < newActiveIndex) newActiveIndex -= 1;
        }
        newActiveIndex = Math.max(newActiveIndex, 0);
      } else {
        indexToRemove = slidesIndexes;
        if (swiper.slides[indexToRemove]) swiper.slides[indexToRemove].remove();
        if (indexToRemove < newActiveIndex) newActiveIndex -= 1;
        newActiveIndex = Math.max(newActiveIndex, 0);
      }
      swiper.recalcSlides();
      if (params.loop) {
        swiper.loopCreate();
      }
      if (!params.observer || swiper.isElement) {
        swiper.update();
      }
      if (params.loop) {
        swiper.slideTo(newActiveIndex + swiper.loopedSlides, 0, false);
      } else {
        swiper.slideTo(newActiveIndex, 0, false);
      }
    }

    function removeAllSlides() {
      const swiper = this;
      const slidesIndexes = [];
      for (let i = 0; i < swiper.slides.length; i += 1) {
        slidesIndexes.push(i);
      }
      swiper.removeSlide(slidesIndexes);
    }

    function Manipulation({
      swiper
    }) {
      Object.assign(swiper, {
        appendSlide: appendSlide.bind(swiper),
        prependSlide: prependSlide.bind(swiper),
        addSlide: addSlide.bind(swiper),
        removeSlide: removeSlide.bind(swiper),
        removeAllSlides: removeAllSlides.bind(swiper)
      });
    }

    function effectInit(params) {
      const {
        effect,
        swiper,
        on,
        setTranslate,
        setTransition,
        overwriteParams,
        perspective,
        recreateShadows,
        getEffectParams
      } = params;
      on('beforeInit', () => {
        if (swiper.params.effect !== effect) return;
        swiper.classNames.push(`${swiper.params.containerModifierClass}${effect}`);
        if (perspective && perspective()) {
          swiper.classNames.push(`${swiper.params.containerModifierClass}3d`);
        }
        const overwriteParamsResult = overwriteParams ? overwriteParams() : {};
        Object.assign(swiper.params, overwriteParamsResult);
        Object.assign(swiper.originalParams, overwriteParamsResult);
      });
      on('setTranslate _virtualUpdated', () => {
        if (swiper.params.effect !== effect) return;
        setTranslate();
      });
      on('setTransition', (_s, duration) => {
        if (swiper.params.effect !== effect) return;
        setTransition(duration);
      });
      on('transitionEnd', () => {
        if (swiper.params.effect !== effect) return;
        if (recreateShadows) {
          if (!getEffectParams || !getEffectParams().slideShadows) return;
          // remove shadows
          swiper.slides.forEach(slideEl => {
            slideEl.querySelectorAll('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').forEach(shadowEl => shadowEl.remove());
          });
          // create new one
          recreateShadows();
        }
      });
      let requireUpdateOnVirtual;
      on('virtualUpdate', () => {
        if (swiper.params.effect !== effect) return;
        if (!swiper.slides.length) {
          requireUpdateOnVirtual = true;
        }
        requestAnimationFrame(() => {
          if (requireUpdateOnVirtual && swiper.slides && swiper.slides.length) {
            setTranslate();
            requireUpdateOnVirtual = false;
          }
        });
      });
    }

    function effectTarget(effectParams, slideEl) {
      const transformEl = getSlideTransformEl(slideEl);
      if (transformEl !== slideEl) {
        transformEl.style.backfaceVisibility = 'hidden';
        transformEl.style['-webkit-backface-visibility'] = 'hidden';
      }
      return transformEl;
    }

    function effectVirtualTransitionEnd({
      swiper,
      duration,
      transformElements,
      allSlides
    }) {
      const {
        activeIndex
      } = swiper;
      const getSlide = el => {
        if (!el.parentElement) {
          // assume shadow root
          const slide = swiper.slides.find(slideEl => slideEl.shadowRoot && slideEl.shadowRoot === el.parentNode);
          return slide;
        }
        return el.parentElement;
      };
      if (swiper.params.virtualTranslate && duration !== 0) {
        let eventTriggered = false;
        let transitionEndTarget;
        if (allSlides) {
          transitionEndTarget = transformElements;
        } else {
          transitionEndTarget = transformElements.filter(transformEl => {
            const el = transformEl.classList.contains('swiper-slide-transform') ? getSlide(transformEl) : transformEl;
            return swiper.getSlideIndex(el) === activeIndex;
          });
        }
        transitionEndTarget.forEach(el => {
          elementTransitionEnd(el, () => {
            if (eventTriggered) return;
            if (!swiper || swiper.destroyed) return;
            eventTriggered = true;
            swiper.animating = false;
            const evt = new window.CustomEvent('transitionend', {
              bubbles: true,
              cancelable: true
            });
            swiper.wrapperEl.dispatchEvent(evt);
          });
        });
      }
    }

    function EffectFade({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        fadeEffect: {
          crossFade: false
        }
      });
      const setTranslate = () => {
        const {
          slides
        } = swiper;
        const params = swiper.params.fadeEffect;
        for (let i = 0; i < slides.length; i += 1) {
          const slideEl = swiper.slides[i];
          const offset = slideEl.swiperSlideOffset;
          let tx = -offset;
          if (!swiper.params.virtualTranslate) tx -= swiper.translate;
          let ty = 0;
          if (!swiper.isHorizontal()) {
            ty = tx;
            tx = 0;
          }
          const slideOpacity = swiper.params.fadeEffect.crossFade ? Math.max(1 - Math.abs(slideEl.progress), 0) : 1 + Math.min(Math.max(slideEl.progress, -1), 0);
          const targetEl = effectTarget(params, slideEl);
          targetEl.style.opacity = slideOpacity;
          targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0px)`;
        }
      };
      const setTransition = duration => {
        const transformElements = swiper.slides.map(slideEl => getSlideTransformEl(slideEl));
        transformElements.forEach(el => {
          el.style.transitionDuration = `${duration}ms`;
        });
        effectVirtualTransitionEnd({
          swiper,
          duration,
          transformElements,
          allSlides: true
        });
      };
      effectInit({
        effect: 'fade',
        swiper,
        on,
        setTranslate,
        setTransition,
        overwriteParams: () => ({
          slidesPerView: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          spaceBetween: 0,
          virtualTranslate: !swiper.params.cssMode
        })
      });
    }

    function EffectCube({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        cubeEffect: {
          slideShadows: true,
          shadow: true,
          shadowOffset: 20,
          shadowScale: 0.94
        }
      });
      const createSlideShadows = (slideEl, progress, isHorizontal) => {
        let shadowBefore = isHorizontal ? slideEl.querySelector('.swiper-slide-shadow-left') : slideEl.querySelector('.swiper-slide-shadow-top');
        let shadowAfter = isHorizontal ? slideEl.querySelector('.swiper-slide-shadow-right') : slideEl.querySelector('.swiper-slide-shadow-bottom');
        if (!shadowBefore) {
          shadowBefore = createElement('div', `swiper-slide-shadow-cube swiper-slide-shadow-${isHorizontal ? 'left' : 'top'}`.split(' '));
          slideEl.append(shadowBefore);
        }
        if (!shadowAfter) {
          shadowAfter = createElement('div', `swiper-slide-shadow-cube swiper-slide-shadow-${isHorizontal ? 'right' : 'bottom'}`.split(' '));
          slideEl.append(shadowAfter);
        }
        if (shadowBefore) shadowBefore.style.opacity = Math.max(-progress, 0);
        if (shadowAfter) shadowAfter.style.opacity = Math.max(progress, 0);
      };
      const recreateShadows = () => {
        // create new ones
        const isHorizontal = swiper.isHorizontal();
        swiper.slides.forEach(slideEl => {
          const progress = Math.max(Math.min(slideEl.progress, 1), -1);
          createSlideShadows(slideEl, progress, isHorizontal);
        });
      };
      const setTranslate = () => {
        const {
          el,
          wrapperEl,
          slides,
          width: swiperWidth,
          height: swiperHeight,
          rtlTranslate: rtl,
          size: swiperSize,
          browser
        } = swiper;
        const r = getRotateFix(swiper);
        const params = swiper.params.cubeEffect;
        const isHorizontal = swiper.isHorizontal();
        const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
        let wrapperRotate = 0;
        let cubeShadowEl;
        if (params.shadow) {
          if (isHorizontal) {
            cubeShadowEl = swiper.wrapperEl.querySelector('.swiper-cube-shadow');
            if (!cubeShadowEl) {
              cubeShadowEl = createElement('div', 'swiper-cube-shadow');
              swiper.wrapperEl.append(cubeShadowEl);
            }
            cubeShadowEl.style.height = `${swiperWidth}px`;
          } else {
            cubeShadowEl = el.querySelector('.swiper-cube-shadow');
            if (!cubeShadowEl) {
              cubeShadowEl = createElement('div', 'swiper-cube-shadow');
              el.append(cubeShadowEl);
            }
          }
        }
        for (let i = 0; i < slides.length; i += 1) {
          const slideEl = slides[i];
          let slideIndex = i;
          if (isVirtual) {
            slideIndex = parseInt(slideEl.getAttribute('data-swiper-slide-index'), 10);
          }
          let slideAngle = slideIndex * 90;
          let round = Math.floor(slideAngle / 360);
          if (rtl) {
            slideAngle = -slideAngle;
            round = Math.floor(-slideAngle / 360);
          }
          const progress = Math.max(Math.min(slideEl.progress, 1), -1);
          let tx = 0;
          let ty = 0;
          let tz = 0;
          if (slideIndex % 4 === 0) {
            tx = -round * 4 * swiperSize;
            tz = 0;
          } else if ((slideIndex - 1) % 4 === 0) {
            tx = 0;
            tz = -round * 4 * swiperSize;
          } else if ((slideIndex - 2) % 4 === 0) {
            tx = swiperSize + round * 4 * swiperSize;
            tz = swiperSize;
          } else if ((slideIndex - 3) % 4 === 0) {
            tx = -swiperSize;
            tz = 3 * swiperSize + swiperSize * 4 * round;
          }
          if (rtl) {
            tx = -tx;
          }
          if (!isHorizontal) {
            ty = tx;
            tx = 0;
          }
          const transform = `rotateX(${r(isHorizontal ? 0 : -slideAngle)}deg) rotateY(${r(isHorizontal ? slideAngle : 0)}deg) translate3d(${tx}px, ${ty}px, ${tz}px)`;
          if (progress <= 1 && progress > -1) {
            wrapperRotate = slideIndex * 90 + progress * 90;
            if (rtl) wrapperRotate = -slideIndex * 90 - progress * 90;
          }
          slideEl.style.transform = transform;
          if (params.slideShadows) {
            createSlideShadows(slideEl, progress, isHorizontal);
          }
        }
        wrapperEl.style.transformOrigin = `50% 50% -${swiperSize / 2}px`;
        wrapperEl.style['-webkit-transform-origin'] = `50% 50% -${swiperSize / 2}px`;
        if (params.shadow) {
          if (isHorizontal) {
            cubeShadowEl.style.transform = `translate3d(0px, ${swiperWidth / 2 + params.shadowOffset}px, ${-swiperWidth / 2}px) rotateX(89.99deg) rotateZ(0deg) scale(${params.shadowScale})`;
          } else {
            const shadowAngle = Math.abs(wrapperRotate) - Math.floor(Math.abs(wrapperRotate) / 90) * 90;
            const multiplier = 1.5 - (Math.sin(shadowAngle * 2 * Math.PI / 360) / 2 + Math.cos(shadowAngle * 2 * Math.PI / 360) / 2);
            const scale1 = params.shadowScale;
            const scale2 = params.shadowScale / multiplier;
            const offset = params.shadowOffset;
            cubeShadowEl.style.transform = `scale3d(${scale1}, 1, ${scale2}) translate3d(0px, ${swiperHeight / 2 + offset}px, ${-swiperHeight / 2 / scale2}px) rotateX(-89.99deg)`;
          }
        }
        const zFactor = (browser.isSafari || browser.isWebView) && browser.needPerspectiveFix ? -swiperSize / 2 : 0;
        wrapperEl.style.transform = `translate3d(0px,0,${zFactor}px) rotateX(${r(swiper.isHorizontal() ? 0 : wrapperRotate)}deg) rotateY(${r(swiper.isHorizontal() ? -wrapperRotate : 0)}deg)`;
        wrapperEl.style.setProperty('--swiper-cube-translate-z', `${zFactor}px`);
      };
      const setTransition = duration => {
        const {
          el,
          slides
        } = swiper;
        slides.forEach(slideEl => {
          slideEl.style.transitionDuration = `${duration}ms`;
          slideEl.querySelectorAll('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').forEach(subEl => {
            subEl.style.transitionDuration = `${duration}ms`;
          });
        });
        if (swiper.params.cubeEffect.shadow && !swiper.isHorizontal()) {
          const shadowEl = el.querySelector('.swiper-cube-shadow');
          if (shadowEl) shadowEl.style.transitionDuration = `${duration}ms`;
        }
      };
      effectInit({
        effect: 'cube',
        swiper,
        on,
        setTranslate,
        setTransition,
        recreateShadows,
        getEffectParams: () => swiper.params.cubeEffect,
        perspective: () => true,
        overwriteParams: () => ({
          slidesPerView: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          resistanceRatio: 0,
          spaceBetween: 0,
          centeredSlides: false,
          virtualTranslate: true
        })
      });
    }

    function createShadow(suffix, slideEl, side) {
      const shadowClass = `swiper-slide-shadow${side ? `-${side}` : ''}${suffix ? ` swiper-slide-shadow-${suffix}` : ''}`;
      const shadowContainer = getSlideTransformEl(slideEl);
      let shadowEl = shadowContainer.querySelector(`.${shadowClass.split(' ').join('.')}`);
      if (!shadowEl) {
        shadowEl = createElement('div', shadowClass.split(' '));
        shadowContainer.append(shadowEl);
      }
      return shadowEl;
    }

    function EffectFlip({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        flipEffect: {
          slideShadows: true,
          limitRotation: true
        }
      });
      const createSlideShadows = (slideEl, progress) => {
        let shadowBefore = swiper.isHorizontal() ? slideEl.querySelector('.swiper-slide-shadow-left') : slideEl.querySelector('.swiper-slide-shadow-top');
        let shadowAfter = swiper.isHorizontal() ? slideEl.querySelector('.swiper-slide-shadow-right') : slideEl.querySelector('.swiper-slide-shadow-bottom');
        if (!shadowBefore) {
          shadowBefore = createShadow('flip', slideEl, swiper.isHorizontal() ? 'left' : 'top');
        }
        if (!shadowAfter) {
          shadowAfter = createShadow('flip', slideEl, swiper.isHorizontal() ? 'right' : 'bottom');
        }
        if (shadowBefore) shadowBefore.style.opacity = Math.max(-progress, 0);
        if (shadowAfter) shadowAfter.style.opacity = Math.max(progress, 0);
      };
      const recreateShadows = () => {
        // Set shadows
        swiper.params.flipEffect;
        swiper.slides.forEach(slideEl => {
          let progress = slideEl.progress;
          if (swiper.params.flipEffect.limitRotation) {
            progress = Math.max(Math.min(slideEl.progress, 1), -1);
          }
          createSlideShadows(slideEl, progress);
        });
      };
      const setTranslate = () => {
        const {
          slides,
          rtlTranslate: rtl
        } = swiper;
        const params = swiper.params.flipEffect;
        const rotateFix = getRotateFix(swiper);
        for (let i = 0; i < slides.length; i += 1) {
          const slideEl = slides[i];
          let progress = slideEl.progress;
          if (swiper.params.flipEffect.limitRotation) {
            progress = Math.max(Math.min(slideEl.progress, 1), -1);
          }
          const offset = slideEl.swiperSlideOffset;
          const rotate = -180 * progress;
          let rotateY = rotate;
          let rotateX = 0;
          let tx = swiper.params.cssMode ? -offset - swiper.translate : -offset;
          let ty = 0;
          if (!swiper.isHorizontal()) {
            ty = tx;
            tx = 0;
            rotateX = -rotateY;
            rotateY = 0;
          } else if (rtl) {
            rotateY = -rotateY;
          }
          slideEl.style.zIndex = -Math.abs(Math.round(progress)) + slides.length;
          if (params.slideShadows) {
            createSlideShadows(slideEl, progress);
          }
          const transform = `translate3d(${tx}px, ${ty}px, 0px) rotateX(${rotateFix(rotateX)}deg) rotateY(${rotateFix(rotateY)}deg)`;
          const targetEl = effectTarget(params, slideEl);
          targetEl.style.transform = transform;
        }
      };
      const setTransition = duration => {
        const transformElements = swiper.slides.map(slideEl => getSlideTransformEl(slideEl));
        transformElements.forEach(el => {
          el.style.transitionDuration = `${duration}ms`;
          el.querySelectorAll('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').forEach(shadowEl => {
            shadowEl.style.transitionDuration = `${duration}ms`;
          });
        });
        effectVirtualTransitionEnd({
          swiper,
          duration,
          transformElements
        });
      };
      effectInit({
        effect: 'flip',
        swiper,
        on,
        setTranslate,
        setTransition,
        recreateShadows,
        getEffectParams: () => swiper.params.flipEffect,
        perspective: () => true,
        overwriteParams: () => ({
          slidesPerView: 1,
          slidesPerGroup: 1,
          watchSlidesProgress: true,
          spaceBetween: 0,
          virtualTranslate: !swiper.params.cssMode
        })
      });
    }

    function EffectCoverflow({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        coverflowEffect: {
          rotate: 50,
          stretch: 0,
          depth: 100,
          scale: 1,
          modifier: 1,
          slideShadows: true
        }
      });
      const setTranslate = () => {
        const {
          width: swiperWidth,
          height: swiperHeight,
          slides,
          slidesSizesGrid
        } = swiper;
        const params = swiper.params.coverflowEffect;
        const isHorizontal = swiper.isHorizontal();
        const transform = swiper.translate;
        const center = isHorizontal ? -transform + swiperWidth / 2 : -transform + swiperHeight / 2;
        const rotate = isHorizontal ? params.rotate : -params.rotate;
        const translate = params.depth;
        const r = getRotateFix(swiper);
        // Each slide offset from center
        for (let i = 0, length = slides.length; i < length; i += 1) {
          const slideEl = slides[i];
          const slideSize = slidesSizesGrid[i];
          const slideOffset = slideEl.swiperSlideOffset;
          const centerOffset = (center - slideOffset - slideSize / 2) / slideSize;
          const offsetMultiplier = typeof params.modifier === 'function' ? params.modifier(centerOffset) : centerOffset * params.modifier;
          let rotateY = isHorizontal ? rotate * offsetMultiplier : 0;
          let rotateX = isHorizontal ? 0 : rotate * offsetMultiplier;
          // var rotateZ = 0
          let translateZ = -translate * Math.abs(offsetMultiplier);
          let stretch = params.stretch;
          // Allow percentage to make a relative stretch for responsive sliders
          if (typeof stretch === 'string' && stretch.indexOf('%') !== -1) {
            stretch = parseFloat(params.stretch) / 100 * slideSize;
          }
          let translateY = isHorizontal ? 0 : stretch * offsetMultiplier;
          let translateX = isHorizontal ? stretch * offsetMultiplier : 0;
          let scale = 1 - (1 - params.scale) * Math.abs(offsetMultiplier);

          // Fix for ultra small values
          if (Math.abs(translateX) < 0.001) translateX = 0;
          if (Math.abs(translateY) < 0.001) translateY = 0;
          if (Math.abs(translateZ) < 0.001) translateZ = 0;
          if (Math.abs(rotateY) < 0.001) rotateY = 0;
          if (Math.abs(rotateX) < 0.001) rotateX = 0;
          if (Math.abs(scale) < 0.001) scale = 0;
          const slideTransform = `translate3d(${translateX}px,${translateY}px,${translateZ}px)  rotateX(${r(rotateX)}deg) rotateY(${r(rotateY)}deg) scale(${scale})`;
          const targetEl = effectTarget(params, slideEl);
          targetEl.style.transform = slideTransform;
          slideEl.style.zIndex = -Math.abs(Math.round(offsetMultiplier)) + 1;
          if (params.slideShadows) {
            // Set shadows
            let shadowBeforeEl = isHorizontal ? slideEl.querySelector('.swiper-slide-shadow-left') : slideEl.querySelector('.swiper-slide-shadow-top');
            let shadowAfterEl = isHorizontal ? slideEl.querySelector('.swiper-slide-shadow-right') : slideEl.querySelector('.swiper-slide-shadow-bottom');
            if (!shadowBeforeEl) {
              shadowBeforeEl = createShadow('coverflow', slideEl, isHorizontal ? 'left' : 'top');
            }
            if (!shadowAfterEl) {
              shadowAfterEl = createShadow('coverflow', slideEl, isHorizontal ? 'right' : 'bottom');
            }
            if (shadowBeforeEl) shadowBeforeEl.style.opacity = offsetMultiplier > 0 ? offsetMultiplier : 0;
            if (shadowAfterEl) shadowAfterEl.style.opacity = -offsetMultiplier > 0 ? -offsetMultiplier : 0;
          }
        }
      };
      const setTransition = duration => {
        const transformElements = swiper.slides.map(slideEl => getSlideTransformEl(slideEl));
        transformElements.forEach(el => {
          el.style.transitionDuration = `${duration}ms`;
          el.querySelectorAll('.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left').forEach(shadowEl => {
            shadowEl.style.transitionDuration = `${duration}ms`;
          });
        });
      };
      effectInit({
        effect: 'coverflow',
        swiper,
        on,
        setTranslate,
        setTransition,
        perspective: () => true,
        overwriteParams: () => ({
          watchSlidesProgress: true
        })
      });
    }

    function EffectCreative({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        creativeEffect: {
          limitProgress: 1,
          shadowPerProgress: false,
          progressMultiplier: 1,
          perspective: true,
          prev: {
            translate: [0, 0, 0],
            rotate: [0, 0, 0],
            opacity: 1,
            scale: 1
          },
          next: {
            translate: [0, 0, 0],
            rotate: [0, 0, 0],
            opacity: 1,
            scale: 1
          }
        }
      });
      const getTranslateValue = value => {
        if (typeof value === 'string') return value;
        return `${value}px`;
      };
      const setTranslate = () => {
        const {
          slides,
          wrapperEl,
          slidesSizesGrid
        } = swiper;
        const params = swiper.params.creativeEffect;
        const {
          progressMultiplier: multiplier
        } = params;
        const isCenteredSlides = swiper.params.centeredSlides;
        const rotateFix = getRotateFix(swiper);
        if (isCenteredSlides) {
          const margin = slidesSizesGrid[0] / 2 - swiper.params.slidesOffsetBefore || 0;
          wrapperEl.style.transform = `translateX(calc(50% - ${margin}px))`;
        }
        for (let i = 0; i < slides.length; i += 1) {
          const slideEl = slides[i];
          const slideProgress = slideEl.progress;
          const progress = Math.min(Math.max(slideEl.progress, -params.limitProgress), params.limitProgress);
          let originalProgress = progress;
          if (!isCenteredSlides) {
            originalProgress = Math.min(Math.max(slideEl.originalProgress, -params.limitProgress), params.limitProgress);
          }
          const offset = slideEl.swiperSlideOffset;
          const t = [swiper.params.cssMode ? -offset - swiper.translate : -offset, 0, 0];
          const r = [0, 0, 0];
          let custom = false;
          if (!swiper.isHorizontal()) {
            t[1] = t[0];
            t[0] = 0;
          }
          let data = {
            translate: [0, 0, 0],
            rotate: [0, 0, 0],
            scale: 1,
            opacity: 1
          };
          if (progress < 0) {
            data = params.next;
            custom = true;
          } else if (progress > 0) {
            data = params.prev;
            custom = true;
          }
          // set translate
          t.forEach((value, index) => {
            t[index] = `calc(${value}px + (${getTranslateValue(data.translate[index])} * ${Math.abs(progress * multiplier)}))`;
          });
          // set rotates
          r.forEach((value, index) => {
            let val = data.rotate[index] * Math.abs(progress * multiplier);
            r[index] = val;
          });
          slideEl.style.zIndex = -Math.abs(Math.round(slideProgress)) + slides.length;
          const translateString = t.join(', ');
          const rotateString = `rotateX(${rotateFix(r[0])}deg) rotateY(${rotateFix(r[1])}deg) rotateZ(${rotateFix(r[2])}deg)`;
          const scaleString = originalProgress < 0 ? `scale(${1 + (1 - data.scale) * originalProgress * multiplier})` : `scale(${1 - (1 - data.scale) * originalProgress * multiplier})`;
          const opacityString = originalProgress < 0 ? 1 + (1 - data.opacity) * originalProgress * multiplier : 1 - (1 - data.opacity) * originalProgress * multiplier;
          const transform = `translate3d(${translateString}) ${rotateString} ${scaleString}`;

          // Set shadows
          if (custom && data.shadow || !custom) {
            let shadowEl = slideEl.querySelector('.swiper-slide-shadow');
            if (!shadowEl && data.shadow) {
              shadowEl = createShadow('creative', slideEl);
            }
            if (shadowEl) {
              const shadowOpacity = params.shadowPerProgress ? progress * (1 / params.limitProgress) : progress;
              shadowEl.style.opacity = Math.min(Math.max(Math.abs(shadowOpacity), 0), 1);
            }
          }
          const targetEl = effectTarget(params, slideEl);
          targetEl.style.transform = transform;
          targetEl.style.opacity = opacityString;
          if (data.origin) {
            targetEl.style.transformOrigin = data.origin;
          }
        }
      };
      const setTransition = duration => {
        const transformElements = swiper.slides.map(slideEl => getSlideTransformEl(slideEl));
        transformElements.forEach(el => {
          el.style.transitionDuration = `${duration}ms`;
          el.querySelectorAll('.swiper-slide-shadow').forEach(shadowEl => {
            shadowEl.style.transitionDuration = `${duration}ms`;
          });
        });
        effectVirtualTransitionEnd({
          swiper,
          duration,
          transformElements,
          allSlides: true
        });
      };
      effectInit({
        effect: 'creative',
        swiper,
        on,
        setTranslate,
        setTransition,
        perspective: () => swiper.params.creativeEffect.perspective,
        overwriteParams: () => ({
          watchSlidesProgress: true,
          virtualTranslate: !swiper.params.cssMode
        })
      });
    }

    function EffectCards({
      swiper,
      extendParams,
      on
    }) {
      extendParams({
        cardsEffect: {
          slideShadows: true,
          rotate: true,
          perSlideRotate: 2,
          perSlideOffset: 8
        }
      });
      const setTranslate = () => {
        const {
          slides,
          activeIndex,
          rtlTranslate: rtl
        } = swiper;
        const params = swiper.params.cardsEffect;
        const {
          startTranslate,
          isTouched
        } = swiper.touchEventsData;
        const currentTranslate = rtl ? -swiper.translate : swiper.translate;
        for (let i = 0; i < slides.length; i += 1) {
          const slideEl = slides[i];
          const slideProgress = slideEl.progress;
          const progress = Math.min(Math.max(slideProgress, -4), 4);
          let offset = slideEl.swiperSlideOffset;
          if (swiper.params.centeredSlides && !swiper.params.cssMode) {
            swiper.wrapperEl.style.transform = `translateX(${swiper.minTranslate()}px)`;
          }
          if (swiper.params.centeredSlides && swiper.params.cssMode) {
            offset -= slides[0].swiperSlideOffset;
          }
          let tX = swiper.params.cssMode ? -offset - swiper.translate : -offset;
          let tY = 0;
          const tZ = -100 * Math.abs(progress);
          let scale = 1;
          let rotate = -params.perSlideRotate * progress;
          let tXAdd = params.perSlideOffset - Math.abs(progress) * 0.75;
          const slideIndex = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.from + i : i;
          const isSwipeToNext = (slideIndex === activeIndex || slideIndex === activeIndex - 1) && progress > 0 && progress < 1 && (isTouched || swiper.params.cssMode) && currentTranslate < startTranslate;
          const isSwipeToPrev = (slideIndex === activeIndex || slideIndex === activeIndex + 1) && progress < 0 && progress > -1 && (isTouched || swiper.params.cssMode) && currentTranslate > startTranslate;
          if (isSwipeToNext || isSwipeToPrev) {
            const subProgress = (1 - Math.abs((Math.abs(progress) - 0.5) / 0.5)) ** 0.5;
            rotate += -28 * progress * subProgress;
            scale += -0.5 * subProgress;
            tXAdd += 96 * subProgress;
            tY = `${(params.rotate || swiper.isHorizontal() ? -25 : 0) * subProgress * Math.abs(progress)}%`;
          }
          if (progress < 0) {
            // next
            tX = `calc(${tX}px ${rtl ? '-' : '+'} (${tXAdd * Math.abs(progress)}%))`;
          } else if (progress > 0) {
            // prev
            tX = `calc(${tX}px ${rtl ? '-' : '+'} (-${tXAdd * Math.abs(progress)}%))`;
          } else {
            tX = `${tX}px`;
          }
          if (!swiper.isHorizontal()) {
            const prevY = tY;
            tY = tX;
            tX = prevY;
          }
          const scaleString = progress < 0 ? `${1 + (1 - scale) * progress}` : `${1 - (1 - scale) * progress}`;

          /* eslint-disable */
          const transform = `
        translate3d(${tX}, ${tY}, ${tZ}px)
        rotateZ(${params.rotate ? rtl ? -rotate : rotate : 0}deg)
        scale(${scaleString})
      `;
          /* eslint-enable */

          if (params.slideShadows) {
            // Set shadows
            let shadowEl = slideEl.querySelector('.swiper-slide-shadow');
            if (!shadowEl) {
              shadowEl = createShadow('cards', slideEl);
            }
            if (shadowEl) shadowEl.style.opacity = Math.min(Math.max((Math.abs(progress) - 0.5) / 0.5, 0), 1);
          }
          slideEl.style.zIndex = -Math.abs(Math.round(slideProgress)) + slides.length;
          const targetEl = effectTarget(params, slideEl);
          targetEl.style.transform = transform;
        }
      };
      const setTransition = duration => {
        const transformElements = swiper.slides.map(slideEl => getSlideTransformEl(slideEl));
        transformElements.forEach(el => {
          el.style.transitionDuration = `${duration}ms`;
          el.querySelectorAll('.swiper-slide-shadow').forEach(shadowEl => {
            shadowEl.style.transitionDuration = `${duration}ms`;
          });
        });
        effectVirtualTransitionEnd({
          swiper,
          duration,
          transformElements
        });
      };
      effectInit({
        effect: 'cards',
        swiper,
        on,
        setTranslate,
        setTransition,
        perspective: () => true,
        overwriteParams: () => ({
          _loopSwapReset: false,
          watchSlidesProgress: true,
          loopAdditionalSlides: swiper.params.cardsEffect.rotate ? 3 : 2,
          centeredSlides: true,
          virtualTranslate: !swiper.params.cssMode
        })
      });
    }

    // Swiper Class
    const modules = [Virtual, Keyboard, Mousewheel, Navigation, Pagination, Scrollbar, Parallax, Zoom, Controller, A11y, History, HashNavigation, Autoplay, Thumb, freeMode, Grid, Manipulation, EffectFade, EffectCube, EffectFlip, EffectCoverflow, EffectCreative, EffectCards];
    Swiper.use(modules);

    /* underscore in name -> watch for changes */
    const paramsList = ['eventsPrefix', 'injectStyles', 'injectStylesUrls', 'modules', 'init', '_direction', 'oneWayMovement', 'swiperElementNodeName', 'touchEventsTarget', 'initialSlide', '_speed', 'cssMode', 'updateOnWindowResize', 'resizeObserver', 'nested', 'focusableElements', '_enabled', '_width', '_height', 'preventInteractionOnTransition', 'userAgent', 'url', '_edgeSwipeDetection', '_edgeSwipeThreshold', '_freeMode', '_autoHeight', 'setWrapperSize', 'virtualTranslate', '_effect', 'breakpoints', 'breakpointsBase', '_spaceBetween', '_slidesPerView', 'maxBackfaceHiddenSlides', '_grid', '_slidesPerGroup', '_slidesPerGroupSkip', '_slidesPerGroupAuto', '_centeredSlides', '_centeredSlidesBounds', '_slidesOffsetBefore', '_slidesOffsetAfter', 'normalizeSlideIndex', '_centerInsufficientSlides', '_snapToSlideEdge', '_watchOverflow', 'roundLengths', 'touchRatio', 'touchAngle', 'simulateTouch', '_shortSwipes', '_longSwipes', 'longSwipesRatio', 'longSwipesMs', '_followFinger', 'allowTouchMove', '_threshold', 'touchMoveStopPropagation', 'touchStartPreventDefault', 'touchStartForcePreventDefault', 'touchReleaseOnEdges', 'uniqueNavElements', '_resistance', '_resistanceRatio', '_watchSlidesProgress', '_grabCursor', 'preventClicks', 'preventClicksPropagation', '_slideToClickedSlide', '_loop', 'loopAdditionalSlides', 'loopAddBlankSlides', 'loopPreventsSliding', '_rewind', '_allowSlidePrev', '_allowSlideNext', '_swipeHandler', '_noSwiping', 'noSwipingClass', 'noSwipingSelector', 'passiveListeners', 'containerModifierClass', 'slideClass', 'slideActiveClass', 'slideVisibleClass', 'slideFullyVisibleClass', 'slideNextClass', 'slidePrevClass', 'slideBlankClass', 'wrapperClass', 'lazyPreloaderClass', 'lazyPreloadPrevNext', 'runCallbacksOnInit', 'observer', 'observeParents', 'observeSlideChildren',
    // modules
    'a11y', '_autoplay', '_controller', 'coverflowEffect', 'cubeEffect', 'fadeEffect', 'flipEffect', 'creativeEffect', 'cardsEffect', 'hashNavigation', 'history', 'keyboard', 'mousewheel', '_navigation', '_pagination', 'parallax', '_scrollbar', '_thumbs', 'virtual', 'zoom', 'control'];

    function isObject(o) {
      return typeof o === 'object' && o !== null && o.constructor && Object.prototype.toString.call(o).slice(8, -1) === 'Object' && !o.__swiper__;
    }
    function extend(target, src) {
      const noExtend = ['__proto__', 'constructor', 'prototype'];
      Object.keys(src).filter(key => noExtend.indexOf(key) < 0).forEach(key => {
        if (typeof target[key] === 'undefined') target[key] = src[key];else if (isObject(src[key]) && isObject(target[key]) && Object.keys(src[key]).length > 0) {
          if (src[key].__swiper__) target[key] = src[key];else extend(target[key], src[key]);
        } else {
          target[key] = src[key];
        }
      });
    }
    function needsNavigation(params = {}) {
      return params.navigation && typeof params.navigation.nextEl === 'undefined' && typeof params.navigation.prevEl === 'undefined';
    }
    function needsPagination(params = {}) {
      return params.pagination && typeof params.pagination.el === 'undefined';
    }
    function needsScrollbar(params = {}) {
      return params.scrollbar && typeof params.scrollbar.el === 'undefined';
    }
    function attrToProp(attrName = '') {
      return attrName.replace(/-[a-z]/g, l => l.toUpperCase().replace('-', ''));
    }

    function updateSwiper({
      swiper,
      slides,
      passedParams,
      changedParams,
      nextEl,
      prevEl,
      scrollbarEl,
      paginationEl
    }) {
      const updateParams = changedParams.filter(key => key !== 'children' && key !== 'direction' && key !== 'wrapperClass');
      const {
        params: currentParams,
        pagination,
        navigation,
        scrollbar,
        virtual,
        thumbs
      } = swiper;
      let needThumbsInit;
      let needControllerInit;
      let needPaginationInit;
      let needScrollbarInit;
      let needNavigationInit;
      let loopNeedDestroy;
      let loopNeedEnable;
      let loopNeedReloop;
      if (changedParams.includes('thumbs') && passedParams.thumbs && passedParams.thumbs.swiper && !passedParams.thumbs.swiper.destroyed && currentParams.thumbs && (!currentParams.thumbs.swiper || currentParams.thumbs.swiper.destroyed)) {
        needThumbsInit = true;
      }
      if (changedParams.includes('controller') && passedParams.controller && passedParams.controller.control && currentParams.controller && !currentParams.controller.control) {
        needControllerInit = true;
      }
      if (changedParams.includes('pagination') && passedParams.pagination && (passedParams.pagination.el || paginationEl) && (currentParams.pagination || currentParams.pagination === false) && pagination && !pagination.el) {
        needPaginationInit = true;
      }
      if (changedParams.includes('scrollbar') && passedParams.scrollbar && (passedParams.scrollbar.el || scrollbarEl) && (currentParams.scrollbar || currentParams.scrollbar === false) && scrollbar && !scrollbar.el) {
        needScrollbarInit = true;
      }
      if (changedParams.includes('navigation') && passedParams.navigation && (passedParams.navigation.prevEl || prevEl) && (passedParams.navigation.nextEl || nextEl) && (currentParams.navigation || currentParams.navigation === false) && navigation && !navigation.prevEl && !navigation.nextEl) {
        needNavigationInit = true;
      }
      const destroyModule = mod => {
        if (!swiper[mod]) return;
        swiper[mod].destroy();
        if (mod === 'navigation') {
          if (swiper.isElement) {
            swiper[mod].prevEl.remove();
            swiper[mod].nextEl.remove();
          }
          currentParams[mod].prevEl = undefined;
          currentParams[mod].nextEl = undefined;
          swiper[mod].prevEl = undefined;
          swiper[mod].nextEl = undefined;
        } else {
          if (swiper.isElement) {
            swiper[mod].el.remove();
          }
          currentParams[mod].el = undefined;
          swiper[mod].el = undefined;
        }
      };
      if (changedParams.includes('loop') && swiper.isElement) {
        if (currentParams.loop && !passedParams.loop) {
          loopNeedDestroy = true;
        } else if (!currentParams.loop && passedParams.loop) {
          loopNeedEnable = true;
        } else {
          loopNeedReloop = true;
        }
      }
      updateParams.forEach(key => {
        if (isObject(currentParams[key]) && isObject(passedParams[key])) {
          Object.assign(currentParams[key], passedParams[key]);
          if ((key === 'navigation' || key === 'pagination' || key === 'scrollbar') && 'enabled' in passedParams[key] && !passedParams[key].enabled) {
            destroyModule(key);
          }
        } else {
          const newValue = passedParams[key];
          if ((newValue === true || newValue === false) && (key === 'navigation' || key === 'pagination' || key === 'scrollbar')) {
            if (newValue === false) {
              destroyModule(key);
            }
          } else {
            currentParams[key] = passedParams[key];
          }
        }
      });
      if (updateParams.includes('controller') && !needControllerInit && swiper.controller && swiper.controller.control && currentParams.controller && currentParams.controller.control) {
        swiper.controller.control = currentParams.controller.control;
      }
      if (changedParams.includes('children') && slides && virtual && currentParams.virtual.enabled) {
        virtual.slides = slides;
        virtual.update(true);
      } else if (changedParams.includes('virtual') && virtual && currentParams.virtual.enabled) {
        if (slides) virtual.slides = slides;
        virtual.update(true);
      }
      if (changedParams.includes('children') && slides && currentParams.loop) {
        loopNeedReloop = true;
      }
      if (needThumbsInit) {
        const initialized = thumbs.init();
        if (initialized) thumbs.update(true);
      }
      if (needControllerInit) {
        swiper.controller.control = currentParams.controller.control;
      }
      if (needPaginationInit) {
        if (swiper.isElement && (!paginationEl || typeof paginationEl === 'string')) {
          paginationEl = document.createElement('div');
          paginationEl.classList.add('swiper-pagination');
          paginationEl.part.add('pagination');
          swiper.el.appendChild(paginationEl);
        }
        if (paginationEl) currentParams.pagination.el = paginationEl;
        pagination.init();
        pagination.render();
        pagination.update();
      }
      if (needScrollbarInit) {
        if (swiper.isElement && (!scrollbarEl || typeof scrollbarEl === 'string')) {
          scrollbarEl = document.createElement('div');
          scrollbarEl.classList.add('swiper-scrollbar');
          scrollbarEl.part.add('scrollbar');
          swiper.el.appendChild(scrollbarEl);
        }
        if (scrollbarEl) currentParams.scrollbar.el = scrollbarEl;
        scrollbar.init();
        scrollbar.updateSize();
        scrollbar.setTranslate();
      }
      if (needNavigationInit) {
        if (swiper.isElement) {
          if (!nextEl || typeof nextEl === 'string') {
            nextEl = document.createElement('div');
            nextEl.classList.add('swiper-button-next');
            setInnerHTML(nextEl, swiper.navigation.arrowSvg);
            nextEl.part.add('button-next');
            swiper.el.appendChild(nextEl);
          }
          if (!prevEl || typeof prevEl === 'string') {
            prevEl = document.createElement('div');
            prevEl.classList.add('swiper-button-prev');
            setInnerHTML(prevEl, swiper.navigation.arrowSvg);
            prevEl.part.add('button-prev');
            swiper.el.appendChild(prevEl);
          }
        }
        if (nextEl) currentParams.navigation.nextEl = nextEl;
        if (prevEl) currentParams.navigation.prevEl = prevEl;
        navigation.init();
        navigation.update();
      }
      if (changedParams.includes('allowSlideNext')) {
        swiper.allowSlideNext = passedParams.allowSlideNext;
      }
      if (changedParams.includes('allowSlidePrev')) {
        swiper.allowSlidePrev = passedParams.allowSlidePrev;
      }
      if (changedParams.includes('direction')) {
        swiper.changeDirection(passedParams.direction, false);
      }
      if (loopNeedDestroy || loopNeedReloop) {
        swiper.loopDestroy();
      }
      if (loopNeedEnable || loopNeedReloop) {
        swiper.loopCreate();
      }
      swiper.update();
    }

    const formatValue = val => {
      if (parseFloat(val) === Number(val)) return Number(val);
      if (val === 'true') return true;
      if (val === '') return true;
      if (val === 'false') return false;
      if (val === 'null') return null;
      if (val === 'undefined') return undefined;
      if (typeof val === 'string' && val.includes('{') && val.includes('}') && val.includes('"')) {
        let v;
        try {
          v = JSON.parse(val);
        } catch (err) {
          v = val;
        }
        return v;
      }
      return val;
    };
    const modulesParamsList = ['a11y', 'autoplay', 'controller', 'cards-effect', 'coverflow-effect', 'creative-effect', 'cube-effect', 'fade-effect', 'flip-effect', 'free-mode', 'grid', 'hash-navigation', 'history', 'keyboard', 'mousewheel', 'navigation', 'pagination', 'parallax', 'scrollbar', 'thumbs', 'virtual', 'zoom'];
    function getParams(element, propName, propValue) {
      const params = {};
      const passedParams = {};
      extend(params, defaults);
      const localParamsList = [...paramsList, 'on'];
      const allowedParams = localParamsList.map(key => key.replace(/_/, ''));

      // First check props
      localParamsList.forEach(paramName => {
        paramName = paramName.replace('_', '');
        if (typeof element[paramName] !== 'undefined') {
          passedParams[paramName] = element[paramName];
        }
      });

      // Attributes
      const attrsList = [...element.attributes];
      if (typeof propName === 'string' && typeof propValue !== 'undefined') {
        attrsList.push({
          name: propName,
          value: isObject(propValue) ? {
            ...propValue
          } : propValue
        });
      }
      attrsList.forEach(attr => {
        const moduleParam = modulesParamsList.find(mParam => attr.name.startsWith(`${mParam}-`));
        if (moduleParam) {
          const parentObjName = attrToProp(moduleParam);
          const subObjName = attrToProp(attr.name.split(`${moduleParam}-`)[1]);
          if (typeof passedParams[parentObjName] === 'undefined') {
            passedParams[parentObjName] = {};
          }
          if (passedParams[parentObjName] === true) {
            passedParams[parentObjName] = {
              enabled: true
            };
          }
          if (passedParams[parentObjName] === false) {
            passedParams[parentObjName] = {
              enabled: false
            };
          }
          passedParams[parentObjName][subObjName] = formatValue(attr.value);
        } else {
          const name = attrToProp(attr.name);
          if (!allowedParams.includes(name)) return;
          const value = formatValue(attr.value);
          if (passedParams[name] && modulesParamsList.includes(attr.name) && !isObject(value)) {
            if (passedParams[name].constructor !== Object) {
              passedParams[name] = {};
            }
            passedParams[name].enabled = !!value;
          } else {
            passedParams[name] = value;
          }
        }
      });
      extend(params, passedParams);
      if (params.navigation) {
        params.navigation = {
          prevEl: '.swiper-button-prev',
          nextEl: '.swiper-button-next',
          ...(params.navigation !== true ? params.navigation : {})
        };
      } else if (params.navigation === false) {
        delete params.navigation;
      }
      if (params.scrollbar) {
        params.scrollbar = {
          el: '.swiper-scrollbar',
          ...(params.scrollbar !== true ? params.scrollbar : {})
        };
      } else if (params.scrollbar === false) {
        delete params.scrollbar;
      }
      if (params.pagination) {
        params.pagination = {
          el: '.swiper-pagination',
          ...(params.pagination !== true ? params.pagination : {})
        };
      } else if (params.pagination === false) {
        delete params.pagination;
      }
      return {
        params,
        passedParams
      };
    }

    /* eslint-disable spaced-comment */

    const SwiperCSS = `:host{--swiper-theme-color:#007aff}:host{display:block;margin-left:auto;margin-right:auto;position:relative;z-index:1}.swiper{display:block;height:100%;list-style:none;margin-left:auto;margin-right:auto;overflow:hidden;padding:0;position:relative;width:100%;z-index:1}.swiper-vertical>.swiper-wrapper{flex-direction:column}.swiper-wrapper{box-sizing:initial;display:flex;height:100%;position:relative;transition-property:transform;transition-timing-function:var(--swiper-wrapper-transition-timing-function,initial);width:100%;z-index:1}.swiper-android ::slotted(swiper-slide),.swiper-ios ::slotted(swiper-slide),.swiper-wrapper{transform:translateZ(0)}.swiper-horizontal{touch-action:pan-y}.swiper-vertical{touch-action:pan-x}::slotted(swiper-slide){display:block;flex-shrink:0;height:100%;position:relative;transition-property:transform;width:100%}::slotted(.swiper-slide-invisible-blank){visibility:hidden}.swiper-autoheight,.swiper-autoheight ::slotted(swiper-slide){height:auto}.swiper-autoheight .swiper-wrapper{align-items:flex-start;transition-property:transform,height}.swiper-backface-hidden ::slotted(swiper-slide){backface-visibility:hidden;transform:translateZ(0)}.swiper-3d.swiper-css-mode .swiper-wrapper{perspective:1200px}.swiper-3d .swiper-wrapper{transform-style:preserve-3d}.swiper-3d{perspective:1200px}.swiper-3d .swiper-cube-shadow,.swiper-3d ::slotted(swiper-slide){transform-style:preserve-3d}.swiper-css-mode>.swiper-wrapper{overflow:auto;scrollbar-width:none;-ms-overflow-style:none}.swiper-css-mode>.swiper-wrapper::-webkit-scrollbar{display:none}.swiper-css-mode ::slotted(swiper-slide){scroll-snap-align:start start}.swiper-css-mode.swiper-horizontal>.swiper-wrapper{scroll-snap-type:x mandatory}.swiper-css-mode.swiper-horizontal ::slotted(swiper-slide):first-child{margin-inline-start:var(--swiper-slides-offset-before);scroll-margin-inline-start:var(--swiper-slides-offset-before)}.swiper-css-mode.swiper-horizontal ::slotted(swiper-slide):last-child{margin-inline-end:var(--swiper-slides-offset-after)}.swiper-css-mode.swiper-vertical>.swiper-wrapper{scroll-snap-type:y mandatory}.swiper-css-mode.swiper-vertical ::slotted(swiper-slide):first-child{margin-block-start:var(--swiper-slides-offset-before);scroll-margin-block-start:var(--swiper-slides-offset-before)}.swiper-css-mode.swiper-vertical ::slotted(swiper-slide):last-child{margin-block-end:var(--swiper-slides-offset-after)}.swiper-css-mode.swiper-free-mode>.swiper-wrapper{scroll-snap-type:none}.swiper-css-mode.swiper-free-mode ::slotted(swiper-slide){scroll-snap-align:none}.swiper-css-mode.swiper-centered>.swiper-wrapper:before{content:"";flex-shrink:0;order:9999}.swiper-css-mode.swiper-centered ::slotted(swiper-slide){scroll-snap-align:center center;scroll-snap-stop:always}.swiper-css-mode.swiper-centered.swiper-horizontal ::slotted(swiper-slide):first-child{margin-inline-start:var(--swiper-centered-offset-before)}.swiper-css-mode.swiper-centered.swiper-horizontal>.swiper-wrapper:before{height:100%;min-height:1px;width:var(--swiper-centered-offset-after)}.swiper-css-mode.swiper-centered.swiper-vertical ::slotted(swiper-slide):first-child{margin-block-start:var(--swiper-centered-offset-before)}.swiper-css-mode.swiper-centered.swiper-vertical>.swiper-wrapper:before{height:var(--swiper-centered-offset-after);min-width:1px;width:100%}.swiper-virtual ::slotted(swiper-slide){-webkit-backface-visibility:hidden;transform:translateZ(0)}.swiper-virtual.swiper-css-mode .swiper-wrapper:after{content:"";left:0;pointer-events:none;position:absolute;top:0}.swiper-virtual.swiper-css-mode.swiper-horizontal .swiper-wrapper:after{height:1px;width:var(--swiper-virtual-size)}.swiper-virtual.swiper-css-mode.swiper-vertical .swiper-wrapper:after{height:var(--swiper-virtual-size);width:1px}:host{--swiper-navigation-size:44px}.swiper-button-next,.swiper-button-prev{align-items:center;color:var(--swiper-navigation-color,var(--swiper-theme-color));cursor:pointer;display:flex;height:var(--swiper-navigation-size);justify-content:center;position:absolute;width:var(--swiper-navigation-size);z-index:10}.swiper-button-next.swiper-button-disabled,.swiper-button-prev.swiper-button-disabled{cursor:auto;opacity:.35;pointer-events:none}.swiper-button-next.swiper-button-hidden,.swiper-button-prev.swiper-button-hidden{cursor:auto;opacity:0;pointer-events:none}.swiper-navigation-disabled .swiper-button-next,.swiper-navigation-disabled .swiper-button-prev{display:none!important}.swiper-button-next svg,.swiper-button-prev svg{height:100%;object-fit:contain;transform-origin:center;width:100%;fill:currentColor;pointer-events:none}.swiper-button-lock{display:none}.swiper-button-next,.swiper-button-prev{margin-top:calc(0px - var(--swiper-navigation-size)/2);top:var(--swiper-navigation-top-offset,50%)}.swiper-button-prev{left:var(--swiper-navigation-sides-offset,4px);right:auto}.swiper-button-prev .swiper-navigation-icon{transform:rotate(180deg)}.swiper-button-next{left:auto;right:var(--swiper-navigation-sides-offset,4px)}.swiper-horizontal .swiper-button-next,.swiper-horizontal .swiper-button-prev,.swiper-horizontal~.swiper-button-next,.swiper-horizontal~.swiper-button-prev{margin-left:0;margin-top:calc(0px - var(--swiper-navigation-size)/2);top:var(--swiper-navigation-top-offset,50%)}.swiper-horizontal .swiper-button-prev,.swiper-horizontal.swiper-rtl .swiper-button-next,.swiper-horizontal.swiper-rtl~.swiper-button-next,.swiper-horizontal~.swiper-button-prev{left:var(--swiper-navigation-sides-offset,4px);right:auto}.swiper-horizontal .swiper-button-next,.swiper-horizontal.swiper-rtl .swiper-button-prev,.swiper-horizontal.swiper-rtl~.swiper-button-prev,.swiper-horizontal~.swiper-button-next{left:auto;right:var(--swiper-navigation-sides-offset,4px)}.swiper-horizontal .swiper-button-prev .swiper-navigation-icon,.swiper-horizontal.swiper-rtl .swiper-button-next .swiper-navigation-icon,.swiper-horizontal.swiper-rtl~.swiper-button-next .swiper-navigation-icon,.swiper-horizontal~.swiper-button-prev .swiper-navigation-icon{transform:rotate(180deg)}.swiper-horizontal.swiper-rtl .swiper-button-prev .swiper-navigation-icon,.swiper-horizontal.swiper-rtl~.swiper-button-prev .swiper-navigation-icon{transform:rotate(0deg)}.swiper-vertical .swiper-button-next,.swiper-vertical .swiper-button-prev,.swiper-vertical~.swiper-button-next,.swiper-vertical~.swiper-button-prev{left:var(--swiper-navigation-top-offset,50%);margin-left:calc(0px - var(--swiper-navigation-size)/2);margin-top:0;right:auto}.swiper-vertical .swiper-button-prev,.swiper-vertical~.swiper-button-prev{bottom:auto;top:var(--swiper-navigation-sides-offset,4px)}.swiper-vertical .swiper-button-prev .swiper-navigation-icon,.swiper-vertical~.swiper-button-prev .swiper-navigation-icon{transform:rotate(-90deg)}.swiper-vertical .swiper-button-next,.swiper-vertical~.swiper-button-next{bottom:var(--swiper-navigation-sides-offset,4px);top:auto}.swiper-vertical .swiper-button-next .swiper-navigation-icon,.swiper-vertical~.swiper-button-next .swiper-navigation-icon{transform:rotate(90deg)}.swiper-pagination{position:absolute;text-align:center;transform:translateZ(0);transition:opacity .3s;z-index:10}.swiper-pagination.swiper-pagination-hidden{opacity:0}.swiper-pagination-disabled>.swiper-pagination,.swiper-pagination.swiper-pagination-disabled{display:none!important}.swiper-horizontal>.swiper-pagination-bullets,.swiper-pagination-bullets.swiper-pagination-horizontal,.swiper-pagination-custom,.swiper-pagination-fraction{bottom:var(--swiper-pagination-bottom,8px);left:0;top:var(--swiper-pagination-top,auto);width:100%}.swiper-pagination-bullets-dynamic{font-size:0;overflow:hidden}.swiper-pagination-bullets-dynamic .swiper-pagination-bullet{position:relative;transform:scale(.33)}.swiper-pagination-bullets-dynamic .swiper-pagination-bullet-active,.swiper-pagination-bullets-dynamic .swiper-pagination-bullet-active-main{transform:scale(1)}.swiper-pagination-bullets-dynamic .swiper-pagination-bullet-active-prev{transform:scale(.66)}.swiper-pagination-bullets-dynamic .swiper-pagination-bullet-active-prev-prev{transform:scale(.33)}.swiper-pagination-bullets-dynamic .swiper-pagination-bullet-active-next{transform:scale(.66)}.swiper-pagination-bullets-dynamic .swiper-pagination-bullet-active-next-next{transform:scale(.33)}.swiper-pagination-bullet{background:var(--swiper-pagination-bullet-inactive-color,#000);border-radius:var(--swiper-pagination-bullet-border-radius,50%);display:inline-block;height:var(--swiper-pagination-bullet-height,var(--swiper-pagination-bullet-size,8px));opacity:var(--swiper-pagination-bullet-inactive-opacity,.2);width:var(--swiper-pagination-bullet-width,var(--swiper-pagination-bullet-size,8px))}button.swiper-pagination-bullet{appearance:none;border:none;box-shadow:none;margin:0;padding:0}.swiper-pagination-clickable .swiper-pagination-bullet{cursor:pointer}.swiper-pagination-bullet:only-child{display:none!important}.swiper-pagination-bullet-active{background:var(--swiper-pagination-color,var(--swiper-theme-color));opacity:var(--swiper-pagination-bullet-opacity,1)}.swiper-pagination-vertical.swiper-pagination-bullets,.swiper-vertical>.swiper-pagination-bullets{left:var(--swiper-pagination-left,auto);right:var(--swiper-pagination-right,8px);top:50%;transform:translate3d(0,-50%,0)}.swiper-pagination-vertical.swiper-pagination-bullets .swiper-pagination-bullet,.swiper-vertical>.swiper-pagination-bullets .swiper-pagination-bullet{display:block;margin:var(--swiper-pagination-bullet-vertical-gap,6px) 0}.swiper-pagination-vertical.swiper-pagination-bullets.swiper-pagination-bullets-dynamic,.swiper-vertical>.swiper-pagination-bullets.swiper-pagination-bullets-dynamic{top:50%;transform:translateY(-50%);width:8px}.swiper-pagination-vertical.swiper-pagination-bullets.swiper-pagination-bullets-dynamic .swiper-pagination-bullet,.swiper-vertical>.swiper-pagination-bullets.swiper-pagination-bullets-dynamic .swiper-pagination-bullet{display:inline-block;transition:transform .2s,top .2s}.swiper-horizontal>.swiper-pagination-bullets .swiper-pagination-bullet,.swiper-pagination-horizontal.swiper-pagination-bullets .swiper-pagination-bullet{margin:0 var(--swiper-pagination-bullet-horizontal-gap,4px)}.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-bullets-dynamic,.swiper-pagination-horizontal.swiper-pagination-bullets.swiper-pagination-bullets-dynamic{left:50%;transform:translateX(-50%);white-space:nowrap}.swiper-horizontal>.swiper-pagination-bullets.swiper-pagination-bullets-dynamic .swiper-pagination-bullet,.swiper-pagination-horizontal.swiper-pagination-bullets.swiper-pagination-bullets-dynamic .swiper-pagination-bullet{transition:transform .2s,left .2s}.swiper-horizontal.swiper-rtl>.swiper-pagination-bullets-dynamic .swiper-pagination-bullet{transition:transform .2s,right .2s}.swiper-pagination-fraction{color:var(--swiper-pagination-fraction-color,inherit)}.swiper-pagination-progressbar{background:var(--swiper-pagination-progressbar-bg-color,#00000040);position:absolute}.swiper-pagination-progressbar .swiper-pagination-progressbar-fill{background:var(--swiper-pagination-color,var(--swiper-theme-color));height:100%;left:0;position:absolute;top:0;transform:scale(0);transform-origin:left top;width:100%}.swiper-rtl .swiper-pagination-progressbar .swiper-pagination-progressbar-fill{transform-origin:right top}.swiper-horizontal>.swiper-pagination-progressbar,.swiper-pagination-progressbar.swiper-pagination-horizontal,.swiper-pagination-progressbar.swiper-pagination-vertical.swiper-pagination-progressbar-opposite,.swiper-vertical>.swiper-pagination-progressbar.swiper-pagination-progressbar-opposite{height:var(--swiper-pagination-progressbar-size,4px);left:0;top:0;width:100%}.swiper-horizontal>.swiper-pagination-progressbar.swiper-pagination-progressbar-opposite,.swiper-pagination-progressbar.swiper-pagination-horizontal.swiper-pagination-progressbar-opposite,.swiper-pagination-progressbar.swiper-pagination-vertical,.swiper-vertical>.swiper-pagination-progressbar{height:100%;left:0;top:0;width:var(--swiper-pagination-progressbar-size,4px)}.swiper-pagination-lock{display:none}.swiper-scrollbar{background:var(--swiper-scrollbar-bg-color,#0000001a);border-radius:var(--swiper-scrollbar-border-radius,10px);position:relative;touch-action:none}.swiper-scrollbar-disabled>.swiper-scrollbar,.swiper-scrollbar.swiper-scrollbar-disabled{display:none!important}.swiper-horizontal>.swiper-scrollbar,.swiper-scrollbar.swiper-scrollbar-horizontal{bottom:var(--swiper-scrollbar-bottom,4px);height:var(--swiper-scrollbar-size,4px);left:var(--swiper-scrollbar-sides-offset,1%);position:absolute;top:var(--swiper-scrollbar-top,auto);width:calc(100% - var(--swiper-scrollbar-sides-offset, 1%)*2);z-index:50}.swiper-scrollbar.swiper-scrollbar-vertical,.swiper-vertical>.swiper-scrollbar{height:calc(100% - var(--swiper-scrollbar-sides-offset, 1%)*2);left:var(--swiper-scrollbar-left,auto);position:absolute;right:var(--swiper-scrollbar-right,4px);top:var(--swiper-scrollbar-sides-offset,1%);width:var(--swiper-scrollbar-size,4px);z-index:50}.swiper-scrollbar-drag{background:var(--swiper-scrollbar-drag-bg-color,#00000080);border-radius:var(--swiper-scrollbar-border-radius,10px);height:100%;left:0;position:relative;top:0;width:100%}.swiper-scrollbar-cursor-drag{cursor:move}.swiper-scrollbar-lock{display:none}::slotted(.swiper-slide-zoomed){cursor:move;touch-action:none}.swiper .swiper-notification{left:0;opacity:0;pointer-events:none;position:absolute;top:0;z-index:-1000}.swiper-free-mode>.swiper-wrapper{margin:0 auto;transition-timing-function:ease-out}.swiper-grid>.swiper-wrapper{flex-wrap:wrap}.swiper-grid-column>.swiper-wrapper{flex-direction:column;flex-wrap:wrap}.swiper-fade.swiper-free-mode ::slotted(swiper-slide){transition-timing-function:ease-out}.swiper-fade ::slotted(swiper-slide){pointer-events:none;transition-property:opacity}.swiper-fade ::slotted(swiper-slide) ::slotted(swiper-slide){pointer-events:none}.swiper-fade ::slotted(.swiper-slide-active){pointer-events:auto}.swiper-fade ::slotted(.swiper-slide-active) ::slotted(.swiper-slide-active){pointer-events:auto}.swiper.swiper-cube{overflow:visible}.swiper-cube ::slotted(swiper-slide){backface-visibility:hidden;height:100%;pointer-events:none;transform-origin:0 0;visibility:hidden;width:100%;z-index:1}.swiper-cube ::slotted(swiper-slide) ::slotted(swiper-slide){pointer-events:none}.swiper-cube.swiper-rtl ::slotted(swiper-slide){transform-origin:100% 0}.swiper-cube ::slotted(.swiper-slide-active),.swiper-cube ::slotted(.swiper-slide-active) ::slotted(.swiper-slide-active){pointer-events:auto}.swiper-cube ::slotted(.swiper-slide-active),.swiper-cube ::slotted(.swiper-slide-next),.swiper-cube ::slotted(.swiper-slide-prev){pointer-events:auto;visibility:visible}.swiper-cube .swiper-cube-shadow{bottom:0;height:100%;left:0;opacity:.6;position:absolute;width:100%;z-index:0}.swiper-cube .swiper-cube-shadow:before{background:#000;bottom:0;content:"";filter:blur(50px);left:0;position:absolute;right:0;top:0}.swiper-cube ::slotted(.swiper-slide-next)+::slotted(swiper-slide){pointer-events:auto;visibility:visible}.swiper.swiper-flip{overflow:visible}.swiper-flip ::slotted(swiper-slide){backface-visibility:hidden;pointer-events:none;z-index:1}.swiper-flip ::slotted(swiper-slide) ::slotted(swiper-slide){pointer-events:none}.swiper-flip ::slotted(.swiper-slide-active),.swiper-flip ::slotted(.swiper-slide-active) ::slotted(.swiper-slide-active){pointer-events:auto}.swiper-creative ::slotted(swiper-slide){backface-visibility:hidden;overflow:hidden;transition-property:transform,opacity,height}.swiper.swiper-cards{overflow:visible}.swiper-cards ::slotted(swiper-slide){backface-visibility:hidden;overflow:hidden;transform-origin:center bottom}`;
    const SwiperSlideCSS = `::slotted(.swiper-slide-shadow),::slotted(.swiper-slide-shadow-bottom),::slotted(.swiper-slide-shadow-left),::slotted(.swiper-slide-shadow-right),::slotted(.swiper-slide-shadow-top){height:100%;left:0;pointer-events:none;position:absolute;top:0;width:100%;z-index:10}::slotted(.swiper-slide-shadow){background:#00000026}::slotted(.swiper-slide-shadow-left){background-image:linear-gradient(270deg,#00000080,#0000)}::slotted(.swiper-slide-shadow-right){background-image:linear-gradient(90deg,#00000080,#0000)}::slotted(.swiper-slide-shadow-top){background-image:linear-gradient(0deg,#00000080,#0000)}::slotted(.swiper-slide-shadow-bottom){background-image:linear-gradient(180deg,#00000080,#0000)}.swiper-lazy-preloader{animation:swiper-preloader-spin 1s linear infinite;border:4px solid var(--swiper-preloader-color,var(--swiper-theme-color));border-radius:50%;border-top:4px solid #0000;box-sizing:border-box;height:42px;left:50%;margin-left:-21px;margin-top:-21px;position:absolute;top:50%;transform-origin:50%;width:42px;z-index:10}@keyframes swiper-preloader-spin{0%{transform:rotate(0deg)}to{transform:rotate(1turn)}}::slotted(.swiper-slide-shadow-cube.swiper-slide-shadow-bottom),::slotted(.swiper-slide-shadow-cube.swiper-slide-shadow-left),::slotted(.swiper-slide-shadow-cube.swiper-slide-shadow-right),::slotted(.swiper-slide-shadow-cube.swiper-slide-shadow-top){backface-visibility:hidden;z-index:0}::slotted(.swiper-slide-shadow-flip.swiper-slide-shadow-bottom),::slotted(.swiper-slide-shadow-flip.swiper-slide-shadow-left),::slotted(.swiper-slide-shadow-flip.swiper-slide-shadow-right),::slotted(.swiper-slide-shadow-flip.swiper-slide-shadow-top){backface-visibility:hidden;z-index:0}::slotted(.swiper-zoom-container){align-items:center;display:flex;height:100%;justify-content:center;text-align:center;width:100%}::slotted(.swiper-zoom-container)>canvas,::slotted(.swiper-zoom-container)>img,::slotted(.swiper-zoom-container)>svg{max-height:100%;max-width:100%;object-fit:contain}`;

    class DummyHTMLElement {}
    const ClassToExtend = typeof window === 'undefined' || typeof HTMLElement === 'undefined' ? DummyHTMLElement : HTMLElement;
    const addStyle = (shadowRoot, styles) => {
      if (typeof CSSStyleSheet !== 'undefined' && shadowRoot.adoptedStyleSheets) {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(styles);
        shadowRoot.adoptedStyleSheets = [styleSheet];
      } else {
        const style = document.createElement('style');
        style.rel = 'stylesheet';
        style.textContent = styles;
        shadowRoot.appendChild(style);
      }
    };
    class SwiperContainer extends ClassToExtend {
      constructor() {
        super();
        this.attachShadow({
          mode: 'open'
        });
      }
      cssStyles() {
        return [SwiperCSS,
        // eslint-disable-line
        ...(this.injectStyles && Array.isArray(this.injectStyles) ? this.injectStyles : [])].join('\n');
      }
      cssLinks() {
        return this.injectStylesUrls || [];
      }
      calcSlideSlots() {
        const currentSideSlots = this.slideSlots || 0;
        // slide slots
        const slideSlotChildren = [...this.querySelectorAll(`[slot^=slide-]`)].map(child => {
          return parseInt(child.getAttribute('slot').split('slide-')[1], 10);
        });
        this.slideSlots = slideSlotChildren.length ? Math.max(...slideSlotChildren) + 1 : 0;
        if (!this.rendered) return;
        if (this.slideSlots > currentSideSlots) {
          for (let i = currentSideSlots; i < this.slideSlots; i += 1) {
            const slideEl = document.createElement('swiper-slide');
            slideEl.setAttribute('part', `slide slide-${i + 1}`);
            const slotEl = document.createElement('slot');
            slotEl.setAttribute('name', `slide-${i + 1}`);
            slideEl.appendChild(slotEl);
            this.shadowRoot.querySelector('.swiper-wrapper').appendChild(slideEl);
          }
        } else if (this.slideSlots < currentSideSlots) {
          const slides = this.swiper.slides;
          for (let i = slides.length - 1; i >= 0; i -= 1) {
            if (i > this.slideSlots) {
              slides[i].remove();
            }
          }
        }
      }
      render() {
        if (this.rendered) return;
        this.calcSlideSlots();

        // local styles
        let localStyles = this.cssStyles();
        if (this.slideSlots > 0) {
          localStyles = localStyles.replace(/::slotted\(([a-z-0-9.]*)\)/g, '$1');
        }
        if (localStyles.length) {
          addStyle(this.shadowRoot, localStyles);
        }
        this.cssLinks().forEach(url => {
          const linkExists = this.shadowRoot.querySelector(`link[href="${url}"]`);
          if (linkExists) return;
          const linkEl = document.createElement('link');
          linkEl.rel = 'stylesheet';
          linkEl.href = url;
          this.shadowRoot.appendChild(linkEl);
        });
        // prettier-ignore
        const el = document.createElement('div');
        el.classList.add('swiper');
        el.part = 'container';

        // prettier-ignore
        setInnerHTML(el, `
      <slot name="container-start"></slot>
      <div class="swiper-wrapper" part="wrapper">
        <slot></slot>
        ${Array.from({
      length: this.slideSlots
    }).map((_, index) => `
        <swiper-slide part="slide slide-${index}">
          <slot name="slide-${index}"></slot>
        </swiper-slide>
        `).join('')}
      </div>
      <slot name="container-end"></slot>
      ${needsNavigation(this.passedParams) ? `
        <div part="button-prev" class="swiper-button-prev"></div>
        <div part="button-next" class="swiper-button-next"></div>
      ` : ''}
      ${needsPagination(this.passedParams) ? `
        <div part="pagination" class="swiper-pagination"></div>
      ` : ''}
      ${needsScrollbar(this.passedParams) ? `
        <div part="scrollbar" class="swiper-scrollbar"></div>
      ` : ''}
    `);
        this.shadowRoot.appendChild(el);
        this.rendered = true;
      }
      initialize() {
        if (this.swiper && this.swiper.initialized) return;
        const {
          params: swiperParams,
          passedParams
        } = getParams(this);
        this.swiperParams = swiperParams;
        this.passedParams = passedParams;
        delete this.swiperParams.init;
        this.render();

        // eslint-disable-next-line
        this.swiper = new Swiper(this.shadowRoot.querySelector('.swiper'), {
          ...(swiperParams.virtual ? {} : {
            observer: true
          }),
          ...swiperParams,
          touchEventsTarget: 'container',
          onAny: (name, ...args) => {
            if (name === 'observerUpdate') {
              this.calcSlideSlots();
            }
            const eventName = swiperParams.eventsPrefix ? `${swiperParams.eventsPrefix}${name.toLowerCase()}` : name.toLowerCase();
            const event = new CustomEvent(eventName, {
              detail: args,
              bubbles: name !== 'hashChange',
              cancelable: true
            });
            this.dispatchEvent(event);
          }
        });
      }
      connectedCallback() {
        if (this.swiper && this.swiper.initialized && this.nested && this.closest('swiper-slide') && this.closest('swiper-slide').swiperLoopMoveDOM) {
          return;
        }
        if (this.init === false || this.getAttribute('init') === 'false') {
          return;
        }
        this.initialize();
      }
      disconnectedCallback() {
        if (this.nested && this.closest('swiper-slide') && this.closest('swiper-slide').swiperLoopMoveDOM) {
          return;
        }
        if (this.swiper && this.swiper.destroy) {
          this.swiper.destroy();
        }
      }
      updateSwiperOnPropChange(propName, propValue) {
        const {
          params: swiperParams,
          passedParams
        } = getParams(this, propName, propValue);
        this.passedParams = passedParams;
        this.swiperParams = swiperParams;
        if (this.swiper && this.swiper.params[propName] === propValue) {
          return;
        }
        updateSwiper({
          swiper: this.swiper,
          passedParams: this.passedParams,
          changedParams: [attrToProp(propName)],
          ...(propName === 'navigation' && passedParams[propName] ? {
            prevEl: '.swiper-button-prev',
            nextEl: '.swiper-button-next'
          } : {}),
          ...(propName === 'pagination' && passedParams[propName] ? {
            paginationEl: '.swiper-pagination'
          } : {}),
          ...(propName === 'scrollbar' && passedParams[propName] ? {
            scrollbarEl: '.swiper-scrollbar'
          } : {})
        });
      }
      attributeChangedCallback(attr, prevValue, newValue) {
        if (!(this.swiper && this.swiper.initialized)) return;
        if (prevValue === 'true' && newValue === null) {
          newValue = false;
        }
        this.updateSwiperOnPropChange(attr, newValue);
      }
      static get observedAttributes() {
        const attrs = paramsList.filter(param => param.includes('_')).map(param => param.replace(/[A-Z]/g, v => `-${v}`).replace('_', '').toLowerCase());
        return attrs;
      }
    }
    paramsList.forEach(paramName => {
      if (paramName === 'init') return;
      paramName = paramName.replace('_', '');
      Object.defineProperty(SwiperContainer.prototype, paramName, {
        configurable: true,
        get() {
          return (this.passedParams || {})[paramName];
        },
        set(value) {
          if (!this.passedParams) this.passedParams = {};
          this.passedParams[paramName] = value;
          if (!(this.swiper && this.swiper.initialized)) return;
          this.updateSwiperOnPropChange(paramName, value);
        }
      });
    });
    class SwiperSlide extends ClassToExtend {
      constructor() {
        super();
        this.attachShadow({
          mode: 'open'
        });
      }
      render() {
        const lazy = this.lazy || this.getAttribute('lazy') === '' || this.getAttribute('lazy') === 'true';
        addStyle(this.shadowRoot, SwiperSlideCSS);
        this.shadowRoot.appendChild(document.createElement('slot'));
        if (lazy) {
          const lazyDiv = document.createElement('div');
          lazyDiv.classList.add('swiper-lazy-preloader');
          lazyDiv.part.add('preloader');
          this.shadowRoot.appendChild(lazyDiv);
        }
      }
      initialize() {
        this.render();
      }
      connectedCallback() {
        if (this.swiperLoopMoveDOM) {
          return;
        }
        this.initialize();
      }
    }

    // eslint-disable-next-line
    const register = () => {
      if (typeof window === 'undefined') return;
      if (!window.customElements.get('swiper-container')) window.customElements.define('swiper-container', SwiperContainer);
      if (!window.customElements.get('swiper-slide')) window.customElements.define('swiper-slide', SwiperSlide);
    };
    if (typeof window !== 'undefined') {
      window.SwiperElementRegisterParams = params => {
        paramsList.push(...params);
      };
    }

    /**
     * Handle breakpoints for swiper containers
     */
    const handleBreakpoints = () => {
      document.querySelectorAll('swiper-container[breakpoint]').forEach((container) => {
        const breakpoint = container.getAttribute('breakpoint');
        const mediaQuery = window.matchMedia(breakpoint);

        const handleBreakpointChange = () => {
          if (mediaQuery.matches) {
            if (!container.swiper.enabled) {
              container.swiper.enable();
              container.swiper.slideTo(0);
              container.classList.remove('swiper-disabled');
            }
          } else {
            container.swiper.disable();
            container.classList.add('swiper-disabled');
          }
        };

        handleBreakpointChange();
        mediaQuery.addEventListener('change', handleBreakpointChange);
      });
    };

    /**
     * Bullet pagination behavior:
     *   - Per-slide color sync (--bullet-color) for any swiper-container, regardless
     *     of autoplay or dots_style (circle/line). One host-write per slideChange.
     *   - Progress fill (--bullet-progress) only for autoplay="true" sliders.
     */
    const initBullets = (el, swiper) => {
      // Init once per element (prevents duplicate listeners when afterSwiperInit
      // re-runs on shopify:section:select).
      if (el.dataset.bulletInit) return;
      el.dataset.bulletInit = '1';

      // Per-slide color sync:
      //  - Mirrors the active slide's --text onto both the swiper-container host and
      //    its closest .swiper ancestor as --bullet-color.
      //  - Writing to both keeps the bullets in shadow DOM and the arrows in light DOM
      //    in lockstep, all driven from the same source value via var(--bullet-color).
      //  - The registered @property (inherits: true) handles the smooth transition
      //    independently on each target.
      //  - Writes per slideChange are safe even though the swiper-element bundle
      //    force-enables Swiper's MutationObserver on the host (observer: true is set
      //    by default unless virtual is enabled — see swiper-element-bundle.mjs). Its
      //    callback (observerUpdate → calcSlideSlots) is tolerable at slide-change
      //    frequency. Per-frame writes on observed elements would not be safe —
      //    that's exactly why the 60fps --bullet-progress write below targets the
      //    bullet element (in shadow DOM, not observed) instead.
      const colorTargets = [el];
      const wrapper = el.closest('.swiper');
      if (wrapper && wrapper !== el) colorTargets.push(wrapper);
      const syncBulletColor = () => {
        const slide = swiper.slides?.[swiper.activeIndex];
        if (!slide) return;
        const color = getComputedStyle(slide).getPropertyValue('--text').trim();
        if (!color) return;
        for (const target of colorTargets) {
          target.style.setProperty('--bullet-color', color);
        }
      };

      // Per-slide pagination alignment: Mirrors the active slide's horizontal content alignment
      // onto the pagination so the bullets sit under the content (left/center/right)
      // Once animation is enabled, position changes fade out, jump, then fade back in
      let currentAlign;
      let animate = false;
      let fadeTimer;
      const setAlignClasses = (align) => {
        el.classList.toggle('justify-pagination-left', align === 'flex-start');
        el.classList.toggle('justify-pagination-right', align === 'flex-end');
      };
      const applyAlign = (align) => {
        currentAlign = align;
        clearTimeout(fadeTimer);
        if (!animate) {
          setAlignClasses(align);
          return;
        }
        el.classList.add('pagination-hidden');
        // Matches the opacity transition in section-slideshow.scss
        fadeTimer = setTimeout(() => {
          setAlignClasses(align);
          el.classList.remove('pagination-hidden');
        }, 200);
      };
      const syncBulletAlignment = () => {
        const slide = swiper.slides?.[swiper.activeIndex];
        const wrapper = slide?.querySelector('[data-slide-content]');
        if (!wrapper) return;
        const align = getComputedStyle(wrapper).getPropertyValue('--alignment-justify-content').trim();
        if (align === currentAlign) return;
        applyAlign(align);
      };

      const alignPagination = Boolean(el.closest('slideshow-component'));

      requestAnimationFrame(() => {
        syncBulletColor();
        if (alignPagination) {
          syncBulletAlignment();
          // Enable the fade only after the first position is set, so the
          // pagination doesn't fade into place on load.
          requestAnimationFrame(() => {
            animate = true;
          });
        }
      });

      swiper.on('slideChange', () => {
        syncBulletColor();
        if (alignPagination) syncBulletAlignment();
      });
      if (alignPagination) swiper.on('resize', syncBulletAlignment);

      // Progress fill (autoplay sliders only):
      if (el.getAttribute('autoplay') !== 'true') return;

      //  - Write --bullet-progress to the active bullet element, not the swiper-container.
      //  - The swiper-container's style attribute is watched by Swiper's internal
      //    MutationObserver (force-enabled by the swiper-element bundle), so 60fps
      //    writes there trigger swiper.update() in a tight loop and prevent autoplay
      //    from running. Bullets live in shadow DOM and are not observed.
      swiper.on('autoplayTimeLeft', (_s, _t, percentage) => {
        const bullets = swiper.pagination?.bullets;
        if (!bullets?.length) return;
        const active = bullets[swiper.realIndex % bullets.length];
        if (active) active.style.setProperty('--bullet-progress', `${((1 - percentage) * 100).toFixed(2)}%`);
      });
    };

    /**
     * Fix accessibility issues introduced by Swiper's built-in a11y module on the
     * external navigation buttons (light DOM):
     *   - It sets aria-controls to the .swiper-wrapper id, which lives inside the
     *     web component's shadow DOM and can't be resolved from the light DOM. That
     *     dangling idref fails axe's aria-valid-attr-value check, so we drop it.
     *   - It overwrites the button's aria-label with its English default message, so
     *     we restore the localized label from window.theme.strings.
     *
     * Buttons carrying data-aria-controls are left for their own component
     * (slideshow / product gallery) to rewire to a valid, light-DOM id.
     * Idempotent, so it's safe to re-run on every (re)initialization.
     */
    const fixNavA11y = (swiper) => {
      const nav = swiper.navigation;
      if (!nav) return;

      const strings = window.theme?.strings || {};
      const targets = [
        {els: nav.prevEl, label: strings.previousSlide},
        {els: nav.nextEl, label: strings.nextSlide},
      ];

      targets.forEach(({els, label}) => {
        const list = Array.isArray(els) ? els : els ? [els] : [];
        list.forEach((navEl) => {
          if (!navEl.hasAttribute('data-aria-controls')) {
            const controls = navEl.getAttribute('aria-controls');
            if (controls && !document.getElementById(controls)) {
              navEl.removeAttribute('aria-controls');
            }
          }
          if (label) navEl.setAttribute('aria-label', label);
        });
      });
    };

    /**
     * Additionals after '<swiper-container>' custom element is defined.
     */
    const afterSwiperInit = () => {
      customElements.whenDefined('swiper-container').then(() => {
        const initAll = () => {
          document.querySelectorAll('swiper-container').forEach((el) => {
            el.classList.add('is-initialized');

            // Defer one frame so el.swiper
            // is available even when this runs synchronously after registration.
            requestAnimationFrame(() => {
              if (!el.swiper) return;
              initBullets(el, el.swiper);
              fixNavA11y(el.swiper);
            });
          });
        };
        initAll();
        handleBreakpoints();
      });
    };

    /**
     * Initialize Swiper on a page load
     */
    window.addEventListener('load', () => {
      register();
      afterSwiperInit();
    });

    /**
     * Handle Shopify section changes
     */
    const shopifyEvents = ['shopify:section:load', 'shopify:section:reorder', 'shopify:section:select'];
    shopifyEvents.forEach((eventName) => {
      document.addEventListener(eventName, afterSwiperInit);
    });

    /**
     * A11y Helpers
     * -----------------------------------------------------------------------------
     * A collection of useful functions that help make your theme more accessible
     */

    // Define trapFocusHandlers as a global variable within the module.
    const trapFocusHandlers = {};

    const a11y = {
      /**
       * Moves focus to an HTML element
       * @param {Element} element - The element to focus on.
       * @param {Object} options - Settings unique to your theme.
       * @param {string} options.className - Class name to apply to element on focus.
       */
      forceFocus(element, options) {
        options = options || {};

        var savedTabIndex = element.tabIndex;

        element.tabIndex = -1;
        element.dataset.tabIndex = savedTabIndex;
        element.focus();
        if (typeof options.className !== 'undefined') {
          element.classList.add(options.className);
        }
        element.addEventListener('blur', callback);

        function callback(event) {
          event.target.removeEventListener(event.type, callback);
          element.tabIndex = savedTabIndex;
          delete element.dataset.tabIndex;
          if (typeof options.className !== 'undefined') {
            element.classList.remove(options.className);
          }
        }
      },

      /**
       * Focus the appropriate element based on the URL hash.
       * @param {Object} options - Settings unique to your theme.
       */
      focusHash(options) {
        options = options || {};
        var hash = window.location.hash;
        var element = document.getElementById(hash.slice(1));

        if (element && options.ignore && element.matches(options.ignore)) {
          return false;
        }

        if (hash && element) {
          this.forceFocus(element, options);
        }
      },

      /**
       * Bind in-page links to focus the appropriate element.
       * @param {Object} options - Settings unique to your theme.
       */
      bindInPageLinks(options) {
        options = options || {};
        var links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));

        function queryCheck(selector) {
          return document.getElementById(selector) !== null;
        }

        return links.filter((link) => {
          if (link.hash === '#' || link.hash === '') {
            return false;
          }

          if (options.ignore && link.matches(options.ignore)) {
            return false;
          }

          if (!queryCheck(link.hash.substr(1))) {
            return false;
          }

          var element = document.querySelector(link.hash);

          if (!element) {
            return false;
          }

          link.addEventListener('click', () => {
            this.forceFocus(element, options);
          });

          return true;
        });
      },

      focusable(container) {
        var elements = Array.prototype.slice.call(
          container.querySelectorAll('[tabindex],' + '[draggable],' + 'a[href],' + 'area,' + 'button:enabled,' + 'input:not([type=hidden]):enabled,' + 'object,' + 'select:enabled,' + 'textarea:enabled')
        );

        return elements.filter((element) => !!((element.offsetWidth || element.offsetHeight || element.getClientRects().length) && this.isVisible(element)));
      },

      trapFocus(container, options) {
        options = options || {};
        var elements = this.focusable(container);
        var elementToFocus = options.elementToFocus || container;
        var first = elements[0];
        var last = elements[elements.length - 1];

        this.removeTrapFocus();

        trapFocusHandlers.focusin = function (event) {
          if (container !== event.target && !container.contains(event.target) && first && first === event.target) {
            first.focus();
          }

          if (event.target !== container && event.target !== last && event.target !== first) return;
          document.addEventListener('keydown', trapFocusHandlers.keydown);
        };

        trapFocusHandlers.focusout = function () {
          document.removeEventListener('keydown', trapFocusHandlers.keydown);
        };

        trapFocusHandlers.keydown = function (event) {
          if (event.code !== 'Tab') return;

          if (event.target === last && !event.shiftKey) {
            event.preventDefault();
            first.focus();
          }

          if ((event.target === container || event.target === first) && event.shiftKey) {
            event.preventDefault();
            last.focus();
          }
        };

        document.addEventListener('focusout', trapFocusHandlers.focusout);
        document.addEventListener('focusin', trapFocusHandlers.focusin);

        this.forceFocus(elementToFocus, options);
      },

      removeTrapFocus() {
        document.removeEventListener('focusin', trapFocusHandlers.focusin);
        document.removeEventListener('focusout', trapFocusHandlers.focusout);
        document.removeEventListener('keydown', trapFocusHandlers.keydown);
      },

      autoFocusLastElement() {
        if (window.theme.a11y.lastElement && document.body.classList.contains('is-focused')) {
          setTimeout(() => {
            window.theme.a11y.lastElement?.focus();
          });
        }
      },

      accessibleLinks(elements, options) {
        if (typeof elements !== 'string') {
          throw new TypeError(elements + ' is not a String.');
        }

        elements = document.querySelectorAll(elements);

        if (elements.length === 0) {
          return;
        }

        options = options || {};
        options.messages = options.messages || {};

        var messages = {
          newWindow: options.messages.newWindow || 'Opens in a new window.',
          external: options.messages.external || 'Opens external website.',
          newWindowExternal: options.messages.newWindowExternal || 'Opens external website in a new window.',
        };

        var prefix = options.prefix || 'a11y';

        var messageSelectors = {
          newWindow: prefix + '-new-window-message',
          external: prefix + '-external-message',
          newWindowExternal: prefix + '-new-window-external-message',
        };

        function generateHTML(messages) {
          var container = document.createElement('ul');
          var htmlMessages = Object.keys(messages).reduce((html, key) => {
            return (html += '<li id=' + messageSelectors[key] + '>' + messages[key] + '</li>');
          }, '');

          container.setAttribute('hidden', true);
          container.innerHTML = htmlMessages;

          document.body.appendChild(container);
        }

        function externalSite(link) {
          return link.hostname !== window.location.hostname;
        }

        elements.forEach((link) => {
          var target = link.getAttribute('target');
          var rel = link.getAttribute('rel');
          var isExternal = externalSite(link);
          var isTargetBlank = target === '_blank';
          var missingRelNoopener = rel === null || rel.indexOf('noopener') === -1;

          if (isTargetBlank && missingRelNoopener) {
            var relValue = rel === null ? 'noopener' : rel + ' noopener';
            link.setAttribute('rel', relValue);
          }

          if (isExternal && isTargetBlank) {
            link.setAttribute('aria-describedby', messageSelectors.newWindowExternal);
          } else if (isExternal) {
            link.setAttribute('aria-describedby', messageSelectors.external);
          } else if (isTargetBlank) {
            link.setAttribute('aria-describedby', messageSelectors.newWindow);
          }
        });

        generateHTML(messages);
      },

      isVisible(el) {
        var style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      },
    };

    window.theme = window.theme || {};
    window.theme.a11y = a11y;

    window.theme.throttle = (fn, wait) => {
      let prev, next;
      return function invokeFn(...args) {
        const now = Date.now();
        next = clearTimeout(next);
        if (!prev || now - prev >= wait) {
          // eslint-disable-next-line prefer-spread
          fn.apply(null, args);
          prev = now;
        } else {
          next = setTimeout(invokeFn.bind(null, ...args), wait - (now - prev));
        }
      };
    };

    class QuantityInput extends HTMLElement {
      constructor() {
        super();
        this.input = this.querySelector('input');
        this.changeEvent = new Event('change', {bubbles: true});
        this.input.addEventListener('change', this.onInputChange.bind(this));
        this.querySelectorAll('button').forEach((button) => button.addEventListener('click', this.onButtonClick.bind(this)));
      }

      quantityUpdateUnsubscriber = undefined;

      connectedCallback() {
        this.validateQtyRules();
        this.quantityUpdateUnsubscriber = subscribe(theme.PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
      }

      disconnectedCallback() {
        if (this.quantityUpdateUnsubscriber) {
          this.quantityUpdateUnsubscriber();
        }
      }

      onInputChange(event) {
        this.validateQtyRules();
        if (this.input && this.input.name === 'updates[]') {
          this.updateCart();
        }
      }

      onButtonClick(event) {
        event.preventDefault();
        const previousValue = this.input.value;
        const button = event.target.nodeName === 'BUTTON' ? event.target : event.target.closest('button');
        const name = button ? button.name : undefined;

        const isIncrease = name === 'increase' || name === 'plus';
        const isDecrease = name === 'decrease' || name === 'minus';

        if (isIncrease) {
          if (parseInt(this.input?.dataset?.min) > parseInt(this.input.step) && this.input.value == 0) {
            this.input.value = this.input.dataset.min;
          } else {
            this.input.stepUp();
          }
        } else if (isDecrease) {
          this.input.stepDown();
        }

        if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

        if (this.input?.dataset?.min === previousValue && isDecrease) {
          this.input.value = parseInt(this.input.min);
        }
      }

      validateQtyRules() {
        const value = parseInt(this.input.value);
        if (this.input.min) {
          const buttonMinus = this.querySelector(".quantity__button[name='minus']") || this.querySelector(".quantity__button[name='decrease']");
          if (buttonMinus) buttonMinus.classList.toggle('disabled', parseInt(value) <= parseInt(this.input.min));
        }
        if (this.input.max) {
          const max = parseInt(this.input.max);
          const buttonPlus = this.querySelector(".quantity__button[name='plus']") || this.querySelector(".quantity__button[name='increase']");
          if (buttonPlus) buttonPlus.classList.toggle('disabled', value >= max);
        }
      }

      updateCart() {
        if (!this.input || this.input.value === '') return;
        this.dispatchEvent(
          new CustomEvent('theme:cart:update', {
            bubbles: true,
            detail: {
              id: this.input.dataset.id,
              quantity: this.input.value,
            },
          })
        );
      }
    }

    customElements.define('quantity-input', QuantityInput);

    class HTMLUpdateUtility$1 {
      /**
       * Used to swap an HTML node with a new node.
       * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
       *
       * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
       */
      static viewTransition(oldNode, newContent, preProcessCallbacks = [], postProcessCallbacks = []) {
        preProcessCallbacks?.forEach((callback) => callback(newContent));

        const newNodeWrapper = document.createElement('div');
        HTMLUpdateUtility$1.setInnerHTML(newNodeWrapper, newContent.outerHTML);
        const newNode = newNodeWrapper.firstChild;

        // Dispatch a custom event for the node with a swapped ID to notify about the HTML changes
        const swappedNode = newNodeWrapper.querySelector('[data-swap-id]');
        if (swappedNode) {
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('theme:html:change', {detail: {element: swappedNode}, bubbles: true}));
          });
        }

        // dedupe IDs
        const uniqueKey = Date.now();
        oldNode.querySelectorAll('[id], [form]').forEach((element) => {
          element.id && (element.id = `${element.id}-${uniqueKey}`);
          element.form && element.setAttribute('form', `${element.form.getAttribute('id')}-${uniqueKey}`);
        });

        oldNode.parentNode.insertBefore(newNode, oldNode);
        oldNode.style.display = 'none';

        postProcessCallbacks?.forEach((callback) => callback(newNode));

        setTimeout(() => oldNode.remove(), 500);
      }

      // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
      static setInnerHTML(element, html) {
        element.innerHTML = html;
        element.querySelectorAll('script').forEach((oldScriptTag) => {
          const newScriptTag = document.createElement('script');
          Array.from(oldScriptTag.attributes).forEach((attribute) => {
            newScriptTag.setAttribute(attribute.name, attribute.value);
          });
          newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
          oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
        });
      }
    }

    window.HTMLUpdateUtility = HTMLUpdateUtility$1;

    const selectors$e = {
      aos: '[data-aos]:not(.aos-animate)',
      aosAnchor: '[data-aos-anchor]',
      aosIndividual: '[data-aos]:not([data-aos-anchor]):not(.aos-animate)',
    };

    const classes$b = {
      aosAnimate: 'aos-animate',
    };

    const observerConfig = {
      attributes: false,
      childList: true,
      subtree: true,
    };

    let anchorContainers = [];

    const mutationCallback = (mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'childList') {
          const element = mutation.target;
          const elementsToAnimate = element.querySelectorAll(selectors$e.aos);
          const anchors = element.querySelectorAll(selectors$e.aosAnchor);

          if (elementsToAnimate.length) {
            elementsToAnimate.forEach((element) => {
              aosItemObserver.observe(element);
            });
          }

          if (anchors.length) {
            // Get all anchors and attach observers
            initAnchorObservers(anchors);
          }
        }
      }
    };

    /*
      Observe each element that needs to be animated
    */
    const aosItemObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(classes$b.aosAnimate);

            // Stop observing element after it was animated
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    /*
      Observe anchor elements
    */
    const aosAnchorObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio) {
            const elementsToAnimate = entry.target.querySelectorAll(selectors$e.aos);

            if (elementsToAnimate.length) {
              elementsToAnimate.forEach((item) => {
                item.classList.add(classes$b.aosAnimate);
              });
            }

            // Stop observing anchor element after inner elements were animated
            observer.unobserve(entry.target);

            // Remove the container from the anchorContainers array
            const sectionIndex = anchorContainers.indexOf(entry.target.id);
            if (sectionIndex !== -1) {
              anchorContainers.splice(sectionIndex, 1);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    /*
      Watch for mutations in the body and start observing the newly added animated elements and anchors
    */
    function bodyMutationObserver() {
      const bodyObserver = new MutationObserver(mutationCallback);
      bodyObserver.observe(document.body, observerConfig);
    }

    /*
      Observe animated elements that have attribute [data-aos]
    */
    function elementsIntersectionObserver() {
      const elementsToAnimate = document.querySelectorAll(selectors$e.aosIndividual);

      if (elementsToAnimate.length) {
        elementsToAnimate.forEach((element) => {
          aosItemObserver.observe(element);
        });
      }
    }

    /*
      Observe animated elements that have attribute [data-aos]
    */
    function anchorsIntersectionObserver() {
      const anchors = document.querySelectorAll(selectors$e.aosAnchor);

      if (anchors.length) {
        // Get all anchors and attach observers
        initAnchorObservers(anchors);
      }
    }

    function initAnchorObservers(anchors) {
      if (!anchors.length) return;

      anchors.forEach((anchor) => {
        const containerId = anchor.dataset.aosAnchor;

        // Avoid adding multiple observers to the same element
        if (containerId && anchorContainers.indexOf(containerId) === -1) {
          const container = document.getElementById(containerId);

          if (container) {
            aosAnchorObserver.observe(container);
            anchorContainers.push(containerId);
          }
        }
      });
    }

    function initAnimations() {
      elementsIntersectionObserver();
      anchorsIntersectionObserver();
      bodyMutationObserver();

      // Remove unloaded section from the anchors array on section:unload event
      document.addEventListener('shopify:section:unload', (e) => {
        if (typeof e.target !== 'object' || e.target.nodeValue === 'undefined') return;

        const sectionId = e.target.querySelector('[data-section-id]')?.id;
        const sectionIndex = anchorContainers.indexOf(sectionId);

        if (sectionIndex !== -1) {
          anchorContainers.splice(sectionIndex, 1);
        }
      });
    }

    function appendCartItems() {
      if (document.querySelector('cart-items')) return;

      // Add cart items tag when the cart drawer section is missing so we can still run the JS associated with the error handling
      const cartItems = document.createElement('cart-items');
      document.body.appendChild(cartItems);
    }

    function floatLabels(container) {
      const floats = container.querySelectorAll('.form-field');
      floats?.forEach((element) => {
        const label = element.querySelector('label');
        const input = element.querySelector('input, textarea');
        if (label && input) {
          input.addEventListener('keyup', (event) => {
            if (event.target.value !== '') {
              label.classList.add('label--float');
            } else {
              label.classList.remove('label--float');
            }
          });
          if (input.value && input.value.length) {
            label.classList.add('label--float');
          }
        }
      });
    }

    window.theme.windowWidth = getWindowWidth();
    window.theme.windowHeight = getWindowHeight();
    window.theme.isMobile = isMobile();

    let lastScale = window.visualViewport ? window.visualViewport.scale : 1;

    function dispatch$1() {
      // Update isMobile state before dispatching event
      const currentMediaQuery = isMobile();
      if (window.theme.isMobile !== currentMediaQuery) {
        window.theme.isMobile = currentMediaQuery;
      }

      const currentWidth = getWindowWidth();
      const currentHeight = getWindowHeight();

      if (window.theme.windowWidth !== currentWidth) {
        document.dispatchEvent(new CustomEvent('theme:resize:width', {bubbles: true}));
        window.theme.windowWidth = currentWidth;
      }

      if (window.theme.windowHeight !== currentHeight) {
        document.dispatchEvent(new CustomEvent('theme:resize:height', {bubbles: true}));
        window.theme.windowHeight = currentHeight;
      }

      document.dispatchEvent(new CustomEvent('theme:resize', {bubbles: true}));
    }

    function resizeListener() {
      window.addEventListener(
        'resize',
        window.theme.debounce(function () {
          // Check if viewport is zoomed (scaled)
          const currentScale = window.visualViewport ? window.visualViewport.scale : 1;
          const zooming = Math.abs(currentScale - lastScale) > 0.05;

          if (zooming) {
            // Zoom detected — ignore resize
            lastScale = currentScale;
            return;
          }

          lastScale = currentScale;

          dispatch$1();
        }, 50)
      );
    }

    function getWindowWidth() {
      return document.documentElement.clientWidth || document.body.clientWidth || window.innerWidth;
    }

    function getWindowHeight() {
      return document.documentElement.clientHeight || document.body.clientHeight || window.innerHeight;
    }

    function isMobile() {
      return window.innerWidth < theme.sizes.small;
    }

    let prev = window.scrollY;
    let up = null;
    let down = null;
    let wasUp = null;
    let wasDown = null;
    let scrollLockTimer = 0;

    function dispatch() {
      const position = window.scrollY;
      if (position > prev) {
        down = true;
        up = false;
      } else if (position < prev) {
        down = false;
        up = true;
      } else {
        up = null;
        down = null;
      }
      prev = position;
      document.dispatchEvent(
        new CustomEvent('theme:scroll', {
          detail: {
            up,
            down,
            position,
          },
          bubbles: false,
        })
      );
      if (up && !wasUp) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:up', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      if (down && !wasDown) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:down', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      wasDown = down;
      wasUp = up;
    }

    function lock(e) {
      // Prevent body scroll lock race conditions
      setTimeout(() => {
        if (scrollLockTimer) {
          clearTimeout(scrollLockTimer);
        }

        window.theme.ScrollLock.disablePageScroll(e.detail, {
          allowTouchMove: (el) => el.tagName === 'TEXTAREA',
        });

        document.documentElement.setAttribute('data-scroll-locked', '');
      });
    }

    function unlock(e) {
      const timeout = e.detail;

      if (timeout) {
        scrollLockTimer = setTimeout(removeScrollLock, timeout);
      } else {
        removeScrollLock();
      }
    }

    function removeScrollLock() {
      window.theme.ScrollLock.clearQueueScrollLocks();
      window.theme.ScrollLock.enablePageScroll();
      document.documentElement.removeAttribute('data-scroll-locked');
    }

    function scrollListener() {
      let timeout;
      window.addEventListener(
        'scroll',
        function () {
          if (timeout) {
            window.cancelAnimationFrame(timeout);
          }
          timeout = window.requestAnimationFrame(function () {
            dispatch();
          });
        },
        {passive: true}
      );

      window.addEventListener('theme:scroll:lock', lock);
      window.addEventListener('theme:scroll:unlock', unlock);
    }

    const wrap = (toWrap, wrapperClass = '', wrapperOption) => {
      const wrapper = wrapperOption || document.createElement('div');
      wrapper.classList.add(wrapperClass);
      toWrap.parentNode.insertBefore(wrapper, toWrap);
      return wrapper.appendChild(toWrap);
    };

    function wrapElements(container) {
      // Target tables to make them scrollable
      const tableSelectors = '.rte table';
      const tables = container.querySelectorAll(tableSelectors);
      tables.forEach((table) => {
        wrap(table, 'rte__table-wrapper');
        table.setAttribute('data-scroll-lock-scrollable', '');
      });

      // Target iframes to make them responsive
      const iframeSelectors = '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"], .rte iframe#admin_bar_iframe';
      const frames = container.querySelectorAll(iframeSelectors);
      frames.forEach((frame) => {
        wrap(frame, 'rte__video-wrapper');
      });
    }

    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }

    function isTouch() {
      if (isTouchDevice()) {
        document.documentElement.className = document.documentElement.className.replace('no-touch', 'supports-touch');
        window.theme.touch = true;
      } else {
        window.theme.touch = false;
      }
    }

    function ariaToggle(container) {
      const toggleButtons = container.querySelectorAll('[data-aria-toggle]');
      if (toggleButtons.length) {
        toggleButtons.forEach((element) => {
          element.addEventListener('click', function (event) {
            event.preventDefault();
            const currentTarget = event.currentTarget;
            currentTarget.setAttribute('aria-expanded', currentTarget.getAttribute('aria-expanded') == 'false' ? 'true' : 'false');
            const toggleID = currentTarget.getAttribute('aria-controls');
            const toggleElement = document.querySelector(`#${toggleID}`);
            const removeExpandingClass = () => {
              toggleElement.classList.remove('expanding');
              toggleElement.removeEventListener('transitionend', removeExpandingClass);
            };
            const addExpandingClass = () => {
              toggleElement.classList.add('expanding');
              toggleElement.removeEventListener('transitionstart', addExpandingClass);
            };

            toggleElement.addEventListener('transitionstart', addExpandingClass);
            toggleElement.addEventListener('transitionend', removeExpandingClass);

            toggleElement.classList.toggle('expanded');
          });
        });
      }
    }

    const classes$a = {
      loading: 'is-loading',
    };

    const selectors$d = {
      img: 'img.is-loading',
    };

    /*
      Catch images loaded events and add class "is-loaded" to them and their containers
    */
    function loadedImagesEventHook() {
      document.addEventListener(
        'load',
        (e) => {
          if (e.target.tagName.toLowerCase() == 'img' && e.target.classList.contains(classes$a.loading)) {
            e.target.classList.remove(classes$a.loading);
            e.target.parentNode.classList.remove(classes$a.loading);

            if (e.target.parentNode.parentNode.classList.contains(classes$a.loading)) {
              e.target.parentNode.parentNode.classList.remove(classes$a.loading);
            }
          }
        },
        true
      );
    }

    /*
      Remove "is-loading" class to the loaded images and their containers
    */
    function removeLoadingClassFromLoadedImages(container) {
      container.querySelectorAll(selectors$d.img).forEach((img) => {
        if (img.complete) {
          img.classList.remove(classes$a.loading);
          img.parentNode.classList.remove(classes$a.loading);

          if (img.parentNode.parentNode.classList.contains(classes$a.loading)) {
            img.parentNode.parentNode.classList.remove(classes$a.loading);
          }
        }
      });
    }

    // Safari requestIdleCallback polyfill
    window.requestIdleCallback =
      window.requestIdleCallback ||
      function (cb) {
        var start = Date.now();
        return setTimeout(function () {
          cb({
            didTimeout: false,
            timeRemaining: function () {
              return Math.max(0, 50 - (Date.now() - start));
            },
          });
        }, 1);
      };
    window.cancelIdleCallback =
      window.cancelIdleCallback ||
      function (id) {
        clearTimeout(id);
      };

    if (window.theme.settings.enableAnimations) {
      initAnimations();
    }

    resizeListener();
    scrollListener();
    isTouch();
    loadedImagesEventHook();

    window.addEventListener('DOMContentLoaded', () => {
      ariaToggle(document);
      floatLabels(document);
      wrapElements(document);
      removeLoadingClassFromLoadedImages(document);
      appendCartItems();

      requestIdleCallback(() => {
        if (Shopify.visualPreviewMode) {
          document.documentElement.classList.add('preview-mode');
        }
      });
    });

    document.addEventListener('DOMContentLoaded', function () {
      if (window.self !== window.top) {
        document.querySelector('html').classList.add('iframe');
      }
    });

    document.addEventListener('shopify:section:load', (e) => {
      const container = e.target;
      if (typeof container !== 'object' || container.nodeValue === 'undefined') return;

      floatLabels(container);
      wrapElements(container);
      ariaToggle(document);
    });

    // Apply a specific class to the html element for browser support of cookies.
    if (window.navigator.cookieEnabled) {
      document.documentElement.className = document.documentElement.className.replace('supports-no-cookies', 'supports-cookies');
    }

    (function () {
      const loaded = new Set();

      function loadCssOnce(key, href) {
        if (loaded.has(key)) return;
        loaded.add(key);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }

      function watchForSelector({key, href, selectors, timeoutMs = null, checkFn}) {
        const hasMatch = () => {
          // Run custom check function first if provided
          if (checkFn && checkFn()) {
            return true;
          }
          // Fallback to selector check
          return selectors.some((s) => document.querySelector(s));
        };

        if (hasMatch()) {
          loadCssOnce(key, href);
          return;
        }

        const obs = new MutationObserver(() => {
          if (!hasMatch()) return;
          obs.disconnect();
          loadCssOnce(key, href);
        });

        obs.observe(document.documentElement, {childList: true, subtree: true});

        // Only set timeout if explicitly provided (allows indefinite watching for late-loading widgets)
        if (timeoutMs !== null && timeoutMs !== undefined) {
          window.setTimeout(() => obs.disconnect(), timeoutMs);
        }
      }

      const apps = {
        junip: {
          key: 'headlands-junip',
          href: window.theme.assets.junipCss,
          selectors: ['.junip-product-summary', '#junip-product-reviews', '[data-junip-reviews]'],
          checkFn: () => {
            // Check for window.junip (object) or window.junipLoaded (boolean)
            return (typeof window.junip === 'object' && window.junip !== null) || window.junipLoaded === true;
          },
        },
        recharge: {
          key: 'headlands-recharge',
          href: window.theme.assets.rechargeCss,
          selectors: ['[data-recharge-subscription-widget]', '.rc-widget', '.recharge-subscription-widget', '.recharge-gifting-widget'],
          checkFn: () => {
            return typeof window.Recharge === 'object' && window.Recharge !== null;
          },
        },
      };

      Object.values(apps).forEach((app) => {
        watchForSelector(app);
      });
    })();

    class Accessibility {
      constructor() {
        this.init();
      }

      init() {
        this.a11y = window.theme.a11y;

        // DOM Elements
        this.inPageLink = document.querySelector('[data-skip-content]');
        this.linkesWithOnlyHash = document.querySelectorAll('a[href="#"]');

        // A11Y init methods
        this.a11y.focusHash();
        this.a11y.bindInPageLinks();

        // Events
        this.clickEvents();
        this.focusEvents();
      }

      /**
       * Clicked events accessibility
       *
       * @return  {Void}
       */

      clickEvents() {
        if (this.inPageLink) {
          this.inPageLink.addEventListener('click', (event) => {
            event.preventDefault();
          });
        }

        if (this.linkesWithOnlyHash) {
          this.linkesWithOnlyHash.forEach((item) => {
            item.addEventListener('click', (event) => {
              event.preventDefault();
            });
          });
        }
      }

      /**
       * Focus events
       *
       * @return  {Void}
       */

      focusEvents() {
        document.addEventListener('mousedown', () => {
          document.body.classList.remove('is-focused');
        });

        document.addEventListener('keyup', (event) => {
          if (event.code !== 'Tab') {
            return;
          }

          document.body.classList.add('is-focused');
        });
      }
    }

    window.theme = window.theme || {};
    window.theme.Accessibility = new Accessibility();

    /*
      Trigger event after animation completes
    */
    window.theme.waitForAnimationEnd = function (element) {
      return new Promise((resolve) => {
        function onAnimationEnd(event) {
          if (event.target != element) return;

          element.removeEventListener('animationend', onAnimationEnd);
          resolve();
        }

        element?.addEventListener('animationend', onAnimationEnd);
      });
    };

    /*
      Trigger event after all animations complete in a specific section
    */
    window.theme.waitForAllAnimationsEnd = function (section) {
      return new Promise((resolve, rejected) => {
        const animatedElements = section.querySelectorAll('[data-aos]');
        let animationCount = 0;

        function onAnimationEnd(event) {
          animationCount++;

          if (animationCount === animatedElements.length) {
            // All animations have ended
            resolve();
          }

          event.target.removeEventListener('animationend', onAnimationEnd);
        }

        animatedElements.forEach((element) => {
          element.addEventListener('animationend', onAnimationEnd);
        });

        if (!animationCount) rejected();
      });
    };

    function FetchError(object) {
      this.status = object.status || null;
      this.headers = object.headers || null;
      this.json = object.json || null;
      this.body = object.body || null;
    }
    FetchError.prototype = Error.prototype;

    const classes$9 = {
      animated: 'is-animated',
      active: 'is-active',
      added: 'is-added',
      disabled: 'is-disabled',
      empty: 'is-empty',
      error: 'has-error',
      headerStuck: 'js__header__stuck',
      hidden: 'is-hidden',
      hiding: 'is-hiding',
      loading: 'is-loading',
      open: 'is-open',
      removed: 'is-removed',
      success: 'is-success',
      visible: 'is-visible',
      expanded: 'is-expanded',
      updated: 'is-updated',
      variantSoldOut: 'variant--soldout',
      variantUnavailable: 'variant--unavailable',
    };

    const selectors$c = {
      apiContent: '[data-api-content]',
      apiLineItems: '[data-api-line-items]',
      apiCartPrice: '[data-api-cart-price]',
      apiBundleItems: '[data-api-bundle-items]',
      animation: '[data-animation]',
      bundleProductsHolder: '[data-bundle-products]',
      bundleWidget: '[data-bundle-widget]',
      cartBarAdd: '[data-cart-bar-add-to-cart]',
      cartCloseError: '[data-cart-error-close]',
      cartDrawer: 'cart-drawer',
      cartDrawerClose: '[data-cart-drawer-close]',
      cartEmpty: '[data-cart-empty]',
      cartErrors: '[data-cart-errors]',
      cartItemRemove: '[data-item-remove]',
      cartPage: '[data-cart-page]',
      cartForm: '[data-cart-form]',
      cartTermsCheckbox: '[data-cart-acceptance-checkbox]',
      cartCheckoutButtonWrapper: '[data-cart-checkout-buttons]',
      cartCheckoutButton: '[data-cart-checkout-button]',
      cartTotal: '[data-cart-total]',
      checkoutButtons: '[data-checkout-buttons]',
      errorMessage: '[data-error-message]',
      formCloseError: '[data-close-error]',
      formErrorsContainer: '[data-cart-errors-container]',
      formWrapper: '[data-form-wrapper]',
      freeShipping: '[data-free-shipping]',
      headerWrapper: '[data-header-wrapper]',
      item: '[data-item]',
      itemsHolder: '[data-items-holder]',
      navDrawer: '[data-drawer]',
      outerSection: '[data-section-id]',
      priceHolder: '[data-cart-price-holder]',
      quickAddHolder: '[data-quick-add-holder]',
      quickAddModal: '[data-quick-add-modal]',
      qtyInput: 'input[name="updates[]"]',
      termsErrorMessage: '[data-terms-error-message]',
      collapsibleBody: '[data-collapsible-body]',
      discountInput: '[data-discount-input]',
      discountField: '[data-discount-field]',
      discountButton: '[data-apply-discount]',
      discountBody: '[data-discount-body]',
      discountCode: '[data-discount-code]',
      discountErrorMessage: '[data-discount-error-message]',
      removeDiscount: '[data-remove-discount]',
    };

    const attributes$7 = {
      cartTotal: 'data-cart-total',
      disabled: 'disabled',
      freeShipping: 'data-free-shipping',
      freeShippingLimit: 'data-free-shipping-limit',
      item: 'data-item',
      itemIndex: 'data-item-index',
      itemTitle: 'data-item-title',
      open: 'open',
      quickAddHolder: 'data-quick-add-holder',
      quickAddVariant: 'data-quick-add-variant',
      scrollLocked: 'data-scroll-locked',
      name: 'name',
      maxInventoryReached: 'data-max-inventory-reached',
      errorMessagePosition: 'data-error-message-position',
      discountButton: 'data-cart-discount-button',
    };

    class CartItems extends HTMLElement {
      constructor() {
        super();

        this.a11y = window.theme.a11y;
      }

      connectedCallback() {
        // DOM Elements
        this.cartPage = document.querySelector(selectors$c.cartPage);
        this.cartForm = document.querySelector(selectors$c.cartForm);
        this.cartDrawer = document.querySelector(selectors$c.cartDrawer);
        this.cartEmpty = document.querySelector(selectors$c.cartEmpty);
        this.cartTermsCheckbox = document.querySelector(selectors$c.cartTermsCheckbox);
        this.cartCheckoutButtonWrapper = document.querySelector(selectors$c.cartCheckoutButtonWrapper);
        this.cartCheckoutButton = document.querySelector(selectors$c.cartCheckoutButton);
        this.checkoutButtons = document.querySelector(selectors$c.checkoutButtons);
        this.itemsHolder = document.querySelector(selectors$c.itemsHolder);
        this.priceHolder = document.querySelector(selectors$c.priceHolder);
        this.items = document.querySelectorAll(selectors$c.item);
        this.cartTotal = document.querySelector(selectors$c.cartTotal);
        this.freeShipping = document.querySelectorAll(selectors$c.freeShipping);
        this.cartErrorHolder = document.querySelector(selectors$c.cartErrors);
        this.cartCloseErrorMessage = document.querySelector(selectors$c.cartCloseError);
        this.headerWrapper = document.querySelector(selectors$c.headerWrapper);
        this.navDrawer = document.querySelector(selectors$c.navDrawer);
        this.bundleProductsHolder = document.querySelector(selectors$c.bundleProductsHolder);
        this.subtotal = window.theme.subtotal;
        this.discountInput = document.querySelector(selectors$c.discountInput);
        this.discountField = document.querySelector(selectors$c.discountField);
        this.discountButton = document.querySelector(selectors$c.discountButton);
        this.hasDiscountBlock = !!document.querySelector(selectors$c.discountButton);
        this.discountErrorMessage = document.querySelector(selectors$c.discountErrorMessage);
        this.existingDiscountCodes = [];
        this.discounts = document.querySelectorAll(selectors$c.discountBody);

        // Define Cart object depending on if we have cart drawer or cart page
        this.cart = this.cartDrawer || this.cartPage;

        // Discounts
        if (this.hasDiscountBlock) {
          // Fill existing discount codes and bind event listeners
          this.bindDiscountEventListeners();
        }

        // Cart events
        this.animateItems = this.animateItems.bind(this);
        this.addToCart = this.addToCart.bind(this);
        this.cartAddEvent = this.cartAddEvent.bind(this);
        this.updateProgress = this.updateProgress.bind(this);
        this.onCartDrawerClose = this.onCartDrawerClose.bind(this);
        this.onCartDrawerOpen = this.onCartDrawerOpen.bind(this);

        // Set global event listeners for "Add to cart" and Announcement bar wheel progress
        document.addEventListener('theme:cart:add', this.cartAddEvent);
        document.addEventListener('theme:announcement:init', this.updateProgress);

        if (theme.settings.cartType == 'drawer') {
          document.addEventListener('theme:cart-drawer:open', this.onCartDrawerOpen);
          document.addEventListener('theme:cart-drawer:close', this.onCartDrawerClose);
        }

        // Bundle products
        this.skipBundleProductsArray = [];
        this.skipBundleProductEvent();
        this.checkSkippedBundleProductsFromStorage();
        this.toggleCartBundleWidgetVisibility();

        // Free Shipping values
        this.circumference = 28 * Math.PI; // radius - stroke * 4 * PI
        this.freeShippingLimit = this.freeShipping.length ? Number(this.freeShipping[0].getAttribute(attributes$7.freeShippingLimit)) * 100 * window.Shopify.currency.rate : 0;

        const currencyRate = window.Shopify && window.Shopify.currency && window.Shopify.currency.rate ? Number(window.Shopify.currency.rate) : 1;
        const promotion1Limit = Number(this.freeShipping[0]?.getAttribute('data-free-shipping-limit'));
        const promotion2Limit = Number(this.freeShipping[0]?.getAttribute('data-promo-center-limit'));
        this.promotion1Enabled = this.freeShipping.length ? this.freeShipping[0].getAttribute('data-free-shipping-primary-promo') === 'true' : false;
        this.promotion2Enabled = this.freeShipping.length ? this.freeShipping[0].getAttribute('data-free-shipping-secondary-promo') === 'true' : false;
        const limitAttr = this.freeShipping.length ? promotion1Limit : 0;
        let centerLimitAttr = this.promotion1Enabled ? promotion2Limit : 0;
        if (!this.promotion1Enabled && this.promotion2Enabled && promotion2Limit > 0) {
          centerLimitAttr = promotion2Limit;
        }
        this.freeShippingLimit = Math.max(0, limitAttr * 100 * currencyRate);
        this.promoCenterLimit = Math.max(0, centerLimitAttr * 100 * currencyRate);

        this.freeShippingMessageHandle(this.subtotal);
        this.updateProgress();

        this.build = this.build.bind(this);
        this.updateCart = this.updateCart.bind(this);
        this.productAddCallback = this.productAddCallback.bind(this);
        this.formSubmitHandler = window.theme.throttle(this.formSubmitHandler.bind(this), 50);

        if (this.cartPage) {
          this.animateItems();
        }

        if (this.cart) {
          // Checking
          this.hasItemsInCart = this.hasItemsInCart.bind(this);
          this.cartCount = this.getCartItemCount();
        }

        // Set classes
        this.toggleClassesOnContainers = this.toggleClassesOnContainers.bind(this);

        // Flags
        this.totalItems = this.items.length;
        this.showCannotAddMoreInCart = false;
        this.cartUpdateFailed = false;
        this.discountError = false;
        this.shippingDiscountError = false;
        this.pendingDiscountCheck = null;
        this.activeDiscountFetch = null;

        // Cart Events
        this.cartEvents();
        this.cartRemoveEvents();
        this.cartUpdateEvents();

        document.addEventListener('theme:product:add', this.productAddCallback);
        document.addEventListener('theme:product:add-error', this.productAddCallback);
        document.addEventListener('theme:cart:refresh', this.getCart.bind(this));
      }

      disconnectedCallback() {
        document.removeEventListener('theme:cart:add', this.cartAddEvent);
        document.removeEventListener('theme:cart:refresh', this.cartAddEvent);
        document.removeEventListener('theme:announcement:init', this.updateProgress);
        document.removeEventListener('theme:product:add', this.productAddCallback);
        document.removeEventListener('theme:product:add-error', this.productAddCallback);

        if (document.documentElement.hasAttribute(attributes$7.scrollLocked)) {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        }
      }

      onCartDrawerOpen(e) {
        // Animate items
        this.animateItems(e);
      }

      onCartDrawerClose() {
        this.resetAnimatedItems();

        if (this.cartDrawer?.classList.contains(classes$9.open)) {
          this.cart.classList.remove(classes$9.updated);
        }

        this.cartEmpty.classList.remove(classes$9.updated);
        this.cartErrorHolder.classList.remove(classes$9.expanded);
        this.cart.querySelectorAll(selectors$c.animation).forEach((item) => {
          const removeHidingClass = () => {
            item.classList.remove(classes$9.hiding);
            item.removeEventListener('animationend', removeHidingClass);
          };

          item.classList.add(classes$9.hiding);
          item.addEventListener('animationend', removeHidingClass);
        });

        if (this.hasDiscountBlock) {
          this.clearDiscountErrors();
        }
      }

      /**
       * Cart update event hook
       *
       * @return  {Void}
       */

      cartUpdateEvents() {
        this.items = document.querySelectorAll(selectors$c.item);

        this.items.forEach((item) => {
          item.addEventListener('theme:cart:update', (event) => {
            this.updateCart(
              {
                id: event.detail.id,
                quantity: event.detail.quantity,
              },
              item
            );
          });
        });
      }

      /**
       * Cart events
       *
       * @return  {Void}
       */

      cartRemoveEvents() {
        const cartItemRemove = document.querySelectorAll(selectors$c.cartItemRemove);

        cartItemRemove?.forEach((button) => {
          const item = button.closest(selectors$c.item);
          button.addEventListener('click', (event) => {
            event.preventDefault();

            if (button.classList.contains(classes$9.disabled)) return;

            this.updateCart(
              {
                id: button.dataset.id,
                quantity: 0,
              },
              item
            );
          });
        });

        const cartBundleRemove = document.querySelectorAll('[data-bundle-cart-remove]');
        cartBundleRemove?.forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault();

            if (button.getAttribute('data-bundle-cart-remove') !== '') {
              const lineItemKey = button.getAttribute('data-bundle-cart-remove');
              const lineItemKeyArr = lineItemKey.split(',');

              button.closest('[data-bundle-cart-item]')?.classList.add('is-removed');

              this.removeMultipleProducts(lineItemKeyArr);
            }
          });
        });

        if (this.cartCloseErrorMessage) {
          this.cartCloseErrorMessage.addEventListener('click', (event) => {
            event.preventDefault();

            this.cartErrorHolder.classList.remove(classes$9.expanded);
          });
        }
      }

      /**
       * Cart event add product to cart
       *
       * @return  {Void}
       */

      cartAddEvent(event) {
        let formData = event.detail.data || '';
        let button = event.detail.button;

        if (button?.hasAttribute('disabled')) return;
        const form = button?.form || button?.closest('form');
        // Validate form

        if (form) {
          if (!form.checkValidity()) {
            form.reportValidity();
            return;
          }

          if (!formData) {
            formData = new FormData(form);
          }

          if (form.querySelector('[type="file"]')) {
            return;
          }

          const maxInventoryReached = form.getAttribute(attributes$7.maxInventoryReached);
          const errorMessagePosition = form.getAttribute(attributes$7.errorMessagePosition);
          this.showCannotAddMoreInCart = false;
          if (maxInventoryReached === 'true' && errorMessagePosition === 'cart') {
            this.showCannotAddMoreInCart = true;
          }
        }

        if (theme.settings.cartType === 'drawer' && this.cartDrawer) {
          event.preventDefault();
        }

        this.addToCart(formData, button);
      }

      /**
       * Log currently rendered discount codes from the DOM
       * This is the post-render check that shows what discounts are actually visible in the UI
       *
       * @return {Void}
       */
      logRenderedDiscounts() {
        if (!this.cart) return;

        const discountElements = this.cart.querySelectorAll('[data-discount-body],[data-discount-title]');
        if (discountElements.length === 0) {
          console.log(`[Cart discounts] Applied: (none)`);
          return;
        }

        const renderedDiscounts = Array.from(discountElements)
          .map((el) => el?.dataset?.discountTitle || el?.dataset?.discountCode)
          .filter(Boolean);

        if (renderedDiscounts.length > 0) {
          console.log(`[Cart discounts] ✅ Applied: ${renderedDiscounts.map((discount) => `"${discount}"`).join(', ')}`);
        }
      }

      /**
       * Clear discount error message UI
       *
       * @return {Void}
       */
      clearDiscountErrors() {
        if (this.discountErrorMessage) {
          this.discountErrorMessage.classList.add('hidden');
          this.discountErrorMessage.textContent = '';
        }
        this.discountError = false;
        this.shippingDiscountError = false;
        this.pendingDiscountCheck = null;
      }

      /**
       * Bind event listeners for discount elements.
       * This includes applying, removing, and clearing errors on UI interaction.
       *
       * @return  {Void}
       */
      bindDiscountEventListeners() {
        if (!this.hasDiscountBlock) return;

        // Apply new discount
        if (this.discountButton) {
          this.discountButton.addEventListener('click', (event) => {
            event.preventDefault();

            const newDiscountCode = this.discountInput.value.trim();
            this.discountInput.value = '';

            if (newDiscountCode) {
              this.applyDiscount(newDiscountCode);
            }
          });
        }

        // Remove existing discount (bind only; do not mutate local code list)
        document.querySelectorAll(selectors$c.discountBody)?.forEach((discount) => {
          const discountCode = discount.dataset.discountCode;

          // Add event listener to remove discount
          discount.querySelector(selectors$c.removeDiscount)?.addEventListener('click', (event) => {
            event.preventDefault();
            this.removeDiscount(discountCode);
          });
        });

        // Clear error messages on user interaction
        if (this.discountInput) {
          if (this.onDiscountInputChange) {
            this.discountInput.removeEventListener('input', this.onDiscountInputChange);
          }
          this.onDiscountInputChange = () => this.clearDiscountErrors();
          this.discountInput.addEventListener('input', this.onDiscountInputChange);
        }
      }

      /**
       * Apply a discount code to the cart.
       * - Reads current applied codes from /cart.js to avoid stale state
       * - Prevents duplicate submissions
       *
       * @param {string} discountCode - The code entered by the customer
       * @return {Promise<void>}
       */
      async applyDiscount(discountCode) {
        const inputCode = String(discountCode || '').trim();
        if (!inputCode) return;

        const currentCodes = await this.getExistingDiscountCodes();
        const lowerInput = inputCode.toLowerCase();
        const hasDuplicate = [...currentCodes, ...this.existingDiscountCodes].some((code) => String(code).toLowerCase() === lowerInput);

        if (hasDuplicate) {
          if (this.discountErrorMessage) {
            this.discountErrorMessage.classList.remove('hidden');
            this.discountErrorMessage.textContent = window.theme.strings.discount_already_applied;
            console.log(`[Cart discounts] ❌ "${inputCode}" already applied`);
          }
          return;
        }

        console.log(`[Cart discounts] Attempting to apply: "${inputCode}"`);

        const proposedCodes = [...currentCodes, inputCode].join(',');
        this.updateCartDiscounts(proposedCodes, inputCode);
      }

      /**
       * Remove a discount code from the cart.
       * - Reads current applied codes from /cart.js
       * - Submits the remaining codes to the cart update endpoint
       *
       * @param {string} discountCode - The code to remove
       * @return {Promise<void>}
       */
      async removeDiscount(discountCode) {
        const currentCodes = await this.getExistingDiscountCodes();
        const target = String(discountCode || '').toLowerCase();
        const canonical = currentCodes.find((code) => String(code).toLowerCase() === target);
        if (!canonical) return;

        console.log(`[Cart discounts] Removing "${discountCode}"`);

        const proposedCodes = currentCodes.filter((code) => code !== canonical).join(',');
        this.updateCartDiscounts(proposedCodes);
      }

      /**
       * Create or replace the AbortController used for discount update requests.
       * Aborts any in-flight submission so the latest attempt is authoritative.
       *
       * @return {AbortController}
       */
      createDiscountAbortController() {
        if (this.activeDiscountFetch) {
          this.activeDiscountFetch.abort();
        }
        this.activeDiscountFetch = new AbortController();
        return this.activeDiscountFetch;
      }

      /**
       * Get currently applied discount codes from the Cart API (GET /cart.js).
       * Returns only codes that Shopify marks as applicable; falls back to in-memory state on error.
       *
       * @return {Promise<string[]>}
       */
      async getExistingDiscountCodes() {
        try {
          const response = await fetch(`${window.Shopify.routes.root}cart.js`, {headers: {Accept: 'application/json'}});
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const cart = await response.json();
          const raw = Array.isArray(cart.discount_codes) ? cart.discount_codes : [];
          return raw.filter((d) => d.applicable).map((d) => d.code);
        } catch (e) {
          return Array.isArray(this.existingDiscountCodes) ? this.existingDiscountCodes.slice() : [];
        }
      }

      /**
       * POST discount update to Shopify's cart update endpoint and parse result.
       *
       * @param {string} discountString - CSV of discount codes to attempt
       * @param {AbortSignal} [signal] - Optional abort signal for in-flight cancellation
       * @return {Promise<{data: any, appliedCodes: string[]}>}
       */
      async updateAndParse(discountString, signal) {
        const response = await fetch(window.theme.routes.cart_update_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            discount: discountString,
          }),
          signal,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        try {
          const data = JSON.parse(text);
          const rawCodes = Array.isArray(data.discount_codes) ? data.discount_codes : [];
          const appliedCodes = rawCodes.filter((d) => d.applicable).map((d) => d.code);
          return {data, appliedCodes};
        } catch (e) {
          console.error('Failed to parse cart update response:', text);
          throw new Error('Invalid JSON response from server.');
        }
      }

      /**
       * Make a cart discount update and refresh UI.
       * - Disables inputs, shows loading, and uses an AbortController
       * - Sets discountError when attemptedCode is present and not applicable
       * - Syncs local state from server and triggers a cart re-render
       *
       * @param {string} discountString - CSV of codes to set on the cart
       * @param {string|null} attemptedCode - Code the user just tried to add (for UX messaging)
       * @return {Promise<void>}
       */
      async updateCartDiscounts(discountString, attemptedCode = null) {
        this.disableCartButtons();
        this.addLoadingClass();
        this.discountError = false;
        this.shippingDiscountError = false;
        const abortController = this.createDiscountAbortController();

        try {
          // Capture currently visible discount codes rendered by Liquid (shipping codes are not rendered)
          const visibleCodesBefore = Array.from(document.querySelectorAll(selectors$c.discountBody))
            .map((el) => el?.dataset?.discountCode)
            .filter(Boolean);

          const {data, appliedCodes} = await this.updateAndParse(discountString, abortController.signal);
          if (attemptedCode) {
            const attempted = (Array.isArray(data.discount_codes) ? data.discount_codes : []).find((d) => d.code === attemptedCode);
            this.discountError = Boolean(attempted && attempted.applicable === false);
            const attemptedApplicable = Boolean(attempted && attempted.applicable === true);
            const codeIncluded = appliedCodes.some((c) => String(c).toLowerCase() === String(attemptedCode).toLowerCase());
            // Defer detection to after the UI re-renders
            this.pendingDiscountCheck = {
              attemptedCode,
              attemptedApplicable,
              codeIncluded,
              visibleCodesBefore,
            };
          } else {
            this.discountError = false;
          }

          this.existingDiscountCodes = appliedCodes;
          this.getCart();
        } catch (error) {
          // Silently ignore aborted discount requests to avoid noisy logs and stale refreshes
          const isAbortError = error && (error.name === 'AbortError' || (typeof error.message === 'string' && error.message.toLowerCase().includes('abort')));
          if (!isAbortError) {
            console.log(error);
            this.getCart(); // Sync cart state on non-abort errors
          }
        } finally {
          this.activeDiscountFetch = null;
          this.removeLoadingClass();
          this.enableCartButtons();
        }
      }

      /**
       * Cart events
       *
       * @return  {Void}
       */

      cartEvents() {
        if (this.cartTermsCheckbox) {
          this.cartTermsCheckbox.removeEventListener('change', this.formSubmitHandler);
          this.cartCheckoutButtonWrapper.removeEventListener('click', this.formSubmitHandler);
          this.cartForm.removeEventListener('submit', this.formSubmitHandler);

          this.cartTermsCheckbox.addEventListener('change', this.formSubmitHandler);
          this.cartCheckoutButtonWrapper.addEventListener('click', this.formSubmitHandler);
          this.cartForm.addEventListener('submit', this.formSubmitHandler);
        }
      }

      formSubmitHandler() {
        const termsAccepted = document.querySelector(selectors$c.cartTermsCheckbox).checked;
        const termsError = document.querySelector(selectors$c.termsErrorMessage);

        // Disable form submit if terms and conditions are not accepted
        if (!termsAccepted) {
          if (document.querySelector(selectors$c.termsErrorMessage).length > 0) {
            return;
          }

          termsError.innerText = theme.strings.cartAcceptanceError;
          this.cartCheckoutButton.setAttribute(attributes$7.disabled, true);
          termsError.classList.add(classes$9.expanded);
        } else {
          termsError.classList.remove(classes$9.expanded);
          this.cartCheckoutButton.removeAttribute(attributes$7.disabled);
        }
      }

      /**
       * Cart event remove out of stock error
       *
       * @return  {Void}
       */

      formErrorsEvents(errorContainer) {
        const buttonErrorClose = errorContainer.querySelector(selectors$c.formCloseError);
        buttonErrorClose?.addEventListener('click', (e) => {
          e.preventDefault();

          if (errorContainer) {
            errorContainer.classList.remove(classes$9.visible);
          }
        });
      }

      /**
       * Get response from the cart
       *
       * @return  {Void}
       */

      getCart() {
        fetch(theme.routes.cart_url + '?section_id=api-cart-items')
          .then(this.cartErrorsHandler)
          .then((response) => response.text())
          .then((response) => {
            window.PresidioPlus = window.PresidioPlus || {};
            let shouldRender = true;

            // Check if GWP/BOGO is active in global config
            const isGwpActive = window.GWP_CART_DRAWER_CONFIG || window.BUY_X_GET_Y_CART_DRAWER_CONFIG;

            // If GWP is active, and the extension has NOT finished processing yet, STOP rendering.
            if (isGwpActive && window.PresidioPlus.gwpProcessed === false) {
              shouldRender = false;
            }
            const element = document.createElement('div');
            element.innerHTML = response;

            if (shouldRender) {
              const cleanResponse = element.querySelector(selectors$c.apiContent);
              this.build(cleanResponse);
              // CRITICAL FIX: Do NOT reset window.PresidioPlus.gwpProcessed = false here.
              // Leaving it true prevents the infinite loop when the extension sees the update.
            }
          })
          .catch((error) => console.log(error));
      }

      /**
       * Add item(s) to the cart and show the added item(s)
       *
       * @param   {String}  formData
       * @param   {DOM Element}  button
       *
       * @return  {Void}
       */

      addToCart(formData, button) {
        window.PresidioPlus = window.PresidioPlus || {};
        window.PresidioPlus.gwpProcessed = false;

        let headers = {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/javascript',
        };

        if (Array.isArray(formData)) {
          headers = {
            'Content-Type': 'application/json',
            Accept: 'application/javascript',
          };
          formData = JSON.stringify({items: formData});
        }

        if (this.cart) {
          this.cart.classList.add(classes$9.loading);
        }

        const quickAddHolder = button?.closest(selectors$c.quickAddHolder);

        if (button) {
          button.classList.add(classes$9.loading);
          button.disabled = true;
        }

        if (quickAddHolder) {
          quickAddHolder.classList.add(classes$9.visible);
        }

        fetch(theme.routes.cart_add_url, {
          method: 'POST',
          headers: headers,
          body: formData,
        })
          .then((response) => {
            return response.json();
          })
          .then((response) => {
            if (response.status) {
              this.addToCartError(response, button);

              if (button) {
                button.classList.remove(classes$9.loading);
                button.disabled = false;
              }

              if (!this.showCannotAddMoreInCart) return;
            }

            if (this.cart) {
              if (button) {
                button.classList.remove(classes$9.loading);
                button.classList.add(classes$9.added);

                button.dispatchEvent(
                  new CustomEvent('theme:product:add', {
                    detail: {
                      response: response,
                      button: button,
                    },
                    bubbles: true,
                  })
                );
              }
              if (theme.settings.cartType === 'page') {
                window.location = theme.routes.cart_url;
                return;
              }
              // Check if GWP/BOGO extension is active - if so, let the extension handle the cart refresh
              const isGwpActive = window.GWP_CART_DRAWER_CONFIG || window.BUY_X_GET_Y_CART_DRAWER_CONFIG;
              if (!isGwpActive) {
                this.getCart();
              } else {
                // Trigger GWP extension to process the cart, it will dispatch theme:cart:refresh when done
                document.dispatchEvent(
                  new CustomEvent('theme:cart:change', {
                    bubbles: true,
                    detail: {source: 'theme-add-to-cart'},
                  })
                );
              }
            } else {
              // Redirect to cart page if "Add to cart" is successful
              window.location = theme.routes.cart_url;
            }

            if (typeof formData === 'string') return;

            publish(theme.PUB_SUB_EVENTS.cartUpdate, {
              source: 'product-form',
              productVariantId: formData?.get('id'),
              cartData: response,
            });
          })
          .catch((error) => {
            this.addToCartError(error, button);
            this.enableCartButtons();
          });
      }

      /**
       * Update cart
       *
       * @param   {Object}  updateData
       *
       * @return  {Void}
       */

      updateCart(updateData = {}, currentItem = null) {
        window.PresidioPlus = window.PresidioPlus || {};
        window.PresidioPlus.gwpProcessed = false;

        this.cart.classList.add(classes$9.loading);

        let updatedQuantity = updateData.quantity;
        if (currentItem !== null) {
          if (updatedQuantity) {
            currentItem.classList.add(classes$9.loading);
          } else {
            currentItem.classList.add(classes$9.removed);
          }
        }
        this.disableCartButtons();

        const newItem = this.cart.querySelector(`[${attributes$7.item}="${updateData.id}"]`) || currentItem;
        const lineIndex = newItem?.hasAttribute(attributes$7.itemIndex) ? parseInt(newItem.getAttribute(attributes$7.itemIndex)) : 0;
        const itemTitle = newItem?.hasAttribute(attributes$7.itemTitle) ? newItem.getAttribute(attributes$7.itemTitle) : null;

        if (lineIndex === 0) return;

        const data = {
          line: lineIndex,
          quantity: updatedQuantity,
        };

        fetch(theme.routes.cart_change_url, {
          method: 'post',
          headers: {'Content-Type': 'application/json', Accept: 'application/json'},
          body: JSON.stringify(data),
        })
          .then((response) => {
            return response.text();
          })
          .then((state) => {
            const parsedState = JSON.parse(state);

            if (parsedState.errors) {
              this.cartUpdateFailed = true;
              this.updateErrorText(itemTitle);
              this.toggleErrorMessage();
              this.resetLineItem(currentItem);
              this.enableCartButtons();
              this.bindDiscountEventListeners();

              return;
            }

            this.logDiscountCodes(parsedState);
            // Check if GWP/BOGO extension is active - if so, let the extension handle the cart refresh
            const isGwpActive = window.GWP_CART_DRAWER_CONFIG || window.BUY_X_GET_Y_CART_DRAWER_CONFIG;
            if (!isGwpActive) {
              this.getCart();
            } else {
              // Trigger GWP extension to process the cart, it will dispatch theme:cart:refresh when done
              document.dispatchEvent(
                new CustomEvent('theme:cart:change', {
                  bubbles: true,
                  detail: {source: 'theme-update-cart'},
                })
              );
            }
          })
          .catch((error) => {
            console.log(error);
            this.enableCartButtons();
          });
      }

      /**
       * Reset line item initial state
       *
       * @return  {Void}
       */
      resetLineItem(item) {
        const qtyInput = item.querySelector(selectors$c.qtyInput);
        const qty = qtyInput.getAttribute('value');

        qtyInput.value = qty;
        qtyInput
          .closest('quantity-input')
          ?.querySelector('popout-select')
          ?.dispatchEvent(
            new CustomEvent('theme:popout:update', {
              detail: {
                value: qty,
              },
              bubbles: true,
            })
          );

        item.classList.remove(classes$9.loading);
      }

      /**
       * Add loading class to cart
       *
       * @return  {Void}
       */
      addLoadingClass() {
        if (this.cart) {
          this.cart.classList.add(classes$9.loading);
        }
      }

      /**
       * Remove loading class from cart
       *
       * @return  {Void}
       */
      removeLoadingClass() {
        if (this.cart) {
          this.cart.classList.remove(classes$9.loading);
        }
      }

      /**
       * Disable cart buttons and inputs
       *
       * @return  {Void}
       */
      disableCartButtons() {
        const inputs = this.cart.querySelectorAll('input');
        const buttons = this.cart.querySelectorAll(`button, ${selectors$c.cartItemRemove}`);

        if (inputs.length) {
          inputs.forEach((item) => {
            item.classList.add(classes$9.disabled);
            item.blur();
            item.disabled = true;
          });
        }

        if (buttons.length) {
          buttons.forEach((item) => {
            item.setAttribute(attributes$7.disabled, true);
          });
        }
      }

      /**
       * Enable cart buttons and inputs
       *
       * @return  {Void}
       */
      enableCartButtons() {
        const inputs = this.cart.querySelectorAll('input');
        const buttons = this.cart.querySelectorAll(`button, ${selectors$c.cartItemRemove}`);

        inputs?.forEach((item) => {
          item.classList.remove(classes$9.disabled);
          item.disabled = false;
        });

        buttons?.forEach((item) => {
          item.removeAttribute(attributes$7.disabled);
        });

        this.cart.classList.remove(classes$9.loading);
      }

      /**
       * Update error text
       *
       * @param   {String}  itemTitle
       *
       * @return  {Void}
       */

      updateErrorText(itemTitle) {
        this.cartErrorHolder.querySelector(selectors$c.errorMessage).innerText = itemTitle;
      }

      /**
       * Toggle error message
       *
       * @return  {Void}
       */

      toggleErrorMessage() {
        if (!this.cartErrorHolder) return;

        this.cartErrorHolder.classList.toggle(classes$9.expanded, this.cartUpdateFailed);

        // Reset cart error events flag
        this.cartUpdateFailed = false;
      }

      /**
       * Handle errors
       *
       * @param   {Object}  response
       *
       * @return  {Object}
       */

      cartErrorsHandler(response) {
        if (!response.ok) {
          return response.json().then(function (json) {
            const e = new FetchError({
              status: response.statusText,
              headers: response.headers,
              json: json,
            });
            throw e;
          });
        }
        return response;
      }

      /**
       * Add to cart error handle
       *
       * @param   {Object}  data
       * @param   {DOM Element/Null} button
       *
       * @return  {Void}
       */

      /**
       * Hide error message container as soon as an item is successfully added to the cart
       */
      hideAddToCartErrorMessage() {
        const holder = document.querySelector(selectors$c.formWrapper);
        const errorContainer = holder?.querySelector(selectors$c.formErrorsContainer);

        errorContainer?.classList.remove(classes$9.visible);
      }

      addToCartError(data, button) {
        if (button !== null) {
          const outerContainer = button.closest(selectors$c.outerSection) || button.closest(selectors$c.quickAddHolder) || button.closest(selectors$c.quickAddModal);
          let errorContainer = outerContainer?.querySelector(selectors$c.formErrorsContainer);
          const buttonUpsellHolder = button.closest(selectors$c.quickAddHolder);

          if (buttonUpsellHolder && buttonUpsellHolder.querySelector(selectors$c.formErrorsContainer)) {
            errorContainer = buttonUpsellHolder.querySelector(selectors$c.formErrorsContainer);
          }

          if (errorContainer) {
            let errorMessage = `${data.message}: ${data.description}`;

            if (data.message == data.description) {
              errorMessage = data.message;
            }

            errorContainer.innerHTML = `<div class="errors">${errorMessage}<button type="button" class="errors__close" data-close-error><svg aria-hidden="true" focusable="false" role="presentation" width="24px" height="24px" stroke-width="1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor" class="icon icon-close"><path d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div>`;
            errorContainer.classList.add(classes$9.visible);
            this.formErrorsEvents(errorContainer);
          }

          button.dispatchEvent(
            new CustomEvent('theme:product:add-error', {
              detail: {
                response: data,
                button: button,
              },
              bubbles: true,
            })
          );
        }

        const quickAddHolder = button?.closest(selectors$c.quickAddHolder);

        if (quickAddHolder) {
          quickAddHolder.dispatchEvent(
            new CustomEvent('theme:cart:error', {
              bubbles: true,
              detail: {
                message: data.message,
                description: data.description,
                holder: quickAddHolder,
              },
            })
          );
        }

        this.cart?.classList.remove(classes$9.loading);
      }

      /**
       * Add product to cart events
       *
       * @return  {Void}
       */
      productAddCallback(event) {
        let buttons = [];
        let quickAddHolder = null;
        const hasError = event.type == 'theme:product:add-error';
        const buttonATC = event.detail.button;
        const cartBarButtonATC = document.querySelector(selectors$c.cartBarAdd);

        buttons.push(buttonATC);
        quickAddHolder = buttonATC.closest(selectors$c.quickAddHolder);

        if (cartBarButtonATC) {
          buttons.push(cartBarButtonATC);
        }

        buttons.forEach((button) => {
          button.classList.remove(classes$9.loading);
          if (!hasError) {
            button.classList.add(classes$9.added);
          }
        });

        setTimeout(() => {
          buttons.forEach((button) => {
            button.classList.remove(classes$9.added);
            const isVariantUnavailable =
              button.closest(selectors$c.formWrapper)?.classList.contains(classes$9.variantSoldOut) || button.closest(selectors$c.formWrapper)?.classList.contains(classes$9.variantUnavailable);

            if (!isVariantUnavailable) {
              button.disabled = false;
            }
          });

          if (quickAddHolder && !quickAddHolder.classList.contains(classes$9.expanded)) {
            quickAddHolder.classList.remove(classes$9.visible);
          }
        }, 1000);
      }

      /**
       * Toggle classes on different containers and messages
       *
       * @return  {Void}
       */

      toggleClassesOnContainers() {
        const hasItemsInCart = this.hasItemsInCart();

        this.cart.classList.toggle(classes$9.empty, !hasItemsInCart);

        if (!hasItemsInCart && this.cartDrawer) {
          setTimeout(() => {
            this.a11y.trapFocus(this.cartDrawer, {
              elementToFocus: this.cartDrawer.querySelector(selectors$c.cartDrawerClose),
            });
          }, 100);
        }
      }

      /**
       * Build cart depends on results
       *
       * @param   {Object}  data
       *
       * @return  {Void}
       */

      build(data) {
        const cartItemsData = data.querySelector(selectors$c.apiLineItems);
        const bundleItemsData = data.querySelector(selectors$c.apiBundleItems);
        const cartEmptyData = Boolean(cartItemsData === null && bundleItemsData === null);
        const priceData = data.querySelector(selectors$c.apiCartPrice);
        const cartTotal = data.querySelector(selectors$c.cartTotal);

        if (this.priceHolder && priceData) {
          this.priceHolder.innerHTML = priceData.innerHTML;
        }

        if (cartEmptyData) {
          this.itemsHolder.innerHTML = data.innerHTML;

          if (this.bundleProductsHolder) {
            this.bundleProductsHolder.innerHTML = '';
          }

          this.skipBundleProductsArray = [];
          window.sessionStorage.removeItem('skip_bundle_products');
        } else {
          this.itemsHolder.innerHTML = cartItemsData.innerHTML;

          if (this.bundleProductsHolder && bundleItemsData) {
            this.bundleProductsHolder.innerHTML = bundleItemsData.innerHTML;
          }

          this.skipBundleProductEvent();
          this.checkSkippedBundleProductsFromStorage();
          this.toggleCartBundleWidgetVisibility();
        }

        this.newTotalItems = cartItemsData && cartItemsData.querySelectorAll(selectors$c.item).length ? cartItemsData.querySelectorAll(selectors$c.item).length : 0;
        this.subtotal = cartTotal && cartTotal.hasAttribute(attributes$7.cartTotal) ? parseInt(cartTotal.getAttribute(attributes$7.cartTotal)) : 0;
        this.cartCount = this.getCartItemCount();

        // Dispatch cart change event with data element for upsell blocks updates
        document.dispatchEvent(
          new CustomEvent('theme:cart:change', {
            bubbles: true,
            detail: {
              cartCount: this.cartCount,
              dataElement: data,
            },
          })
        );

        // Update cart total price
        this.cartTotal.innerHTML = this.subtotal === 0 ? window.theme.strings.free : window.theme.formatMoney(this.subtotal, theme.moneyWithCurrencyFormat);

        if (this.totalItems !== this.newTotalItems) {
          this.totalItems = this.newTotalItems;

          this.toggleClassesOnContainers();
        }

        // Add class "is-updated" line items holder to reduce cart items animation delay via CSS variables
        if (this.cartDrawer?.classList.contains(classes$9.open)) {
          this.cart.classList.add(classes$9.updated);
        }

        // Remove cart loading class
        this.cart.classList.remove(classes$9.loading);

        // Prepare empty cart buttons for animation
        if (!this.hasItemsInCart()) {
          this.cartEmpty.querySelectorAll(selectors$c.animation).forEach((item) => {
            item.classList.remove(classes$9.animated);
          });
        }

        if (this.hasDiscountBlock) {
          if (this.discountField) {
            this.discountField.value = this.existingDiscountCodes.join(',');
          }

          // Post-render check for shipping-only discounts based on UI not gaining a new "remove-discount" pill
          if (this.pendingDiscountCheck) {
            const currentVisibleCodes = Array.from(this.cart.querySelectorAll(selectors$c.discountBody))
              .map((el) => el?.dataset?.discountCode)
              .filter(Boolean)
              .map((c) => String(c).toLowerCase());
            const beforeSet = new Set(this.pendingDiscountCheck.visibleCodesBefore.map((c) => String(c).toLowerCase()));
            const attemptedLower = String(this.pendingDiscountCheck.attemptedCode).toLowerCase();
            const uiGainedAttempted = currentVisibleCodes.includes(attemptedLower) && !beforeSet.has(attemptedLower);

            this.shippingDiscountError = Boolean(this.pendingDiscountCheck.attemptedApplicable && this.pendingDiscountCheck.codeIncluded && !uiGainedAttempted);

            this.pendingDiscountCheck = null;
          }

          if (this.shippingDiscountError) {
            if (this.discountErrorMessage) {
              this.discountErrorMessage.textContent = window.theme.strings.shipping_discounts_at_checkout;
              this.discountErrorMessage.classList.remove('hidden');
              console.log(`[Cart discounts] ❌ ${window.theme.strings.shipping_discounts_at_checkout}`);
            }
          } else if (this.discountError) {
            if (this.discountErrorMessage) {
              this.discountErrorMessage.textContent = window.theme.strings.discount_not_applicable;
              this.discountErrorMessage.classList.remove('hidden');
              console.log(`[Cart discounts] ❌ ${window.theme.strings.discount_not_applicable}`);
            }
          } else {
            this.discountErrorMessage?.classList.add('hidden');
          }
        }

        this.freeShippingMessageHandle(this.subtotal);
        this.cartRemoveEvents();
        this.cartUpdateEvents();
        this.enableCartButtons();
        this.updateProgress();
        this.animateItems();

        document.dispatchEvent(new CustomEvent('theme:cart:built', {bubbles: true}));

        this.bindDiscountEventListeners();
        this.logRenderedDiscounts();

        if (!this.showCannotAddMoreInCart) {
          this.hideAddToCartErrorMessage();
          document.dispatchEvent(
            new CustomEvent('theme:product:added', {
              bubbles: true,
            })
          );
        }

        this.toggleErrorMessage();
      }

      /**
       * Get cart item count
       *
       * @return  {Void}
       */

      getCartItemCount() {
        return Array.from(this.cart.querySelectorAll(selectors$c.qtyInput)).reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);
      }

      /**
       * Check for items in the cart
       *
       * @return  {Void}
       */

      hasItemsInCart() {
        return this.totalItems > 0;
      }

      /**
       * Show/hide free shipping message
       *
       * @param   {Number}  total
       *
       * @return  {Void}
       */

      freeShippingMessageHandle(total) {
        if (!this.freeShipping.length) return;

        this.freeShipping.forEach((message) => {
          const hasQualifiedShippingMessage = message.hasAttribute(attributes$7.freeShipping) && message.getAttribute(attributes$7.freeShipping) === 'true' && total >= 0;
          message.classList.toggle(classes$9.success, hasQualifiedShippingMessage && total >= this.freeShippingLimit);
        });
      }

      /**
       * Update progress when update cart
       *
       * @return  {Void}
       */

      updateProgress() {
        this.freeShipping = document.querySelectorAll(selectors$c.freeShipping);

        if (!this.freeShipping.length) return;

        let hasReachedLimit = this.freeShippingLimit > 0 && this.subtotal >= this.freeShippingLimit;
        let forceSuccess = false;

        if (!this.promotion1Enabled && !this.promotion2Enabled) {
          hasReachedLimit = true;
          forceSuccess = true;
        } else if (this.promotion1Enabled && !this.promotion2Enabled && this.freeShippingLimit === 0) {
          hasReachedLimit = true;
          forceSuccess = true;
        } else if (!this.promotion1Enabled && this.promotion2Enabled && this.promoCenterLimit === 0) {
          hasReachedLimit = true;
          forceSuccess = true;
        } else if (this.promotion1Enabled && this.promotion2Enabled && this.freeShippingLimit === 0 && this.promoCenterLimit === 0) {
          hasReachedLimit = true;
          forceSuccess = true;
        }

        const percentValue = this.freeShippingLimit > 0 ? this.subtotal / this.freeShippingLimit : 0;
        const percent = forceSuccess ? 100 : Math.max(0, Math.min(percentValue * 100, 100));

        const dashoffset = this.circumference - ((percent / 100) * this.circumference) / 2;
        const leftToSpendCents = Math.max(0, this.freeShippingLimit - this.subtotal);
        const leftToSpendPromoCents = Math.max(0, this.promoCenterLimit - this.subtotal);
        const leftToSpend = window.theme.formatMoney(leftToSpendCents, theme.moneyFormat);
        const leftToSpendPromoMoney = window.theme.formatMoney(leftToSpendPromoCents, theme.moneyFormat);
        const hasReachedCenterLimit = this.promoCenterLimit > 0 && this.subtotal >= this.promoCenterLimit;

        this.freeShipping.forEach((item) => {
          const progressBar = item.querySelector('[data-progress-bar]');
          const progressGraph = item.querySelector('[data-progress-graph]');
          const leftToSpendMessage = item.querySelector('[data-left-to-spend]');
          const leftToSpendPromo = item.querySelector('[data-left-to-spend-promo]');
          const promoCenter = item.querySelector('[data-promo-center]');
          const isCenterActive = (promoCenter && this.promoCenterLimit === 0) || hasReachedCenterLimit;

          // Update "left to spend" messages
          if (leftToSpendMessage) {
            leftToSpendMessage.innerHTML = leftToSpend.replace('.00', '');
          }

          if (leftToSpendPromo) {
            leftToSpendPromo.innerHTML = leftToSpendPromoMoney.replace('.00', '');
          }

          // Set progress bar value and add animation class
          if (progressBar) {
            progressBar.value = percent;
          }

          // Set circle progress
          if (progressGraph) {
            progressGraph.style.setProperty('--stroke-dashoffset', `${dashoffset}`);
          }

          // Clear all state classes first
          item.classList.remove(classes$9.success, classes$9.active);

          // Apply appropriate state class
          if (hasReachedLimit) {
            // Final goal reached - show success
            item.classList.add(classes$9.success);
          } else if (isCenterActive && !hasReachedLimit) {
            // Center goal reached but not final goal - show active (dual promo)
            item.classList.add(classes$9.active);
          }
        });
      }

      /**
       * Remove multiple products from cart
       *
       * @param   {Array}  A list of products
       *
       * @return  {Void}
       */
      removeMultipleProducts(productsArr) {
        let formData = new FormData();

        productsArr.forEach((element) => {
          formData.append(`updates[${element}]`, 0);
        });

        this.cart.classList.add(classes$9.loading);
        this.disableCartButtons();

        fetch(theme.routes.cart_update_url, {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.text())
          .then((state) => {
            try {
              const parsedState = JSON.parse(state);
              if (!parsedState.errors) {
                this.logDiscountCodes(parsedState);
              }
            } catch (e) {
              // If response is not JSON, continue with getCart()
            }
            this.getCart();
          })
          .catch((error) => {
            console.log(error);
            this.enableCartButtons();
          });
      }

      /**
       * Skip bundle product
       */
      skipBundleProductEvent() {
        if (this.bundleProductsHolder === null) {
          return;
        }

        const bundleSkipButtons = this.bundleProductsHolder?.querySelectorAll('[data-skip-upsell-product]') || [];

        if (bundleSkipButtons.length) {
          bundleSkipButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
              event.preventDefault();

              const productID = button.closest(selectors$c.quickAddHolder).getAttribute(attributes$7.quickAddHolder);
              const isBundle = !!button.closest(selectors$c.bundleWidget);

              if (isBundle && !this.skipBundleProductsArray.includes(productID)) {
                this.skipBundleProductsArray.push(productID);
                window.sessionStorage.setItem('skip_bundle_products', this.skipBundleProductsArray);
                this.removeBundleProduct(productID);
              }

              this.toggleCartBundleWidgetVisibility();
            });
          });
        }
      }

      /**
       * Check for skipped bundle product added to session storage.
       * Prunes storage to only IDs still in the current bundle widget (before removing from DOM).
       */
      checkSkippedBundleProductsFromStorage() {
        const currentBundleIds = this.bundleProductsHolder
          ? Array.from(this.bundleProductsHolder.querySelectorAll(selectors$c.quickAddHolder))
              .map((el) => el.getAttribute(attributes$7.quickAddHolder))
              .filter(Boolean)
          : [];
        const skippedItems = window.sessionStorage.getItem('skip_bundle_products');
        if (skippedItems) {
          skippedItems.split(',').forEach((productID) => {
            if (!this.skipBundleProductsArray.includes(productID)) {
              this.skipBundleProductsArray.push(productID);
            }
            this.removeBundleProduct(productID);
          });
        }
        this.skipBundleProductsArray = this.skipBundleProductsArray.filter((id) => currentBundleIds.includes(id));
        if (this.skipBundleProductsArray.length) {
          window.sessionStorage.setItem('skip_bundle_products', this.skipBundleProductsArray);
        } else {
          window.sessionStorage.removeItem('skip_bundle_products');
        }
      }

      removeBundleProduct(productID) {
        if (!this.bundleProductsHolder) return;

        const product = this.bundleProductsHolder.querySelector(`[${attributes$7.quickAddHolder}="${productID}"]`);
        if (product && product.parentNode) {
          product.parentNode.remove();
        }
      }

      /**
       * Show or hide cart bundle products widget visibility
       */
      toggleCartBundleWidgetVisibility() {
        if (!this.bundleProductsHolder) return;

        const bundleItems = this.bundleProductsHolder.querySelectorAll(selectors$c.quickAddHolder);
        const bundleWidget = this.bundleProductsHolder.closest(selectors$c.bundleWidget);

        if (!bundleWidget) return;

        bundleWidget.classList.toggle(classes$9.hidden, !bundleItems.length);
        if (bundleItems.length && !bundleWidget.hasAttribute(attributes$7.open) && bundleWidget.hasAttribute('data-upsell-auto-open')) {
          bundleWidget.setAttribute(attributes$7.open, true);
          const widgetBody = bundleWidget.querySelector(selectors$c.collapsibleBody);
          if (widgetBody) {
            widgetBody.style.height = 'auto';
          }
        }
      }

      /**
       * Remove initially added AOS classes to allow animation on cart drawer open
       *
       * @return  {Void}
       */
      resetAnimatedItems() {
        this.cart.querySelectorAll(selectors$c.animation).forEach((item) => {
          item.classList.remove(classes$9.animated);
          item.classList.remove(classes$9.hiding);
        });
      }

      /**
       * Cart elements opening animation
       *
       * @return  {Void}
       */
      animateItems(e) {
        requestAnimationFrame(() => {
          let cart = this.cart;

          if (e && e.detail && e.detail.target) {
            cart = e.detail.target;
          }

          cart?.querySelectorAll(selectors$c.animation).forEach((item) => {
            item.classList.add(classes$9.animated);
          });
        });
      }

      /**
       * Collect discount codes from cart state
       * Builds a complete list of discount codes from cart and line items applications
       * Matches the Liquid logic in cart-price.liquid
       *
       * @param   {Object}  parsedState  Parsed cart state from API
       * @return  {Void}
       */
      logDiscountCodes(parsedState) {
        let discountCodes = new Set();
        const discountKeys = new Set();

        // Helper function to check and add unique discounts
        const addDiscount = (title, type) => {
          const key = `${title}|${type}`;
          if (!discountKeys.has(key)) {
            discountKeys.add(key);
            discountCodes.add({title, type});
          }
        };

        // Get cart-level discount codes
        if (parsedState.cart_level_discount_applications.length > 0) {
          parsedState.cart_level_discount_applications.forEach((application) => {
            if (application.discount_application) {
              addDiscount(application.discount_application.title, application.discount_application.type);
            }
          });
        }

        // Get line-level discount codes from all items
        if (parsedState.items.length > 0) {
          parsedState.items.forEach((item) => {
            if (item.line_level_discount_allocations.length > 0) {
              item.line_level_discount_allocations.forEach((allocation) => {
                addDiscount(allocation.discount_application.title, allocation.discount_application.type);
              });
            }
          });
        }

        if (discountCodes.size > 0) {
          console.log('Discount details:', Array.from(discountCodes));
        }
      }
    }

    if (!customElements.get('cart-items')) {
      customElements.define('cart-items', CartItems);
    }

    const attributes$6 = {
      count: 'data-cart-count',
      limit: 'data-limit',
    };

    class CartCount extends HTMLElement {
      constructor() {
        super();

        this.cartCount = null;
        this.limit = this.getAttribute(attributes$6.limit);
        this.onCartChangeCallback = this.onCartChange.bind(this);
      }

      connectedCallback() {
        document.addEventListener('theme:cart:change', this.onCartChangeCallback);
      }

      disconnectedCallback() {
        document.addEventListener('theme:cart:change', this.onCartChangeCallback);
      }

      onCartChange(event) {
        // Ignore events without cartCount (e.g., GWP extension events)
        if (event.detail.cartCount === undefined) return;

        this.cartCount = event.detail.cartCount;
        this.update();
      }

      update() {
        if (this.cartCount !== null) {
          this.setAttribute(attributes$6.count, this.cartCount);
          let countValue = this.cartCount;

          if (this.limit && this.cartCount >= this.limit) {
            countValue = '9+';
          }

          this.innerText = countValue;
        }
      }
    }

    if (!customElements.get('cart-count')) {
      customElements.define('cart-count', CartCount);
    }

    if (!customElements.get('collapsible-elements')) {
      customElements.define(
        'collapsible-elements',
        class CollapsibleElements extends HTMLElement {
          constructor() {
            super();

            this.collapsibles = this.querySelectorAll('[data-collapsible]');
            this.single = this.hasAttribute('single');
            this.toggle = this.toggle.bind(this);
            this.siblings = [...this.parentElement.children].filter((el) => el !== this && el.matches('[data-collapsible-element]')).flatMap((el) => [...el.querySelectorAll('[data-collapsible]')]);
          }

          connectedCallback() {
            this.toggle();
            document.addEventListener('theme:resize:width', this.toggle);

            this.collapsibles.forEach((collapsible) => {
              const trigger = collapsible.querySelector('[data-collapsible-trigger]');
              const body = collapsible.querySelector('[data-collapsible-body]');

              trigger?.addEventListener('click', (event) => this.onCollapsibleClick(event));

              body?.addEventListener('transitionend', (event) => {
                if (event.target !== body) return;

                if (collapsible.getAttribute('open') == 'true') {
                  this.setBodyHeight(body, 'auto');
                }

                if (collapsible.getAttribute('open') == 'false') {
                  collapsible.removeAttribute('open');
                  this.setBodyHeight(body, '');
                }
              });
            });
          }

          disconnectedCallback() {
            document.removeEventListener('theme:resize:width', this.toggle);
          }

          toggle() {
            const isDesktopView = !theme.isMobile;

            this.collapsibles.forEach((collapsible) => {
              if (!collapsible.hasAttribute('desktop') && !collapsible.hasAttribute('mobile')) return;

              const enableDesktop = collapsible.hasAttribute('desktop') ? collapsible.getAttribute('desktop') : 'true';
              const enableMobile = collapsible.hasAttribute('mobile') ? collapsible.getAttribute('mobile') : 'true';
              const isEligible = (isDesktopView && enableDesktop == 'true') || (!isDesktopView && enableMobile == 'true');
              const body = collapsible.querySelector('[data-collapsible-body]');

              if (isEligible) {
                collapsible.removeAttribute('disabled');
                collapsible.querySelector('[data-collapsible-trigger]').removeAttribute('tabindex');
                collapsible.removeAttribute('open');

                this.setBodyHeight(body, '');
              } else {
                collapsible.setAttribute('disabled', '');
                collapsible.setAttribute('open', true);
                collapsible.querySelector('[data-collapsible-trigger]').setAttribute('tabindex', -1);
              }
            });
          }

          open(collapsible) {
            if (collapsible.getAttribute('open') == 'true') return;

            const body = collapsible.querySelector('[data-collapsible-body]');
            const content = collapsible.querySelector('[data-collapsible-content]');

            collapsible.setAttribute('open', true);

            this.setBodyHeight(body, content.offsetHeight);
          }

          close(collapsible) {
            if (!collapsible.hasAttribute('open')) return;

            const body = collapsible.querySelector('[data-collapsible-body]');
            const content = collapsible.querySelector('[data-collapsible-content]');

            this.setBodyHeight(body, content.offsetHeight);

            collapsible.setAttribute('open', false);

            setTimeout(() => {
              requestAnimationFrame(() => {
                this.setBodyHeight(body, 0);
              });
            });
          }

          setBodyHeight(body, contentHeight) {
            body.style.height = contentHeight !== 'auto' && contentHeight !== '' ? `${contentHeight}px` : contentHeight;
          }

          onCollapsibleClick(event) {
            event.preventDefault();

            const trigger = event.target;
            const collapsible = trigger.closest('[data-collapsible]');

            // When we want only one item expanded at the same time
            if (this.single) {
              const collapsibles = this.siblings.length ? this.siblings : this.collapsibles;

              collapsibles.forEach((otherCollapsible) => {
                // if otherCollapsible has attribute open and it's not the one we clicked on, remove the open attribute
                if (otherCollapsible.hasAttribute('open') && otherCollapsible != collapsible) {
                  requestAnimationFrame(() => {
                    this.close(otherCollapsible);
                  });
                }
              });
            }

            if (collapsible.hasAttribute('open')) {
              this.close(collapsible);
            } else {
              this.open(collapsible);
            }

            collapsible.dispatchEvent(
              new CustomEvent('theme:form:sticky', {
                bubbles: true,
                detail: {
                  element: 'accordion',
                },
              })
            );
            collapsible.dispatchEvent(
              new CustomEvent('theme:collapsible:toggle', {
                bubbles: true,
              })
            );
          }
        }
      );
    }

    const selectors$b = {
      deferredMediaButton: '[data-deferred-media-button]',
      media: 'video, model-viewer, iframe',
      youtube: '[data-host="youtube"]',
      vimeo: '[data-host="vimeo"]',
      template: 'template',
      video: 'video',
      productModel: 'product-model',
    };

    const attributes$5 = {
      loaded: 'loaded',
      autoplay: 'autoplay',
    };

    class DeferredMedia extends HTMLElement {
      constructor() {
        super();

        const poster = this.querySelector(selectors$b.deferredMediaButton);
        poster?.addEventListener('click', this.loadContent.bind(this));
      }

      loadContent(focus = true) {
        this.pauseAllMedia();

        if (!this.getAttribute(attributes$5.loaded)) {
          const content = document.createElement('div');
          const templateContent = this.querySelector(selectors$b.template).content.firstElementChild.cloneNode(true);
          content.appendChild(templateContent);
          this.setAttribute(attributes$5.loaded, true);

          const mediaElement = this.appendChild(content.querySelector(selectors$b.media));
          if (focus) mediaElement.focus();
          if (mediaElement.nodeName == 'VIDEO' && mediaElement.getAttribute(attributes$5.autoplay)) {
            // Force autoplay on Safari browsers
            mediaElement.play();
          }
        }
      }

      pauseAllMedia() {
        document.querySelectorAll(selectors$b.youtube).forEach((video) => {
          video.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        });
        document.querySelectorAll(selectors$b.vimeo).forEach((video) => {
          video.contentWindow.postMessage('{"method":"pause"}', '*');
        });
        document.querySelectorAll(selectors$b.video).forEach((video) => video.pause());
        document.querySelectorAll(selectors$b.productModel).forEach((model) => {
          if (model.modelViewerUI) model.modelViewerUI.pause();
        });
      }
    }

    if (!customElements.get('deferred-media')) {
      customElements.define('deferred-media', DeferredMedia);
    }

    window.theme.DeferredMedia = window.theme.DeferredMedia || DeferredMedia;

    /*
      Observe whether or not elements are visible in their container.
      Used for sections with horizontal sliders built by native scrolling
    */

    const classes$8 = {
      visible: 'is-visible',
    };

    class IsInView {
      constructor(container, itemSelector) {
        if (!container || !itemSelector) return;

        this.observer = null;
        this.container = container;
        this.itemSelector = itemSelector;

        this.init();
      }

      init() {
        const options = {
          root: this.container,
          threshold: [0.01, 0.5, 0.75, 0.99],
        };

        this.observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio >= 0.99) {
              entry.target.classList.add(classes$8.visible);
            } else {
              entry.target.classList.remove(classes$8.visible);
            }
          });
        }, options);

        this.container.querySelectorAll(this.itemSelector)?.forEach((item) => {
          this.observer.observe(item);
        });
      }

      destroy() {
        this.observer.disconnect();
      }
    }

    const classes$7 = {
      dragging: 'is-dragging',
      enabled: 'is-enabled',
      scrolling: 'is-scrolling',
      visible: 'is-visible',
    };

    const selectors$a = {
      image: 'img, svg',
      productImage: '[data-product-image]',
      slide: '[data-grid-item]',
      slider: '[data-grid-slider]',
    };

    class DraggableSlider {
      constructor(sliderElement) {
        this.slider = sliderElement;
        this.isDown = false;
        this.startX = 0;
        this.scrollLeft = 0;
        this.velX = 0;
        this.scrollAnimation = null;
        this.isScrolling = false;
        this.duration = 800; // Change this value if you want to increase or decrease the velocity

        this.scrollStep = this.scrollStep.bind(this);
        this.scrollToSlide = this.scrollToSlide.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseWheel = this.handleMouseWheel.bind(this);

        this.slider.addEventListener('mousedown', this.handleMouseDown);
        this.slider.addEventListener('mouseleave', this.handleMouseLeave);
        this.slider.addEventListener('mouseup', this.handleMouseUp);
        this.slider.addEventListener('mousemove', this.handleMouseMove);
        this.slider.addEventListener('wheel', this.handleMouseWheel, {passive: true});

        this.slider.classList.add(classes$7.enabled);
      }

      handleMouseDown(e) {
        e.preventDefault();
        this.isDown = true;
        this.startX = e.pageX - this.slider.offsetLeft;
        this.scrollLeft = this.slider.scrollLeft;
        this.cancelMomentumTracking();
      }

      handleMouseLeave() {
        if (!this.isDown) return;
        this.isDown = false;
        this.beginMomentumTracking();
      }

      handleMouseUp() {
        this.isDown = false;
        this.beginMomentumTracking();
      }

      handleMouseMove(e) {
        if (!this.isDown) return;
        e.preventDefault();

        const x = e.pageX - this.slider.offsetLeft;
        const ratio = 1; // Increase the number to make it scroll-fast
        const walk = (x - this.startX) * ratio;
        const prevScrollLeft = this.slider.scrollLeft;
        const direction = walk > 0 ? 1 : -1;

        this.slider.classList.add(classes$7.dragging, classes$7.scrolling);
        this.slider.scrollLeft = this.scrollLeft - walk;

        if (this.slider.scrollLeft !== prevScrollLeft) {
          this.velX = this.slider.scrollLeft - prevScrollLeft || direction;
        }
      }

      handleMouseWheel() {
        this.cancelMomentumTracking();
        this.slider.classList.remove(classes$7.scrolling);
      }

      beginMomentumTracking() {
        this.isScrolling = false;
        this.slider.classList.remove(classes$7.dragging);
        this.cancelMomentumTracking();
        this.scrollToSlide();
      }

      cancelMomentumTracking() {
        cancelAnimationFrame(this.scrollAnimation);
      }

      scrollToSlide() {
        if (!this.velX && !this.isScrolling) return;

        const slide = this.slider.querySelector(`${selectors$a.slide}.${classes$7.visible}`);
        if (!slide) return;

        const gap = parseInt(window.getComputedStyle(slide).marginRight) || 0;
        const slideWidth = slide.offsetWidth + gap;
        const targetPosition = slide.offsetLeft;
        const direction = this.velX > 0 ? 1 : -1;
        const slidesToScroll = Math.floor(Math.abs(this.velX) / 100) || 1;

        this.startPosition = this.slider.scrollLeft;
        this.distance = targetPosition - this.startPosition;
        this.startTime = performance.now();
        this.isScrolling = true;

        // Make sure it will move to the next slide if you don't drag far enough
        if (direction < 0 && this.velX < slideWidth) {
          this.distance -= slideWidth * slidesToScroll;
        }

        // Make sure it will move to the previous slide if you don't drag far enough
        if (direction > 0 && this.velX < slideWidth) {
          this.distance += slideWidth * slidesToScroll;
        }

        // Run scroll animation
        this.scrollAnimation = requestAnimationFrame(this.scrollStep);
      }

      scrollStep() {
        const currentTime = performance.now() - this.startTime;
        const scrollPosition = parseFloat(this.easeOutCubic(Math.min(currentTime, this.duration))).toFixed(1);

        this.slider.scrollLeft = scrollPosition;

        if (currentTime < this.duration) {
          this.scrollAnimation = requestAnimationFrame(this.scrollStep);
        } else {
          this.slider.classList.remove(classes$7.scrolling);

          // Reset velocity
          this.velX = 0;
          this.isScrolling = false;
        }
      }

      easeOutCubic(t) {
        t /= this.duration;
        t--;
        return this.distance * (t * t * t + 1) + this.startPosition;
      }

      destroy() {
        this.slider.classList.remove(classes$7.enabled);
        this.slider.removeEventListener('mousedown', this.handleMouseDown);
        this.slider.removeEventListener('mouseleave', this.handleMouseLeave);
        this.slider.removeEventListener('mouseup', this.handleMouseUp);
        this.slider.removeEventListener('mousemove', this.handleMouseMove);
        this.slider.removeEventListener('wheel', this.handleMouseWheel);
      }
    }

    const selectors$9 = {
      buttonArrow: '[data-button-arrow]',
      collectionImage: '[data-collection-image]',
      columnImage: '[data-column-image]',
      productImage: '[data-product-image]',
      slide: '[data-grid-item]',
      slider: '[data-grid-slider]',
    };

    const attributes$4 = {
      buttonPrev: 'data-button-prev',
      buttonNext: 'data-button-next',
      alignArrows: 'align-arrows',
    };

    const classes$6 = {
      arrows: 'slider__arrows',
      visible: 'is-visible',
      scrollSnapDisabled: 'scroll-snap-disabled',
    };

    if (!customElements.get('grid-slider')) {
      customElements.define(
        'grid-slider',

        class GridSlider extends HTMLElement {
          constructor() {
            super();

            this.isInitialized = false;
            this.draggableSlider = null;
            this.positionArrows = this.positionArrows.bind(this);
            this.onButtonArrowClick = (e) => this.buttonArrowClickEvent(e);
            this.slidesObserver = null;
            this.firstLastSlidesObserver = null;
            this.isDragging = false;
            this.toggleSlider = this.toggleSlider.bind(this);
          }

          connectedCallback() {
            this.init();
            this.addEventListener('theme:grid-slider:init', this.init);
          }

          init() {
            this.slider = this.querySelector(selectors$9.slider);
            this.slides = this.querySelectorAll(selectors$9.slide);
            this.buttons = this.querySelectorAll(selectors$9.buttonArrow);
            this.slider.classList.add(classes$6.scrollSnapDisabled);
            this.toggleSlider();
            document.addEventListener('theme:resize:width', this.toggleSlider);

            window.theme
              .waitForAllAnimationsEnd(this)
              .then(() => {
                this.slider.classList.remove(classes$6.scrollSnapDisabled);
              })
              .catch(() => {
                this.slider.classList.remove(classes$6.scrollSnapDisabled);
              });
          }

          toggleSlider() {
            const sliderWidth = this.slider.clientWidth;
            const slidesWidth = this.getSlidesWidth();
            const isEnabled = sliderWidth < slidesWidth;

            if (isEnabled && (!theme.isMobile || !window.theme.touch)) {
              if (this.isInitialized) return;

              this.slidesObserver = new IsInView(this.slider, selectors$9.slide);

              this.initArrows();
              this.isInitialized = true;

              // Create an instance of DraggableSlider
              this.draggableSlider = new DraggableSlider(this.slider);
            } else {
              this.destroy();
            }
          }

          initArrows() {
            // Create arrow buttons if don't exist
            if (!this.buttons.length) {
              const buttonsWrap = document.createElement('div');
              buttonsWrap.classList.add(classes$6.arrows);
              buttonsWrap.innerHTML = theme.sliderArrows.prev + theme.sliderArrows.next;

              // Append buttons outside the slider element
              this.append(buttonsWrap);
              this.buttons = this.querySelectorAll(selectors$9.buttonArrow);
            }

            this.buttonPrev = this.querySelector(`[${attributes$4.buttonPrev}]`);
            this.buttonNext = this.querySelector(`[${attributes$4.buttonNext}]`);

            this.toggleArrowsObserver();

            if (this.hasAttribute(attributes$4.alignArrows)) {
              this.positionArrows();
              this.arrowsResizeObserver();
            }

            this.buttons.forEach((buttonArrow) => {
              buttonArrow.addEventListener('click', this.onButtonArrowClick);
            });
          }

          buttonArrowClickEvent(e) {
            e.preventDefault();

            const firstVisibleSlide = this.slider.querySelector(`${selectors$9.slide}.${classes$6.visible}`);
            let slide = null;

            if (e.target.hasAttribute(attributes$4.buttonPrev)) {
              slide = firstVisibleSlide?.previousElementSibling;
            }

            if (e.target.hasAttribute(attributes$4.buttonNext)) {
              slide = firstVisibleSlide?.nextElementSibling;
            }

            this.goToSlide(slide);
          }

          removeArrows() {
            this.querySelector(`.${classes$6.arrows}`)?.remove();
          }

          // Go to prev/next slide on arrow click
          goToSlide(slide) {
            if (!slide) return;

            this.slider.scrollTo({
              top: 0,
              left: slide.offsetLeft,
              behavior: 'smooth',
            });
          }

          getSlidesWidth() {
            return this.slider.querySelector(selectors$9.slide)?.clientWidth * this.slider.querySelectorAll(selectors$9.slide).length;
          }

          toggleArrowsObserver() {
            // Add disable class/attribute on prev/next button

            if (this.buttonPrev && this.buttonNext) {
              const slidesCount = this.slides.length;
              const firstSlide = this.slides[0];
              const lastSlide = this.slides[slidesCount - 1];

              const config = {
                attributes: true,
                childList: false,
                subtree: false,
              };

              const callback = (mutationList) => {
                for (const mutation of mutationList) {
                  if (mutation.type === 'attributes') {
                    const slide = mutation.target;
                    const isDisabled = Boolean(slide.classList.contains(classes$6.visible));

                    if (slide == firstSlide) {
                      this.buttonPrev.disabled = isDisabled;
                    }

                    if (slide == lastSlide) {
                      this.buttonNext.disabled = isDisabled;
                    }
                  }
                }
              };

              if (firstSlide && lastSlide) {
                this.firstLastSlidesObserver = new MutationObserver(callback);
                this.firstLastSlidesObserver.observe(firstSlide, config);
                this.firstLastSlidesObserver.observe(lastSlide, config);
              }
            }
          }

          positionArrows() {
            const targetElement =
              this.slider.querySelector(selectors$9.productImage) || this.slider.querySelector(selectors$9.collectionImage) || this.slider.querySelector(selectors$9.columnImage) || this.slider;

            if (!targetElement) return;

            this.style.setProperty('--button-position', `${targetElement.clientHeight / 2}px`);
          }

          arrowsResizeObserver() {
            document.addEventListener('theme:resize:width', this.positionArrows);
          }

          disconnectedCallback() {
            this.destroy();
            document.removeEventListener('theme:resize:width', this.toggleSlider);
          }

          destroy() {
            this.isInitialized = false;
            this.draggableSlider?.destroy();
            this.draggableSlider = null;
            this.slidesObserver?.destroy();
            this.slidesObserver = null;
            this.firstLastSlidesObserver?.disconnect();
            this.firstLastSlidesObserver = null;
            this.removeArrows();

            document.removeEventListener('theme:resize:width', this.positionArrows);
          }
        }
      );
    }

    if (!customElements.get('slider-progress')) {
      customElements.define(
        'slider-progress',

        class SliderProgress extends HTMLElement {
          constructor() {
            super();

            this.scroller = null;
            this.slides = null;
            this.progressEl = null;
            this.progressFill = null;
            this.counter = null;

            this.scrollFrame = null;
            this.mutationObserver = null;
            this.counterMaxFit = 0;
            // true - emit the single-slide intermediate ("2 of 4") on that frame.
            // false - hold the previous range label until a new range fully settles, jumping straight from "1-2 of 4" to "2-3 of 4".
            this.showSingleDigitDuringTransition = false;
            this.initialized = false;

            this.onScroll = this.onScroll.bind(this);
            this.onResize = this.onResize.bind(this);
          }

          connectedCallback() {
            this.init();
          }

          disconnectedCallback() {
            this.destroy();
          }

          init() {
            if (this.initialized) return;

            this.scroller = this.resolveScroller();
            this.progressEl = this.querySelector('[data-slider-progress]');
            this.progressFill = this.querySelector('[data-slider-progress-fill]');
            this.counter = this.querySelector('[data-slider-counter]');

            if (!this.scroller || !this.progressEl) return;

            this.slides = this.scroller.querySelectorAll('[data-slider-progress-item]');

            this.scroller.addEventListener('scroll', this.onScroll, {passive: true});
            document.addEventListener('theme:resize:width', this.onResize);

            // Only observe DOM mutations for sections whose scroller is populated asynchronously after init
            this.observeDynamicContent();

            this.initialized = true;

            // Reserve the worst-case width before the first paint so the track
            // doesn't shift when the visible range cycles (e.g. "2 of 4" vs
            // "3-4 of 4")
            this.reserveCounterSpace();
            if (document.fonts && document.fonts.status !== 'loaded') {
              document.fonts.ready.then(() => this.reserveCounterSpace());
            }

            this.onScroll();
          }

          /*
           * Locate the scrollable target. Prefer an explicit `for` id reference;
           * otherwise fall back to a `[data-grid-slider]` sibling within the same
           * parent so the markup can be co-located with the scroller.
           */
          resolveScroller() {
            const id = this.getAttribute('for');
            if (id) {
              const target = document.getElementById(id);
              if (target) return target;
            }
            return this.parentElement?.querySelector('[data-grid-slider]') || null;
          }

          /*
           * Watch for items and visibility on scrollers populated asynchronously via fetch (e.g. <recently-viewed>)
           * Items arrive via fetch one-by-one while the scroller still carries a `hidden` CSS class.
           * The class is removed only after all items are appended (in `finalize()`).
           * We therefore watch both childList and the class attribute, and only trigger the progress update
           * and disconnect the observer once we have slides and the scroller is visible.
           */
          observeDynamicContent() {
            if (!this.hasAttribute('data-dynamic')) return;

            this.mutationObserver = new MutationObserver(() => {
              const slides = this.scroller.querySelectorAll('[data-slider-progress-item]');
              if (!slides.length || this.scroller.classList.contains('hidden')) return;

              this.slides = slides;
              this.counterMaxFit = 0;
              this.reserveCounterSpace();
              this.onScroll();
              this.mutationObserver.disconnect();
              this.mutationObserver = null;
            });
            this.mutationObserver.observe(this.scroller, {childList: true, attributes: true, attributeFilter: ['class']});
          }

          /*
           * Lock the counter's min-width to the widest label it can ever render
           * for the current slide count. The widest case is the (last-1)-(last)
           * range, e.g. "11-12 of 12"; for a single slide it's just "1 of 1".
           */
          reserveCounterSpace() {
            if (!this.counter || !this.slides?.length) return;
            const total = this.slides.length;
            const ofWord = window.theme?.sliderCounterOf || 'of';
            const widestLabel = total === 1 ? `1 ${ofWord} 1` : `${total - 1}-${total} ${ofWord} ${total}`;

            const previous = this.counter.textContent;
            this.counter.style.minWidth = '';
            this.counter.textContent = widestLabel;
            const width = this.counter.getBoundingClientRect().width;
            this.counter.textContent = previous;
            if (width > 0) this.counter.style.minWidth = `${Math.ceil(width)}px`;
          }

          /*
           * Width-only resize handler. The scroller's natural in-view capacity
           * can change across breakpoints (e.g. 2-up → 1-up), so we drop the
           * cached maxFit before recomputing progress + counter for the new
           * layout.
           */
          onResize() {
            this.counterMaxFit = 0;
            this.onScroll();
          }

          onScroll() {
            if (this.scrollFrame) return;

            // rAF-throttled scroll handler so layout reads + writes happen at
            // most once per frame regardless of how many `scroll` events the
            // browser fires
            this.scrollFrame = requestAnimationFrame(() => {
              this.scrollFrame = null;
              this.updateProgress();
              this.updateCounter();
            });
          }

          updateProgress() {
            if (!this.progressEl || !this.scroller) return;

            // When the mobile layout is a static grid, force the bar hidden on
            // mobile viewports without measuring scroll geometry. This bypasses
            // timing issues where a scroller inside a `content-visibility: hidden`
            // tab returns zero or stale dimensions, leaving the bar incorrectly
            // visible.
            //
            // Skip this guard for sections that have no layout_mobile option and
            // are always a slider at every breakpoint (`data-slider-always`), or
            // for sections that explicitly declare mobile as a slider
            // (`data-mobile-slider`).
            const isMobile = window.innerWidth < window.theme.sizes.small;
            const alwaysSlider = this.hasAttribute('data-slider-always');
            const mobileIsSlider = alwaysSlider || this.hasAttribute('data-mobile-slider');
            const desktopIsSlider = alwaysSlider || this.hasAttribute('data-desktop-slider');
            if (isMobile && !mobileIsSlider) {
              this.progressEl.hidden = true;
              return;
            }
            if (!isMobile && !desktopIsSlider) {
              this.progressEl.hidden = true;
              return;
            }

            const max = this.scroller.scrollWidth - this.scroller.clientWidth;
            const isScrollable = max > 1;
            // Hide the whole progress block when there's nothing to scroll (e.g.
            // few enough items to fit, or breakpoints where the grid renders as
            // a static layout instead of a slider).
            this.progressEl.hidden = !isScrollable;
            if (!this.progressFill) return;
            const ratio = isScrollable ? Math.max(0, Math.min(1, this.scroller.scrollLeft / max)) : 0;
            this.progressFill.style.setProperty('--slider-progress', ratio.toFixed(4));
          }

          updateCounter() {
            if (!this.counter) return;

            const total = this.slides?.length ?? 0;
            if (!total) return;

            const tolerance = 1;
            const left = this.scroller.scrollLeft - tolerance;
            const right = left + this.scroller.clientWidth + tolerance * 2;

            let first = -1;
            let last = -1;
            this.slides.forEach((slide, i) => {
              const slideLeft = slide.offsetLeft;
              const slideRight = slideLeft + slide.offsetWidth;
              if (slideLeft >= left && slideRight <= right) {
                if (first === -1) first = i;
                last = i;
              }
            });

            // Track the largest simultaneous in-view count we've seen for the
            // current viewport. Any later frame where the count drops below this
            // maxFit is a transition between two adjacent ranges (e.g. between
            // "1-2 of 4" and "2-3 of 4"); see `showSingleDigitDuringTransition`.
            const count = first === -1 ? 0 : last - first + 1;
            if (count > this.counterMaxFit) this.counterMaxFit = count;

            // A "transition" frame is either (a) no slide fully in view at all
            // (extreme edge case — narrow viewports, fractional rounding), or
            // (b) the strict pass collapsed to a single slide despite the
            // scroller naturally fitting more. In both cases we may want to
            // hold the previously rendered range label rather than flash an
            // intermediate.
            const isTransition = first === -1 || (first === last && this.counterMaxFit > 1);

            if (isTransition && !this.showSingleDigitDuringTransition && this.counter.textContent) {
              return;
            }

            // Mid-scroll fallback: when no slide is fully in view, mark the
            // slide under the viewport's horizontal centre so the counter never
            // blanks.
            if (first === -1) {
              const mid = this.scroller.scrollLeft + this.scroller.clientWidth / 2;
              for (let i = 0; i < total; i++) {
                const s = this.slides[i];
                if (s.offsetLeft <= mid && s.offsetLeft + s.offsetWidth >= mid) {
                  first = last = i;
                  break;
                }
              }
              if (first === -1) {
                first = 0;
                last = 0;
              }
            }

            const ofWord = window.theme?.sliderCounterOf || 'of';
            const range = first === last ? `${first + 1}` : `${first + 1}-${last + 1}`;
            this.counter.textContent = `${range} ${ofWord} ${total}`;
          }

          destroy() {
            if (!this.initialized) return;
            this.scroller?.removeEventListener('scroll', this.onScroll);
            document.removeEventListener('theme:resize:width', this.onResize);
            this.mutationObserver?.disconnect();
            this.mutationObserver = null;
            if (this.scrollFrame) {
              cancelAnimationFrame(this.scrollFrame);
              this.scrollFrame = null;
            }
            this.counterMaxFit = 0;
            this.initialized = false;
          }
        }
      );
    }

    /*
      Observe whether or not there are open modals that require scroll lock
    */

    window.theme.hasOpenModals = function () {
      const openModals = Boolean(document.querySelectorAll('dialog[open][data-scroll-lock-required]').length);
      const openDrawers = Boolean(document.querySelectorAll('.drawer.is-open').length);

      return openModals || openDrawers;
    };

    const selectors$8 = {
      announcementWrapper: '[data-announcement-wrapper]',
      pageAnnouncement: '.page-announcement',
      cartDrawer: 'cart-drawer',
      cartToggleButton: '[data-cart-toggle]',
      deadLink: '.navlink[href="#"]',
      demoSwitcher: '[data-demo-switcher]',
      desktop: '[data-header-desktop]',
      pageHeader: '.page-header',
      style: 'data-header-style',
      widthContent: '[data-child-takes-space]',
      widthContentWrapper: '[data-takes-space-wrapper]',
      wrapper: '[data-header-wrapper]',
      preventStickyHeader: '[data-prevent-sticky-header]',
    };

    const classes$5 = {
      headerGroup: 'shopify-section-header-group-group',
      showMobileClass: 'js__show__mobile',
      sticky: 'has-header-sticky',
      transparent: 'has-header-transparent',
      stuck: 'js__header__stuck',
      headerWrapper: 'header-wrapper',
    };

    const attributes$3 = {
      drawer: 'data-drawer',
      drawerToggle: 'data-drawer-toggle',
      scrollLock: 'data-scroll-locked',
      stickyHeader: 'data-header-sticky',
      transparentHeader: 'data-header-transparent',
      floatingHeader: 'data-header-floating',
    };

    if (!customElements.get('header-component')) {
      customElements.define(
        'header-component',
        class HeaderComponent extends HTMLElement {
          constructor() {
            super();

            this.headerStyle = this.dataset.headerStyle;
            this.desktop = this.querySelector(selectors$8.desktop);
            this.deadLinks = document.querySelectorAll(selectors$8.deadLink);
            this.resizeObserver = null;
            this.checkWidth = this.checkWidth.bind(this);
            this.isSticky = this.hasAttribute(attributes$3.stickyHeader);
            this.floatingHeader = this.hasAttribute(attributes$3.floatingHeader);
            this.preventStickyHeader = document.querySelector(selectors$8.preventStickyHeader);

            if (this.floatingHeader && this.preventStickyHeader) {
              this.isSticky = false;
            }

            document.body.classList.toggle(classes$5.sticky, this.isSticky);
            document.body.classList.toggle(classes$5.transparent, this.hasAttribute(attributes$3.transparentHeader));
          }

          connectedCallback() {
            this.killDeadLinks();
            this.drawerToggleEvent();
            this.cartToggleEvent();
            this.initSticky();

            if (this.headerStyle !== 'drawer' && this.desktop) {
              this.minWidth = this.getMinWidth();
              // Apply the initial state synchronously so the correct variant
              // (desktop vs mobile) is visible on the first paint, avoiding
              // the flash of mismatched layout on page load / theme-editor save.
              this.applyCollapseState();
              this.listenWidth();
            }
          }

          listenWidth() {
            if ('ResizeObserver' in window) {
              this.resizeObserver = new ResizeObserver(this.checkWidth);
              this.resizeObserver.observe(this);
            } else {
              document.addEventListener('theme:resize', this.checkWidth);
            }
          }

          drawerToggleEvent() {
            this.querySelectorAll(`[${attributes$3.drawerToggle}]`)?.forEach((button) => {
              button.addEventListener('click', () => {
                let drawer;
                const key = button.hasAttribute(attributes$3.drawerToggle) ? button.getAttribute(attributes$3.drawerToggle) : '';
                const desktopDrawer = document.querySelector(`[${attributes$3.drawer}="${key}"]`);
                const mobileDrawer = document.querySelector(`mobile-menu > [${attributes$3.drawer}]`);
                const isDesktopView = !theme.isMobile;

                if (isDesktopView) {
                  drawer = desktopDrawer;
                } else {
                  drawer = mobileDrawer || desktopDrawer;
                }

                drawer.dispatchEvent(
                  new CustomEvent('theme:drawer:toggle', {
                    bubbles: false,
                    detail: {
                      button: button,
                    },
                  })
                );
              });
            });
          }

          killDeadLinks() {
            this.deadLinks.forEach((el) => {
              el.onclick = (e) => {
                e.preventDefault();
              };
            });
          }

          checkWidth() {
            if (!this.minWidth) return;

            // Debounce execution to run at most every 150ms
            if (this._resizeTimeout) cancelAnimationFrame(this._resizeTimeout);

            this._resizeTimeout = requestAnimationFrame(() => {
              clearTimeout(this._resizeDebounce);
              this._resizeDebounce = setTimeout(() => {
                this.applyCollapseState();
              }, 150);
            });
          }

          applyCollapseState() {
            const isHamburgerMenu = this.getAvailableWidth() < this.minWidth;

            this.classList.toggle(classes$5.showMobileClass, isHamburgerMenu);

            if (isHamburgerMenu) {
              const {headerHeight} = window.theme.readHeights();
              document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
            }

            return isHamburgerMenu;
          }

          getMinWidth() {
            // Measure the bars' intrinsic content width (not their flex-distributed
            // width). Without this, bars with flex-grow would report whatever
            // width the current viewport allocates them, which is equal to the
            // wrapper's inner width — making the comparison in checkWidth()
            // collapse the header unconditionally.
            //
            // The `[data-child-takes-space]` elements that may be flex-grown and
            // therefore need intrinsic measurement are defined in the CSS:
            //   - .header__desktop__bar__l  — `flex: 1 0 0`
            //   - .header__desktop__bar__c  — `flex-grow: 0`
            //   - .header__desktop__bar__r  — `flex: 1 0 0`
            // If any of those flex rules are renamed, removed, or marked
            // `!important`, the inline override below will no longer cancel the
            // grow and the "collapse to hamburger" threshold will be wrong.
            // Keep the rules above flex-based and without `!important`, or update
            // the inline override here accordingly.
            const wrappers = this.querySelectorAll(selectors$8.widthContentWrapper);
            let minWidth = 0;
            let spacing = 0;
            let widest = null;

            wrappers.forEach((wrapper) => {
              const children = wrapper.querySelectorAll(selectors$8.widthContent);
              if (!children.length) return;

              // Force intrinsic sizing during measurement, then restore the
              // original inline value (so CSS rules resume controlling the bars).
              // `0 0 auto` = don't grow, don't shrink, basis = content size.
              const originalFlex = [];
              children.forEach((el) => {
                originalFlex.push(el.style.flex);
                el.style.flex = '0 0 auto';
              });

              let total = 0;
              children.forEach((el) => {
                if (el.offsetParent !== null) {
                  total += el.offsetWidth;
                }
              });

              children.forEach((el, i) => {
                el.style.flex = originalFlex[i];
              });

              const space = children.length * 20;

              if (total + space > minWidth) {
                minWidth = total;
                spacing = space;
                widest = wrapper;
              }
            });

            this._measuredWrapper = widest;

            return minWidth + spacing;
          }

          // Returns the horizontal space actually available to the bars, which
          // equals the measured wrapper's clientWidth minus its inline padding.
          // This accounts for .header__padded (var(--outer)) and the floating
          // card's inset (which narrows the wrapper via its parent).
          getAvailableWidth() {
            const wrapper = this._measuredWrapper;
            if (!wrapper) return theme.windowWidth;

            const style = getComputedStyle(wrapper);
            const paddingX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);

            return wrapper.clientWidth - paddingX;
          }

          cartToggleEvent() {
            if (theme.settings.cartType !== 'drawer') return;

            this.querySelectorAll(selectors$8.cartToggleButton)?.forEach((button) => {
              button.addEventListener('click', (e) => {
                const cartDrawer = document.querySelector(selectors$8.cartDrawer);

                if (cartDrawer) {
                  e.preventDefault();
                  cartDrawer.dispatchEvent(new CustomEvent('theme:cart-drawer:show'));
                  window.theme.a11y.lastElement = button;
                }
              });
            });
          }

          toggleButtonClick(e) {
            e.preventDefault();
            document.dispatchEvent(new CustomEvent('theme:cart-drawer:toggle', {bubbles: true}));
          }

          initSticky() {
            if (!this.isSticky) return;

            this.isStuck = false;
            this.cls = this.classList;
            this.updateHeaderOffset = this.updateHeaderOffset.bind(this);
            this.scrollEvent = (e) => this.onScroll(e);

            this.listen();

            requestAnimationFrame(() => {
              this.headerOffset = this.getHeaderOffset();
              this.stickOnLoad();
            });
          }

          getHeaderOffset() {
            const announcementTop = document.querySelector(selectors$8.pageAnnouncement);
            const demoSwitcher = document.querySelector(selectors$8.demoSwitcher);
            const announcementWrapper = this.closest(selectors$8.pageHeader)?.querySelector(selectors$8.announcementWrapper);
            let offset = 0;

            if (announcementWrapper) {
              const style = getComputedStyle(announcementWrapper);
              const marginTop = parseFloat(style.marginTop) || 0;
              const marginBottom = parseFloat(style.marginBottom) || 0;
              offset = marginTop + announcementWrapper.offsetHeight + marginBottom;

              if (this.classList.contains('header-floating')) {
                const firstBlock = this.querySelector('.toolbar, .header-floating__card');
                if (firstBlock) {
                  const currentMargin = parseFloat(getComputedStyle(firstBlock).marginTop) || 0;
                  offset -= marginTop - currentMargin;
                }
              }
            }

            if (announcementTop) {
              offset += announcementTop.offsetHeight;
            }

            if (demoSwitcher) {
              offset += demoSwitcher.offsetHeight;
            }

            return offset;
          }

          listen() {
            document.addEventListener('theme:scroll', this.scrollEvent);
            document.addEventListener('shopify:section:load', this.updateHeaderOffset);
            document.addEventListener('shopify:section:unload', this.updateHeaderOffset);
          }

          onScroll(e) {
            if (this.headerOffset == null) return;
            if (this.alwaysStuck) return;

            if (e.detail.down) {
              if (!this.isStuck && e.detail.position > this.headerOffset) {
                this.stickSimple();
              }
            } else if (e.detail.position <= this.headerOffset) {
              this.unstickSimple();
            }
          }

          updateHeaderOffset(event) {
            if (!event.target.classList.contains(classes$5.headerGroup)) return;

            requestAnimationFrame(() => {
              this.headerOffset = this.getHeaderOffset();
              this.alwaysStuck = this.headerOffset === 0 && this.classList.contains('header-floating');

              if (this.alwaysStuck) {
                this.stickSimple();
              } else if (window.scrollY <= this.headerOffset) {
                this.unstickSimple();
              }
            });
          }

          stickOnLoad() {
            this.alwaysStuck = this.headerOffset === 0 && this.classList.contains('header-floating');

            if (this.alwaysStuck || window.scrollY > this.headerOffset) {
              this.stickSimple();
            }
          }

          stickSimple() {
            this.cls.add(classes$5.stuck);
            this.isStuck = true;
          }

          unstickSimple() {
            if (!document.documentElement.hasAttribute(attributes$3.scrollLock)) {
              // check for scroll lock
              this.cls.remove(classes$5.stuck);
              this.isStuck = false;
            }
          }

          disconnectedCallback() {
            if ('ResizeObserver' in window) {
              this.resizeObserver?.unobserve(this);
            } else {
              document.removeEventListener('theme:resize', this.checkWidth);
            }

            if (this.isSticky) {
              document.removeEventListener('theme:scroll', this.scrollEvent);
              document.removeEventListener('shopify:section:load', this.updateHeaderOffset);
              document.removeEventListener('shopify:section:unload', this.updateHeaderOffset);
            }
          }
        }
      );
    }

    const selectors$7 = {
      link: '[data-top-link]',
      wrapper: '[data-header-wrapper]',
      stagger: '[data-stagger]',
      staggerPair: '[data-stagger-first]',
      staggerAfter: '[data-stagger-second]',
      focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    };

    const classes$4 = {
      isVisible: 'is-visible',
      meganavVisible: 'meganav--visible',
      meganavIsTransitioning: 'meganav--is-transitioning',
    };

    if (!customElements.get('hover-disclosure')) {
      customElements.define(
        'hover-disclosure',

        class HoverDisclosure extends HTMLElement {
          constructor() {
            super();

            this.wrapper = this.closest(selectors$7.wrapper);
            this.key = this.getAttribute('aria-controls');
            this.link = this.querySelector(selectors$7.link);
            this.grandparent = this.classList.contains('grandparent');
            this.disclosure = document.getElementById(this.key);
            this.transitionTimeout = 0;
          }

          connectedCallback() {
            this.setAttribute('aria-haspopup', true);
            this.setAttribute('aria-expanded', false);
            this.setAttribute('aria-controls', this.key);

            this.connectHoverToggle();
            this.handleTablets();
            this.staggerChildAnimations();
          }

          showDisclosure(e) {
            if (e && e.type && e.type === 'mouseenter') {
              this.wrapper.classList.add(classes$4.meganavIsTransitioning);
            }

            if (this.grandparent) {
              this.wrapper.classList.add(classes$4.meganavVisible);
            } else {
              this.wrapper.classList.remove(classes$4.meganavVisible);
            }
            this.setAttribute('aria-expanded', true);
            this.classList.add(classes$4.isVisible);
            this.disclosure.classList.add(classes$4.isVisible);

            if (this.transitionTimeout) {
              clearTimeout(this.transitionTimeout);
            }

            this.transitionTimeout = setTimeout(() => {
              this.wrapper.classList.remove(classes$4.meganavIsTransitioning);
            }, 200);
          }

          hideDisclosure() {
            this.classList.remove(classes$4.isVisible);
            this.disclosure.classList.remove(classes$4.isVisible);
            this.setAttribute('aria-expanded', false);
            this.wrapper.classList.remove(classes$4.meganavVisible, classes$4.meganavIsTransitioning);
          }

          staggerChildAnimations() {
            const simple = this.querySelectorAll(selectors$7.stagger);
            let step = 50;
            simple.forEach((el, index) => {
              el.style.transitionDelay = `${index * step + 10}ms`;
              step *= 0.95;
            });

            const pairs = this.querySelectorAll(selectors$7.staggerPair);
            pairs.forEach((child, i) => {
              const d1 = i * 100;
              child.style.transitionDelay = `${d1}ms`;
              child.parentElement.querySelectorAll(selectors$7.staggerAfter).forEach((grandchild, i2) => {
                const di1 = i2 + 1;
                const d2 = di1 * 20;
                grandchild.style.transitionDelay = `${d1 + d2}ms`;
              });
            });
          }

          handleTablets() {
            // first click opens the popup, second click opens the link
            this.addEventListener(
              'touchstart',
              function (e) {
                const isOpen = this.classList.contains(classes$4.isVisible);
                if (!isOpen) {
                  e.preventDefault();
                  this.showDisclosure(e);
                }
              }.bind(this),
              {passive: true}
            );
          }

          connectHoverToggle() {
            this.addEventListener('mouseenter', (e) => this.showDisclosure(e));
            this.link.addEventListener('focus', (e) => this.showDisclosure(e));

            this.addEventListener('mouseleave', () => this.hideDisclosure());
            this.addEventListener('focusout', (e) => {
              const inMenu = this.contains(e.relatedTarget);
              if (!inMenu) {
                this.hideDisclosure();
              }
            });
            this.addEventListener('keyup', (evt) => {
              if (evt.code !== 'Escape') {
                return;
              }
              this.hideDisclosure();
            });
          }
        }
      );
    }

    const selectors$6 = {
      drawerInner: '[data-drawer-inner]',
      drawerClose: '[data-drawer-close]',
      underlay: '[data-drawer-underlay]',
      stagger: '[data-stagger-animation]',
      wrapper: '[data-header-wrapper]',
      focusable: 'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    };

    const classes$3 = {
      animated: 'drawer--animated',
      open: 'is-open',
      closing: 'is-closing',
      isFocused: 'is-focused',
      headerStuck: 'js__header__stuck',
    };

    if (!customElements.get('header-drawer')) {
      customElements.define(
        'header-drawer',
        class HeaderDrawer extends HTMLElement {
          constructor() {
            super();

            this.a11y = window.theme.a11y;
            this.isAnimating = false;
            this.drawer = this;
            this.drawerInner = this.querySelector(selectors$6.drawerInner);
            this.underlay = this.querySelector(selectors$6.underlay);
            this.triggerButton = null;

            this.staggers = this.querySelectorAll(selectors$6.stagger);
            this.showDrawer = this.showDrawer.bind(this);
            this.hideDrawer = this.hideDrawer.bind(this);

            this.connectDrawer();
            this.closers();
          }

          connectDrawer() {
            this.addEventListener('theme:drawer:toggle', (e) => {
              this.triggerButton = e.detail?.button;

              if (this.classList.contains(classes$3.open)) {
                this.dispatchEvent(
                  new CustomEvent('theme:drawer:close', {
                    bubbles: true,
                  })
                );
              } else {
                this.dispatchEvent(
                  new CustomEvent('theme:drawer:open', {
                    bubbles: true,
                  })
                );
              }
            });

            this.addEventListener('theme:drawer:close', this.hideDrawer);
            this.addEventListener('theme:drawer:open', this.showDrawer);

            document.addEventListener('theme:cart-drawer:open', this.hideDrawer);
          }

          closers() {
            this.querySelectorAll(selectors$6.drawerClose)?.forEach((button) => {
              button.addEventListener('click', () => {
                this.hideDrawer();
              });
            });

            document.addEventListener('keyup', (event) => {
              if (event.code !== 'Escape') {
                return;
              }

              this.hideDrawer();
            });

            this.underlay.addEventListener('click', () => {
              this.hideDrawer();
            });
          }

          showDrawer() {
            if (this.isAnimating) return;

            this.isAnimating = true;

            this.triggerButton?.setAttribute('aria-expanded', true);
            this.classList.add(classes$3.open, classes$3.animated);

            document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));

            if (this.drawerInner) {
              this.a11y.removeTrapFocus();

              window.theme.waitForAnimationEnd(this.drawerInner).then(() => {
                this.isAnimating = false;

                this.a11y.trapFocus(this.drawerInner, {
                  elementToFocus: this.querySelector(selectors$6.focusable),
                });
              });
            }
          }

          hideDrawer() {
            if (this.isAnimating || !this.classList.contains(classes$3.open)) return;

            this.isAnimating = true;

            this.classList.add(classes$3.closing);
            this.classList.remove(classes$3.open);

            this.a11y.removeTrapFocus();

            if (this.triggerButton) {
              this.triggerButton.setAttribute('aria-expanded', false);

              if (document.body.classList.contains(classes$3.isFocused)) {
                this.triggerButton.focus();
              }
            }

            document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));

            window.theme.waitForAnimationEnd(this.drawerInner).then(() => {
              this.classList.remove(classes$3.closing, classes$3.animated);

              this.isAnimating = false;

              // Reset menu items state after drawer hiding animation completes
              document.dispatchEvent(new CustomEvent('theme:sliderule:close', {bubbles: false}));
            });
          }

          disconnectedCallback() {
            document.removeEventListener('theme:cart-drawer:open', this.hideDrawer);
          }
        }
      );
    }

    const selectors$5 = {
      sliderule: '[data-sliderule]',
      drawerContent: '[data-drawer-content]',
      stagger: '[data-stagger-first]',
      focusable: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      children: `:scope > [data-animates],
             :scope > * > [data-animates],
             :scope > * > * > [data-animates],
             :scope > * > .sliderule-grid  > *`,
      mobileMenuBlock: '[data-mobile-menu-block]',
    };

    const classes$2 = {
      isVisible: 'is-visible',
      isHiding: 'is-hiding',
      isHidden: 'is-hidden',
      focused: 'is-focused',
      scrolling: 'is-scrolling',
    };

    const attributes$2 = {
      animates: 'data-animates',
      animation: 'data-animation',
      animationDelay: 'data-animation-delay',
      sliderule: 'data-sliderule',
      slideruleOpen: 'data-sliderule-open',
      slideruleClose: 'data-sliderule-close',
      sliderulePane: 'data-sliderule-pane',
      slideruleLinksCount: 'data-sliderule-links-count',
      slideruleAnimationDefault: 'data-sliderule-animation-default',
      slideruleAnimationStep: 'data-sliderule-animation-step',
    };

    if (!customElements.get('mobile-sliderule')) {
      customElements.define(
        'mobile-sliderule',

        class HeaderMobileSliderule extends HTMLElement {
          constructor() {
            super();

            this.key = this.id;
            this.sliderule = this.querySelector(selectors$5.sliderule);
            const btnSelector = `[${attributes$2.slideruleOpen}='${this.key}']`;
            this.exitSelector = `[${attributes$2.slideruleClose}='${this.key}']`;
            this.trigger = this.querySelector(btnSelector);
            this.exit = document.querySelectorAll(this.exitSelector);
            this.pane = this.trigger.closest(`[${attributes$2.sliderulePane}]`);
            this.childrenElements = this.querySelectorAll(selectors$5.children);
            this.mobileMenuBlock = this.closest(selectors$5.mobileMenuBlock);
            this.drawerContent = this.closest(selectors$5.drawerContent);
            this.cachedButton = null;
            this.a11y = window.theme.a11y;

            this.trigger.setAttribute('aria-haspopup', true);
            this.trigger.setAttribute('aria-expanded', false);
            this.trigger.setAttribute('aria-controls', this.key);
            this.closeSliderule = this.closeSliderule.bind(this);

            this.clickEvents();
            this.keyboardEvents();

            document.addEventListener('theme:sliderule:close', this.closeSliderule);
          }

          clickEvents() {
            this.trigger.addEventListener('click', () => {
              this.cachedButton = this.trigger;
              this.showSliderule();
            });
            this.exit.forEach((element) => {
              element.addEventListener('click', () => {
                this.hideSliderule();
              });
            });
          }

          keyboardEvents() {
            this.addEventListener('keyup', (evt) => {
              evt.stopPropagation();
              if (evt.code !== 'Escape') {
                return;
              }

              this.hideSliderule();
            });
          }

          trapFocusSliderule(showSliderule = true) {
            const trapFocusButton = showSliderule ? this.querySelector(this.exitSelector) : this.cachedButton;

            this.a11y.removeTrapFocus();

            if (trapFocusButton && this.drawerContent) {
              this.a11y.trapFocus(this.drawerContent, {
                elementToFocus: document.body.classList.contains(classes$2.focused) ? trapFocusButton : null,
              });
            }
          }

          hideSliderule(close = false) {
            const newPosition = parseInt(this.pane.dataset.sliderulePane, 10) - 1;
            this.pane.setAttribute(attributes$2.sliderulePane, newPosition);
            this.pane.classList.add(classes$2.isHiding);
            this.mobileMenuBlock?.style.removeProperty('--menu-height');
            this.sliderule.classList.add(classes$2.isHiding);
            const hiddenSelector = close ? `[${attributes$2.animates}].${classes$2.isHidden}` : `[${attributes$2.animates}="${newPosition}"]`;
            const hiddenItems = this.pane.querySelectorAll(hiddenSelector);
            if (hiddenItems.length) {
              hiddenItems.forEach((element) => {
                element.classList.remove(classes$2.isHidden);
              });
            }

            const children = close ? this.pane.querySelectorAll(`.${classes$2.isVisible}, .${classes$2.isHiding}`) : this.childrenElements;
            children.forEach((element, index) => {
              const lastElement = children.length - 1 == index;
              element.classList.remove(classes$2.isVisible);
              if (close) {
                element.classList.remove(classes$2.isHiding);
                this.pane.classList.remove(classes$2.isHiding);
              }
              const removeHidingClass = () => {
                if (parseInt(this.pane.getAttribute(attributes$2.sliderulePane)) === newPosition) {
                  this.sliderule.classList.remove(classes$2.isVisible);
                }
                this.sliderule.classList.remove(classes$2.isHiding);
                this.pane.classList.remove(classes$2.isHiding);

                if (lastElement) {
                  this.a11y.removeTrapFocus();
                  if (!close) {
                    this.trapFocusSliderule(false);
                  }
                }

                element.removeEventListener('animationend', removeHidingClass);
              };

              if (window.theme.settings.enableAnimations) {
                element.addEventListener('animationend', removeHidingClass);
              } else {
                removeHidingClass();
              }
            });
          }

          showSliderule() {
            let lastScrollableFrame = null;
            const parent = this.closest(`.${classes$2.isVisible}`);
            let lastScrollableElement = this.pane;

            if (parent) {
              lastScrollableElement = parent;
            }

            lastScrollableElement.scrollTo({
              top: 0,
              left: 0,
              behavior: 'smooth',
            });

            lastScrollableElement.classList.add(classes$2.scrolling);

            const lastScrollableIsScrolling = () => {
              if (lastScrollableElement.scrollTop <= 0) {
                lastScrollableElement.classList.remove(classes$2.scrolling);
                if (lastScrollableFrame) {
                  cancelAnimationFrame(lastScrollableFrame);
                }
              } else {
                lastScrollableFrame = requestAnimationFrame(lastScrollableIsScrolling);
              }
            };

            lastScrollableFrame = requestAnimationFrame(lastScrollableIsScrolling);

            const oldPosition = parseInt(this.pane.dataset.sliderulePane, 10);
            const newPosition = oldPosition + 1;

            this.sliderule.classList.add(classes$2.isVisible);
            this.pane.setAttribute(attributes$2.sliderulePane, newPosition);
            this.mobileMenuBlock?.style.setProperty('--menu-height', this.sliderule.offsetHeight + 'px');

            const hiddenItems = this.pane.querySelectorAll(`[${attributes$2.animates}="${oldPosition}"]`);
            if (hiddenItems.length) {
              hiddenItems.forEach((element, index) => {
                const lastElement = hiddenItems.length - 1 == index;
                element.classList.add(classes$2.isHiding);
                const removeHidingClass = () => {
                  element.classList.remove(classes$2.isHiding);
                  if (parseInt(this.pane.getAttribute(attributes$2.sliderulePane)) !== oldPosition) {
                    element.classList.add(classes$2.isHidden);
                  }

                  if (lastElement) {
                    this.trapFocusSliderule();
                  }
                  element.removeEventListener('animationend', removeHidingClass);
                };

                if (window.theme.settings.enableAnimations) {
                  element.addEventListener('animationend', removeHidingClass);
                } else {
                  removeHidingClass();
                }
              });
            }

            const notAnimatedImages = this.sliderule.querySelectorAll(`${selectors$5.stagger}:not([${attributes$2.animates}])`);
            if (notAnimatedImages.length) {
              const linksBeforeImagesCount = parseInt(this.sliderule.getAttribute(attributes$2.slideruleLinksCount) || 0, 10);
              const defaultDelayMs = parseInt(this.sliderule.getAttribute(attributes$2.slideruleAnimationDefault) || 200, 10);
              const stepMs = parseInt(this.sliderule.getAttribute(attributes$2.slideruleAnimationStep) || 50, 10);
              const linksDelayMs = linksBeforeImagesCount * stepMs;
              const startMs = defaultDelayMs + stepMs + linksDelayMs;
              notAnimatedImages.forEach((element, index) => {
                element.setAttribute(`${attributes$2.animates}`, this.sliderule.getAttribute(attributes$2.sliderule) || 1);
                element.setAttribute(`${attributes$2.animation}`, 'drawer-items-fade');
                element.setAttribute(`${attributes$2.animationDelay}`, startMs + index * stepMs);
              });
            }
          }

          closeSliderule() {
            if (this.pane && this.pane.hasAttribute(attributes$2.sliderulePane) && parseInt(this.pane.getAttribute(attributes$2.sliderulePane)) > 0) {
              this.hideSliderule(true);
              if (parseInt(this.pane.getAttribute(attributes$2.sliderulePane)) > 0) {
                this.pane.setAttribute(attributes$2.sliderulePane, 0);
              }
            }
          }

          disconnectedCallback() {
            document.removeEventListener('theme:sliderule:close', this.closeSliderule);
          }
        }
      );
    }

    const selectors$4 = {
      inputSearch: 'input[type="search"]',
      focusedElements: '[aria-selected="true"] a',
      resetButton: 'button[type="reset"]',
    };

    const classes$1 = {
      hidden: 'hidden',
    };

    class HeaderSearchForm extends HTMLElement {
      constructor() {
        super();

        this.input = this.querySelector(selectors$4.inputSearch);
        this.resetButton = this.querySelector(selectors$4.resetButton);

        if (this.input) {
          this.input.form.addEventListener('reset', this.onFormReset.bind(this));
          this.input.addEventListener(
            'input',
            window.theme
              .debounce((event) => {
                this.onChange(event);
              }, 300)
              .bind(this)
          );
        }
      }

      toggleResetButton() {
        const resetIsHidden = this.resetButton.classList.contains(classes$1.hidden);
        if (this.input.value.length > 0 && resetIsHidden) {
          this.resetButton.classList.remove(classes$1.hidden);
        } else if (this.input.value.length === 0 && !resetIsHidden) {
          this.resetButton.classList.add(classes$1.hidden);
        }
      }

      onChange() {
        this.toggleResetButton();
      }

      shouldResetForm() {
        return !document.querySelector(selectors$4.focusedElements);
      }

      onFormReset(event) {
        // Prevent default so the form reset doesn't set the value gotten from the url on page load
        event.preventDefault();
        // Don't reset if the user has selected an element on the predictive search dropdown
        if (this.shouldResetForm()) {
          this.input.value = '';
          this.toggleResetButton();
          event.target.querySelector(selectors$4.inputSearch).focus();
        }
      }
    }

    customElements.define('header-search-form', HeaderSearchForm);

    const selectors$3 = {
      inputSearch: 'input[type="search"]',
    };

    class MainSearch extends HeaderSearchForm {
      constructor() {
        super();

        this.allSearchInputs = document.querySelectorAll(selectors$3.inputSearch);
        this.setupEventListeners();
      }

      setupEventListeners() {
        let allSearchForms = [];
        this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
        this.input.addEventListener('focus', this.onInputFocus.bind(this));
        if (allSearchForms.length < 2) return;
        allSearchForms.forEach((form) => form.addEventListener('reset', this.onFormReset.bind(this)));
        this.allSearchInputs.forEach((input) => input.addEventListener('input', this.onInput.bind(this)));
      }

      onFormReset(event) {
        super.onFormReset(event);
        if (super.shouldResetForm()) {
          this.keepInSync('', this.input);
        }
      }

      onInput(event) {
        const target = event.target;
        this.keepInSync(target.value, target);
      }

      onInputFocus() {
        if (theme.isMobile) {
          this.scrollIntoView({behavior: 'smooth'});
        }
      }

      keepInSync(value, target) {
        this.allSearchInputs.forEach((input) => {
          if (input !== target) {
            input.value = value;
          }
        });
      }
    }

    if (!customElements.get('main-search')) {
      customElements.define('main-search', MainSearch);
    }

    if (!customElements.get('native-scrollbar')) {
      customElements.define(
        'native-scrollbar',
        class NativeScrollbar extends HTMLElement {
          constructor() {
            super();
            this.scrollbarWidth = 0;
            this.scrollbarHeight = 0;
            this.scrollDirection = null;
            this.resizeEvents = this.resizeEvents.bind(this);
            this.detectScrollDirection = this.detectScrollDirection.bind(this);

            // Detect scroll direction
            document.addEventListener('DOMContentLoaded', () => setTimeout(() => this.detectScrollDirection(), 300));
          }

          connectedCallback() {
            this.scrollbar = this.querySelector('[data-scrollbar]');
            this.arrowNext = this.querySelector('[data-scrollbar-arrow-next]');
            this.arrowPrev = this.querySelector('[data-scrollbar-arrow-prev]');

            document.addEventListener('theme:resize', this.resizeEvents);

            // Detect scroll direction after layout is complete
            requestAnimationFrame(() => {
              this.detectScrollDirection();

              if (this.scrollbar.hasAttribute('data-scrollbar-slider')) {
                this.scrollToVisibleElement();
              }

              if (this.arrowNext && this.arrowPrev) {
                this.resizeEvents();
                this.clickEvents();
              }
            });

            this.scrollbar.addEventListener(
              'scroll',
              window.theme.debounce(() => this.updateArrows(), 16)
            );
          }

          disconnectedCallback() {
            document.removeEventListener('theme:resize', this.resizeEvents);
          }

          resizeEvents() {
            this.detectScrollDirection();
            this.scrollbarWidth = this.scrollbar.clientWidth;
            this.scrollbarHeight = this.scrollbar.clientHeight;
            this.updateArrows();
          }

          clickEvents() {
            this.arrowNext.addEventListener('click', (event) => {
              event.preventDefault();

              this.goToNext();
            });

            this.arrowPrev.addEventListener('click', (event) => {
              event.preventDefault();

              this.goToPrev();
            });
          }

          goToNext() {
            let moveWith, position;

            if (this.scrollDirection === 'horizontal') {
              moveWith = this.scrollbar.hasAttribute('data-scrollbar-slide-fullwidth') ? this.scrollbarWidth : this.scrollbarWidth / 2;
              position = this.scrollbar.scrollLeft + moveWith;
            } else if (this.scrollDirection === 'vertical') {
              moveWith = this.scrollbar.hasAttribute('data-scrollbar-slide-fullwidth') ? this.scrollbarHeight : this.scrollbarHeight / 2;
              position = this.scrollbar.scrollTop + moveWith;
            } else {
              return; // No scroll direction detected
            }

            this.arrowPrev.removeAttribute('disabled');
            this.move(position);
          }

          goToPrev() {
            let moveWith, position;

            if (this.scrollDirection === 'horizontal') {
              moveWith = this.scrollbar.hasAttribute('data-scrollbar-slide-fullwidth') ? this.scrollbarWidth : this.scrollbarWidth / 2;
              position = this.scrollbar.scrollLeft - moveWith;
            } else if (this.scrollDirection === 'vertical') {
              moveWith = this.scrollbar.hasAttribute('data-scrollbar-slide-fullwidth') ? this.scrollbarHeight : this.scrollbarHeight / 2;
              position = this.scrollbar.scrollTop - moveWith;
            } else {
              return; // No scroll direction detected
            }

            this.arrowNext.removeAttribute('disabled');
            this.move(position);
          }

          updateArrows() {
            if (!this.scrollDirection) {
              this.arrowPrev?.toggleAttribute('disabled', true);
              this.arrowNext?.toggleAttribute('disabled', true);
              return;
            }

            const EPS = 1;
            const sb = this.scrollbar;

            const need = this.scrollDirection === 'horizontal' ? sb.scrollWidth > sb.clientWidth : sb.scrollHeight > sb.clientHeight;
            const atStart = this.scrollDirection === 'horizontal' ? sb.scrollLeft <= EPS : sb.scrollTop <= EPS;
            const atEnd = this.scrollDirection === 'horizontal' ? Math.ceil(sb.scrollLeft + sb.clientWidth) >= sb.scrollWidth - EPS : Math.ceil(sb.scrollTop + sb.clientHeight) >= sb.scrollHeight - EPS;

            // Prev is disabled at the beginning or when scrolling is not needed
            this.arrowPrev?.toggleAttribute('disabled', atStart || !need);
            // Next is disabled at the end or when scrolling is not needed
            this.arrowNext?.toggleAttribute('disabled', atEnd || !need);
          }

          scrollToVisibleElement() {
            [].forEach.call(this.scrollbar.children, (element) => {
              element.addEventListener('click', (event) => {
                event.preventDefault();

                let position;
                if (this.scrollDirection === 'horizontal') {
                  position = element.offsetLeft - element.clientWidth;
                } else if (this.scrollDirection === 'vertical') {
                  position = element.offsetTop - element.clientHeight;
                } else {
                  return;
                }

                this.move(position);
              });
            });
          }

          move(position, behavior = 'smooth') {
            if (this.scrollDirection === 'horizontal') {
              this.scrollbar.scrollTo({
                top: 0,
                left: position,
                behavior: behavior,
              });
            } else if (this.scrollDirection === 'vertical') {
              this.scrollbar.scrollTo({
                top: position,
                left: 0,
                behavior: behavior,
              });
            }
          }

          detectScrollDirection() {
            if (!this.scrollbar) return;

            const style = getComputedStyle(this.scrollbar);

            if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
              this.scrollDirection = 'horizontal';
            } else if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
              this.scrollDirection = 'vertical';
            } else {
              this.scrollDirection = null;
            }

            this.setAttribute('data-direction', this.scrollDirection);
          }
        }
      );
    }

    if (!customElements.get('popout-select')) {
      customElements.define(
        'popout-select',
        class Popout extends HTMLElement {
          constructor() {
            super();

            this.updateOptionsEvent = (evt) => this.updateOptions(evt);
          }

          connectedCallback() {
            // Prevent duplicate initialization
            if (this.hasAttribute('data-popout-initialized')) return;
            this.setAttribute('data-popout-initialized', 'true');

            this.popoutList = this.querySelector('[data-popout-list]');
            this.popoutToggle = this.querySelector('[data-popout-toggle]');
            this.popoutToggleText = this.querySelector('[data-popout-toggle-text]');
            this.popoutInput = this.querySelector('[data-popout-input]') || this.parentNode.querySelector('[data-popout-input]') || this.parentNode.parentNode.querySelector('[data-quantity-input]');

            this.popoutOptions = this.querySelectorAll('[data-popout-option]');
            this.fireSubmitEvent = this.hasAttribute('submit');

            this.popupToggleFocusoutEvent = (evt) => this.onPopupToggleFocusout(evt);
            this.popupListFocusoutEvent = (evt) => this.onPopupListFocusout(evt);
            this.popupToggleClickEvent = (evt) => this.onPopupToggleClick(evt);
            this.keyUpEvent = (evt) => this.onKeyUp(evt);
            this.bodyClickEvent = (evt) => this.onBodyClick(evt);

            this._connectOptions();
            this._connectToggle();
            this._onFocusOut();
            this.popupListSetDimensions();

            this.addEventListener('theme:popout:update', this.updateOptionsEvent);
          }

          disconnectedCallback() {
            this.removeEventListener('theme:popout:update', this.updateOptionsEvent);
          }

          onPopupToggleClick(evt) {
            const button = evt.currentTarget;
            const ariaExpanded = button.getAttribute('aria-expanded') === 'true';

            evt.currentTarget.setAttribute('aria-expanded', !ariaExpanded);
            this.popoutList.classList.toggle('popout-list--visible');
            this.popupListSetDimensions();
            this.toggleListPosition();

            document.body.addEventListener('click', this.bodyClickEvent);
          }

          onPopupToggleFocusout(evt) {
            if (!document.body.classList.contains('is-focused')) return;

            const popoutLostFocus = this.contains(evt.relatedTarget);

            if (!popoutLostFocus) {
              this._hideList();
            }
          }

          onPopupListFocusout(evt) {
            if (!document.body.classList.contains('is-focused')) return;

            const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
            const isVisible = this.popoutList.classList.contains('popout-list--visible');

            if (isVisible && !childInFocus) {
              this._hideList();
            }
          }

          hasOverflowParent() {
            let element = this.parentElement;
            while (element && element !== document.body) {
              const style = getComputedStyle(element);
              if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                return true;
              }
              element = element.parentElement;
            }
            return false;
          }

          toggleListPosition() {
            const button = this.querySelector('[data-popout-toggle]');
            const popoutTop = this.getBoundingClientRect().top + this.clientHeight;
            const hasOverflowParent = this.hasOverflowParent();

            const removeTopClass = () => {
              if (button.getAttribute('aria-expanded') !== 'true') {
                // Don't remove the class if inside a container with overflow auto/scroll
                // Even though `select-popout__list` is absolute, it extends the scrollable container and creates a scrollbar
                if (!hasOverflowParent) {
                  this.popoutList.classList.remove('popout-list--top');
                }
              }

              this.popoutList.removeEventListener('transitionend', removeTopClass);
            };

            if (button.getAttribute('aria-expanded') === 'true') {
              this.popoutList.classList.toggle('popout-list--top', theme.windowHeight / 2 < popoutTop);
            } else {
              this.popoutList.addEventListener('transitionend', removeTopClass);
            }
          }

          calculateConfinedDimensions() {
            const confineContainer = this.closest('[data-popout-select-confine]');
            if (!confineContainer) return null;

            const toggleRect = this.popoutToggle.getBoundingClientRect();
            const containerRect = confineContainer.getBoundingClientRect();
            const containerClientHeight = confineContainer.clientHeight;
            const containerScrollTop = confineContainer.scrollTop;

            // Get toggle position relative to container's content area
            const toggleRelativeTop = toggleRect.top - containerRect.top + containerScrollTop;
            const toggleRelativeBottom = toggleRect.bottom - containerRect.top + containerScrollTop;

            // Calculate viewport available space
            const viewportSpaceAbove = toggleRect.top;
            const viewportSpaceBelow = theme.windowHeight - toggleRect.bottom;

            // Calculate confined container available space
            const containerSpaceAbove = toggleRelativeTop;
            const containerSpaceBelow = containerClientHeight - toggleRelativeBottom;

            // Use the smaller space for each direction
            const effectiveSpaceAbove = Math.min(viewportSpaceAbove, containerSpaceAbove);
            const effectiveSpaceBelow = Math.min(viewportSpaceBelow, containerSpaceBelow);

            // Determine if opening on top based on effective available space
            const shouldOpenTop = effectiveSpaceAbove > effectiveSpaceBelow && effectiveSpaceAbove > 0;

            // Set the class based on the calculation
            this.popoutList.classList.toggle('popout-list--top', shouldOpenTop);

            // Calculate max-height based on opening direction using the smaller space
            const maxHeight = shouldOpenTop ? Math.max(0, parseInt(effectiveSpaceAbove)) : Math.max(0, parseInt(effectiveSpaceBelow));

            return {
              width: null,
              height: maxHeight,
            };
          }

          popupListSetDimensions() {
            this.popoutList.style.setProperty('--max-width', '100vw');
            this.popoutList.style.setProperty('--max-height', '100vh');

            requestAnimationFrame(() => {
              const popoutListRect = this.popoutList.getBoundingClientRect();
              const toggleRect = this.popoutToggle.getBoundingClientRect();

              // Viewport-based calculations
              let maxWidth = parseInt(theme.windowWidth - popoutListRect.left);
              let maxHeight;

              const isOpeningTop = this.popoutList.classList.contains('popout-list--top');
              if (isOpeningTop) {
                // When opening on top: space from viewport top to toggle button top
                maxHeight = parseInt(toggleRect.top);
              } else {
                // When opening on bottom: space from popout list top to viewport bottom
                maxHeight = parseInt(theme.windowHeight - popoutListRect.top);
              }

              // Override with confined container calculations if available
              const {width: confinedWidth, height: confinedHeight} = this.calculateConfinedDimensions() || {};
              maxWidth = confinedWidth ?? maxWidth;
              maxHeight = confinedHeight ?? maxHeight;

              this.popoutList.style.setProperty('--max-width', `${maxWidth}px`);
              this.popoutList.style.setProperty('--max-height', `${maxHeight}px`);
            });
          }

          popupOptionsClick(evt) {
            const link = evt.target.closest('[data-popout-option]');

            if (link && link.attributes.href.value === '#') {
              evt.preventDefault();

              const attrValue = link.hasAttribute('data-value') ? link.getAttribute('data-value') : '';

              this.popoutInput.value = attrValue;

              // Sync option metadata onto the hidden input so downstream logic can read it
              const listItem = link.closest('li');
              if (listItem) {
                const optionValueId = listItem.getAttribute('data-option-value-id');
                const productUrl = listItem.getAttribute('data-product-url');
                const variantId = link.getAttribute('data-variant-id');
                if (optionValueId) this.popoutInput.setAttribute('data-option-value-id', optionValueId);
                if (productUrl) this.popoutInput.setAttribute('data-product-url', productUrl);
                // set the variant ID on the hidden input so it can be used to trigger a variant change in 'variant-selects' elements' methods
                if (variantId) this.popoutInput.setAttribute('data-variant-id', variantId);
              }

              if (this.popoutInput.disabled) {
                this.popoutInput.removeAttribute('disabled');
              }

              if (this.fireSubmitEvent) {
                this._submitForm(attrValue);
              } else {
                const currentTarget = evt.currentTarget;

                // Fire a bubbling change event so parent controllers can react
                this.popoutInput.dispatchEvent(new Event('change', {bubbles: true}));

                if (this.popoutInput.name == 'quantity' && !currentTarget.parentElement.nextSibling) {
                  this.classList.add('is-hidden');
                }

                this.changeStates(currentTarget);
                this.updateButtonText(attrValue);

                // Close the dropdown after selection
                this._hideList();
              }
            }
          }

          changeStates(target) {
            if (!target) return;

            const parent = target.parentElement;
            const listTargetElement = this.popoutList.querySelector('.is-active');
            const targetAttribute = this.popoutList.querySelector('[aria-current]');

            if (listTargetElement) {
              listTargetElement.classList.remove('is-active');
              parent.classList.add('is-active');
            }

            if (targetAttribute && targetAttribute.hasAttribute('aria-current')) {
              targetAttribute.removeAttribute('aria-current');
              target.setAttribute('aria-current', 'true');
            }
          }

          updateButtonText(text) {
            if (text !== '') {
              this.popoutToggleText.innerHTML = text;

              if (this.popoutToggleText.hasAttribute('data-popout-toggle-text') && this.popoutToggleText.getAttribute('data-popout-toggle-text') !== '') {
                this.popoutToggleText.setAttribute('data-popout-toggle-text', text);
              }
            }
          }

          updateOptions(evt) {
            if (evt && evt.detail && evt.detail.value) {
              const value = evt.detail.value;
              const target = this.querySelector(`[data-popout-option][data-value="${value}"]`);
              this.changeStates(target);
              this.updateButtonText(value);
            }
          }

          onKeyUp(evt) {
            if (evt.code !== 'Escape') {
              return;
            }
            this._hideList();
            this.popoutToggle.focus();
          }

          onBodyClick(evt) {
            const isOption = this.contains(evt.target);
            const isVisible = this.popoutList.classList.contains('popout-list--visible');

            if (isVisible && !isOption) {
              this._hideList();
            }
          }

          _connectToggle() {
            this.popoutToggle.addEventListener('click', this.popupToggleClickEvent);
          }

          _connectOptions() {
            if (this.popoutOptions.length) {
              this.popoutOptions.forEach((element) => {
                element.addEventListener('click', (evt) => this.popupOptionsClick(evt));
              });
            }
          }

          _onFocusOut() {
            this.addEventListener('keyup', this.keyUpEvent);
            this.popoutToggle.addEventListener('focusout', this.popupToggleFocusoutEvent);
            this.popoutList.addEventListener('focusout', this.popupListFocusoutEvent);
          }

          _submitForm() {
            const form = this.closest('form');
            if (form) {
              form.submit();
            }
          }

          _hideList() {
            this.popoutList.classList.remove('popout-list--visible');
            this.popoutToggle.setAttribute('aria-expanded', false);
            this.toggleListPosition();
            document.body.removeEventListener('click', this.bodyClickEvent);
          }
        }
      );
    }

    if (!customElements.get('popup-component')) {
      customElements.define(
        'popup-component',
        class PopupComponent extends HTMLElement {
          constructor() {
            super();

            this.a11y = window.theme.a11y;
            this.isAnimating = false;

            this.popupOpenEvent = this.popupOpen.bind(this);
            this.popupCloseEvent = this.popupClose.bind(this);
          }

          connectedCallback() {
            this.popup = this.querySelector('dialog');
            this.preventTopLayer = this.popup.hasAttribute('data-prevent-top-layer');
            this.enableScrollLock = this.popup.hasAttribute('data-scroll-lock-required');
            // Only look for button within this popup-component or with matching ID
            // Don't fallback to global query if no ID is set to avoid matching wrong buttons
            this.buttonOpen = this.querySelector('[data-popup-open]') || (this.id ? document.querySelector(`[data-popup-open="${this.id}"]`) : null);
            this.buttonPrev = this.querySelector('[data-popup-prev]');
            this.buttonNext = this.querySelector('[data-popup-next]');

            this.bindListeners();
          }

          bindListeners() {
            // Open button click event
            this.buttonOpen?.addEventListener('click', (e) => {
              e.preventDefault();
              this.popupOpen();
              window.theme.a11y.lastElement = this.buttonOpen;
            });

            this.buttonPrev?.addEventListener('click', (e) => {
              e.preventDefault();
              this.openOtherPopup(this.buttonPrev.dataset.popupPrev);
              this.popupClose();
            });

            this.buttonNext?.addEventListener('click', (e) => {
              e.preventDefault();
              this.openOtherPopup(this.buttonNext.dataset.popupNext);
              this.popupClose();
            });

            // Close button click event
            this.popup.querySelectorAll('[data-popup-close]')?.forEach((closeButton) => {
              closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.popupClose();
              });
            });

            // Close dialog on click outside content
            this.popup.addEventListener('click', (event) => {
              if (event.target.nodeName === 'DIALOG' && event.type === 'click') {
                this.popupClose();
              }
            });

            // Close dialog on click ESC key pressed
            this.popup.addEventListener('keydown', (event) => {
              if (event.code === 'Escape') {
                event.preventDefault();
                this.popupClose();
              }
            });

            if (this.buttonPrev || this.buttonNext) {
              let touchStartX = 0;
              let touchStartY = 0;
              let touchEndX = 0;
              let touchEndY = 0;
              const horizontalThreshold = 40; // px

              const onTouchStart = (e) => {
                if (!e.touches || e.touches.length === 0) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchEndX = touchStartX;
                touchEndY = touchStartY;
              };

              const onTouchMove = (e) => {
                if (!e.touches || e.touches.length === 0) return;
                touchEndX = e.touches[0].clientX;
                touchEndY = e.touches[0].clientY;
              };

              const onTouchEnd = () => {
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                // Only act on mostly-horizontal swipes
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > horizontalThreshold) {
                  if (deltaX < 0) {
                    // Swipe left -> go to next
                    this.buttonNext?.dispatchEvent(new Event('click'));
                  } else {
                    // Swipe right -> go to prev
                    this.buttonPrev?.dispatchEvent(new Event('click'));
                  }
                }
              };

              // Attach to the dialog for swipe interactions
              this.popup.addEventListener('touchstart', onTouchStart, {passive: true});
              this.popup.addEventListener('touchmove', onTouchMove, {passive: true});
              this.popup.addEventListener('touchend', onTouchEnd);
            }

            this.popup.addEventListener('close', () => this.popupCloseActions());
            document.addEventListener('theme:quick-add:open', this.popupCloseEvent);
            document.addEventListener('theme:product:added', this.popupCloseEvent);
            this.addEventListener('theme:popup:open', this.popupOpenEvent);
          }

          popupOpen() {
            this.isAnimating = true;

            // Check if browser supports Dialog tags
            if (typeof this.popup.showModal === 'function' && !this.preventTopLayer) {
              this.popup.showModal();
            } else if (typeof this.popup.show === 'function') {
              this.popup.show();
            } else {
              this.popup.setAttribute('open', '');
            }

            this.popup.removeAttribute('inert');
            this.popup.setAttribute('aria-hidden', false);
            this.popup.focus(); // Focus <dialog> tag element to prevent immediate closing on Escape keypress

            if (this.enableScrollLock) {
              document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
            }

            window.theme.waitForAnimationEnd(this.popup).then(() => {
              this.isAnimating = false;

              if (this.enableScrollLock) {
                this.a11y.trapFocus(this.popup);
              }

              const focusTarget = this.popup.querySelector('[autofocus]') || this.popup.querySelector('button, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
              focusTarget?.focus();
            });
          }

          openOtherPopup(id) {
            const popup = document.getElementById(id);

            // Check if it's animating to prevent multiple rapid popup openings
            if (popup && !this.isAnimating) {
              popup.querySelector('[data-popup-open]')?.dispatchEvent(new Event('click'));
            }
          }

          popupClose() {
            if (this.isAnimating || this.popup.hasAttribute('inert')) {
              return;
            }

            if (!this.popup.hasAttribute('closing')) {
              this.popup.setAttribute('closing', '');
              this.isAnimating = true;

              window.theme.waitForAnimationEnd(this.popup).then(() => {
                this.isAnimating = false;
                this.popupClose();
              });

              return;
            }

            // Check if browser supports Dialog tags
            if (typeof this.popup.close === 'function') {
              this.popup.close();
            } else {
              this.popup.removeAttribute('open');
              this.popup.setAttribute('aria-hidden', true);
            }

            this.popupCloseActions();
          }

          popupCloseActions() {
            if (this.popup.hasAttribute('inert')) return;

            this.popup.setAttribute('inert', '');
            this.popup.setAttribute('aria-hidden', true);
            this.popup.removeAttribute('closing');

            // Unlock scroll if no other popups & modals are open
            if (!window.theme.hasOpenModals() && this.enableScrollLock) {
              document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
            }

            this.popup.dispatchEvent(new CustomEvent('theme:popup:onclose', {bubbles: false}));

            if (this.enableScrollLock) {
              this.a11y.removeTrapFocus();
              this.a11y.autoFocusLastElement();
            }
          }

          disconnectedCallback() {
            document.removeEventListener('theme:quick-add:open', this.popupCloseEvent);
            document.removeEventListener('theme:product:added', this.popupCloseEvent);
            this.removeEventListener('theme:popup:open', this.popupOpenEvent);
          }
        }
      );
    }

    const selectors$2 = {
      allVisibleElements: '[role="option"]',
      ariaSelected: '[aria-selected="true"]',
      popularSearches: '[data-popular-searches]',
      predictiveSearch: 'predictive-search',
      predictiveSearchResults: '[data-predictive-search-results]',
      predictiveSearchStatus: '[data-predictive-search-status]',
      searchInput: 'input[type="search"]',
      searchPopdown: '[data-popdown]',
      searchResultsLiveRegion: '[data-predictive-search-live-region-count-value]',
      searchResultsGroupsWrapper: '[data-search-results-groups-wrapper]',
      searchForText: '[data-predictive-search-search-for-text]',
      sectionPredictiveSearch: '#shopify-section-predictive-search',
      selectedLink: '[aria-selected="true"] a',
      selectedOption: '[aria-selected="true"] a, button[aria-selected="true"]',
    };

    if (!customElements.get('predictive-search')) {
      customElements.define(
        'predictive-search',

        class PredictiveSearch extends HeaderSearchForm {
          constructor() {
            super();

            this.a11y = window.theme.a11y;
            this.abortController = new AbortController();
            this.allPredictiveSearchInstances = document.querySelectorAll(selectors$2.predictiveSearch);
            this.cachedResults = {};
            this.input = this.querySelector(selectors$2.searchInput);
            this.isOpen = false;
            this.predictiveSearchResults = this.querySelector(selectors$2.predictiveSearchResults);
            this.searchPopdown = this.closest(selectors$2.searchPopdown);
            this.popularSearches = this.searchPopdown?.querySelector(selectors$2.popularSearches);
            this.searchTerm = '';
            this.pointerDownOutside = false;
          }

          connectedCallback() {
            this.onDocumentPointerDownHandler = (event) => {
              this.pointerDownOutside = !this.searchPopdown?.contains(event.target);
            };

            this.input.addEventListener('focus', this.onFocus.bind(this));
            this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));

            this.addEventListener('focusout', this.onFocusOut.bind(this));
            this.addEventListener('keyup', this.onKeyup.bind(this));
            this.addEventListener('keydown', this.onKeydown.bind(this));
            document.addEventListener('pointerdown', this.onDocumentPointerDownHandler);
          }

          disconnectedCallback() {
            document.removeEventListener('pointerdown', this.onDocumentPointerDownHandler);
          }

          getQuery() {
            return this.input.value.trim();
          }

          onChange() {
            super.onChange();
            const newSearchTerm = this.getQuery();

            if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
              // Remove the results when they are no longer relevant for the new search term
              // so they don't show up when the dropdown opens again
              this.querySelector(selectors$2.searchResultsGroupsWrapper)?.remove();
            }

            // Update the term asap, don't wait for the predictive search query to finish loading
            this.updateSearchForTerm(this.searchTerm, newSearchTerm);

            this.searchTerm = newSearchTerm;

            if (!this.searchTerm.length) {
              this.reset();
              return;
            }

            this.getSearchResults(this.searchTerm);
          }

          onFormSubmit(event) {
            if (!this.getQuery().length || this.querySelector(selectors$2.selectedLink)) event.preventDefault();
          }

          onFormReset(event) {
            super.onFormReset(event);
            if (super.shouldResetForm()) {
              this.searchTerm = '';
              this.abortController.abort();
              this.abortController = new AbortController();
              this.closeResults(true);
            }
          }

          shouldResetForm() {
            return !document.querySelector(selectors$2.selectedLink);
          }

          onFocus() {
            const currentSearchTerm = this.getQuery();

            if (!currentSearchTerm.length) return;

            if (this.searchTerm !== currentSearchTerm) {
              // Search term was changed from other search input, treat it as a user change
              this.onChange();
            } else if (this.getAttribute('results') === 'true') {
              this.open();
            } else {
              this.getSearchResults(this.searchTerm);
            }
          }

          onFocusOut(event) {
            const hadPointerDownOutside = this.pointerDownOutside;
            const {relatedTarget} = event;

            this.pointerDownOutside = false;

            setTimeout(() => {
              if (this.searchPopdown?.contains(document.activeElement)) return;

              if (hadPointerDownOutside) {
                this.close();
                return;
              }

              if (relatedTarget && !this.searchPopdown?.contains(relatedTarget)) {
                this.close();
              }
            });
          }

          onKeyup(event) {
            if (!this.getQuery().length) this.close(true);
            event.preventDefault();

            switch (event.code) {
              case 'ArrowUp':
                this.switchOption('up');
                break;
              case 'ArrowDown':
                this.switchOption('down');
                break;
              case 'Enter':
                this.selectOption();
                break;
            }
          }

          onKeydown(event) {
            // Prevent the cursor from moving in the input when using the up and down arrow keys
            if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
              event.preventDefault();
            }
          }

          updateSearchForTerm(previousTerm, newTerm) {
            const searchForTextElement = this.querySelector(selectors$2.searchForText);
            const currentButtonText = searchForTextElement?.innerText;

            if (currentButtonText) {
              if (currentButtonText.match(new RegExp(previousTerm, 'g'))?.length > 1) {
                // The new term matches part of the button text and not just the search term, do not replace to avoid mistakes
                return;
              }
              const newButtonText = currentButtonText.replace(previousTerm, newTerm);
              searchForTextElement.innerText = newButtonText;
            }
          }

          switchOption(direction) {
            if (!this.getAttribute('open')) return;

            const moveUp = direction === 'up';
            const selectedElement = this.querySelector(selectors$2.ariaSelected);

            // Filter out hidden elements (duplicated page and article resources) thanks
            // to this https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
            const allVisibleElements = Array.from(this.querySelectorAll(selectors$2.allVisibleElements)).filter((element) => element.offsetParent !== null);

            let activeElementIndex = 0;

            if (moveUp && !selectedElement) return;

            let selectedElementIndex = -1;
            let i = 0;

            while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
              if (allVisibleElements[i] === selectedElement) {
                selectedElementIndex = i;
              }
              i++;
            }

            this.statusElement.textContent = '';

            if (!moveUp && selectedElement) {
              activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
            } else if (moveUp) {
              activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
            }

            if (activeElementIndex === selectedElementIndex) return;

            const activeElement = allVisibleElements[activeElementIndex];

            activeElement.setAttribute('aria-selected', true);
            if (selectedElement) selectedElement.setAttribute('aria-selected', false);

            this.input.setAttribute('aria-activedescendant', activeElement.id);
          }

          selectOption() {
            const selectedOption = this.querySelector(selectors$2.selectedOption);

            if (selectedOption) selectedOption.click();
          }

          getSearchResults(searchTerm) {
            const queryKey = searchTerm.replace(' ', '-').toLowerCase();
            this.setLiveRegionLoadingState();

            if (this.cachedResults[queryKey]) {
              this.renderSearchResults(this.cachedResults[queryKey]);
              return;
            }

            fetch(`${theme.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&section_id=predictive-search`, {signal: this.abortController.signal})
              .then((response) => {
                if (!response.ok) {
                  var error = new Error(response.status);
                  this.close();
                  throw error;
                }

                return response.text();
              })
              .then((text) => {
                const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector(selectors$2.sectionPredictiveSearch).innerHTML;
                // Save bandwidth keeping the cache in all instances synced
                this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
                  predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
                });
                this.renderSearchResults(resultsMarkup);
              })
              .catch((error) => {
                if (error?.code === 20) {
                  // Code 20 means the call was aborted
                  return;
                }
                this.close();
                throw error;
              });
          }

          setLiveRegionLoadingState() {
            this.statusElement = this.statusElement || this.querySelector(selectors$2.predictiveSearchStatus);
            this.loadingText = this.loadingText || this.getAttribute('data-loading-text');

            this.setLiveRegionText(this.loadingText);
            this.setAttribute('loading', true);
          }

          setLiveRegionText(statusText) {
            this.statusElement.setAttribute('aria-hidden', 'false');
            this.statusElement.textContent = statusText;

            setTimeout(() => {
              this.statusElement.setAttribute('aria-hidden', 'true');
            }, 1000);
          }

          renderSearchResults(resultsMarkup) {
            this.predictiveSearchResults.innerHTML = resultsMarkup;

            this.setAttribute('results', true);

            this.setLiveRegionResults();
            this.open();
          }

          setLiveRegionResults() {
            this.removeAttribute('loading');
            this.setLiveRegionText(this.querySelector(selectors$2.searchResultsLiveRegion).textContent);
          }

          open() {
            this.setAttribute('open', true);
            this.input.setAttribute('aria-expanded', true);
            this.isOpen = true;
            this.predictiveSearchResults.style.setProperty('--results-height', `${window.visualViewport.height - this.predictiveSearchResults.getBoundingClientRect().top}px`);
          }

          close(clearSearchTerm = false) {
            this.closeResults(clearSearchTerm);
            this.isOpen = false;
            this.predictiveSearchResults.style.removeProperty('--results-height');
          }

          closeResults(clearSearchTerm = false) {
            if (clearSearchTerm) {
              this.input.value = '';
              this.removeAttribute('results');
            }
            const selected = this.querySelector(selectors$2.ariaSelected);

            if (selected) selected.setAttribute('aria-selected', false);

            this.input.setAttribute('aria-activedescendant', '');
            this.removeAttribute('loading');
            this.removeAttribute('open');
            this.input.setAttribute('aria-expanded', false);
            this.predictiveSearchResults?.removeAttribute('style');
          }

          reset() {
            this.predictiveSearchResults.innerHTML = '';

            this.input.val = '';
            this.a11y.removeTrapFocus();

            if (this.popularSearches) {
              this.input.dispatchEvent(new Event('blur', {bubbles: false}));
              this.a11y.trapFocus(this.searchPopdown, {
                elementToFocus: this.input,
              });
            }
          }
        }
      );
    }

    if (!customElements.get('product-form')) {
      customElements.define(
        'product-form',
        class ProductForm extends HTMLElement {
          constructor() {
            super();

            this.form = this.querySelector('form');
            this.variantIdInput.disabled = false;
            this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
            this.cart = document.querySelector('cart-drawer');
            this.submitButton = this.querySelector('[type="submit"]');
            this.submitButtonText = this.submitButton.querySelector('[data-add-to-cart-text]');
            if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

            this.hideErrors = this.dataset.hideErrors === 'true';
          }

          onSubmitHandler(evt) {
            evt.preventDefault();

            document.dispatchEvent(
              new CustomEvent('theme:cart:add', {
                detail: {
                  button: this.submitButton,
                },
                bubbles: false,
              })
            );

            const quickAddModal = this.closest('quick-add-modal');
            if (!quickAddModal) {
              window.theme.a11y.lastElement = this.submitButton;
            }
          }

          toggleSubmitButton(disable = true, text = window.theme.strings.addToCart) {
            this.submitButton.toggleAttribute('disabled', disable);
            // Preserve existing price markup inside the add-to-cart text
            const existingPriceElement = this.submitButtonText?.querySelector('[data-product-price]');
            if (existingPriceElement) {
              const priceHTML = existingPriceElement.outerHTML;
              this.submitButtonText.textContent = text;
              this.submitButtonText.insertAdjacentHTML('beforeend', ` ${priceHTML}`);
            } else {
              this.submitButtonText.textContent = text;
            }
          }

          get variantIdInput() {
            return this.form.querySelector('[name=id]');
          }
        }
      );
    }

    const selectors$1 = {
      swapHandle: '[data-swap-handle]',
      nativeScrollbar: 'native-scrollbar',
      activeSibling: '.sibling__link--current',
      productImage: '[data-product-image]',
      stackedQuickAdd: '[data-quick-add-stacked]',
    };

    const attributes$1 = {
      swapHandle: 'data-swap-handle',
      swapUrl: 'data-swap-url',
    };

    if (!customElements.get('product-card')) {
      customElements.define(
        'product-card',
        class ProductCard extends HTMLElement {
          abortController = undefined;
          pendingSwapHandle = null;
          postProcessHtmlCallbacks = [];

          handleClick = (event) => this.handleChange(event);
          handleKeyup = (event) => {
            if (event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER) {
              this.handleChange(event);
            }
          };
          onHtmlChange = (event) => this.handleHtmlChange(event);
          onProductCardChange = (event) => this.handleProductCardChange(event);
          onImageLeave = (event) => this.handleImageLeave(event);

          constructor() {
            super();
            this.swapHandles = this.querySelectorAll(selectors$1.swapHandle);
            this.activeSibling = [...this.swapHandles].find((el) => el.querySelector(selectors$1.activeSibling));
          }

          connectedCallback() {
            this.scrollIntoView();

            this.swapHandles?.forEach((element) => {
              element.addEventListener('click', this.handleClick);
              element.addEventListener('keyup', this.handleKeyup);
            });

            this.initProductSwapUtility();
            this.initPopoutHandlers();

            this.addEventListener('theme:product-card:change', this.onProductCardChange);

            this.querySelector('[data-product-image-overlay]')?.addEventListener('mouseleave', this.onImageLeave);
          }

          disconnectedCallback() {
            // Abort any pending fetch requests
            this.abortController?.abort();

            // Remove event listeners
            this.swapHandles?.forEach((element) => {
              element.removeEventListener('click', this.handleClick);
              element.removeEventListener('keyup', this.handleKeyup);
            });

            this.removeEventListener('theme:product-card:change', this.onProductCardChange);

            this.querySelector('[data-product-image-overlay]')?.removeEventListener('mouseleave', this.onImageLeave);
          }

          handleProductCardChange(event) {
            if (event.detail && event.detail.url) {
              this.renderProductItem({
                // Fetch the new product's HTML with section rendering API
                requestUrl: event.detail.url,
                // Returns a function that will process and swap the HTML after fetch completes
                callback: this.handleSwapProduct(),
              });
            }
          }

          handleImageLeave(event) {
            const image = event.currentTarget;
            let timeoutDuration = 250;
            if (theme.isMobile) {
              timeoutDuration = 0;
            }
            setTimeout(() => {
              image?.querySelector('[data-quick-add-holder]')?.classList.remove('is-expanded', 'is-visible');
            }, timeoutDuration); // Waiting CSS duration
          }

          initProductSwapUtility() {
            this.postProcessHtmlCallbacks.push(() => {
              document.addEventListener('theme:html:change', this.onHtmlChange);
            });
          }

          handleChange(event) {
            if (!this.contains(event.target)) return;

            // Let collection tags with their own link navigate naturally without triggering a product swap
            if (event.target.closest('[data-prevent-card-link]')) return;

            const element = event.target.closest(selectors$1.swapHandle);
            const targetUrl = element.dataset.swapUrl;
            const productUrl = `${window.Shopify.routes.root}products/${element.dataset.swapHandle}`;
            // Store the clicked element's handle to refocus it after swap
            this.pendingSwapHandle = element.dataset.swapHandle;

            const shouldSwapProduct = this.dataset.url !== targetUrl;
            if (!shouldSwapProduct) return;

            this.renderProductItem({
              // Fetch the new product's HTML with section rendering API
              requestUrl: `${productUrl}?section_id=api-product-card`,
              // Returns a function that will process and swap the HTML after fetch completes
              callback: this.handleSwapProduct(),
            });
          }

          handleSwapProduct() {
            return (html) => {
              // Set up animation parameters with the new product-card element's ID
              const aosDelay = 0;
              const productItem = html.querySelector('product-card');
              const aosAnchor = productItem.id ? `#${productItem.id}` : '';

              // Get the raw HTML and replace animation placeholder strings
              let productHTML = productItem.outerHTML;
              productHTML = productHTML.includes('||itemAnimationDelay||') ? productHTML.replaceAll('||itemAnimationDelay||', aosDelay) : productHTML;
              productHTML = productHTML.includes('||itemAnimationAnchor||') ? productHTML.replaceAll('||itemAnimationAnchor||', aosAnchor) : productHTML;

              // Parse the processed HTML back into a DOM element
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = productHTML;
              const processedProductItem = tempDiv.querySelector('product-card');

              HTMLUpdateUtility.viewTransition(
                this, // Current product-card element to be replaced
                processedProductItem, // New product-card element with updated content
                this.postProcessHtmlCallbacks // Run any post-processing after swap (focus, init components)
              );
            };
          }

          renderProductItem({requestUrl, callback}) {
            this.abortController?.abort();
            this.abortController = new AbortController();

            fetch(requestUrl, {signal: this.abortController.signal})
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                callback(html);
              })
              .catch((error) => {
                if (error.name === 'AbortError') {
                  console.log('Fetch aborted by user');
                } else {
                  console.error(error);
                }

                document.removeEventListener('theme:html:change', this.onHtmlChange);
              });
          }

          handleHtmlChange(event) {
            if (!event?.detail?.element) return;
            if (!this.pendingSwapHandle) return;

            const product = event.detail.element;
            const swatch = product.querySelector(`[${attributes$1.swapHandle}="${this.pendingSwapHandle}"]`);

            // Set focus and scroll into view of the last clicked sibling swatch element
            swatch.focus();
            this.scrollIntoView({product, swatch});

            this.pendingSwapHandle = null;
            document.removeEventListener('theme:html:change', this.onHtmlChange);
          }

          scrollIntoView(elements = false) {
            if (!this.activeSibling) return;

            const swatch = elements ? elements.swatch : this.activeSibling;
            const product = elements ? elements.product : this;

            const nativeScrollbar = product.querySelector(selectors$1.nativeScrollbar);
            if (!nativeScrollbar || typeof nativeScrollbar.move !== 'function') return;

            const computedStyle = getComputedStyle(swatch);
            const swatchOffset = swatch.offsetLeft + parseFloat(computedStyle.marginLeft) + parseFloat(computedStyle.marginRight);
            requestAnimationFrame(() => nativeScrollbar.move(swatchOffset - swatch.clientWidth, 'instant'));
          }

          initPopoutHandlers() {
            const popoutSelects = this.querySelectorAll('popout-select');

            popoutSelects.forEach((popoutSelect) => {
              const popoutToggle = popoutSelect.querySelector('[data-popout-toggle]');
              const stackedQuickAdd = popoutSelect.closest(selectors$1.stackedQuickAdd);

              // watch for aria-expanded changes
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
                    const popoutList = popoutSelect.querySelector('[data-popout-list]');
                    const ariaExpanded = popoutToggle.getAttribute('aria-expanded') === 'true';

                    if (stackedQuickAdd) {
                      stackedQuickAdd.classList.toggle('is-open', ariaExpanded);
                      return;
                    }

                    const productGridItemImage = this.querySelector('[data-product-image]');

                    if (productGridItemImage) {
                      productGridItemImage.classList.toggle('is-visible', !ariaExpanded);
                    }

                    popoutList.style.maxHeight = `${Math.abs(popoutToggle.getBoundingClientRect().bottom - this.getBoundingClientRect().bottom)}px`;
                  }
                });
              });

              observer.observe(popoutToggle, {
                attributes: true,
                attributeFilter: ['aria-expanded'],
              });
            });
          }
        }
      );
    }

    class SiblingSwatches {
      constructor(swatches, product) {
        this.swatches = swatches;
        this.product = product;
        this.productLinks = this.product.querySelectorAll('[data-product-link]');
        this.productCutline = this.product.querySelector('[data-product-cutline]');
        this.productPrice = this.product.querySelector('[data-product-price]');
        this.productImage = this.product.querySelector('[data-product-image-default]');
        this.productImageSibling = this.product.querySelector('[data-product-image-sibling]');
        this.siblingsInnerHolder = this.product.querySelector('[data-sibling-inner]');

        this.init();
      }

      init() {
        this.cacheDefaultValues();

        this.siblingsInnerHolder.addEventListener('mouseleave', () => this.resetProductValues());
        this.siblingsInnerHolder.addEventListener('focusout', () => {
          if (document.body.classList.contains('is-focused')) this.resetProductValues();
        });

        this.swatches.forEach((swatch) => {
          swatch.addEventListener('mouseenter', (event) => this.showSibling(event));
          swatch.addEventListener('focusin', (event) => {
            if (document.body.classList.contains('is-focused')) this.showSibling(event);
          });
        });
      }

      cacheDefaultValues() {
        this.activeSibling = this.siblingsInnerHolder.querySelector('.sibling__link--current')?.closest('[data-sibling-link]');
        this.productImageSibling.setAttribute('data-sibling-image', this.activeSibling?.dataset.siblingImage);

        this.productLinkValue = this.productLinks[0].hasAttribute('data-product-link') ? this.productLinks[0].getAttribute('data-product-link') : '';
        this.productPriceValue = this.productPrice.innerHTML;

        if (this.productCutline) {
          this.productCutlineValue = this.productCutline.innerHTML;
        }
      }

      resetProductValues() {
        this.product.classList.remove('is-active');

        if (this.productPrice) {
          this.productPrice.innerHTML = this.productPriceValue;
        }

        if (this.productCutline && this.productCutline) {
          this.productCutline.innerHTML = this.productCutlineValue;
          this.productCutline.title = this.productCutlineValue;
        }

        this.hideSiblingImage();
      }

      showSibling(event) {
        const swatch = event.target;
        const siblingPrice = swatch.hasAttribute('data-sibling-price') ? swatch.getAttribute('data-sibling-price') : '';
        const siblingCutline = swatch.hasAttribute('data-sibling-cutline') ? swatch.getAttribute('data-sibling-cutline') : '';
        const siblingImage = swatch.hasAttribute('data-sibling-image') ? swatch.getAttribute('data-sibling-image') : '';

        if (siblingPrice) {
          this.productPrice.innerHTML = siblingPrice;
        }

        if (this.productCutline) {
          if (siblingCutline) {
            this.productCutline.innerHTML = siblingCutline;
            this.productCutline.title = siblingCutline;
          } else {
            this.productCutline.innerHTML = '';
            this.productCutline.title = '';
          }
        }

        if (siblingImage) {
          this.showSiblingImage(siblingImage);
        }
      }

      showSiblingImage(siblingImage) {
        if (!this.productImageSibling) return;

        // Add current sibling swatch image to PGI image
        const ratio = window.devicePixelRatio || 1;
        const pixels = this.productImage.offsetWidth * ratio;
        const widthRounded = Math.ceil(pixels / 180) * 180;
        const imageSrc = theme.getSizedImageUrl(siblingImage, `${widthRounded}x`);
        const imageExists = this.productImageSibling.querySelector(`[src="${imageSrc}"]`);
        const showCurrentImage = () => {
          this.productImageSibling.classList.add('is-visible');
          this.productImageSibling.querySelector(`[src="${imageSrc}"]`).classList.add('is-fade');
        };
        const swapImages = () => {
          const activeSiblingImage = this.productImageSibling.getAttribute('data-sibling-image');
          const swapNewImageOnHover = siblingImage !== activeSiblingImage;
          const swapActiveSiblingImage = siblingImage === activeSiblingImage && this.productImageSibling.classList.contains('is-visible');

          // Avoid changing the image when hovering over the currently active sibling link, if the featured image remains unchanged.
          const shouldSwap = Boolean(swapActiveSiblingImage || swapNewImageOnHover);

          if (!shouldSwap) return;

          this.productImageSibling.querySelectorAll('img').forEach((image) => {
            image.classList.remove('is-fade');
          });
          requestAnimationFrame(showCurrentImage);
        };

        if (imageExists) {
          swapImages();
        } else {
          const imageTag = document.createElement('img');

          imageTag.src = imageSrc;

          if (this.productCutline) {
            imageTag.alt = this.productCutline.innerText;
          }

          imageTag.addEventListener('load', () => {
            this.productImageSibling.append(imageTag);

            swapImages();
          });
        }
      }

      hideSiblingImage() {
        if (!this.productImageSibling) return;

        this.productImageSibling.classList.remove('is-visible');
        this.productImageSibling.querySelectorAll('img').forEach((image) => {
          image.classList.remove('is-fade');
        });
      }
    }

    if (!customElements.get('product-card-siblings')) {
      customElements.define(
        'product-card-siblings',
        class ProductCardSiblings extends HTMLElement {
          constructor() {
            super();
          }

          connectedCallback() {
            this.product = this.closest('[data-grid-item]');
            this.siblingCount = this.querySelector('[data-sibling-count]');
            this.siblingFieldset = this.querySelector('[data-sibling-fieldset]');
            this.siblingLinks = this.querySelectorAll('[data-sibling-link]');
            this.productInfo = this.closest('[data-product-information]');
            this.productLink = this.closest('[data-product-link]');
            this.hideSwatchesTimer = 0;
            this.swatchesStyle = theme.settings.collectionSwatchStyle;

            if (this.siblingFieldset && this.productInfo) {
              if (this.swatchesStyle == 'grid' || this.swatchesStyle == 'slider' || this.swatchesStyle == 'limited') {
                this.siblingFieldset.classList.add('is-visible');
              }

              if (this.siblingCount) {
                this.siblingCount.addEventListener('mouseenter', () => this.showSiblings());

                // Prevent color swatches blinking on mouse move
                this.productInfo.addEventListener('mouseleave', () => this.hideSiblings());
              }
            }

            if (this.siblingLinks.length) {
              new SiblingSwatches(this.siblingLinks, this.product);
            }
          }

          showSiblings() {
            if (this.hideSwatchesTimer) clearTimeout(this.hideSwatchesTimer);

            if (this.productLink) {
              this.productLink.classList.add('no-events');
            }

            if (this.swatchesStyle == 'text') return;

            this.siblingFieldset.classList.add('is-visible');
          }

          hideSiblings() {
            this.hideSwatchesTimer = setTimeout(() => {
              if (this.productLink) {
                this.productLink.classList.remove('no-events');
              }

              this.siblingFieldset.classList.remove('is-visible');
            }, 100);
          }
        }
      );
    }

    /**
     * Module to show Recently Viewed Products
     *
     * Copyright (c) 2014 Caroline Schnapp (11heavens.com)
     * Dual licensed under the MIT and GPL licenses:
     * http://www.opensource.org/licenses/mit-license.php
     * http://www.gnu.org/licenses/gpl.html
     *
     */

    Shopify.Products = (function () {
      const config = {
        howManyToShow: 4,
        howManyToStoreInMemory: 10,
        wrapperId: 'recently-viewed-products',
        section: null,
        target: 'api-product-grid-item',
        onComplete: null,
      };

      let productHandleQueue = [];
      let wrapper = null;
      let howManyToShowItems = null;

      const today = new Date();
      const expiresDate = new Date();
      const daysToExpire = 90;
      expiresDate.setTime(today.getTime() + 3600000 * 24 * daysToExpire);

      const cookie = {
        configuration: {
          expires: expiresDate.toGMTString(),
          path: '/',
          domain: window.location.hostname,
          sameSite: 'none',
          secure: true,
        },
        name: 'shopify_recently_viewed',
        write: function (recentlyViewed) {
          const recentlyViewedString = encodeURIComponent(recentlyViewed.join(' '));
          document.cookie = `${this.name}=${recentlyViewedString}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
        },
        read: function () {
          let recentlyViewed = [];
          let cookieValue = null;

          if (document.cookie.indexOf('; ') !== -1 && document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
            cookieValue = document.cookie
              .split('; ')
              .find((row) => row.startsWith(this.name))
              .split('=')[1];
          }

          if (cookieValue !== null) {
            recentlyViewed = decodeURIComponent(cookieValue).split(' ');
          }

          return recentlyViewed;
        },
        destroy: function () {
          const cookieVal = null;
          document.cookie = `${this.name}=${cookieVal}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
        },
        remove: function (productHandle) {
          const recentlyViewed = this.read();
          const position = recentlyViewed.indexOf(productHandle);
          if (position !== -1) {
            recentlyViewed.splice(position, 1);
            this.write(recentlyViewed);
          }
        },
      };

      const finalize = (wrapper, section) => {
        wrapper.classList.remove('hidden');
        const cookieItemsLength = cookie.read().length;

        if (Shopify.recentlyViewed && howManyToShowItems && cookieItemsLength && cookieItemsLength < howManyToShowItems && wrapper.children.length) {
          let allClassesArr = [];
          let addClassesArr = [];
          let objCounter = 0;
          for (const property in Shopify.recentlyViewed) {
            objCounter += 1;
            const objString = Shopify.recentlyViewed[property];
            const objArr = objString.split(' ');
            const propertyIdx = parseInt(property.split('_')[1]);
            allClassesArr = [...allClassesArr, ...objArr];

            if (cookie.read().length === propertyIdx || (objCounter === Object.keys(Shopify.recentlyViewed).length && !addClassesArr.length)) {
              addClassesArr = [...addClassesArr, ...objArr];
            }
          }

          for (let i = 0; i < wrapper.children.length; i++) {
            const element = wrapper.children[i];
            if (allClassesArr.length) {
              element.classList.remove(...allClassesArr);
            }

            if (addClassesArr.length) {
              element.classList.add(...addClassesArr);
            }
          }
        }

        // If we have a callback.
        if (config.onComplete) {
          try {
            config.onComplete(wrapper, section);
          } catch (error) {
            console.log(error);
          }
        }
      };

      const moveAlong = (shown, productHandleQueue, wrapper, section, target, howManyToShow) => {
        if (productHandleQueue.length && shown < howManyToShow) {
          fetch(`${window.theme.routes.root}products/${productHandleQueue[0]}?section_id=${target}`)
            .then((response) => response.text())
            .then((product) => {
              const aosDelay = shown * 100;
              const aosAnchor = wrapper.id ? `#${wrapper.id}` : '';
              const fresh = document.createElement('div');
              let productReplaced = product;
              productReplaced = productReplaced.includes('||itemAnimationDelay||') ? productReplaced.replaceAll('||itemAnimationDelay||', aosDelay) : productReplaced;
              productReplaced = productReplaced.includes('||itemAnimationAnchor||') ? productReplaced.replaceAll('||itemAnimationAnchor||', aosAnchor) : productReplaced;
              fresh.innerHTML = productReplaced;

              wrapper.innerHTML += fresh.querySelector('[data-api-content]').innerHTML;

              productHandleQueue.shift();
              shown++;
              moveAlong(shown, productHandleQueue, wrapper, section, target, howManyToShow);
            })
            .catch(() => {
              cookie.remove(productHandleQueue[0]);
              productHandleQueue.shift();
              moveAlong(shown, productHandleQueue, wrapper, section, target, howManyToShow);
            });
        } else {
          finalize(wrapper, section);
        }
      };

      return {
        showRecentlyViewed: function (params) {
          if (Shopify.visualPreviewMode) return;

          const paramsNew = params || {};
          const shown = 0;

          // Update defaults.
          Object.assign(config, paramsNew);

          // Read cookie.
          productHandleQueue = cookie.read();

          // Element where to insert.
          wrapper = document.querySelector(`#${config.wrapperId}`);

          // How many products to show.
          howManyToShowItems = config.howManyToShow;
          config.howManyToShow = Math.min(productHandleQueue.length, config.howManyToShow);

          // If we have any to show.
          if (config.howManyToShow && wrapper) {
            // Getting each product with an Ajax call and rendering it on the page.
            moveAlong(shown, productHandleQueue, wrapper, config.section, config.target, howManyToShowItems);
          }
        },

        getConfig: function () {
          return config;
        },

        clearList: function () {
          cookie.destroy();
        },

        recordRecentlyViewed: function (params) {
          const paramsNew = params || {};

          // Update defaults.
          Object.assign(config, paramsNew);

          // Read cookie.
          let recentlyViewed = cookie.read();

          // If we are on a product page.
          if (window.location.pathname.indexOf('/products/') !== -1) {
            // What is the product handle on this page.
            let productHandle = decodeURIComponent(window.location.pathname)
              .match(
                /\/products\/([a-z0-9\-]|[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|[\u203B]|[\w\u0430-\u044f]|[\u0400-\u04FF]|[\u0900-\u097F]|[\u0590-\u05FF\u200f\u200e]|[\u0621-\u064A\u0660-\u0669 ])+/
              )[0]
              .split('/products/')[1];

            if (config.handle) {
              productHandle = config.handle;
            }

            // In what position is that product in memory.
            const position = recentlyViewed.indexOf(productHandle);

            // If not in memory.
            if (position === -1) {
              // Add product at the start of the list.
              recentlyViewed.unshift(productHandle);
              // Only keep what we need.
              recentlyViewed = recentlyViewed.splice(0, config.howManyToStoreInMemory);
            } else {
              // Remove the product and place it at start of list.
              recentlyViewed.splice(position, 1);
              recentlyViewed.unshift(productHandle);
            }

            // Update cookie.
            cookie.write(recentlyViewed);
          }
        },

        hasProducts: cookie.read().length > 0,
      };
    })();

    if (!customElements.get('tabs-component')) {
      customElements.define(
        'tabs-component',
        class GlobalTabs extends HTMLElement {
          constructor() {
            super();

            this.a11y = window.theme.a11y;
            this.calculateActiveBounds = this.calculateActiveBounds.bind(this);
          }

          connectedCallback() {
            const tabsNavList = this.querySelectorAll('[data-tab]');

            this.addEventListener('theme:tab:check', () => this.checkRecentTab());
            this.addEventListener('theme:tab:hide', () => this.hideRelatedTab());
            document.addEventListener('theme:resize:width', this.calculateActiveBounds);

            this.calculateActiveBounds();

            tabsNavList?.forEach((element) => {
              const tabId = parseInt(element.getAttribute('data-tab'));
              const tab = this.querySelector(`.tab-content-${tabId}`);

              element.addEventListener('click', () => {
                this.tabChange(element, tab);
              });

              element.addEventListener('keyup', (event) => {
                if ((event.code === 'Space' || event.code === 'Enter') && document.body.classList.contains('is-focused')) {
                  this.tabChange(element, tab);
                }
              });
            });
          }

          calculateActiveBounds() {
            const currentTab = this.querySelector('[data-tab].current');
            const parent = currentTab?.parentElement;

            parent?.style.setProperty('--active-width', `${currentTab.offsetWidth}px`);
            parent?.style.setProperty('--active-left', `${currentTab.offsetLeft}px`);
          }

          tabChange(element, tab) {
            if (element.classList.contains('current')) {
              return;
            }

            const currentTab = this.querySelector('[data-tab].current');
            const currentTabContent = this.querySelector('.tab-content.current');

            currentTab?.classList.remove('current');
            currentTabContent?.classList.remove('current');

            element.classList.add('current');
            tab.classList.add('current');

            if (element.classList.contains('hidden')) {
              tab.classList.add('hidden');
            }

            this.calculateActiveBounds();

            this.a11y.removeTrapFocus();

            this.dispatchEvent(new CustomEvent('theme:tab:change', {bubbles: true}));

            element.dispatchEvent(
              new CustomEvent('theme:form:sticky', {
                bubbles: true,
                detail: {
                  element: 'tab',
                },
              })
            );

            this.animateItems(tab);
          }

          animateItems(tab, animated = true) {
            const animatedItems = tab.querySelectorAll('[data-aos]');

            if (animatedItems.length) {
              animatedItems.forEach((animatedItem) => {
                animatedItem.classList.remove('aos-animate');

                if (animated) {
                  animatedItem.classList.add('aos-no-transition');

                  requestAnimationFrame(() => {
                    animatedItem.classList.remove('aos-no-transition');
                    animatedItem.classList.add('aos-animate');
                  });
                }
              });
            }
          }

          checkRecentTab() {
            const tabLink = this.querySelector('.tab-link__recent');

            if (tabLink) {
              tabLink.classList.remove('hidden');
              const tabLinkIdx = parseInt(tabLink.getAttribute('data-tab'));
              const tabContent = this.querySelector(`.tab-content[data-tab-index="${tabLinkIdx}"]`);

              if (tabContent) {
                tabContent.classList.remove('hidden');

                this.animateItems(tabContent, false);
              }
            }
          }

          hideRelatedTab() {
            const relatedSection = this.querySelector('[data-related-section]');
            if (!relatedSection) {
              return;
            }

            const parentTabContent = relatedSection.closest('.tab-content.current');
            if (!parentTabContent) {
              return;
            }
            const parentTabContentIdx = parseInt(parentTabContent.getAttribute('data-tab-index'));
            const tabsNavList = this.querySelectorAll('[data-tab]');

            if (tabsNavList.length > parentTabContentIdx) {
              const nextTabsNavLink = tabsNavList[parentTabContentIdx].nextSibling;

              if (nextTabsNavLink) {
                tabsNavList[parentTabContentIdx].classList.add('hidden');
                nextTabsNavLink.dispatchEvent(new Event('click'));
              }
            }
          }

          disconnectCallback() {
            document.removeEventListener('theme:resize:width', this.calculateActiveBounds);
          }
        }
      );
    }

    const selectors = {
      actions: '[data-actions]',
      content: '[data-content]',
      trigger: '[data-button]',
    };

    const attributes = {
      height: 'data-height',
    };

    const classes = {
      open: 'is-open',
      enabled: 'is-enabled',
    };

    class ToggleEllipsis extends HTMLElement {
      constructor() {
        super();

        this.initialHeight = this.getAttribute(attributes.height);
        this.content = this.querySelector(selectors.content);
        this.trigger = this.querySelector(selectors.trigger);
        this.actions = this.querySelector(selectors.actions);
        this.toggleActions = this.toggleActions.bind(this);
      }

      connectedCallback() {
        // Make sure the data attribute height value matches the CSS value
        this.setHeight(this.initialHeight);

        this.trigger.addEventListener('click', () => {
          this.setHeight(this.content.offsetHeight);
          this.classList.add(classes.open);
        });

        this.setHeight(this.initialHeight);
        this.toggleActions();

        document.addEventListener('theme:resize', this.toggleActions);
        document.addEventListener('theme:collapsible:toggle', this.toggleActions);
      }

      disconnectedCallback() {
        document.removeEventListener('theme:resize', this.toggleActions);
        document.removeEventListener('theme:collapsible:toggle', this.toggleActions);
      }

      setHeight(contentHeight) {
        this.style.setProperty('--height', `${contentHeight}px`);
      }

      toggleActions() {
        this.classList.toggle(classes.enabled, this.content.offsetHeight + this.actions.offsetHeight > this.initialHeight);
      }
    }

    if (!customElements.get('toggle-ellipsis')) {
      customElements.define('toggle-ellipsis', ToggleEllipsis);
    }

    if (!customElements.get('tooltip-component')) {
      customElements.define(
        'tooltip-component',
        class Tooltip extends HTMLElement {
          constructor() {
            super();

            this.label = this.hasAttribute('data-tooltip') ? this.getAttribute('data-tooltip') : '';
            this.transitionSpeed = 200;
            this.hideTransitionTimeout = 0;
            this.addPinEvent = () => this.addPin();
            this.addPinMouseEvent = () => this.addPin(true);
            this.removePinEvent = (event) => window.theme.throttle(this.removePin(event), 50);
            this.removePinMouseEvent = (event) => this.removePin(event, true, true);
          }

          connectedCallback() {
            if (!document.querySelector('.tooltip-default')) {
              const tooltipTemplate = '<div class="tooltip-default__arrow"></div><div class="tooltip-default__inner"><div class="tooltip-default__text"></div></div>';
              const tooltipElement = document.createElement('div');
              tooltipElement.className = 'tooltip-default';
              tooltipElement.innerHTML = tooltipTemplate;
              document.body.appendChild(tooltipElement);
            }

            this.addEventListener('mouseenter', this.addPinMouseEvent);
            this.addEventListener('mouseleave', this.removePinMouseEvent);
            this.addEventListener('pointerleave', this.removePinMouseEvent);
            this.addEventListener('theme:tooltip:init', this.addPinEvent);
            document.addEventListener('theme:tooltip:close', this.removePinEvent);
            this.onVariantChangeUnsubscriber = subscribe(theme.PUB_SUB_EVENTS.optionValueSelectionChange, this.removePin.bind(this, true, false));
          }

          addPin(stopMouseEnter = false) {
            const tooltipTarget = document.querySelector('.tooltip-default');

            const section = this.closest('[data-section-id]');
            const colorSchemeClass = Array.from(section.classList).find((cls) => cls.startsWith('color-scheme-'));
            tooltipTarget?.classList.add(colorSchemeClass); // add the section's color scheme class to the tooltip

            if (this.label && tooltipTarget && ((stopMouseEnter && !this.hasAttribute('data-tooltip-stop-mouseenter')) || !stopMouseEnter)) {
              const tooltipTargetArrow = tooltipTarget.querySelector('.tooltip-default__arrow');
              const tooltipTargetInner = tooltipTarget.querySelector('.tooltip-default__inner');
              const tooltipTargetText = tooltipTarget.querySelector('.tooltip-default__text');
              tooltipTargetText.innerHTML = this.label;

              const tooltipTargetWidth = tooltipTargetInner.offsetWidth;
              const tooltipRect = this.getBoundingClientRect();
              const tooltipTop = tooltipRect.top;
              const tooltipWidth = tooltipRect.width;
              const tooltipHeight = tooltipRect.height;
              const tooltipTargetPositionTop = tooltipTop + tooltipHeight + window.scrollY;
              let tooltipTargetPositionLeft = tooltipRect.left - tooltipTargetWidth / 2 + tooltipWidth / 2;
              const tooltipLeftWithWidth = tooltipTargetPositionLeft + tooltipTargetWidth;
              const sideOffset = 24;
              const tooltipTargetWindowDifference = tooltipLeftWithWidth - theme.windowWidth + sideOffset;

              if (tooltipTargetWindowDifference > 0) {
                tooltipTargetPositionLeft -= tooltipTargetWindowDifference;
              }

              if (tooltipTargetPositionLeft < 0) {
                tooltipTargetPositionLeft = 0;
              }

              tooltipTargetArrow.style.left = `${tooltipRect.left + tooltipWidth / 2}px`;
              tooltipTarget.style.setProperty('--tooltip-top', `${tooltipTargetPositionTop}px`);

              tooltipTargetInner.style.transform = `translateX(${tooltipTargetPositionLeft}px)`;
              tooltipTarget.classList.remove('is-hiding');
              tooltipTarget.classList.add('is-visible');

              document.addEventListener('theme:scroll', this.removePinEvent);
            }
          }

          removePin(event, stopMouseEnter = false, hideTransition = false) {
            const tooltipTarget = document.querySelector('.tooltip-default');
            const tooltipVisible = tooltipTarget.classList.contains('is-visible');

            if (tooltipTarget && ((stopMouseEnter && !this.hasAttribute('data-tooltip-stop-mouseenter')) || !stopMouseEnter)) {
              if (tooltipVisible && (hideTransition || (event && event.detail && event.detail.hideTransition))) {
                tooltipTarget.classList.add('is-hiding');

                if (this.hideTransitionTimeout) {
                  clearTimeout(this.hideTransitionTimeout);
                }

                this.hideTransitionTimeout = setTimeout(() => {
                  tooltipTarget.classList.remove('is-hiding');
                }, this.transitionSpeed);
              }

              tooltipTarget.classList.remove('is-visible');

              document.removeEventListener('theme:scroll', this.removePinEvent);
            }
          }

          disconnectedCallback() {
            this.onVariantChangeUnsubscriber();
            document.removeEventListener('theme:tooltip:close', this.removePinEvent);
            document.removeEventListener('theme:scroll', this.removePinEvent);
          }
        }
      );
    }

    class VariantSelects extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this.addEventListener('change', (event) => {
          const target = this.getInputForEventTarget(event.target);

          // Check if this change event is from a 'popout-select' dropdown that should trigger variant change
          this.triggerPopoutVariantChange(target);

          publish(theme.PUB_SUB_EVENTS.optionValueSelectionChange, {
            data: {
              event,
              target,
              selectedOptionValues: this.selectedOptionValues,
            },
          });
        });
      }

      getInputForEventTarget(target) {
        return target.tagName === 'SELECT' ? target.selectedOptions[0] : target;
      }

      get selectedOptionValues() {
        const selectedNativeDropdowns = Array.from(this.querySelectorAll('select option[selected]'));
        const selectedRadios = Array.from(this.querySelectorAll('fieldset input:checked'));
        const selectedPopouts = Array.from(this.querySelectorAll('[data-popout-input]'));

        return [...selectedNativeDropdowns, ...selectedRadios, ...selectedPopouts].map(({dataset}) => dataset.optionValueId).filter((id) => Boolean(id));
      }

      /**
       * Trigger variant change from a popout-select dropdown
       * @param {HTMLElement} target - The target element that triggered the change event
       */
      triggerPopoutVariantChange(target) {
        // check if the target is the correct input
        if (!target || !target.hasAttribute('data-popout-input')) return;

        // check if the popout-select has the correct attribute
        const popoutSelect = target.closest('popout-select');
        if (!popoutSelect || !popoutSelect.hasAttribute('data-variant-change')) return;

        // get the variant ID from the target
        const variantId = target.getAttribute('data-variant-id');
        if (!variantId) return;

        // get the target form and the variant ID input
        const targetForm = this.closest('form');
        const variantIdInput = targetForm?.querySelector('[name="id"]');
        if (!targetForm || !variantIdInput) return;

        // set the variant ID value and trigger the variant change
        variantIdInput.value = variantId;
        variantIdInput.dispatchEvent(new Event('change', {bubbles: true}));
      }
    }

    customElements.define('variant-selects', VariantSelects);

    /**
     * Custom element for managing upsell product blocks
     * Handles product removal/restoration based on cart state
     */
    class UpsellBlock extends HTMLElement {
      constructor() {
        super();

        // Cache for initial product HTML
        this.initialProductCache = new Map();
        // Track which products are currently removed from DOM
        this.removedProductIds = new Set();
        // Flag to track if initial cache has been populated
        this.isInitialized = false;
        this.blockId = this.getAttribute('data-upsell-block-id');
        this.hasSlider = this.hasAttribute('data-upsell-has-slider');
      }

      connectedCallback() {
        if (!this.isInitialized) {
          this.cacheInitialProducts();
          this.isInitialized = true;

          this.checkInitialCartState();
        }

        // Listen for cart updates
        this.handleCartUpdate = this.handleCartUpdate.bind(this);
        this.handleCartChange = this.handleCartChange.bind(this);

        document.addEventListener('theme:cart:update', this.handleCartUpdate);
        document.addEventListener('theme:cart:refresh', this.handleCartUpdate);
        document.addEventListener('theme:cart:change', this.handleCartChange);
      }

      disconnectedCallback() {
        document.removeEventListener('theme:cart:update', this.handleCartUpdate);
        document.removeEventListener('theme:cart:refresh', this.handleCartUpdate);
        document.removeEventListener('theme:cart:change', this.handleCartChange);
      }

      /**
       * Check initial cart state on page load
       * This ensures upsell blocks are updated if products are already in the cart
       *
       * @return  {Promise<void>}
       */
      async checkInitialCartState() {
        await this.updateFromCartAPI();
      }

      /**
       * Handle cart update event
       *
       * @param   {Event}  event  Cart update event
       * @return  {Promise<void>}
       */
      async handleCartUpdate(event) {
        // Get cart data from event or fetch it
        const cartData = event?.detail?.cartData;
        if (cartData) {
          await this.updateFromCartData(cartData);
        } else {
          await this.updateFromCartAPI();
        }
      }

      /**
       * Handle cart change event (dispatched from 'cart-items' element after build)
       * Updates from the data element passed in the event detail
       *
       * @param   {Event}  event  Cart change event
       * @return  {Promise<void>}
       */
      async handleCartChange(event) {
        const cartCount = event?.detail?.cartCount;
        const dataElement = event?.detail?.dataElement;

        // Restore all products from initial cache when cart is empty
        if (cartCount === 0) {
          this.restoreAllProducts();
          return;
        }

        // Update from data element if provided
        if (dataElement) {
          await this.updateFromDataElement(dataElement);
        }
      }

      /**
       * Update block from cart API response
       *
       * @return  {Promise<void>}
       */
      async updateFromCartAPI() {
        try {
          const response = await fetch(`${window.Shopify.routes.root}cart.js`, {
            headers: {Accept: 'application/json'},
          });
          if (!response.ok) return;

          const cart = await response.json();
          await this.updateFromCartData(cart);
        } catch (error) {
          console.error('Error fetching cart data:', error);
        }
      }

      /**
       * Update block from cart data object
       *
       * @param   {Object}  cartData  Cart data object
       * @return  {Promise<void>}
       */
      async updateFromCartData(cartData) {
        const cartProductVariants = this.getCartProductVariants(cartData);
        const cartIsEmpty = cartProductVariants.size === 0;

        if (cartIsEmpty) {
          // Restore all products from initial cache when cart is empty
          this.restoreAllProducts();
          return;
        }

        // Process visible products
        const visibleProductIds = await this.processVisibleProducts(cartProductVariants);

        // Process removed products that might need to be restored
        await this.processRemovedProducts(visibleProductIds, cartProductVariants);

        // Update visibility
        this.updateVisibility();
      }

      /**
       * Get cart product variants from cart data
       *
       * @param   {Object}  cartData  Cart data object
       * @return  {Map}  Map of productId -> Set of variantIds
       */
      getCartProductVariants(cartData) {
        const productVariants = new Map();

        if (cartData.items && Array.isArray(cartData.items)) {
          cartData.items.forEach((item) => {
            const productId = String(item.product_id);
            const variantId = String(item.variant_id);

            if (!productVariants.has(productId)) {
              productVariants.set(productId, new Set());
            }
            productVariants.get(productId).add(variantId);
          });
        }

        return productVariants;
      }

      /**
       * Check if all available variants of a product are in cart
       *
       * @param   {string}  productId      Product ID
       * @param   {Set}     cartVariantIds Set of variant IDs in cart
       * @param   {string}  productHandle  Product handle
       * @return  {Promise<boolean>}
       */
      async areAllVariantsInCart(productId, cartVariantIds, productHandle) {
        if (!productHandle) {
          console.warn(`Product handle not provided for product ${productId}`);
          return false;
        }

        const productUrl = `${window.Shopify.routes.root}products/${productHandle}.js`;

        try {
          const response = await fetch(productUrl, {
            headers: {Accept: 'application/json'},
          });

          if (!response.ok) {
            console.error(`Failed to fetch product ${productHandle}: ${response.status}`);
            return false;
          }

          const product = await response.json();

          // Get all available variant IDs (only count available variants)
          const allAvailableVariantIds = new Set(product.variants.filter((variant) => variant.available).map((variant) => String(variant.id)));

          // If no available variants, don't remove from upsells
          if (allAvailableVariantIds.size === 0) return false;

          // Check if all available variants are in the cart
          const cartVariantIdsStr = new Set(Array.from(cartVariantIds).map((id) => String(id)));
          const allVariantsInCart = Array.from(allAvailableVariantIds).every((variantId) => cartVariantIdsStr.has(variantId));

          return allVariantsInCart;
        } catch (error) {
          console.error(`Error fetching product ${productHandle} data:`, error);
          return false;
        }
      }

      /**
       * Cache all initial products on first load
       * This stores the HTML for all products so we can restore them later
       * Only caches products that aren't already cached to avoid overwriting
       *
       * @return  {void}
       */
      cacheInitialProducts() {
        const productHolders = this.querySelectorAll('[data-quick-add-holder]');

        productHolders.forEach((productHolder) => {
          const productId = productHolder.getAttribute('data-quick-add-holder');
          if (!productId) return;

          const productIdStr = productId.toString();

          // Only cache if not already cached
          if (this.initialProductCache.has(productIdStr)) return;

          const productElement = this.hasSlider ? productHolder.closest('swiper-slide') : productHolder.parentElement;

          if (productElement && productElement !== this) {
            // Cache the initial HTML of this product
            this.initialProductCache.set(productIdStr, productElement.outerHTML);
          }
        });
      }

      /**
       * Process visible products in the block
       *
       * @param   {Map}  cartProductVariants  Cart product variants
       * @return  {Promise<Set>}  Set of visible product IDs
       */
      async processVisibleProducts(cartProductVariants) {
        const productHolders = this.querySelectorAll('[data-quick-add-holder]');
        const visibleProductIds = new Set();

        for (const productHolder of productHolders) {
          const productId = productHolder.getAttribute('data-quick-add-holder');
          const productHandle = productHolder.getAttribute('data-product-handle');
          if (!productId || !productHandle) continue;

          const productIdStr = productId.toString();
          visibleProductIds.add(productIdStr);

          const cartVariants = cartProductVariants.get(productIdStr) || new Set();
          const allVariantsInCart = await this.areAllVariantsInCart(productIdStr, cartVariants, productHandle);

          if (allVariantsInCart && !this.removedProductIds.has(productIdStr)) {
            // Remove product - all variants in cart
            this.removeProduct(productHolder, productIdStr);
          } else if (!allVariantsInCart && this.removedProductIds.has(productIdStr)) {
            // Restore product - not all variants in cart
            this.restoreProduct(productIdStr);
          }
        }

        return visibleProductIds;
      }

      /**
       * Process removed products that aren't currently visible
       * Check if they should be restored based on cart state
       *
       * @param   {Set}  visibleProductIds   Set of visible product IDs
       * @param   {Map}  cartProductVariants Cart product variants
       * @return  {Promise<void>}
       */
      async processRemovedProducts(visibleProductIds, cartProductVariants) {
        for (const removedProductId of this.removedProductIds) {
          // Skip if already visible
          if (visibleProductIds.has(removedProductId)) continue;

          // Get product handle from initial cache
          const cachedHtml = this.initialProductCache.get(removedProductId);
          if (!cachedHtml) continue;

          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cachedHtml;
          const cachedProductHolder = tempDiv.querySelector('[data-product-handle]');
          if (!cachedProductHolder) continue;

          const productHandle = cachedProductHolder.getAttribute('data-product-handle');
          const cartVariants = cartProductVariants.get(removedProductId) || new Set();
          const allVariantsInCart = await this.areAllVariantsInCart(removedProductId, cartVariants, productHandle);

          if (!allVariantsInCart) {
            // Restore product - not all variants in cart
            this.restoreProduct(removedProductId);
          }
        }
      }

      /**
       * Remove product from block and track that it's removed from the DOM
       *
       * @param   {HTMLElement}  productHolder  The product holder element
       * @param   {string}       productIdStr    Product ID as string
       * @return  {void}
       */
      removeProduct(productHolder, productIdStr) {
        const productElement = this.hasSlider ? productHolder.closest('swiper-slide') : productHolder.parentElement;

        if (productElement && productElement !== this) {
          // Ensure we have the initial HTML cached
          if (!this.initialProductCache.has(productIdStr)) {
            this.initialProductCache.set(productIdStr, productElement.outerHTML);
          }

          // Track that this product is removed
          this.removedProductIds.add(productIdStr);
          productElement.remove();

          if (this.hasSlider) {
            this.updateSwiperSlider();
          }
        }
      }

      /**
       * Restore product from initial cache
       *
       * @param   {string}  productIdStr  Product ID as string
       * @return  {boolean}  True if restored successfully
       */
      restoreProduct(productIdStr) {
        const cachedHtml = this.initialProductCache.get(productIdStr);
        if (!cachedHtml) return false;

        // Parse the cached HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cachedHtml;
        const restoredElement = tempDiv.firstElementChild;

        if (!restoredElement) {
          this.removedProductIds.delete(productIdStr);
          return false;
        }

        // Reset state classes on restored element (buttons, forms, etc.)
        // Do this before inserting into DOM
        this.resetElementState(restoredElement);

        // Find the correct container - for sliders, it's inside swiper-container
        if (this.hasSlider) {
          const swiper = this.querySelector('swiper-container');
          if (!swiper) {
            console.warn('Swiper container not found in slider block:', this.blockId);
            this.removedProductIds.delete(productIdStr);
            return false;
          }
          swiper.appendChild(restoredElement);
          this.updateSwiperSlider();
        } else {
          // For non-slider blocks, append directly to the element
          this.appendChild(restoredElement);
        }

        // Remove from removed products tracking
        this.removedProductIds.delete(productIdStr);
        return true;
      }

      /**
       * Restore all products from initial cache
       * Used when cart is emptied
       *
       * @return  {void}
       */
      restoreAllProducts() {
        // Restore all products that are currently removed
        const productsToRestore = Array.from(this.removedProductIds);

        productsToRestore.forEach((productIdStr) => this.restoreProduct(productIdStr));

        // Clear removed products tracking
        this.removedProductIds.clear();
      }

      /**
       * Reset state classes on restored elements
       * Removes classes like is-added, is-loading, has-error, etc.
       *
       * @param   {HTMLElement}  element  Element to reset
       * @return  {void}
       */
      resetElementState(element) {
        // State classes to remove from buttons and forms
        const stateClasses = ['is-added', 'is-loading', 'is-disabled', 'has-error', 'is-visible', 'is-animated'];

        // Reset buttons
        element.querySelectorAll('button, [data-quick-add-button]').forEach((button) => {
          stateClasses.forEach((className) => {
            button.classList.remove(className);
          });
          if (button.disabled) {
            button.disabled = false;
          }
        });

        // Reset form containers
        element.querySelectorAll('[data-quick-add-holder], [data-form-wrapper]').forEach((container) => {
          stateClasses.forEach((className) => {
            container.classList.remove(className);
          });
        });

        // Reset error containers
        element.querySelectorAll('[data-cart-errors-container], [data-error-message]').forEach((errorEl) => {
          errorEl.classList.remove('is-visible', 'has-error');
          if (errorEl.innerHTML) {
            errorEl.innerHTML = '';
          }
        });

        // Remove initialization attributes from all custom elements to allow re-initialization
        // This handles any custom element that uses initialization flags
        const initAttributePatterns = ['data-initialized', 'data-popout-initialized'];

        // Build selector to query only elements with these attributes
        const selector = initAttributePatterns.map((attr) => `[${attr}]`).join(', ');
        const elementsWithInitAttrs = element.querySelectorAll(selector);

        elementsWithInitAttrs.forEach((el) => {
          initAttributePatterns.forEach((attr) => {
            if (el.hasAttribute(attr)) {
              el.removeAttribute(attr);
            }
          });
        });
      }

      /**
       * Update/reinitialize swiper slider after slides are added or removed
       *
       * @return  {void}
       */
      updateSwiperSlider() {
        const swiper = this.querySelector('swiper-container');
        if (!swiper) return;

        if (swiper.swiper) {
          swiper.swiper.update();
          return;
        }

        customElements.whenDefined('swiper-container').then(() => {
          if (swiper.swiper) swiper.swiper.update();
        });
      }

      /**
       * Update block visibility based on remaining products
       *
       * @return  {void}
       */
      updateVisibility() {
        const remainingProducts = this.querySelectorAll('[data-quick-add-holder]');
        const onboardingProducts = this.querySelectorAll('.product-upsell__holder--onboarding');
        const cartBlock = this.closest('.cart-block');
        if (cartBlock) {
          cartBlock.style.display = remainingProducts.length > 0 || onboardingProducts.length > 0 ? '' : 'none';
        }
      }

      /**
       * Public method to update from external cart data (called from cart.js)
       *
       * @param   {HTMLElement}  [dataElement]  Element containing cart data from api-cart-items
       * @return  {Promise<void>}
       */
      async updateFromDataElement(dataElement) {
        if (!dataElement) return;

        const jsonScript = dataElement.querySelector('[data-api-cart-items-json]');
        if (!jsonScript) return;

        try {
          const cartItemsData = JSON.parse(jsonScript.textContent);
          const cartProductVariants = this.getCartProductVariants(cartItemsData);
          const cartIsEmpty = cartProductVariants.size === 0;

          if (cartIsEmpty) {
            // Restore all products from initial cache when cart is empty
            this.restoreAllProducts();
            return;
          }

          // Process visible products
          const visibleProductIds = await this.processVisibleProducts(cartProductVariants);

          // Process removed products that might need to be restored
          await this.processRemovedProducts(visibleProductIds, cartProductVariants);

          // Update visibility
          this.updateVisibility();
        } catch (error) {
          console.error('Error updating upsell block from data element:', error);
        }
      }
    }

    if (!customElements.get('upsell-block')) {
      customElements.define('upsell-block', UpsellBlock);
    }

})();
