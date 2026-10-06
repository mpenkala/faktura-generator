using Serilog;
using Xmarton.Commons.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.Host
    .AddLocalConfigFile()
    .UseSerilog((context, config) =>
    {
        config
            .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext();
    });

// Add services to the container.

builder.Services.AddControllers();

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
