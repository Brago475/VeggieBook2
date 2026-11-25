namespace VeggieBook.Api.SuperTracker;

// Terms version and the limits for setup answers. The limits match the
// CHECK rules in db/migrations/032 and 033.

public static class SuperTrackerRules
{
    // Raise when the SuperTracker2 Terms change; everyone accepts again.
    public const string TermsVersion = "1.0";

    // Off until the Terms wording is final. When on, the profile can be
    // saved only after the current Terms are accepted.
    public static readonly bool RequireTerms = false;

    public const int MinAge = 18;
    public const int MaxAge = 120;
    public const decimal MinHeightCm = 100m;
    public const decimal MaxHeightCm = 250m;
    public const decimal MinWeightKg = 30m;
    public const decimal MaxWeightKg = 350m;
    public const int MinCalorieGoal = 1000;
    public const int MaxCalorieGoal = 5000;

    // sedentary, moderate and active are shown as Light, Moderate and Very active.
    public static readonly string[] Sexes = ["female", "male"];
    public static readonly string[] Activities = ["sedentary", "moderate", "active"];
    public static readonly string[] Units = ["us", "metric"];

    // Returns the first field that fails, or null when all are valid.
    public static string? InvalidField(ProfileRequest r)
    {
        if (r.Age is not int age || age < MinAge || age > MaxAge) return "age";
        if (r.Sex is null || !Sexes.Contains(r.Sex)) return "sex";
        if (r.HeightCm is not decimal h || h < MinHeightCm || h > MaxHeightCm) return "height";
        if (r.WeightKg is not decimal w || w < MinWeightKg || w > MaxWeightKg) return "weight";
        if (r.Activity is null || !Activities.Contains(r.Activity)) return "activity";
        if (r.Units is not null && !Units.Contains(r.Units)) return "units";
        if (r.CalorieGoal is int c && (c < MinCalorieGoal || c > MaxCalorieGoal)) return "calorieGoal";
        return null;
    }
}