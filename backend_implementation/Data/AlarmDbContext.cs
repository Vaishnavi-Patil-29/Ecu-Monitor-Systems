using Microsoft.EntityFrameworkCore;
using AlarmSystemAPI.Models;

namespace AlarmSystemAPI.Data
{
    /// <summary>
    /// Entity Framework database context for alarm management system.
    /// Handles persistence of alarms with flood protection metadata.
    /// </summary>
    public class AlarmDbContext : DbContext
    {
        public AlarmDbContext(DbContextOptions<AlarmDbContext> options) : base(options)
        {
        }

        public DbSet<Alarm> Alarms { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Alarm entity
            modelBuilder.Entity<Alarm>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Code)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Message)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Severity)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(e => e.Source)
                    .HasMaxLength(100);

                entity.Property(e => e.Details)
                    .HasMaxLength(500);

                // Index for faster duplicate detection
                entity.HasIndex(e => new { e.Code, e.Source, e.IsAcknowledged })
                    .HasDatabaseName("IX_Alarm_FloodDetection");

                // Index for LastOccurred queries (suppression window checks)
                entity.HasIndex(e => e.LastOccurred)
                    .HasDatabaseName("IX_Alarm_LastOccurred");
            });

            // Seed sample data for testing
            modelBuilder.Entity<Alarm>().HasData(
                new Alarm
                {
                    Id = 1,
                    Code = "BATT_LOW_VOLTAGE",
                    Message = "Battery voltage below threshold",
                    Severity = "Critical",
                    Source = "ECU_01",
                    Details = "Voltage: 10.5V (Threshold: 11.0V)",
                    IsAcknowledged = false,
                    TriggeredAt = DateTime.Now.AddMinutes(-15),
                    FirstOccurred = DateTime.Now.AddMinutes(-15),
                    LastOccurred = DateTime.Now.AddMinutes(-2),
                    RepeatCount = 5,
                    FloodSuppressed = true
                },
                new Alarm
                {
                    Id = 2,
                    Code = "TEMP_HIGH",
                    Message = "Temperature exceeds safe limit",
                    Severity = "High",
                    Source = "ECU_02",
                    Details = "Temperature: 85°C (Limit: 75°C)",
                    IsAcknowledged = false,
                    TriggeredAt = DateTime.Now.AddMinutes(-5),
                    FirstOccurred = DateTime.Now.AddMinutes(-5),
                    LastOccurred = DateTime.Now.AddMinutes(-5),
                    RepeatCount = 0,
                    FloodSuppressed = false
                }
            );
        }
    }
}
