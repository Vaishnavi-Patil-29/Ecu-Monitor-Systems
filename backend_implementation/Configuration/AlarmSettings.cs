namespace AlarmSystemAPI.Configuration
{
    /// <summary>
    /// Configuration settings for alarm flood protection.
    /// Used in industrial control systems to prevent operator overwhelm during fault cascades.
    /// </summary>
    public class AlarmSettings
    {
        /// <summary>
        /// Time window (in seconds) during which repeated alarms are suppressed.
        /// Default: 30 seconds (typical for automotive ECUs and SCADA systems)
        /// </summary>
        public int FloodSuppressionWindowSeconds { get; set; } = 30;

        /// <summary>
        /// Maximum number of repeats before forcing a new alarm entry.
        /// Prevents integer overflow and ensures visibility of persistent issues.
        /// </summary>
        public int MaxRepeatCount { get; set; } = 999;

        /// <summary>
        /// Master switch for flood protection feature.
        /// Can be disabled for testing or debugging purposes.
        /// </summary>
        public bool EnableFloodProtection { get; set; } = true;

        /// <summary>
        /// Gets the suppression window as a TimeSpan for easier calculations.
        /// </summary>
        public TimeSpan SuppressionWindow => TimeSpan.FromSeconds(FloodSuppressionWindowSeconds);
    }
}
