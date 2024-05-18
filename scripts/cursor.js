
  (() => {
    const cursorKey = "cursorSelected";
    const cursorNames = ["note", "sword", "boba"];
    let cursorSelected = null;

    function lrCursorSelect(name) {
      if (name && !cursorNames.includes(name)) return;

      if (name == null || cursorSelected === name) {
        cursorSelected = null;
        sessionStorage.removeItem(cursorKey);
        document.body.style.cursor = null;
      } else {
        cursorSelected = name;
        sessionStorage.setItem(cursorKey, name);
        document.body.style.cursor = `url('/icons/cursor_${name}.png'), auto`;
      }

      if (window.lrUpdateButtons) lrUpdateButtons();

      // todo: support touch users
    }

    cursorSelected = null;
    window.lrCursorSelect = lrCursorSelect;

    lrCursorSelect(sessionStorage.getItem(cursorKey));
  })();
