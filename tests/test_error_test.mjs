import assert from "node:assert/strict";

class FakeElement {
  constructor() {
    this.children = [];
    this.className = "";
    this.dataset = {};
    this.disabled = false;
    this.hidden = false;
    this.listeners = new Map();
    this.textContent = "";
    this.value = "";
    this.classList = { toggle() {} };
  }

  addEventListener(name, handler) {
    this.listeners.set(name, handler);
  }

  append(...children) {
    this.children.push(...children);
  }

  close() {}

  focus() {}

  replaceChildren(...children) {
    this.children = children;
  }

  showModal() {}
}

const nodes = new Map();
const getNode = (selector) => {
  if (!nodes.has(selector)) nodes.set(selector, new FakeElement());
  return nodes.get(selector);
};
const modeButtons = ["verb", "adjective", "all"].map((mode) => {
  const button = new FakeElement();
  button.dataset.mode = mode;
  return button;
});

globalThis.document = {
  createElement: () => new FakeElement(),
  querySelector: getNode,
  querySelectorAll: (selector) => (selector === ".mode-button" ? modeButtons : []),
};

const testWord = {
  id: "verb-1",
  kind: "verb",
  original: "食べる",
  kana: "たべる",
  meaning: "吃",
  answers: ["食べる", "たべる", "食べます", "たべます"],
  accent: null,
  verb_type: "二类（一段）",
  transitivity: "他动词",
  masu_form: "食べます",
  te_form: "食べて",
  lessons: [7],
  note: "他",
};

globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({
    words: [testWord],
    counts: { all: 1, verb: 1, adjective: 0 },
  }),
});

await import("../src/jappractice/web/app.js");
await new Promise((resolve) => setImmediate(resolve));

const startButton = getNode("#startButton");
const errorTestButton = getNode("#errorTestButton");
const errorCount = getNode("#errorCount");
const remainingCount = getNode("#remainingCount");
const totalCount = getNode("#totalCount");
const input = getNode("#answerInput");
const form = getNode("#answerForm");

assert.equal(errorTestButton.disabled, true, "没有错题时应禁用错题测试");

startButton.listeners.get("click")();
input.value = "错误答案";
form.listeners.get("submit")({ preventDefault() {} });

assert.equal(errorCount.textContent, 1, "首次答错后应记录一个错题");
assert.equal(errorTestButton.disabled, false, "有错题后应启用错题测试");

errorTestButton.listeners.get("click")();

assert.equal(errorCount.textContent, 0, "错题测试开始时错题计数应归零");
assert.equal(errorTestButton.disabled, true, "新一轮尚无错题时应重新禁用按钮");
assert.equal(remainingCount.textContent, 1, "剩余数应切换为错题数量");
assert.equal(totalCount.textContent, 1, "总数应切换为错题数量");
assert.equal(getNode("#correctCount").textContent, 0, "正确计数应归零");
assert.equal(getNode("#wrongCount").textContent, 0, "错误计数应归零");

console.log("error-test session behavior OK");
