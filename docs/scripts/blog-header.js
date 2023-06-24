
  (() => {
    const header = document.querySelector(".blog-header");
    const hero = document.querySelector(".blog-header-hero");
    const title = header.querySelector(".blog-header-title");
    const titleInner = title.querySelector(".blog-header-title-inner");
    const decor = header.querySelector(".blog-header-decor");
    const decorPath = decor.querySelector("path");

    updateDecorations();
    const observer = new ResizeObserver(() =>
      // Wait for layout
      requestAnimationFrame(() =>
        requestAnimationFrame(() => updateDecorations())
      )
    );
    observer.observe(header);

    // Add inner corner radius decorations using SVG
    function updateDecorations() {
      const radius = 18;

      const parent = header.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();

      const range = document.createRange();
      range.selectNode(titleInner);
      const rects = [...range.getClientRects()];

      const offsetLeft = -parent.left;
      const offsetTop = -parent.top;
      decor.setAttribute("width", Math.floor(heroRect.width));
      decor.setAttribute("height", Math.floor(heroRect.height));

      const pathCommands = [];
      // Find intersections between title rects, find and decorate the corners
      // O(n^2), but n is ~3, so total of ~9 iterations, is fine
      for (let i = 0; i < rects.length; i++) {
        const r1 = rects[i];
        for (let j = i + 1; j < rects.length; j++) {
          const r2 = rects[j];
          if (!rectsIntersect(r1, r2)) continue;

          // Technically there are four potential inner corners
          // But for this specific design, top-left & bottom-left won't be possible

          // Top right corner
          if (r1.top < r2.top - radius && r1.right < r2.right - radius) {
            pathCommands.push(
              drawInnerCorner(
                offsetLeft + r1.right - 1,
                offsetTop + r2.top + 1,
                offsetLeft + Math.min(r1.right + radius, r2.right - radius),
                offsetTop + Math.max(r2.top - radius, r1.top + radius)
              )
            );
          } else if (r1.top > r2.top + radius && r1.right > r2.right + radius) {
            pathCommands.push(
              drawInnerCorner(
                offsetLeft + r2.right - 1,
                offsetTop + r1.top + 1,
                offsetLeft + Math.min(r2.right + radius, r1.right - radius),
                offsetTop + Math.max(r1.top - radius, r2.top + radius)
              )
            );
          }

          // Bottom right corner
          if (r1.bottom > r2.bottom + radius && r1.right < r2.right - radius) {
            pathCommands.push(
              drawInnerCorner(
                offsetLeft + r1.right - 1,
                offsetTop + r2.bottom - 1,
                offsetLeft + Math.min(r1.right + radius, r2.right - radius),
                offsetTop + Math.min(r2.bottom + radius, r1.bottom - radius)
              )
            );
          } else if (
            r1.bottom < r2.bottom - radius &&
            r1.right > r2.right + radius
          ) {
            pathCommands.push(
              drawInnerCorner(
                offsetLeft + r2.right - 1,
                offsetTop + r1.bottom - 1,
                offsetLeft + Math.min(r2.right + radius, r1.right - radius),
                offsetTop + Math.min(r1.bottom + radius, r2.bottom - radius)
              )
            );
          }
        }

        // Special corners for the hero background
        // Top edge
        if (r1.top <= heroRect.top && r1.bottom > heroRect.top) {
          pathCommands.push(
            drawInnerCorner(
              offsetLeft + r1.right - 1,
              offsetTop + heroRect.top - 1,
              offsetLeft + r1.right + radius,
              offsetTop + heroRect.top + radius
            )
          );
        }
        // Left edge
        if (r1.left <= heroRect.left && r1.right > heroRect.left) {
          pathCommands.push(
            drawInnerCorner(
              offsetLeft + heroRect.left - 1,
              offsetTop + r1.bottom - 1,
              offsetLeft + heroRect.left + radius,
              offsetTop + r1.bottom + radius
            )
          );
        }
      }

      decorPath.setAttribute("d", pathCommands.join(" "));
    }

    function rectsIntersect(r1, r2) {
      return (
        r1.right > r2.left &&
        r1.left < r2.right &&
        r1.bottom > r2.top &&
        r1.top < r2.bottom
      );
    }

    function drawInnerCorner(x, y, pointX, pointY) {
      const radiusX = Math.abs(x - pointX);
      const radiusY = Math.abs(y - pointY);
      const dir = (Math.sign((x - pointX) * (y - pointY)) + 1) / 2;
      return (
        `M ${x} ${y} ` +
        `L ${x} ${pointY} ` +
        `A ${radiusX},${radiusY} 0 0 ${dir} ${pointX} ${y} ` +
        `L ${x} ${y}`
      );
    }
  })();
