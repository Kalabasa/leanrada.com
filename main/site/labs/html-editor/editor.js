let source;
let fileHandle;
let frame;
let controlPanel;

if (location.search.match(/[?&]edit\b/)) {
  createControlPanel();
}

async function open() {
  try {
    [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: "HTML", accept: { "text/html": [".html"] } }],
    });
  } catch (e) {
    return;
  }
  const file = await fileHandle.getFile();
  source = await file.text();

  if (frame) frame.remove();
  frame = document.createElement("iframe");
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.style.border = "none";
  document.body.appendChild(frame);

  frame.contentDocument.open();
  frame.contentDocument.write(source);
  frame.contentDocument.close();

  frame.contentDocument.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver((mutations) => {
      if (
        frame.contentDocument.activeElement === frame.contentDocument.body ||
        frame.contentDocument.activeElement ===
          frame.contentDocument.documentElement
      ) {
        return;
      }

      const textMutations = new Map();

      for (const mutation of mutations) {
        if (!frame.contentDocument.activeElement.contains(mutation.target))
          continue;
        if (controlPanel.contains(mutation.target)) continue;
        switch (mutation.type) {
          case "characterData":
            // merge mutations for same target
            const target = mutation.target;
            const oldValue =
              textMutations.get(target)?.oldValue ?? mutation.oldValue;
            textMutations.set(target, { oldValue, target });
            break;
        }
      }

      for (const tm of textMutations.values()) {
        const result = applyTextMutation(tm);
        if (!result.ok) {
          toast({ message: "Edit failed!", color: "darkred" });
        }
      }
    });

    observer.observe(frame.contentDocument.documentElement, {
      // childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });

    frame.contentDocument.addEventListener("mousedown", ({ target }) => {
      if (target === frame.contentDocument.body) return;
      if (controlPanel.contains(target)) return;
      refreshFromSource(target, "inner");
    });
    frame.contentDocument.addEventListener("click", ({ target }) => {
      if (target === frame.contentDocument.body) return;
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
  });
}

function refreshFromSource(element, scope = "outer") {
  const sourceElement = findSourceElementTag(source, getPath(element));
  if (sourceElement?.endTag) {
    if (scope === "inner") {
      const newHTML = source.slice(
        source.indexOf(">", sourceElement.startTag.sourceIndex) + 1,
        sourceElement.endTag.sourceIndex
      );
      if (element.innerHTML !== newHTML) element.innerHTML = newHTML;
    } else {
      const newHTML = source.slice(
        sourceElement.startTag.sourceIndex,
        source.indexOf(">", sourceElement.endTag.sourceIndex) + 1
      );
      if (element.outerHTML !== newHTML) element.outerHTML = newHTML;
    }
  } else if (scope === "outer") {
    const newHTML = source.slice(
      sourceElement.startTag.sourceIndex,
      source.indexOf(">", sourceElement.startTag.sourceIndex) + 1
    );
    if (element.outerHTML !== newHTML) element.outerHTML = newHTML;
  }
}

async function save() {
  if (!fileHandle) return;
  let writable;
  try {
    writable = await fileHandle.createWritable();
  } catch (e) {
    return;
  }
  await writable.write(source);
  await writable.close();
}

function createControlPanel() {
  controlPanel = document.createElement("div");
  controlPanel.style.position = "fixed";
  controlPanel.style.left = "12px";
  controlPanel.style.bottom = "12px";
  controlPanel.style.background = "#222";
  controlPanel.style.color = "#fff";
  controlPanel.style.padding = "12px";
  controlPanel.style.borderRadius = "6px";
  controlPanel.style.zIndex = "calc(1 * infinity)";
  controlPanel.innerHTML = `
    <div>
      <button class="openBtn">Open</button>
      <button class="saveBtn">Save</button>
    </div>
  `;
  const openBtn = controlPanel.querySelector(".openBtn");
  const saveBtn = controlPanel.querySelector(".saveBtn");
  openBtn.addEventListener("click", () => {
    open();
  });
  saveBtn.addEventListener("click", () => {
    save();
  });
  document.body.appendChild(controlPanel);
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

function applyTextMutation({ oldValue, target }) {
  // Find parent in source by path
  const parentPath = getPath(target.parentElement);
  const parent = findSourceElementTag(source, parentPath);
  if (!parent) return { ok: false, notFound: true };

  // Find specific text segment within parent
  const parentSource = source.slice(
    parent.startTag.sourceIndex,
    parent.endTag.sourceIndex
  );
  let textStartIndex = parent.startTag.sourceIndex;
  let textEndIndex = parent.endTag.sourceIndex;
  const previousElementSiblings = countPrevElementSiblings(target);
  for (const tag of walkSourceTags(parentSource)) {
    if (tag.level !== 1) continue;
    if (!tag.open && tag.childIndex === previousElementSiblings - 1) {
      textStartIndex = parent.startTag.sourceIndex + tag.sourceIndex;
    }
    if (!tag.end && tag.childIndex === previousElementSiblings) {
      textEndIndex = parent.startTag.sourceIndex + tag.sourceIndex;
    }
  }
  let textSource = source.slice(textStartIndex, textEndIndex);
  console.log(textSource);
  console.log(oldValue);
  console.log(target.data);

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
  console.log(result);

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
    state,
    prefix,
    suffix,
    oldContent,
    newContent,
    textSource,
  });

  const preIndices = [...allIndexOf(prefix, textSource)];
  const sufIndices = [...allIndexOf(suffix, textSource)];

  if (preIndices.length === 1) {
    const [preIndex] = preIndices;
    return {
      ok: true,
      output:
        textSource.slice(0, preIndex + prefix.length) +
        newContent +
        textSource.slice(preIndex + prefix.length + oldContent.length),
    };
  }

  if (sufIndices.length === 1) {
    const [sufIndex] = sufIndices;
    return {
      ok: true,
      output:
        textSource.slice(0, sufIndex - oldContent.length) +
        newContent +
        textSource.slice(sufIndex),
    };
  }

  // Try refining context in different ways
  if (state.depth < 100) {
    if (!state.lateral) {
      if (
        (preIndices.length === 0 && prefix.length > 1) ||
        (sufIndices.length === 0 && suffix.length > 1)
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
          if (tag.void) return { startTag };
        }
      }
    } else {
      if (
        tag.end &&
        tag.name === startTag.name &&
        tag.level === startTag.level
      ) {
        return {
          startTag,
          endTag: tag,
        };
      }
    }
  }
}

function* walkSourceTags(source) {
  const childIndex = [-1];
  const ancestors = [];
  for (const match of source.matchAll(/<(\/)?([a-z0-9\-]+)/gi)) {
    const name = match.at(-1).toUpperCase();
    const isVoid = isVoidElement(name);
    const end = match[1] === "/";
    const open = !isVoid && !end;
    if (isVoid && end) continue; // invalid tag

    if (end) {
      childIndex.pop();
      ancestors.pop();
    }

    if (!end) childIndex[ancestors.length]++;

    const tag = {
      level: ancestors.length,
      childIndex: childIndex.at(-1),
      ancestors: [...ancestors],
      sourceIndex: match.index,
      name,
      open,
      void: isVoid,
      end,
    };
    yield tag;

    if (open) {
      childIndex.push(-1);
      ancestors.push(tag);
    }
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
