using Microsoft.AspNetCore.Mvc;
using AlarmSystemAPI.Models;
using AlarmSystemAPI.Services;
using AlarmSystemAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace AlarmSystemAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AlarmController : ControllerBase
    {
        private readonly AlarmDbContext _context;
        private readonly IAlarmService _alarmService;

        public AlarmController(AlarmDbContext context, IAlarmService alarmService)
        {
            _context = context;
            _alarmService = alarmService;
        }

        /// <summary>
        /// GET: api/Alarm/all
        /// Returns all alarms (active and cleared) with flood protection metadata
        /// </summary>
        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<Alarm>>> GetAllAlarms()
        {
            try
            {
                var alarms = await _context.Alarms
                    .OrderByDescending(a => a.LastOccurred)
                    .ToListAsync();

                return Ok(alarms);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve alarms", details = ex.Message });
            }
        }

        /// <summary>
        /// GET: api/Alarm/active
        /// Returns only active (unacknowledged) alarms
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<Alarm>>> GetActiveAlarms()
        {
            try
            {
                var alarms = await _context.Alarms
                    .Where(a => !a.IsAcknowledged)
                    .OrderByDescending(a => a.LastOccurred)
                    .ToListAsync();

                return Ok(alarms);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve active alarms", details = ex.Message });
            }
        }

        /// <summary>
        /// GET: api/Alarm/codes
        /// Returns a distinct, sorted list of alarm codes (used by the ECUs button).
        /// </summary>
        [HttpGet("codes")]
        public async Task<ActionResult<IEnumerable<string>>> GetAlarmCodes()
        {
            try
            {
                var codes = await _context.Alarms
                    .Select(a => a.Code)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                return Ok(codes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve alarm codes", details = ex.Message });
            }
        }

        /// <summary>
        /// GET: api/Alarm/flood-statistics
        /// Returns statistics about flood suppression (demonstrates industrial expertise)
        /// </summary>
        [HttpGet("flood-statistics")]
        public async Task<ActionResult<object>> GetFloodStatistics()
        {
            try
            {
                var alarms = await _context.Alarms.ToListAsync();

                var stats = new
                {
                    TotalAlarms = alarms.Count,
                    SuppressedAlarms = alarms.Count(a => a.FloodSuppressed),
                    TotalRepeats = alarms.Sum(a => a.RepeatCount),
                    MostRepeatedAlarm = alarms
                        .OrderByDescending(a => a.RepeatCount)
                        .Select(a => new { a.Code, a.Message, a.RepeatCount })
                        .FirstOrDefault(),
                    AverageSuppressedRepeats = alarms
                        .Where(a => a.FloodSuppressed)
                        .Average(a => (double?)a.RepeatCount) ?? 0,
                    FloodProtectionEffectiveness = alarms.Count > 0 
                        ? $"{(alarms.Sum(a => a.RepeatCount) * 100.0 / (alarms.Count + alarms.Sum(a => a.RepeatCount))):F1}%"
                        : "0%"
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to calculate flood statistics", details = ex.Message });
            }
        }

        /// <summary>
        /// POST: api/Alarm/trigger
        /// Triggers a new alarm with intelligent flood protection
        /// </summary>
        [HttpPost("trigger")]
        public async Task<ActionResult<Alarm>> TriggerAlarm([FromBody] AlarmTriggerRequest request)
        {
            try
            {
                // Create new alarm from request
                var newAlarm = new Alarm
                {
                    Code = request.Code,
                    Message = request.Message,
                    Severity = request.Severity,
                    Source = request.Source,
                    Details = request.Details,
                    IsAcknowledged = false,
                    TriggeredAt = DateTime.Now
                };

                // Get existing active alarms for flood detection
                var existingAlarms = await _context.Alarms
                    .Where(a => !a.IsAcknowledged)
                    .ToListAsync();

                // Process through flood protection algorithm
                var processedAlarm = _alarmService.ProcessIncomingAlarm(existingAlarms, newAlarm);

                // Check if this is an update to existing alarm or new entry
                var existingEntry = existingAlarms.FirstOrDefault(a => a.Id == processedAlarm.Id);
                
                if (existingEntry != null)
                {
                    // Update existing alarm (flood suppressed)
                    _context.Entry(existingEntry).CurrentValues.SetValues(processedAlarm);
                    await _context.SaveChangesAsync();
                    
                    return Ok(new 
                    { 
                        alarm = processedAlarm, 
                        floodSuppressed = true,
                        message = $"Alarm suppressed - repeat count: {processedAlarm.RepeatCount}"
                    });
                }
                else
                {
                    // Create new alarm entry
                    _context.Alarms.Add(processedAlarm);
                    await _context.SaveChangesAsync();
                    
                    return CreatedAtAction(nameof(GetAlarmById), 
                        new { id = processedAlarm.Id }, 
                        new 
                        { 
                            alarm = processedAlarm, 
                            floodSuppressed = false,
                            message = "New alarm created"
                        });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to trigger alarm", details = ex.Message });
            }
        }

        /// <summary>
        /// GET: api/Alarm/{id}
        /// Get specific alarm by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Alarm>> GetAlarmById(int id)
        {
            try
            {
                var alarm = await _context.Alarms.FindAsync(id);

                if (alarm == null)
                    return NotFound(new { error = "Alarm not found" });

                return Ok(alarm);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve alarm", details = ex.Message });
            }
        }

        /// <summary>
        /// POST: api/Alarm/acknowledge/{id}
        /// Acknowledge an alarm (clears it from active list)
        /// </summary>
        [HttpPost("acknowledge/{id}")]
        public async Task<IActionResult> AcknowledgeAlarm(int id)
        {
            try
            {
                var alarm = await _context.Alarms.FindAsync(id);

                if (alarm == null)
                    return NotFound(new { error = "Alarm not found" });

                alarm.IsAcknowledged = true;
                alarm.FloodSuppressed = false; // Clear suppression flag when acknowledged

                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    message = "Alarm acknowledged successfully",
                    alarm = alarm
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to acknowledge alarm", details = ex.Message });
            }
        }

        /// <summary>
        /// POST: api/Alarm/acknowledge-all
        /// Acknowledge all active alarms at once
        /// </summary>
        [HttpPost("acknowledge-all")]
        public async Task<IActionResult> AcknowledgeAllAlarms()
        {
            try
            {
                var activeAlarms = await _context.Alarms
                    .Where(a => !a.IsAcknowledged)
                    .ToListAsync();

                foreach (var alarm in activeAlarms)
                {
                    alarm.IsAcknowledged = true;
                    alarm.FloodSuppressed = false;
                }

                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    message = $"Successfully acknowledged {activeAlarms.Count} alarms",
                    count = activeAlarms.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to acknowledge alarms", details = ex.Message });
            }
        }

        /// <summary>
        /// DELETE: api/Alarm/{id}
        /// Delete an alarm (admin function)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlarm(int id)
        {
            try
            {
                var alarm = await _context.Alarms.FindAsync(id);

                if (alarm == null)
                    return NotFound(new { error = "Alarm not found" });

                _context.Alarms.Remove(alarm);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Alarm deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete alarm", details = ex.Message });
            }
        }
    }

    /// <summary>
    /// Request model for triggering new alarms
    /// </summary>
    public class AlarmTriggerRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "Medium";
        public string? Source { get; set; }
        public string? Details { get; set; }
    }
}
