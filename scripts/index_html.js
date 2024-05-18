
      (() => {
        const cursorKey = "cursorSelected";
        const buttons = document.querySelectorAll(".cursor-provider-button");

        function lrUpdateButtons() {
          for (const button of buttons) {
            const itsName = button.dataset.cursor;
            const image = "url('/icons/cursor_" + itsName + ".png')";
            const taken = sessionStorage.getItem(cursorKey) === itsName;
            button.style.backgroundImage = taken ? null : image;
          }
        }

        window.lrUpdateButtons = lrUpdateButtons;

        lrUpdateButtons();

        for (const button of buttons) {
          button.addEventListener("click", () => {
            if (window.lrCursorSelect) lrCursorSelect(button.dataset.cursor);
          });
        }
      })();
    