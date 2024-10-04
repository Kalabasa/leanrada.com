import { html } from "../components/html.js";
import { Input } from "../components/input.js";
import { observable, reaction, runInAction } from "../lib/mobx.js";
import { LabelText } from "../typography/text.js";
import { classes } from "../util/classes.js";
import { debounce } from "../util/debounce.js";
import { observer } from "../util/observer.js";
import { syllabicate } from "./syllabicate.js";
import { convertToUnicode } from "./unicode.mjs";

export function createTransliterationForm() {
  const inputText = observable.box("");
  const baybayinUnits = observable.box([]);
  const prettify = observable.box(false);

  const debouncedRemovePrettify = debounce(() => {
    prettify.set(false);
  }, 400);

  reaction(
    () => inputText.get(),
    (inputText) => {
      const output = syllabicate(inputText);
      baybayinUnits.set(output);
      prettify.set(true);
      debouncedRemovePrettify();
    },
    { delay: 100 }
  );

  const TransliterationFormImpl = observer(() => {
    const onInput = (event) => {
      runInAction(() => inputText.set(event.currentTarget.value));
    };

    const unicodeFilter = prettify.get()
      ? prettifyTempBaybayin
      : (value) => value;

    return html`
      <${TransliterationForm}
        syllabication=${baybayinUnits.get().join(" · ")}
        baybayin=${convertToUnicode(unicodeFilter(baybayinUnits.get()))}
        onInput=${onInput}
      />
    `;
  });

  return {
    TransliterationForm: TransliterationFormImpl,
    observableBaybayinUnits: baybayinUnits,
  };
}

// Hide final kudlit or the 'n' in 'ng', looks better while typing
function prettifyTempBaybayin(baybayinUnits) {
  if (baybayinUnits.length === 0) return baybayinUnits;
  const lastConsonantMatch =
    baybayinUnits[baybayinUnits.length - 1].match(/[^aeiou]/i);
  if (!lastConsonantMatch) return baybayinUnits;
  if (lastConsonantMatch[0] === "n") return baybayinUnits.slice(0, -1);
  return [...baybayinUnits.slice(0, -1), lastConsonantMatch[0] + "a"];
}

export function TransliterationForm({ syllabication, baybayin, onInput }) {
  return html`
    <style id=${TransliterationForm.name}>
      .transliterationForm {
        display: flex;
        flex-direction: column;
        gap: var(--size-l);
        margin: var(--size-m) var(--size-xs);
      }
      .transliterationFormRow {
        display: flex;
        flex-direction: column;
        gap: var(--size-xs);
      }
      .transliterationFormInput {
        width: 100%;
        font-size: var(--font-size-l);
      }
    </style>
    <form class="transliterationForm">
      <label class="transliterationFormRow">
        <${LabelText} tag="div">Tagalog word<//>
        <${Input}
          class="transliterationFormInput"
          type="text"
          placeholder="kalabasa"
          onInput=${onInput}
        />
      </label>
      <label class="transliterationFormRow">
        <${LabelText} tag="div">Syllabication<//>
        <${Output} value=${syllabication} placeholder="ka · la · ba · sa" />
      </label>
      <label class="transliterationFormRow">
        <${LabelText} tag="div">Baybayin<//>
        <${Output} value=${baybayin} placeholder="ᜃᜎᜊᜐ" />
      </label>
    </form>
  `;
}

function Output({ value, placeholder }) {
  return html`
    <style id=${TransliterationForm.name + Output.name}>
      .transliterationFormOutput {
        font-size: var(--font-size-l);
        word-break: break-all;
      }
      .transliterationFormOutputPlaceholder {
        opacity: var(--opacity-placeholder);
      }
    </style>
    <div
      class=${classes(
        "transliterationFormOutput",
        !value && "transliterationFormOutputPlaceholder"
      )}
    >
      ${value || placeholder}
    </div>
  `;
}
