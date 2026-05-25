using AlarmSystemHMI.Models;
using Microsoft.EntityFrameworkCore;

namespace AlarmSystemHMI.Data
{
    public static class DbInitializer
    {
        private const int TargetEcuCount = 30;
        private const int TargetAlarmsPerEcu = 2;

        private static readonly (string MessageLabel, string Severity)[] AlarmTemplates =
        [
            ("Overheat", "Critical"),
            ("Maintenance Reminder", "Low"),
            ("Network Latency", "Medium"),
            ("Power Supply Failure", "High")
        ];

        public static void EnsureSchema(AlarmDbContext context)
        {
            // Ensure ECU table exists
            context.Database.ExecuteSqlRaw(@"
IF OBJECT_ID('dbo.Ecus', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Ecus
    (
        Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL UNIQUE
    )
END
");

            // Add missing columns to Alarms table in older databases
            context.Database.ExecuteSqlRaw(@"
IF COL_LENGTH('dbo.Alarms', 'EcuId') IS NULL
    ALTER TABLE dbo.Alarms ADD EcuId INT NOT NULL CONSTRAINT DF_Alarms_EcuId DEFAULT (1);

IF COL_LENGTH('dbo.Alarms', 'Status') IS NULL
    ALTER TABLE dbo.Alarms ADD Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Alarms_Status DEFAULT ('Inactive');
");

            // Ensure FK exists (safe add)
            context.Database.ExecuteSqlRaw(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Alarms_Ecus_EcuId'
)
BEGIN
    ALTER TABLE dbo.Alarms
    WITH CHECK ADD CONSTRAINT FK_Alarms_Ecus_EcuId
    FOREIGN KEY (EcuId) REFERENCES dbo.Ecus(Id) ON DELETE CASCADE;
END
");
        }

        public static void Seed(AlarmDbContext context)
        {
            if (!context.Ecus.Any())
            {
                var ecus = Enumerable
                    .Range(1, TargetEcuCount)
                    .Select(i => new Ecu { Name = $"ECU-{i:D2}" })
                    .ToList();

                context.Ecus.AddRange(ecus);
                context.SaveChanges();
            }

            // Keep exactly 30 ECUs and normalize ECU naming
            var allEcus = context.Ecus.OrderBy(e => e.Id).ToList();
            var extraEcus = allEcus.Skip(TargetEcuCount).ToList();
            if (extraEcus.Count > 0)
            {
                context.Ecus.RemoveRange(extraEcus);
                context.SaveChanges();
            }

            var normalizedEcus = context.Ecus.OrderBy(e => e.Id).ToList();
            for (var i = 0; i < normalizedEcus.Count; i++)
            {
                normalizedEcus[i].Name = $"ECU-{i + 1:D2}";
            }

            if (normalizedEcus.Count < TargetEcuCount)
            {
                var missing = Enumerable
                    .Range(normalizedEcus.Count + 1, TargetEcuCount - normalizedEcus.Count)
                    .Select(i => new Ecu { Name = $"ECU-{i:D2}" })
                    .ToList();

                context.Ecus.AddRange(missing);
            }

            context.SaveChanges();

            var ecusList = context.Ecus.OrderBy(e => e.Id).Take(TargetEcuCount).ToList();
            if (ecusList.Count == 0)
            {
                return;
            }

            var legacyDefaultAlarms = context.Alarms
                .Where(a => a.Code.EndsWith("_ALM") && a.Message.StartsWith("Default alarm for "))
                .ToList();

            if (legacyDefaultAlarms.Count > 0)
            {
                context.Alarms.RemoveRange(legacyDefaultAlarms);
                context.SaveChanges();
            }

            foreach (var ecu in ecusList)
            {
                var ecuAlarms = context.Alarms
                    .Where(a => a.EcuId == ecu.Id)
                    .OrderBy(a => a.Id)
                    .ToList();

                var expectedTemplates = new[]
                {
                    AlarmTemplates[(ecu.Id - 1) % AlarmTemplates.Length],
                    AlarmTemplates[ecu.Id % AlarmTemplates.Length]
                };

                for (var i = 0; i < TargetAlarmsPerEcu; i++)
                {
                    var template = expectedTemplates[i];
                    var expectedCode = $"ECU{ecu.Id:D2}_ALM"; // keep ECU alarm code format unchanged
                    var expectedMessage = $"{ecu.Name} - {template.MessageLabel}";
                    var shouldBeActive = i == 0; // 1 active + 1 cleared per ECU => 30 active at startup
                    var now = DateTime.UtcNow;

                    if (i < ecuAlarms.Count)
                    {
                        var existing = ecuAlarms[i];
                        existing.Code = expectedCode;
                        existing.Message = expectedMessage;
                        existing.Severity = template.Severity;
                        existing.Status = shouldBeActive ? "Active" : "Inactive";
                        existing.IsAcknowledged = !shouldBeActive;
                        existing.AcknowledgedAt = shouldBeActive ? null : (existing.AcknowledgedAt ?? now);
                        if (existing.TriggeredAt == default)
                        {
                            existing.TriggeredAt = now;
                        }
                    }
                    else
                    {
                        context.Alarms.Add(new Alarm
                        {
                            Code = expectedCode,
                            Message = expectedMessage,
                            Severity = template.Severity,
                            EcuId = ecu.Id,
                            Status = shouldBeActive ? "Active" : "Inactive",
                            IsAcknowledged = !shouldBeActive,
                            TriggeredAt = now,
                            AcknowledgedAt = shouldBeActive ? null : now
                        });
                    }
                }

                var extras = ecuAlarms.Skip(TargetAlarmsPerEcu).ToList();
                if (extras.Count > 0)
                {
                    context.Alarms.RemoveRange(extras);
                }
            }

            context.SaveChanges();

            // Normalize legacy records
            var alarmsToFix = context.Alarms
                .Where(a => string.IsNullOrEmpty(a.Status) || a.EcuId <= 0)
                .ToList();

            if (alarmsToFix.Count > 0)
            {
                var fallbackEcuId = context.Ecus.Select(e => e.Id).FirstOrDefault();
                foreach (var alarm in alarmsToFix)
                {
                    if (alarm.EcuId <= 0)
                    {
                        alarm.EcuId = fallbackEcuId;
                    }

                    if (string.IsNullOrEmpty(alarm.Status))
                    {
                        alarm.Status = alarm.IsAcknowledged ? "Inactive" : "Active";
                    }
                }

                context.SaveChanges();
            }
        }
       
    }
}