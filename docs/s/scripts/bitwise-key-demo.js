
  (() => {
    const demos = document.querySelectorAll(".bitwise-key-demo");
    for (const demo of demos) {
      initDemo(demo);
    }

    function initDemo(demo) {
      const full = demo.dataset.mode === "full";

      const digits = demo.querySelectorAll(".bitwise-key-demo-digit");
      const bits = demo.querySelectorAll(".bitwise-key-demo-bit");
      const keys = demo.querySelectorAll(".bitwise-key-demo-key");

      const result = demo.querySelector(".bitwise-key-demo-result");
      let resultNum = 0;

      const numDigits = digits.length;
      if (bits.length !== numDigits || keys.length !== numDigits) {
        throw new Error("Invalid DOM structure!");
      }

      const hotkeys = full ? "QWER" : "abcd";
      for (let i = 0; i < numDigits; i++) {
        keys[i].textContent = hotkeys[i];
      }

      const state = full ? [0, 0, 0, 0] : [0, 1, 1, 0];
      const down = [0, 0, 0, 0];
      resultNum = full ? 0 : 6;
      renderState();

      if (full) {
        for (let i = 0; i < numDigits; i++) {
          digits[i].style.pointerEvents = "none";
        }

        demo.addEventListener("keydown", (event) => {
          event.preventDefault();
          const index = hotkeys.indexOf(event.key.toUpperCase());

          if (index < 0) return;

          if (down[index] !== 0) return;
          down[index] = 1;

          state[index] = 1;
          resultNum = 0;
          renderState();
          digits[index].classList.add("bitwise-key-demo-digit-active");
        });

        demo.addEventListener("keyup", (event) => {
          event.preventDefault();
          const index = hotkeys.indexOf(event.key.toUpperCase());

          if (index < 0) return;

          if (down[index] === 0) return;
          down[index] = 0;

          if (down.reduce((sum, b) => sum + b) === 0) {
            resultNum = Number.parseInt(state.slice().reverse().join(""), 2);
            state.forEach((_, i) => (state[i] = 0));
          }

          renderState();
          digits[index].classList.remove("bitwise-key-demo-digit-active");
        });
      } else {
        demo.addEventListener("click", (event) => {
          let index = -1;
          for (let i = 0; i < numDigits; i++) {
            if (digits[i].contains(event.target)) {
              index = i;
              break;
            }
          }

          if (index < 0) {
            demo.focus();
            return;
          }

          state[index] = 1 - state[index];
          resultNum = Number.parseInt(state.slice().reverse().join(""), 2);
          renderState();
        });
      }

      function renderState() {
        for (let i = 0; i < numDigits; i++) {
          digits[i].classList.toggle(
            "bitwise-key-demo-digit-set",
            state[i] !== 0
          );

          const label =
            full && !state.some((b) => b)
              ? `\u00A0×${2 ** i}`
              : `${state[i]}×${2 ** i}`;
          bits[i].textContent = label;
        }

        if (full) {
          result.textContent = resultNum ? `➡ F${resultNum}` : "";
        } else {
          result.textContent = `= ${resultNum}`;
        }
      }
    }
  })();
