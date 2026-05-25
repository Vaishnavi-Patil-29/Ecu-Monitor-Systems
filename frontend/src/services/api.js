import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5183/api", // use SAME port as backend
});

// Convenience helpers for commonly used endpoints
export const getAlarmCodes = () => api.get("/alarms/codes");

// ECU Management APIs
export const getAllEcus = () => api.get("/ecus");
export const getAlarmsByEcuId = (ecuId) => api.get(`/ecus/${ecuId}/alarms`);
export const createAlarmForEcu = (ecuId, payload) => api.post(`/ecus/${ecuId}/alarms`, payload);
export const updateAlarm = (alarmId, payload) => api.put(`/alarms/${alarmId}`, payload);
export const deleteAlarm = (alarmId) => api.delete(`/alarms/${alarmId}`);
export const activateAlarm = (alarmId) => api.post(`/alarms/${alarmId}/activate`);
export const getAlarmOverview = () => api.get("/alarms/overview");

export default api;