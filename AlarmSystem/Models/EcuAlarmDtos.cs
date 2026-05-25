namespace AlarmSystemHMI.Models
{
    public class EcuDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class AlarmDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "Low";
        public int EcuId { get; set; }
        public string Status { get; set; } = "Inactive";
        public bool IsAcknowledged { get; set; }
        public DateTime TriggeredAt { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
    }

    public class CreateAlarmRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "Low";
        public int? EcuId { get; set; }
        public string? Status { get; set; }
    }

    public class CreateEcuAlarmRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "Low";
    }

    public class UpdateEcuAlarmRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "Low";
        public string Status { get; set; } = "Inactive";
    }

    public class AlarmOverviewDto
    {
        public int TotalAlarms { get; set; }
        public int ActiveAlarms { get; set; }
    }

    public class AlarmSummaryDto
    {
        public int Active { get; set; }
        public int Cleared { get; set; }
    }
}
