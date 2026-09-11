using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Covers;

// GET /api/covers?vegetable=BROCCOLI
//
// The covers offered while browsing one vegetable on the cover screen.
// Public, like the rest of the content: these are the same photos the
// recipe cards already show.

[ApiController]
[Route("api/covers")]
public class CoversController(VeggieBookContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? vegetable)
    {
        if (string.IsNullOrWhiteSpace(vegetable))
            return BadRequest(new { error = "vegetable is required" });

        var veg = await db.Vegetables
            .FirstOrDefaultAsync(v => v.Code == vegetable && v.Active);
        if (veg is null) return NotFound(new { error = "Unknown vegetable" });

        var covers = await CoverCatalog.ForVegetable(db, veg);
        return Ok(new { vegetable = veg.Code, covers });
    }
}