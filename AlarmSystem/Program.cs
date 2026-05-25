using AlarmSystemHMI.Data;
using AlarmSystemHMI.Repositories;
using AlarmSystemHMI.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


// Add Controllers
builder.Services.AddControllers();

// Add DbContext
builder.Services.AddDbContext<AlarmDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register repository-service architecture
builder.Services.AddScoped<IEcuRepository, EcuRepository>();
builder.Services.AddScoped<IAlarmRepository, AlarmRepository>();
builder.Services.AddScoped<IEcuAlarmService, EcuAlarmService>();

// 🔴 ADD CORS (VERY IMPORTANT FOR REACT)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

//middleware

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

//  USE CORS 
app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

//seed db

try
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AlarmDbContext>();
        DbInitializer.EnsureSchema(context);
        DbInitializer.Seed(context);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database initialization warning: {ex.Message}");
}

app.Run();