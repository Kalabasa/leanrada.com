let dirHandle;
let fileHandle;
let source;
let controlPanel;
let locked = false;
let trackMutations = false;

readFileFromNetwork().then(() => {
  maybeInitEdit();
});
initControlPanel();

function initControlPanel() {
  controlPanel = document.createElement("div");
  controlPanel.id = "controlPanel";
  controlPanel.innerHTML = html`
    <button class="saveBtn">💾</button>
    <button class="lockBtn">🔓</button>
    <span>${getFilePath()}</span>
    <style>
      #controlPanel {
        display: flex;
        position: fixed;
        left: 12px;
        bottom: 12px;
        background: #354;
        color: #fff;
        border-radius: 6px;
        overflow: hidden;
        font-family: system-ui;
        z-index: calc(1 * infinity);
        button {
          background: transparent;
          border: none;
          border-right: 2px #9994 groove;
          padding: 12px;
          cursor: pointer;
          text-shadow: 1px 0 #fff, -1px 0 #fff, 0 1px #fff, 0 -1px #fff,
            1px 1px #fff, -1px 1px #fff, 1px -1px #fff, -1px -1px #fff;
          &:hover {
            background: #fff2;
          }
        }
        span {
          padding: 12px;
        }
      }
      *:hover:not(:has(:hover), :focus) {
        outline: 1px #afd dotted;
        &#controlPanel,
        #controlPanel &,
        .editLocked & {
          outline: none;
        }
      }
      [contenteditable]:focus {
        outline: 1px #0f9 dotted;
      }
    </style>
  `;

  const [saveBtn, lockBtn, filePathSpan] = controlPanel.children;

  saveBtn.addEventListener("click", () => {
    toast({
      message: "Select the site root",
      color: "#090",
    });
    setTimeout(() => {
      saveFile();
    }, 200);
  });

  lockBtn.addEventListener("click", () => {
    locked = !locked;
    trackMutations = !locked;
    lockBtn.textContent = locked ? "🔒" : "🔓";
    document.documentElement.classList.toggle("editLocked", locked);
    toast({
      message: locked ? "Locked from editing" : "Editing",
      color: locked ? "#960" : "#090",
    });
  });

  document.body.appendChild(controlPanel);
}

function maybeInitEdit() {
  if (maybeInitEdit.hasRun) return;
  maybeInitEdit.hasRun = true;
  initMutationObserver();
  initSelection();
  trackMutations = true;
}

async function openDirectory() {
  dirHandle = await showDirectoryPicker({
    id: "editor",
    mode: "readwrite",
  });
}

async function readFileFromNetwork() {
  if (source) return;
  const res = await fetch(".");
  source = await res.text();
}

async function saveFile() {
  const fileHandle = await getFileHandle();
  const writable = await fileHandle.createWritable();
  await writable.write(source);
  await writable.close();
}

async function getFileHandle() {
  if (!dirHandle) await openDirectory();
  const pathSegs = getFilePath().split("/");
  let subDirHandle = dirHandle;
  for (const subDir of pathSegs.slice(0, -1)) {
    subDirHandle = await subDirHandle.getDirectoryHandle(subDir);
  }
  return await subDirHandle.getFileHandle(pathSegs.at(-1));
}

