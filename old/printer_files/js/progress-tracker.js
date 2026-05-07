/*
  Progress tracking for the makerspace training site.
  This file owns all localStorage completion data, percent calculations,
  sidebar completion styling, and home page progress text.
*/
(function () {
  const SECTION_LESSONS = {
    overview: ["printer-overview"],
    slicer: [
      "slicer-introduction",
      "slicer-setup",
      "slicer-basic-workflow",
      "slicer-left-icon-bar",
      "slicer-right-panel",
      "slicer-top-tabs",
      "slicer-slice-preview"
    ],
    mk4s: [
      "printer-introduction",
      "printer-components",
      "printer-loading-filament",
      "printer-print-sheet",
      "printer-menu-controls",
      "printer-starting-print",
      "printer-finishing-print"
    ],
    design: [
      "design-introduction",
      "design-orientation",
      "design-dimensional-accuracy",
      "design-print-adhesion",
      "design-designed-supports",
      "design-fillets-chamfers"
    ]
  };

  const PRUSA_LESSONS = Object.values(SECTION_LESSONS).flat();

  const COURSE_SECTIONS = {
    cad: [],
    prusa: PRUSA_LESSONS,
    laser: [],
    vinyl: []
  };

  function getCompletedPages() {
    try {
      return JSON.parse(localStorage.getItem("completedPages")) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCompletedPages(completedPages) {
    localStorage.setItem("completedPages", JSON.stringify(completedPages));
  }

  function isLessonComplete(lessonId) {
    return getCompletedPages().includes(lessonId);
  }

  function getPercentComplete(lessonList) {
    if (!lessonList || lessonList.length === 0) return 0;

    const completed = getCompletedPages();
    const completedCount = lessonList.filter(lessonId => completed.includes(lessonId)).length;
    return Math.round((completedCount / lessonList.length) * 100);
  }

  function isSectionComplete(sectionKey) {
    const lessons = SECTION_LESSONS[sectionKey] || [];
    return lessons.length > 0 && lessons.every(lessonId => isLessonComplete(lessonId));
  }

  function markLessonComplete(lessonId) {
    if (!lessonId) return;

    const completed = getCompletedPages();
    if (!completed.includes(lessonId)) {
      completed.push(lessonId);
      saveCompletedPages(completed);
    }

    updatePrinterProgress();
    updateHomeProgress();
  }

  function clearLessonComplete(lessonId) {
    const completed = getCompletedPages().filter(id => id !== lessonId);
    saveCompletedPages(completed);
    updatePrinterProgress();
    updateHomeProgress();
  }

  function updatePrinterProgress() {
    const printerProgress = document.getElementById("printer-progress");
    const printerSectionProgress = document.getElementById("printer-section-progress");
    const percent = getPercentComplete(PRUSA_LESSONS);

    if (printerProgress) printerProgress.textContent = `${percent}%`;
    if (printerSectionProgress) printerSectionProgress.textContent = `${percent}% complete`;

    document.querySelectorAll("[data-lesson-id]").forEach(link => {
      const lessonId = link.dataset.lessonId;
      link.classList.toggle("complete", isLessonComplete(lessonId));
    });

    document.querySelectorAll("[data-section]").forEach(section => {
      const sectionKey = section.dataset.section;
      section.classList.toggle("complete", isSectionComplete(sectionKey));
    });

    const currentLessonId = window.TrainingLoader?.getCurrentLessonId?.();
    const status = document.getElementById("current-lesson-status");
    if (status && currentLessonId) {
      status.textContent = isLessonComplete(currentLessonId)
        ? "This page is complete."
        : "Complete the quick check to mark this page complete.";
    }
  }

  function updateHomeProgress() {
    const cadProgress = document.getElementById("cad-progress");
    const prusaProgress = document.getElementById("prusa-progress");
    const laserProgress = document.getElementById("laser-progress");
    const vinylProgress = document.getElementById("vinyl-progress");
    const overallProgress = document.getElementById("overall-progress");

    if (cadProgress) cadProgress.textContent = `${getPercentComplete(COURSE_SECTIONS.cad)}% complete`;
    if (prusaProgress) prusaProgress.textContent = `${getPercentComplete(COURSE_SECTIONS.prusa)}% complete`;
    if (laserProgress) laserProgress.textContent = `${getPercentComplete(COURSE_SECTIONS.laser)}% complete`;
    if (vinylProgress) vinylProgress.textContent = `${getPercentComplete(COURSE_SECTIONS.vinyl)}% complete`;

    if (overallProgress) {
      const allPages = Object.values(COURSE_SECTIONS).flat();
      overallProgress.textContent = `${getPercentComplete(allPages)}%`;
    }
  }

  window.TrainingProgress = {
    SECTION_LESSONS,
    PRUSA_LESSONS,
    COURSE_SECTIONS,
    getCompletedPages,
    saveCompletedPages,
    isLessonComplete,
    getPercentComplete,
    isSectionComplete,
    markLessonComplete,
    clearLessonComplete,
    updatePrinterProgress,
    updateHomeProgress
  };

  // Keep this global so content pages inside the iframe can call:
  // window.parent.markLessonComplete("lesson-id");
  window.markLessonComplete = markLessonComplete;

  window.addEventListener("DOMContentLoaded", () => {
    updatePrinterProgress();
    updateHomeProgress();
  });
})();
