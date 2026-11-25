namespace VeggieBook.Api.SuperTracker;

// Daily plan for a profile. The calorie estimate is ported from the USDA
// SuperTracker procedure Profile_Plan_Values_Calorie_Plan_Calculate_ID and
// its Physical_Activity_Coefficients table (April 2018 source). Food group
// servings and protein grams follow the Dietary Guidelines, 2025-2030.

public sealed record PlanResult(
    int EstimatedCalories,
    int Calories,
    bool FromGoal,
    ServingsRow Servings,
    int ProteinGramsMin,
    int ProteinGramsMax,
    int SaturatedFatGramsMax);

public static class CaloriePlan
{
    public const int SodiumMgMax = 2300;
    public const int ActivityMinutesPerWeek = 150;

    // Coefficients by activity level: sedentary, moderate, active.
    private static readonly decimal[] AdultFemale = [1.00m, 1.14m, 1.27m];
    private static readonly decimal[] AdultMale = [1.00m, 1.12m, 1.27m];
    private static readonly decimal[] TeenFemale = [1.00m, 1.16m, 1.31m];
    private static readonly decimal[] TeenMale = [1.00m, 1.13m, 1.26m];

    public static PlanResult Build(St2Profile p)
    {
        var estimated = Estimate(p);
        int calories = p.CalorieGoal is short goal ? goal : estimated;

        return new PlanResult(
            EstimatedCalories: estimated,
            Calories: calories,
            FromGoal: p.CalorieGoal is not null,
            Servings: DailyServings.ForCalories(calories),
            ProteinGramsMin: (int)Math.Round(p.WeightKg * 1.2m),
            ProteinGramsMax: (int)Math.Round(p.WeightKg * 1.6m),
            SaturatedFatGramsMax: (int)Math.Floor(calories * 0.10m / 9m));
    }

    // Estimated energy requirement. Height is in meters in the formula.
    public static int Estimate(St2Profile p)
    {
        var level = Math.Max(0, Array.IndexOf(SuperTrackerRules.Activities, p.Activity));
        var female = p.Sex == "female";
        var kg = p.WeightKg;
        var m = p.HeightCm / 100m;
        decimal cal;

        if (p.Age >= 19)
        {
            var c = (female ? AdultFemale : AdultMale)[level];
            cal = female
                ? 387m - 7.31m * p.Age + c * (10.9m * kg + 660.7m * m)
                : 864m - 9.72m * p.Age + c * (14.2m * kg + 503m * m);
        }
        else
        {
            var c = (female ? TeenFemale : TeenMale)[level];
            cal = female
                ? 135.3m - 30.8m * p.Age + c * (10.0m * kg + 934m * m) + 25m
                : 88.5m - 61.9m * p.Age + c * (26.7m * kg + 903m * m) + 25m;
        }

        // The original stores the result as an integer, dropping the decimals.
        return (int)Math.Truncate(cal);
    }
}