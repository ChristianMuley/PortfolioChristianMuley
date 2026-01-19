using System.Net;
using System.Net.Mail;
using System.Threading.RateLimiting;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("contact", httpContext =>
    {
        // Simple per-IP limiter 
        var xff = httpContext.Request.Headers["X-Forwarded-For"].ToString();
        var ip = !string.IsNullOrWhiteSpace(xff)
            ? xff.Split(',')[0].Trim()
            : httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,                     // allow 5 messages
            Window = TimeSpan.FromMinutes(10),   // per 10 minutes
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });
});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseRateLimiter(); 

app.UseAuthorization();

app.MapStaticAssets();

/* =========================
   Contact API (sends email via Gmail SMTP)
   ========================= */
app.MapPost("/api/contact", async (ContactRequest req, IConfiguration config) =>
{
    var name = (req.Name ?? "").Trim();
    var email = (req.Email ?? "").Trim();
    var message = (req.Message ?? "").Trim();

    if (string.IsNullOrWhiteSpace(name))
        return Results.BadRequest(new { ok = false, message = "Name is required." });

    if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        return Results.BadRequest(new { ok = false, message = "Valid email is required." });

    if (string.IsNullOrWhiteSpace(message))
        return Results.BadRequest(new { ok = false, message = "Message is required." });

    // Basic caps to reduce abuse
    if (name.Length > 80) return Results.BadRequest(new { ok = false, message = "Name is too long." });
    if (email.Length > 200) return Results.BadRequest(new { ok = false, message = "Email is too long." });
    if (message.Length > 4000) return Results.BadRequest(new { ok = false, message = "Message is too long." });

    // Read secrets from Azure Environment Variables:
    // SMTP__HOST, SMTP__PORT, SMTP__USER, SMTP__PASS, CONTACT__TO
    var host = config["SMTP:HOST"];
    var portStr = config["SMTP:PORT"];
    var user = config["SMTP:USER"];
    var pass = config["SMTP:PASS"];
    var toEmail = config["CONTACT:TO"];

    if (string.IsNullOrWhiteSpace(host) ||
        string.IsNullOrWhiteSpace(portStr) ||
        string.IsNullOrWhiteSpace(user) ||
        string.IsNullOrWhiteSpace(pass) ||
        string.IsNullOrWhiteSpace(toEmail) ||
        !int.TryParse(portStr, out var port))
    {
        return Results.Problem("Server email configuration is missing.", statusCode: 500);
    }

    using var mail = new MailMessage
    {
        From = new MailAddress(user, "Portfolio Contact"),
        Subject = $"PORTFOLIO - {name}",
        Body =
$@"New Message from Portfolio Contact Form:

Name: {name}
Email: {email}

Message:
{message}"
    };

    mail.Priority = MailPriority.High;
    mail.Headers.Add("Importance", "high");
    mail.Headers.Add("X-Priority", "1");
    mail.Headers.Add("X-MSMail-Priority", "High");
    mail.To.Add(toEmail);
    mail.ReplyToList.Add(new MailAddress(email));

    using var smtp = new SmtpClient(host, port)
    {
        EnableSsl = true, // STARTTLS on 587
        Credentials = new NetworkCredential(user, pass),
    };

    await smtp.SendMailAsync(mail);

    return Results.Ok(new { ok = true });
})
.RequireRateLimiting("contact");
/* ========================= */

app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();

/* Type declarations must be AFTER all top-level statements */
sealed record ContactRequest(string? Name, string? Email, string? Message);
