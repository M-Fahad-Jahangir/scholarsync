import React, { useState, useEffect } from 'react';
import { BookOpen, X, Plus } from 'lucide-react';

export default function AddSubjectModal({
  isOpen,
  onClose,
  existingSubjects = [],
  categories = [],
  activeDepartment = null,
  onAddSubject,
}) {
  const [subjectName, setSubjectName] = useState('');
  const [targetCount, setTargetCount] = useState(4);
  const [department, setDepartment] = useState(activeDepartment || categories[0] || '');

  useEffect(() => {
    if (activeDepartment) {
      setDepartment(activeDepartment);
    } else if (categories.length > 0 && (!department || !categories.includes(department))) {
      setDepartment(categories[0]);
    }
  }, [activeDepartment, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    const finalDept = department || activeDepartment || categories[0] || 'General';
    onAddSubject(subjectName.trim(), Number(targetCount) || 4, finalDept);
    setSubjectName('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bubble">
              <BookOpen size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="modal-title">Track New Subject / Course</h3>
              <p className="modal-subtitle">
                {activeDepartment
                  ? `Add course to ${activeDepartment}`
                  : 'Add course to department curriculum'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Subject / Course Name *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Math, Urdu, Artificial Intelligence"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              list="subject-name-options"
              autoFocus
            />
            {existingSubjects && existingSubjects.length > 0 && (
              <datalist id="subject-name-options">
                {Array.from(new Set(existingSubjects)).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Weekly Classes Target</label>
            <input
              type="number"
              min="1"
              max="10"
              className="form-input"
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value)}
            />
            <small className="form-hint">Standard university quota is 4 classes/week.</small>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Add Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
