using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Nutrition;

// Nutrition facts for one vegetable: raw, one serving, one entry per kind
// (Root Vegetables has three). Open to everyone, like the vegetables
// themselves. Opening it is a view, so it is not recorded.
//
//   GET /api/vegetables/{code}/nutrition?lang=es
//
// An empty list means no facts are stored for that vegetable yet.

[ApiController]
[Route("api/vegetables/{code}/nutrition")]
public class NutritionController(VeggieBookContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(string code, [FromQuery] string? lang)
    {
        var es = lang is not null && lang.StartsWith("es", StringComparison.OrdinalIgnoreCase);

        var rows = await db.Database.SqlQuery<NutritionRow>($"""
            SELECT name_en AS "NameEn", name_es AS "NameEs",
                   serving_en AS "ServingEn", serving_es AS "ServingEs",
                   grams AS "Grams", ounces AS "Ounces",
                   calories AS "Calories", calories_from_fat AS "CaloriesFromFat",
                   fat_g AS "FatG", fat_dv AS "FatDv",
                   sodium_mg AS "SodiumMg", sodium_dv AS "SodiumDv",
                   potassium_mg AS "PotassiumMg", potassium_dv AS "PotassiumDv",
                   carbs_g AS "CarbsG", carbs_dv AS "CarbsDv",
                   fiber_g AS "FiberG", fiber_dv AS "FiberDv",
                   sugars_g AS "SugarsG", protein_g AS "ProteinG",
                   vitamin_a_dv AS "VitaminADv", vitamin_c_dv AS "VitaminCDv",
                   calcium_dv AS "CalciumDv", iron_dv AS "IronDv",
                   source AS "Source", source_url AS "SourceUrl",
                   position AS "Position"
            FROM vegetable_nutrition
            WHERE vegetable_code = {code}
            """).ToListAsync();

        Response.Headers.CacheControl = "public, max-age=300";
        return Ok(new
        {
            items = rows.OrderBy(r => r.Position).Select(r => new
            {
                name = es ? r.NameEs : r.NameEn,
                serving = es ? r.ServingEs : r.ServingEn,
                grams = r.Grams,
                ounces = r.Ounces,
                calories = r.Calories,
                caloriesFromFat = r.CaloriesFromFat,
                fatG = r.FatG,
                fatDv = r.FatDv,
                sodiumMg = r.SodiumMg,
                sodiumDv = r.SodiumDv,
                potassiumMg = r.PotassiumMg,
                potassiumDv = r.PotassiumDv,
                carbsG = r.CarbsG,
                carbsDv = r.CarbsDv,
                fiberG = r.FiberG,
                fiberDv = r.FiberDv,
                sugarsG = r.SugarsG,
                proteinG = r.ProteinG,
                vitaminADv = r.VitaminADv,
                vitaminCDv = r.VitaminCDv,
                calciumDv = r.CalciumDv,
                ironDv = r.IronDv,
                source = r.Source,
                sourceUrl = r.SourceUrl
            })
        });
    }
}