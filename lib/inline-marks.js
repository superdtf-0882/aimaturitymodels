// Inline marks for model text (OKF-TOGAF#203). The whole-model view printed a
// model's **bold** and *italic* marks as raw asterisks; this turns paired marks
// into structure the view renders as <strong> and <em> -- as React elements, so
// no HTML is ever injected from model text.
//
// parseMarks(text) -> an array of nodes: a string, { strong: nodes } or
// { em: nodes }. A mark opens only before a non-space and closes only after one,
// as Markdown's own rule has it, so "5 * 3" stays arithmetic; a mark that never
// closes stays the characters it is. stripMarks(text) gives the plain words, for
// places that take a string (screen-reader labels, page titles).
//
// Plain CommonJS so scripts/inline-marks-self-test.js loads it in plain Node.
"use strict";

const isSpace = (c) => c === undefined || /\s/.test(c);

// The index of the closing mark for `mark` opened before `from`, or -1.
function closing(s, from, mark) {
  for (let j = from; j <= s.length - mark.length; j++) {
    if (s.startsWith(mark, j) && !isSpace(s[j - 1]) && j > from) {
      // A single * must not be half of a **.
      if (mark === "*" && (s[j + 1] === "*" || s[j - 1] === "*")) continue;
      return j;
    }
  }
  return -1;
}

function parseMarks(text) {
  const s = text == null ? "" : String(text);
  const out = [];
  let plain = "";
  const push = (node) => { if (plain) { out.push(plain); plain = ""; } out.push(node); };
  for (let i = 0; i < s.length; ) {
    const mark = s.startsWith("**", i) ? "**" : s[i] === "*" ? "*" : null;
    if (mark && !isSpace(s[i + mark.length])) {
      const j = closing(s, i + mark.length, mark);
      if (j > 0) {
        push(mark === "**" ? { strong: parseMarks(s.slice(i + 2, j)) } : { em: parseMarks(s.slice(i + 1, j)) });
        i = j + mark.length;
        continue;
      }
    }
    plain += s[i];
    i++;
  }
  if (plain) out.push(plain);
  return out;
}

function stripMarks(text) {
  const flat = (nodes) => nodes.map((n) => (typeof n === "string" ? n : flat(n.strong || n.em))).join("");
  return flat(parseMarks(text));
}

module.exports = { parseMarks, stripMarks };
