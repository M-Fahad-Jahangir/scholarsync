import React, { useState, useMemo, useEffect, useRef } from 'react';
import TeacherAssignmentsTable from './components/TeacherAssignmentsTable';
import SubjectProgressSection from './components/SubjectProgressSection';
import ConflictAlertBanner from './components/ConflictAlertBanner';
import TimetableGrid from './components/TimetableGrid';
import ShareModal from './components/ShareModal';
import TeacherColorModal from './components/TeacherColorModal';
import AddTeacherModal from './components/AddTeacherModal';
import AddClassModal from './components/AddClassModal';
import AddTabModal from './components/AddTabModal';
import AddLectureModal from './components/AddLectureModal';
import AddSubjectModal from './components/AddSubjectModal';
import {
  isFirebaseConfigured,
  subscribeToTimetable,
  syncTimetableToCloud,
} from './services/firebase';

import {
  INITIAL_PROGRAMS,
  INITIAL_TIME_SLOTS,
  INITIAL_FEATURED_SUBJECTS,
  INITIAL_LECTURES,
} from './data/initialData';
import { DEFAULT_TEACHER_COLORS } from './data/teacherColors';
import { detectConflicts, getLectureDays } from './utils/conflictDetector';

const DEFAULT_CATEGORIES = ['BS English', 'BS IT / CS', 'Inter'];

const DEFAULT_CATEGORY_MAPPINGS = {
  'BS-ENG-I': 'BS English',
  'BS-ENG-III': 'BS English',
  'BS-ENG-V': 'BS English',
  'BS-ENG-VII': 'BS English',
  'BS-CS (Computing)-I': 'BS IT / CS',
  'BS-CS/IT-III': 'BS IT / CS',
  'BS-IT-V': 'BS IT / CS',
  'BS-IT-VII': 'BS IT / CS',
  'Inter Part 1': 'Inter',
  'Inter Part 2': 'Inter',
};

const getDefaultClassBreaks = (programsList) => {
  return programsList.map((prog, idx) => ({
    id: `break-init-${idx}-${prog.replace(/[^a-zA-Z0-9]/g, '_')}`,
    program: prog,
    timeSlot: '10:15 - 10:45',
    label: 'BREAK',
  }));
};

