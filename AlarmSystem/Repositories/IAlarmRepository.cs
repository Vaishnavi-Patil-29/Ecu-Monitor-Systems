using AlarmSystemHMI.Models;

namespace AlarmSystemHMI.Repositories
{
    public interface IAlarmRepository
    {
        Task<List<Alarm>> GetAllAsync();
        Task<List<Alarm>> GetActiveAsync();
        Task<List<Alarm>> GetByEcuIdAsync(int ecuId);
        Task<Alarm?> GetByIdAsync(int id);
        Task<List<string>> GetDistinctCodesAsync();
        Task<Alarm> AddAsync(Alarm alarm);
        Task<Alarm?> UpdateAsync(Alarm alarm);
        Task AddEventAsync(AlarmEvent alarmEvent);
        Task<int> ResetHistoryAsync(DateTime resetAt);
        Task<bool> DeleteAsync(int id);
        Task<int> GetTotalCountAsync();
        Task<int> GetActiveCountAsync();
    }
}
