import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, Sparkles } from 'lucide-react';

export default function ConflictAlertBanner({
  conflicts,
  onHighlightConflictLectures,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <div className="conflict-banner">
      <div className="conflict-banner-main">
        <div className="conflict-banner-left">
          <div className="conflict-icon-wrap">
            <ShieldAlert size={20} className="conflict-icon" />
          </div>
          <div>
            <h4 className="conflict-banner-title">
              Timeline Conflicts Detected ({conflicts.length})
            </h4>
            <p className="conflict-banner-sub">
              Teachers or rooms are double-booked at the same time slot across multiple classes.
            </p>
          </div>
        </div>

        <div className="conflict-banner-right">
          <button
            type="button"
            className="conflict-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                Hide Details <ChevronUp size={16} />
              </>
            ) : (
              <>
                View Details ({conflicts.length}) <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="conflict-list">
          {conflicts.map((c) => (
            <div key={c.id} className="conflict-item">
              <div className="conflict-item-header">
                <AlertTriangle size={14} className="text-red" />
                <span className="conflict-message">{c.message}</span>
                <span className="conflict-tag">{c.timeSlot}</span>
              </div>
              <ul className="conflict-details-list">
                {c.details.map((detail, idx) => (
                  <li key={idx} className="conflict-detail-item">
                    • {detail}
                  </li>
                ))}
              </ul>
              {onHighlightConflictLectures && (
                <button
                  type="button"
                  className="conflict-locate-btn"
                  onClick={() => onHighlightConflictLectures(c.lectureIds)}
                >
                  <Sparkles size={12} /> Highlight on Timetable
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
