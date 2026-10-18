import React from 'react';
import { BookOpen, CheckCircle2, AlertCircle, Circle } from 'lucide-react';

export default function SubjectProgressSection({
  subjectProgress,
  selectedSubjectFilter,
  onSelectSubjectFilter,
}) {
  return (
    <section className="section-card subject-progress-card">
      <div className="section-header">
        <div className="section-title-group">
          <div className="section-icon-bubble">
            <BookOpen size={18} className="text-primary" />
          </div>
          <h2 className="section-title">Subject progress</h2>
        </div>

        <div className="section-actions">
          {selectedSubjectFilter && (
            <button
              type="button"
              className="btn btn-outline-sm btn-clear-filter"
              onClick={() => onSelectSubjectFilter(null)}
              title="Clear subject filter"
            >
              Clear Filter ({selectedSubjectFilter})
            </button>
          )}
        </div>
      </div>

      <div className="progress-cards-grid">
        {subjectProgress.map((item, index) => {
          const { subject, count, target, department } = item;
          const isTargetReached = count === target;
          const isExceeded = count > target;
          const isSelected = selectedSubjectFilter === subject;

          // Determine progress bar percent (capped at 100%)
          const percent = Math.min(100, Math.round((count / target) * 100));

          // Determine status color class
          let statusTheme = 'theme-blue'; // Default blue when count < 4
          if (isTargetReached) {
            statusTheme = 'theme-green'; // Green when exactly 4/4
          } else if (isExceeded) {
            statusTheme = 'theme-red'; // Red when > 4
          }

          return (
            <div
              key={item.id || `${department || ''}-${subject}-${index}`}
              className={`progress-card ${statusTheme} ${
                isSelected ? 'card-selected' : ''
              }`}
              onClick={() => onSelectSubjectFilter(isSelected ? null : subject)}
              title={`Click to filter "${subject}"${department ? ` (${department})` : ''} on timetable. Count: ${count}/${target}`}
            >
              <div className="progress-card-top">
                <span className="subject-title" title={`${subject}${department ? ` • ${department}` : ''}`}>
                  {subject}
                  {department && (
                    <span className="subject-dept-subtext" style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                      {department}
                    </span>
                  )}
                </span>

                <div className="status-indicator">
                  {isTargetReached && (
                    <CheckCircle2
                      size={18}
                      className="indicator-icon text-green"
                      title="Completed (4/4)"
                    />
                  )}
                  {isExceeded && (
                    <AlertCircle
                      size={18}
                      className="indicator-icon text-red"
                      title={`Exceeded! Limit is ${target}/week, currently ${count}`}
                    />
                  )}
                  {!isTargetReached && !isExceeded && (
                    <Circle
                      size={17}
                      className="indicator-icon text-blue"
                      title={`In progress (${count}/${target})`}
                    />
                  )}
                </div>
              </div>

              <div className="progress-card-middle">
                <div className="count-display">
                  <span className="count-current">{count}</span>
                  <span className="count-separator">/</span>
                  <span className="count-target">{target}</span>
                  {isExceeded && (
                    <span className="limit-exceeded-badge">Exceeded</span>
                  )}
                </div>
              </div>

              {/* Progress bar line */}
              <div className="progress-bar-track">
                <div
                  className={`progress-bar-fill ${statusTheme}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
