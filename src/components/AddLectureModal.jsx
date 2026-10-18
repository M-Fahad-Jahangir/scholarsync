import React, { useState, useEffect } from 'react';
import {
  Plus,
  X,
  AlertTriangle,
  Calendar,
  User,
  BookOpen,
  MapPin,
  Clock,
  Coffee,
} from 'lucide-react';
import { willCauseClash, DAYS_LIST } from '../utils/conflictDetector';

export default function AddLectureModal({
  isOpen,
  onClose,
  initialSlot = null, // { timeSlot, program }
  programs = [],
  timeSlots = [],
  teachersList = [],
  subjectsList = [],
  lectures = [],
  onAddLecture,
  onAddBreak,
}) {
  // Requirement 1: Multi-select days (can select multiple days for a single lecture)
  const [selectedDays, setSelectedDays] = useState(['Mon']);
  const [isBreak, setIsBreak] = useState(false);
  const [breakTime, setBreakTime] = useState('');

  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [timeSlot, setTimeSlot] = useState(
    timeSlots.find((s) => !s.isBreak)?.time || '08:00 - 08:45'
  );
  const [room, setRoom] = useState('');

  // Target class is established directly from the column/cell clicked
  const targetProgram = initialSlot?.program || programs[0] || 'Default Class';

  // When initialSlot is provided from clicking a specific cell
  useEffect(() => {
    if (initialSlot) {
      if (initialSlot.timeSlot) {
        setTimeSlot(initialSlot.timeSlot);
        setBreakTime(initialSlot.timeSlot);
      }
    }
  }, [initialSlot]);

  useEffect(() => {
    if (!breakTime) {
      setBreakTime(timeSlot || '10:15 - 10:45');
    }
  }, [timeSlot]);

  if (!isOpen) return null;

  // Requirement 1: Toggle day in multi-select (keeps at least 1 day selected)
  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      let next;
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        next = prev.filter((d) => d !== day);
      } else {
        next = [...prev, day];
      }
      return DAYS_LIST.filter((d) => next.includes(d));
    });
  };

  const handleSelectWeekdays = () => {
    setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  };

  const handleSelectAllDays = () => {
    setSelectedDays([...DAYS_LIST]);
  };

  // Requirement 1: Conflict detection across any of the selected days for this teacher & time slot
  const clash = willCauseClash(timeSlot, targetProgram, teacher, null, lectures, selectedDays);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Requirement 2: Clean break addition with custom time (hh:mm - hh:mm)
    if (isBreak) {
      const finalBreakTime = (breakTime && breakTime.trim()) || timeSlot;
      if (onAddBreak) {
        onAddBreak(targetProgram, timeSlot, finalBreakTime);
      }
      onClose();
      setIsBreak(false);
      return;
    }

    // Lecture mode validation
    if (!subject.trim()) {
      alert('Please enter a subject name');
      return;
    }
    if (!teacher.trim()) {
      alert('Please enter or select a teacher name');
      return;
    }

    const daysToSave = selectedDays.length > 0 ? selectedDays : ['Mon'];

    const newLecture = {
      id: `lec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      subject: subject.trim(),
      teacher: teacher.trim(),
      program: targetProgram,
      timeSlot,
      days: daysToSave, // Multi-select days array
      day: daysToSave.join(', '), // Comma-separated string for display & backwards compatibility
      room: room.trim() || 'Room TBA',
    };

    onAddLecture(newLecture);
    onClose();
    // reset form
    setSubject('');
    setTeacher('');
    setRoom('');
    setIsBreak(false);
    setSelectedDays(['Mon']);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className={`modal-icon-bubble ${isBreak ? 'bubble-break' : ''}`}>
              {isBreak ? (
                <Coffee size={20} className="text-red" />
              ) : (
                <Plus size={20} className="text-primary" />
              )}
            </div>
            <div>
              <div className="modal-title-row">
                <h3 className="modal-title">
                  {isBreak ? 'Add Break Period' : 'Add Lecture Assignment'}
                </h3>
                {targetProgram && (
                  <span className="modal-target-class-badge" title="Target Class">
                    {targetProgram}
                  </span>
                )}
              </div>
              <p className="modal-subtitle">
                {isBreak
                  ? `Schedule a break for ${targetProgram}`
                  : `Schedule a class session for ${targetProgram}`}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Simple Clean Break Option Field with its time */}
          <div className="break-option-card">
            <label className="break-checkbox-label">
              <input
                type="checkbox"
                checked={isBreak}
                onChange={(e) => setIsBreak(e.target.checked)}
                className="break-checkbox-input"
              />
              <Coffee size={15} className="text-red" />
              <span className="break-checkbox-text">Set as Break</span>
            </label>

            {isBreak && (
              <div className="break-time-field-wrap">
                <input
                  type="text"
                  className="form-input form-input-sm break-custom-time-input"
                  placeholder="Break time (hh:mm - hh:mm)"
                  value={breakTime}
                  onChange={(e) => setBreakTime(e.target.value)}
                  title="Break time format: hh:mm - hh:mm"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* If NOT break: Show Multi-select Days, Subject, and Teacher */}
          {!isBreak && (
            <>
              {/* Requirement 1: Multi-select Days of the Week */}
              <div className="form-group">
                <div className="day-selector-header">
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    <Calendar size={14} /> Days of the Week * ({selectedDays.length} selected)
                  </label>
                  <div className="day-quick-actions">
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={handleSelectWeekdays}
                      title="Select Monday through Friday"
                    >
                      Mon–Fri
                    </button>
                    <span className="action-divider">•</span>
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={handleSelectAllDays}
                      title="Select all days"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="day-selector-group">
                  {DAYS_LIST.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        className={`day-pill-btn ${isSelected ? 'is-active' : ''}`}
                        onClick={() => toggleDay(day)}
                        title={isSelected ? `Remove ${day}` : `Add ${day}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Field */}
              <div className="form-group">
                <label className="form-label">
                  <BookOpen size={14} /> Subject Name *
                </label>
                <input
                  type="text"
                  required={!isBreak}
                  className="form-input"
                  placeholder="e.g. Data Structures, Cloud Computing"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  list="modal-subjects-list"
                  autoFocus={!isBreak}
                />
                <datalist id="modal-subjects-list">
                  {subjectsList.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              {/* Teacher Field */}
              <div className="form-group">
                <label className="form-label">
                  <User size={14} /> Teacher *
                </label>
                <input
                  type="text"
                  required={!isBreak}
                  className="form-input"
                  placeholder="e.g. Sir Fahad, Ms. Insha Naz"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  list="modal-teachers-list"
                />
                <datalist id="modal-teachers-list">
                  {teachersList.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              {/* Requirement 1: Conflict Preview Alert across selected days */}
              {clash && (
                <div className="modal-clash-warning">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>Timeline Conflict Warning ({clash.day}):</strong>
                    <p>
                      {clash.teacher} is already assigned to {clash.conflictingProgram} (
                      {clash.subject}) on <strong>{clash.day}</strong> at {clash.timeSlot}!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Timeline Row Slot (Full Width - Class/Program selection field removed per Requirement 2) */}
          <div className="form-group">
            <label className="form-label">
              <Clock size={14} /> Timeline Row
            </label>
            <select
              className="form-input form-select"
              value={timeSlot}
              onChange={(e) => {
                setTimeSlot(e.target.value);
                if (isBreak && (!breakTime || breakTime === timeSlot)) {
                  setBreakTime(e.target.value);
                }
              }}
            >
              {timeSlots.map((s) => (
                <option key={s.id} value={s.time}>
                  {s.time}
                </option>
              ))}
            </select>
          </div>

          {/* Room / Lab (Lecture mode only) */}
          {!isBreak && (
            <div className="form-group">
              <label className="form-label">
                <MapPin size={14} /> Room or Lab
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Room 204, Lab 2, Hall 1"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            {isBreak ? (
              <button type="submit" className="btn btn-danger-break">
                <Coffee size={16} /> Schedule Break
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Schedule Lecture
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
