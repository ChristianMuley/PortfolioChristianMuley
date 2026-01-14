using System.ComponentModel.DataAnnotations;
using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace MyPortfolio.Controllers
{
    [ApiController]
    [Route("api/contact")]
    public class ContactApiController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<ContactApiController> _logger;

        public ContactApiController(IWebHostEnvironment env, ILogger<ContactApiController> logger)
        {
            _env = env;
            _logger = logger;
        }

        public sealed class ContactDto
        {
            [Required, StringLength(80)]
            public string Name { get; set; } = "";

            [Required, EmailAddress, StringLength(120)]
            public string Email { get; set; } = "";

            [Required, StringLength(2000)]
            public string Message { get; set; } = "";
        }

        [HttpPost]
        [IgnoreAntiforgeryToken] // keeps it simple for fetch() JSON posts
        public async Task<IActionResult> Post([FromBody] ContactDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(kvp => kvp.Value?.Errors?.Count > 0)
                    .SelectMany(kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage))
                    .ToArray();

                return BadRequest(new { ok = false, message = "Validation failed.", errors });
            }

            // Log to console (visible in server logs)
            _logger.LogInformation("CONTACT FORM: Name={Name}, Email={Email}, Message={Message}",
                dto.Name, dto.Email, dto.Message);

            // Also write to a local file so you can demo “real submissions”
            try
            {
                var dir = Path.Combine(_env.ContentRootPath, "App_Data");
                Directory.CreateDirectory(dir);

                var file = Path.Combine(dir, "contact_messages.txt");
                var sb = new StringBuilder();
                sb.AppendLine("----- CONTACT MESSAGE -----");
                sb.AppendLine($"UTC: {DateTime.UtcNow:O}");
                sb.AppendLine($"Name: {dto.Name}");
                sb.AppendLine($"Email: {dto.Email}");
                sb.AppendLine("Message:");
                sb.AppendLine(dto.Message);
                sb.AppendLine();

                await System.IO.File.AppendAllTextAsync(file, sb.ToString());
            }
            catch (Exception ex)
            {
                // Still return OK (so your UI isn't blocked), but log the failure.
                _logger.LogError(ex, "Failed to write contact message to file.");
            }

            return Ok(new { ok = true });
        }
    }
}
