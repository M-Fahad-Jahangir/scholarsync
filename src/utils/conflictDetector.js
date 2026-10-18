/**
 * Conflict detection engine for timetable scheduling.
 * Detects:
 * 1. Teacher double-booking (same teacher assigned to multiple classes at the same time slot ON THE SAME DAY)
 * 2. Room double-booking (same room assigned to different classes at the same time slot ON THE SAME DAY)
 */

export const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Safely extract all assigned days for a lecture.
 * Supports:
 * - array of days: lec.days = ['Mon', 'Wed'] or lec.day = ['Mon', 'Wed']
 * - comma-separated string: lec.day = 'Mon, Wed, Fri'
 * - single string: lec.day = 'Mon'
 * - fallback: ['Mon']
 */
export function getLectureDays(lec) {
  if (!lec) return ['Mon'];
  if (Array.isArray(lec.days) && lec.days.length > 0) {
    const valid = lec.days.filter((d) => DAYS_LIST.includes(d));
    if (valid.length > 0) return valid;
  }
  if (Array.isArray(lec.day) && lec.day.length > 0) {
    const valid = lec.day.filter((d) => DAYS_LIST.includes(d));
    if (valid.length > 0) return valid;
  }
  if (typeof lec.day === 'string' && lec.day.trim()) {
    if (lec.day.includes(',')) {
      const parsed = lec.day
        .split(',')
        .map((d) => d.trim())
        .filter((d) => DAYS_LIST.includes(d));
      if (parsed.length > 0) return parsed;
    }
    const single = lec.day.trim();
    if (DAYS_LIST.includes(single)) {
      return [single];
    }
  }
  return ['Mon'];
}

export function detectConflicts(lectures) {
  const conflictMap = {}; // lectureId -> array of conflict objects
  const summaryConflicts = [];

  // Group lectures by time slot AND day
  // Multi-day lectures are scheduled in every day they are assigned to
  const slotDayMap = {};
  lectures.forEach((lec) => {
    const days = getLectureDays(lec);
    days.forEach((day) => {
      const key = `${lec.timeSlot}___${day}`;
      if (!slotDayMap[key]) {
        slotDayMap[key] = { timeSlot: lec.timeSlot, day, lectures: [] };
      }
      slotDayMap[key].lectures.push(lec);
    });
  });

  // Check each timeSlot + day bucket
  Object.values(slotDayMap).forEach(({ timeSlot, day, lectures: slotLectures }) => {
    // 1. Check Teacher overlaps in this time slot on this specific day
    const teacherMap = {};
    slotLectures.forEach((lec) => {
      const teacherName = lec.teacher?.trim();
      if (!teacherName) return;
      const lower = teacherName.toLowerCase();
      if (!teacherMap[lower]) {
        teacherMap[lower] = { name: teacherName, list: [] };
      }
      teacherMap[lower].list.push(lec);
    });

    Object.values(teacherMap).forEach(({ name: teacher, list: lecs }) => {
      if (lecs.length > 1) {
        // Teacher double-booking clash detected on the same day!
        const clashDetails = lecs.map(
          (l) => `${l.program || 'Unknown'}: ${l.subject} (${l.room || 'No Room'}) [${day}]`
        );

        summaryConflicts.push({
          id: `conflict-teacher-${teacher.replace(/\s+/g, '_')}-${timeSlot.replace(/\s+/g, '_')}-${day}`,
          type: 'TEACHER_CLASH',
          teacher,
          timeSlot,
          day,
          count: lecs.length,
          message: `${teacher} is scheduled for ${lecs.length} simultaneous classes on ${day} at ${timeSlot}`,
          details: clashDetails,
          lectureIds: lecs.map((l) => l.id),
        });

        lecs.forEach((lec) => {
          if (!conflictMap[lec.id]) conflictMap[lec.id] = [];
          conflictMap[lec.id].push({
            type: 'TEACHER_CLASH',
            teacher,
            timeSlot,
            day,
            otherLectures: lecs.filter((other) => other.id !== lec.id),
          });
        });
      }
    });

    // 2. Check Room overlaps in this time slot on this specific day
    const roomMap = {};
    slotLectures.forEach((lec) => {
      const room = lec.room?.trim();
      if (!room || room === '-' || room === 'TBA') return;
      const lower = room.toLowerCase();
      if (!roomMap[lower]) {
        roomMap[lower] = { roomName: room, list: [] };
      }
      roomMap[lower].list.push(lec);
    });

    Object.values(roomMap).forEach(({ roomName, list: lecs }) => {
      if (lecs.length > 1) {
        const clashDetails = lecs.map(
          (l) => `${l.program || 'Unknown'}: ${l.subject} (${l.teacher || 'No Teacher'}) [${day}]`
        );

        summaryConflicts.push({
          id: `conflict-room-${roomName.replace(/\s+/g, '_')}-${timeSlot.replace(/\s+/g, '_')}-${day}`,
          type: 'ROOM_CLASH',
          room: roomName,
          timeSlot,
          day,
          count: lecs.length,
          message: `Room ${roomName} has ${lecs.length} overlapping classes on ${day} at ${timeSlot}`,
          details: clashDetails,
          lectureIds: lecs.map((l) => l.id),
        });

        lecs.forEach((lec) => {
          if (!conflictMap[lec.id]) conflictMap[lec.id] = [];
          conflictMap[lec.id].push({
            type: 'ROOM_CLASH',
            room: roomName,
            timeSlot,
            day,
            otherLectures: lecs.filter((other) => other.id !== lec.id),
          });
        });
      }
    });
  });

  return { conflictMap, summaryConflicts };
}

/**
 * Check if moving or placing a lecture causes a teacher clash on any assigned day.
 * Only returns clash if teacher is double-booked on the SAME day at the SAME time.
 * Supports targetDays as string, array of strings, or comma-separated string.
 */
export function willCauseClash(
  targetTimeSlot,
  targetProgram,
  teacher,
  excludeLectureId,
  lectures,
  targetDays = ['Mon']
) {
  if (!teacher || !targetTimeSlot) return null;

  let days = [];
  if (Array.isArray(targetDays)) {
    days = targetDays.filter((d) => DAYS_LIST.includes(d));
  } else if (typeof targetDays === 'string' && targetDays.includes(',')) {
    days = targetDays
      .split(',')
      .map((d) => d.trim())
      .filter((d) => DAYS_LIST.includes(d));
  } else if (typeof targetDays === 'string') {
    const single = targetDays.trim();
    days = DAYS_LIST.includes(single) ? [single] : ['Mon'];
  }
  if (days.length === 0) days = ['Mon'];

  for (const day of days) {
    const existingInSlotAndDay = lectures.filter((lec) => {
      if (lec.id === excludeLectureId) return false;
      if (lec.timeSlot !== targetTimeSlot) return false;
      if (lec.teacher?.trim().toLowerCase() !== teacher.trim().toLowerCase()) return false;
      const lecDays = getLectureDays(lec);
      return lecDays.includes(day);
    });

    if (existingInSlotAndDay.length > 0) {
      return {
        teacher,
        timeSlot: targetTimeSlot,
        day,
        conflictingProgram: existingInSlotAndDay[0].program,
        subject: existingInSlotAndDay[0].subject,
        conflictsWith: existingInSlotAndDay,
      };
    }
  }

  return null;
}
