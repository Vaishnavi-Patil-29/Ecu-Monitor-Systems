import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdDashboard, MdBatteryChargingFull } from "react-icons/md";
import { RiAlarmWarningFill } from "react-icons/ri";
import { FaHistory, FaCog, FaSignOutAlt, FaBolt } from "react-icons/fa";
import { GiRadioactive } from "react-icons/gi";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            sessionStorage.removeItem("isAuthenticated");
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("loginTime");
            navigate("/login");
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <MdBatteryChargingFull className="battery-icon-main" />
                    <FaBolt className="bolt-icon-small" />
                </div>
                <h2>ECU Monitor</h2>
                <p className="sidebar-subtitle">Alarm System</p>
            </div>

            <nav className="sidebar-nav">
                <Link 
                    to="/dashboard" 
                    className={location.pathname === "/dashboard" ? "active" : ""}
                >
                    <MdDashboard className="nav-icon" />
                    <span>Dashboard</span>
                </Link>
                <Link 
                    to="/alarms" 
                    className={location.pathname === "/alarms" ? "active" : ""}
                >
                    <RiAlarmWarningFill className="nav-icon" />
                    <span>Active Alarms</span>
                </Link>
                <Link 
                    to="/history" 
                    className={location.pathname === "/history" ? "active" : ""}
                >
                    <FaHistory className="nav-icon" />
                    <span>History</span>
                </Link>
                <Link 
                    to="/settings" 
                    className={location.pathname === "/settings" ? "active" : ""}
                >
                    <FaCog className="nav-icon" />
                    <span>Settings</span>
                </Link>
            </nav>

            <div className="sidebar-footer">
                <div className="status">
                    <GiRadioactive className="status-icon" />
                    <div className="status-text">
                        <span className="status-label">System Online</span>
                        <span className="status-info">Polling every 5s</span>
                    </div>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                    <FaSignOutAlt className="nav-icon" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

export default Sidebar;