using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlarmSystemHMI.Models
{
    [Table("Alarms")]
    public class Alarm
    {
        public int Id { get; set; }           
        public string Code { get; set; }
        public string Message { get; set; }
        public string Severity { get; set; } 
        public int EcuId { get; set; }
        public Ecu? Ecu { get; set; }
        public string Status { get; set; } = "Inactive"; 
        public bool IsAcknowledged { get; set; }

        // NEW: timestamps
        public DateTime TriggeredAt { get; set; }            
        public DateTime? AcknowledgedAt { get; set; }        
    }
}
