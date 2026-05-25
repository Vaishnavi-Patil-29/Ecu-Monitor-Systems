using AlarmSystemHMI.Models;

namespace AlarmSystemHMI.Services
{
    public interface IEcuAlarmService
    {
        Task<IEnumerable<EcuDto>> GetAllEcusAsync();
        Task<IEnumerable<AlarmDto>> GetAllAlarmsAsync();
        Task<IEnumerable<AlarmDto>> GetActiveAlarmsAsync();
        Task<List<string>> GetAlarmCodesAsync();
        Task<IEnumerable<AlarmDto>> GetAlarmsByEcuIdAsync(int ecuId);
        Task<AlarmDto?> GetAlarmByIdAsync(int alarmId);
        Task<AlarmDto> CreateAlarmAsync(CreateAlarmRequest request);
        Task<AlarmDto?> CreateAlarmAsync(int ecuId, CreateEcuAlarmRequest request);
        Task<AlarmDto?> UpdateAlarmAsync(int alarmId, UpdateEcuAlarmRequest request);
        Task<AlarmDto?> AcknowledgeAlarmAsync(int alarmId);
        Task<bool> DeleteAlarmAsync(int alarmId);
        Task<AlarmDto?> ActivateAlarmAsync(int alarmId);
        Task<AlarmSummaryDto> GetSummaryAsync();
        Task<int> ResetHistoryAsync();
        Task<AlarmOverviewDto> GetOverviewAsync();
    }
}
