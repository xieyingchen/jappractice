const state = {
  words: [],
  counts: {},
  mode: "all",
  current: null,
  answered: false,
  correct: 0,
  wrong: 0,
  queue: [],
  total: 0,
  remaining: 0,
  testing: false,
  finished: false,
  errors: [], // { word, answer }
};

const elements = {
  form: document.querySelector("#answerForm"),
  input: document.querySelector("#answerInput"),
  submit: document.querySelector("#submitButton"),
  meaning: document.querySelector("#meaning"),
  kindTag: document.querySelector("#kindTag"),
  promptLabel: document.querySelector("#promptLabel"),
  promptBlock: document.querySelector("#quizCard .prompt-block"),
  feedback: document.querySelector("#feedback"),
  resultBadge: document.querySelector("#resultBadge"),
  answerMain: document.querySelector("#answerMain"),
  answerKana: document.querySelector("#answerKana"),
  detailGrid: document.querySelector("#detailGrid"),
  wordCount: document.querySelector("#wordCount"),
  correctCount: document.querySelector("#correctCount"),
  wrongCount: document.querySelector("#wrongCount"),
  error: document.querySelector("#errorMessage"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
  startButton: document.querySelector("#startButton"),
  errorListButton: document.querySelector("#errorListButton"),
  errorCount: document.querySelector("#errorCount"),
  testProgress: document.querySelector("#testProgress"),
  remainingCount: document.querySelector("#remainingCount"),
  totalCount: document.querySelector("#totalCount"),
  summaryBlock: document.querySelector("#summaryBlock"),
  summaryTotal: document.querySelector("#summaryTotal"),
  summaryCorrect: document.querySelector("#summaryCorrect"),
  summaryWrong: document.querySelector("#summaryWrong"),
  summaryAccuracy: document.querySelector("#summaryAccuracy"),
  exportButton: document.querySelector("#exportButton"),
  errorDialog: document.querySelector("#errorDialog"),
  errorList: document.querySelector("#errorList"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
};

function normalizeAnswer(value) {
  return value.normalize("NFKC").replace(/\s+/g, "").trim().toLowerCase();
}

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function filteredWords() {
  return state.mode === "all"
    ? state.words
    : state.words.filter((word) => word.kind === state.mode);
}

function modeLabel(mode) {
  return { all: "全部", verb: "动词", adjective: "形容词" }[mode];
}

function updateModeSummary() {
  const count = state.mode === "all" ? state.counts.all : state.counts[state.mode];
  elements.wordCount.textContent = `${modeLabel(state.mode)} · ${count} 个不重复词条`;
}

function setModeButtonsDisabled(disabled) {
  for (const button of elements.modeButtons) {
    button.disabled = disabled;
  }
}

function updateStats() {
  elements.correctCount.textContent = state.correct;
  elements.wrongCount.textContent = state.wrong;
  elements.errorCount.textContent = state.errors.length;
}

function updateProgress() {
  elements.remainingCount.textContent = state.remaining;
  elements.totalCount.textContent = state.total;
}

function showIdle() {
  state.current = null;
  state.answered = false;
  elements.kindTag.textContent = "准备中";
  elements.promptLabel.textContent = "测试未开始";
  elements.meaning.textContent = "点击「开始测试」开始本次测试";
  elements.input.value = "";
  elements.input.disabled = true;
  elements.submit.disabled = true;
  elements.submit.textContent = "提交";
  elements.feedback.hidden = true;
  elements.testProgress.hidden = true;
}

function showPrompt(word) {
  state.current = word;
  state.answered = false;
  elements.meaning.textContent = word.meaning;
  elements.kindTag.textContent = word.kind === "verb" ? "动词" : word.adjective_type;
  elements.promptLabel.textContent =
    word.kind === "verb" ? "请输入辞书形或ます形" : "请输入对应的日文原型";
  elements.input.placeholder = word.kind === "verb" ? "如：食べる / 食べます" : "输入汉字或假名";
  elements.input.value = "";
  elements.input.disabled = false;
  elements.submit.disabled = false;
  elements.submit.textContent = "提交";
  elements.feedback.hidden = true;
  elements.input.focus();
}

function renderDetails(word, grid) {
  const addDetail = (label, value, extraClass = "") => {
    const wrapper = document.createElement("div");
    wrapper.className = `detail-item ${extraClass}`.trim();
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value || "—";
    wrapper.append(term, description);
    grid.append(wrapper);
  };

  addDetail("中文", word.meaning, "detail-wide");
  addDetail("音调", word.accent || "待核");
  if (word.kind === "verb") {
    addDetail("动词类型", word.verb_type);
    addDetail("自／他动词", word.transitivity);
    addDetail("ます形", word.masu_form);
    addDetail("て形", word.te_form);
  } else {
    addDetail("形容词类型", word.adjective_type);
    addDetail("连用形", word.conjunctive_form);
    addDetail("过去式", word.past_form);
  }
  addDetail("课次", word.lessons.join("、"));
  addDetail("备注", word.note, "detail-wide");
}

function startTest() {
  const pool = filteredWords();
  if (!pool.length) {
    elements.error.hidden = false;
    elements.error.textContent = "当前词类没有可用词条，无法开始测试。";
    return;
  }
  elements.error.hidden = true;

  state.testing = true;
  state.finished = false;
  state.correct = 0;
  state.wrong = 0;
  state.errors = [];
  state.queue = shuffle(pool);
  state.total = state.queue.length;
  state.remaining = state.total;

  updateStats();
  updateProgress();
  elements.testProgress.hidden = false;
  elements.summaryBlock.hidden = true;
  elements.promptBlock.hidden = false;
  elements.form.hidden = false;
  setModeButtonsDisabled(true);
  showPrompt(state.queue.shift());
}

function nextWord() {
  if (!state.queue.length) {
    finishTest();
    return;
  }
  showPrompt(state.queue.shift());
}

function showFeedback(isCorrect, submitted) {
  const word = state.current;
  state.answered = true;
  state.remaining -= 1;
  if (isCorrect) state.correct += 1;
  else {
    state.wrong += 1;
    state.errors.push({ word, answer: submitted });
  }

  updateStats();
  updateProgress();
  elements.input.disabled = true;
  elements.feedback.hidden = false;
  elements.resultBadge.textContent = isCorrect ? "正确" : "错误";
  elements.resultBadge.className = `result-badge ${isCorrect ? "is-correct" : "is-wrong"}`;
  elements.answerMain.textContent = word.original;
  elements.answerKana.textContent = word.kana;
  elements.detailGrid.replaceChildren();
  renderDetails(word, elements.detailGrid);

  elements.submit.textContent = state.remaining > 0 ? "下一题" : "查看结果";
  elements.submit.disabled = false;
  elements.submit.focus();
}

function finishTest() {
  state.testing = false;
  state.finished = true;
  state.current = null;
  setModeButtonsDisabled(false);
  elements.testProgress.hidden = true;
  elements.promptBlock.hidden = true;
  elements.form.hidden = true;
  elements.feedback.hidden = true;
  elements.summaryBlock.hidden = false;

  elements.summaryTotal.textContent = state.total;
  elements.summaryCorrect.textContent = state.correct;
  elements.summaryWrong.textContent = state.wrong;
  elements.summaryAccuracy.textContent = state.total
    ? `${Math.round((state.correct / state.total) * 100)}%`
    : "—";
  elements.exportButton.hidden = state.errors.length === 0;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportErrorsCsv() {
  const headers = [
    "单词",
    "假名",
    "词类",
    "中文",
    "音调",
    "类型",
    "自／他动词",
    "ます形",
    "て形",
    "连用形",
    "过去式",
    "课次",
    "备注",
    "你的答案",
  ];
  const rows = state.errors.map(({ word, answer }) => [
    word.original,
    word.kana,
    word.kind === "verb" ? "动词" : word.adjective_type,
    word.meaning,
    word.accent || "待核",
    word.kind === "verb" ? word.verb_type : word.adjective_type,
    word.kind === "verb" ? word.transitivity : "",
    word.kind === "verb" ? word.masu_form : "",
    word.kind === "verb" ? word.te_form : "",
    word.kind === "adjective" ? word.conjunctive_form : "",
    word.kind === "adjective" ? word.past_form : "",
    word.lessons.join("、"),
    word.note,
    answer,
  ]);
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `错题_${stamp}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderErrorList() {
  elements.errorList.replaceChildren();
  if (!state.errors.length) {
    const empty = document.createElement("p");
    empty.className = "error-list-empty";
    empty.textContent = state.testing
      ? "本次测试暂时没有错题"
      : "当前没有错题记录，先完成一次测试吧";
    elements.errorList.append(empty);
    return;
  }
  for (const { word, answer } of state.errors) {
    const entry = document.createElement("article");
    entry.className = "error-entry";

    const head = document.createElement("div");
    head.className = "feedback-heading";
    const badge = document.createElement("span");
    badge.className = "result-badge is-wrong";
    badge.textContent = "错误";
    const names = document.createElement("div");
    const main = document.createElement("p");
    main.className = "answer-main";
    main.textContent = word.original;
    const kana = document.createElement("p");
    kana.className = "answer-kana";
    kana.textContent = word.kana;
    names.append(main, kana);
    head.append(badge, names);

    const userAnswer = document.createElement("p");
    userAnswer.className = "error-user-answer";
    userAnswer.textContent = `你的答案：${answer || "（空）"}`;

    const grid = document.createElement("dl");
    grid.className = "detail-grid";
    renderDetails(word, grid);

    entry.append(head, userAnswer, grid);
    elements.errorList.append(entry);
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.testing || !state.current) return;
  if (state.answered) {
    nextWord();
    return;
  }
  const raw = elements.input.value;
  const submitted = normalizeAnswer(raw);
  if (!submitted) {
    elements.input.focus();
    return;
  }
  showFeedback(state.current.answers.includes(submitted), submitted);
});

elements.startButton.addEventListener("click", startTest);

elements.exportButton.addEventListener("click", exportErrorsCsv);

elements.errorListButton.addEventListener("click", () => {
  renderErrorList();
  elements.errorDialog.showModal();
});

elements.closeDialogButton.addEventListener("click", () => elements.errorDialog.close());

elements.errorDialog.addEventListener("click", (event) => {
  if (event.target === elements.errorDialog) elements.errorDialog.close();
});

for (const button of elements.modeButtons) {
  button.addEventListener("click", () => {
    if (state.testing) return;
    state.mode = button.dataset.mode;
    for (const candidate of elements.modeButtons) {
      candidate.classList.toggle("is-active", candidate === button);
    }
    updateModeSummary();
  });
}

async function initialize() {
  try {
    const response = await fetch("/api/words");
    if (!response.ok) throw new Error(`词库请求失败：${response.status}`);
    const payload = await response.json();
    state.words = payload.words;
    state.counts = payload.counts;
    updateModeSummary();
    showIdle();
  } catch (error) {
    elements.error.hidden = false;
    elements.error.textContent = `无法加载词库。${error.message}`;
    elements.meaning.textContent = "词库加载失败";
  }
}

initialize();
