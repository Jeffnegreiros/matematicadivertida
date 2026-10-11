
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "matematicaDivertidaAnanda_v1";

const freshStats = () => ({
  points: 0,
  correct: 0,
  answered: 0,
  streak: 0,
  bestStreak: 0,
  dailyAnswered: 0,
  byType: {
    tables: { correct: 0, answered: 0 },
    add: { correct: 0, answered: 0 },
    subtract: { correct: 0, answered: 0 },
    multiply: { correct: 0, answered: 0 },
    divide: { correct: 0, answered: 0 }
  }
});

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved) return freshStats();

    const defaults = freshStats();

    return {
      ...defaults,
      ...saved,
      byType: {
        tables: {
          ...defaults.byType.tables,
          ...(saved.byType?.tables || {})
        },
        add: {
          ...defaults.byType.add,
          ...(saved.byType?.add || {})
        },
        subtract: {
          ...defaults.byType.subtract,
          ...(saved.byType?.subtract || {})
        },
        multiply: {
          ...defaults.byType.multiply,
          ...(saved.byType?.multiply || {})
        },
        divide: {
          ...defaults.byType.divide,
          ...(saved.byType?.divide || {})
        }
      }
    };
  } catch {
    return freshStats();
  }
}

let stats = loadStats();
let currentQuestion = null;
let questionCount = 0;
let practiceLocked = false;

let game = {
  active: false,
  count: 0,
  points: 0,
  stars: 0,
  question: null,
  locked: false
};

let activeLesson = "multiply";

function saveStats() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(stats)
    );
  } catch (e) {
    // O aplicativo continua funcionando sem armazenamento.
  }

  renderStats();
}

function renderStats() {
  $("#headerPoints").textContent = stats.points;
  $("#headerStreak").textContent = stats.streak;

  $("#dailyCount").textContent =
    `${Math.min(stats.dailyAnswered, 5)} / 5`;

  $("#dailyBar").style.width =
    `${Math.min(stats.dailyAnswered / 5 * 100, 100)}%`;

  $("#totalPoints").textContent = stats.points;
  $("#totalCorrect").textContent = stats.correct;
  $("#totalAnswered").textContent = stats.answered;

  const accuracy = stats.answered
    ? Math.round(stats.correct / stats.answered * 100)
    : 0;

  $("#accuracyText").textContent = `${accuracy}%`;
  $("#accuracyBar").style.width = `${accuracy}%`;

  const labels = {
    tables: "Tabuada",
    add: "Adição",
    subtract: "Subtração",
    multiply: "Multiplicação",
    divide: "Divisão"
  };

  $("#subjectProgress").innerHTML =
    Object.entries(stats.byType).map(([key, value]) => {
      const rate = value.answered
        ? Math.round(value.correct / value.answered * 100)
        : 0;

      return `
        <div class="subject-row">
          <span>${labels[key]}</span>
          <div class="progress-track">
            <span style="width:${rate}%"></span>
          </div>
          <b>${rate}%</b>
        </div>
      `;
    }).join("");
}

const lessons = {
  add: {
    title: "Somar é juntar quantidades!",
    body: "Na adição, juntamos dois ou mais grupos para descobrir quantos temos ao todo.",
    example: "3 + 2 = 5",
    note: "Se você tinha 3 brinquedos e ganhou mais 2, agora tem 5."
  },

  subtract: {
    title: "Subtrair é tirar uma quantidade!",
    body: "Na subtração, tiramos uma parte de um grupo para descobrir quanto sobra.",
    example: "5 − 2 = 3",
    note: "Se você tinha 5 brinquedos e deu 2, ficaram 3."
  },

  multiply: {
    title: "Multiplicar é formar grupos iguais!",
    body: "Multiplicar ajuda a descobrir quantos objetos temos quando existem vários grupos com a mesma quantidade. Em vez de somar um por um, podemos usar uma multiplicação.",
    example: "3 × 4 = 4 + 4 + 4 = 12",
    note: "São 3 grupos com 4 objetos em cada grupo. Ao todo, temos 12 objetos."
  },

  divide: {
    title: "Dividir é repartir igualmente!",
    body: "Na divisão, repartimos uma quantidade em grupos iguais. Imagine 12 biscoitos para 3 crianças: cada criança recebe a mesma quantidade.",
    example: "12 ÷ 3 = 4",
    note: "Como 3 × 4 = 12, então 12 ÷ 3 = 4."
  },

  tables: {
    title: "A tabuada é sua amiga!",
    body: "A tabuada mostra resultados de multiplicações. Você pode contar de pulinhos iguais: na tabuada do 2, conte 2, 4, 6, 8, 10...",
    example: "2 × 1 = 2 · 2 × 2 = 4 · 2 × 3 = 6",
    note: "Comece pelas tabuadas do 2, 5 e 10. Depois, avance no seu ritmo."
  }
};

