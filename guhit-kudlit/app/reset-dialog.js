import { html } from "../components/html.js";
import { Button } from "../components/form.js";

export function createResetDialog(reloadApp) {
  const resetDialogRef = { current: null };

  const openResetDialog = () => {
    resetDialogRef.current.showModal();
  };

  const ResetDialogImpl = () => html`
    <${ResetDialog} dialogRef=${resetDialogRef} onConfirm=${reloadApp} />
  `;

  return { ResetDialog: ResetDialogImpl, openResetDialog };
}

function ResetDialog({ dialogRef, onConfirm }) {
  return html`
    <style id=${ResetDialog.name}>
      .resetDialog {
        max-width: calc(100vw - 2 * var(--size-m));
        padding: var(--size-m);
        border: none;
        border-radius: var(--size-xs);
        background: var(--color-bg);
        color: var(--color-fg);
        box-shadow: var(--shadow-xl);
        &::backdrop {
          background: #0002;
        }
      }
      .resetDialogActions {
        display: flex;
        justify-content: end;
        gap: var(--size-s);
        margin-top: var(--size-m);
      }
    </style>
    <dialog class="resetDialog" ref=${dialogRef}>
      <p>Create a new canvas? Your current piece will be lost.</p>
      <div class="resetDialogActions">
        <${Button} type="button" onClick=${() => dialogRef.current.close()}>
          Cancel
        <//>
        <${Button} type="button" variant="danger" onClick=${onConfirm}>
          New canvas
        <//>
      </div>
    </dialog>
  `;
}
