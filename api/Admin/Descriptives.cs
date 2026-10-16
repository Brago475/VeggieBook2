namespace VeggieBook.Api.Admin;

// Descriptive statistics for one variable: N, mean, median, standard
// deviation, minimum, and maximum. Used by Analytics now, and by Reports
// and the SPSS screens later.
//
// The standard deviation is the sample standard deviation (divides by
// N - 1), which is what SPSS reports. It is null when N is below 2, since
// it is not defined there. Every value is rounded to 2 decimals.
//
// Only descriptive statistics live here. Tests such as p-values or
// Cronbach's alpha depend on a study's design, so they are added per study
// when one defines them.

public static class Descriptives
{
    public record Summary(
        string Variable,
        int N,
        double? Mean,
        double? Median,
        double? Sd,
        double? Min,
        double? Max);

    public static Summary Of(string variable, IEnumerable<double> values)
    {
        var v = values.OrderBy(x => x).ToArray();
        var n = v.Length;
        if (n == 0) return new Summary(variable, 0, null, null, null, null, null);

        var mean = v.Average();
        var median = n % 2 == 1 ? v[n / 2] : (v[n / 2 - 1] + v[n / 2]) / 2.0;
        double? sd = n > 1
            ? Math.Sqrt(v.Sum(x => (x - mean) * (x - mean)) / (n - 1))
            : null;

        return new Summary(
            variable,
            n,
            Round(mean),
            Round(median),
            sd is null ? null : Round(sd.Value),
            v[0],
            v[^1]);
    }

    private static double Round(double x) => Math.Round(x, 2);
}