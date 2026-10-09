import { html } from "../components/html.js";
import { Input } from "../components/form.js";
import { observable, reaction, runInAction } from "../lib/mobx.js";
import { LabelText } from "../typography/text.js";
import { classes } from "../util/classes.js";
import { debounce } from "../util/debounce.js";
import { observer } from "../util/observer.js";
import { Tooltip } from "../components/tooltip.js";
import { useState } from "../lib/htm-preact.js";
import { InvalidLetterError } from "./invalid-letter-error.js";

const memo = Symbol("memo");

export function createTransliterationForm() {
  const initialText = new URLSearchParams(location.search).get("word") ?? "";
  const inputText = observable.box(initialText);
  const baybayinUnits = observable.box([]);
  const prettify = observable.box(false);
  const highlight = observable.box(initialText === "");
  const syllabicateError = observable.box(undefined);

  const debouncedRemovePrettify = debounce(() => {
    prettify.set(false);
  }, 400);

  reaction(
    () => inputText.get(),
    async (inputText) => {
      const { syllabicate } = await import("./syllabicate.js");
      let output;
      try {
        output = syllabicate(inputText);
      } catch (error) {
        syllabicateError.set(error);
        return;
      }
      syllabicateError.set(undefined);
      baybayinUnits.set(output);
      prettify.set(true);
      debouncedRemovePrettify();
    },
    { delay: 100, fireImmediately: initialText !== "" },
  );

  reaction(
    () => inputText.get(),
    (inputText) => {
      const url = new URL(location.href);
      url.searchParams.set("word", inputText);
      history.replaceState(history.state, "", url);
    },
  );

  const TransliterationFormImpl = observer(() => {
    const onInput = (event) => {
      runInAction(() => {
        inputText.set(event.currentTarget.value);
        highlight.set(false);
      });
    };

    const unicodeFilter = prettify.get()
      ? prettifyTempBaybayin
      : (value) => value;

    const syllabication = formatSyllabication(baybayinUnits.get());

    return html`
      <${TransliterationForm}
        inputText=${inputText.get()}
        syllabication=${syllabication}
        baybayin=${lazyConvertToUnicode(unicodeFilter(baybayinUnits.get()))}
        highlight=${highlight.get()}
        error=${syllabicateError.get()}
        onInput=${onInput}
      />
    `;
  });

  return {
    TransliterationForm: TransliterationFormImpl,
    inputText,
    baybayinUnits,
  };
}

function formatSyllabication(baybayinUnits) {
  let syllabication = "";
  for (let i = 0; i < baybayinUnits.length; i++) {
    const unit = baybayinUnits[i];
    const previousUnit = baybayinUnits[i - 1];
    if (unit === " ") {
      syllabication += "\u2003";
    } else {
      if (i > 0) {
        if (unit !== " " && previousUnit !== " ") {
          syllabication += " · ";
        }
      }
      syllabication += unit;
    }
  }
  return syllabication;
}

function lazyConvertToUnicode(baybayinUnits) {
  if (baybayinUnits.length === 0) return "";

  if (!lazyConvertToUnicode[memo]) {
    import("./unicode.mjs").then((imported) => {
      lazyConvertToUnicode[memo] = imported.convertToUnicode;
    });
  }

  return lazyConvertToUnicode[memo]?.(baybayinUnits) ?? "";
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

export function TransliterationForm({
  inputText,
  syllabication,
  baybayin,
  highlight,
  error,
  onInput,
}) {
  const [isFocused, setIsFocused] = useState(false);

  let tooltipContent = null;
  if (error && error instanceof InvalidLetterError) {
    const helpLink = "./help/#" + encodeURIComponent(inputText);
    tooltipContent = [
      `One more step, let’s write ${error.formatLetters()} the Baybayin way. `,
      html`<a class="transliterationTooltipLink" href=${helpLink}>Guide</a>`,
    ];
  } else if (highlight && !inputText && !isFocused) {
    tooltipContent = "Type your word here!";
  }

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
      .transliterationInput {
        anchor-name: --transliterationInput;
        width: 100%;
        font-size: var(--font-size-l);
      }
      .transliterationInputHighlighted {
        /* fixme: css organisation */
        border-color: transparent !important;
        background-image:
          linear-gradient(var(--color-bg), var(--color-bg)),
          linear-gradient(
            to right,
            var(--color-orange),
            #000,
            var(--color-green)
          );
        background-origin: border-box;
        background-clip: padding-box, border-box;
      }
      .transliterationTooltip {
        color: var(--color-green);
        font-weight: bold;
      }
      .transliterationTooltipError {
        color: var(--color-orange);
      }
      .transliterationTooltipLink {
        text-decoration: underline;
        cursor: pointer;
      }
    </style>
    <form class="transliterationForm" action="javascript:false">
      <label class="transliterationFormRow">
        <${LabelText} tag="div">Tagalog word<//>
        <${Input}
          autofocus
          class=${classes(
            "transliterationInput",
            highlight && "transliterationInputHighlighted",
          )}
          type="text"
          placeholder="kalabasa"
          maxlength="30"
          value=${inputText}
          onPointerDown=${() => setIsFocused(true)}
          onKeyDown=${() => setIsFocused(true)}
          onBlur=${() => setIsFocused(false)}
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
    ${tooltipContent &&
    html`<${Tooltip} anchorName="--transliterationInput" direction="top">
      <span
        class="${classes(
          "transliterationTooltip",
          error && "transliterationTooltipError",
        )}"
        >${tooltipContent}</span
      >
    <//>`}
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
        !value && "transliterationFormOutputPlaceholder",
      )}
    >
      ${value || placeholder}
    </div>
  `;
}