function showLesson(type) {
  activeLesson = type;

  $$(".lesson-tab").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.lesson === type
    );
  });

  const lesson = lessons[type];

  $("#lessonContent").innerHTML = `
    <h3>${lesson.title}</h3>
    <p>${lesson.body}</p>
    <div class="example-box">${lesson.example}</div>
    <p class="tiny-note">🌟 ${lesson.note}</p>
  `;
}

function showView(name) {
  $$(".view").forEach(view => {
    view.classList.toggle(
      "active-view",
      view.id === `${name}View`
    );
  });

  $$(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === name
    );
  });

  if (name === "practice") {
    makeQuestion($("#practiceType").value);
  }

  if (name === "learn") {
    showLesson(activeLesson);
  }

  if (name === "progress") {
    renderStats();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function normalizeType(type) {
  if (type === "mixed") {
    return ["add", "subtract", "multiply", "divide"][
      random(0, 3)
    ];
  }

  return type;
}

function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function answerChoices(answer) {
  const distractors = [
    answer + 1,
    answer - 1,
    answer + 2,
    answer - 2,
    answer + 3,
    answer + 4
  ]
    .filter(value => value >= 0 && value !== answer)
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 3);

  return [...distractors, answer]
    .sort(() => Math.random() - 0.5);
}

function makeQuestion(type = "mixed") {
  type = normalizeType(type);

  let a, b, answer, text, hint, visual;

  if (type === "add") {
    a = random(1, 10);
    b = random(1, 10);
    answer = a + b;

    text = `Quanto é ${a} + ${b}?`;
    hint = "Junte as duas quantidades para encontrar o total.";
    visual = "➕";

  } else if (type === "subtract") {
    a = random(1, 10);
    b = random(1, a);
    answer = a - b;

    text = `Quanto é ${a} − ${b}?`;
    hint = "Tire a quantidade menor e descubra quanto sobra.";
    visual = "➖";

  } else if (type === "tables") {
    a = random(2, 10);
    b = random(1, 10);
    answer = a * b;

    text = `Quanto é ${a} × ${b}?`;
    hint = "Dica: conte em pulinhos ou lembre da tabuada.";
    visual = "🔢";

  } else if (type === "multiply") {
    a = random(2, 9);
    b = random(2, 10);
    answer = a * b;

    text = `Há ${a} grupos com ${b} objetos em cada um. Quantos objetos há ao todo?`;
    hint = `Você pode calcular ${a} × ${b}.`;
    visual = "🧺";

  } else {
    b = random(2, 9);
    answer = random(2, 10);
    a = b * answer;

    text = `${a} balas serão divididas igualmente entre ${b} crianças. Quantas balas cada uma recebe?`;
    hint = `Pense: qual número multiplicado por ${b} resulta em ${a}?`;
    visual = "🍬";
  }

  currentQuestion = {
    type,
    a,
    b,
    answer,
    text,
    choices: answerChoices(answer)
  };
  practiceLocked = false;

  questionCount++;

  const labels = {
    tables: "DESAFIO DA TABUADA",
    add: "DESAFIO DE ADIÇÃO",
    subtract: "DESAFIO DE SUBTRAÇÃO",
    multiply: "DESAFIO DE MULTIPLICAÇÃO",
    divide: "DESAFIO DE DIVISÃO"
  };

  $("#questionLabel").textContent = labels[type];
  $("#questionNumber").textContent = `Questão ${questionCount}`;
  $("#questionVisual").textContent = visual;
  $("#questionText").textContent = text;
  $("#questionHint").textContent = hint;

  $("#answerOptions").innerHTML = currentQuestion.choices
    .map(choice => `
      <button class="answer-choice" type="button" data-answer="${choice}">
        ${choice}
      </button>
    `).join("");

  $("#feedback").hidden = true;
  $("#feedback").className = "feedback";

  $("#continueBtn").hidden = true;

}

