using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlarmSystemAPI.Models
{
    [Table("Alarms")]
    public class Alarm
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; }

        [Required]
        [StringLength(200)]
        public string Message { get; set; }

        [Required]
        [StringLength(20)]
        public string Severity { get; set; } // Critical, High, Medium, Low

        public bool IsAcknowledged { get; set; } = false;

        // ===== FLOOD PROTECTION FIELDS =====
        /// <summary>
        /// First time this alarm was triggered (never changes)
        /// </summary>
        public DateTime FirstOccurred { get; set; } = DateTime.Now;

        /// <summary>
        /// Most recent occurrence of this alarm
        /// </summary>
        public DateTime LastOccurred { get; set; } = DateTime.Now;

        /// <summary>
        /// Number of times this alarm repeated within suppression window
        /// </summary>
        public int RepeatCount { get; set; } = 0;

        /// <summary>
        /// Whether this alarm is currently under flood suppression
        /// </summary>
        public bool FloodSuppressed { get; set; } = false;

        /// <summary>
        /// Timestamp when alarm was triggered (for backwards compatibility)
        /// </summary>
        public DateTime TriggeredAt { get; set; } = DateTime.Now;

        /// <summary>
        /// Optional: Device or source that generated this alarm
        /// </summary>
        [StringLength(100)]
        public string? Source { get; set; }

        /// <summary>
        /// Optional: Additional details about the alarm
        /// </summary>
        [StringLength(500)]
        public string? Details { get; set; }
    }
}
