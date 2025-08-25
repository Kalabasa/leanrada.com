let dirHandle;
let fileHandle;
let source;
let controlPanel;
let trackMutations = false;

initControlPanel();

function initControlPanel() {
  controlPanel = document.createElement("div");
  controlPanel.style.position = "fixed";
  controlPanel.style.left = "12px";
  controlPanel.style.bottom = "12px";
  controlPanel.style.background = "#640";
  controlPanel.style.color = "#fff";
  controlPanel.style.padding = "12px";
  controlPanel.style.borderRadius = "6px";
  controlPanel.style.fontFamily = "system-ui";
  controlPanel.style.zIndex = "calc(1 * infinity)";
  controlPanel.innerHTML = `
    <button class="editBtn">Edit</button>
    <button class="saveBtn" disabled>Save</button>
    <span>${getFilePath()}</span>
  `;

  const editBtn = controlPanel.querySelector(".editBtn");
  const saveBtn = controlPanel.querySelector(".saveBtn");

  editBtn.addEventListener("click", async () => {
    editBtn.disabled = true;
    saveBtn.disabled = false;
    await readFile();
    initMutationObserver();
    initSelection();
  });

  saveBtn.addEventListener("click", () => {
    saveFile();
  });

  document.body.appendChild(controlPanel);
}

async function openDirectory() {
  dirHandle = await showDirectoryPicker({
    id: "editor",
    mode: "readwrite",
  });
}