function explanation(question) {
  if (question.type === "add") {
    return `Juntando ${question.a} e ${question.b}, chegamos a ${question.answer}.`;
  }

  if (question.type === "subtract") {
    return `Tirando ${question.b} de ${question.a}, sobram ${question.answer}.`;
  }

  if (question.type === "divide") {
    return `Como ${question.b} × ${question.answer} = ${question.a}, então ${question.a} ÷ ${question.b} = ${question.answer}. Podemos conferir multiplicando!`;
  }

  if (question.type === "multiply") {
    const repeatedAddition = Array(question.a)
      .fill(question.b)
      .join(" + ");

    return `${question.a} grupos com ${question.b} objetos é ${repeatedAddition}. Somando, chegamos a ${question.answer}.`;
  }

  return `Uma forma de descobrir é somar ${question.a}, ${question.b} vezes, ou lembrar que ${question.a} × ${question.b} = ${question.answer}.`;
}

function recordAnswer(type, isCorrect, points = 0) {
  stats.answered++;
  stats.dailyAnswered++;
  stats.byType[type].answered++;

  if (isCorrect) {
    stats.correct++;
    stats.byType[type].correct++;
    stats.points += points;
    stats.streak++;

    stats.bestStreak = Math.max(
      stats.bestStreak,
      stats.streak
    );
  } else {
    stats.streak = 0;
  }

  saveStats();
}

// Correção dos exercícios de prática.
$("#answerOptions").addEventListener("click", event => {
  const choice = event.target.closest("[data-answer]");
  if (!choice || !currentQuestion || practiceLocked) return;

  practiceLocked = true;
  const correct = Number(choice.dataset.answer) === currentQuestion.answer;
  recordAnswer(currentQuestion.type, correct, 10);

  const feedback = $("#feedback");
  feedback.hidden = false;

  if (correct) {
    feedback.className = "feedback good";

    feedback.innerHTML = `
      🎉 <b>Muito bem, Ananda!</b>
      Você acertou e ganhou 10 pontos!
      ${explanation(currentQuestion)}
    `;

  } else {
    feedback.className = "feedback try";

    feedback.innerHTML = `
      💜 <b>Boa tentativa!</b>
      A resposta é <b>${currentQuestion.answer}</b>.
      ${explanation(currentQuestion)}
      Vamos tentar outra?
    `;
  }

  $$("#answerOptions button").forEach(button => {
    button.disabled = true;
    if (Number(button.dataset.answer) === currentQuestion.answer) {
      button.classList.add("correct-choice");
    } else if (button === choice && !correct) {
      button.classList.add("wrong-choice");
    }
  });

  $("#continueBtn").hidden = false;
});

$("#continueBtn").addEventListener("click", () => {
  makeQuestion($("#practiceType").value);
});

$("#newQuestionBtn").addEventListener("click", () => {
  makeQuestion($("#practiceType").value);
});

$("#practiceType").addEventListener("change", () => {
  makeQuestion($("#practiceType").value);
});

// Jogo das cinco questões.
function startGame() {
  game = {
    active: true,
    count: 0,
    points: 0,
    stars: 0,
    question: null,
    locked: false
  };

  $("#gameResult").hidden = true;

  nextGameQuestion();
}

function nextGameQuestion() {
  if (game.count >= 5) {
    return finishGame();
  }

  game.question = makeGameQuestion();
  game.locked = false;

  $("#gameQuestionCount").textContent =
    `${game.count} / 5`;

  $("#gameStars").textContent =
    `⭐ ${game.stars}`;

  $("#gamePoints").textContent = game.points;

  $("#gameQuestionArea").innerHTML = `
    <span class="eyebrow">
      QUESTÃO ${game.count + 1} DE 5
    </span>

    <h3>${game.question.text}</h3>

    <p>${game.question.hint}</p>

    <div id="gameAnswerOptions" class="answer-options" role="group" aria-label="Escolha uma resposta">
      ${game.question.choices.map(choice => `
        <button class="answer-choice" type="button" data-answer="${choice}">
          ${choice}
        </button>
      `).join("")}
    </div>

    <div
      id="gameFeedback"
      class="game-feedback"
      role="status"
    ></div>
  `;

  $("#gameAnswerOptions").addEventListener("click", event => {
    const choice = event.target.closest("[data-answer]");
    if (!choice) return;
    checkGameAnswer(Number(choice.dataset.answer), choice);
  });
}

