using AlarmSystemHMI.Data;
using AlarmSystemHMI.Models;
using Microsoft.EntityFrameworkCore;

namespace AlarmSystemHMI.Repositories
{
    public class AlarmRepository : IAlarmRepository
    {
        private readonly AlarmDbContext _context;

        public AlarmRepository(AlarmDbContext context)
        {
            _context = context;
        }

        public Task<List<Alarm>> GetAllAsync()
        {
            return _context.Alarms
                .OrderByDescending(a => a.AcknowledgedAt ?? a.TriggeredAt)
                .ToListAsync();
        }

        public Task<List<Alarm>> GetActiveAsync()
        {
            return _context.Alarms
                .Where(a => !a.IsAcknowledged)
                .OrderByDescending(a => a.TriggeredAt)
                .ToListAsync();
        }

        public Task<List<Alarm>> GetByEcuIdAsync(int ecuId)
        {
            return _context.Alarms
                .Where(a => a.EcuId == ecuId)
                .OrderByDescending(a => a.TriggeredAt)
                .ToListAsync();
        }

        public Task<Alarm?> GetByIdAsync(int id)
        {
            return _context.Alarms.FirstOrDefaultAsync(a => a.Id == id);
        }

        public Task<List<string>> GetDistinctCodesAsync()
        {
            return _context.Alarms
                .Select(a => a.Code)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();
        }

        public async Task<Alarm> AddAsync(Alarm alarm)
        {
            _context.Alarms.Add(alarm);
            await _context.SaveChangesAsync();
            return alarm;
        }

        public async Task<Alarm?> UpdateAsync(Alarm alarm)
        {
            var existing = await _context.Alarms.FirstOrDefaultAsync(a => a.Id == alarm.Id);
            if (existing == null)
            {
                return null;
            }

            _context.Entry(existing).CurrentValues.SetValues(alarm);
            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task AddEventAsync(AlarmEvent alarmEvent)
        {
            _context.AlarmEvents.Add(alarmEvent);
            await _context.SaveChangesAsync();
        }

        public async Task<int> ResetHistoryAsync(DateTime resetAt)
        {
            var alarms = await _context.Alarms.ToListAsync();

            foreach (var alarm in alarms)
            {
                alarm.Status = "Inactive";
                alarm.IsAcknowledged = true;
                alarm.AcknowledgedAt = resetAt;
            }

            _context.AlarmEvents.RemoveRange(_context.AlarmEvents);
            await _context.SaveChangesAsync();
            return alarms.Count;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var alarm = await _context.Alarms.FirstOrDefaultAsync(a => a.Id == id);
            if (alarm == null)
            {
                return false;
            }

            _context.Alarms.Remove(alarm);
            await _context.SaveChangesAsync();
            return true;
        }

        public Task<int> GetTotalCountAsync()
        {
            return _context.Alarms.CountAsync();
        }

        public Task<int> GetActiveCountAsync()
        {
            return _context.Alarms.CountAsync(a => a.Status == "Active");
        }
    }
}
