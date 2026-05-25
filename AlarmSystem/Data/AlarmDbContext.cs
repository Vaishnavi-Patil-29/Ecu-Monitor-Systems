using AlarmSystemHMI.Models;
using Microsoft.EntityFrameworkCore;

namespace AlarmSystemHMI.Data
{
    public class AlarmDbContext : DbContext
    {
        public AlarmDbContext(DbContextOptions<AlarmDbContext> options)
            : base(options)
        {
        }

        // ✅ THIS MUST BE DbSet<Alarm>
        public DbSet<Ecu> Ecus { get; set; }
        public DbSet<Alarm> Alarms { get; set; }
        public DbSet<AlarmEvent> AlarmEvents { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Ecu>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(120);
                entity.HasIndex(e => e.Name).IsUnique();
            });

            modelBuilder.Entity<Alarm>(entity =>
            {
                entity.Property(a => a.Status)
                    .HasMaxLength(20)
                    .HasDefaultValue("Inactive");

                entity.HasOne(a => a.Ecu)
                    .WithMany(e => e.Alarms)
                    .HasForeignKey(a => a.EcuId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}