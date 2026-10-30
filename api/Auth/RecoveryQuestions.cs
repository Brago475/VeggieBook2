using System.Security.Cryptography;
using System.Text;

namespace VeggieBook.Api.Auth;

// Security questions. Ids are stored in app_user.security_question_id:
// never renumber or reuse an id; add new questions at the end.
public static class RecoveryQuestions
{
    public record Question(int Id, string Text);

    // Every question ever offered, retired ones included.
    public static readonly Question[] All =
    [
        new(1, "What is your favorite vegetable?"),
        new(2, "What food did you dislike as a kid?"),
        new(3, "What is your favorite dish to cook?"),
        new(4, "What was the first recipe you learned to make?"),
        new(5, "What fruit would you never eat?"),
        new(6, "What is your favorite snack?"),
        new(7, "What was the name of your first pet?"),
        new(8, "In what city were you born?"),
        new(9, "What was the name of your elementary school?"),
        new(10, "What was the first name of your best friend growing up?")
    ];

    // No longer offered, but still valid for accounts that already use them.
    private static readonly HashSet<int> RetiredIds = [2, 3, 4, 5];

    // Questions offered when setting a new PIN and question.
    public static readonly Question[] Active =
        All.Where(q => !RetiredIds.Contains(q.Id)).ToArray();

    public static bool Exists(int? id) => id is not null && All.Any(q => q.Id == id);

    public static bool IsSelectable(int? id) => id is not null && Active.Any(q => q.Id == id);

    public static Question Get(int id) => All.First(q => q.Id == id);

    // Fixed made-up question for an email with no account or no question set,
    // so forgot password can't reveal who has an account. Drawn from All,
    // retired included, so a retired question doesn't give an account away.
    public static Question StandIn(string email)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(email.Trim().ToUpperInvariant()));
        return All[hash[0] % All.Length];
    }
}