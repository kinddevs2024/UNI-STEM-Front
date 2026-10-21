import { getIntlLocale } from '../../i18n/runtime';
import { t, useLocale } from "../../i18n/runtime";import { useState, useEffect } from "react";
import { ownerAPI, adminAPI } from "../../services/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid } from
"recharts";
import NotificationToast from "../../components/NotificationToast";
import {
  isOlympiadActive,
  isOlympiadUpcoming,
  isOlympiadEnded } from
"../../utils/helpers";
import "./OwnerPanel.css";
import "../AdminPanel/PanelRedesign.css";

const OwnerPanel = () => {useLocale();
  const [coinTarget, setCoinTarget] = useState(null);
  const [coinAmount, setCoinAmount] = useState('100');
  const [coinRequestId, setCoinRequestId] = useState('');
  const [coinSaving, setCoinSaving] = useState(false);
  const openCoinTopup = (student) => {setCoinTarget(student);setCoinAmount('100');setCoinRequestId(crypto.randomUUID());};
  const addStudentCoins = async (event) => {
    event.preventDefault();
    const amount = Number(coinAmount);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) return;
    setCoinSaving(true);
    try {
      const response = await ownerAPI.addStudentCoins(coinTarget._id, { amount, requestId: coinRequestId });
      setNotification({ message: `Coins added. Student balance: ${response.data.coins} coins.`, type: 'success' });
      setCoinTarget(null);fetchUsers();
    } catch (error) {setNotification({ message: error.response?.data?.message || 'Could not add coins. Please try again.', type: 'error' });} finally
    {setCoinSaving(false);}
  };
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [olympiadsLoading, setOlympiadsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(20);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState("");
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  const [olympiadsPage, setOlympiadsPage] = useState(1);
  const [olympiadsLimit, setOlympiadsLimit] = useState(20);
  const [olympiadsSearch, setOlympiadsSearch] = useState("");
  const [olympiadsStatus, setOlympiadsStatus] = useState("");
  const [olympiadsPagination, setOlympiadsPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    };
  };

  const defaultRange = getDefaultDateRange();
  const [metricsStartDate, setMetricsStartDate] = useState(defaultRange.startDate);
  const [metricsEndDate, setMetricsEndDate] = useState(defaultRange.endDate);
  const [metricsData, setMetricsData] = useState(null);

  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(20);
  const [auditAction, setAuditAction] = useState("");
  const [auditStartDate, setAuditStartDate] = useState("");
  const [auditEndDate, setAuditEndDate] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [systemControls, setSystemControls] = useState({
    emailVerificationEnabled: true,
    requireProfileCompletion: true,
    apiEnabled: true
  });
  const [controlsLoading, setControlsLoading] = useState(true);
  const [controlsSaving, setControlsSaving] = useState(false);
  const [pendingApiToggleValue, setPendingApiToggleValue] = useState(null);
  const [apiToggleConfirmText, setApiToggleConfirmText] = useState("");

  useEffect(() => {
    fetchSummary();
    fetchSystemControls();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [usersPage, usersLimit, usersSearch, usersRole]);

  useEffect(() => {
    fetchOlympiads();
  }, [olympiadsPage, olympiadsLimit, olympiadsSearch, olympiadsStatus]);

  useEffect(() => {
    if (metricsStartDate && metricsEndDate) {
      fetchMetrics();
    }
  }, [metricsStartDate, metricsEndDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [auditPage, auditLimit, auditAction, auditStartDate, auditEndDate]);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const summaryRes = await ownerAPI.getDashboardSummary();
      setAnalytics(summaryRes.data?.data || summaryRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({ message: "Failed to load data", type: "error" });
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchSystemControls = async () => {
    setControlsLoading(true);
    try {
      const controlsRes = await ownerAPI.getSystemControls();
      const controls = controlsRes.data?.data || {};
      setSystemControls({
        emailVerificationEnabled: controls.emailVerificationEnabled !== false,
        requireProfileCompletion: controls.requireProfileCompletion !== false,
        apiEnabled: controls.apiEnabled !== false
      });
    } catch (error) {
      console.error("Error fetching system controls:", error);
      setNotification({ message: "Failed to load owner controls", type: "error" });
    } finally {
      setControlsLoading(false);
    }
  };

  const handleControlToggle = (key) => {
    if (key === "apiEnabled") {
      setPendingApiToggleValue(!systemControls.apiEnabled);
      setApiToggleConfirmText("");
      return;
    }

    setSystemControls((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const cancelApiToggle = () => {
    setPendingApiToggleValue(null);
    setApiToggleConfirmText("");
  };

  const confirmApiToggle = () => {
    if (pendingApiToggleValue === null) return;
    if (apiToggleConfirmText.trim() !== "CONFIRM") return;

    setSystemControls((prev) => ({
      ...prev,
      apiEnabled: pendingApiToggleValue
    }));
    setPendingApiToggleValue(null);
    setApiToggleConfirmText("");
  };

  const handleSaveSystemControls = async () => {
    setControlsSaving(true);
    try {
      await ownerAPI.updateSystemControls(systemControls);
      setNotification({ message: "Owner controls updated", type: "success" });
      fetchAuditLogs();
    } catch (error) {
      console.error("Error saving system controls:", error);
      setNotification({ message: "Failed to save owner controls", type: "error" });
    } finally {
      setControlsSaving(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const usersRes = await adminAPI.getUsers({
        page: usersPage,
        limit: usersLimit,
        search: usersSearch,
        role: usersRole
      });
      const usersData = usersRes.data?.data || usersRes.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setUsersPagination(
        usersRes.data?.pagination || {
          page: usersPage,
          pages: 1,
          total: Array.isArray(usersData) ? usersData.length : 0,
          limit: usersLimit
        }
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      setNotification({ message: "Failed to load users", type: "error" });
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchOlympiads = async () => {
    setOlympiadsLoading(true);
    try {
      const olympiadsRes = await adminAPI.getAllOlympiads({
        page: olympiadsPage,
        limit: olympiadsLimit,
        search: olympiadsSearch,
        status: olympiadsStatus
      });
      const olympiadsData = olympiadsRes.data?.data || olympiadsRes.data || [];
      setOlympiads(Array.isArray(olympiadsData) ? olympiadsData : []);
      setOlympiadsPagination(
        olympiadsRes.data?.pagination || {
          page: olympiadsPage,
          pages: 1,
          total: Array.isArray(olympiadsData) ? olympiadsData.length : 0,
          limit: olympiadsLimit
        }
      );
    } catch (error) {
      console.error("Error fetching olympiads:", error);
      setNotification({ message: "Failed to load olympiads", type: "error" });
      setOlympiads([]);
    } finally {
      setOlympiadsLoading(false);
    }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const metricsRes = await ownerAPI.getMetrics({
        startDate: metricsStartDate,
        endDate: metricsEndDate
      });
      setMetricsData(metricsRes.data?.data || null);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setNotification({ message: "Failed to load metrics", type: "error" });
      setMetricsData(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const auditRes = await ownerAPI.getAuditLogs({
        page: auditPage,
        limit: auditLimit,
        action: auditAction,
        startDate: auditStartDate || null,
        endDate: auditEndDate || null
      });
      const data = auditRes.data?.data || [];
      setAuditLogs(Array.isArray(data) ? data : []);
      setAuditPagination(
        auditRes.data?.pagination || {
          page: auditPage,
          pages: 1,
          total: Array.isArray(data) ? data.length : 0,
          limit: auditLimit
        }
      );
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setNotification({ message: "Failed to load audit logs", type: "error" });
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await ownerAPI.changeUserRole(userId, newRole);
      setNotification({
        message: "User role updated successfully",
        type: "success"
      });
      fetchSummary();
      fetchUsers();
      fetchAuditLogs();
    } catch (error) {
      setNotification({ message: "Failed to update role", type: "error" });
    }
  };

  const requestRoleChange = (user, newRole) => {
    if (user.role === newRole) return;
    setPendingRoleChange({
      userId: user._id,
      userName: user.name || user.email,
      previousRole: user.role,
      newRole
    });
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    await handleRoleChange(pendingRoleChange.userId, pendingRoleChange.newRole);
    setPendingRoleChange(null);
  };

  const cancelRoleChange = () => {
    setPendingRoleChange(null);
  };

  const isInitialLoading = summaryLoading || usersLoading || olympiadsLoading;

  const renderMetricChart = (title, series, valueSuffix = "") => {
    if (!Array.isArray(series) || series.length === 0) {
      return (
        <div className="chart-card card">
          <div className="chart-header">
            <h3 className="chart-title">{t(title)}</h3>
          </div>
          <div className="chart-empty">{t("No data")}</div>
        </div>);

    }

    return (
      <div className="chart-card card">
        <div className="chart-header">
          <h3 className="chart-title">{t(title)}</h3>
          <div className="chart-range">{t(metricsStartDate)} → {t(metricsEndDate)}</div>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-line)" />
              <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}${valueSuffix}`} />
              <Line type="monotone" dataKey="value" stroke="#8e74b5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>);

  };

  const formatShortDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString(getIntlLocale());
  };

  const formatTimestamp = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString(getIntlLocale());
  };

  const usersTotal = analytics?.totals?.users || usersPagination.total || users.length || 0;
  const olympiadsTotal = analytics?.totals?.olympiads || olympiadsPagination.total || olympiads.length || 0;

  const downloadCsv = (data, filename) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportUsers = async () => {
    try {
      const response = await ownerAPI.exportUsers({
        search: usersSearch,
        role: usersRole
      });
      downloadCsv(response.data, "owner-users.csv");
    } catch (error) {
      console.error("Export users error:", error);
      setNotification({ message: "Failed to export users", type: "error" });
    }
  };

  const handleExportOlympiads = async () => {
    try {
      const response = await ownerAPI.exportOlympiads({
        search: olympiadsSearch,
        status: olympiadsStatus
      });
      downloadCsv(response.data, "owner-olympiads.csv");
    } catch (error) {
      console.error("Export olympiads error:", error);
      setNotification({ message: "Failed to export olympiads", type: "error" });
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const response = await ownerAPI.exportAuditLogs({
        action: auditAction,
        startDate: auditStartDate || null,
        endDate: auditEndDate || null
      });
      downloadCsv(response.data, "owner-audit-logs.csv");
    } catch (error) {
      console.error("Export audit logs error:", error);
      setNotification({ message: "Failed to export audit logs", type: "error" });
    }
  };

  const handleExportMetrics = async () => {
    try {
      const response = await ownerAPI.exportMetrics({
        startDate: metricsStartDate,
        endDate: metricsEndDate
      });
      downloadCsv(response.data, "owner-metrics.csv");
    } catch (error) {
      console.error("Export metrics error:", error);
      setNotification({ message: "Failed to export metrics", type: "error" });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="owner-loading brand-panel" data-brand-panel="owner">
        <div className="loading-spinner"></div>
      </div>);

  }

  return (
    <div className="owner-panel-page brand-panel" data-brand-panel="owner">
      <div className="container">
        <div className="owner-header">
          <h1 className="owner-title text-glow">{t("Owner Panel")}</h1>
        </div>

        <div className="owner-controls-section card">
          <div className="owner-controls-header">
            <h2 className="section-title">{t("🛡️ Owner Control Panel")}</h2>
            <button
              className="export-button"
              onClick={handleSaveSystemControls}
              disabled={controlsLoading || controlsSaving}>

              {t(controlsSaving ? "Saving..." : "Save Controls")}
            </button>
          </div>

          {controlsLoading ?
          <div className="section-loading">{t("Loading controls...")}</div> :

          <div className="owner-controls-grid">
              <div className="owner-control-item">
                <div className="owner-control-text">
                  <h3>{t("Email Verification")}</h3>
                  <p>{t("Require email verification during authentication.")}</p>
                </div>
                <label className="owner-switch">
                  <input
                  type="checkbox"
                  checked={systemControls.emailVerificationEnabled}
                  onChange={() => handleControlToggle("emailVerificationEnabled")} />

                  <span className="owner-switch-slider" />
                </label>
              </div>

              <div className="owner-control-item">
                <div className="owner-control-text">
                  <h3>{t("Profile Completeness Check")}</h3>
                  <p>{t("Require full student profile before olympiad start.")}</p>
                </div>
                <label className="owner-switch">
                  <input
                  type="checkbox"
                  checked={systemControls.requireProfileCompletion}
                  onChange={() => handleControlToggle("requireProfileCompletion")} />

                  <span className="owner-switch-slider" />
                </label>
              </div>

              <div className="owner-control-item owner-control-danger">
                <div className="owner-control-text">
                  <h3>{t("Global API Access")}</h3>
                  <p>{t("Emergency switch: disable or enable API responses platform-wide.")}</p>
                </div>
                <label className="owner-switch">
                  <input
                  type="checkbox"
                  checked={systemControls.apiEnabled}
                  onChange={() => handleControlToggle("apiEnabled")} />

                  <span className="owner-switch-slider" />
                </label>
              </div>
            </div>
          }
        </div>

        {/* Analytics Dashboard */}
        <div className="analytics-section">
          <h2 className="section-title">{t("📊 Platform Analytics & Statistics")}</h2>

          {/* Key Metrics Cards */}
          <div className="analytics-grid">
            <div className="analytics-card card">
              <div className="analytics-icon">👥</div>
              <div className="analytics-label">{t("Total Users")}</div>
              <div className="analytics-value">
                {t(usersTotal)}
              </div>
              <div className="analytics-change positive">
                {t(analytics?.usersByRole?.student ||
                users.filter((u) => u.role === "student").length)}{t(" students ")}
              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">🏆</div>
              <div className="analytics-label">{t("Total Olympiads")}</div>
              <div className="analytics-value">
                {t(olympiadsTotal)}
              </div>
              <div className="analytics-change">
                {t(analytics?.olympiadsByStatus?.published ||
                olympiads.filter((o) => o.status === "published").length)}{t(" ")}{t("published ")}

              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">📝</div>
              <div className="analytics-label">{t("Total Submissions")}</div>
              <div className="analytics-value">
                {t(analytics?.totals?.submissions || 0)}
              </div>
              <div className="analytics-change">
                {t(analytics?.uniqueParticipants || 0)}{t(" ")}{t("participants ")}

              </div>
            </div>

            <div className="analytics-card card">
              <div className="analytics-icon">⚡</div>
              <div className="analytics-label">{t("Active Olympiads")}</div>
              <div className="analytics-value">
                {t(analytics?.olympiadsByTime?.active ||
                olympiads.filter((o) =>
                isOlympiadActive(o.startTime, o.endTime)
                ).length)}
              </div>
              <div className="analytics-change positive">{t("Currently running")}</div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="analytics-details">
            {/* User Distribution */}
            <div className="stat-card card">
              <h3 className="stat-title">{t("👥 User Distribution")}</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">{t("Students")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-student"
                      style={{
                        width: `${
                        usersTotal > 0 ?
                        (analytics?.usersByRole?.student ||
                        users.filter((u) => u.role === "student").
                        length) /
                        usersTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.usersByRole?.student ||
                      users.filter((u) => u.role === "student").length)}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("Admins")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-admin"
                      style={{
                        width: `${
                        usersTotal > 0 ?
                        (analytics?.usersByRole?.admin ||
                        users.filter((u) => u.role === "admin").
                        length) /
                        usersTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.usersByRole?.admin ||
                      users.filter((u) => u.role === "admin").length)}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("Owners")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-owner"
                      style={{
                        width: `${
                        usersTotal > 0 ?
                        (analytics?.usersByRole?.owner ||
                        users.filter((u) => u.role === "owner").
                        length) /
                        usersTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.usersByRole?.owner ||
                      users.filter((u) => u.role === "owner").length)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Status */}
            <div className="stat-card card">
              <h3 className="stat-title">{t("🏆 Olympiad Status")}</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">{t("Published")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-published"
                      style={{
                        width: `${
                        olympiadsTotal > 0 ?
                        (analytics?.olympiadsByStatus?.published ||
                        olympiads.filter((o) => o.status === "published").
                        length) /
                        olympiadsTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.olympiadsByStatus?.published ||
                      olympiads.filter((o) => o.status === "published").length)}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("Draft")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-draft"
                      style={{
                        width: `${
                        olympiadsTotal > 0 ?
                        (analytics?.olympiadsByStatus?.draft ||
                        olympiads.filter((o) => o.status === "draft").
                        length) /
                        olympiadsTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.olympiadsByStatus?.draft ||
                      olympiads.filter((o) => o.status === "draft").length)}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("Unpublished")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-unpublished"
                      style={{
                        width: `${
                        olympiadsTotal > 0 ?
                        (analytics?.olympiadsByStatus?.unpublished ||
                        olympiads.filter(
                          (o) => o.status === "unpublished"
                        ).length) /
                        olympiadsTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.olympiadsByStatus?.unpublished ||
                      olympiads.filter((o) => o.status === "unpublished").
                      length)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Olympiad Timeline */}
            <div className="stat-card card">
              <h3 className="stat-title">{t("📅 Olympiad Timeline")}</h3>
              <div className="stat-content">
                <div className="stat-item">
                  <span className="stat-label">{t("Active")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-active"
                      style={{
                        width: `${
                        olympiadsTotal > 0 ?
                        (analytics?.olympiadsByTime?.active ||
                        olympiads.filter((o) =>
                        isOlympiadActive(o.startTime, o.endTime)
                        ).length) /
                        olympiadsTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.olympiadsByTime?.active ||
                      olympiads.filter((o) =>
                      isOlympiadActive(o.startTime, o.endTime)
                      ).length)}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("Upcoming")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-upcoming"
                      style={{
                        width: `${
                        olympiadsTotal > 0 ?
                        (analytics?.olympiadsByTime?.upcoming ||
                        olympiads.filter((o) =>
                        isOlympiadUpcoming(o.startTime)
                        ).length) /
                        olympiadsTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.olympiadsByTime?.upcoming ||
                      olympiads.filter((o) => isOlympiadUpcoming(o.startTime)).
                      length)}
                    </span>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("Ended")}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar stat-bar-ended"
                      style={{
                        width: `${
                        olympiadsTotal > 0 ?
                        (analytics?.olympiadsByTime?.ended ||
                        olympiads.filter((o) =>
                        isOlympiadEnded(o.endTime)
                        ).length) /
                        olympiadsTotal *
                        100 :
                        0}%`

                      }}>
                    </div>
                    <span className="stat-value">
                      {t(analytics?.olympiadsByTime?.ended ||
                      olympiads.filter((o) => isOlympiadEnded(o.endTime)).
                      length)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Participation Statistics */}
            <div className="stat-card card">
              <h3 className="stat-title">{t("📊 Participation Statistics")}</h3>
              <div className="stat-content">
                <div className="stat-metric">
                  <div className="metric-value">
                    {t(analytics?.uniqueParticipants || 0)}
                  </div>
                  <div className="metric-label">{t("Unique Participants")}</div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {t(analytics?.avgSubmissionsPerOlympiad !== undefined ?
                    analytics.avgSubmissionsPerOlympiad.toFixed(1) :
                    "0")}
                  </div>
                  <div className="metric-label">{t("Avg Submissions per Olympiad ")}

                  </div>
                </div>
                <div className="stat-metric">
                  <div className="metric-value">
                    {t(analytics?.studentParticipationRate !== undefined ?
                    analytics.studentParticipationRate.toFixed(1) :
                    "0")}
                    %
                  </div>
                  <div className="metric-label">{t("Student Participation Rate")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="trends-section">
          <div className="section-header">
            <h2 className="section-title">{t("📈 Trends")}</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportMetrics}>{t("Export CSV ")}

              </button>
              <div className="filter-group">
                <label className="filter-label">{t("Start")}</label>
                <input
                  type="date"
                  value={metricsStartDate}
                  onChange={(e) => setMetricsStartDate(e.target.value)}
                  className="filter-input" />

              </div>
              <div className="filter-group">
                <label className="filter-label">{t("End")}</label>
                <input
                  type="date"
                  value={metricsEndDate}
                  onChange={(e) => setMetricsEndDate(e.target.value)}
                  className="filter-input" />

              </div>
            </div>
          </div>

          {metricsLoading ?
          <div className="section-loading">{t("Loading metrics...")}</div> :

          <div className="charts-grid">
              {t(renderMetricChart("User Signups", metricsData?.users))}
              {t(renderMetricChart("Olympiad Creation", metricsData?.olympiads))}
              {t(renderMetricChart("Submissions", metricsData?.submissions))}
              {t(renderMetricChart("Results", metricsData?.results))}
              {t(renderMetricChart("Average Score", metricsData?.averageScore, "%"))}
            </div>
          }
        </div>

        <div className="olympiads-section">
          <div className="section-header">
            <h2 className="section-title">{t("🏆 Olympiads")}</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportOlympiads}>{t("Export CSV ")}

              </button>
              <div className="filter-group">
                <label className="filter-label">{t("Search")}</label>
                <input
                  type="text"
                  value={olympiadsSearch}
                  onChange={(e) => {
                    setOlympiadsSearch(e.target.value);
                    setOlympiadsPage(1);
                  }}
                  placeholder={t("Title or subject")}
                  className="filter-input" />

              </div>
              <div className="filter-group">
                <label className="filter-label">{t("Status")}</label>
                <select
                  value={olympiadsStatus}
                  onChange={(e) => {
                    setOlympiadsStatus(e.target.value);
                    setOlympiadsPage(1);
                  }}
                  className="filter-select">

                  <option value="">{t("All")}</option>
                  <option value="published">{t("Published")}</option>
                  <option value="draft">{t("Draft")}</option>
                  <option value="unpublished">{t("Unpublished")}</option>
                  <option value="active">{t("Active")}</option>
                  <option value="completed">{t("Completed")}</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">{t("Per Page")}</label>
                <select
                  value={olympiadsLimit}
                  onChange={(e) => {
                    setOlympiadsLimit(Number(e.target.value));
                    setOlympiadsPage(1);
                  }}
                  className="filter-select">

                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="olympiads-table card">
            <div className="table-header">
              <div className="table-cell">{t("Title")}</div>
              <div className="table-cell">{t("Subject")}</div>
              <div className="table-cell">{t("Status")}</div>
              <div className="table-cell">{t("Starts")}</div>
              <div className="table-cell">{t("Ends")}</div>
            </div>
            <div className="table-body">
              {olympiadsLoading ?
              <div className="table-row table-empty">{t("Loading olympiads...")}</div> :
              olympiads.length === 0 ?
              <div className="table-row table-empty">{t("No olympiads found.")}</div> :

              olympiads.map((olympiad) =>
              <div key={olympiad._id} className="table-row">
                    <div className="table-cell">{olympiad.title}</div>
                    <div className="table-cell">{olympiad.subject || t("N/A")}</div>
                    <div className="table-cell">
                      <span className="role-badge">{t(olympiad.status)}</span>
                    </div>
                    <div className="table-cell">{t(formatShortDate(olympiad.startTime))}</div>
                    <div className="table-cell">{t(formatShortDate(olympiad.endTime))}</div>
                  </div>
              )
              }
            </div>
          </div>

          <div className="pagination-row">
            <button
              className="pagination-button"
              onClick={() => setOlympiadsPage(Math.max(1, olympiadsPage - 1))}
              disabled={olympiadsPage <= 1}>{t("Prev ")}


            </button>
            <div className="pagination-info">{t("Page ")}
              {t(olympiadsPagination.page)}{t(" of ")}{t(olympiadsPagination.pages)} · {t(olympiadsPagination.total)}{t(" total ")}
            </div>
            <button
              className="pagination-button"
              onClick={() => setOlympiadsPage(Math.min(olympiadsPagination.pages, olympiadsPage + 1))}
              disabled={olympiadsPage >= olympiadsPagination.pages}>{t("Next ")}


            </button>
          </div>
        </div>

        <div className="users-section">
          <div className="section-header">
            <h2>{t("User Management")}</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportUsers}>{t("Export CSV ")}

              </button>
              <div className="filter-group">
                <label className="filter-label">{t("Search")}</label>
                <input
                  type="text"
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  placeholder={t("Name or email")}
                  className="filter-input" />

              </div>
              <div className="filter-group">
                <label className="filter-label">{t("Role")}</label>
                <select
                  value={usersRole}
                  onChange={(e) => {
                    setUsersRole(e.target.value);
                    setUsersPage(1);
                  }}
                  className="filter-select">

                  <option value="">{t("All")}</option>
                  <option value="student">{t("Student")}</option>
                  <option value="admin">{t("Admin")}</option>
                  <option value="owner">{t("Owner")}</option>
                  <option value="resolter">{t("Resolter")}</option>
                  <option value="school-admin">{t("School Admin")}</option>
                  <option value="school-teacher">{t("School Teacher")}</option>
                  <option value="university">{t("University")}</option>
                  <option value="checker">{t("Checker")}</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">{t("Per Page")}</label>
                <select
                  value={usersLimit}
                  onChange={(e) => {
                    setUsersLimit(Number(e.target.value));
                    setUsersPage(1);
                  }}
                  className="filter-select">

                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
          <div className="users-table card">
            <div className="table-header">
              <div className="table-cell">{t("Name")}</div>
              <div className="table-cell">{t("Email")}</div>
              <div className="table-cell">{t("Role")}</div>
              <div className="table-cell">{t("Coins")}</div>
              <div className="table-cell">{t("Actions")}</div>
            </div>
            <div className="table-body">
              {usersLoading ?
              <div className="table-row table-empty">{t("Loading users...")}</div> :
              users.length === 0 ?
              <div className="table-row table-empty">{t("No users found.")}</div> :

              users.map((user) =>
              <div key={user._id} className="table-row">
                    <div className="table-cell">{user.name || t("N/A")}</div>
                    <div className="table-cell">{user.email}</div>
                    <div className="table-cell">
                      <span className="role-badge">{t(user.role)}</span>
                    </div>
                    <div className="table-cell">{user.role === 'student' ? <div className="owner-student-coins"><span>{user.coins ?? 100}{t(" coins")}</span><button type="button" className="button-secondary" onClick={() => openCoinTopup(user)}>{t("Add coins")}</button></div> : '—'}</div>
                    <div className="table-cell">
                      <select
                    value={user.role}
                    onChange={(e) =>
                    requestRoleChange(user, e.target.value)
                    }
                    className="role-select">

                        <option value="student">{t("Student")}</option>
                        <option value="admin">{t("Admin")}</option>
                        <option value="owner">{t("Owner")}</option>
                        <option value="resolter">{t("Resolter")}</option>
                        <option value="school-admin">{t("School Admin")}</option>
                        <option value="school-teacher">{t("School Teacher")}</option>
                        <option value="university">{t("University")}</option>
                        <option value="checker">{t("Checker")}</option>
                      </select>
                    </div>
                  </div>
              )
              }
            </div>
          </div>

          <div className="pagination-row">
            <button
              className="pagination-button"
              onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
              disabled={usersPage <= 1}>{t("Prev ")}


            </button>
            <div className="pagination-info">{t("Page ")}
              {t(usersPagination.page)}{t(" of ")}{t(usersPagination.pages)} · {t(usersPagination.total)}{t(" total ")}
            </div>
            <button
              className="pagination-button"
              onClick={() => setUsersPage(Math.min(usersPagination.pages, usersPage + 1))}
              disabled={usersPage >= usersPagination.pages}>{t("Next ")}


            </button>
          </div>
        </div>

        <div className="audit-section">
          <div className="section-header">
            <h2 className="section-title">{t("🧾 Owner Audit Log")}</h2>
            <div className="filters-row">
              <button className="export-button" onClick={handleExportAuditLogs}>{t("Export CSV ")}

              </button>
              <div className="filter-group">
                <label className="filter-label">{t("Action")}</label>
                <select
                  value={auditAction}
                  onChange={(e) => {
                    setAuditAction(e.target.value);
                    setAuditPage(1);
                  }}
                  className="filter-select">

                  <option value="">{t("All")}</option>
                  <option value="user_role_change">{t("Role Change")}</option>
                  <option value="olympiad_create">{t("Olympiad Create")}</option>
                  <option value="olympiad_update">{t("Olympiad Update")}</option>
                  <option value="olympiad_delete">{t("Olympiad Delete")}</option>
                  <option value="olympiad_status_change">{t("Olympiad Status")}</option>
                  <option value="olympiad_start">{t("Olympiad Start")}</option>
                  <option value="olympiad_finish">{t("Olympiad Finish")}</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">{t("Start")}</label>
                <input
                  type="date"
                  value={auditStartDate}
                  onChange={(e) => {
                    setAuditStartDate(e.target.value);
                    setAuditPage(1);
                  }}
                  className="filter-input" />

              </div>
              <div className="filter-group">
                <label className="filter-label">{t("End")}</label>
                <input
                  type="date"
                  value={auditEndDate}
                  onChange={(e) => {
                    setAuditEndDate(e.target.value);
                    setAuditPage(1);
                  }}
                  className="filter-input" />

              </div>
              <div className="filter-group">
                <label className="filter-label">{t("Per Page")}</label>
                <select
                  value={auditLimit}
                  onChange={(e) => {
                    setAuditLimit(Number(e.target.value));
                    setAuditPage(1);
                  }}
                  className="filter-select">

                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="audit-table card">
            <div className="table-header">
              <div className="table-cell">{t("Time")}</div>
              <div className="table-cell">{t("Action")}</div>
              <div className="table-cell">{t("Target")}</div>
              <div className="table-cell">{t("Message")}</div>
            </div>
            <div className="table-body">
              {auditLoading ?
              <div className="table-row table-empty">{t("Loading audit logs...")}</div> :
              auditLogs.length === 0 ?
              <div className="table-row table-empty">{t("No audit logs found.")}</div> :

              auditLogs.map((log) =>
              <div key={log._id} className="table-row">
                    <div className="table-cell">{t(formatTimestamp(log.timestamp))}</div>
                    <div className="table-cell">{t(log.action)}</div>
                    <div className="table-cell">{t(log.targetType)}{t(log.targetId ? ` · ${log.targetId}` : "")}</div>
                    <div className="table-cell">{t(log.message || "-")}</div>
                  </div>
              )
              }
            </div>
          </div>

          <div className="pagination-row">
            <button
              className="pagination-button"
              onClick={() => setAuditPage(Math.max(1, auditPage - 1))}
              disabled={auditPage <= 1}>{t("Prev ")}


            </button>
            <div className="pagination-info">{t("Page ")}
              {t(auditPagination.page)}{t(" of ")}{t(auditPagination.pages)} · {t(auditPagination.total)}{t(" total ")}
            </div>
            <button
              className="pagination-button"
              onClick={() => setAuditPage(Math.min(auditPagination.pages, auditPage + 1))}
              disabled={auditPage >= auditPagination.pages}>{t("Next ")}


            </button>
          </div>
        </div>
      </div>

      {pendingRoleChange &&
      <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">{t("Confirm Role Change")}</h3>
            <p className="modal-text">{t("Change role for ")}
            <strong>{t(pendingRoleChange.userName)}</strong>{t(" from ")}{t(pendingRoleChange.previousRole)}{t(" to ")}{t(pendingRoleChange.newRole)}?
            </p>
            <div className="modal-actions">
              <button className="modal-button ghost" onClick={cancelRoleChange}>{t("Cancel")}</button>
              <button className="modal-button primary" onClick={confirmRoleChange}>{t("Confirm")}</button>
            </div>
          </div>
        </div>
      }

      {pendingApiToggleValue !== null &&
      <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">{t("Confirm Global API Access Change")}</h3>
            <p className="modal-text">{t("You are about to ")}
            <strong>{t(pendingApiToggleValue ? "ENABLE" : "DISABLE")}</strong>{t(" all API endpoints. This affects the entire platform. ")}

          </p>
            <p className="modal-text">{t("Type ")}
            <strong>{t("CONFIRM")}</strong>{t(" to continue. ")}
          </p>

            <input
            type="text"
            value={apiToggleConfirmText}
            onChange={(e) => setApiToggleConfirmText(e.target.value)}
            className="modal-confirm-input"
            placeholder={t("Type CONFIRM")} />


            <div className="modal-actions">
              <button className="modal-button ghost" onClick={cancelApiToggle}>{t("Cancel")}</button>
              <button
              className="modal-button primary"
              onClick={confirmApiToggle}
              disabled={apiToggleConfirmText.trim() !== "CONFIRM"}>{t("Apply Change ")}


            </button>
            </div>
          </div>
        </div>
      }

      {coinTarget && <div className="owner-coin-overlay"><form className="owner-coin-dialog" role="dialog" aria-modal="true" aria-labelledby="owner-coin-title" onSubmit={addStudentCoins}><h2 id="owner-coin-title">{t("Add student coins")}</h2><p>{coinTarget.name} · {coinTarget.email}</p><p>{t("Current balance: ")}{t(coinTarget.coins ?? 100)}{t(" coins")}</p><label htmlFor="owner-coin-amount">{t("Coins to add")}</label><input id="owner-coin-amount" type="number" min="1" max="1000000" step="1" required value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} /><p>{t("Confirm the student's payment separately before adding coins.")}</p><div className="owner-coin-actions"><button type="button" className="button-secondary" disabled={coinSaving} onClick={() => setCoinTarget(null)}>{t("Cancel")}</button><button type="submit" className="button-primary" disabled={coinSaving}>{t(coinSaving ? 'Adding…' : 'Add coins')}</button></div></form></div>}
      {notification &&
      <NotificationToast
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(null)} />

      }
    </div>);

};

export default OwnerPanel;
