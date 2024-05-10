
  (() => {
    initForm();
    initMessagesList();

    async function initForm() {
      const { BG_COLORS, FG_COLORS, STAMPS, getCSS, getStampContent } =
        await loadGuestbookCardLib();
      const form = document.querySelector(".form");
      const { fgRGB, bgRGB, bgStyleIndex, fontIndex } = form.elements;
      const guestbookCard = document.getElementById("guestbook-card");
      const submitBtn = document.getElementById("submitBtn");
      const bgStyleBtn = document.getElementById("bgStyleBtn");
      const bgBtn = document.getElementById("bgBtn");
      const fgBtn = document.getElementById("fgBtn");
      const fontBtn = document.getElementById("fontBtn");
      const stampBtn = document.getElementById("stampBtn");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        submitBtn.disabled = true;
        await fetch(form.action, {
          method: "post",
          body: new FormData(form),
        });
        setTimeout(() => location.reload(), 500);
      });

      fgBtn.addEventListener("click", async () => {
        fgRGB.value =
          FG_COLORS[
            (FG_COLORS.indexOf(Number(fgRGB.value)) + 1) % FG_COLORS.length
          ];
        const style = await guestbookCard.updateStyle({
          fgRGB: Number(fgRGB.value),
        });
        form.setAttribute("style", getCSS(style));
      });

      bgBtn.addEventListener("click", async () => {
        bgRGB.value =
          BG_COLORS[
            (BG_COLORS.indexOf(Number(bgRGB.value)) + 1) % BG_COLORS.length
          ];
        const style = await guestbookCard.updateStyle({
          bgRGB: Number(bgRGB.value),
        });
        form.setAttribute("style", getCSS(style));
      });

      bgStyleBtn.addEventListener("click", async () => {
        bgStyleIndex.value = (Number(bgStyleIndex.value) + 1) % 4;
        const style = await guestbookCard.updateStyle({
          bgStyleIndex: Number(bgStyleIndex.value),
        });
        form.setAttribute("style", getCSS(style));
      });

      fontBtn.addEventListener("click", async () => {
        fontIndex.value = (Number(fontIndex.value) + 1) % 3;
        const style = await guestbookCard.updateStyle({
          fontIndex: Number(fontIndex.value),
        });
        form.setAttribute("style", getCSS(style));
      });

      // Stamp logic
      let holdingStampState = null;
      let stampIndex = Math.floor(Math.random() * STAMPS.length);
      stampBtn.textContent = getStampContent(stampIndex);
      stampBtn.addEventListener("click", async () => {
        if (holdingStampState) {
          stampIndex = (Number(stampIndex) + 1) % STAMPS.length;
          stampBtn.textContent = getStampContent(stampIndex);
        } else {
          const cursorStyle = document.createElement("style");
          document.head.appendChild(cursorStyle);

          holdingStampState = {
            cursorStyle,
          };

          const listenerParameters = [
            "click",
            (event) => {
              if (stampBtn.contains(event.target)) return;

              const bounds = guestbookCard.getBoundingClientRect();
              if (
                event.clientX + size > bounds.left &&
                event.clientX < bounds.right &&
                event.clientY + size > bounds.top &&
                event.clientY < bounds.bottom
              ) {
                const x = Math.round(
                  (100 * (event.clientX - bounds.x)) / bounds.width
                );
                const y = Math.round(
                  (100 * (event.clientY - bounds.y)) / bounds.height
                );
                guestbookCard.addStamp(stampIndex, x, y);
              }

              setTimeout(() => cursorStyle.remove());
              holdingStampState = null;

              event.preventDefault();
              document.activeElement?.blur();
              window.removeEventListener(...listenerParameters);
            },
            { capture: true },
          ];
          window.addEventListener(...listenerParameters);
        }

        const content = getStampContent(stampIndex);
        const size = 60;
        holdingStampState.cursorStyle.textContent = `
            body, #guestbook-card * {
              cursor:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${
                (size * 5) / 3
              }px' height='${
          size * 2
        }px' viewport='0 0 100 100' style='fill:black;font-size:${size}px;'><text y='50%'>${content}</text></svg>") 0 0,grabbing
            }`;
      });
    }

    async function initMessagesList() {
      const messagesList = document.querySelector(".messages-list");

      let currentPage = 0;
      let loading = loadPage(currentPage);

      async function loadPage(page) {
        const response = await fetch(GUESTBOOK_API + "?page=" + page);
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!data || data.length === 0) return 0;
        for (const message of data) {
          messagesList.appendChild(await renderMessage(message));
        }
      }

      async function renderMessage(message) {
        const { createGuestbookCard } = await loadGuestbookCardLib();
        return createGuestbookCard({
          text: message.text,
          name: message.name,
          stamps: message.stamps,
          style: {
            fontIndex: message.fontIndex,
            bgStyleIndex: message.bgStyleIndex,
            bgRGB: message.bgRGB,
            fgRGB: message.fgRGB,
          },
        });
      }
    }

    async function loadGuestbookCardLib() {
      return (loadGuestbookCardLib.result =
        loadGuestbookCardLib.result ??
        import("/guestbook/guestbook-card.js").then(
          () => window.GUESTBOOK_CARD
        ));
    }
  })();
