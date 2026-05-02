/*
  Makes the iframe grow to fit each lesson page so the lesson content does not
  create its own internal scrollbar. The main page remains responsible for scrolling.
*/
(function () {
  let iframeResizeObserver = null;
  let iframeMutationObserver = null;
  let iframeResizeTimer = null;

  function getLessonFrame() {
    return document.getElementById("lesson-frame");
  }

  function queueLessonFrameResize() {
    clearTimeout(iframeResizeTimer);
    iframeResizeTimer = setTimeout(resizeLessonFrame, 50);
  }

  function getLessonContentHeight(doc) {
    const body = doc.body;
    if (!body) return 0;

    const bodyTop = body.getBoundingClientRect().top;
    let bottom = 0;

    Array.from(body.children).forEach(child => {
      const rect = child.getBoundingClientRect();
      const styles = doc.defaultView.getComputedStyle(child);
      const marginBottom = parseFloat(styles.marginBottom) || 0;
      bottom = Math.max(bottom, rect.bottom - bodyTop + marginBottom);
    });

    if (bottom === 0) {
      bottom = Math.max(body.scrollHeight, body.offsetHeight);
    }

    const bodyStyles = doc.defaultView.getComputedStyle(body);
    const paddingTop = parseFloat(bodyStyles.paddingTop) || 0;
    const paddingBottom = parseFloat(bodyStyles.paddingBottom) || 0;

    return Math.ceil(bottom + paddingTop + paddingBottom + 2);
  }

  function getParentScrollTop() {
    const scroller = document.scrollingElement || document.documentElement || document.body;
    return scroller ? scroller.scrollTop : window.scrollY;
  }

  function restoreParentScrollTop(scrollTop) {
    const scroller = document.scrollingElement || document.documentElement || document.body;

    requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop = scrollTop;
      window.scrollTo({ top: scrollTop, left: 0, behavior: "auto" });
    });
  }

  function resizeLessonFrame() {
    const lessonFrame = getLessonFrame();
    if (!lessonFrame) return;

    const savedScrollTop = getParentScrollTop();

    try {
      const doc = lessonFrame.contentDocument || lessonFrame.contentWindow.document;
      if (!doc || !doc.body) return;

      // Temporarily shrink only for measurement. Then immediately restore the
      // iframe height and the parent page scroll position so the page does not
      // jump to the top while images/videos finish loading.
      const previousHeight = lessonFrame.style.height;
      lessonFrame.style.height = "0px";

      const measuredHeight = getLessonContentHeight(doc);
      const safeHeight = Math.max(measuredHeight, 420);
      lessonFrame.style.height = `${safeHeight}px`;

      restoreParentScrollTop(savedScrollTop);
    } catch (error) {
      lessonFrame.style.height = "auto";
      restoreParentScrollTop(savedScrollTop);
    }
  }

  function prepareLessonFrameResize() {
    const lessonFrame = getLessonFrame();
    if (!lessonFrame) return;

    try {
      const doc = lessonFrame.contentDocument || lessonFrame.contentWindow.document;
      if (!doc || !doc.body) return;

      doc.documentElement.style.overflow = "hidden";
      doc.body.style.overflow = "hidden";
      doc.body.style.minHeight = "0";
      doc.body.style.height = "auto";

      if (iframeResizeObserver) iframeResizeObserver.disconnect();
      if (iframeMutationObserver) iframeMutationObserver.disconnect();

      iframeResizeObserver = new ResizeObserver(queueLessonFrameResize);
      iframeResizeObserver.observe(doc.body);
      Array.from(doc.body.children).forEach(child => iframeResizeObserver.observe(child));

      iframeMutationObserver = new MutationObserver(queueLessonFrameResize);
      iframeMutationObserver.observe(doc.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });

      doc.querySelectorAll("img").forEach(img => {
        img.addEventListener("load", queueLessonFrameResize);
        img.addEventListener("error", queueLessonFrameResize);
      });

      doc.querySelectorAll("video").forEach(video => {
        video.addEventListener("loadedmetadata", queueLessonFrameResize);
        video.addEventListener("loadeddata", queueLessonFrameResize);
        video.addEventListener("canplay", queueLessonFrameResize);
      });

      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(queueLessonFrameResize);
      }
    } catch (error) {
      // Keep default iframe behavior if local browser security blocks access.
    }

    requestAnimationFrame(resizeLessonFrame);
    setTimeout(resizeLessonFrame, 100);
    setTimeout(resizeLessonFrame, 350);
    setTimeout(resizeLessonFrame, 900);
  }

  window.TrainingIframe = {
    resizeLessonFrame,
    prepareLessonFrameResize,
    queueLessonFrameResize
  };

  window.addEventListener("DOMContentLoaded", () => {
    const lessonFrame = getLessonFrame();
    if (!lessonFrame) return;

    lessonFrame.setAttribute("scrolling", "no");
    lessonFrame.addEventListener("load", prepareLessonFrameResize);
    window.addEventListener("resize", queueLessonFrameResize);
  });
})();
