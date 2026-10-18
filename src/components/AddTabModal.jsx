import React, { useState } from 'react';
import { Building2, X, Plus } from 'lucide-react';

export default function AddTabModal({
  isOpen,
  onClose,
  existingTabs = [],
  onAddTab,
}) {
  const [tabName, setTabName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = tabName.trim();
    if (!cleanName) {
      alert('Please enter a department name');
      return;
    }
    if (existingTabs.some((t) => t.toLowerCase() === cleanName.toLowerCase())) {
      alert(`Department "${cleanName}" already exists.`);
      return;
    }

    onAddTab(cleanName);
    setTabName('');
    onClose();
  };

  const suggestions = [
    'BS Mathematics',
    'BS Data Science',
    'BS AI & Robotics',
    'BBA / Management',
    'BS Physics',
    'FSc Pre-Medical',
    'FSc Pre-Engineering',
    'Commerce',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bubble">
              <Building2 size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="modal-title">Add New Department</h3>
              <p className="modal-subtitle">
                Create a department (e.g. BS English, BS IT / CS, Inter) to organize classes and timetable tabs
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. BS Mathematics, BBA, Department of Chemistry"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quick Suggestions</label>
            <div className="suggestion-chips-grid">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setTabName(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
