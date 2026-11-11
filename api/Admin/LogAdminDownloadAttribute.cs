using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using VeggieBook.Api.Activity;
using VeggieBook.Api.Auth;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Writes an admin_download line for every file an admin downloads from the
// controller or action it is placed on. Answers that are not files are not
// logged. The line holds the file's name, which says what was downloaded and
// in which format. A failed log never blocks the download.

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class LogAdminDownloadAttribute : System.Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executed = await next();
        if (executed.Exception is not null || executed.Result is not FileResult file) return;

        var http = context.HttpContext;
        var db = http.RequestServices.GetRequiredService<AccountsContext>();
        var logger = http.RequestServices.GetRequiredService<ILogger<LogAdminDownloadAttribute>>();

        var name = string.IsNullOrWhiteSpace(file.FileDownloadName)
            ? http.Request.Path.Value ?? "A file"
            : file.FileDownloadName;

        await ActivityLog.SaveAdminAsync(db, logger, ActivityLog.AdminDownload, AuthSetup.UserId(http.User), name);
    }
}