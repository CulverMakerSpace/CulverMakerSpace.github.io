(() => {
  function notifyParentToResize() {
    try {
      if (window.parent && window.parent !== window) {
        if (typeof window.parent.resizeLessonFrame === "function") {
          window.parent.resizeLessonFrame();
        }
        if (window.parent.PigottIframeResizer?.resize) {
          window.parent.PigottIframeResizer.resize();
        }
      }
    } catch (error) {
      // Ignore cross-frame resize errors.
    }
  }

  function markComplete(lessonId) {
    try {
      if (window.parent && window.parent !== window) {
        if (typeof window.parent.markLessonComplete === "function") {
          window.parent.markLessonComplete(lessonId);
          return;
        }
        if (window.parent.PigottProgress?.markLessonComplete) {
          window.parent.PigottProgress.markLessonComplete(lessonId);
          return;
        }
      }
    } catch (error) {
      // Fall back to local storage below.
    }

    const completed = JSON.parse(localStorage.getItem("completedPages") || "[]");
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      localStorage.setItem("completedPages", JSON.stringify(completed));
    }
  }

  function allQuestionsCorrect(questions) {
    return questions.every(question => question.dataset.answeredCorrectly === "true");
  }

  function setupQuiz(quiz) {
    const lessonId = quiz.dataset.lessonId;
    const questions = Array.from(quiz.querySelectorAll(".quiz-question"));

    if (!lessonId || questions.length === 0) return;

    questions.forEach(question => {
      const correctAnswer = question.dataset.correct;
      const buttons = Array.from(question.querySelectorAll("button[data-answer]"));
      const feedback = question.querySelector(".feedback");

      buttons.forEach(button => {
        button.addEventListener("click", () => {
          const selectedAnswer = button.dataset.answer;

          buttons.forEach(btn => btn.classList.remove("correct", "incorrect"));

          if (selectedAnswer === correctAnswer) {
            button.classList.add("correct");
            question.classList.add("answered-correctly");
            question.dataset.answeredCorrectly = "true";
            if (feedback) feedback.textContent = "Correct.";
          } else {
            button.classList.add("incorrect");
            question.classList.remove("answered-correctly");
            question.dataset.answeredCorrectly = "false";
            if (feedback) feedback.textContent = "Try again.";
          }

          if (allQuestionsCorrect(questions)) {
            markComplete(lessonId);

            if (!quiz.querySelector(".quick-check-complete")) {
              const message = document.createElement("p");
              message.className = "quick-check-complete";
              message.textContent = "Page complete. Progress has been saved.";
              quiz.appendChild(message);
            }
          }

          notifyParentToResize();
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quick-check").forEach(setupQuiz);
    notifyParentToResize();
  });
})();
