const state = {
  words: [],
  counts: {},
  mode: "all",
  current: null,
  answered: false,
  correct: 0,
  wrong: 0,
};

const elements = {
  form: document.querySelector("#answerForm"),
  input: document.querySelector("#answerInput"),
  submit: document.querySelector("#submitButton"),
  meaning: document.querySelector("#meaning"),
  kindTag: document.querySelector("#kindTag"),
  promptLabel: document.querySelector("#promptLabel"),
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
};

function normalizeAnswer(value) {
  return value.normalize("NFKC").replace(/\s+/g, "").trim().toLowerCase();
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

function chooseNextWord() {
  const pool = filteredWords();
  if (!pool.length) return;
  let next = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && next.id === state.current?.id) {
    next = pool[(pool.indexOf(next) + 1) % pool.length];
  }
  state.current = next;
  state.answered = false;
  elements.meaning.textContent = next.meaning;
  elements.kindTag.textContent = next.kind === "verb" ? "动词" : next.adjective_type;
  elements.promptLabel.textContent =
    next.kind === "verb" ? "请输入辞书形或ます形" : "请输入对应的日文原型";
  elements.input.placeholder = next.kind === "verb" ? "如：食べる / 食べます" : "输入汉字或假名";
  elements.input.value = "";
  elements.input.disabled = false;
  elements.submit.disabled = false;
  elements.submit.textContent = "提交";
  elements.feedback.hidden = true;
  elements.input.focus();
}

function addDetail(label, value, extraClass = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `detail-item ${extraClass}`.trim();
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value || "—";
  wrapper.append(term, description);
  elements.detailGrid.append(wrapper);
}

function showFeedback(isCorrect) {
  const word = state.current;
  state.answered = true;
  elements.input.disabled = true;
  elements.feedback.hidden = false;
  elements.resultBadge.textContent = isCorrect ? "正确" : "错误";
  elements.resultBadge.className = `result-badge ${isCorrect ? "is-correct" : "is-wrong"}`;
  elements.answerMain.textContent = word.original;
  elements.answerKana.textContent = word.kana;
  elements.detailGrid.replaceChildren();

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

  if (isCorrect) state.correct += 1;
  else state.wrong += 1;
  elements.correctCount.textContent = state.correct;
  elements.wrongCount.textContent = state.wrong;
  elements.submit.textContent = "下一题";
  elements.submit.disabled = false;
  elements.submit.focus();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.current) return;
  if (state.answered) {
    chooseNextWord();
    return;
  }
  const submitted = normalizeAnswer(elements.input.value);
  if (!submitted) {
    elements.input.focus();
    return;
  }
  showFeedback(state.current.answers.includes(submitted));
});

for (const button of elements.modeButtons) {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    for (const candidate of elements.modeButtons) {
      candidate.classList.toggle("is-active", candidate === button);
    }
    updateModeSummary();
    chooseNextWord();
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
    chooseNextWord();
  } catch (error) {
    elements.error.hidden = false;
    elements.error.textContent = `无法加载词库。${error.message}`;
    elements.meaning.textContent = "词库加载失败";
  }
}

initialize();