function makeGameQuestion() {
  const type = ["add", "subtract", "multiply", "divide"][random(0, 3)];
  let a, b, answer, text, hint;

  if (type === "add") {
    a = random(1, 10);
    b = random(1, 10);
    answer = a + b;
    text = `Quanto é ${a} + ${b}?`;
    hint = "Junte as duas quantidades.";
  } else if (type === "subtract") {
    a = random(1, 10);
    b = random(1, a);
    answer = a - b;
    text = `Quanto é ${a} − ${b}?`;
    hint = "Tire uma quantidade da outra.";
  } else if (type === "multiply") {
    a = random(1, 10);
    b = random(1, 10);
    answer = a * b;
    text = `Quanto é ${a} × ${b}?`;
    hint = "Pense nos grupos iguais.";
  } else {
    b = random(1, 10);
    answer = random(1, 10);
    a = b * answer;
    text = `Quanto é ${a} ÷ ${b}?`;
    hint = "Reparta em grupos iguais.";
  }

  return {
    type,
    a,
    b,
    answer,
    text,
    hint,
    choices: answerChoices(answer)
  };
}

function checkGameAnswer(value, selectedChoice) {
  if (game.locked) return;

  game.locked = true;

  const question = game.question;
  const correct = value === question.answer;

  recordAnswer(question.type, correct, 0);

  if (correct) {
    game.points += 10;
    game.stars++;
  }

  $$("#gameAnswerOptions button").forEach(button => {
    button.disabled = true;
    if (Number(button.dataset.answer) === question.answer) {
      button.classList.add("correct-choice");
    } else if (button === selectedChoice && !correct) {
      button.classList.add("wrong-choice");
    }
  });

  $("#gameFeedback").textContent = correct
    ? `🎉 Isso mesmo! +10 pontos. ${explanation(question)}`
    : `💜 Boa tentativa! A resposta é ${question.answer}. ${explanation(question)}`;

  game.count++;

  $("#gameQuestionCount").textContent =
    `${game.count} / 5`;

  $("#gameStars").textContent =
    `⭐ ${game.stars}`;

  $("#gamePoints").textContent = game.points;

  const nextButton = document.createElement("button");

  nextButton.className = "primary-btn";
  nextButton.style.marginTop = "12px";

  nextButton.textContent = game.count >= 5
    ? "Ver resultado 🏆"
    : "Próxima questão →";

  nextButton.addEventListener(
    "click",
    nextGameQuestion
  );

  $("#gameQuestionArea").appendChild(nextButton);
}

function finishGame() {
  game.active = false;

  $("#gameQuestionArea").innerHTML = "";
  $("#gameResult").hidden = false;

  const message = game.stars === 5
    ? "Incrível! Você acertou todas!"
    : game.stars >= 3
      ? "Muito bem! Você está aprendendo cada vez mais!"
      : "Parabéns por terminar! Praticar ajuda a aprender.";

  $("#gameResult").innerHTML = `
    <div style="font-size:48px">🏆</div>

    <h3>${message}</h3>

    <p>
      Você ganhou <b>${game.points} pontos</b>
      e conquistou <b>${game.stars} de 5 estrelas</b>
      nesta rodada.
    </p>

    <button id="playAgainBtn" class="primary-btn">
      Jogar de novo ↻
    </button>
  `;

  $("#playAgainBtn").addEventListener(
    "click",
    startGame
  );
}

$("#startGameBtn").addEventListener("click", startGame);

// Navegação entre as telas.
$$("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

$$("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.go);
  });
});

// Cartões da tela inicial.
$$("[data-topic]").forEach(button => {
  button.addEventListener("click", () => {
    const topic = button.dataset.topic;

    if (
      topic === "tables" ||
      topic === "add" ||
      topic === "subtract" ||
      topic === "multiply" ||
      topic === "divide"
    ) {
      showView("learn");
      showLesson(topic);
    }
  });
});

// Abas das explicações.
$$("[data-lesson]").forEach(button => {
  button.addEventListener("click", () => {
    showLesson(button.dataset.lesson);
  });
});

// Reiniciar os dados salvos.
$("#resetProgressBtn").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Quer mesmo reiniciar todo o progresso salvo neste navegador?"
  );

  if (!confirmed) return;

  stats = freshStats();

  saveStats();
  renderStats();
});

// Inicialização do aplicativo.
showLesson("multiply");
renderStats();
makeQuestion("mixed");