async function readFile() {
  const fileHandle = await getFileHandle();
  const file = await fileHandle.getFile();
  source = await file.text();
  trackMutations = true;
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

    const childReplacements = new Set();
    const textReplacements = new Map();

    for (const mutation of mutations) {
      if (mutation.target.isConnected) {
        if (!document.activeElement.contains(mutation.target)) continue;
        if (controlPanel.contains(mutation.target)) continue;
      }

      switch (mutation.type) {
        case "childList":
          childReplacements.add({ target: mutation.target });
          break;
        case "characterData":
          // merge mutations for same target
          const target = mutation.target;
          const oldValue =
            textReplacements.get(target)?.oldValue ?? mutation.oldValue;
          textReplacements.set(target, { oldValue, target });
          break;
        case "attributes":
          if (mutation.attributeName === "contenteditable") continue;
        default:
          console.error(mutation);
          break;
      }
    }

    let result;
    try {
      for (const cr of childReplacements) {
        for (const [textTarget] of textReplacements.entries()) {
          if (cr.target.contains(textTarget)) {
            textReplacements.delete(textTarget);
          }
        }
        replaceChildren(cr);
      }

      for (const tr of textReplacements.values()) {
        result = replaceText(tr);
        if (!result.ok) throw new Error("Edit failed");
      }
    } catch (e) {
      if (result && !result.ok) {
        let message = "Edit failed!";
        if (result.notFound) {
          message += " Element not in source.";
        }
        toast({ message, color: "darkred" });
      }
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
  document.addEventListener("mousedown", ({ target }) => {
    if (target === document.body) return;
    if (controlPanel.contains(target)) return;
    refreshFromSource(target, "inner");
  });

  document.addEventListener("click", ({ target }) => {
    if (target === document.body) return;
    if (controlPanel.contains(target)) return;
    target.contentEditable = true;
    target.focus();
    target.addEventListener(
      "blur",
      () => {
        target.contentEditable = false;
        refreshFromSource(target);
      },
      { once: true }
    );
  });
}

function refreshFromSource(element, scope = "outer") {
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
  element.style.top = "12px";
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

function replaceChildren({ target }) {
  // Find parent in source by path
  const parentPath = getPath(target);
  const parent = findSourceElementTag(source, parentPath);
  if (!parent) return { ok: false, notFound: true };

  const contextStartIndex = parent.innerStartIndex;
  const contextEndIndex = parent.innerEndIndex;
  const contextSource = source.slice(contextStartIndex, contextEndIndex);

  if (contextSource === target.innerHTML) return;

  const prefix = longestCommonPrefix(contextSource, target.innerHTML);
  const suffix = longestCommonSuffix(contextSource, target.innerHTML);
  const oldContent = contextSource.slice(
    prefix.length,
    contextSource.length - suffix.length
  );
  const newContent = target.innerHTML.slice(
    prefix.length,
    target.innerHTML.length - suffix.length
  );

  const result = tryContextualReplace(
    contextSource,
    prefix,
    suffix,
    oldContent,
    newContent
  );

  if (result.ok) {
    source =
      source.slice(0, contextStartIndex) +
      result.output +
      source.slice(contextEndIndex);
    console.groupCollapsed(
      source.slice(contextStartIndex - 50, contextEndIndex + 50)
    );
    console.log(source);
    console.groupEnd();
  }

  return result;
}

function getNodeSource(source, node) {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const sourceElement = findSourceElementTag(source, nextSibling);
    if (!sourceElement) throw new Error("Not found!");
    return source.slice(sourceElement.startIndex, sourceElement.endIndex);
  } else if (node.nodeType === Node.TEXT_NODE) {
    return node.data;
  } else {
    throw new Error("Unsupported node type: " + node.nodeType);
  }
}

function replaceText({ oldValue, target }) {
  console.log("applyTextMutation", { oldValue, target });
  // Find parent in source by path
  const parentPath = getPath(target.parentElement);
  const parent = findSourceElementTag(source, parentPath);
  if (!parent) return { ok: false, notFound: true };

  // Find specific text segment within parent
  const parentSource = source.slice(
    parent.innerStartIndex,
    parent.innerEndIndex
  );
  let textStartIndex = parent.innerStartIndex;
  let textEndIndex = parent.innerEndIndex;
  const previousElementSiblings = countPrevElementSiblings(target);
  for (const tag of walkSourceTags(parentSource)) {
    if (tag.level !== 1) continue;
    if (!tag.open && tag.childIndex === previousElementSiblings - 1) {
      textStartIndex = parent.innerStartIndex + tag.sourceEndIndex;
    }
    if (!tag.end && tag.childIndex === previousElementSiblings) {
      textEndIndex = parent.innerStartIndex + tag.sourceIndex;
    }
  }
  const textSource = source.slice(textStartIndex, textEndIndex);

  // Find matching surrounding text
  const suffix = longestCommonSuffix(oldValue, target.data);
  const prefix = longestCommonPrefix(oldValue, target.data).slice(
    0,
    Math.min(oldValue.length, target.data.length) - suffix.length
  );
  const oldContent = oldValue.slice(
    prefix.length,
    oldValue.length - suffix.length
  );
  const newContent = target.data.slice(
    prefix.length,
    target.data.length - suffix.length
  );

  const result = tryContextualReplace(
    textSource,
    prefix,
    suffix,
    oldContent,
    newContent
  );

  if (result.ok) {
    source =
      source.slice(0, textStartIndex) +
      result.output +
      source.slice(textEndIndex);
    console.groupCollapsed(
      source.slice(textStartIndex - 50, textEndIndex + 50)
    );
    console.log(source);
    console.groupEnd();
  }

  return result;
}

function tryContextualReplace(
  textSource,
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
    textSource,
  });

  const preIndices = prefix ? [...allIndexOf(prefix, textSource)] : [0];
  const sufIndices = suffix
    ? [...allIndexOf(suffix, textSource)]
    : [textSource.length];

  if (preIndices.length === 1 || sufIndices.length === 1) {
    const spliceStart =
      preIndices.length === 1
        ? preIndices[0] + prefix.length
        : sufIndices[0] - oldContent.length;
    const spliceEnd =
      sufIndices.length === 1
        ? sufIndices[0]
        : preIndices[0] + prefix.length + oldContent.length;
    if (oldContent === textSource.slice(spliceStart, spliceEnd)) {
      return {
        ok: true,
        output:
          textSource.slice(0, spliceStart) +
          newContent +
          textSource.slice(spliceEnd),
      };
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
          textSource,
          shorterPrefix,
          shorterSuffix,
          oldContent,
          newContent,
          { ...state, depth: state.depth + 1 }
        );
        if (shorterContext.ok) return shorterContext;
      }
    }

    for (const entityMatch of textSource.matchAll(/&(\w+);/g)) {
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
          textSource,
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
          textSource,
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

  console.error({ textSource, prefix, suffix, oldContent, newContent });

  return {
    ok: false,
    notFound: preIndices.length === 0 && sufIndices.length === 0,
    prefixAmbiguous: preIndices.length > 1,
    suffixAmbiguous: sufIndices.length > 1,
  };
}

function getPath(element) {
  const path = [];
  while (
    element?.parentElement &&
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

    if (end || implicitEnd) {
      let popped;
      do {
        popped = currentPath.pop();
      } while (
        !(isVoid || (popped.parentTag.open && popped.parentTag.name === name))
      );
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

function countPrevElementSiblings(element) {
  let previousElementSiblings = 0;
  for (
    let s = element;
    s.previousElementSibling;
    s = s.previousElementSibling
  ) {
    previousElementSiblings++;
  }
  return previousElementSiblings;
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
