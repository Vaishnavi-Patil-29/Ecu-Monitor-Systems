import { useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { FaUser, FaLock, FaBolt, FaShieldAlt, FaCheckCircle } from "react-icons/fa";

import { MdBatteryChargingFull } from "react-icons/md";

import { RiAlarmWarningFill } from "react-icons/ri";

import "../styles/Login.css";

function Login() {

    const [username, setUsername] = useState("");

    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState({});

    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/dashboard";

    const validate = () => {

        const newErrors = {};

        if (!username.trim()) {

            newErrors.username = "Username is required";

        } else if (username.length < 3) {

            newErrors.username = "Username must be at least 3 characters";

        }

        if (!password) {

            newErrors.password = "Password is required";

        } else if (password.length < 6) {

            newErrors.password = "Password must be at least 6 characters";

        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;

    };

    const handleLogin = (e) => {

        e.preventDefault();

        if (!validate()) {

            return;

        }

        setIsLoading(true);

        setTimeout(() => {

            if (username === "admin" && password === "admin123") {

                sessionStorage.setItem("isAuthenticated", "true");

                sessionStorage.setItem("username", username);

                sessionStorage.setItem("loginTime", new Date().toISOString());

                navigate(from, { replace: true });

            } else {

                setErrors({ general: "Invalid username or password" });

                setIsLoading(false);

            }

        }, 1000);

    };

    return (
        <div className="login-container">

            {/* Animated Background */}
            <div className="login-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="gradient-orb orb-3"></div>
                <div className="grid-overlay"></div>
            </div>

            {/* Left Side - Branding */}
            <div className="login-left">
                <div className="branding-content">
                    <div className="brand-logo">
                        <MdBatteryChargingFull className="battery-logo" />
                        <FaBolt className="bolt-icon" />
                    </div>
                    <h1 className="brand-title">ECU Monitor</h1>
                    <p className="brand-subtitle">Next-Gen Automotive Alarm Management</p>

                    <div className="features-list">
                        <div className="feature-item">
                            <FaCheckCircle className="feature-icon" />
                            <span>Real-time Monitoring</span>
                        </div>
                        <div className="feature-item">
                            <FaCheckCircle className="feature-icon" />
                            <span>Alert System</span>
                        </div>
                        <div className="feature-item">
                            <FaCheckCircle className="feature-icon" />
                            <span>Comprehensive Analytics</span>
                        </div>
                        <div className="feature-item">
                            <FaCheckCircle className="feature-icon" />
                            <span>Enterprise-Grade Security</span>
                        </div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-box">
                            <RiAlarmWarningFill className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-number">24/7</span>
                                <span className="stat-label">Monitoring</span>
                            </div>
                        </div>
                        <div className="stat-box">
                            <FaShieldAlt className="stat-icon" />
                            <div className="stat-content">
                                <span className="stat-number">100%</span>
                                <span className="stat-label">Secure</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="login-right">
                <div className="login-card">
                    <div className="login-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">

                        {errors.general && (
                            <div className="error-banner">
                                <RiAlarmWarningFill className="error-icon" />
                                <span>{errors.general}</span>
                            </div>

                        )}

                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <div className={`input-wrapper ${errors.username ? 'has-error' : ''} ${username ? 'has-value' : ''}`}>
                                <FaUser className="input-icon" />
                                <input

                                    type="text"

                                    id="username"

                                    value={username}

                                    onChange={(e) => setUsername(e.target.value)}

                                    placeholder="Enter username"

                                    autoComplete="username"

                                />
                            </div>

                            {errors.username && (
                                <span className="error-text">
                                    <RiAlarmWarningFill className="error-text-icon" />

                                    {errors.username}
                                </span>

                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className={`input-wrapper ${errors.password ? 'has-error' : ''} ${password ? 'has-value' : ''}`}>
                                <FaLock className="input-icon" />
                                <input

                                    type={showPassword ? "text" : "password"}

                                    id="password"

                                    value={password}

                                    onChange={(e) => setPassword(e.target.value)}

                                    placeholder="Enter password"

                                    autoComplete="current-password"

                                />
                                <button

                                    type="button"

                                    className="password-toggle"

                                    onClick={() => setShowPassword(!showPassword)}
                                >

                                    {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                            </div>

                            {errors.password && (
                                <span className="error-text">
                                    <RiAlarmWarningFill className="error-text-icon" />

                                    {errors.password}
                                </span>

                            )}
                        </div>

                        <button type="submit" className="login-btn" disabled={isLoading}>

                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Signing In...</span>
                                </>

                            ) : (
                                <>
                                    <FaBolt className="btn-icon" />
                                    <span>Sign In</span>
                                </>

                            )}
                        </button>

                      
                    </form>

                    
                </div>
            </div>
        </div>

    );

}

export default Login;

