import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Trash2,
  GripVertical,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import { getTeacherColor } from '../data/teacherColors';
import { DAYS_LIST, getLectureDays } from '../utils/conflictDetector';

export default function LectureTile({
  lecture,
  teachersList,
  subjectsList,
  customColors,
  isCompletedSubject,
  isExceededSubject,
  hasConflict,
  conflictInfo,
  isHighlighted,
  onUpdateLecture,
  onDeleteLecture,
  onDragStart,
  onDragEnd,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeField, setActiveField] = useState('subject'); // 'subject' | 'teacher' | 'room' | 'day'
  const [subjectVal, setSubjectVal] = useState(lecture.subject || '');
  const [teacherVal, setTeacherVal] = useState(lecture.teacher || '');
  const [roomVal, setRoomVal] = useState(lecture.room || '');
  const [editDays, setEditDays] = useState(getLectureDays(lecture));

  const subjectInputRef = useRef(null);
  const teacherInputRef = useRef(null);
  const roomInputRef = useRef(null);
  const tileRef = useRef(null);

  // Sync state when lecture prop changes
  useEffect(() => {
    setSubjectVal(lecture.subject || '');
    setTeacherVal(lecture.teacher || '');
    setRoomVal(lecture.room || '');
    setEditDays(getLectureDays(lecture));
  }, [lecture.subject, lecture.teacher, lecture.room, lecture.days, lecture.day]);

  // Focus the specific field when entering edit mode
  useEffect(() => {
    if (isEditing) {
      if (activeField === 'subject' && subjectInputRef.current) {
        subjectInputRef.current.focus();
        subjectInputRef.current.select();
      } else if (activeField === 'teacher' && teacherInputRef.current) {
        teacherInputRef.current.focus();
        teacherInputRef.current.select();
      } else if (activeField === 'room' && roomInputRef.current) {
        roomInputRef.current.focus();
        roomInputRef.current.select();
      }
    }
  }, [isEditing, activeField]);

  const teacherColors = getTeacherColor(lecture.teacher, customColors);

  const handleTileClick = (e, field = 'subject') => {
    if (e.target.closest('.no-edit')) return;
    setActiveField(field);
    setIsEditing(true);
  };

  const toggleEditDay = (day) => {
    setEditDays((prev) => {
      let next;
      if (prev.includes(day)) {
        if (prev.length === 1) return prev; // Keep at least one day
        next = prev.filter((d) => d !== day);
      } else {
        next = [...prev, day];
      }
      return DAYS_LIST.filter((d) => next.includes(d));
    });
  };

  const saveChanges = () => {
    setIsEditing(false);
    const finalDays = editDays.length > 0 ? editDays : ['Mon'];
    const updated = {
      ...lecture,
      subject: subjectVal.trim() || 'Untitled Subject',
      teacher: teacherVal.trim() || 'Unassigned',
      room: roomVal.trim() || 'TBA',
      days: finalDays,
      day: finalDays.join(', '),
    };
    onUpdateLecture(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveChanges();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setSubjectVal(lecture.subject);
      setTeacherVal(lecture.teacher);
      setRoomVal(lecture.room);
      setEditDays(getLectureDays(lecture));
    }
  };

  const handleDragStart = (e) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', lecture.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(lecture);
  };

  const dynamicTileStyle = {
    backgroundColor: teacherColors.bg,
    borderColor: hasConflict ? '#ef4444' : teacherColors.border,
    color: teacherColors.text,
  };

  const daysList = getLectureDays(lecture);
  const clashDays = conflictInfo
    ? [...new Set(conflictInfo.map((c) => c.day))].join(', ')
    : daysList.join(', ');

  return (
    <div
      ref={tileRef}
      className={`lecture-tile ${hasConflict ? 'has-conflict' : ''} ${
        isHighlighted ? 'is-highlighted' : ''
      } ${isEditing ? 'is-editing' : ''}`}
      style={dynamicTileStyle}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      title={
        hasConflict
          ? `Clash on ${clashDays}: ${conflictInfo
              ?.map((c) =>
                c.otherLectures.map((o) => `${o.program} (${o.subject})`).join(', ')
              )
              .join(' | ')}`
          : `Scheduled on ${daysList.join(', ')} • Click to edit, drag to move`
      }
    >
      {/* Accent left indicator stripe */}
      <div
        className="tile-accent-stripe"
        style={{ backgroundColor: hasConflict ? '#ef4444' : teacherColors.accent }}
      />

      {/* Top badges bar */}
      <div className="tile-header">
        <div className="tile-header-left">
          <div className="tile-drag-handle" title="Drag to move">
            <GripVertical size={13} className="drag-icon text-muted" />
          </div>

          {/* Requirement 1: Multi-day badges group on tile */}
          <div
            className="badge-days-group"
            onClick={(e) => handleTileClick(e, 'day')}
            title={`Scheduled on ${daysList.join(', ')} (click to edit days)`}
          >
            {daysList.map((d) => (
              <span key={d} className="badge-day">
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="tile-badges">
          {/* Conflict Warning Badge (Only shows if clash on same day!) */}
          {hasConflict && (
            <span
              className="badge-clash"
              title={`Conflict: Teacher or Room double-booked on ${clashDays} at this time slot!`}
            >
              <AlertTriangle size={12} /> Clash
            </span>
          )}

          {/* Subject Completed (4/4) Badge */}
          {isCompletedSubject && !hasConflict && (
            <span className="badge-complete" title="Target 4/4 lectures reached!">
              <CheckCircle2 size={13} className="text-emerald" />
            </span>
          )}

          {/* Exceeded Subject (>4) Badge */}
          {isExceededSubject && !hasConflict && (
            <span className="badge-exceeded" title="Exceeded 4 lectures limit!">
              <AlertTriangle size={12} className="text-red" />
            </span>
          )}

          {/* Delete Button */}
          <button
            type="button"
            className="no-edit tile-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteLecture(lecture.id);
            }}
            title="Delete lecture"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Tile Content (Editable on single click) */}
      <div className="tile-body">
        {isEditing ? (
          <div className="tile-inline-editor">
            {/* Multi-day Selector in inline editor */}
            <div className="editor-row editor-days-row">
              <Calendar size={11} className="input-icon" />
              <div className="tile-inline-days-picker no-edit">
                {DAYS_LIST.map((d) => {
                  const isSel = editDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`tile-day-btn ${isSel ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEditDay(d);
                      }}
                      title={isSel ? `Deselect ${d}` : `Select ${d}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Input */}
            <div className="editor-row">
              <input
                ref={subjectInputRef}
                type="text"
                className="tile-input subject-input"
                value={subjectVal}
                placeholder="Subject Name"
                onChange={(e) => setSubjectVal(e.target.value)}
                onKeyDown={handleKeyDown}
                list="subjects-datalist"
              />
            </div>

            {/* Teacher Input */}
            <div className="editor-row">
              <User size={11} className="input-icon" />
              <input
                ref={teacherInputRef}
                type="text"
                className="tile-input teacher-input"
                value={teacherVal}
                placeholder="Teacher Name"
                onChange={(e) => setTeacherVal(e.target.value)}
                onKeyDown={handleKeyDown}
                list="teachers-datalist"
              />
            </div>

            {/* Room Input */}
            <div className="editor-row">
              <MapPin size={11} className="input-icon" />
              <input
                ref={roomInputRef}
                type="text"
                className="tile-input room-input"
                value={roomVal}
                placeholder="Room / Lab"
                onChange={(e) => setRoomVal(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Save / Done button */}
            <div className="editor-actions no-edit">
              <button
                type="button"
                className="editor-btn save-btn"
                onClick={saveChanges}
              >
                Done (Enter)
              </button>
            </div>
          </div>
        ) : (
          <div
            className="tile-display-content"
            onClick={(e) => handleTileClick(e, 'subject')}
          >
            {/* Subject */}
            <h5
              className="tile-subject"
              onClick={(e) => handleTileClick(e, 'subject')}
              title="Click to edit subject"
            >
              {lecture.subject || 'Untitled'}
            </h5>

            {/* Teacher Name */}
            <div
              className="tile-teacher-row"
              onClick={(e) => handleTileClick(e, 'teacher')}
              title="Click to edit teacher"
            >
              <User size={11} className="tile-icon" />
              <span className="tile-teacher">{lecture.teacher || 'Unassigned'}</span>
            </div>

            {/* Room */}
            {lecture.room && (
              <div
                className="tile-room-row"
                onClick={(e) => handleTileClick(e, 'room')}
                title="Click to edit room"
              >
                <MapPin size={10} className="tile-icon-xs" />
                <span className="tile-room">{lecture.room}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Datalists for autocompletion */}
      <datalist id="subjects-datalist">
        {subjectsList?.map((sub) => (
          <option key={sub} value={sub} />
        ))}
      </datalist>

      <datalist id="teachers-datalist">
        {teachersList?.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}
