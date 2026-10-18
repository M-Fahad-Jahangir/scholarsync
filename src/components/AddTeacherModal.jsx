import React, { useState } from 'react';
import { UserPlus, X, Palette, Check } from 'lucide-react';
import { COLOR_PALETTES, generateThemeFromHex } from '../data/teacherColors';

export default function AddTeacherModal({
  isOpen,
  onClose,
  existingTeachers,
  onAddTeacher,
}) {
  const [name, setName] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(COLOR_PALETTES[0]);
  const [customHex, setCustomHex] = useState('#2563eb');
  const [isCustomMode, setIsCustomMode] = useState(false);

  if (!isOpen) return null;

  const activeTheme = isCustomMode
    ? generateThemeFromHex(customHex, `Custom (${customHex})`)
    : selectedPalette;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      alert('Please enter a teacher name.');
      return;
    }
    if (existingTeachers.some((t) => t.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Teacher "${cleanName}" already exists.`);
      return;
    }

    onAddTeacher(cleanName, activeTheme);
    setName('');
    setIsCustomMode(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bubble">
              <UserPlus size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="modal-title">Add New Teacher</h3>
              <p className="modal-subtitle">
                Register a teacher and assign their signature tile color
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Teacher Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Sir Ali, Dr. Sarah, Engr. Usman"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Palette Presets */}
          <div className="form-group">
            <label className="form-label">Choose Color Preset</label>
            <div className="palette-grid">
              {COLOR_PALETTES.map((palette) => {
                const isSelected = !isCustomMode && selectedPalette.name === palette.name;
                return (
                  <button
                    key={palette.name}
                    type="button"
                    className={`palette-choice-card ${isSelected ? 'palette-selected' : ''}`}
                    style={{
                      backgroundColor: palette.bg,
                      borderColor: palette.border,
                      color: palette.text,
                    }}
                    onClick={() => {
                      setIsCustomMode(false);
                      setSelectedPalette(palette);
                    }}
                  >
                    <div className="palette-card-content">
                      <span
                        className="palette-swatch-circle"
                        style={{ backgroundColor: palette.accent }}
                      />
                      <span className="palette-name">{palette.name}</span>
                      {isSelected && <Check size={14} className="palette-check-icon" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Color Picker */}
          <div className="form-group">
            <label className="form-label">Or Pick a Custom Color (Color Picker / HEX)</label>
            <div className="custom-color-row">
              <input
                type="color"
                className="color-picker-input"
                value={customHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  setIsCustomMode(true);
                }}
              />
              <input
                type="text"
                className="form-input custom-hex-text"
                placeholder="#3b82f6"
                value={customHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  setIsCustomMode(true);
                }}
              />
              {isCustomMode && (
                <span className="custom-active-tag">Custom Active</span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={16} /> Add Teacher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
