import html2canvas from 'html2canvas';

/**
 * Capture an HTML element as an HTML5 Canvas, ensuring complete width and height
 * without any clipping from horizontal/vertical scrollbars.
 */
export async function captureElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found.`);
  }

  // Find table and scroll wrapper to measure the true full dimensions
  const table = element.querySelector('.timetable-grid');
  const scrollWrapper = element.querySelector('.timetable-scroll-wrapper');

  // Compute full content width needed (e.g. 11+ classes at min-width 150px = ~2000px+)
  const tableScrollWidth = table ? table.scrollWidth : 0;
  const wrapperScrollWidth = scrollWrapper ? scrollWrapper.scrollWidth : 0;
  const elementScrollWidth = element.scrollWidth;

  const contentFullWidth = Math.max(
    elementScrollWidth,
    tableScrollWidth + 30,
    wrapperScrollWidth + 20,
    1200
  );

  const canvas = await html2canvas(element, {
    scale: 2, // High resolution (2x DPI)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: contentFullWidth,
    windowWidth: contentFullWidth,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById(elementId);
      if (!clonedElement) return;

      // Force cloned root card to full width
      clonedElement.style.width = `${contentFullWidth}px`;
      clonedElement.style.maxWidth = 'none';
      clonedElement.style.overflow = 'visible';
      clonedElement.style.boxSizing = 'border-box';

      // Unclip all scrollable containers inside
      const scrollContainers = clonedElement.querySelectorAll(
        '.timetable-scroll-wrapper, .timetable-container, .timetable-section-card'
      );
      scrollContainers.forEach((el) => {
        el.style.width = '100%';
        el.style.maxWidth = 'none';
        el.style.overflow = 'visible';
        el.style.overflowX = 'visible';
      });

      // Expand table to its full width
      const clonedTable = clonedElement.querySelector('.timetable-grid');
      if (clonedTable) {
        clonedTable.style.width = '100%';
        clonedTable.style.minWidth = `${tableScrollWidth || contentFullWidth}px`;
      }

      // Make sticky elements static in the clone so html2canvas renders them in place without offset bugs
      const stickyEls = clonedElement.querySelectorAll('.th-time, .cell-time');
      stickyEls.forEach((el) => {
        el.style.position = 'static';
      });

      // Hide interactive editor buttons & controls from official screenshot
      const utilityControls = clonedElement.querySelectorAll(
        '.btn-header-delete-col, .btn-row-delete, .btn-add-class-quick, .btn-add-column-header, .th-add-column, .cell-add-column-empty, .add-time-row-btn, .btn-whatsapp-timetable, .btn-delete-break, .edit-hint-dot, .timetable-bottom-controls, .cell-quick-add-btn, .cell-stack-add-btn'
      );
      utilityControls.forEach((btn) => {
        btn.style.display = 'none';
      });
    },
  });

  return canvas;
}

/**
 * Download screenshot directly to local drive as PNG or JPG
 */
export async function downloadScreenshot(
  elementId,
  filename = 'Weekly_Lecture_Timetable.png',
  format = 'png'
) {
  const canvas = await captureElement(elementId);
  const isJpg = format === 'jpg' || format === 'jpeg';
  const mimeType = isJpg ? 'image/jpeg' : 'image/png';
  const dataUrl = canvas.toDataURL(mimeType, isJpg ? 0.95 : 1.0);

  const finalFilename = isJpg
    ? filename.replace(/\.png$/i, '.jpg')
    : filename.replace(/\.jpe?g$/i, '.png');

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

/**
 * Copy screenshot to system clipboard so user can press Ctrl+V in WhatsApp
 */
export async function copyScreenshotToClipboard(elementId) {
  const canvas = await captureElement(elementId);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob.'));
        return;
      }
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          resolve({ success: true, method: 'clipboard' });
        } else {
          throw new Error('ClipboardItem API not supported in this browser.');
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Share via native Web Share API (Mobile / Modern Desktop)
 */
export async function shareScreenshotNative(elementId, title = 'Weekly Lecture Schedule') {
  const canvas = await captureElement(elementId);

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Could not create blob'));
        return;
      }

      const file = new File([blob], 'Weekly_Lecture_Timetable.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title,
            text: 'Here is our latest weekly lecture schedule.',
            files: [file],
          });
          resolve({ success: true, native: true });
        } catch (err) {
          if (err.name !== 'AbortError') {
            reject(err);
          } else {
            resolve({ cancelled: true });
          }
        }
      } else {
        reject(new Error('Native file sharing is not supported on this browser.'));
      }
    }, 'image/png');
  });
}

/**
 * Format a neat WhatsApp text message with schedule stats
 */
export function buildWhatsAppSummary(teachersSummary, subjectProgress) {
  let text = `📚 *LECTURE MANAGEMENT TIMETABLE*\n`;
  text += `──────────────────────\n\n`;

  text += `👨‍🏫 *TEACHER LECTURE ASSIGNMENTS:*\n`;
  teachersSummary.forEach((t) => {
    text += `• *${t.name}* (${t.weeklyCount} lectures)\n  Subjects: ${t.subjects.join(', ') || 'None'}\n`;
  });

  text += `\n📊 *SUBJECT PROGRESS (Target: 4/week):*\n`;
  subjectProgress.forEach((s) => {
    const status =
      s.count === 4
        ? '✅ (Completed)'
        : s.count > 4
        ? `⚠️ (Exceeded: ${s.count}/4)`
        : `⏳ (${s.count}/4)`;
    text += `• *${s.subject}*: ${status}\n`;
  });

  text += `\n_Generated via Lecture Management System_`;
  return text;
}
