
        import pack from "https://portabl.ink/pack.js";

        const htmlTextArea = document.getElementById("demoHTML");
        const urlTextArea = document.getElementById("demoURL");

        htmlTextArea.addEventListener("input", htmlToURL);

        htmlTextArea.value = "<div>Hello world! " + "Hello world again! ".repeat(20).trim() + "</div>";
        htmlToURL();

        async function htmlToURL() {
          urlTextArea.value = await pack(htmlTextArea.value);
        }
      