export default function App() {
  // State initialization with localStorage fallback
  const [lectures, setLectures] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_lectures');
      return saved ? JSON.parse(saved) : INITIAL_LECTURES;
    } catch {
      return INITIAL_LECTURES;
    }
  });

  const [programs, setPrograms] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_programs');
      return saved ? JSON.parse(saved) : INITIAL_PROGRAMS;
    } catch {
      return INITIAL_PROGRAMS;
    }
  });

  const [timeSlots, setTimeSlots] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_timeslots');
      return saved ? JSON.parse(saved) : INITIAL_TIME_SLOTS;
    } catch {
      return INITIAL_TIME_SLOTS;
    }
  });

  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_teacher_colors');
      return saved ? JSON.parse(saved) : DEFAULT_TEACHER_COLORS;
    } catch {
      return DEFAULT_TEACHER_COLORS;
    }
  });

  const [registeredTeachers, setRegisteredTeachers] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_registered_teachers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    const teachersSet = new Set();
    Object.keys(DEFAULT_TEACHER_COLORS).forEach((t) => teachersSet.add(t));
    INITIAL_LECTURES.forEach((l) => {
      if (l.teacher?.trim()) teachersSet.add(l.teacher.trim());
    });
    return Array.from(teachersSet);
  });

  const [trackedSubjects, setTrackedSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_tracked_subjects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            ...item,
            id: item.id || `sub-saved-${idx}-${(item.name || '').replace(/\s+/g, '_')}`,
          }));
        }
      }
    } catch {}
    return INITIAL_FEATURED_SUBJECTS.map((s, idx) => ({
      id: `sub-init-${idx}-${s.replace(/\s+/g, '_')}`,
      name: s,
      target: 4,
      department: null,
    }));
  });

  // Requirement 2: Independent breaks per class
  const [classBreaks, setClassBreaks] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_class_breaks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return getDefaultClassBreaks(INITIAL_PROGRAMS);
  });

  // Requirement 5: Program category tabs & mappings
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  const [categoryMappings, setCategoryMappings] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_category_mappings');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORY_MAPPINGS;
    } catch {
      return DEFAULT_CATEGORY_MAPPINGS;
    }
  });

  // UI state
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState(null);
  const [highlightedLectureIds, setHighlightedLectureIds] = useState(null);

  // Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddTabOpen, setIsAddTabOpen] = useState(false);
  const [addColumnActiveCategory, setAddColumnActiveCategory] = useState(null);
  const [isAddLectureOpen, setIsAddLectureOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [addSubjectActiveCategory, setAddSubjectActiveCategory] = useState(null);
  const [cellTargetSlot, setCellTargetSlot] = useState(null); // for quick-add in cell

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('lms_lectures', JSON.stringify(lectures));
    } catch (e) {
      console.warn('Could not save lectures', e);
    }
  }, [lectures]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_programs', JSON.stringify(programs));
    } catch (e) {
      console.warn('Could not save programs', e);
    }
  }, [programs]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_timeslots', JSON.stringify(timeSlots));
    } catch (e) {
      console.warn('Could not save timeslots', e);
    }
  }, [timeSlots]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_class_breaks', JSON.stringify(classBreaks));
    } catch (e) {
      console.warn('Could not save class breaks', e);
    }
  }, [classBreaks]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_categories', JSON.stringify(categories));
    } catch (e) {
      console.warn('Could not save categories', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_category_mappings', JSON.stringify(categoryMappings));
    } catch (e) {
      console.warn('Could not save category mappings', e);
    }
  }, [categoryMappings]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_tracked_subjects', JSON.stringify(trackedSubjects));
    } catch (e) {
      console.warn('Could not save tracked subjects', e);
    }
  }, [trackedSubjects]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_teacher_colors', JSON.stringify(customColors));
    } catch (e) {
      console.warn('Could not save teacher colors', e);
    }
  }, [customColors]);

  useEffect(() => {
    try {
      localStorage.setItem('lms_registered_teachers', JSON.stringify(registeredTeachers));
    } catch (e) {
      console.warn('Could not save registered teachers', e);
    }
  }, [registeredTeachers]);

  // Requirement 3: Startup synchronization — ensure any class in custom suggestions or lectures is in programs
  useEffect(() => {
    try {
      const savedSuggestions = JSON.parse(
        localStorage.getItem('lms_class_suggestions') || '[]'
      );
      if (savedSuggestions && savedSuggestions.length > 0) {
        setPrograms((prev) => {
          const existing = new Set(prev.map((p) => p.toLowerCase()));
          const missing = savedSuggestions.filter(
            (s) => s && !existing.has(s.toLowerCase())
          );
          if (missing.length > 0) {
            return [...prev, ...missing];
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Real-time Cloud Synchronization via Firebase Firestore
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const isRemoteUpdateRef = useRef(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeToTimetable(
      (data) => {
        if (!data) return;
        isRemoteUpdateRef.current = true;
        if (data.lectures && Array.isArray(data.lectures)) setLectures(data.lectures);
        if (data.programs && Array.isArray(data.programs)) setPrograms(data.programs);
        if (data.timeSlots && Array.isArray(data.timeSlots)) setTimeSlots(data.timeSlots);
        if (data.classBreaks && Array.isArray(data.classBreaks)) setClassBreaks(data.classBreaks);
        if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
        if (data.categoryMappings && typeof data.categoryMappings === 'object') setCategoryMappings(data.categoryMappings);
        if (data.trackedSubjects && Array.isArray(data.trackedSubjects)) setTrackedSubjects(data.trackedSubjects);
        if (data.registeredTeachers && Array.isArray(data.registeredTeachers)) setRegisteredTeachers(data.registeredTeachers);
        if (data.customColors && typeof data.customColors === 'object') setCustomColors(data.customColors);

        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 500);
      },
      (err) => {
        console.warn('Firebase sync listener error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Debounced push to Firestore when local state updates
  useEffect(() => {
    if (!isFirebaseConfigured || isRemoteUpdateRef.current) return;

    setIsCloudSyncing(true);
    const timer = setTimeout(async () => {
      try {
        await syncTimetableToCloud({
          lectures,
          programs,
          timeSlots,
          classBreaks,
          categories,
          categoryMappings,
          trackedSubjects,
          registeredTeachers,
          customColors,
        });
      } finally {
        setIsCloudSyncing(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    lectures,
    programs,
    timeSlots,
    classBreaks,
    categories,
    categoryMappings,
    trackedSubjects,
    registeredTeachers,
    customColors,
  ]);

  // Derive unique teachers and subjects across all lectures and custom records
  const { allTeachers, allSubjects } = useMemo(() => {
    const teachersSet = new Set();
    const subjectsSet = new Set();

    registeredTeachers.forEach((t) => {
      if (t && t.trim()) teachersSet.add(t.trim());
    });

    trackedSubjects.forEach((s) => {
      if (s.name && s.name.trim()) subjectsSet.add(s.name.trim());
    });

    lectures.forEach((l) => {
      if (l.subject?.trim()) subjectsSet.add(l.subject.trim());
    });

    return {
      allTeachers: Array.from(teachersSet),
      allSubjects: Array.from(subjectsSet),
    };
  }, [lectures, trackedSubjects, registeredTeachers]);

  // Compute Teacher Assignments Summary (Requirement 5 & 1)
  const teachersSummary = useMemo(() => {
    const map = {};

    allTeachers.forEach((t) => {
      map[t] = {
        name: t,
        subjects: new Set(),
        weeklyCount: 0,
      };
    });

    lectures.forEach((lec) => {
      const teacher = lec.teacher?.trim();
      if (!teacher) return;
      if (!map[teacher]) {
        map[teacher] = { name: teacher, subjects: new Set(), weeklyCount: 0 };
      }
      const daysCount = getLectureDays(lec).length;
      map[teacher].weeklyCount += daysCount;
      if (lec.subject?.trim()) {
        map[teacher].subjects.add(lec.subject.trim());
      }
    });

    return Object.values(map)
      .map((item) => ({
        name: item.name,
        subjects: Array.from(item.subjects),
        weeklyCount: item.weeklyCount,
      }))
      .sort((a, b) => {
        if (b.weeklyCount !== a.weeklyCount) return b.weeklyCount - a.weeklyCount;
        return a.name.localeCompare(b.name);
      });
  }, [lectures, allTeachers]);

  // Compute Subject Progress per course / department (Requirement 1 & 4)
  const subjectProgress = useMemo(() => {
    return trackedSubjects.map((item) => {
      const itemDept = item.department;
      // Count lectures for this subject in this specific department
      let relevantLectures = lectures.filter(
        (l) => l.subject?.trim().toLowerCase() === item.name.toLowerCase()
      );
      if (itemDept) {
        relevantLectures = relevantLectures.filter((l) => {
          const mappedDept = categoryMappings[l.program] || '';
          return mappedDept.toLowerCase() === itemDept.toLowerCase();
        });
      }
      const count = relevantLectures.reduce(
        (sum, l) => sum + getLectureDays(l).length,
        0
      );

      return {
        id: item.id || `sub-${item.name}-${itemDept || 'all'}`,
        subject: item.name,
        count,
        target: item.target || 4,
        department: item.department,
      };
    });
  }, [lectures, trackedSubjects, categoryMappings]);

  // Compute timeline conflicts & double bookings (Requirement 3)
  const { conflictMap, summaryConflicts } = useMemo(() => {
    return detectConflicts(lectures);
  }, [lectures]);

  // =========================================================================
  // Cascade Edit & Delete Operations
  // =========================================================================

  // 1. Teacher Rename & Delete
  const handleRenameTeacher = (oldName, newName) => {
    const cleanOld = (oldName || '').trim().toLowerCase();
    const cleanNew = (newName || '').trim();
    if (!cleanNew || cleanOld === cleanNew.toLowerCase()) return;

    setRegisteredTeachers((prev) =>
      prev.map((t) => ((t || '').trim().toLowerCase() === cleanOld ? cleanNew : t))
    );
    setLectures((prev) =>
      prev.map((l) =>
        (l.teacher || '').trim().toLowerCase() === cleanOld
          ? { ...l, teacher: cleanNew }
          : l
      )
    );
    setCustomColors((prev) => {
      const copy = {};
      Object.keys(prev).forEach((k) => {
        if (k.trim().toLowerCase() === cleanOld) {
          copy[cleanNew] = prev[k];
        } else {
          copy[k] = prev[k];
        }
      });
      return copy;
    });
    if ((selectedTeacherFilter || '').trim().toLowerCase() === cleanOld) {
      setSelectedTeacherFilter(cleanNew);
    }
  };

  const handleDeleteTeacher = (teacherName) => {
    const cleanTarget = (teacherName || '').trim().toLowerCase();
    if (!cleanTarget) return;

    // 1. Remove teacher completely from registeredTeachers list
    setRegisteredTeachers((prev) =>
      prev.filter((t) => (t || '').trim().toLowerCase() !== cleanTarget)
    );

    // 2. Delete ALL lecture tiles belonging to this teacher across the timetable
    setLectures((prev) =>
      prev.filter((l) => (l.teacher || '').trim().toLowerCase() !== cleanTarget)
    );

    // 3. Clean up custom colors mapping
    setCustomColors((prev) => {
      const copy = {};
      Object.keys(prev).forEach((key) => {
        if (key.trim().toLowerCase() !== cleanTarget) {
          copy[key] = prev[key];
        }
      });
      return copy;
    });

    // 4. Clear active filter if this teacher was selected
    if ((selectedTeacherFilter || '').trim().toLowerCase() === cleanTarget) {
      setSelectedTeacherFilter(null);
    }
  };

  // 2. Subject Rename & Delete (Scoped by ID and Department)
  const handleRenameSubject = (subjectIdOrOldName, newNameOrOldName, maybeNewName, maybeDept) => {
    let subjectId = null;
    let oldName = '';
    let newName = '';
    let department = null;

    if (maybeNewName !== undefined) {
      subjectId = subjectIdOrOldName;
      oldName = newNameOrOldName;
      newName = maybeNewName;
      department = maybeDept || null;
    } else {
      oldName = subjectIdOrOldName;
      newName = newNameOrOldName;
    }

    if (!newName || oldName === newName) return;

    setTrackedSubjects((prev) =>
      prev.map((s) => {
        const matches = subjectId && s.id
          ? s.id === subjectId
          : s.name.toLowerCase() === oldName.toLowerCase() &&
            (!department || (s.department || '').toLowerCase() === department.toLowerCase());
        return matches ? { ...s, name: newName } : s;
      })
    );

    setLectures((prev) =>
      prev.map((l) => {
        if (l.subject?.toLowerCase() !== oldName.toLowerCase()) return l;
        if (department) {
          const lecDept = categoryMappings[l.program] || '';
          if (lecDept.toLowerCase() === department.toLowerCase()) {
            return { ...l, subject: newName };
          }
          return l;
        }
        return { ...l, subject: newName };
      })
    );

    if (selectedSubjectFilter === oldName) {
      setSelectedSubjectFilter(newName);
    }
  };

  const handleDeleteSubject = (subjectIdOrName, maybeName, maybeDept) => {
    let subjectId = null;
    let subjectName = '';
    let department = null;

    if (maybeName !== undefined) {
      subjectId = subjectIdOrName;
      subjectName = maybeName;
      department = maybeDept || null;
    } else {
      subjectName = subjectIdOrName;
    }

    setTrackedSubjects((prev) =>
      prev.filter((s) => {
        if (subjectId && s.id) return s.id !== subjectId;
        if (department) {
          return !(
            s.name.toLowerCase() === subjectName.toLowerCase() &&
            (s.department || '').toLowerCase() === department.toLowerCase()
          );
        }
        return s.name.toLowerCase() !== subjectName.toLowerCase();
      })
    );

    setLectures((prev) =>
      prev.filter((l) => {
        const matchSub = l.subject?.toLowerCase() === subjectName.toLowerCase();
        if (!matchSub) return true;
        if (department) {
          const lecDept = categoryMappings[l.program] || '';
          if (lecDept.toLowerCase() === department.toLowerCase()) {
            return false;
          }
          return true;
        }
        return false;
      })
    );

    if (selectedSubjectFilter === subjectName) {
      setSelectedSubjectFilter(null);
    }
  };

  // 3. Class Rename & Delete (Requirement 3: cascades to lectures, breaks, mappings)
  const handleRenameClass = (oldName, newName) => {
    if (!newName || oldName === newName) return;
    setPrograms((prev) =>
      prev.map((p) => (p.toLowerCase() === oldName.toLowerCase() ? newName : p))
    );
    setLectures((prev) =>
      prev.map((l) =>
        l.program?.toLowerCase() === oldName.toLowerCase()
          ? { ...l, program: newName }
          : l
      )
    );
    setClassBreaks((prev) =>
      prev.map((b) =>
        b.program?.toLowerCase() === oldName.toLowerCase()
          ? { ...b, program: newName }
          : b
      )
    );
    setCategoryMappings((prev) => {
      const copy = { ...prev };
      if (copy[oldName]) {
        copy[newName] = copy[oldName];
        delete copy[oldName];
      }
      return copy;
    });
  };

  const handleDeleteClass = (className) => {
    setPrograms((prev) =>
      prev.filter((p) => p.toLowerCase() !== className.toLowerCase())
    );
    setLectures((prev) =>
      prev.filter((l) => l.program?.toLowerCase() !== className.toLowerCase())
    );
    setClassBreaks((prev) =>
      prev.filter((b) => b.program?.toLowerCase() !== className.toLowerCase())
    );
    setCategoryMappings((prev) => {
      const copy = { ...prev };
      delete copy[className];
      return copy;
    });
    // Requirement 4: Also remove from suggestions
    try {
      const saved = JSON.parse(localStorage.getItem('lms_class_suggestions') || '[]');
      const filtered = saved.filter((s) => s.toLowerCase() !== className.toLowerCase());
      localStorage.setItem('lms_class_suggestions', JSON.stringify(filtered));
    } catch {}
  };

  // Requirement 4: Column Drag & Drop Reordering
  const handleReorderPrograms = (sourceProg, targetProg) => {
    setPrograms((prev) => {
      const list = [...prev];
      const sourceIdx = list.indexOf(sourceProg);
      const targetIdx = list.indexOf(targetProg);
      if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return list;
      const [moved] = list.splice(sourceIdx, 1);
      list.splice(targetIdx, 0, moved);
      return list;
    });
  };

  // Requirement 5: Add Tab / Category / Department
  const handleAddTab = (newTabName) => {
    if (!newTabName) return;
    const clean = newTabName.trim();
    if (!clean) return;
    setCategories((prev) => {
      if (prev.some((c) => c.toLowerCase() === clean.toLowerCase())) return prev;
      return [...prev, clean];
    });
  };

  const handleRenameDepartment = (oldName, newName) => {
    if (!newName || oldName === newName) return;
    const clean = newName.trim();
    if (!clean) return;

    setCategories((prev) =>
      prev.map((c) => (c.toLowerCase() === oldName.toLowerCase() ? clean : c))
    );

    setCategoryMappings((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((cls) => {
        if (copy[cls]?.toLowerCase() === oldName.toLowerCase()) {
          copy[cls] = clean;
        }
      });
      return copy;
    });
  };

  const handleDeleteDepartment = (deptName) => {
    setCategories((prev) =>
      prev.filter((c) => c.toLowerCase() !== deptName.toLowerCase())
    );

    setCategoryMappings((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((cls) => {
        if (copy[cls]?.toLowerCase() === deptName.toLowerCase()) {
          delete copy[cls];
        }
      });
      return copy;
    });
  };

  const handleOpenAddClassForDepartment = (deptName) => {
    setAddColumnActiveCategory(deptName);
    setIsAddClassOpen(true);
  };

  // Add Class Column & Category Mapping (Requirement 3: guarantees class is created in programs)
  const handleAddClass = (className, category) => {
    const clean = className.trim();
    if (!clean) return;

    setPrograms((prev) => {
      if (prev.some((p) => p.toLowerCase() === clean.toLowerCase())) return prev;
      return [...prev, clean];
    });

    if (category) {
      setCategoryMappings((prev) => ({
        ...prev,
        [clean]: category,
      }));
    }

    // Save into suggestions so it appears next time
    try {
      const saved = JSON.parse(localStorage.getItem('lms_class_suggestions') || '[]');
      if (!saved.some((s) => s.toLowerCase() === clean.toLowerCase())) {
        localStorage.setItem('lms_class_suggestions', JSON.stringify([clean, ...saved]));
      }
    } catch {}

    // Give this new class a default break tile ready to be dragged anywhere
    setClassBreaks((prev) => {
      const exists = prev.some((b) => b.program.toLowerCase() === clean.toLowerCase());
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `break-${Date.now()}-${clean.replace(/[^a-zA-Z0-9]/g, '_')}`,
          program: clean,
          timeSlot: '10:15 - 10:45',
          label: 'BREAK',
        },
      ];
    });
  };

  // Requirement 2: Handlers for Draggable Breaks
  const handleMoveBreak = (breakId, newTimeSlot, newProgram) => {
    setClassBreaks((prev) =>
      prev.map((b) =>
        b.id === breakId ? { ...b, timeSlot: newTimeSlot, program: newProgram } : b
      )
    );
  };

  const handleAddBreak = (program, timeSlot, breakTime = null) => {
    setClassBreaks((prev) => [
      ...prev,
      {
        id: `break-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        program,
        timeSlot,
        time: breakTime || timeSlot,
        label: 'BREAK',
      },
    ]);
  };

  const handleUpdateBreakTime = (breakId, newTime) => {
    setClassBreaks((prev) =>
      prev.map((b) => (b.id === breakId ? { ...b, time: newTime } : b))
    );
  };

  const handleDeleteBreak = (breakId) => {
    setClassBreaks((prev) => prev.filter((b) => b.id !== breakId));
  };

  // Handlers for Lecture Tile CRUD & Movement
  const handleUpdateLecture = (updatedLecture) => {
    setLectures((prev) =>
      prev.map((l) => (l.id === updatedLecture.id ? updatedLecture : l))
    );
  };

  const handleDeleteLecture = (lectureId) => {
    setLectures((prev) => prev.filter((l) => l.id !== lectureId));
    if (highlightedLectureIds?.includes(lectureId)) {
      setHighlightedLectureIds(null);
    }
  };

  const handleMoveLecture = (lectureId, newTimeSlot, newProgram) => {
    setLectures((prev) =>
      prev.map((l) =>
        l.id === lectureId
          ? { ...l, timeSlot: newTimeSlot, program: newProgram }
          : l
      )
    );
  };

  const handleAddLecture = (newLecture) => {
    setLectures((prev) => [...prev, newLecture]);
    if (newLecture.teacher?.trim()) {
      const cleanTeacher = newLecture.teacher.trim();
      setRegisteredTeachers((prev) => {
        if (prev.some((t) => t.toLowerCase() === cleanTeacher.toLowerCase())) return prev;
        return [...prev, cleanTeacher];
      });
    }
    if (newLecture.program) {
      setPrograms((prev) => {
        if (prev.some((p) => p.toLowerCase() === newLecture.program.toLowerCase())) return prev;
        return [...prev, newLecture.program];
      });
    }
    const lecDept = categoryMappings[newLecture.program] || '';
    const exists = trackedSubjects.some(
      (s) =>
        s.name.toLowerCase() === newLecture.subject.toLowerCase() &&
        (!lecDept || !s.department || s.department.toLowerCase() === lecDept.toLowerCase())
    );
    if (!exists) {
      setTrackedSubjects((prev) => [
        ...prev,
        {
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: newLecture.subject,
          target: 4,
          department: lecDept || null,
        },
      ]);
    }
  };

  const handleOpenAddForSlot = (timeSlot, program) => {
    setCellTargetSlot({ timeSlot, program });
    setIsAddLectureOpen(true);
  };

  const handleAddTeacher = (name, colorTheme) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return;
    setRegisteredTeachers((prev) => {
      if (prev.some((t) => t.toLowerCase() === cleanName.toLowerCase())) return prev;
      return [...prev, cleanName];
    });
    if (colorTheme) {
      setCustomColors((prev) => ({
        ...prev,
        [cleanName]: colorTheme,
      }));
    }
  };

  const handleAddTrackedSubject = (name, target = 4, department = null) => {
    const cleanName = (name || '').trim();
    if (!cleanName) return;
    const cleanDept = (department || '').trim();

    // Check if subject already exists in the SAME department (allow duplicate names across different departments)
    const existsInSameDept = trackedSubjects.some(
      (s) =>
        s.name.toLowerCase() === cleanName.toLowerCase() &&
        (s.department || '').toLowerCase() === cleanDept.toLowerCase()
    );

    if (existsInSameDept) {
      alert(`Subject "${cleanName}" is already registered in ${cleanDept || 'this department'}.`);
      return;
    }

    const newSubject = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      target: Number(target) || 4,
      department: cleanDept || null,
    };

    setTrackedSubjects((prev) => [...prev, newSubject]);
  };

  const handleUpdateTeacherColor = (teacherName, colorTheme) => {
    setCustomColors((prev) => ({
      ...prev,
      [teacherName]: colorTheme,
    }));
  };

  const handleResetColors = () => {
    setCustomColors(DEFAULT_TEACHER_COLORS);
    localStorage.removeItem('lms_teacher_colors');
  };

  const handleResetToScreenshotData = () => {
    if (
      window.confirm(
        'Reset timetable to original screenshot sample data? Any manual additions will be reset.'
      )
    ) {
      const defaultTeachersSet = new Set();
      Object.keys(DEFAULT_TEACHER_COLORS).forEach((t) => defaultTeachersSet.add(t));
      INITIAL_LECTURES.forEach((l) => {
        if (l.teacher?.trim()) defaultTeachersSet.add(l.teacher.trim());
      });
      setRegisteredTeachers(Array.from(defaultTeachersSet));
      setLectures(INITIAL_LECTURES);
      setPrograms(INITIAL_PROGRAMS);
      setTimeSlots(INITIAL_TIME_SLOTS);
      setClassBreaks(getDefaultClassBreaks(INITIAL_PROGRAMS));
      setCategories(DEFAULT_CATEGORIES);
      setCategoryMappings(DEFAULT_CATEGORY_MAPPINGS);
      setCustomColors(DEFAULT_TEACHER_COLORS);
      setTrackedSubjects(
        INITIAL_FEATURED_SUBJECTS.map((s, idx) => ({
          id: `sub-init-${idx}-${s.replace(/\s+/g, '_')}`,
          name: s,
          target: 4,
          department: null,
        }))
      );
      setSelectedTeacherFilter(null);
      setSelectedSubjectFilter(null);
      setHighlightedLectureIds(null);
      localStorage.clear();
    }
  };

  const handleHighlightConflictLectures = (ids) => {
    setHighlightedLectureIds(ids);
    setTimeout(() => {
      const el = document.querySelector('.has-conflict');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleUpdateSlotTime = (slotId, oldTime, newTime) => {
    if (!newTime || oldTime === newTime) return;
    setTimeSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, time: newTime } : s))
    );
    setLectures((prev) =>
      prev.map((l) => (l.timeSlot === oldTime ? { ...l, timeSlot: newTime } : l))
    );
    setClassBreaks((prev) =>
      prev.map((b) => (b.timeSlot === oldTime ? { ...b, timeSlot: newTime } : b))
    );
  };

  const handleDeleteTimeSlot = (slotId, timeString) => {
    setTimeSlots((prev) => prev.filter((s) => s.id !== slotId));
    setLectures((prev) => prev.filter((l) => l.timeSlot !== timeString));
    setClassBreaks((prev) => prev.filter((b) => b.timeSlot !== timeString));
  };

  const handleAddTimeSlot = (timeString) => {
    const newSlot = {
      id: `t-${Date.now()}`,
      time: timeString,
      isBreak: false,
    };
    setTimeSlots((prev) => [...prev, newSlot]);
  };

  return (
    <div className="app-layout" id="app-root-container">
      <main className="main-content-area">
        {/* Cloud Sync Status Indicator */}
        <div className={`cloud-sync-pill-bar ${isFirebaseConfigured ? 'is-cloud-active' : 'is-local-mode'}`}>
          <div className="cloud-sync-info">
            <span className={`sync-status-indicator-dot ${isFirebaseConfigured ? 'dot-live' : 'dot-local'}`} />
            <span className="sync-status-label">
              {isFirebaseConfigured ? (
                <>
                  <strong>Firebase Cloud Sync:</strong> Live & Connected
                  {isCloudSyncing && <span className="sync-activity-tag">Syncing changes...</span>}
                </>
              ) : (
                <>
                  <strong>Local Storage Mode:</strong> Timetable active offline • Connect Firebase in <code>.env</code> for live multi-device syncing
                </>
              )}
            </span>
          </div>
        </div>

        {/* Active Filter Bar */}
        {(selectedSubjectFilter || highlightedLectureIds) && (
          <div className="active-filter-alert">
            <span className="filter-text">
              Active Highlight:{' '}
              <strong>
                {selectedSubjectFilter
                  ? `Subject: ${selectedSubjectFilter}`
                  : `Clashing Lectures (${highlightedLectureIds.length})`}
              </strong>
            </span>
            <button
              type="button"
              className="filter-clear-btn"
              onClick={() => {
                setSelectedSubjectFilter(null);
                setHighlightedLectureIds(null);
              }}
            >
              Clear Highlighting
            </button>
          </div>
        )}

        {/* Section 1: Collapsible Academic Directory with Tabs */}
        <TeacherAssignmentsTable
          teachersSummary={teachersSummary}
          subjectProgress={subjectProgress}
          programs={programs}
          categories={categories}
          categoryMappings={categoryMappings}
          lectures={lectures}
          customColors={customColors}
          onOpenColorModal={() => setIsColorModalOpen(true)}
          onOpenAddTeacher={() => setIsAddTeacherOpen(true)}
          onOpenAddSubject={(dept) => {
            setAddSubjectActiveCategory(dept || null);
            setIsAddSubjectOpen(true);
          }}
          onOpenAddDepartment={() => setIsAddTabOpen(true)}
          onAddClassToDepartment={handleOpenAddClassForDepartment}
          onRenameTeacher={handleRenameTeacher}
          onDeleteTeacher={handleDeleteTeacher}
          onRenameSubject={handleRenameSubject}
          onDeleteSubject={handleDeleteSubject}
          onRenameClass={handleRenameClass}
          onDeleteClass={handleDeleteClass}
          onRenameDepartment={handleRenameDepartment}
          onDeleteDepartment={handleDeleteDepartment}
        />

        {/* Section 2: Subject Progress Bars */}
        <SubjectProgressSection
          subjectProgress={subjectProgress}
          selectedSubjectFilter={selectedSubjectFilter}
          onSelectSubjectFilter={setSelectedSubjectFilter}
        />

        {/* Conflict Alert Banner */}
        <ConflictAlertBanner
          conflicts={summaryConflicts}
          onHighlightConflictLectures={handleHighlightConflictLectures}
        />

        {/* Section 3: Timetable Grid with All 5 New Features */}
        <TimetableGrid
          programs={programs}
          timeSlots={timeSlots}
          lectures={lectures}
          classBreaks={classBreaks}
          categories={categories}
          categoryMappings={categoryMappings}
          conflictMap={conflictMap}
          subjectProgress={subjectProgress}
          teachersList={allTeachers}
          subjectsList={allSubjects}
          customColors={customColors}
          selectedSubjectFilter={selectedSubjectFilter}
          highlightedLectureIds={highlightedLectureIds}
          onUpdateLecture={handleUpdateLecture}
          onDeleteLecture={handleDeleteLecture}
          onMoveLecture={handleMoveLecture}
          onAddLectureToSlot={handleOpenAddForSlot}
          onOpenAddDepartment={() => setIsAddTabOpen(true)}
          onOpenAddTab={() => setIsAddTabOpen(true)}
          onOpenAddColumn={(category) => {
            setAddColumnActiveCategory(category);
            setIsAddClassOpen(true);
          }}
          onUpdateSlotTime={handleUpdateSlotTime}
          onDeleteClass={handleDeleteClass}
          onRenameClass={handleRenameClass}
          onReorderPrograms={handleReorderPrograms}
          onDeleteTimeSlot={handleDeleteTimeSlot}
          onAddTimeSlot={handleAddTimeSlot}
          onMoveBreak={handleMoveBreak}
          onAddBreak={handleAddBreak}
          onDeleteBreak={handleDeleteBreak}
          onUpdateBreakTime={handleUpdateBreakTime}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
      </main>

      {/* Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        teachersSummary={teachersSummary}
        subjectProgress={subjectProgress}
        targetElementId="timetable-section-container"
      />

      <TeacherColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        teachersList={allTeachers}
        customColors={customColors}
        onUpdateTeacherColor={handleUpdateTeacherColor}
        onResetColors={handleResetColors}
        onOpenAddTeacher={() => setIsAddTeacherOpen(true)}
        onDeleteTeacher={handleDeleteTeacher}
      />

      <AddTeacherModal
        isOpen={isAddTeacherOpen}
        onClose={() => setIsAddTeacherOpen(false)}
        existingTeachers={allTeachers}
        onAddTeacher={handleAddTeacher}
      />

      {/* Requirement 5: Add Tab Modal */}
      <AddTabModal
        isOpen={isAddTabOpen}
        onClose={() => setIsAddTabOpen(false)}
        existingTabs={categories}
        onAddTab={handleAddTab}
      />

      {/* Requirement 5: Add Column Modal */}
      <AddClassModal
        isOpen={isAddClassOpen}
        onClose={() => {
          setIsAddClassOpen(false);
          setAddColumnActiveCategory(null);
        }}
        existingPrograms={programs}
        activeCategory={addColumnActiveCategory}
        onAddClass={handleAddClass}
        onDeleteClass={handleDeleteClass}
      />

      {/* Requirement 2: Add Lecture / Break Modal */}
      <AddLectureModal
        isOpen={isAddLectureOpen}
        onClose={() => {
          setIsAddLectureOpen(false);
          setCellTargetSlot(null);
        }}
        initialSlot={cellTargetSlot}
        programs={programs}
        timeSlots={timeSlots}
        teachersList={allTeachers}
        subjectsList={allSubjects}
        lectures={lectures}
        onAddLecture={handleAddLecture}
        onAddBreak={handleAddBreak}
        onAddClass={handleAddClass}
      />

      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => {
          setIsAddSubjectOpen(false);
          setAddSubjectActiveCategory(null);
        }}
        existingSubjects={allSubjects}
        categories={categories}
        activeDepartment={addSubjectActiveCategory}
        onAddSubject={handleAddTrackedSubject}
      />
    </div>
  );
}