function getFilePath() {
  return window.location.pathname
    .replace(/^\//, "")
    .replace(/(?<!.html)\/?$/, "/index.html");
}

function initMutationObserver() {
  if (!source) throw new Error("No source");

  const observer = new MutationObserver((mutations) => {
    if (
      !trackMutations ||
      document.activeElement === document.body ||
      document.activeElement === document.documentElement
    ) {
      return;
    }
    console.log(mutations);

    const childReplacements = new Map();
    const textReplacements = new Map();

    nextMutation: for (const mutation of mutations) {
      if (!mutation.target.isConnected) continue;
      if (!document.activeElement.contains(mutation.target)) continue;
      if (controlPanel.contains(mutation.target)) continue;

      switch (mutation.type) {
        case "childList":
          {
            const { target, addedNodes, previousSibling, nextSibling } =
              mutation;

            if (previousSibling && !target.contains(previousSibling)) continue;
            if (nextSibling && !target.contains(nextSibling)) continue;
            for (const node of addedNodes) {
              if (!target.contains(node)) continue nextMutation;
            }

            const entry = childReplacements.get(target);
            if (entry) {
              const childNodes = Array.from(target.childNodes);
              entry.previousSibling =
                previousSibling &&
                entry.previousSibling &&
                (childNodes.indexOf(previousSibling) <
                childNodes.indexOf(entry.previousSibling)
                  ? previousSibling
                  : entry.previousSibling);
              entry.nextSibling =
                nextSibling &&
                entry.nextSibling &&
                (childNodes.indexOf(nextSibling) >
                childNodes.indexOf(entry.nextSibling)
                  ? nextSibling
                  : entry.nextSibling);
            } else {
              childReplacements.set(target, {
                target,
                previousSibling,
                nextSibling,
              });
            }
          }
          break;
        case "characterData":
          {
            const { target } = mutation;
            const oldValue =
              textReplacements.get(target)?.oldValue ?? mutation.oldValue;
            textReplacements.set(target, { oldValue, target });
          }
          break;
        case "attributes":
          if (mutation.attributeName === "contenteditable") continue;
        default:
          console.error(mutation);
          break;
      }
    }

    for (const replacements of [textReplacements, childReplacements]) {
      for (const r of replacements.values()) {
        for (
          let node = r.target.parentElement;
          node != null;
          node = node.parentElement
        ) {
          if (childReplacements.has(node)) {
            replacements.delete(r.target);
            break;
          }
        }
      }
    }

    try {
      for (const cr of childReplacements.values()) {
        applyChange({
          parent: cr.target,
          previousSibling: cr.previousSibling,
          nextSibling: cr.nextSibling,
        });
      }
      for (const tr of textReplacements.values()) {
        applyChange({
          parent: tr.target.parentElement,
          previousSibling: tr.target.previousSibling,
          nextSibling: tr.target.nextSibling,
          textNode: tr.target,
          oldTextValue: tr.oldValue,
        });
      }
    } catch (e) {
      console.error(e);
      let message = "Edit failed!";
      if (e instanceof SourceNotFoundError) {
        message += " Element not in source (dynamic element?)";
      }
      toast({ message, color: "darkred" });
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true,
  });
}

function initSelection() {
  let lastSelection = null;

  document.addEventListener("mousedown", ({ target }) => {
    if (locked) return;
    if (!isEditable(target)) return;
    if (lastSelection === target) return;

    if (lastSelection) {
      lastSelection.contentEditable = false;
      refreshFromSource(lastSelection);
    }
    lastSelection = null;

    refreshFromSource(target, "inner");
  });

  document.addEventListener("click", ({ target }) => {
    if (locked) return;
    if (!isEditable(target)) return;
    if (lastSelection === target) return;

    if (lastSelection) {
      lastSelection.contentEditable = false;
      refreshFromSource(lastSelection);
    }
    lastSelection = target;

    target.contentEditable = true;
    target.focus();
  });
}

function isEditable(node) {
  return (
    document.body !== node &&
    document.body.contains(node) &&
    !controlPanel.contains(node)
  );
}

function refreshFromSource(element, scope = "outer") {
  if (!element.isConnected) return;

  trackMutations = false;

  const sourceElement = findSourceElementTag(source, getPath(element));
  if (sourceElement) {
    if (element.parentElement && scope === "outer") {
      const newHTML = source.slice(
        sourceElement.startIndex,
        sourceElement.endIndex
      );
      if (element.outerHTML !== newHTML) element.outerHTML = newHTML;
    } else if (!isVoidElement(element.tagName)) {
      const newHTML = source.slice(
        sourceElement.innerStartIndex,
        sourceElement.innerEndIndex
      );
      if (element.innerHTML !== newHTML) element.innerHTML = newHTML;
    }
  }

  setTimeout(() => {
    trackMutations = true;
  });
}

function toast({ message, color = "#000000", durationMs = 5000 }) {
  const element = document.createElement("div");
  element.textContent = message;
  element.style.position = "fixed";
  element.style.bottom = "calc(12px * 4 + 1lh)";
  element.style.left = "12px";
  element.style.background = color;
  element.style.color = "#fff";
  element.style.padding = "12px";
  element.style.borderRadius = "6px";
  element.style.zIndex = "calc(1 * infinity)";
  element.style.opacity = "0";
  element.style.transition = "opacity 0.3s ease";
  controlPanel.appendChild(element);
  requestAnimationFrame(() => (element.style.opacity = "1"));
  setTimeout(() => {
    element.style.opacity = "0";
    element.addEventListener("transitionend", () => element.remove(), {
      once: true,
    });
  }, durationMs);
}

function applyChange({
  parent,
  previousSibling,
  nextSibling,
  textNode,
  oldTextValue,
}) {
  // Find parent in source by path
  const parentPath = getPath(parent);
  console.log("replaceChildren", {
    parent,
    previousSibling,
    nextSibling,
    parentPath,
  });
  const parentTag = findSourceElementTag(source, parentPath);
  if (!parentTag) throw new SourceNotFoundError();

  const parentSource = source.slice(
    parentTag.innerStartIndex,
    parentTag.innerEndIndex
  );

  // Find edited content and surrounding context from DOM
  const prevElement = find(
    previousSibling,
    (n) => n.previousSibling,
    (n) => n.nodeType === Node.ELEMENT_NODE
  );
  const nextElement = find(
    nextSibling,
    (n) => n.nextSibling,
    (n) => n.nodeType === Node.ELEMENT_NODE
  );

  let content = ""; // edited content
  let elementsBefore = 0; // number of elements before edited content
  let elementsAfter = 0; // number of elements after edited content
  let region = prevElement ? "before" : "content";
  for (const child of parent.childNodes) {
    if (child === nextElement) region = "after";
    switch (region) {
      case "after":
        if (child.nodeType === Node.ELEMENT_NODE) elementsAfter++;
        break;
      case "content":
        if (child.nodeType === Node.ELEMENT_NODE) {
          content += child.outerHTML;
        } else if (child.nodeType === Node.TEXT_NODE) {
          content += textToHTML(child.data);
        }
        break;
      case "before":
        if (child.nodeType === Node.ELEMENT_NODE) elementsBefore++;
        break;
    }
    if (child === prevElement) region = "content";
  }

  // Find edited content and surrounding context from source
  const sourceElementCount =
    ([...walkSourceTags(parentSource)].filter((tag) => tag.level === 0).at(-1)
      ?.childIndex ?? -1) + 1;
  let sourceEditStart = 0;
  let sourceEditEnd = parentSource.length;
  for (const tag of walkSourceTags(parentSource)) {
    if (tag.level > 0) continue;
    if (!tag.open && tag.childIndex === elementsBefore - 1) {
      sourceEditStart = tag.sourceEndIndex;
    }
    if (!tag.end && sourceElementCount - tag.childIndex === elementsAfter) {
      sourceEditEnd = tag.sourceIndex;
    }
  }

  let oldContent = parentSource.slice(sourceEditStart, sourceEditEnd);
  if (oldContent === content) return;

  const commonPrefix = longestCommonPrefix(oldContent, content);
  const commonSuffix = longestCommonSuffix(oldContent, content);

  content = content.slice(
    commonPrefix.length,
    content.length - commonSuffix.length
  );

  oldContent = oldContent.slice(
    commonPrefix.length,
    oldContent.length - commonSuffix.length
  );

  const prefix = parentSource.slice(0, sourceEditStart) + commonPrefix;
  const suffix = commonSuffix + parentSource.slice(sourceEditEnd);

  const result = tryContextualReplace(
    parentSource,
    prefix,
    suffix,
    oldContent,
    content
  );

  source =
    source.slice(0, parentTag.innerStartIndex) +
    result +
    source.slice(parentTag.innerEndIndex);

  console.groupCollapsed(
    source.slice(
      parentTag.innerStartIndex + sourceEditStart - 20,
      parentTag.innerStartIndex +
        sourceEditEnd +
        content.length -
        oldContent.length +
        20
    )
  );
  console.log(source);
  console.groupEnd();
}

function find(object, next, predicate) {
  if (object && predicate(object)) return object;
  return object && find(next(object), next, predicate);
}

function longestCommonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.slice(0, i);
}

function longestCommonSuffix(a, b) {
  let i = 0;
  while (
    i < a.length &&
    i < b.length &&
    a[a.length - 1 - i] === b[b.length - 1 - i]
  ) {
    i++;
  }
  return a.slice(a.length - i);
}

function tryContextualReplace(
  source,
  prefix,
  suffix,
  oldContent,
  newContent,
  state = { lateral: false, depth: 0 }
) {
  console.log({
    prefix,
    suffix,
    oldContent,
    newContent,
    source,
  });

  const preIndices = prefix ? [...allIndexOf(prefix, source)] : [0];
  const sufIndices = suffix ? [...allIndexOf(suffix, source)] : [source.length];

  if (preIndices.length === 1 || sufIndices.length === 1) {
    const spliceStart =
      preIndices.length === 1
        ? preIndices[0] + prefix.length
        : sufIndices[0] - oldContent.length;
    const spliceEnd =
      sufIndices.length === 1
        ? sufIndices[0]
        : preIndices[0] + prefix.length + oldContent.length;
    if (oldContent === source.slice(spliceStart, spliceEnd)) {
      return (
        source.slice(0, spliceStart) + newContent + source.slice(spliceEnd)
      );
    }
  }

  // Try refining context in different ways
  if (state.depth < 100) {
    if (!state.lateral) {
      if (
        (preIndices.length === 0 && prefix.length >= 2) ||
        (sufIndices.length === 0 && suffix.length >= 2)
      ) {
        const shorterPrefix =
          preIndices.length === 0
            ? prefix.slice(Math.ceil(prefix.length * 0.5))
            : prefix;
        const shorterSuffix =
          sufIndices.length === 0
            ? suffix.slice(0, Math.floor(suffix.length * 0.5))
            : suffix;
        const shorterContext = tryContextualReplace(
          source,
          shorterPrefix,
          shorterSuffix,
          oldContent,
          newContent,
          { ...state, depth: state.depth + 1 }
        );
        if (shorterContext.ok) return shorterContext;
      }
    }

    for (const entityMatch of source.matchAll(/&(\w+);/g)) {
      const entityName = entityMatch[1];
      const entityText = decodeHTMLEntity(entityName);
      const encodedPrefix = prefix.replaceAll(
        entityText,
        "&" + entityName + ";"
      );
      const encodedSuffix = suffix.replaceAll(
        entityText,
        "&" + entityName + ";"
      );
      if (prefix !== encodedPrefix || suffix !== encodedSuffix) {
        const encodedContext = tryContextualReplace(
          source,
          encodedPrefix,
          encodedSuffix,
          oldContent,
          newContent,
          { ...state, depth: state.depth + 1, lateral: true }
        );
        if (encodedContext.ok) return encodedContext;
      }
    }

    if (state.depth === 0) {
      const normalizedPrefix = textToHTML(prefix);
      const normalizedSuffix = textToHTML(suffix);
      if (prefix !== normalizedPrefix || suffix !== normalizedSuffix) {
        const normalizedContext = tryContextualReplace(
          source,
          normalizedPrefix,
          normalizedSuffix,
          oldContent,
          newContent,
          { ...state, depth: state.depth + 1, lateral: true }
        );
        if (normalizedContext.ok) return normalizedContext;
      }
    }
  }

  console.error({ source, prefix, suffix, oldContent, newContent });

  if (preIndices.length === 0 && sufIndices.length === 0) {
    throw new ContextNotFoundError();
  } else {
    throw new AmbiguousContextError();
  }
}

function getPath(element, root = null) {
  if (!element.isConnected) {
    throw new Error("Cannot get path for disconnected element.");
  }

  const path = [];
  while (
    element &&
    element != root &&
    element.tagName !== "HEAD" &&
    element.tagName !== "BODY"
  ) {
    path.unshift({
      tagName: element.tagName,
      childIndex:
        element.parentElement.tagName !== "HEAD" &&
        element.parentElement.tagName !== "BODY"
          ? Array.from(element.parentElement.children).indexOf(element)
          : null,
    });
    element = element.parentElement;
  }
  return path;
}

function findSourceElementTag(source, path) {
  let startTag = null;
  let endTag = null;
  let innerEndIndex = null;
  let endIndex = null;
  for (const tag of walkSourceTags(source)) {
    if (startTag == null) {
      if (tag.open && tag.ancestors.length + 1 >= path.length) {
        let pathMatches = true;

        for (let i = 0; i < path.length; i++) {
          const pathStep = path.at(-i - 1);
          const sourceTag = i === 0 ? tag : tag.ancestors.at(-i);

          const pathStepMatches =
            sourceTag.name === pathStep.tagName &&
            (pathStep.childIndex == null ||
              sourceTag.childIndex === pathStep.childIndex);
          if (!pathStepMatches) {
            pathMatches = false;
            break;
          }
        }

        if (pathMatches) {
          startTag = tag;
          if (tag.void) {
            endIndex = startTag.sourceEndIndex;
            break;
          }
        }
      }
    } else if (tag.level <= startTag.level) {
      endTag = tag.end ? tag : null;
      endIndex = tag.end ? tag.sourceEndIndex : tag.sourceIndex;
      const endIndent = source
        .slice(startTag.sourceEndIndex, tag.sourceIndex)
        .match(/\n\s*$/);
      innerEndIndex = tag.sourceIndex - (endIndent ? endIndent[0].length : 0);
      break;
    }
  }

  if (!startTag || endIndex == null) {
    return null;
  }

  return {
    startTag,
    endTag,
    startIndex: startTag.sourceIndex,
    endIndex,
    innerStartIndex: startTag.void ? null : startTag.sourceEndIndex,
    innerEndIndex,
  };
}

function* walkSourceTags(source) {
  const currentPath = [{ parentTag: null, index: 0 }];
  for (const match of source.matchAll(/<(\/)?([a-z0-9\-]+)/gi)) {
    const name = match.at(-1).toUpperCase();
    const isVoid = isVoidElement(name);
    const end = match[1] === "/";
    const open = !isVoid && !end;
    if (isVoid && end) continue; // invalid tag

    const parentName = currentPath.at(-1).parentTag?.name;
    const implicitEnd = open && implicitTagEndings[parentName]?.includes(name);

    if (end) {
      const lastOpen = currentPath.findLastIndex(
        (s) => s.parentTag?.name === name
      );
      if (lastOpen >= 0) {
        currentPath.length = lastOpen;
      }
    } else if (implicitEnd) {
      currentPath.pop();
    }

    if (!end) currentPath.at(-1).index++;

    const tag = {
      level: currentPath.length - 1,
      childIndex: currentPath.at(-1).index - 1,
      ancestors: currentPath.slice(1).map((i) => i.parentTag),
      sourceIndex: match.index,
      sourceEndIndex: source.indexOf(">", match.index) + 1,
      name,
      open,
      void: isVoid,
      end,
    };
    yield tag;

    if (open) currentPath.push({ parentTag: tag, index: 0 });
  }
}

function isVoidElement(tagName) {
  const key = "_" + tagName;
  if (isVoidElement[key] == null) {
    if (tagName.includes("-")) {
      // custom element
      isVoidElement[key] = false;
    } else {
      try {
        const element = document.createElement(tagName);
        isVoidElement[key] = !element.outerHTML.includes("</");
      } catch (e) {
        isVoidElement[key] = false;
      }
    }
  }
  return isVoidElement[key];
}

// [key] element can be ended by an open [value] tag
const implicitTagEndings = {
  LI: ["LI"],
  DT: ["DT", "DD"],
  DD: ["DT", "DD"],
  P: [
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "DETAILS",
    "DIALOG",
    "DIV",
    "DL",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HGROUP",
    "HR",
    "MAIN",
    "MENU",
    "NAV",
    "OL",
    "P",
    "PRE",
    "SEARCH",
    "SECTION",
    "TABLE",
    "UL",
  ],
  THEAD: ["THEAD", "TBODY", "TFOOT"],
  TBODY: ["TBODY", "TFOOT"],
  TR: ["TR"],
  TD: ["TD", "TH"],
  TH: ["TD", "TH"],
};

function textToHTML(text) {
  textToHTML.stagingElement =
    textToHTML.stagingElement ?? document.createElement("div");
  textToHTML.stagingElement.innerText = text;
  return textToHTML.stagingElement.innerHTML;
}

function decodeHTMLEntity(name) {
  decodeHTMLEntity.stagingElement =
    decodeHTMLEntity.stagingElement ?? document.createElement("div");
  decodeHTMLEntity.stagingElement.innerHTML = "&" + name + ";";
  return decodeHTMLEntity.stagingElement.innerText;
}

function* allIndexOf(needle, haystack) {
  let position = -1;
  do {
    position = haystack.indexOf(needle, position + 1);
    if (position === -1) break;
    yield position;
  } while (position < haystack.length);
}

class SourceNotFoundError extends Error {}
class ContextNotFoundError extends Error {}
class AmbiguousContextError extends Error {}
