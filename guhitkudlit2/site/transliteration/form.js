import { html } from "../components/html.js";
import { Input } from "../components/input.js";
import { useState } from "../lib/htm-preact.js";
import { LabelText } from "../typography/text.js";
import { syllabicate } from "./syllabicate.js";
import { convertToUnicode } from "./unicode.mjs";

export function TransliterationForm() {
  const [syllabication, setSyllabication] = useState("");
  const [baybayin, setBaybayin] = useState("");

  const onInput = (event) => {
    const input = event.currentTarget.value;
    const inputSyllabicaton = syllabicate(input);
    const inputBaybayin = convertToUnicode(inputSyllabicaton);
    setSyllabication(inputSyllabicaton.join(" · "));
    setBaybayin(inputBaybayin);
  };

  return html`
    <style id=${TransliterationForm.name}>
      .transliterationFormRow {
        display: flex;
        flex-direction: column;
        gap: var(--size-xs);
        margin: var(--size-m) var(--size-s);
      }
      .transliterationFormInput {
        width: 100%;
      }
    </style>
    <form>
      <label class="transliterationFormRow">
        <${LabelText} tagName="div">Tagalog word<//>
        <${Input}
          className="transliterationFormInput"
          type="text"
          placeholder="kalabasa"
          onInput=${onInput}
        />
      </label>
      <label class="transliterationFormRow">
        <${LabelText} tagName="div">Syllabication<//>
        <${Output} value=${syllabication} placeholder="ka · la · ba · sa" />
      </label>
      <label class="transliterationFormRow">
        <${LabelText} tagName="div">Baybayin<//>
        <${Output} value=${baybayin} placeholder="ᜃᜎᜊᜐ" />
      </label>
    </form>
  `;
}

function Output({ value, placeholder }) {
  return html`
    <style id=${TransliterationForm.name + Output.name}>
      .transliterationFormOutputPlaceholder {
        opacity: var(--opacity-placeholder);
      }
    </style>
    <div class=${value ? "" : "transliterationFormOutputPlaceholder"}>
      ${value || placeholder}
    </div>
  `;
}
