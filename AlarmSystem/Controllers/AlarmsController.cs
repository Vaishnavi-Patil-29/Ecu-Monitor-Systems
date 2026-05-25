using AlarmSystemHMI.Models;
using AlarmSystemHMI.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlarmSystem.Controllers
{
    [ApiController]
    [Route("api/alarms")]
    public class AlarmsController : ControllerBase
    {
        private readonly IEcuAlarmService _service;

        public AlarmsController(IEcuAlarmService service)
        {
            _service = service;
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {
            var alarms = await _service.GetAllAlarmsAsync();
            return Ok(alarms);
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var alarms = await _service.GetActiveAlarmsAsync();
            return Ok(alarms);
        }

        [HttpGet("codes")]
        public async Task<IActionResult> GetCodes()
        {
            var codes = await _service.GetAlarmCodesAsync();
            return Ok(codes);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            var summary = await _service.GetSummaryAsync();
            return Ok(summary);
        }

        [HttpGet("{alarmId:int}")]
        public async Task<IActionResult> GetById(int alarmId)
        {
            var alarm = await _service.GetAlarmByIdAsync(alarmId);
            if (alarm == null)
            {
                return NotFound(new { message = "Alarm not found." });
            }

            return Ok(alarm);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAlarmRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { message = "Payload is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Code and Message are required." });
            }

            if (string.IsNullOrWhiteSpace(request.Severity))
            {
                return BadRequest(new { message = "Severity is required." });
            }

            try
            {
                var created = await _service.CreateAlarmAsync(request);
                return CreatedAtAction(nameof(GetById), new { alarmId = created.Id }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var overview = await _service.GetOverviewAsync();
            return Ok(overview);
        }

        [HttpPut("{alarmId:int}")]
        public async Task<IActionResult> UpdateAlarm(int alarmId, [FromBody] UpdateEcuAlarmRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Code and Message are required." });
            }

            var updated = await _service.UpdateAlarmAsync(alarmId, request);
            if (updated == null)
            {
                return NotFound(new { message = "Alarm not found." });
            }

            return Ok(updated);
        }

        [HttpDelete("{alarmId:int}")]
        public async Task<IActionResult> DeleteAlarm(int alarmId)
        {
            var deleted = await _service.DeleteAlarmAsync(alarmId);
            if (!deleted)
            {
                return NotFound(new { message = "Alarm not found." });
            }

            return Ok(new { message = "Alarm deleted." });
        }

        [HttpPost("{alarmId:int}/acknowledge")]
        public async Task<IActionResult> AcknowledgeAlarm(int alarmId)
        {
            var acknowledged = await _service.AcknowledgeAlarmAsync(alarmId);
            if (acknowledged == null)
            {
                return NotFound(new { message = "Alarm not found." });
            }

            return Ok(acknowledged);
        }

        [HttpPost("{alarmId:int}/activate")]
        public async Task<IActionResult> ActivateAlarm(int alarmId)
        {
            var activated = await _service.ActivateAlarmAsync(alarmId);
            if (activated == null)
            {
                return NotFound(new { message = "Alarm not found." });
            }

            return Ok(activated);
        }

        [HttpDelete("history")]
        [HttpDelete("deleteHistory")]
        public async Task<IActionResult> DeleteHistory()
        {
            var updatedAlarms = await _service.ResetHistoryAsync();
            return Ok(new { message = "History reset. Alarms set to inactive.", updatedAlarms });
        }
    }
}
