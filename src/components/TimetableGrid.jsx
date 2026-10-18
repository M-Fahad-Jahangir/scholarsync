import React, { useState, useMemo } from 'react';
import LectureTile from './LectureTile';
import {
  Plus,
  Coffee,
  Layers,
  GraduationCap,
  Share2,
  Check,
  X,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { willCauseClash } from '../utils/conflictDetector';

export default function TimetableGrid({
  programs,
  timeSlots,
  lectures,
  classBreaks = [],
  categories = [],
  categoryMappings = {},
  conflictMap,
  subjectProgress,
  teachersList,
  subjectsList,
  customColors,
  selectedSubjectFilter,
  highlightedLectureIds,
  onUpdateLecture,
  onDeleteLecture,
  onMoveLecture,
  onAddLectureToSlot,
  onOpenAddDepartment,
  onOpenAddTab,
  onOpenAddColumn,
  onUpdateSlotTime,
  onDeleteClass,
  onRenameClass,
  onReorderPrograms,
  onDeleteTimeSlot,
  onAddTimeSlot,
  onMoveBreak,
  onAddBreak,
  onDeleteBreak,
  onUpdateBreakTime,
  onOpenShareModal,
}) {
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'lecture'|'break', data: ... }
  const [dragOverSlot, setDragOverSlot] = useState(null); // { timeSlot, program }
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL'); // 'ALL' | Category Name | specific program name

  // Column reordering drag-and-drop state
  const [draggedColProg, setDraggedColProg] = useState(null);
  const [dragOverColProg, setDragOverColProg] = useState(null);

  // Inline time editing state
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editingTimeVal, setEditingTimeVal] = useState('');

  // Inline break time editing state (Requirement 2)
  const [editingBreakId, setEditingBreakId] = useState(null);
  const [editingBreakTimeVal, setEditingBreakTimeVal] = useState('');

  // Inline column header (class name) editing state
  const [editingProgName, setEditingProgName] = useState(null);
  const [editingProgVal, setEditingProgVal] = useState('');

  // Check which subjects are complete (count === 4) or exceeded (> 4)
  const completedSubjects = new Set(
    subjectProgress.filter((s) => s.count === 4).map((s) => s.subject.toLowerCase())
  );
  const exceededSubjects = new Set(
    subjectProgress.filter((s) => s.count > 4).map((s) => s.subject.toLowerCase())
  );

  // Helper to resolve which category a program belongs to
  const getProgramCategory = (prog) => {
    if (categoryMappings[prog]) return categoryMappings[prog];
    if (/eng/i.test(prog)) return 'BS English';
    if (/cs|it|comput/i.test(prog)) return 'BS IT / CS';
    if (/inter|fsc|ics|fa|11th|12th/i.test(prog)) return 'Inter';
    return null;
  };

  // Group programs by categories
  const categoryProgramMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat] = [];
    });
    programs.forEach((prog) => {
      const cat = getProgramCategory(prog);
      if (cat && map[cat]) {
        map[cat].push(prog);
      } else if (cat) {
        map[cat] = [prog];
      }
    });
    return map;
  }, [programs, categories, categoryMappings]);

  // Uncategorized programs (appear as individual chips in All Classes)
  const uncategorizedPrograms = useMemo(() => {
    return programs.filter((p) => !getProgramCategory(p));
  }, [programs, categoryMappings]);

  // Filter visible programs based on selected tab / category
  const visiblePrograms = useMemo(() => {
    if (selectedClassFilter === 'ALL') return programs;
    if (categoryProgramMap[selectedClassFilter]) {
      return categoryProgramMap[selectedClassFilter];
    }
    // Specific single program selected
    return programs.filter((p) => p === selectedClassFilter);
  }, [programs, selectedClassFilter, categoryProgramMap]);

  // =========================================================================
  // Drag and Drop: Lectures & Breaks
  // =========================================================================
  const handleDragStartLecture = (lecture) => {
    setDraggedItem({ type: 'lecture', data: lecture });
  };

  const handleDragStartBreak = (e, breakItem) => {
    e.dataTransfer.setData('text/plain', breakItem.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ type: 'break', data: breakItem });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e, timeSlot, program) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverSlot || dragOverSlot.timeSlot !== timeSlot || dragOverSlot.program !== program) {
      setDragOverSlot({ timeSlot, program });
    }
  };

  const handleDragLeave = (e, timeSlot, program) => {
    e.preventDefault();
    if (dragOverSlot && dragOverSlot.timeSlot === timeSlot && dragOverSlot.program === program) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = (e, timeSlot, program) => {
    e.preventDefault();
    if (draggedItem?.type === 'break') {
      if (onMoveBreak) {
        onMoveBreak(draggedItem.data.id, timeSlot, program);
      }
    } else {
      const lectureId = e.dataTransfer.getData('text/plain') || draggedItem?.data?.id;
      if (lectureId && onMoveLecture) {
        onMoveLecture(lectureId, timeSlot, program);
      }
    }
    setDraggedItem(null);
    setDragOverSlot(null);
  };

  // =========================================================================
  // Drag and Drop: Column Reordering (Requirement 4)
  // =========================================================================
  const handleColDragStart = (e, prog) => {
    if (editingProgName === prog) return;
    e.dataTransfer.setData('text/col', prog);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColProg(prog);
  };

  const handleColDragOver = (e, prog) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColProg !== prog) {
      setDragOverColProg(prog);
    }
  };

  const handleColDragLeave = () => {
    setDragOverColProg(null);
  };

  const handleColDrop = (e, targetProg) => {
    e.preventDefault();
    const sourceProg = e.dataTransfer.getData('text/col') || draggedColProg;
    if (sourceProg && targetProg && sourceProg !== targetProg && onReorderPrograms) {
      onReorderPrograms(sourceProg, targetProg);
    }
    setDraggedColProg(null);
    setDragOverColProg(null);
  };

  const handleColDragEnd = () => {
    setDraggedColProg(null);
    setDragOverColProg(null);
  };

  // =========================================================================
  // Time Editing Handlers
  // =========================================================================
  const startEditingTime = (slotId, currentTime) => {
    setEditingSlotId(slotId);
    setEditingTimeVal(currentTime);
  };

  const saveEditingTime = (slotId, oldTime) => {
    const clean = editingTimeVal.trim();
    if (clean && clean !== oldTime && onUpdateSlotTime) {
      onUpdateSlotTime(slotId, oldTime, clean);
    }
    setEditingSlotId(null);
  };

  const cancelEditingTime = () => {
    setEditingSlotId(null);
    setEditingTimeVal('');
  };

  const handleTimeKeyDown = (e, slotId, oldTime) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditingTime(slotId, oldTime);
    } else if (e.key === 'Escape') {
      cancelEditingTime();
    }
  };

  // =========================================================================
  // Break Time Editing Handlers (Requirement 2: set time of the break)
  // =========================================================================
  const startEditingBreakTime = (breakItem, defaultTime) => {
    setEditingBreakId(breakItem.id);
    setEditingBreakTimeVal(breakItem.time || breakItem.timeSlot || defaultTime);
  };

  const saveEditingBreakTime = (breakId) => {
    const clean = editingBreakTimeVal.trim();
    if (clean && onUpdateBreakTime) {
      onUpdateBreakTime(breakId, clean);
    }
    setEditingBreakId(null);
    setEditingBreakTimeVal('');
  };

  const cancelEditingBreakTime = () => {
    setEditingBreakId(null);
    setEditingBreakTimeVal('');
  };

  // =========================================================================
  // Column Header (Class Name) Editing Handlers (Requirement 3)
  // =========================================================================
  const startEditingProg = (prog) => {
    setEditingProgName(prog);
    setEditingProgVal(prog);
  };

  const saveEditingProg = (oldProg) => {
    const clean = editingProgVal.trim();
    if (clean && clean !== oldProg && onRenameClass) {
      onRenameClass(oldProg, clean);
    }
    setEditingProgName(null);
    setEditingProgVal('');
  };

  const cancelEditingProg = () => {
    setEditingProgName(null);
    setEditingProgVal('');
  };

  // Delete Column Handler
  const handleDeleteColumn = (e, progName) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete entire column "${progName}"?\nThis will remove the class and all lectures scheduled in it.`
    );
    if (confirmed && onDeleteClass) {
      onDeleteClass(progName);
    }
  };

  // Delete Row Handler
  const handleDeleteRow = (e, slotId, timeString) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete entire time row "${timeString}"?\nAll lectures scheduled in this time slot will be removed.`
    );
    if (confirmed && onDeleteTimeSlot) {
      onDeleteTimeSlot(slotId, timeString);
    }
  };

  // Add Time Row Handler
  const handleAddNewTimeRow = () => {
    const newTime = window.prompt(
      'Enter time slot for the new row (e.g. 13:00 - 13:45):',
      '13:00 - 13:45'
    );
    if (newTime && newTime.trim() && onAddTimeSlot) {
      onAddTimeSlot(newTime.trim());
    }
  };

  return (
    <div className="timetable-section-card" id="timetable-section-container">
      {/* Header of Weekly Timetable with Save / WhatsApp Share Button */}
      <div className="timetable-section-header">
        <div className="timetable-title-group">
          <div className="section-icon-bubble">
            <GraduationCap size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="timetable-title">Weekly Lecture Timetable</h3>
            <span className="timetable-hint">
              💡 Drag breaks & lectures • Click class header to rename • Drag columns to reorder • Full image export
            </span>
          </div>
        </div>

        <div className="timetable-header-actions">
          <span className="active-view-badge">
            Showing {visiblePrograms.length} of {programs.length} classes
          </span>

          {/* Save / WhatsApp Share Button */}
          {onOpenShareModal && (
            <button
              type="button"
              className="btn btn-whatsapp-timetable"
              onClick={onOpenShareModal}
              title="Save screenshot of Weekly Timetable (PNG / JPG) or share on WhatsApp"
            >
              <Share2 size={16} /> Save / WhatsApp Share
            </button>
          )}
        </div>
      </div>

      {/* Class Selection Buttons Toolbar (Requirement 5: Add Tab button) */}
      <div className="class-selection-toolbar">
        <div className="class-selection-header">
          <span className="class-toolbar-label">
            <Layers size={13} /> Department Selection:
          </span>
        </div>

        {/* Clean Single Row of Category Switcher Tabs */}
        <div className="class-button-groups">
          {/* All Classes */}
          <button
            type="button"
            className={`class-switcher-btn ${selectedClassFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setSelectedClassFilter('ALL')}
          >
            All Classes <span className="btn-badge">{programs.length}</span>
          </button>

          {/* Dynamic Category Tabs (BS English, BS IT/CS, Inter, and user-added tabs) */}
          {categories.map((cat) => {
            const catClasses = categoryProgramMap[cat] || [];
            const isSelected = selectedClassFilter === cat;

            return (
              <button
                key={cat}
                type="button"
                className={`class-switcher-btn ${isSelected ? 'is-active' : ''}`}
                onClick={() => setSelectedClassFilter(cat)}
              >
                <span>{cat}</span>
                <span className="btn-badge">{catClasses.length}</span>
              </button>
            );
          })}

          {/* Any uncategorized individual classes */}
          {uncategorizedPrograms.map((prog) => {
            const isSelected = selectedClassFilter === prog;
            const progLecCount = lectures.filter((l) => l.program === prog).length;

            return (
              <button
                key={prog}
                type="button"
                className={`class-switcher-btn ${isSelected ? 'is-active' : ''}`}
                onClick={() => setSelectedClassFilter(isSelected ? 'ALL' : prog)}
                title={`Filter timetable to only ${prog}`}
              >
                <span>{prog}</span>
                <span className="btn-badge">{progLecCount}</span>
              </button>
            );
          })}

          {/* Add Department button in toolbar */}
          {(onOpenAddDepartment || onOpenAddTab) && (
            <button
              type="button"
              className="class-switcher-btn btn-add-tab-toolbar"
              onClick={onOpenAddDepartment || onOpenAddTab}
              title="Add a new academic department (e.g. BS Mathematics, BBA, etc.)"
            >
              <Plus size={13} /> Add Department
            </button>
          )}
        </div>
      </div>

      {/* Main Timetable Matrix with Scrollbar & Min-Width 150px per column */}
      <div className="timetable-container" id="timetable-capture-area">
        <div className="timetable-scroll-wrapper">
          <table className="timetable-grid">
            <thead>
              <tr>
                <th className="th-time">
                  <div className="time-header-wrapper">
                    <span>Time</span>
                  </div>
                </th>

                {/* Visible Class Columns with Drag Reordering & Direct Inline Renaming */}
                {visiblePrograms.map((prog) => {
                  const isEditingThisProg = editingProgName === prog;
                  const isDraggingCol = draggedColProg === prog;
                  const isDragOverCol = dragOverColProg === prog;

                  return (
                    <th
                      key={prog}
                      className={`th-program ${isDraggingCol ? 'is-col-dragging' : ''} ${
                        isDragOverCol ? 'is-col-dragover' : ''
                      }`}
                      draggable={!isEditingThisProg}
                      onDragStart={(e) => handleColDragStart(e, prog)}
                      onDragOver={(e) => handleColDragOver(e, prog)}
                      onDragLeave={handleColDragLeave}
                      onDrop={(e) => handleColDrop(e, prog)}
                      onDragEnd={handleColDragEnd}
                      title={!isEditingThisProg ? 'Click name to rename • Drag to reorder column' : ''}
                    >
                      <div className="program-header-cell">
                        {isEditingThisProg ? (
                          <div
                            className="inline-prog-editor"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              className="inline-prog-input"
                              value={editingProgVal}
                              onChange={(e) => setEditingProgVal(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditingProg(prog);
                                if (e.key === 'Escape') cancelEditingProg();
                              }}
                              autoFocus
                            />
                            <div className="prog-editor-actions">
                              <button
                                type="button"
                                className="time-action-btn check-btn"
                                onClick={() => saveEditingProg(prog)}
                                title="Save name (Enter)"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                type="button"
                                className="time-action-btn cancel-btn"
                                onClick={cancelEditingProg}
                                title="Cancel (Esc)"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="prog-header-top-row">
                            <span
                              className="prog-header-name clickable-prog-name"
                              onClick={() => startEditingProg(prog)}
                              title="Click to rename class"
                            >
                              <GripVertical size={11} className="col-grip-icon" />
                              <span className="prog-name-text">{prog}</span>
                              <span className="edit-hint-dot">✎</span>
                            </span>

                            {/* Option to Delete Entire Column */}
                            <button
                              type="button"
                              className="btn-header-delete-col"
                              onClick={(e) => handleDeleteColumn(e, prog)}
                              title={`Delete column "${prog}" and all its classes`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}

                        <span className="prog-header-count">
                          {lectures.filter((l) => l.program === prog).length} lec
                        </span>
                      </div>
                    </th>
                  );
                })}

                {/* Requirement 5: "+ Add Column" Button at the end of the table */}
                {onOpenAddColumn && (
                  <th className="th-add-column">
                    <button
                      type="button"
                      className="btn-add-column-header"
                      onClick={() =>
                        onOpenAddColumn(
                          selectedClassFilter !== 'ALL' ? selectedClassFilter : ''
                        )
                      }
                      title="Add a new class column to timetable"
                    >
                      <Plus size={13} /> Add Column
                    </button>
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {visiblePrograms.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="empty-tab-banner"
                    style={{ textAlign: 'center', padding: '40px 20px' }}
                  >
                    <div className="empty-tab-state">
                      <GraduationCap
                        size={32}
                        className="text-primary"
                        style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }}
                      />
                      <p style={{ fontWeight: 600, color: '#475569', marginBottom: 12 }}>
                        No class columns in <strong>{selectedClassFilter}</strong> yet.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onOpenAddColumn(selectedClassFilter)}
                      >
                        <Plus size={15} /> Add First Column to {selectedClassFilter}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                timeSlots.map((slot) => {
                  const isEditingThisSlot = editingSlotId === slot.id;

                  return (
                    <tr key={slot.id} className="row-slot">
                      {/* Time Slot Column */}
                      <td
                        className={`cell-time clickable-time-cell ${
                          isEditingThisSlot ? 'cell-time-editing' : ''
                        }`}
                        onClick={() =>
                          !isEditingThisSlot && startEditingTime(slot.id, slot.time)
                        }
                        title="Click to edit time slot"
                      >
                        {isEditingThisSlot ? (
                          <div
                            className="inline-time-editor"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              className="inline-time-input"
                              value={editingTimeVal}
                              onChange={(e) => setEditingTimeVal(e.target.value)}
                              onKeyDown={(e) => handleTimeKeyDown(e, slot.id, slot.time)}
                              autoFocus
                            />
                            <div className="time-editor-actions">
                              <button
                                type="button"
                                className="time-action-btn check-btn"
                                onClick={() => saveEditingTime(slot.id, slot.time)}
                                title="Save time (Enter)"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                className="time-action-btn cancel-btn"
                                onClick={cancelEditingTime}
                                title="Cancel (Esc)"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="time-display-wrapper">
                            <span className="time-badge">{slot.time}</span>
                            {/* Option to Delete Entire Row */}
                            <button
                              type="button"
                              className="btn-row-delete"
                              onClick={(e) => handleDeleteRow(e, slot.id, slot.time)}
                              title={`Delete time row "${slot.time}"`}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Class Column Cells with Independent Draggable Breaks & Lectures */}
                      {visiblePrograms.map((prog) => {
                        const cellLectures = lectures.filter(
                          (l) => l.timeSlot === slot.time && l.program === prog
                        );

                        // Requirement 2: Breaks are per-column and draggable
                        const cellBreaks = classBreaks.filter(
                          (b) => b.timeSlot === slot.time && b.program === prog
                        );

                        const isDragOver =
                          dragOverSlot &&
                          dragOverSlot.timeSlot === slot.time &&
                          dragOverSlot.program === prog;

                        const potentialClash =
                          isDragOver && draggedItem?.type === 'lecture'
                            ? willCauseClash(
                                slot.time,
                                prog,
                                draggedItem.data.teacher,
                                draggedItem.data.id,
                                lectures,
                                draggedItem.data.days || draggedItem.data.day || 'Mon'
                              )
                            : null;

                        const isEmpty =
                          cellLectures.length === 0 && cellBreaks.length === 0;

                        return (
                          <td
                            key={`${slot.id}-${prog}`}
                            className={`cell-slot ${
                              isDragOver ? 'slot-drag-over' : ''
                            } ${potentialClash ? 'slot-clash-warning' : ''}`}
                            onDragOver={(e) => handleDragOver(e, slot.time, prog)}
                            onDragLeave={(e) => handleDragLeave(e, slot.time, prog)}
                            onDrop={(e) => handleDrop(e, slot.time, prog)}
                          >
                            <div className="cell-inner-stack">
                              {/* Lectures in this slot (Rendered FIRST) */}
                              {cellLectures.map((lec) => {
                                const hasConflict = !!conflictMap[lec.id];
                                const isSubjectCompleted = completedSubjects.has(
                                  lec.subject?.toLowerCase()
                                );
                                const isSubjectExceeded = exceededSubjects.has(
                                  lec.subject?.toLowerCase()
                                );

                                let isHighlighted = false;
                                if (highlightedLectureIds?.includes(lec.id)) {
                                  isHighlighted = true;
                                } else if (selectedSubjectFilter) {
                                  isHighlighted =
                                    lec.subject?.toLowerCase() ===
                                    selectedSubjectFilter.toLowerCase();
                                }

                                return (
                                  <LectureTile
                                    key={lec.id}
                                    lecture={lec}
                                    teachersList={teachersList}
                                    subjectsList={subjectsList}
                                    customColors={customColors}
                                    isCompletedSubject={isSubjectCompleted}
                                    isExceededSubject={isSubjectExceeded}
                                    hasConflict={hasConflict}
                                    conflictInfo={conflictMap[lec.id]}
                                    isHighlighted={isHighlighted}
                                    onUpdateLecture={onUpdateLecture}
                                    onDeleteLecture={onDeleteLecture}
                                    onDragStart={handleDragStartLecture}
                                    onDragEnd={handleDragEnd}
                                  />
                                );
                              })}

                              {/* Requirement 1 & 2: Break Sub-Cell with Editable Time (hh:mm - hh:mm) */}
                              {cellBreaks.map((breakItem) => {
                                const isEditingThisBreak = editingBreakId === breakItem.id;
                                const displayBreakTime =
                                  breakItem.time || breakItem.timeSlot || slot.time;

                                return (
                                  <div
                                    key={breakItem.id}
                                    className="subcell-break-block"
                                    draggable={!isEditingThisBreak}
                                    onDragStart={(e) =>
                                      handleDragStartBreak(e, breakItem)
                                    }
                                    onDragEnd={handleDragEnd}
                                    title={!isEditingThisBreak ? 'Drag to move break • Click time to edit' : ''}
                                  >
                                    {isEditingThisBreak ? (
                                      <div
                                        className="inline-break-editor"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="text"
                                          className="inline-break-input"
                                          value={editingBreakTimeVal}
                                          placeholder="hh:mm - hh:mm"
                                          onChange={(e) =>
                                            setEditingBreakTimeVal(e.target.value)
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter')
                                              saveEditingBreakTime(breakItem.id);
                                            if (e.key === 'Escape')
                                              cancelEditingBreakTime();
                                          }}
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          className="time-action-btn check-btn"
                                          onClick={() =>
                                            saveEditingBreakTime(breakItem.id)
                                          }
                                          title="Save break time (Enter)"
                                        >
                                          <Check size={11} />
                                        </button>
                                        <button
                                          type="button"
                                          className="time-action-btn cancel-btn"
                                          onClick={cancelEditingBreakTime}
                                          title="Cancel (Esc)"
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="subcell-break-content">
                                        <Coffee
                                          size={13}
                                          className="subcell-break-icon"
                                        />
                                        <span className="subcell-break-text">
                                          BREAK
                                        </span>
                                        <span
                                          className="subcell-break-time-badge"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditingBreakTime(breakItem, slot.time);
                                          }}
                                          title="Click to edit break time (hh:mm - hh:mm)"
                                        >
                                          {displayBreakTime}
                                          <span className="break-edit-pen">✎</span>
                                        </span>
                                      </div>
                                    )}

                                    {!isEditingThisBreak && (
                                      <button
                                        type="button"
                                        className="btn-delete-break"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onDeleteBreak) {
                                            onDeleteBreak(breakItem.id);
                                          }
                                        }}
                                        title="Remove break from this cell"
                                      >
                                        <X size={11} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Empty State or Stack Actions */}
                              {isEmpty ? (
                                <div className="empty-slot-placeholder">
                                  <span className="empty-dash">-</span>
                                  <div className="empty-cell-actions">
                                    <button
                                      type="button"
                                      className="cell-quick-add-btn"
                                      onClick={() =>
                                        onAddLectureToSlot(slot.time, prog)
                                      }
                                      title={`Add lecture to ${prog} at ${slot.time}`}
                                    >
                                      <Plus size={13} />
                                    </button>
                                    {onAddBreak && (
                                      <button
                                        type="button"
                                        className="cell-quick-break-btn"
                                        onClick={() =>
                                          onAddBreak(prog, slot.time)
                                        }
                                        title={`Set Break for ${prog} at ${slot.time}`}
                                      >
                                        <Coffee size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="cell-active-actions">
                                  <button
                                    type="button"
                                    className="cell-stack-add-btn"
                                    onClick={() =>
                                      onAddLectureToSlot(slot.time, prog)
                                    }
                                    title="Add another lecture to this slot"
                                  >
                                    <Plus size={11} /> Lecture
                                  </button>
                                  {cellBreaks.length === 0 && onAddBreak && (
                                    <button
                                      type="button"
                                      className="cell-stack-add-btn cell-stack-break-btn"
                                      onClick={() => onAddBreak(prog, slot.time)}
                                      title="Add break to this slot"
                                    >
                                      <Coffee size={11} /> Break
                                    </button>
                                  )}
                                </div>
                              )}

                              {potentialClash && (
                                <div className="clash-drop-alert">
                                  ⚠️ Clash: {draggedItem?.data?.teacher} already scheduled in this slot!
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Matching Empty Cell for Add Column Header */}
                      {onOpenAddColumn && (
                        <td className="cell-add-column-empty"></td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Timetable Bottom Controls: Add Time Row */}
        <div className="timetable-bottom-controls">
          <button
            type="button"
            className="btn-add-timerow"
            onClick={handleAddNewTimeRow}
            title="Add a new time row at the bottom of schedule"
          >
            <Plus size={13} /> Add Time Slot Row
          </button>
        </div>
      </div>
    </div>
  );
}
