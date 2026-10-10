import { html } from "../components/html.js";
import { Button, Input } from "../components/form.js";
import { observable, reaction, runInAction } from "../lib/mobx.js";
import { LabelText } from "../typography/text.js";
import { classes } from "../util/classes.js";
import { debounce } from "../util/debounce.js";
import { observer } from "../util/observer.js";
import { Tooltip } from "../components/tooltip.js";
import { useState } from "../lib/htm-preact.js";
import { InvalidLetterError } from "./invalid-letter-error.js";
import { InvalidSyllabicationError } from "./invalid-syllabication-error.js";

const memo = Symbol("memo");

export function createTransliterationForm(
  viramaStyle,
  separateRa,
  precolonial,
) {
  const initialText = new URLSearchParams(location.search).get("word") ?? "";
  const inputText = observable.box(initialText);
  const baybayinUnits = observable.box([]);
  const transformed = observable.box(undefined);
  const prettify = observable.box(false);
  const syllabicateError = observable.box(undefined);
  const inputTextWrapperRef = { current: null };

  const debouncedRemovePrettify = debounce(() => {
    prettify.set(false);
  }, 400);

  reaction(
    () => [inputText.get(), separateRa.get(), precolonial.get()],
    async ([inputText, separateRa, precolonial]) => {
      const { syllabicate } = await import("./syllabicate.js");
      let output;
      try {
        output = syllabicate(inputText, { separateRa, precolonial });
      } catch (error) {
        const isInputError =
          error instanceof InvalidLetterError ||
          error instanceof InvalidSyllabicationError;
        if (!isInputError) {
          throw error;
        }
        syllabicateError.set(error);
        return;
      }
      syllabicateError.set(undefined);
      baybayinUnits.set(output.baybayinUnits);
      transformed.set(output.transformed);
      prettify.set(true);
      debouncedRemovePrettify();
    },
    { delay: 100, fireImmediately: initialText !== "" },
  );

  // reaction(
  //   () => inputText.get(),
  //   (inputText) => {
  //     const url = new URL(location.href);
  //     url.searchParams.set("word", inputText);
  //     history.replaceState(history.state, "", url);
  //   },
  // );

  const TransliterationFormImpl = observer(() => {
    const onInput = (event) => {
      runInAction(() => {
        inputText.set(event.currentTarget.value);
      });
    };

    const unicodeFilter = prettify.get()
      ? prettifyTempBaybayin
      : (value) => value;

    const syllabication = formatSyllabication(baybayinUnits.get());

    return html`
      <${TransliterationForm}
        inputText=${inputText.get()}
        inputTextWrapperRef=${inputTextWrapperRef}
        syllabication=${syllabication}
        transformed=${transformed.get()}
        baybayin=${lazyConvertToUnicode(
          unicodeFilter(baybayinUnits.get()),
          viramaStyle.get(),
        )}
        error=${syllabicateError.get()}
        onInput=${onInput}
      />
    `;
  });

  return {
    TransliterationForm: TransliterationFormImpl,
    inputText,
    inputTextWrapperRef,
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

function lazyConvertToUnicode(baybayinUnits, viramaStyle) {
  if (baybayinUnits.length === 0) return "";

  if (!lazyConvertToUnicode[memo]) {
    import("./unicode.mjs").then((imported) => {
      lazyConvertToUnicode[memo] = imported.convertToUnicode;
    });
  }

  return lazyConvertToUnicode[memo]?.(baybayinUnits, viramaStyle) ?? "";
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
  inputTextWrapperRef,
  syllabication,
  transformed,
  baybayin,
  error,
  onInput,
}) {
  const [isSyllabicationHintOn, setSyllabicationHintOn] = useState(false);
  const [hasFocused, setHasFocused] = useState(false);

  const helpLink = "./help/#" + encodeURIComponent(inputText);

  let tooltipContent = null;
  if (error && error instanceof InvalidLetterError) {
    tooltipContent = html`<p>
        Um, for the letter ${error.formatLetters()}, we have to write it the
        Baybayin way.
      </p>
      <p>
        <a class="transliterationTooltipLink" href=${helpLink}
          >Check this quick guide!</a
        >
      </p>`;
  } else if (error && error instanceof InvalidSyllabicationError) {
    tooltipContent = html`<p>
        So... we can’t really spell just ‘${error.word}’ in the precolonial way.
        Needs a vowel!
      </p>
      <p>
        <a class="transliterationTooltipLink" href=${helpLink}
          >Check this quick guide!</a
        >
      </p>`;
  } else if (inputText && !hasFocused) {
    tooltipContent = html`<p>You can edit this!</p>`;
  }

  return html`
    <style id=${TransliterationForm.name}>
      .transliterationForm {
        display: flex;
        flex-direction: column;
        gap: var(--size-m);
      }
      .transliterationRow {
        display: flex;
        flex-direction: column;
        gap: var(--size-xs);
        min-height: calc(var(--size-l) * 1.5);
      }
      .transliterationRowWithButton {
        display: flex;
        align-items: center;
        gap: var(--size-s);

        .transliterationRow {
          flex: 1;
        }
      }
      .transliterationSyllabicationButton {
        anchor-name: --transliterationSyllabicationButton;
        border-radius: 50%;
        aspect-ratio: 1;
        display: grid;
        place-content: center;
      }
      .transliterationInput {
        anchor-name: --transliterationInput;
        width: 100%;
        font-size: var(--font-size-l);
      }

      .transliterationTooltip {
        display: block;
        max-width: 300px;
        color: var(--color-green);
        font-size: var(--font-size-m);
        font-weight: bold;
        * + p {
          margin-top: var(--size-xs);
        }
      }
      .transliterationInputTooltip {
        animation: transliterationTooltipEnter 0.2s 1s both;
      }
      .transliterationTooltipError {
        color: var(--color-orange);
      }
      .transliterationTransformedIntro {
        margin-bottom: var(--size-s);
      }
      .transliterationTransformedWord {
        margin-bottom: var(--size-m);
      }
      .transliterationTransformedWordTitle {
        margin-bottom: var(--size-xs);
        color: #fff;
      }
      .transliterationTransforms {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: baseline;
        gap: var(--size-xs) var(--size-s);
        margin: 0;
        padding: 0;
        list-style: none;

        li {
          display: contents;
        }
      }
      .transliterationTransformPair {
        white-space: nowrap;
      }
      .transliterationTransformFrom {
        color: var(--color-orange);
      }
      .transliterationTransformReason {
        color: #fff;
        font-size: var(--font-size-s);
        font-weight: normal;
        opacity: var(--opacity-secondary);
      }
      .transliterationTooltipLink {
        color: var(--color-green);
        text-decoration: underline;
        cursor: pointer;
      }
      @keyframes transliterationTooltipEnter {
        from {
          opacity: 0;
          translate: 0 20px;
        }
      }
    </style>
    <form class="transliterationForm" action="javascript:false">
      <label class="transliterationRow">
        <${LabelText} tag="div">Tagalog word<//>
        <div ref=${inputTextWrapperRef}>
          <${Input}
            class="transliterationInput"
            type="text"
            placeholder="kalabasa"
            maxlength="30"
            value=${inputText}
            onInput=${onInput}
            onFocus=${() => setHasFocused(true)}
          />
        </div>
      </label>
      <div class="transliterationRowWithButton">
        <label class="transliterationRow">
          <${LabelText} tag="div">Syllabication<//>
          <${Output} value=${syllabication} placeholder="ka · la · ba · sa" />
        </label>
        ${transformed &&
        html`<${Button}
          class="transliterationSyllabicationButton"
          type="button"
          aria-label="Why is the spelling different?"
          onClick=${() => setSyllabicationHintOn(!isSyllabicationHintOn)}
        >
          ?
        <//>`}
      </div>
      <label class="transliterationRow">
        <${LabelText} tag="div">Baybayin<//>
        <${Output} value=${baybayin} placeholder="ᜃᜎᜊᜐ" big />
      </label>
    </form>
    ${tooltipContent &&
    html`<${Tooltip}
      class=${classes(
        "transliterationTooltip",
        "transliterationInputTooltip",
        error && "transliterationTooltipError",
      )}
      anchorName="--transliterationInput"
      direction="top"
    >
      ${tooltipContent}
    <//>`}
    ${transformed &&
    isSyllabicationHintOn &&
    html`<${Tooltip}
      class="transliterationTooltip"
      anchorName="--transliterationSyllabicationButton"
      direction="top"
    >
      <p class="transliterationTransformedIntro">
        Some of your text have automatically been respelled for Baybayin.
      </p>
      ${transformed.map(
        ({ fromWord, toWord, transforms }) => html`
          <div class="transliterationTransformedWord">
            <div class="transliterationTransformedWordTitle">
              ${fromWord} ⟶ ${toWord}
            </div>
            <ul class="transliterationTransforms">
              ${dedupeTransforms(transforms).map(
                (transform) => html`
                  <li>
                    <span class="transliterationTransformPair">
                      <span class="transliterationTransformFrom"
                        >${transform.from} ⟶ ${!transform.to && "—"}</span
                      >${transform.to && " " + transform.to}
                    </span>
                    <span class="transliterationTransformReason">
                      ${explainTransform(transform)}
                    </span>
                  </li>
                `,
              )}
            </ul>
          </div>
        `,
      )}
      <a class="transliterationTooltipLink" href=${helpLink}
        >Learn more in this quick guide!</a
      >
    <//>`}
  `;
}

function dedupeTransforms(transforms) {
  const result = [];

  for (const transform of transforms) {
    if (
      result.every((other) => {
        if (
          other.type === transform.type &&
          other.from === transform.from &&
          other.to === transform.to
        ) {
          return false;
        }
        if (
          transform.type === "vowel" &&
          other.type === transform.type &&
          other.from.at(-1) === other.from.at(-1)
        ) {
          return false;
        }
        if (transform.type === "ra" && other.type === transform.type) {
          return false;
        }
        return true;
      })
    ) {
      result.push(transform);
    }
  }

  return result;
}

function explainTransform({ type, from }) {
  switch (type) {
    case "vowel":
      if (from.endsWith("e")) {
        return "E and I are interchangeable";
      }
      return "O and U are interchangeable";
    case "ra":
      return "D and R are interchangeable";
    case "repetition":
      return "double letters have the same sound";
    case "special":
      return "is how it’s pronounced";
    case "drop":
      return "precolonial spelling omits syllable ending consonants";
    case "cluster":
      return "precolonial spelling has to break up consonant clusters";
  }
}

function Output({ value, placeholder, big }) {
  return html`
    <style id=${TransliterationForm.name + Output.name}>
      .transliterationOutput {
        font-size: var(--font-size-l);
        word-break: break-all;
      }
      .transliterationOutputPlaceholder {
        opacity: var(--opacity-placeholder);
      }
      .transliterationOutputBig {
        font-size: var(--font-size-xl);
      }
    </style>
    <div
      class=${classes(
        "transliterationOutput",
        !value && "transliterationOutputPlaceholder",
        big && "transliterationOutputBig",
      )}
    >
      ${value || placeholder}
    </div>
  `;
}
