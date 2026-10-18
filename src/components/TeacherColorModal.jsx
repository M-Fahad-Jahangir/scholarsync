import React, { useState, useEffect } from 'react';
import { Palette, X, RotateCcw, Plus, Check, UserPlus, Trash2 } from 'lucide-react';
import { COLOR_PALETTES, generateThemeFromHex, getTeacherColor } from '../data/teacherColors';

export default function TeacherColorModal({
  isOpen,
  onClose,
  teachersList = [],
  customColors,
  onUpdateTeacherColor,
  onResetColors,
  onOpenAddTeacher,
  onDeleteTeacher,
}) {
  const [activeTeacher, setActiveTeacher] = useState(teachersList[0] || 'Sir Fahad');
  const [customHex, setCustomHex] = useState('#2563eb');

  useEffect(() => {
    if (teachersList && teachersList.length > 0) {
      if (!activeTeacher || !teachersList.includes(activeTeacher)) {
        setActiveTeacher(teachersList[0]);
      }
    }
  }, [teachersList, activeTeacher]);

  if (!isOpen) return null;

  const currentColor = getTeacherColor(activeTeacher, customColors);

  const handleApplyCustomHex = (hex) => {
    setCustomHex(hex);
    const theme = generateThemeFromHex(hex, `Custom (${hex})`);
    onUpdateTeacherColor(activeTeacher, theme);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box color-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bubble">
              <Palette size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="modal-title">Customize Teacher Tile Colors</h3>
              <p className="modal-subtitle">
                Assign unique colors to teachers or pick any custom color with the color picker
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="color-modal-layout">
          {/* Teacher Selector Sidebar */}
          <div className="teacher-list-column">
            <div className="flex-between mb-2">
              <label className="column-label">Select Teacher:</label>
              {onOpenAddTeacher && (
                <button
                  type="button"
                  className="btn-link-sm"
                  onClick={() => {
                    onClose();
                    onOpenAddTeacher();
                  }}
                  title="Add new teacher"
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </div>

            <div className="teacher-nav-list">
              {teachersList.map((teacher) => {
                const col = getTeacherColor(teacher, customColors);
                const isSelected = activeTeacher === teacher;

                return (
                  <button
                    key={teacher}
                    type="button"
                    className={`teacher-nav-btn ${isSelected ? 'is-active' : ''}`}
                    onClick={() => setActiveTeacher(teacher)}
                  >
                    <span
                      className="nav-color-dot"
                      style={{ backgroundColor: col.accent }}
                    />
                    <span className="nav-teacher-name">{teacher}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palettes Picker */}
          <div className="color-palette-column">
            <div className="palette-header">
              <div>
                <h4 className="palette-title">Color for: <strong>{activeTeacher}</strong></h4>
                <p className="palette-sub">
                  Choose a preset or pick any custom color
                </p>
                {onDeleteTeacher && activeTeacher && (
                  <button
                    type="button"
                    className="btn-action-delete"
                    style={{
                      marginTop: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      fontSize: '12px',
                    }}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete teacher "${activeTeacher}"?\nAll scheduled lecture tiles for this teacher will be deleted and the teacher will be removed from the directory.`
                        )
                      ) {
                        onDeleteTeacher(activeTeacher);
                      }
                    }}
                    title={`Delete teacher "${activeTeacher}" and all their tiles`}
                  >
                    <Trash2 size={13} /> Delete Teacher
                  </button>
                )}
              </div>

              {/* Live Preview Tile */}
              <div
                className="preview-tile-card"
                style={{
                  backgroundColor: currentColor.bg,
                  borderColor: currentColor.border,
                  color: currentColor.text,
                }}
              >
                <div
                  className="preview-stripe"
                  style={{ backgroundColor: currentColor.accent }}
                />
                <div className="preview-subject">Sample Subject (4/4)</div>
                <div className="preview-teacher">{activeTeacher}</div>
                <div className="preview-room">Room 204</div>
              </div>
            </div>

            <label className="column-label">Available Themes:</label>
            <div className="palette-grid">
              {COLOR_PALETTES.map((palette) => {
                const isCurrent = currentColor.name === palette.name;

                return (
                  <button
                    key={palette.name}
                    type="button"
                    className={`palette-choice-card ${isCurrent ? 'palette-selected' : ''}`}
                    style={{
                      backgroundColor: palette.bg,
                      borderColor: palette.border,
                      color: palette.text,
                    }}
                    onClick={() => {
                      onUpdateTeacherColor(activeTeacher, palette);
                    }}
                  >
                    <div className="palette-card-content">
                      <span
                        className="palette-swatch-circle"
                        style={{ backgroundColor: palette.accent }}
                      />
                      <span className="palette-name">{palette.name}</span>
                      {isCurrent && <Check size={14} className="palette-check-icon" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Picker (Requirement 4) */}
            <div className="custom-color-section">
              <label className="column-label">Pick Any Custom Color (Color Wheel / HEX):</label>
              <div className="custom-color-row">
                <input
                  type="color"
                  className="color-picker-input"
                  value={customHex}
                  onChange={(e) => handleApplyCustomHex(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input custom-hex-text"
                  placeholder="#3b82f6"
                  value={customHex}
                  onChange={(e) => handleApplyCustomHex(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary-sm"
                  onClick={() => handleApplyCustomHex(customHex)}
                >
                  Apply Color
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={onResetColors}
          >
            <RotateCcw size={14} /> Reset to Defaults
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
