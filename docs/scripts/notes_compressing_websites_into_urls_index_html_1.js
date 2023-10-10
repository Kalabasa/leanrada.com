
        (()=>{
          const input = document.getElementById("dataURLInput");
          const frame = document.getElementById("dataURLFrame");
          const home = document.getElementById("browserHomeButton");
          const copy = document.getElementById("browserCopyButton");
          
          input.addEventListener("focus", () => setTimeout(() => {
            const rect = frame.getBoundingClientRect();
            if (rect.bottom > window.innerHeight) {
              frame.parentElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          }));
          input.addEventListener("input", refresh);
          input.addEventListener("change", refresh);
          home.addEventListener("click", () => {
            input.value = input.getAttribute("value");
            refresh();
          });
          copy.addEventListener("click", async () => {
            await navigator.clipboard?.writeText(input.value);
            alert("URL copied!");
          });
          refresh();
          
          function refresh() {
            const isDataURL = input.value.startsWith("data:");

            if (!isDataURL) {
              alert("No cheating! Enter a data URL only");
              input.value = "data:text/html,";
            }

            frame.src = input.value;
          }
        })();
      