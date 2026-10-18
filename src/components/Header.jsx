import React from 'react';
import {
  CalendarDays,
  Plus,
  RotateCcw,
  Sparkles,
  Printer,
} from 'lucide-react';

export default function Header({
  onOpenAddLecture,
  onResetData,
  totalLecturesCount,
  conflictsCount,
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo-badge">
          <CalendarDays size={24} className="header-logo-icon" />
        </div>
        <div>
          <div className="header-title-row">
            <h1 className="header-title">Lecture Management System</h1>
            <span className="header-badge-status">
              <Sparkles size={12} /> Interactive Timetable
            </span>
          </div>
          <p className="header-subtitle">
            Dynamic teacher workloads, 4-class quotas, live conflict detection & drag-and-drop scheduling
          </p>
        </div>
      </div>

      <div className="header-right">
        <div className="header-stats-pill">
          <span className="stat-num">{totalLecturesCount}</span>
          <span className="stat-label">Total Classes</span>
        </div>

        {conflictsCount > 0 && (
          <div className="header-conflicts-pill" title={`${conflictsCount} timeline conflicts detected`}>
            <span className="conflict-badge-dot" />
            <span className="stat-num">{conflictsCount}</span>
            <span className="stat-label">Clashes</span>
          </div>
        )}

        <div className="header-actions-group">
          {/* Add Lecture Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddLecture}
            title="Schedule a new lecture"
          >
            <Plus size={16} /> Add Lecture
          </button>

          {/* Print Schedule */}
          <button
            type="button"
            className="btn btn-icon-only"
            onClick={handlePrint}
            title="Print or Save as PDF (Ctrl+P)"
          >
            <Printer size={16} />
          </button>

          {/* Reset to Screenshot Sample Data */}
          <button
            type="button"
            className="btn btn-icon-only"
            onClick={onResetData}
            title="Reset to default screenshot timetable data"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
