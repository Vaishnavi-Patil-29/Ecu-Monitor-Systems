using AlarmSystemAPI.Models;
using AlarmSystemAPI.Configuration;
using Microsoft.Extensions.Options;

namespace AlarmSystemAPI.Services
{
    /// <summary>
    /// Service for managing alarm flood protection and suppression logic.
    /// Implements industrial-grade alarm management patterns used in automotive ECUs,
    /// SCADA systems, and power plants.
    /// </summary>
    public interface IAlarmService
    {
        /// <summary>
        /// Checks if an alarm should be suppressed or created as new entry.
        /// </summary>
        /// <param name="existingAlarms">List of existing active alarms</param>
        /// <param name="newAlarm">The new alarm to process</param>
        /// <returns>Alarm to be saved (either existing with updated counts or new alarm)</returns>
        Alarm ProcessIncomingAlarm(List<Alarm> existingAlarms, Alarm newAlarm);

        /// <summary>
        /// Determines if two alarms are considered duplicates (same code and source).
        /// </summary>
        bool IsDuplicateAlarm(Alarm existing, Alarm incoming);

        /// <summary>
        /// Checks if an alarm is within the flood suppression window.
        /// </summary>
        bool IsWithinSuppressionWindow(Alarm existing);
    }

    public class AlarmService : IAlarmService
    {
        private readonly AlarmSettings _settings;

        public AlarmService(IOptions<AlarmSettings> settings)
        {
            _settings = settings.Value;
        }

        /// <summary>
        /// Main flood detection algorithm.
        /// If duplicate alarm found within suppression window:
        ///   - Increments RepeatCount
        ///   - Updates LastOccurred timestamp
        ///   - Sets FloodSuppressed flag
        ///   - Does NOT create new alarm entry
        /// Otherwise:
        ///   - Creates new alarm entry
        /// </summary>
        public Alarm ProcessIncomingAlarm(List<Alarm> existingAlarms, Alarm newAlarm)
        {
            // If flood protection is disabled, always create new alarm
            if (!_settings.EnableFloodProtection)
            {
                return newAlarm;
            }

            // Look for duplicate alarm that is still active (not acknowledged)
            var duplicate = existingAlarms.FirstOrDefault(a => 
                !a.IsAcknowledged && 
                IsDuplicateAlarm(a, newAlarm));

            if (duplicate == null)
            {
                // No duplicate found - this is a genuinely new alarm
                newAlarm.FirstOccurred = DateTime.Now;
                newAlarm.LastOccurred = DateTime.Now;
                newAlarm.RepeatCount = 0;
                newAlarm.FloodSuppressed = false;
                return newAlarm;
            }

            // Duplicate found - check if within suppression window
            if (IsWithinSuppressionWindow(duplicate))
            {
                // SUPPRESS: Update existing alarm instead of creating new entry
                duplicate.LastOccurred = DateTime.Now;
                duplicate.RepeatCount++;
                duplicate.FloodSuppressed = true;

                // Safety check: prevent integer overflow
                if (duplicate.RepeatCount > _settings.MaxRepeatCount)
                {
                    duplicate.RepeatCount = _settings.MaxRepeatCount;
                }

                return duplicate; // Return existing alarm with updated counts
            }
            else
            {
                // Outside suppression window - treat as new alarm occurrence
                // But keep historical context
                newAlarm.FirstOccurred = DateTime.Now;
                newAlarm.LastOccurred = DateTime.Now;
                newAlarm.RepeatCount = 0;
                newAlarm.FloodSuppressed = false;
                
                return newAlarm;
            }
        }

        /// <summary>
        /// Two alarms are duplicates if they have:
        /// 1. Same alarm code
        /// 2. Same source (if specified)
        /// </summary>
        public bool IsDuplicateAlarm(Alarm existing, Alarm incoming)
        {
            // Must have same alarm code
            if (existing.Code != incoming.Code)
                return false;

            // If both have sources specified, they must match
            if (!string.IsNullOrEmpty(existing.Source) && 
                !string.IsNullOrEmpty(incoming.Source))
            {
                return existing.Source == incoming.Source;
            }

            // If sources not specified, match by code only
            return true;
        }

        /// <summary>
        /// Checks if the alarm's last occurrence is within the configured suppression window.
        /// </summary>
        public bool IsWithinSuppressionWindow(Alarm existing)
        {
            var timeSinceLastOccurrence = DateTime.Now - existing.LastOccurred;
            return timeSinceLastOccurrence <= _settings.SuppressionWindow;
        }
    }
}
