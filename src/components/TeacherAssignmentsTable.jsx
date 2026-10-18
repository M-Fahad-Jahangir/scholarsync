import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronUp,
  Palette,
  UserPlus,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { getTeacherColor } from '../data/teacherColors';

export default function TeacherAssignmentsTable({
  teachersSummary,
  subjectProgress,
  programs = [],
  categories = [],
  categoryMappings = {},
  lectures = [],
  customColors,
  onOpenColorModal,
  onOpenAddTeacher,
  onOpenAddSubject,
  onOpenAddDepartment,
  onAddClassToDepartment,
  onRenameTeacher,
  onDeleteTeacher,
  onRenameSubject,
  onDeleteSubject,
  onRenameClass,
  onDeleteClass,
  onRenameDepartment,
  onDeleteDepartment,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'subjects' | 'departments'

  // Department collapse state: default expanded (false = open)
  const [collapsedDepts, setCollapsedDepts] = useState({});

  // Inline editing state
  const [editingItem, setEditingItem] = useState(null); // { type: 'teacher'|'subject'|'class'|'department', name: string }
  const [editValue, setEditValue] = useState('');

  const toggleDeptCollapse = (dept) => {
    setCollapsedDepts((prev) => ({
      ...prev,
      [dept]: !prev[dept],
    }));
  };

  const startEditing = (e, type, name, id = null, department = null) => {
    e.stopPropagation();
    setEditingItem({ type, name, id, department });
    setEditValue(name);
  };

  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    setEditingItem(null);
    setEditValue('');
  };

  const saveEditing = (e) => {
    if (e) e.stopPropagation();
    if (!editingItem) return;
    const clean = editValue.trim();
    if (!clean || clean === editingItem.name) {
      cancelEditing();
      return;
    }

    if (editingItem.type === 'teacher') {
      onRenameTeacher(editingItem.name, clean);
    } else if (editingItem.type === 'subject') {
      onRenameSubject(editingItem.id, editingItem.name, clean, editingItem.department);
    } else if (editingItem.type === 'class') {
      onRenameClass(editingItem.name, clean);
    } else if (editingItem.type === 'department') {
      if (onRenameDepartment) onRenameDepartment(editingItem.name, clean);
    }
    cancelEditing();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing(e);
    } else if (e.key === 'Escape') {
      cancelEditing(e);
    }
  };

  const handleDelete = (e, type, name, id = null, department = null) => {
    e.stopPropagation();
    let message = `Are you sure you want to delete ${type} "${name}"?`;
    if (type === 'teacher') {
      message = `Are you sure you want to delete teacher "${name}"?\nAll scheduled lecture tiles for this teacher will be deleted and the teacher will be removed from the directory.`;
    } else if (type === 'department') {
      message = `Are you sure you want to delete department "${name}"?\nIts classes will become unassigned.`;
    } else if (type === 'subject' && department) {
      message = `Are you sure you want to delete subject "${name}" from ${department}?\nThis will remove it and update all scheduled classes in this department.`;
    } else {
      message = `Are you sure you want to delete ${type} "${name}"?\nThis will remove it and update all scheduled classes in the timetable.`;
    }
    const confirmed = window.confirm(message);
    if (!confirmed) return;

    if (type === 'teacher') {
      onDeleteTeacher(name);
    } else if (type === 'subject') {
      onDeleteSubject(id, name, department);
    } else if (type === 'class') {
      onDeleteClass(name);
    } else if (type === 'department') {
      if (onDeleteDepartment) onDeleteDepartment(name);
    }
  };

  // Helper: Find which department a class belongs to
  const getDepartmentForClass = (prog) => {
    if (categoryMappings && categoryMappings[prog]) {
      return categoryMappings[prog];
    }
    if (categoryMappings) {
      const foundKey = Object.keys(categoryMappings).find(
        (k) => k.toLowerCase() === prog.toLowerCase()
      );
      if (foundKey && categoryMappings[foundKey]) {
        return categoryMappings[foundKey];
      }
    }

    // Heuristic fallback matching
    const p = prog.toLowerCase();
    for (const cat of categories) {
      const c = cat.toLowerCase();
      if (c.includes('eng') && (p.includes('eng') || p.includes('lit'))) return cat;
      if (
        (c.includes('cs') || c.includes('it')) &&
        (p.includes('cs') || p.includes('it') || p.includes('se') || p.includes('ai') || p.includes('comput'))
      ) {
        return cat;
      }
      if (c.includes('inter') && (p.includes('inter') || p.includes('fsc') || p.includes('ics'))) {
        return cat;
      }
      if (p.includes(c) || c.includes(p)) return cat;
    }

    return categories[0] || 'General';
  };

  // Helper: Find which department(s) a subject belongs to
  const getDepartmentsForSubject = (item) => {
    // 1. If item has explicit department saved
    if (item.department && categories.includes(item.department)) {
      return [item.department];
    }

    // 2. Find departments where this subject is scheduled in lectures
    const deptsFromLectures = new Set();
    lectures.forEach((l) => {
      if (l.subject?.trim().toLowerCase() === item.subject.toLowerCase()) {
        const dept = getDepartmentForClass(l.program);
        if (dept && categories.includes(dept)) {
          deptsFromLectures.add(dept);
        }
      }
    });

    if (deptsFromLectures.size > 0) {
      return Array.from(deptsFromLectures);
    }

    // 3. Heuristic matching by name if no lectures yet
    const subLower = item.subject.toLowerCase();
    for (const cat of categories) {
      const c = cat.toLowerCase();
      if (
        c.includes('eng') &&
        (subLower.includes('eng') ||
          subLower.includes('urdu') ||
          subLower.includes('lit') ||
          subLower.includes('prose'))
      ) {
        return [cat];
      }
      if (
        (c.includes('cs') || c.includes('it')) &&
        (subLower.includes('cs') ||
          subLower.includes('it') ||
          subLower.includes('cloud') ||
          subLower.includes('data') ||
          subLower.includes('security') ||
          subLower.includes('network') ||
          subLower.includes('app'))
      ) {
        return [cat];
      }
      if (c.includes('inter') && subLower.includes('inter')) {
        return [cat];
      }
    }

    return categories.length > 0 ? [categories[0]] : ['General'];
  };

  return (
    <section className="section-card academic-directory-card">
      {/* Collapsible Section Header */}
      <div className="section-header collapsible-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="section-title-group">
          <button
            type="button"
            className="collapse-toggle-btn"
            title={isCollapsed ? 'Expand section' : 'Collapse section'}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

          <div className="section-icon-bubble">
            <Users size={18} className="text-primary" />
          </div>

          <div>
            <h2 className="section-title">Academic Directory & Assignments</h2>
            <div className="section-meta-pills">
              <span className="meta-pill">{teachersSummary.length} Teachers</span>
              <span className="meta-dot">•</span>
              <span className="meta-pill">{subjectProgress.length} Subjects</span>
              <span className="meta-dot">•</span>
              <span className="meta-pill">{categories.length} Departments</span>
              <span className="meta-dot">•</span>
              <span className="meta-pill">{programs.length} Classes</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Right Side */}
        <div className="section-actions" onClick={(e) => e.stopPropagation()}>
          {activeTab === 'teachers' && (
            <>
              <button
                type="button"
                className="btn btn-outline-sm"
                onClick={onOpenColorModal}
                title="Customize teacher tile colors & add colors"
              >
                <Palette size={14} /> Teacher Colors
              </button>

              <button
                type="button"
                className="btn btn-primary-sm"
                onClick={onOpenAddTeacher}
                title="Register a new teacher"
              >
                <UserPlus size={14} /> Add Teacher
              </button>
            </>
          )}

          {(activeTab === 'subjects' || activeTab === 'departments') && (
            <button
              type="button"
              className="btn btn-primary-sm"
              onClick={onOpenAddDepartment}
              title="Create a new academic department"
            >
              <Plus size={14} /> Add Department
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="collapsible-body">
          {/* Tabs Bar: Teachers / Subjects / Departments (Requirement 1) */}
          <div className="directory-tabs-bar">
            <button
              type="button"
              className={`directory-tab ${activeTab === 'teachers' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              <Users size={15} />
              <span>Teachers</span>
              <span className="tab-count-badge">{teachersSummary.length}</span>
            </button>

            <button
              type="button"
              className={`directory-tab ${activeTab === 'subjects' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('subjects')}
            >
              <BookOpen size={15} />
              <span>Subjects</span>
              <span className="tab-count-badge">{subjectProgress.length}</span>
            </button>

            <button
              type="button"
              className={`directory-tab ${activeTab === 'departments' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('departments')}
            >
              <Building2 size={15} />
              <span>Departments</span>
              <span className="tab-count-badge">{categories.length}</span>
            </button>
          </div>

          {/* ========================================================
              TAB 1: TEACHERS
             ======================================================== */}
          {activeTab === 'teachers' && (
            <div className="table-responsive">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th className="col-teacher">Teacher</th>
                    <th className="col-subjects">Assigned subjects</th>
                    <th className="col-count text-center">Weekly lectures</th>
                    <th className="col-actions text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachersSummary.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-table-msg">
                        No teachers found. Click <strong>"+ Add Teacher"</strong> to register one.
                      </td>
                    </tr>
                  ) : (
                    teachersSummary.map((item) => {
                      const colorInfo = getTeacherColor(item.name, customColors);
                      const isEditingThis =
                        editingItem?.type === 'teacher' && editingItem?.name === item.name;

                      return (
                        <tr key={item.name} className="teacher-row">
                          <td className="teacher-cell">
                            <div className="teacher-info-wrapper">
                              <span
                                className="teacher-color-pill"
                                style={{
                                  backgroundColor: colorInfo.accent,
                                  boxShadow: `0 0 0 2px ${colorInfo.border}`,
                                }}
                              />

                              {isEditingThis ? (
                                <div className="inline-edit-box" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    className="inline-edit-input"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    className="inline-action-btn check-btn"
                                    onClick={saveEditing}
                                    title="Save name (Enter)"
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="inline-action-btn cancel-btn"
                                    onClick={cancelEditing}
                                    title="Cancel (Esc)"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              ) : (
                                <span className="teacher-name">{item.name}</span>
                              )}
                            </div>
                          </td>

                          <td className="subjects-cell">
                            {item.subjects.length > 0 ? (
                              <div className="assigned-subjects-list">
                                {item.subjects.join(', ')}
                              </div>
                            ) : (
                              <span className="text-muted">None assigned</span>
                            )}
                          </td>

                          <td className="count-cell text-center">
                            <span className="count-badge font-mono">
                              {item.weeklyCount} {item.weeklyCount === 1 ? 'class' : 'classes'}
                            </span>
                          </td>

                          <td className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="table-actions-cell">
                              <button
                                type="button"
                                className="btn-action-edit"
                                onClick={(e) => startEditing(e, 'teacher', item.name)}
                                title={`Rename teacher "${item.name}"`}
                              >
                                <Pencil size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="btn-action-delete"
                                onClick={(e) => handleDelete(e, 'teacher', item.name)}
                                title={`Delete teacher "${item.name}"`}
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================
              TAB 2: SUBJECTS / COURSES (Department-wise with Assigned Teachers)
              Requirement 1 & 2
             ======================================================== */}
          {activeTab === 'subjects' && (
            <div className="departments-view-container">
              {categories.length === 0 ? (
                <div className="empty-table-msg">
                  No departments created yet. Click <strong>"+ Add Department"</strong> to create one.
                </div>
              ) : (
                categories.map((dept) => {
                  const deptSubjects = subjectProgress.filter((item) => {
                    if (item.department) {
                      return item.department.trim().toLowerCase() === dept.trim().toLowerCase();
                    }
                    const depts = getDepartmentsForSubject(item);
                    return depts.some((d) => d.toLowerCase() === dept.toLowerCase());
                  });

                  const isDeptOpen = !collapsedDepts[`sub_${dept}`];
                  const isEditingThisDept =
                    editingItem?.type === 'department' && editingItem?.name === dept;

                  return (
                    <div className="dept-accordion-item" key={dept}>
                      {/* Collapsible, Editable, Deletable Department Header Row */}
                      <div
                        className={`dept-header-row ${isDeptOpen ? 'dept-row-open' : 'dept-row-closed'}`}
                        onClick={() => toggleDeptCollapse(`sub_${dept}`)}
                      >
                        <div className="dept-header-left">
                          <button
                            type="button"
                            className="dept-collapse-toggle-btn"
                            title={isDeptOpen ? 'Collapse department' : 'Expand department'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDeptCollapse(`sub_${dept}`);
                            }}
                          >
                            {isDeptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          <div className="dept-icon-bubble">
                            <Building2 size={16} className="text-primary" />
                          </div>

                          {isEditingThisDept ? (
                            <div
                              className="inline-edit-box dept-inline-edit"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                className="inline-edit-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="inline-action-btn check-btn"
                                onClick={saveEditing}
                                title="Save department name (Enter)"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                className="inline-action-btn cancel-btn"
                                onClick={cancelEditing}
                                title="Cancel (Esc)"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="dept-title-group">
                              <span className="dept-name-title">{dept}</span>
                              <span className="dept-classes-pill">
                                {deptSubjects.length}{' '}
                                {deptSubjects.length === 1 ? 'Course' : 'Courses'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons on Department Row */}
                        <div
                          className="dept-header-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="btn btn-outline-primary-xs add-class-dept-btn"
                            onClick={() => onOpenAddSubject && onOpenAddSubject(dept)}
                            title={`Add a new course / subject to ${dept}`}
                          >
                            <Plus size={13} /> Add Subject
                          </button>

                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={(e) => startEditing(e, 'department', dept)}
                            title={`Rename department "${dept}"`}
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={(e) => handleDelete(e, 'department', dept)}
                            title={`Delete department "${dept}"`}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Under Collapsed Row: Show courses list */}
                      {isDeptOpen && (
                        <div className="dept-classes-container">
                          <div className="table-responsive">
                            <table className="assignments-table dept-table">
                              <thead>
                                <tr>
                                  <th>Subject Name</th>
                                  {/* Requirement 1: Replace Weekly Lecture Progress with Assigned Teacher(s) */}
                                  <th>Assigned Teacher(s)</th>
                                  <th>Status</th>
                                  <th className="text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {deptSubjects.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" className="empty-dept-msg">
                                      No courses registered in <strong>{dept}</strong> yet.{' '}
                                      <button
                                        type="button"
                                        className="btn-link-inline"
                                        onClick={() =>
                                          onOpenAddSubject && onOpenAddSubject(dept)
                                        }
                                      >
                                        + Add Subject
                                      </button>
                                    </td>
                                  </tr>
                                ) : (
                                  deptSubjects.map((item) => {
                                    const isEditingThis =
                                      editingItem?.type === 'subject' &&
                                      (editingItem?.id
                                        ? editingItem.id === item.id
                                        : editingItem?.name === item.subject && editingItem?.department === dept);

                                    // Find which teachers are assigned to this subject in this specific department
                                    const deptLectures = lectures.filter((l) => {
                                      const matchSub = l.subject?.trim().toLowerCase() === item.subject.toLowerCase();
                                      if (!matchSub) return false;
                                      const lecDept = categoryMappings[l.program] || getDepartmentForClass(l.program);
                                      return (lecDept || '').toLowerCase() === dept.toLowerCase();
                                    });
                                    const assignedTeachers = Array.from(
                                      new Set(
                                        deptLectures
                                          .map((l) => l.teacher?.trim())
                                          .filter(Boolean)
                                      )
                                    );

                                    const isComplete = item.count === item.target;
                                    const isExceeded = item.count > item.target;
                                    let statusText = `${item.count}/${item.target} Scheduled`;
                                    let statusBadge = 'status-badge-blue';

                                    if (isComplete) {
                                      statusText = '4/4 Completed (Green)';
                                      statusBadge = 'status-badge-green';
                                    } else if (isExceeded) {
                                      statusText = `Exceeded Limit (${item.count}/${item.target})`;
                                      statusBadge = 'status-badge-red';
                                    }

                                    return (
                                      <tr key={item.id || `${dept}-${item.subject}`}>
                                        <td className="teacher-cell">
                                          <div className="teacher-info-wrapper">
                                            {isEditingThis ? (
                                              <div className="inline-edit-box">
                                                <input
                                                  type="text"
                                                  className="inline-edit-input"
                                                  value={editValue}
                                                  onChange={(e) =>
                                                    setEditValue(e.target.value)
                                                  }
                                                  onKeyDown={handleKeyDown}
                                                  autoFocus
                                                />
                                                <button
                                                  type="button"
                                                  className="inline-action-btn check-btn"
                                                  onClick={saveEditing}
                                                  title="Save subject name"
                                                >
                                                  <Check size={13} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="inline-action-btn cancel-btn"
                                                  onClick={cancelEditing}
                                                  title="Cancel"
                                                >
                                                  <X size={13} />
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="font-semibold text-main">
                                                {item.subject}
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* Requirement 1: Assigned Teacher(s) Column */}
                                        <td>
                                          {assignedTeachers.length > 0 ? (
                                            <div className="assigned-teachers-badge-list">
                                              {assignedTeachers.map((t) => {
                                                const colorInfo = getTeacherColor(
                                                  t,
                                                  customColors
                                                );
                                                return (
                                                  <span
                                                    key={t}
                                                    className="assigned-teacher-tag"
                                                    style={{
                                                      backgroundColor: colorInfo.bg,
                                                      borderColor: colorInfo.border,
                                                      color: colorInfo.text,
                                                    }}
                                                  >
                                                    <span
                                                      className="tag-color-bullet"
                                                      style={{
                                                        backgroundColor:
                                                          colorInfo.accent,
                                                      }}
                                                    />
                                                    {t}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <span className="text-muted">
                                              No teacher assigned
                                            </span>
                                          )}
                                        </td>

                                        {/* Status Column */}
                                        <td>
                                          <span className={`status-pill ${statusBadge}`}>
                                            {isComplete && <CheckCircle2 size={12} />}
                                            {isExceeded && <AlertTriangle size={12} />}
                                            {!isComplete && !isExceeded && (
                                              <Clock size={12} />
                                            )}
                                            <span>{statusText}</span>
                                          </span>
                                        </td>

                                        <td
                                          className="text-right"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="table-actions-cell">
                                            <button
                                              type="button"
                                              className="btn-action-edit"
                                              onClick={(e) =>
                                                startEditing(e, 'subject', item.subject, item.id, dept)
                                              }
                                              title={`Rename ${item.subject}`}
                                            >
                                              <Pencil size={12} />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-action-delete"
                                              onClick={(e) =>
                                                handleDelete(e, 'subject', item.subject, item.id, dept)
                                              }
                                              title={`Delete ${item.subject}`}
                                            >
                                              <Trash2 size={12} />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: DEPARTMENTS (Categorized Classes under Departments)
              Requirement 1 & 2
             ======================================================== */}
          {activeTab === 'departments' && (
            <div className="departments-view-container">
              {categories.length === 0 ? (
                <div className="empty-table-msg">
                  No departments created yet. Click <strong>"+ Add Department"</strong> above to create one.
                </div>
              ) : (
                categories.map((dept) => {
                  const deptClasses = programs.filter(
                    (prog) => getDepartmentForClass(prog) === dept
                  );
                  const totalDeptLectures = lectures.filter((l) =>
                    deptClasses.includes(l.program)
                  ).length;
                  const isDeptOpen = !collapsedDepts[dept];
                  const isEditingThisDept =
                    editingItem?.type === 'department' && editingItem?.name === dept;

                  return (
                    <div className="dept-accordion-item" key={dept}>
                      {/* Collapsible, Editable, Deletable Department Header Row */}
                      <div
                        className={`dept-header-row ${isDeptOpen ? 'dept-row-open' : 'dept-row-closed'}`}
                        onClick={() => toggleDeptCollapse(dept)}
                      >
                        <div className="dept-header-left">
                          <button
                            type="button"
                            className="dept-collapse-toggle-btn"
                            title={isDeptOpen ? 'Collapse department' : 'Expand department'}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDeptCollapse(dept);
                            }}
                          >
                            {isDeptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          <div className="dept-icon-bubble">
                            <Building2 size={16} className="text-primary" />
                          </div>

                          {isEditingThisDept ? (
                            <div
                              className="inline-edit-box dept-inline-edit"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                className="inline-edit-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="inline-action-btn check-btn"
                                onClick={saveEditing}
                                title="Save department name (Enter)"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                className="inline-action-btn cancel-btn"
                                onClick={cancelEditing}
                                title="Cancel (Esc)"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <div className="dept-title-group">
                              <span className="dept-name-title">{dept}</span>
                              <span className="dept-classes-pill">
                                {deptClasses.length}{' '}
                                {deptClasses.length === 1 ? 'Class' : 'Classes'}
                              </span>
                              <span className="dept-lectures-pill">
                                {totalDeptLectures}{' '}
                                {totalDeptLectures === 1 ? 'Lecture' : 'Lectures'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons on Department Row: Add Class, Edit, Delete */}
                        <div
                          className="dept-header-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Requirement 2: Add Class button moved in here now */}
                          <button
                            type="button"
                            className="btn btn-outline-primary-xs add-class-dept-btn"
                            onClick={() =>
                              onAddClassToDepartment && onAddClassToDepartment(dept)
                            }
                            title={`Add a new class section to ${dept}`}
                          >
                            <Plus size={13} /> Add Class
                          </button>

                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={(e) => startEditing(e, 'department', dept)}
                            title={`Rename department "${dept}"`}
                          >
                            <Pencil size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={(e) => handleDelete(e, 'department', dept)}
                            title={`Delete department "${dept}"`}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Under Collapsed Row: Show the classes as it is they are right now */}
                      {isDeptOpen && (
                        <div className="dept-classes-container">
                          <div className="table-responsive">
                            <table className="assignments-table dept-table">
                              <thead>
                                <tr>
                                  <th>Class / Section</th>
                                  <th>Scheduled Lectures</th>
                                  <th>Subjects Taught</th>
                                  <th className="text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {deptClasses.length === 0 ? (
                                  <tr>
                                    <td colSpan="4" className="empty-dept-msg">
                                      No classes registered in <strong>{dept}</strong> yet.{' '}
                                      <button
                                        type="button"
                                        className="btn-link-inline"
                                        onClick={() =>
                                          onAddClassToDepartment &&
                                          onAddClassToDepartment(dept)
                                        }
                                      >
                                        + Add Class
                                      </button>
                                    </td>
                                  </tr>
                                ) : (
                                  deptClasses.map((prog) => {
                                    const isEditingThis =
                                      editingItem?.type === 'class' &&
                                      editingItem?.name === prog;
                                    const classLectures = lectures.filter(
                                      (l) => l.program === prog
                                    );
                                    const classSubjects = Array.from(
                                      new Set(
                                        classLectures
                                          .map((l) => l.subject)
                                          .filter(Boolean)
                                      )
                                    );

                                    return (
                                      <tr key={prog}>
                                        <td>
                                          <div className="teacher-info-wrapper">
                                            {isEditingThis ? (
                                              <div className="inline-edit-box">
                                                <input
                                                  type="text"
                                                  className="inline-edit-input"
                                                  value={editValue}
                                                  onChange={(e) =>
                                                    setEditValue(e.target.value)
                                                  }
                                                  onKeyDown={handleKeyDown}
                                                  autoFocus
                                                />
                                                <button
                                                  type="button"
                                                  className="inline-action-btn check-btn"
                                                  onClick={saveEditing}
                                                  title="Save class name"
                                                >
                                                  <Check size={13} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="inline-action-btn cancel-btn"
                                                  onClick={cancelEditing}
                                                  title="Cancel"
                                                >
                                                  <X size={13} />
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="font-semibold text-main">
                                                {prog}
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        <td>
                                          <span className="count-badge-neutral font-mono">
                                            {classLectures.length} lectures
                                          </span>
                                        </td>

                                        <td>
                                          {classSubjects.length > 0 ? (
                                            <div className="assigned-subjects-list">
                                              {classSubjects.join(', ')}
                                            </div>
                                          ) : (
                                            <span className="text-muted">
                                              No lectures scheduled
                                            </span>
                                          )}
                                        </td>

                                        <td
                                          className="text-right"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="table-actions-cell">
                                            <button
                                              type="button"
                                              className="btn-action-edit"
                                              onClick={(e) =>
                                                startEditing(e, 'class', prog)
                                              }
                                              title={`Rename ${prog}`}
                                            >
                                              <Pencil size={12} />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-action-delete"
                                              onClick={(e) =>
                                                handleDelete(e, 'class', prog)
                                              }
                                              title={`Delete class ${prog}`}
                                            >
                                              <Trash2 size={12} />
                                              <span>Delete</span>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
