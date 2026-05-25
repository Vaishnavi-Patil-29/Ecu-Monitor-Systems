// React hooks
import { useEffect, useState } from "react";

// Pre-configured API client (e.g., Axios instance)
import api from "../services/api";

// Layout components
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

// Icons for UI labels
import { FaHistory, FaSearch, FaFilter, FaCheckCircle } from "react-icons/fa";

// Page-specific styles
import "../styles/History.css";

function History() {
    // All cleared alarms (fetched from backend)
    const [alarms, setAlarms] = useState([]);

    // Alarms after applying search + severity filter
    const [filteredAlarms, setFilteredAlarms] = useState([]);

    // Show spinner while first load happens
    const [loading, setLoading] = useState(true);

    // Search text entered by user
    const [searchTerm, setSearchTerm] = useState("");

    // Which severity to show ("All", "Critical", "High", etc.)
    const [severityFilter, setSeverityFilter] = useState("All");

    // On first render: load history and start a 30s polling timer
    useEffect(() => {
        loadHistory();                              // fetch once now
        const interval = setInterval(loadHistory, 30000); // refresh every 30 seconds
        return () => clearInterval(interval);       // clean up timer when leaving page
    }, []);

    // Recompute the filtered list whenever raw data or filters change
    useEffect(() => {
        filterAlarms();
    }, [alarms, searchTerm, severityFilter]);

    // Fetch all alarms, keep only acknowledged (= cleared) ones
    const loadHistory = async () => {
        try {
            const res = await api.get("/alarms/all");             // call backend
            const clearedOnly = res.data.filter(a => a.isAcknowledged === true); // keep cleared
            setAlarms(clearedOnly);                              // save to state
            setLoading(false);                                   // stop spinner
        } catch (err) {
            console.error("Error loading history:", err);        // log for debugging
            setLoading(false);                                   // stop spinner even if failed
        }
    };

    // Apply search + severity filter + sort (newest first)
    const filterAlarms = () => {
        let filtered = [...alarms]; // work on a copy

        // Text search in message or code (case-insensitive)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(alarm =>
                alarm.message.toLowerCase().includes(term) ||
                alarm.code.toLowerCase().includes(term)
            );
        }

        // Severity dropdown filter (skip if "All")
        if (severityFilter !== "All") {
            filtered = filtered.filter(alarm => alarm.severity === severityFilter);
        }

        // Sort by time: newest first; use a safe fallback chain for date fields
        filtered.sort((a, b) => {
            const dateA = new Date(a.acknowledgedAt || a.ackTime || a.triggeredAt);
            const dateB = new Date(b.acknowledgedAt || b.ackTime || b.triggeredAt);
            return dateB - dateA; // later date comes first
        });

        setFilteredAlarms(filtered); // update what the table shows
    };

    /**
     * Helper: show cleared time as HH:MM:SS (24h).
     * Picks the first valid date field to avoid "Invalid Date".
     */
    const formatClearedTime = (alarm) => {
        const rawDate = alarm.acknowledgedAt || alarm.ackTime || alarm.triggeredAt; // try these in order
        const date = new Date(rawDate);
        if (isNaN(date.getTime())) return "N/A"; // if nothing valid, show N/A
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    // Helper: show cleared date as local date (or blank if invalid)
    const formatClearedDate = (alarm) => {
        const rawDate = alarm.acknowledgedAt || alarm.ackTime || alarm.triggeredAt;
        const date = new Date(rawDate);
        return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
    };

    // ---------- UI ----------
    return (
        <div className="layout">                 {/* Page layout */}
            <Sidebar />                            {/* Left navigation */}
            <div className="main">                 {/* Main content area */}
                <Topbar title="Alarm History" />     {/* Page title */}

                <div className="content history-content"> {/* Content wrapper */}
                    {/* Header: title with icon */}
                    <div className="history-page-header">
                        <div className="header-left">
                            <div className="history-title-section">
                                <FaHistory className="history-icon" />
                                <h1>Cleared Alarms</h1>
                            </div>
                        </div>
                    </div>

                    {/* Filters row: search + severity */}
                    <div className="history-filters">
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} // update search text
                            />
                        </div>

                        <div className="filter-group">
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)} // update severity
                            >
                                <option value="All">All Severity</option>
                                <option value="Critical">Critical</option>
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Table with cleared alarms */}
                    <div className="modern-table-container">
                        <table className="modern-history-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Message</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                    <th>Cleared At</th>
                                </tr>
                            </thead>

                            <tbody>
                                {/* Show each cleared alarm as a row */}
                                {filteredAlarms.map((alarm) => (
                                    <tr key={alarm.id} className="table-row row-cleared">
                                        {/* Code with a small badge */}
                                        <td><span className="code-badge">{alarm.code}</span></td>

                                        {/* Alarm message text */}
                                        <td className="td-message">{alarm.message}</td>

                                        {/* Colored severity badge */}
                                        <td>
                                            <span className={`modern-severity-badge ${alarm.severity.toLowerCase()}`}>
                                                {alarm.severity}
                                            </span>
                                        </td>

                                        {/* Always 'Cleared' for this page */}
                                        <td>
                                            <span className="modern-status-badge cleared">
                                                <FaCheckCircle /> Cleared
                                            </span>
                                        </td>

                                        {/* Time + date (formatted safely) */}
                                        <td className="td-timestamp">
                                            <div className="time-display">
                                                <strong>{formatClearedTime(alarm)}</strong>
                                                <span className="date-subtext">{formatClearedDate(alarm)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Optional: you could show a spinner or "No data" state here if loading/empty */}
                        {loading && <div className="loading-note">Loading...</div>}
                        {!loading && filteredAlarms.length === 0 && (
                            <div className="empty-note">No cleared alarms found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default History;