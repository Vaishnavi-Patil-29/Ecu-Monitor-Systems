using AlarmSystemHMI.Models;
using AlarmSystemHMI.Services;
using Microsoft.AspNetCore.Mvc;

namespace AlarmSystem.Controllers
{
    [ApiController]
    [Route("api/ecus")]
    public class EcusController : ControllerBase
    {
        private readonly IEcuAlarmService _service;

        public EcusController(IEcuAlarmService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEcus()
        {
            var ecus = await _service.GetAllEcusAsync();
            return Ok(ecus);
        }

        [HttpGet("{ecuId:int}/alarms")]
        public async Task<IActionResult> GetAlarmsByEcuId(int ecuId)
        {
            var alarms = await _service.GetAlarmsByEcuIdAsync(ecuId);
            return Ok(alarms);
        }

        [HttpPost("{ecuId:int}/alarms")]
        public async Task<IActionResult> CreateAlarmForEcu(int ecuId, [FromBody] CreateEcuAlarmRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Code and Message are required." });
            }

            var created = await _service.CreateAlarmAsync(ecuId, request);
            if (created == null)
            {
                return NotFound(new { message = "ECU not found." });
            }

            return Ok(created);
        }
    }
}
