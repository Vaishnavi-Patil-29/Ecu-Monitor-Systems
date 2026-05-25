using System.ComponentModel.DataAnnotations.Schema;

namespace AlarmSystemHMI.Models
{
    [Table("AlarmEvents")]
    public class AlarmEvent
    {
        public int Id { get; set; }
        public int AlarmId { get; set; }
        public DateTime Timestamp { get; set; }
        public string State { get; set; } // Active or Cleared
    }
}
