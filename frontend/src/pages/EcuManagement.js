import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/EcuManagement.css";

const defaultForm = { code: "", message: "", severity: "Low" };

const SEV_ORDER = { Critical: 1, High: 2, Medium: 3, Low: 4 };

function EcuManagement() {
    const navigate = useNavigate();
    const [ecus, setEcus] = useState([]);
    const [selectedEcu, setSelectedEcu] = useState(null);
    const [alarms, setAlarms] = useState([]);
    const [overview, setOverview] = useState({ totalAlarms: 0, activeAlarms: 0 });
    const [form, setForm] = useState(defaultForm);
    const [editingAlarm, setEditingAlarm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadEcus();
        loadOverview();
        const poll = setInterval(loadOverview, 3000);
        return () => clearInterval(poll);
    }, []);

    const sortedAlarms = useMemo(() => {
        return [...alarms].sort((a, b) => {
            if (a.status !== b.status) return a.status === "Active" ? -1 : 1;
            return (SEV_ORDER[a.severity] || 5) - (SEV_ORDER[b.severity] || 5);
        });
    }, [alarms]);

    const filteredEcus = useMemo(() => {
        if (!search.trim()) return ecus;
        return ecus.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    }, [ecus, search]);

    const stats = useMemo(() => {
        if (!selectedEcu) return null;
        const total = sortedAlarms.length;
        const active = sortedAlarms.filter(a => a.status === "Active").length;
        const inactive = total - active;
        const critical = sortedAlarms.filter(a => a.severity === "Critical").length;
        const high = sortedAlarms.filter(a => a.severity === "High").length;
        return { total, active, inactive, critical, high };
    }, [sortedAlarms, selectedEcu]);

    const loadEcus = async () => {
        try {
            setLoading(true);
            const res = await api.get("/ecus");
            const list = res.data || [];
            setEcus(list);
            if (list.length > 0) await onSelectEcu(list[0]);
            setError("");
        } catch { setError("Failed to load ECUs."); }
        finally { setLoading(false); }
    };

    const loadOverview = async () => {
        try {
            const res = await api.get("/alarms/overview");
            setOverview(res.data);
        } catch {}
    };

    const onSelectEcu = async (ecu) => {
        setSelectedEcu(ecu);
        setEditingAlarm(null);
        setForm(defaultForm);
        try {
            const res = await api.get(`/ecus/${ecu.id}/alarms`);
            setAlarms(res.data || []);
            setError("");
        } catch { setError("Failed to load ECU alarms."); }
    };

    const refreshAlarms = async () => {
        if (!selectedEcu) return;
        const res = await api.get(`/ecus/${selectedEcu.id}/alarms`);
        setAlarms(res.data || []);
    };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!selectedEcu) return setError("Please select an ECU first.");
        if (!form.code.trim() || !form.message.trim()) return setError("Code and message are required.");
        try {
            setActionLoading(true);
            if (editingAlarm) {
                await api.put(`/alarms/${editingAlarm.id}`, { code: form.code, message: form.message, severity: form.severity, status: editingAlarm.status });
            } else {
                await api.post(`/ecus/${selectedEcu.id}/alarms`, { code: form.code, message: form.message, severity: form.severity });
            }
            setForm(defaultForm);
            setEditingAlarm(null);
            await refreshAlarms();
            await loadOverview();
            setError("");
        } catch { setError("Failed to save alarm."); }
        finally { setActionLoading(false); }
    };

    const startEdit = (alarm) => {
        setEditingAlarm(alarm);
        setForm({ code: alarm.code, message: alarm.message, severity: alarm.severity });
    };

    const cancelEdit = () => { setEditingAlarm(null); setForm(defaultForm); };

    const activateAlarm = async (id) => {
        try {
            setActionLoading(true);
            await api.post(`/alarms/${id}/activate`);
            await refreshAlarms();
            await loadOverview();
        } catch { setError("Failed to activate alarm."); }
        finally { setActionLoading(false); }
    };

    const deleteAlarm = async (id) => {
        if (!window.confirm("Delete this alarm?")) return;
        try {
            setActionLoading(true);
            await api.delete(`/alarms/${id}`);
            await refreshAlarms();
            await loadOverview();
        } catch { setError("Failed to delete alarm."); }
        finally { setActionLoading(false); }
    };

    return (
        <div className="em-root">
            {/*  TOP NAV BAR  */}
            <header className="em-header">
                <div className="em-header-brand">
                    <div className="em-header-dot"></div>
                    <span className="em-header-title">ECU Management</span>
                    <span className="em-header-sub">Alarm Control Panel</span>
                </div>
                <div className="em-header-stats">
                    <div className="em-hstat">
                        <span className="em-hstat-val">{ecus.length}</span>
                        <span className="em-hstat-label">ECUs</span>
                    </div>
                    <div className="em-hstat-div"></div>
                    <div className="em-hstat">
                        <span className="em-hstat-val">{overview.totalAlarms}</span>
                        <span className="em-hstat-label">Total Alarms</span>
                    </div>
                    <div className="em-hstat-div"></div>
                    <div className="em-hstat active">
                        <span className="em-hstat-val">{overview.activeAlarms}</span>
                        <span className="em-hstat-label">Active</span>
                    </div>
                    <button className="em-back-btn" onClick={() => navigate("/dashboard")}>
                         Dashboard
                    </button>
                </div>
            </header>

            {/*  MAIN WORKSPACE  */}
            <div className="em-workspace">

                {/* LEFT: ECU LIST */}
                <aside className="em-sidebar">
                    <div className="em-sidebar-head">
                        <h2>ECUs <span className="em-count-badge">{ecus.length}</span></h2>
                        <input
                            className="em-search"
                            placeholder="Search ECU..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {loading ? (
                        <div className="em-loading">
                            <div className="em-spinner"></div>
                            <span>Loading ECUs...</span>
                        </div>
                    ) : (
                        <div className="em-ecu-list">
                            {filteredEcus.map(ecu => (
                                <button
                                    key={ecu.id}
                                    className={`em-ecu-item ${selectedEcu?.id === ecu.id ? "em-ecu-selected" : ""}`}
                                    onClick={() => onSelectEcu(ecu)}
                                >
                                    <span className="em-ecu-num">{ecu.id}</span>
                                    <span className="em-ecu-name">{ecu.name}</span>
                                    <span className="em-ecu-arrow"></span>
                                </button>
                            ))}
                            {filteredEcus.length === 0 && (
                                <div className="em-no-ecu">No ECUs match "{search}"</div>
                            )}
                        </div>
                    )}
                </aside>

                {/* RIGHT: ALARM PANEL */}
                <main className="em-main">
                    {!selectedEcu ? (
                        <div className="em-no-selection">
                            <div className="em-no-sel-icon">🖥️</div>
                            <h2 className="em-no-sel-title">Select an ECU</h2>
                            <p className="em-no-sel-sub">Choose an ECU from the left panel to view and manage its configured alarms</p>
                            <div className="em-no-sel-hint">👈 Click any ECU in the list to get started</div>
                        </div>
                    ) : (
                        <>
                            {/* ECU Header */}
                            <div className="em-alarm-header">
                                <div className="em-alarm-title-row">
                                    <div className="em-ecu-badge">{selectedEcu.name}</div>
                                    <span className="em-alarm-count">{sortedAlarms.length} alarm{sortedAlarms.length !== 1 ? "s" : ""}</span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            {stats && (
                                <div className="em-stat-row">
                                    <div className="em-stat-card em-stat-total">
                                        <span className="em-stat-val">{stats.total}</span>
                                        <span className="em-stat-lbl">Total Alarms</span>
                                    </div>
                                    <div className="em-stat-card em-stat-active">
                                        <span className="em-stat-val">{stats.active}</span>
                                        <span className="em-stat-lbl">Active</span>
                                    </div>
                                    <div className="em-stat-card em-stat-inactive">
                                        <span className="em-stat-val">{stats.inactive}</span>
                                        <span className="em-stat-lbl">Inactive</span>
                                    </div>
                                    <div className="em-stat-card em-stat-critical">
                                        <span className="em-stat-val">{stats.critical}</span>
                                        <span className="em-stat-lbl">Critical</span>
                                    </div>
                                    <div className="em-stat-card em-stat-high">
                                        <span className="em-stat-val">{stats.high}</span>
                                        <span className="em-stat-lbl">High Priority</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="em-error">
                                    <span>⚠ {error}</span>
                                    <button onClick={() => setError("")}>✕</button>
                                </div>
                            )}

                            {/* CREATE / EDIT FORM */}
                            <div className="em-form-card">
                                <h3 className="em-form-title">
                                    {editingAlarm ? "✎ Edit Alarm" : "+ New Alarm"}
                                </h3>
                                <form className="em-form" onSubmit={submitForm}>
                                    <input
                                        className="em-input"
                                        type="text"
                                        placeholder="Alarm Code (e.g. ECU01_ALM)"
                                        value={form.code}
                                        onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                                    />
                                    <input
                                        className="em-input em-input-wide"
                                        type="text"
                                        placeholder="Alarm Message"
                                        value={form.message}
                                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                    />
                                    <select
                                        className="em-select"
                                        value={form.severity}
                                        onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                                    >
                                        <option value="Critical">Critical</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    <button className="em-btn em-btn-primary" type="submit" disabled={actionLoading}>
                                        {actionLoading ? "Saving..." : editingAlarm ? "Update" : "Create Alarm"}
                                    </button>
                                    {editingAlarm && (
                                        <button className="em-btn em-btn-ghost" type="button" onClick={cancelEdit}>
                                            Cancel
                                        </button>
                                    )}
                                </form>
                            </div>

                            {/* ALARM TABLE */}
                            <div className="em-table-card">
                                <table className="em-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Message</th>
                                            <th>Severity</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedAlarms.map(alarm => (
                                            <tr key={alarm.id} className={alarm.status === "Active" ? "em-row-active" : ""}>
                                                <td><span className="em-code">{alarm.code}</span></td>
                                                <td className="em-td-msg">{alarm.message}</td>
                                                <td>
                                                    <span className={`em-sev em-sev-${alarm.severity.toLowerCase()}`}>
                                                        {alarm.severity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`em-status em-status-${alarm.status.toLowerCase()}`}>
                                                        {alarm.status === "Active" ? "● Active" : "○ Inactive"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="em-actions">
                                                        <button
                                                            className="em-act em-act-activate"
                                                            onClick={() => activateAlarm(alarm.id)}
                                                            disabled={actionLoading || alarm.status === "Active"}
                                                        >Activate</button>
                                                        <button
                                                            className="em-act em-act-edit"
                                                            onClick={() => startEdit(alarm)}
                                                            disabled={actionLoading}
                                                        >Edit</button>
                                                        <button
                                                            className="em-act em-act-delete"
                                                            onClick={() => deleteAlarm(alarm.id)}
                                                            disabled={actionLoading}
                                                        >Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {!loading && sortedAlarms.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="em-empty">
                                                    <div className="em-empty-icon">🔔</div>
                                                    <div>No alarms configured for {selectedEcu.name}</div>
                                                    <div style={{fontSize:'12px', marginTop:'6px', color:'#94a3b8'}}>Use the form above to create the first alarm</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default EcuManagement;
