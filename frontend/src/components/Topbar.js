import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { MdAccessTime } from "react-icons/md";

function Topbar({ title, extraElement }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const username = sessionStorage.getItem("username") || "Admin";
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            sessionStorage.removeItem("isAuthenticated");
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("loginTime");
            navigate("/login");
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="topbar">
            <div className="topbar-left">
                <h1>{title}</h1>

                {/* NEW: Device Selection Button Section */}
                {extraElement && (
                    <div className="topbar-extra">
                        {extraElement}
                    </div>
                )}
            </div>

            <div className="topbar-right">
                <div className="topbar-time">
                    <MdAccessTime className="time-icon" />
                    <div className="time-content">
                        <div className="time-display">{formatTime(currentTime)}</div>
                        <div className="date-display">{formatDate(currentTime)}</div>
                    </div>
                </div>

                <div className="topbar-divider"></div>

                <div className="user-info">
                    <div className="user-avatar">
                        <FaUser className="avatar-icon" />
                    </div>
                    <div className="user-details">
                        <span className="user-name">{username}</span>
                        <span className="user-role">Administrator</span>
                    </div>
                </div>

                <button className="topbar-logout-btn" onClick={handleLogout} title="Logout">
                    <FaSignOutAlt />
                </button>
            </div>
        </div>
    );
}

export default Topbar;