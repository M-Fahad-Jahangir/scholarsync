import React, { useState, useEffect } from 'react';
import { Columns, X, Plus, Trash2 } from 'lucide-react';

const DEFAULT_BASE_SUGGESTIONS = {
  inter: ['Inter Part 1', 'Inter Part 2', 'Inter Part 3', 'Inter Pre-Medical', 'Inter Pre-Eng'],
  eng: ['BS-ENG-I', 'BS-ENG-III', 'BS-ENG-V', 'BS-ENG-VII', 'BS-ENG-Evening'],
  cs: ['BS-CS-I', 'BS-CS-III', 'BS-IT-V', 'BS-IT-VII', 'BS-SE-I', 'BS-AI-III'],
  it: ['BS-CS-I', 'BS-CS-III', 'BS-IT-V', 'BS-IT-VII', 'BS-SE-I', 'BS-AI-III'],
  math: ['BS-Math-1st', 'BS-Math-3rd', 'BS-Math-5th', 'BS-Math-7th'],
  bba: ['BBA-1st', 'BBA-3rd', 'BBA-5th', 'BBA-7th'],
  general: [
    'Inter Part 1',
    'BS-CS-I',
    'BS-IT-V',
    'BS-ENG-I',
    'BS-AI-III',
    'BS-Data-Science',
    'FSc Pre-Medical',
    'ICS Part-I',
  ],
};

export default function AddClassModal({
  isOpen,
  onClose,
  existingPrograms = [],
  activeCategory = null,
  onAddClass,
  onDeleteClass,
}) {
  const [className, setClassName] = useState('');
  const [customSuggestions, setCustomSuggestions] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_class_suggestions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setClassName('');
    try {
      const saved = localStorage.getItem('lms_class_suggestions');
      if (saved) {
        setCustomSuggestions(JSON.parse(saved));
      }
    } catch {}
  }, [activeCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = className.trim();
    if (!cleanName) {
      alert('Please enter a class / column name');
      return;
    }
    if (existingPrograms.some((p) => p.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Class column "${cleanName}" already exists.`);
      return;
    }

    // Save into suggestions for next time
    const updatedSuggestions = [
      cleanName,
      ...customSuggestions.filter((s) => s.toLowerCase() !== cleanName.toLowerCase()),
    ];
    setCustomSuggestions(updatedSuggestions);
    try {
      localStorage.setItem('lms_class_suggestions', JSON.stringify(updatedSuggestions));
    } catch (err) {
      console.warn('Could not save class suggestions', err);
    }

    const assignedCategory =
      activeCategory && activeCategory !== 'ALL' ? activeCategory : null;
    
    // Add to programs in state and persistent storage
    onAddClass(cleanName, assignedCategory);
    setClassName('');
    onClose();
  };

  // Requirement 4: Delete class directly from quick suggestions and remove from academic directory
  const handleDeleteSuggestion = (e, s) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete class "${s}"?\nThis will remove it from suggestions and the Class Directory.`
    );
    if (!confirmed) return;

    // 1. Remove from suggestions
    const updated = customSuggestions.filter(
      (item) => item.toLowerCase() !== s.toLowerCase()
    );
    setCustomSuggestions(updated);
    try {
      localStorage.setItem('lms_class_suggestions', JSON.stringify(updated));
    } catch {}

    // 2. Cascade delete from programs in Academic Directory and Timetable
    if (onDeleteClass) {
      onDeleteClass(s);
    }
  };

  const getSmartSuggestions = () => {
    const cat = (activeCategory || '').toLowerCase();
    let baseList = DEFAULT_BASE_SUGGESTIONS.general;

    if (cat.includes('inter') || cat.includes('fsc') || cat.includes('ics')) {
      baseList = DEFAULT_BASE_SUGGESTIONS.inter;
    } else if (cat.includes('eng')) {
      baseList = DEFAULT_BASE_SUGGESTIONS.eng;
    } else if (cat.includes('cs') || cat.includes('it') || cat.includes('comput')) {
      baseList = DEFAULT_BASE_SUGGESTIONS.cs;
    } else if (cat.includes('math')) {
      baseList = DEFAULT_BASE_SUGGESTIONS.math;
    } else if (cat.includes('bba')) {
      baseList = DEFAULT_BASE_SUGGESTIONS.bba;
    }

    // Combine custom suggestions and base suggestions
    const combined = [...customSuggestions, ...baseList];

    // Remove duplicates case-insensitively
    const seen = new Set();
    const unique = [];
    combined.forEach((item) => {
      const lower = item.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(item);
      }
    });

    return unique.slice(0, 12);
  };

  const suggestions = getSmartSuggestions();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bubble">
              <Columns size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="modal-title">
                {activeCategory && activeCategory !== 'ALL'
                  ? `Add Column to "${activeCategory}"`
                  : 'Add New Class Column'}
              </h3>
              <p className="modal-subtitle">
                Inserts a new academic class column into the timetable & directory
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Class Column Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Inter Part 1, BS-AI-III, BS-CS/IT-V"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="suggestions-header-row">
              <label className="form-label">Quick Suggestions</label>
              <span className="suggestions-help-hint">Click to select • Click × to delete</span>
            </div>

            <div className="suggestion-chips-grid">
              {suggestions.map((s) => (
                <div key={s} className="suggestion-chip-pill">
                  <button
                    type="button"
                    className="chip-select-btn"
                    onClick={() => setClassName(s)}
                    title={`Click to select "${s}"`}
                  >
                    + {s}
                  </button>
                  <button
                    type="button"
                    className="chip-delete-btn"
                    onClick={(e) => handleDeleteSuggestion(e, s)}
                    title={`Delete "${s}" from suggestions & class directory`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
