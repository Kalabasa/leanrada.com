import { html } from "../components/html.js";
import { LabelText } from "../typography/text.js";

export function TransliterationForm() {
  return html`
    <style id=${TransliterationForm.name}>
      .transliterationFormRow {
        display: block;
        margin: var(--size-m) var(--size-s);
      }
    </style>
    <form>
      <label class="transliterationFormRow">
        <${LabelText} tagName="div">Tagalog word<//>
        <input type="text" placeholder="kalabasa" />
      </label>
      <label class="transliterationFormRow">
        <${LabelText} tagName="div">Syllabication<//>
        <div>ka-la-ba-sa</div>
      </label>
      <label class="transliterationFormRow">
        <${LabelText} tagName="div">Baybayin<//>
        <div>kalabasa</div>
      </label>
    </form>
  `;
}
