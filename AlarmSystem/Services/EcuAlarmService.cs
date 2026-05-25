using AlarmSystemHMI.Models;
using AlarmSystemHMI.Repositories;

namespace AlarmSystemHMI.Services
{
    public class EcuAlarmService : IEcuAlarmService
    {
        private readonly IEcuRepository _ecuRepository;
        private readonly IAlarmRepository _alarmRepository;

        public EcuAlarmService(IEcuRepository ecuRepository, IAlarmRepository alarmRepository)
        {
            _ecuRepository = ecuRepository;
            _alarmRepository = alarmRepository;
        }

        public async Task<IEnumerable<EcuDto>> GetAllEcusAsync()
        {
            var ecus = await _ecuRepository.GetAllAsync();
            return ecus.Select(e => new EcuDto
            {
                Id = e.Id,
                Name = e.Name
            });
        }

        public async Task<IEnumerable<AlarmDto>> GetAllAlarmsAsync()
        {
            var alarms = await _alarmRepository.GetAllAsync();
            return alarms.Select(MapAlarm);
        }

        public async Task<IEnumerable<AlarmDto>> GetActiveAlarmsAsync()
        {
            var alarms = await _alarmRepository.GetActiveAsync();
            return alarms.Select(MapAlarm);
        }

        public Task<List<string>> GetAlarmCodesAsync()
        {
            return _alarmRepository.GetDistinctCodesAsync();
        }

        public async Task<IEnumerable<AlarmDto>> GetAlarmsByEcuIdAsync(int ecuId)
        {
            var alarms = await _alarmRepository.GetByEcuIdAsync(ecuId);
            return alarms.Select(MapAlarm);
        }

        public async Task<AlarmDto?> GetAlarmByIdAsync(int alarmId)
        {
            var alarm = await _alarmRepository.GetByIdAsync(alarmId);
            return alarm == null ? null : MapAlarm(alarm);
        }

        public async Task<AlarmDto> CreateAlarmAsync(CreateAlarmRequest request)
        {
            var requestedStatus = string.IsNullOrWhiteSpace(request.Status) ? "Active" : request.Status.Trim();

            int ecuId;
            if (request.EcuId.HasValue)
            {
                var ecu = await _ecuRepository.GetByIdAsync(request.EcuId.Value);
                if (ecu == null)
                {
                    throw new InvalidOperationException("ECU not found.");
                }

                ecuId = ecu.Id;
            }
            else
            {
                var firstEcu = (await _ecuRepository.GetAllAsync()).FirstOrDefault();
                if (firstEcu == null)
                {
                    throw new InvalidOperationException("No ECU exists to attach alarm.");
                }

                ecuId = firstEcu.Id;
            }

            var isAcknowledged = !requestedStatus.Equals("Active", StringComparison.OrdinalIgnoreCase);
            var now = DateTime.UtcNow;

            var alarm = new Alarm
            {
                Code = request.Code,
                Message = request.Message,
                Severity = request.Severity,
                EcuId = ecuId,
                Status = requestedStatus,
                IsAcknowledged = isAcknowledged,
                TriggeredAt = now,
                AcknowledgedAt = isAcknowledged ? now : null
            };

            var created = await _alarmRepository.AddAsync(alarm);
            return MapAlarm(created);
        }

        public async Task<AlarmDto?> CreateAlarmAsync(int ecuId, CreateEcuAlarmRequest request)
        {
            var ecu = await _ecuRepository.GetByIdAsync(ecuId);
            if (ecu == null)
            {
                return null;
            }

            var alarm = new Alarm
            {
                Code = request.Code,
                Message = request.Message,
                Severity = request.Severity,
                EcuId = ecuId,
                Status = "Inactive",
                IsAcknowledged = true,
                TriggeredAt = DateTime.UtcNow,
                AcknowledgedAt = DateTime.UtcNow
            };

            var created = await _alarmRepository.AddAsync(alarm);
            return MapAlarm(created);
        }

        public async Task<AlarmDto?> UpdateAlarmAsync(int alarmId, UpdateEcuAlarmRequest request)
        {
            var alarm = await _alarmRepository.GetByIdAsync(alarmId);
            if (alarm == null)
            {
                return null;
            }

            alarm.Code = request.Code;
            alarm.Message = request.Message;
            alarm.Severity = request.Severity;
            alarm.Status = request.Status;
            alarm.IsAcknowledged = request.Status != "Active";
            if (request.Status != "Active")
            {
                alarm.AcknowledgedAt = DateTime.UtcNow;
            }

            var updated = await _alarmRepository.UpdateAsync(alarm);
            return updated == null ? null : MapAlarm(updated);
        }

        public Task<bool> DeleteAlarmAsync(int alarmId)
        {
            return _alarmRepository.DeleteAsync(alarmId);
        }

        public async Task<AlarmDto?> AcknowledgeAlarmAsync(int alarmId)
        {
            var alarm = await _alarmRepository.GetByIdAsync(alarmId);
            if (alarm == null)
            {
                return null;
            }

            var now = DateTime.UtcNow;
            alarm.IsAcknowledged = true;
            alarm.Status = "Inactive";
            alarm.AcknowledgedAt = now;

            var updated = await _alarmRepository.UpdateAsync(alarm);
            if (updated == null)
            {
                return null;
            }

            await _alarmRepository.AddEventAsync(new AlarmEvent
            {
                AlarmId = alarmId,
                Timestamp = now,
                State = "Cleared"
            });

            return MapAlarm(updated);
        }

        public async Task<AlarmDto?> ActivateAlarmAsync(int alarmId)
        {
            var alarm = await _alarmRepository.GetByIdAsync(alarmId);
            if (alarm == null)
            {
                return null;
            }

            alarm.Status = "Active";
            alarm.IsAcknowledged = false;
            alarm.TriggeredAt = DateTime.UtcNow;
            alarm.AcknowledgedAt = null;

            var updated = await _alarmRepository.UpdateAsync(alarm);
            return updated == null ? null : MapAlarm(updated);
        }

        public async Task<AlarmOverviewDto> GetOverviewAsync()
        {
            return new AlarmOverviewDto
            {
                TotalAlarms = await _alarmRepository.GetTotalCountAsync(),
                ActiveAlarms = await _alarmRepository.GetActiveCountAsync()
            };
        }

        public async Task<AlarmSummaryDto> GetSummaryAsync()
        {
            var active = await _alarmRepository.GetActiveCountAsync();
            var total = await _alarmRepository.GetTotalCountAsync();

            return new AlarmSummaryDto
            {
                Active = active,
                Cleared = Math.Max(0, total - active)
            };
        }

        public Task<int> ResetHistoryAsync()
        {
            return _alarmRepository.ResetHistoryAsync(DateTime.UtcNow);
        }

        private static AlarmDto MapAlarm(Alarm alarm)
        {
            return new AlarmDto
            {
                Id = alarm.Id,
                Code = alarm.Code,
                Message = alarm.Message,
                Severity = alarm.Severity,
                EcuId = alarm.EcuId,
                Status = alarm.Status,
                IsAcknowledged = alarm.IsAcknowledged,
                TriggeredAt = alarm.TriggeredAt,
                AcknowledgedAt = alarm.AcknowledgedAt
            };
        }
    }
}
