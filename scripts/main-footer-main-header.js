
  (() => {
    let scrollToTopValue = 0;

    const topBtn = document.querySelector(".main-footer-top-btn");
    topBtn.addEventListener("click", (event) => {
      event.preventDefault();
      scrollToTopValue = 200;
      animateScrollToTop();
    });

    // subtle smooth scroll
    function animateScrollToTop() {
      scrollToTopValue *= 0.6;
      window.scrollTo(0, scrollToTopValue);
      if (scrollToTopValue < 1) {
        window.scrollTo(0, 0);
      } else {
        requestAnimationFrame(animateScrollToTop);
      }
    }

    if (window.screen) {
      const bestViewed = document.querySelector(".main-footer-best-viewed");
      updateBestViewed();
      window.screen.addEventListener("change", () => updateBestViewed());

      function updateBestViewed() {
        if (window.screen.width > 0 && window.screen.height > 0) {
          const w = window.screen.width * window.devicePixelRatio;
          const h = window.screen.height * window.devicePixelRatio;
          bestViewed.textContent = `This site is best viewed on a ${w}x${h} screen!`;
        }
      }
    }
  })();


  (() => {
    const mainHeader = document.querySelector(".main-header");
    const indicator = document.querySelector(".main-header-indicator");

    let currentY = 0;
    let currentYTarget = 0;

    let mouseHovering = false;

    let isTouch = false;
    let lastScrollY = window.scrollY;
    let lastCursorY = 0;

    const passive = { passive: true };
    window.addEventListener("scroll", debounce(onScroll), passive);
    window.addEventListener("mousemove", debounce(onMouseMove, 100), passive);
    window.addEventListener("touchstart", onWindowTouchStart, passive);
    window.addEventListener("touchmove", onWindowTouchMove, passive);
    mainHeader.addEventListener("touchstart", onTouchStart, passive);

    function onScroll(event) {
      const dy = window.scrollY - lastScrollY;

      // move with the page
      currentY -= dy;
      if (currentY > 0) {
        currentY = 0;
      } else if (currentY < -mainHeader.offsetHeight) {
        currentY = -mainHeader.offsetHeight;
      }

      currentYTarget = currentY;
      updateDOM();

      lastScrollY = window.scrollY;
    }

    function onMouseMove(event) {
      if (isTouch) return;

      const dy = event.clientY - lastCursorY;

      // show when mouse goes near the top
      const scaledDy = Math.sign(dy) * Math.log1p(Math.abs(dy)) * 20;
      if (dy < 0 && event.clientY + scaledDy < mainHeader.offsetHeight) {
        currentYTarget = 0;
        mouseHovering = true;
      } else if (
        mouseHovering &&
        dy > 0 &&
        event.clientY > mainHeader.offsetHeight * 4
      ) {
        currentYTarget = Math.max(-window.scrollY, -mainHeader.offsetHeight);
        mouseHovering = false;
      }

      updateDOM();
      lastCursorY = event.clientY;
    }

    function onWindowTouchStart(event) {
      isTouch = true;
      lastCursorY = event.touches[0].clientY;
    }
    function onWindowTouchMove(event) {
      const dy = event.touches[0].clientY - lastCursorY;

      // move with touch but only if at edge
      if (window.scrollY <= 0 && dy > 0) {
        currentY += dy;
        if (currentY >= 0) {
          currentY = 0;
          document.body.style.overscrollBehaviorY = null;
        } else if (currentY < 0) {
          document.body.style.overscrollBehaviorY = "none";
        }

        currentYTarget = currentY;
        updateDOM();
      }

      lastCursorY = event.touches[0].clientY;
    }

    function onTouchStart(event) {
      currentYTarget = 0;
      updateDOM();
    }

    const updateDOM = debounce(() => {
      mainHeader.style.transform = `translateY(${currentY.toFixed(2)}px)`;

      const isHidden = currentY < -mainHeader.offsetHeight * 0.8;
      mainHeader.classList.toggle("hidden", isHidden);

      if (Math.abs(currentY - currentYTarget) > 1) {
        currentY += (currentYTarget - currentY) * 0.2;
        requestAnimationFrame(updateDOM);
      } else {
        currentY = currentYTarget;
      }
    });

    if (mainHeader.classList.contains("prehide")) {
      document.body.style.overscrollBehaviorY = "none";
      currentY = currentYTarget = -mainHeader.offsetHeight;
      updateDOM();
    }

    function debounce(fn, ms = 0) {
      let recentlyFired = false;
      return (...args) => {
        if (recentlyFired) return;
        recentlyFired = true;
        if (ms === 0) {
          requestAnimationFrame(() => (recentlyFired = false));
        } else {
          setTimeout(() => (recentlyFired = false), ms);
        }
        return fn(...args);
      };
    }
  })();
