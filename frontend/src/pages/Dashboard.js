import { PieChart, Pie, Cell, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

import { useEffect, useState } from "react";

import { MdBatteryChargingFull, MdBatteryAlert, MdTrendingDown, MdViewList } from "react-icons/md";

import { FaCheckCircle, FaExclamationTriangle, FaBell } from "react-icons/fa";

import { RiAlarmWarningFill } from "react-icons/ri";

import Sidebar from "../components/Sidebar";

import Topbar from "../components/Topbar";

import api from "../services/api";

import "../styles/Dashboard.css";

function Dashboard() {

    const [summary, setSummary] = useState({

        total: 0,

        active: 0,

        acknowledged: 0,

        cleared: 0,

        critical: 0,

        high: 0,

        medium: 0,

        low: 0

    });

    const [recentAlarms, setRecentAlarms] = useState([]);

    const [allAlarms, setAllAlarms] = useState([]);

    const [ecus, setEcus] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [openList, setOpenList] = useState(null); // 'ecus' | 'total' | 'active' | 'cleared' | null

    useEffect(() => {

        fetchDashboardData();

        const interval = setInterval(() => {

            fetchDashboardData();

        }, 5000);

        return () => clearInterval(interval);

    }, []);

    const fetchDashboardData = async () => {

        try {

            const [alarmsRes, ecusRes] = await Promise.all([
                api.get("/alarms/all"),
                api.get("/ecus")
            ]);

            const alarms = alarmsRes.data;

            setEcus(ecusRes.data || []);

            const total = alarms.length;

            const active = alarms.filter(a => a.isAcknowledged === false).length;

            const cleared = alarms.filter(a => a.isAcknowledged === true).length;

            const critical = alarms.filter(a => a.severity === "Critical").length;

            const high = alarms.filter(a => a.severity === "High").length;

            const medium = alarms.filter(a => a.severity === "Medium").length;

            const low = alarms.filter(a => a.severity === "Low").length;

            setSummary({

                total,

                active,

                acknowledged: cleared,

                cleared,

                critical,

                high,

                medium,

                low

            });

            setAllAlarms(alarms);

            setRecentAlarms(alarms.slice(0, 5));

            setError(null);

            setLoading(false);

        } catch (error) {

            console.error("Dashboard Sync Error:", error);

            setError("Failed to fetch data from backend");

            setLoading(false);

        }

    };

    // derive filtered alarms for the card lists

    const filteredAlarms = (() => {

        if (!allAlarms || allAlarms.length === 0) return [];

        switch (openList) {

            case 'total':

                return allAlarms;

            case 'active':

                return allAlarms.filter(a => a.isAcknowledged === false);

            case 'cleared':

                return allAlarms.filter(a => a.isAcknowledged === true);

            default:

                return [];

        }

    })();

    const statusData = [

        { name: "Active", value: summary.active, color: "#ef4444" },

        { name: "Cleared", value: summary.cleared, color: "#10b981" }

    ];

    const severityData = [

        { name: "Critical", value: summary.critical, color: "#ef4444" },

        { name: "High", value: summary.high, color: "#f59e0b" },

        { name: "Medium", value: summary.medium, color: "#eab308" },

        { name: "Low", value: summary.low, color: "#8b5cf6" }

    ];

    return (
        <div className="layout">
            <Sidebar />

            <div className="main">
                <Topbar title="Dashboard" />

                <div className="content">

                    {error && (
                        <div className="error-alert">
                            <RiAlarmWarningFill className="error-icon" />
                            <span>{error}</span>
                        </div>

                    )}

                    {loading ? (
                        <div className="dashboard-loading">
                            <div className="spinner-large"></div>
                            <p>Loading dashboard data...</p>
                        </div>

                    ) : (
                        <>

                            {/* COMPACT STAT CARDS */}
                            <div className="dashboard-cards">
                                <div className="dash-card ecu-card" role="button" tabIndex={0} onClick={() => setOpenList(openList === 'ecus' ? null : 'ecus')}>
                                    <div className="card-icon-wrapper blue">
                                        <MdViewList className="card-icon" />
                                    </div>
                                    <div className="card-content">
                                        <div className="card-main">
                                            <h2>{ecus.length}</h2>
                                            <p>ECUs</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="dash-card total-card" role="button" tabIndex={0} onClick={() => setOpenList(openList === 'total' ? null : 'total')}>
                                    <div className="card-icon-wrapper purple">
                                        <MdBatteryChargingFull className="card-icon" />
                                    </div>
                                    <div className="card-content">
                                        <div className="card-main">
                                            <h2>{summary.total}</h2>
                                            <p>Total Alarms</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="dash-card active-card" role="button" tabIndex={0} onClick={() => setOpenList(openList === 'active' ? null : 'active')}>
                                    <div className="card-icon-wrapper red">
                                        <RiAlarmWarningFill className="card-icon" />
                                    </div>
                                    <div className="card-content">
                                        <div className="card-main">
                                            <h2>{summary.active}</h2>
                                            <p>Active Alarms</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="dash-card cleared-card" role="button" tabIndex={0} onClick={() => setOpenList(openList === 'cleared' ? null : 'cleared')}>
                                    <div className="card-icon-wrapper green">
                                        <FaCheckCircle className="card-icon" />
                                    </div>
                                    <div className="card-content">
                                        <div className="card-main">
                                            <h2>{summary.cleared}</h2>
                                            <p>Cleared Alarms</p>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            {/* CARD-DRIVEN LISTS (opened when a stat card is clicked) */}

                            {openList && (
                                <div className="card-list-section">
                                    <div className="section-header">
                                        <h3>

                                            {openList === 'total' && `All Alarms (${filteredAlarms.length})`}

                                            {openList === 'ecus' && `ECU List (${ecus.length})`}

                                            {openList === 'active' && `Active Alarms (${filteredAlarms.length})`}

                                            {openList === 'cleared' && `Cleared Alarms (${filteredAlarms.length})`}

                                        </h3>
                                        <button className="view-all-link" onClick={() => setOpenList(null)}>Close</button>
                                    </div>
                                    <div className="recent-alarms-list">

                                        {openList === 'ecus' ? (
                                            ecus.length === 0 ? (
                                                <div className="no-data">
                                                    <FaCheckCircle className="no-data-icon" />
                                                    <p>No ECUs found</p>
                                                </div>
                                            ) : (
                                                ecus.map((ecu) => (
                                                    <div key={ecu.id} className="recent-alarm-item ecu-list-item">
                                                        <div className="alarm-indicator ecu"></div>
                                                        <div className="alarm-info">
                                                            <h4>{ecu.name}</h4>
                                                            <p className="alarm-code">ECU ID: {ecu.id}</p>
                                                        </div>
                                                        <span className="status-tag active">ECU</span>
                                                    </div>
                                                ))
                                            )
                                        ) : filteredAlarms.length === 0 ? (
                                            <div className="no-data">
                                                <FaCheckCircle className="no-data-icon" />
                                                <p>No alarms</p>
                                            </div>
                                        ) : (
                                            filteredAlarms.map((alarm) => (
                                                <div key={alarm.id} className={`recent-alarm-item ${alarm.isAcknowledged ? 'cleared' : 'active'}`}>
                                                    <div className="alarm-indicator"></div>
                                                    <div className="alarm-info">
                                                        <h4>{alarm.message}</h4>
                                                        <p className="alarm-code">Code: {alarm.code}</p>
                                                    </div>
                                                    <span className={`severity-tag ${alarm.severity.toLowerCase()}`}>
                                                        {alarm.severity}
                                                    </span>
                                                    <span className={`status-tag ${alarm.isAcknowledged ? 'cleared' : 'active'}`}>
                                                        {alarm.isAcknowledged ? '✓ Cleared' : '⚠ Active'}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                            )}

                            {/* CHARTS ROW */}
                            <div className="dashboard-charts-row">

                                {/* STATUS CHART */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3>Alarm Status Distribution</h3>
                                        <span className="chart-badge">Real-time</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie

                                                data={statusData}

                                                cx="50%"

                                                cy="50%"

                                                innerRadius={60}

                                                outerRadius={100}

                                                paddingAngle={5}

                                                dataKey="value"
                                            >

                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />

                                                ))}
                                            </Pie>
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* SEVERITY CHART */}
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3>Severity Breakdown</h3>
                                        <span className="chart-badge">Last 24h</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={severityData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>

                                                {severityData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />

                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            
                        </>

                    )}
                </div>
            </div>
        </div>

    );

}

export default Dashboard;

