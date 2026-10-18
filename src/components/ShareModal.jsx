import React, { useState } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  Send,
  ExternalLink,
  X,
  Smartphone,
  Calendar,
  AlertCircle,
  Loader2,
  FileImage,
} from 'lucide-react';
import {
  downloadScreenshot,
  copyScreenshotToClipboard,
  shareScreenshotNative,
  buildWhatsAppSummary,
} from '../utils/screenshotExporter';

export default function ShareModal({
  isOpen,
  onClose,
  teachersSummary,
  subjectProgress,
  targetElementId = 'timetable-section-container',
}) {
  const [loadingAction, setLoadingAction] = useState(null); // 'download-png' | 'download-jpg' | 'clipboard' | 'native'
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleDownload = async (format = 'png') => {
    try {
      setLoadingAction(`download-${format}`);
      setErrorMessage(null);
      await downloadScreenshot(
        targetElementId,
        `Weekly_Lecture_Timetable_${new Date().toISOString().slice(0, 10)}.${format}`,
        format
      );
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to generate image download: ' + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      setLoadingAction('clipboard');
      setErrorMessage(null);
      await copyScreenshotToClipboard(targetElementId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        'Clipboard copy failed or permission was denied. You can download the PNG/JPG instead and send it.'
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleWhatsAppWeb = () => {
    window.open('https://web.whatsapp.com', '_blank');
  };

  const handleWhatsAppSummaryText = () => {
    const text = buildWhatsAppSummary(teachersSummary, subjectProgress);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    try {
      setLoadingAction('native');
      setErrorMessage(null);
      await shareScreenshotNative(targetElementId, 'Weekly Lecture Timetable');
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.message || 'Direct device sharing not supported on this browser.'
      );
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box share-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bubble whatsapp-color">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="modal-title">Save & Share Weekly Timetable</h3>
              <p className="modal-subtitle">
                Captures the <strong>entire timetable</strong> across all columns and rows without clipping
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Capture Scope Badge */}
        <div className="share-scope-notice">
          <Calendar size={14} className="text-primary" />
          <span>
            Screenshot target: <strong>Complete Weekly Timetable</strong> (all classes & full horizontal width included)
          </span>
        </div>

        {errorMessage && (
          <div className="modal-error-alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {copySuccess && (
          <div className="modal-success-alert">
            <Check size={16} />
            <span>
              <strong>Timetable screenshot copied to clipboard!</strong> Open WhatsApp Web and press <code>Ctrl + V</code> to send.
            </span>
          </div>
        )}

        <div className="share-options-grid">
          {/* Option 1: Download Image (PNG & JPG) */}
          <div className="share-option-card">
            <div className="option-icon-wrap download-bg">
              <Download size={24} className="text-blue" />
            </div>
            <div className="option-info">
              <h4 className="option-title">Save to Local Drive</h4>
              <p className="option-desc">
                Export full-width image of the entire Weekly Lecture Timetable with all courses and time periods.
              </p>
            </div>
            <div className="option-actions-duo">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => handleDownload('png')}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'download-png' ? (
                  <>
                    <Loader2 size={16} className="spin" /> Generating PNG...
                  </>
                ) : (
                  <>
                    <Download size={15} /> Save as PNG
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => handleDownload('jpg')}
                disabled={loadingAction !== null}
                title="Save as compact JPG image"
              >
                {loadingAction === 'download-jpg' ? (
                  <>
                    <Loader2 size={16} className="spin" /> Generating JPG...
                  </>
                ) : (
                  <>
                    <FileImage size={15} /> Save as JPG
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 2: WhatsApp Web Image Paste */}
          <div className="share-option-card highlight-card">
            <div className="option-icon-wrap whatsapp-bg">
              <Send size={24} className="text-whatsapp" />
            </div>
            <div className="option-info">
              <div className="option-badge">Recommended for WhatsApp</div>
              <h4 className="option-title">Share Timetable on WhatsApp</h4>
              <p className="option-desc">
                Copies full timetable image to clipboard, ready to paste (<code>Ctrl+V</code>) inside any WhatsApp chat!
              </p>
            </div>
            <div className="option-actions-duo">
              <button
                type="button"
                className="btn btn-whatsapp flex-1"
                onClick={handleCopyClipboard}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'clipboard' ? (
                  <>
                    <Loader2 size={16} className="spin" /> Copying Full Table...
                  </>
                ) : copySuccess ? (
                  <>
                    <Check size={16} /> Copied Image!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> 1. Copy Image
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-whatsapp-outline"
                onClick={handleWhatsAppWeb}
                title="Open WhatsApp Web in new tab"
              >
                2. Open WhatsApp <ExternalLink size={14} />
              </button>
            </div>
          </div>

          {/* Option 3: Send WhatsApp Text Summary */}
          <div className="share-option-card">
            <div className="option-icon-wrap text-bg">
              <Smartphone size={24} className="text-teal" />
            </div>
            <div className="option-info">
              <h4 className="option-title">WhatsApp Text Summary</h4>
              <p className="option-desc">
                Send structured text message of teachers, weekly workloads, and subject quotas directly.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={handleWhatsAppSummaryText}
            >
              <Send size={15} /> Send WhatsApp Text Summary
            </button>
          </div>

          {/* Option 4: Native Device Share (Mobile / Tablet) */}
          {typeof navigator !== 'undefined' && navigator.canShare && (
            <div className="share-option-card">
              <div className="option-icon-wrap share-bg">
                <Share2 size={24} className="text-purple" />
              </div>
              <div className="option-info">
                <h4 className="option-title">Device Share Sheet</h4>
                <p className="option-desc">
                  Open device share sheet to send directly via Bluetooth, AirDrop, Gmail, or Slack.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={handleNativeShare}
                disabled={loadingAction !== null}
              >
                {loadingAction === 'native' ? (
                  <>
                    <Loader2 size={16} className="spin" /> Preparing...
                  </>
                ) : (
                  <>
                    <Share2 size={16} /> Share via Apps
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
