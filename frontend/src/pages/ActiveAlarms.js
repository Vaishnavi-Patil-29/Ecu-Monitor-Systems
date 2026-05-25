import { useEffect, useState } from "react";
import { RiAlarmWarningFill } from "react-icons/ri";
import { FaCheckCircle, FaSearch, FaFilter } from "react-icons/fa";
import { MdSort } from "react-icons/md";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/ActiveAlarms.css";

function ActiveAlarms() {
    const [alarms, setAlarms] = useState([]);
    const [filteredAlarms, setFilteredAlarms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("All");

    // Defaulting sortBy to "severity" ensures Critical is at the top on load
    const [sortBy, setSortBy] = useState("severity");

    useEffect(() => {
        loadAlarms();
        const interval = setInterval(loadAlarms, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        filterAndSortAlarms();
    }, [alarms, searchTerm, severityFilter, sortBy]);

    const loadAlarms = async () => {
        try {
            const res = await api.get("/alarms/active");
            setAlarms(res.data);
        } catch (err) {
            console.error("Backend not running or API error", err);
        }
    };

    const filterAndSortAlarms = () => {
        let result = [...alarms];

        // 1. Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(alarm =>
                alarm.message.toLowerCase().includes(term) ||
                alarm.code.toLowerCase().includes(term)
            );
        }

        // 2. Severity filter
        if (severityFilter !== "All") {
            result = result.filter(alarm => alarm.severity === severityFilter);
        }

        // 3. Sorting Logic
        const severityOrder = { "Critical": 1, "High": 2, "Medium": 3, "Low": 4 };

        result.sort((a, b) => {
            if (sortBy === "severity") {
                const rankA = severityOrder[a.severity] || 5;
                const rankB = severityOrder[b.severity] || 5;

                if (rankA !== rankB) {
                    return rankA - rankB; // Lower number (Critical) comes first
                }
                // If severity is the same, sort by most recent
                return new Date(b.firstOccurred || b.triggeredAt) - new Date(a.firstOccurred || a.triggeredAt);
            } else {
                // Default: Most recent at the top
                return new Date(b.firstOccurred || b.triggeredAt) - new Date(a.firstOccurred || a.triggeredAt);
            }
        });

        setFilteredAlarms(result);
    };

    const acknowledge = async (id) => {
        if (window.confirm("Are you sure you want to acknowledge this alarm?")) {
            try {
                await api.post(`/alarms/${id}/acknowledge`);
                loadAlarms();
            } catch (err) {
                alert("Failed to acknowledge alarm");
                console.error(err);
            }
        }
    };

    const acknowledgeAll = async () => {
        const count = filteredAlarms.length;
        if (window.confirm(`Are you sure you want to acknowledge all ${count} alarm(s)?`)) {
            try {
                // Using Promise.all for faster execution than a sequential for-loop
                await Promise.all(filteredAlarms.map(alarm => api.post(`/alarms/${alarm.id}/acknowledge`)));
                loadAlarms();
            } catch (err) {
                alert("Failed to acknowledge some alarms");
                console.error(err);
            }
        }
    };

    const getSeverityCount = (severity) => {
        return alarms.filter(a => a.severity === severity).length;
    };

    return (
        <div className="layout">
            <Sidebar />

            <div className="main">
                <Topbar title="Active Alarms" />

                <div className="content">
                    {/* HEADER STATS */}
                    <div className="alarms-header">
                        <div className="header-stats">
                            <div className="stat-item critical">
                                <span className="stat-number">{getSeverityCount("Critical")}</span>
                                <span className="stat-label">Critical</span>
                            </div>
                            <div className="stat-item high">
                                <span className="stat-number">{getSeverityCount("High")}</span>
                                <span className="stat-label">High</span>
                            </div>
                            <div className="stat-item medium">
                                <span className="stat-number">{getSeverityCount("Medium")}</span>
                                <span className="stat-label">Medium</span>
                            </div>
                            <div className="stat-item low">
                                <span className="stat-number">{getSeverityCount("Low")}</span>
                                <span className="stat-label">Low</span>
                            </div>
                        </div>

                        {filteredAlarms.length > 0 && (
                            <button className="acknowledge-all-btn" onClick={acknowledgeAll}>
                                <FaCheckCircle /> Acknowledge All
                            </button>
                        )}
                    </div>

                    {/* FILTERS BAR */}
                    <div className="filters-bar">
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search alarms by message or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-group">
                            <FaFilter className="filter-icon" />
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="All">All Severities</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>

                        <div className="sort-group">
                            <MdSort className="sort-icon" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
                                <option value="severity">By Severity (Critical First)</option>
                                <option value="recent">Most Recent</option>
                            </select>
                        </div>

                        <div className="results-count">
                            <span>{filteredAlarms.length}</span> alarm{filteredAlarms.length !== 1 ? 's' : ''} found
                        </div>
                    </div>

                    {/* ALARMS GRID */}
                    <div className="alarm-grid">
                        {filteredAlarms.length === 0 ? (
                            <div className="no-alarms">
                                <FaCheckCircle className="no-alarms-icon" />
                                <h3>No Active Alarms</h3>
                                <p>All systems are running smoothly 🎉</p>
                            </div>
                        ) : (
                            filteredAlarms.map((alarm) => (
                                <div
                                    key={alarm.id}
                                    className={`alarm-card severity-${alarm.severity.toLowerCase()}`}
                                >
                                    <div className="alarm-header">
                                        <div className="alarm-title">
                                            <RiAlarmWarningFill className="alarm-icon" />
                                            <h3>{alarm.message}</h3>
                                        </div>
                                        <span className={`badge ${alarm.severity.toLowerCase()}`}>
                                            {alarm.severity}
                                        </span>
                                    </div>

                                    <div className="alarm-body">
                                        <div className="alarm-detail">
                                            <span className="detail-label">Code:</span>
                                            <span className="detail-value">{alarm.code}</span>
                                        </div>
                                        <div className="alarm-detail">
                                            <span className="detail-label">Device:</span>
                                            <span className="detail-value">{alarm.source || `ECU-${alarm.id}`}</span>
                                        </div>
                                        <div className="alarm-detail">
                                            <span className="detail-label">Triggered:</span>
                                            <span className="detail-value">
                                                {new Date(alarm.firstOccurred || alarm.triggeredAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className="ack-btn"
                                        onClick={() => acknowledge(alarm.id)}
                                    >
                                        <FaCheckCircle /> Acknowledge
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActiveAlarms;