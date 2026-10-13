using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Admin;

// Allows an action only for the root admin. Every other admin gets 403,
// even when calling the route directly. Use together with the Admin policy.
// System.Attribute is named in full because VeggieBook.Api.Data has its own
// Attribute class.

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class RootAdminOnlyAttribute : System.Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var services = context.HttpContext.RequestServices;
        var users = services.GetRequiredService<UserManager<AppUser>>();
        var config = services.GetRequiredService<IConfiguration>();

        if (!await AdminRules.IsRootAsync(context.HttpContext.User, users, config))
        {
            context.Result = new ObjectResult(new { error = "Only the main admin can do this." }) { StatusCode = 403 };
            return;
        }

        await next();
    }
}