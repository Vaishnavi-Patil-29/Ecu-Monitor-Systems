import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../services/api";

function Settings() {
    const addAlarm = async () => {
        if (window.confirm("➕ Add a new test alarm?")) {
            try {
                await api.post("/alarms", {
                    code: `TEST-${Date.now().toString().slice(-5)}`,
                    message: "Manual alarm created from Settings",
                    severity: "High",
                    status: "Active"
                });
                alert("✅ Alarm added successfully");
            } catch (error) {
                alert("❌ Failed to add alarm");
                console.error(error);
            }
        }
    };

    const deleteHistory = async () => {
        if (window.confirm("⚠️ Are you sure you want to delete all alarm history? This action cannot be undone.")) {
            try {
                try {
                    await api.delete("/alarms/history");
                } catch {
                    await api.delete("/alarms/deleteHistory");
                }
                alert("✅ History deleted successfully");
            } catch (error) {
                alert("❌ Failed to delete history");
                console.error(error);
            }
        }
    };

    return (
        <div className="layout">
            <Sidebar />

            <div className="main">
                <Topbar title="⚙️ System Settings" />

                <div className="content">
                    <div className="settings-container">
                        {/* Notification Settings */}
                        <div className="settings-section">
                            <h3><span className="section-icon">🔔</span> Notifications</h3>
                            <div className="settings-row">
                                <div className="setting-info">
                                    <span className="setting-label">Critical Alarms</span>
                                    <span className="setting-description">Alert on critical severity</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="settings-row">
                                <div className="setting-info">
                                    <span className="setting-label">Sound Alerts</span>
                                    <span className="setting-description">Audio notification for alarms</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="settings-row">
                                <div className="setting-info">
                                    <span className="setting-label">Email Notifications</span>
                                    <span className="setting-description">Send alerts via email</span>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="settings-section danger-section">
                            <h3><span className="section-icon">⚠️</span> Danger Zone</h3>
                            {/* <div className="settings-row">
                                <div className="setting-info">
                                    <span className="setting-label">Add Test Alarm</span>
                                    <span className="setting-description">Create one active alarm entry</span>
                                </div>
                                <button className="danger-btn" onClick={addAlarm}>
                                    Add Alarm
                                </button>
                            </div> */}
                            <div className="settings-row">
                                <div className="setting-info">
                                    <span className="setting-label">Delete All History</span>
                                    <span className="setting-description">Permanently remove all alarm records</span>
                                </div>
                                <button className="danger-btn" onClick={deleteHistory}>
                                    Delete History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;