/*
  Handles loading lesson pages into the iframe and remembering the last lesson.
*/
(function () {
  let currentLessonId = "printer-overview";

  function getLessonFrame() {
    return document.getElementById("lesson-frame");
  }

  function lessonIdFromPath(filePath) {
    return filePath.split("/").pop().replace(".html", "");
  }

  function setActiveLessonLink(filePath, clickedLink) {
    document.querySelectorAll(".side-overview, .side-link, .side-section a").forEach(link => {
      link.classList.remove("active");
    });

    const lessonId = lessonIdFromPath(filePath);
    const linkToActivate = clickedLink || document.querySelector(`[data-lesson-id="${lessonId}"]`);

    if (linkToActivate) {
      linkToActivate.classList.add("active");
      const parentSection = linkToActivate.closest("details");
      if (parentSection) parentSection.open = true;
    }
  }

  function loadLesson(filePath, clickedLink) {
    const lessonFrame = getLessonFrame();
    if (lessonFrame) lessonFrame.src = filePath;

    localStorage.setItem("lastLesson", filePath);
    currentLessonId = lessonIdFromPath(filePath);

    setActiveLessonLink(filePath, clickedLink);
    window.TrainingProgress?.updatePrinterProgress?.();
    window.TrainingIframe?.queueLessonFrameResize?.();
  }

  function getCurrentLessonId() {
    return currentLessonId;
  }

  window.TrainingLoader = {
    loadLesson,
    getCurrentLessonId,
    lessonIdFromPath,
    setActiveLessonLink
  };

  // Keep this global so your existing onclick="loadLesson(...)" links still work.
  window.loadLesson = loadLesson;

  window.addEventListener("DOMContentLoaded", () => {
    const lessonFrame = getLessonFrame();
    if (!lessonFrame) return;

    const savedLesson = localStorage.getItem("lastLesson") || "content/printer-overview.html";
    lessonFrame.src = savedLesson;
    currentLessonId = lessonIdFromPath(savedLesson);

    setActiveLessonLink(savedLesson, null);
    window.TrainingProgress?.updatePrinterProgress?.();
    window.TrainingIframe?.resizeLessonFrame?.();
  });
})();
