import { useState, useEffect } from "react";
import { ownerAPI, adminAPI } from "../../services/api";
import NotificationToast from "../../components/NotificationToast";
import {
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded,
} from "../../utils/helpers";
import "./OwnerPanel.css";

const OwnerPanel = () => {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, usersRes, olympiadsRes] = await Promise.all([
        ownerAPI.getDashboardSummary(),
        adminAPI.getUsers(),
        adminAPI.getAllOlympiads(),
      ]);
      setAnalytics(summaryRes.data?.data || summaryRes.data);
      const usersData = usersRes.data?.data || usersRes.data || [];
      const olympiadsData = olympiadsRes.data?.data || olympiadsRes.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setOlympiads(Array.isArray(olympiadsData) ? olympiadsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({ message: "Failed to load data", type: "error" });
      // Ensure arrays are set to empty arrays on error
      setUsers([]);
      setOlympiads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await ownerAPI.changeUserRole(userId, newRole);
      setNotification({
        message: "User role updated successfully",
        type: "success",
      });
      fetchData();
    } catch (error) {
      setNotification({ message: "Failed to update role", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="owner-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="owner-panel-page">
      <div className="container">
        <div className="owner-header">
          <h1 className="owner-title text-glow">Owner Panel</h1>
        </div>

        {/* Analytics Dashboard */}
        <div className="analytics-section">
          <h2 className="section-title">📊 Platform Analytics & Statistics</h2>

          {/* Key Metrics Cards */}
          <div className="analytics-grid">
            <div className="analytics-card card">
              <div className="analytics-icon">👥</div>
              <div className="analytics-label">Total Users</div>
              <div className="analytics-value">
                {analytics?.totals?.users || users.length || 0}
              </div>
              <div className="analytics-change positive">
                {analytics?.usersByRole?.student ||
                  users.filter((u) => u.role === "student").length} students
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">🏆</div>
              <div className="analytics-label">Total Olympiads</div>
              <div className="analytics-value">
                {analytics?.totals?.olympiads || olympiads.length || 0}
              </div>
              <div className="analytics-change">
                {analytics?.olympiadsByStatus?.published ||
                  olympiads.filter((o) => o.status === "published").length}{" "}
                published
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">📝</div>
              <div className="analytics-label">Total Submissions</div>
              <div className="analytics-value">
                {analytics?.totals?.submissions || 0}
              </div>
              <div className="analytics-change">
                {analytics?.uniqueParticipants || 0}{" "}
                participants
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">⚡</div>
              <div className="analytics-label">Active Olympiads</div>
              <div className="analytics-value">
                {analytics?.olympiadsByTime?.active ||
                  olympiads.filter((o) =>
                    isOlympiadActive(o.startTime, o.endTime)
                  ).length}
              </div>
              <div className="analytics-change positive">Currently running</div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="analytics-details">
            {/* User Distribution */}
            <div className="stat-card card">
              <h3 className="stat-title">👥 User Distribution</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Students</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-student"
                      style={{
                        width: `${
                          (analytics?.totals?.users || users.length) > 0
                            ? ((analytics?.usersByRole?.student ||
                                users.filter((u) => u.role === "student")
                                  .length) /
                                (analytics?.totals?.users || users.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.usersByRole?.student ||
                        users.filter((u) => u.role === "student").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Admins</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-admin"
                      style={{
                        width: `${
                          (analytics?.totals?.users || users.length) > 0
                            ? ((analytics?.usersByRole?.admin ||
                                users.filter((u) => u.role === "admin")
                                  .length) /
                                (analytics?.totals?.users || users.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.usersByRole?.admin ||
                        users.filter((u) => u.role === "admin").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Owners</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-owner"
                      style={{
                        width: `${
                          (analytics?.totals?.users || users.length) > 0
                            ? ((analytics?.usersByRole?.owner ||
                                users.filter((u) => u.role === "owner")
                                  .length) /
                                (analytics?.totals?.users || users.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.usersByRole?.owner ||
                        users.filter((u) => u.role === "owner").length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Status */}
            <div className="stat-card card">
              <h3 className="stat-title">🏆 Olympiad Status</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Published</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-published"
                      style={{
                        width: `${
                          (analytics?.totals?.olympiads || olympiads.length) > 0
                            ? ((analytics?.olympiadsByStatus?.published ||
                                olympiads.filter((o) => o.status === "published")
                                  .length) /
                                (analytics?.totals?.olympiads || olympiads.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByStatus?.published ||
                        olympiads.filter((o) => o.status === "published").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Draft</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-draft"
                      style={{
                        width: `${
                          (analytics?.totals?.olympiads || olympiads.length) > 0
                            ? ((analytics?.olympiadsByStatus?.draft ||
                                olympiads.filter((o) => o.status === "draft")
                                  .length) /
                                (analytics?.totals?.olympiads || olympiads.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByStatus?.draft ||
                        olympiads.filter((o) => o.status === "draft").length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Unpublished</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-unpublished"
                      style={{
                        width: `${
                          (analytics?.totals?.olympiads || olympiads.length) > 0
                            ? ((analytics?.olympiadsByStatus?.unpublished ||
                                olympiads.filter(
                                  (o) => o.status === "unpublished"
                                ).length) /
                                (analytics?.totals?.olympiads || olympiads.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByStatus?.unpublished ||
                        olympiads.filter((o) => o.status === "unpublished")
                          .length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Timeline */}
            <div className="stat-card card">
              <h3 className="stat-title">📅 Olympiad Timeline</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">Active</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-active"
                      style={{
                        width: `${
                          (analytics?.totals?.olympiads || olympiads.length) > 0
                            ? ((analytics?.olympiadsByTime?.active ||
                                olympiads.filter((o) =>
                                  isOlympiadActive(o.startTime, o.endTime)
                                ).length) /
                                (analytics?.totals?.olympiads || olympiads.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByTime?.active ||
                        olympiads.filter((o) =>
                          isOlympiadActive(o.startTime, o.endTime)
                        ).length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Upcoming</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-upcoming"
                      style={{
                        width: `${
                          (analytics?.totals?.olympiads || olympiads.length) > 0
                            ? ((analytics?.olympiadsByTime?.upcoming ||
                                olympiads.filter((o) =>
                                  isOlympiadUpcoming(o.startTime)
                                ).length) /
                                (analytics?.totals?.olympiads || olympiads.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByTime?.upcoming ||
                        olympiads.filter((o) => isOlympiadUpcoming(o.startTime))
                          .length}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Ended</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-ended"
                      style={{
                        width: `${
                          (analytics?.totals?.olympiads || olympiads.length) > 0
                            ? ((analytics?.olympiadsByTime?.ended ||
                                olympiads.filter((o) =>
                                  isOlympiadEnded(o.endTime)
                                ).length) /
                                (analytics?.totals?.olympiads || olympiads.length)) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                    <span className="stat-value">
                      {analytics?.olympiadsByTime?.ended ||
                        olympiads.filter((o) => isOlympiadEnded(o.endTime))
                          .length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participation Statistics */}
            <div className="stat-card card">
              <h3 className="stat-title">📊 Participation Statistics</h3>
              <div className="stat-content">
                <div className="stat-metric">
                  <div className="metric-value">
                    {analytics?.uniqueParticipants || 0}
                  </div>
                  <div className="metric-label">Unique Participants</div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {analytics?.avgSubmissionsPerOlympiad !== undefined
                      ? analytics.avgSubmissionsPerOlympiad.toFixed(1)
                      : "0"}
                  </div>
                  <div className="metric-label">
                    Avg Submissions per Olympiad
                  </div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {analytics?.studentParticipationRate !== undefined
                      ? analytics.studentParticipationRate.toFixed(1)
                      : "0"}
                    %
                  </div>
                  <div className="metric-label">Student Participation Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="users-section">
          <h2>User Management</h2>
          <div className="users-table card">
            <div className="table-header">
              <div className="table-cell">Name</div>
              <div className="table-cell">Email</div>
              <div className="table-cell">Role</div>
              <div className="table-cell">Actions</div>
            </div>
            <div className="table-body">
              {users.map((user) => (
                <div key={user._id} className="table-row">
                  <div className="table-cell">{user.name || "N/A"}</div>
                  <div className="table-cell">{user.email}</div>
                  <div className="table-cell">
                    <span className="role-badge">{user.role}</span>
                  </div>
                  <div className="table-cell">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
                      className="role-select"
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default OwnerPanel;
