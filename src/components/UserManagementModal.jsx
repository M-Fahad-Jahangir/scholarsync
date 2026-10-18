import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  CheckCircle2,
  XCircle,
  Trash2,
  Shield,
  ShieldAlert,
  Clock,
  Search,
  Check,
  Ban,
  UserCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  subscribeToAllUsers,
  approveUser,
  revokeUser,
  deleteUserRecord,
} from '../services/authService';

export default function UserManagementModal({ isOpen, onClose, currentUserEmail }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'revoked'
  const [actionInProgressUid, setActionInProgressUid] = useState(null);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = subscribeToAllUsers(
      (users) => {
        setUsersList(users);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showNotice = (msg, type = 'success') => {
    setFeedbackNotice({ msg, type });
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 4000);
  };

  const handleApprove = async (user) => {
    setActionInProgressUid(user.uid);
    try {
      await approveUser(user.uid, currentUserEmail);
      showNotice(`Approved ${user.email} for permanent lifetime access!`, 'success');
    } catch (err) {
      console.error('Failed to approve user:', err);
      showNotice(`Failed to approve: ${err.message}`, 'error');
    } finally {
      setActionInProgressUid(null);
    }
  };

  const handleRevoke = async (user) => {
    if (user.email?.toLowerCase() === currentUserEmail?.toLowerCase()) {
      alert('You cannot revoke your own Super Admin access.');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to suspend access for "${user.displayName || user.email}"?\nThey will immediately be locked out of the application.`
    );
    if (!confirmed) return;

    setActionInProgressUid(user.uid);
    try {
      await revokeUser(user.uid, currentUserEmail);
      showNotice(`Suspended access for ${user.email}.`, 'warning');
    } catch (err) {
      console.error('Failed to revoke user:', err);
      showNotice(`Failed to revoke: ${err.message}`, 'error');
    } finally {
      setActionInProgressUid(null);
    }
  };

  const handleDelete = async (user) => {
    if (user.email?.toLowerCase() === currentUserEmail?.toLowerCase()) {
      alert('You cannot delete your own Super Admin account.');
      return;
    }
    const confirmed = window.confirm(
      `PERMANENT ACTION:\nAre you sure you want to delete user "${user.displayName || user.email}"?\nThis removes their user profile and completely bans them from logging in.`
    );
    if (!confirmed) return;

    setActionInProgressUid(user.uid);
    try {
      await deleteUserRecord(user.uid);
      showNotice(`Deleted user ${user.email} from ScholarSync.`, 'info');
    } catch (err) {
      console.error('Failed to delete user:', err);
      showNotice(`Failed to delete: ${err.message}`, 'error');
    } finally {
      setActionInProgressUid(null);
    }
  };

  // Stats calculation
  const totalCount = usersList.length;
  const pendingUsers = usersList.filter((u) => u.status === 'pending');
  const approvedUsers = usersList.filter(
    (u) => u.status === 'approved' || u.role === 'superadmin'
  );
  const revokedUsers = usersList.filter((u) => u.status === 'revoked');

  // Filtered list
  const filteredUsers = usersList.filter((u) => {
    // Tab filter
    if (activeTab === 'pending' && u.status !== 'pending') return false;
    if (
      activeTab === 'approved' &&
      u.status !== 'approved' &&
      u.role !== 'superadmin'
    )
      return false;
    if (activeTab === 'revoked' && u.status !== 'revoked') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.displayName || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box modal-box-xl user-mgmt-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-bubble bg-primary-subtle">
              <Users size={22} className="text-primary" />
            </div>
            <div>
              <div className="modal-title-with-badge">
                <h3 className="modal-title">User Access & Approval Management</h3>
                <span className="badge badge-superadmin">
                  <Shield size={12} /> Super Admin Control
                </span>
              </div>
              <p className="modal-subtitle">
                Review sign-up requests, grant permanent lifetime access, or revoke and delete accounts anytime.
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackNotice && (
          <div className={`user-mgmt-toast-banner toast-${feedbackNotice.type}`}>
            {feedbackNotice.type === 'success' && <CheckCircle2 size={16} />}
            {feedbackNotice.type === 'warning' && <AlertTriangle size={16} />}
            {feedbackNotice.type === 'info' && <Trash2 size={16} />}
            {feedbackNotice.type === 'error' && <XCircle size={16} />}
            <span>{feedbackNotice.msg}</span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="user-mgmt-stats-grid">
          <div
            className={`stat-card ${activeTab === 'all' ? 'stat-card-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{totalCount}</div>
            <div className="stat-sub">Registered accounts</div>
          </div>

          <div
            className={`stat-card stat-pending ${
              activeTab === 'pending' ? 'stat-card-active' : ''
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <div className="stat-label">
              <Clock size={14} className="text-warning" /> Pending Approvals
            </div>
            <div className="stat-value text-warning">{pendingUsers.length}</div>
            <div className="stat-sub">Waiting for your sign-off</div>
          </div>

          <div
            className={`stat-card stat-approved ${
              activeTab === 'approved' ? 'stat-card-active' : ''
            }`}
            onClick={() => setActiveTab('approved')}
          >
            <div className="stat-label">
              <CheckCircle2 size={14} className="text-success" /> Active / Approved
            </div>
            <div className="stat-value text-success">{approvedUsers.length}</div>
            <div className="stat-sub">Lifetime access active</div>
          </div>

          <div
            className={`stat-card stat-revoked ${
              activeTab === 'revoked' ? 'stat-card-active' : ''
            }`}
            onClick={() => setActiveTab('revoked')}
          >
            <div className="stat-label">
              <Ban size={14} className="text-danger" /> Revoked / Suspended
            </div>
            <div className="stat-value text-danger">{revokedUsers.length}</div>
            <div className="stat-sub">Locked out</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="user-mgmt-toolbar">
          <div className="user-mgmt-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="user-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="user-filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${activeTab === 'all' ? 'pill-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className={`filter-pill pill-pending ${
                activeTab === 'pending' ? 'pill-active' : ''
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingUsers.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'approved' ? 'pill-active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved ({approvedUsers.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'revoked' ? 'pill-active' : ''}`}
              onClick={() => setActiveTab('revoked')}
            >
              Revoked ({revokedUsers.length})
            </button>
          </div>
        </div>

        {/* Users Table / List */}
        <div className="user-mgmt-table-wrapper">
          {loading ? (
            <div className="user-mgmt-empty-state">
              <Clock size={28} className="spinner-icon text-primary" />
              <p>Fetching user directory from Firebase...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="user-mgmt-empty-state">
              <Users size={32} className="text-muted" />
              <p className="empty-title">No users found</p>
              <p className="empty-desc">
                {searchQuery
                  ? `No accounts matching "${searchQuery}"`
                  : activeTab === 'pending'
                  ? 'All signups have been reviewed! There are no pending approvals.'
                  : 'No users in this category.'}
              </p>
            </div>
          ) : (
            <table className="user-mgmt-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Access Status</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent =
                    u.email?.toLowerCase() === currentUserEmail?.toLowerCase();
                  const isSuper = u.role === 'superadmin';
                  const isPending = u.status === 'pending';
                  const isRevoked = u.status === 'revoked';
                  const isApproved = u.status === 'approved' || isSuper;
                  const isBusy = actionInProgressUid === u.uid;

                  return (
                    <tr
                      key={u.id || u.uid}
                      className={`user-row ${
                        isPending ? 'user-row-pending' : ''
                      } ${isRevoked ? 'user-row-revoked' : ''}`}
                    >
                      <td>
                        <div className="user-cell-meta">
                          <div
                            className={`user-avatar ${
                              isSuper ? 'avatar-superadmin' : ''
                            }`}
                          >
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="user-details">
                            <span className="user-name">
                              {u.displayName || 'No Name'}
                              {isCurrent && (
                                <span className="current-user-tag">(You)</span>
                              )}
                            </span>
                            <span className="user-email">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {isSuper ? (
                          <span className="badge badge-superadmin">
                            <Shield size={12} /> Super Admin
                          </span>
                        ) : (
                          <span className="badge badge-user">Academic User</span>
                        )}
                      </td>

                      <td>
                        {isPending ? (
                          <span className="badge badge-status-pending">
                            <Clock size={12} /> Pending Approval
                          </span>
                        ) : isRevoked ? (
                          <span className="badge badge-status-revoked">
                            <ShieldAlert size={12} /> Access Revoked
                          </span>
                        ) : (
                          <span className="badge badge-status-approved">
                            <CheckCircle2 size={12} /> Lifetime Access
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="user-date-text">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="user-actions-cluster">
                          {isPending && (
                            <button
                              type="button"
                              className="btn btn-sm btn-approve"
                              disabled={isBusy}
                              onClick={() => handleApprove(u)}
                              title="Approve user for lifetime access"
                            >
                              <UserCheck size={14} />
                              <span>Approve (Lifetime)</span>
                            </button>
                          )}

                          {isApproved && !isSuper && !isCurrent && (
                            <button
                              type="button"
                              className="btn btn-sm btn-revoke"
                              disabled={isBusy}
                              onClick={() => handleRevoke(u)}
                              title="Revoke / suspend access"
                            >
                              <Ban size={14} />
                              <span>Revoke</span>
                            </button>
                          )}

                          {isRevoked && (
                            <button
                              type="button"
                              className="btn btn-sm btn-approve"
                              disabled={isBusy}
                              onClick={() => handleApprove(u)}
                              title="Re-approve user for lifetime access"
                            >
                              <Check size={14} />
                              <span>Re-Approve</span>
                            </button>
                          )}

                          {!isCurrent && (
                            <button
                              type="button"
                              className="btn btn-sm btn-delete-user"
                              disabled={isBusy}
                              onClick={() => handleDelete(u)}
                              title="Delete user permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Informational Footer */}
        <div className="user-mgmt-footer-hint">
          <Sparkles size={16} className="text-primary flex-shrink-0" />
          <span>
            <strong>Lifetime Approval System:</strong> Approved users retain access indefinitely. You can revoke access or delete their account at any time, instantly locking them out in real time across all open tabs.
          </span>
        </div>
      </div>
    </div>
  );
}
