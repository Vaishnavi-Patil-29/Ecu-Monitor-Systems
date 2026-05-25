using System.ComponentModel.DataAnnotations.Schema;

namespace AlarmSystemHMI.Models
{
    [Table("Ecus")]
    public class Ecu
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public ICollection<Alarm> Alarms { get; set; } = new List<Alarm>();
    }
}
