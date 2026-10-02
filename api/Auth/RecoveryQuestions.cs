using System.Security.Cryptography;
using System.Text;

namespace VeggieBook.Api.Auth;

// The security questions a user can pick from. They are about food on
// purpose: none of them ask for personal data, which matches the Terms.
//
// The ids are stored in app_user.security_question_id, so never renumber or
// reuse an id. To change the list, only add new ones at the end.
public static class RecoveryQuestions
{
    public record Question(int Id, string Text);

    public static readonly Question[] All =
    [
        new(1, "What is your favorite vegetable?"),
        new(2, "What food did you dislike as a kid?"),
        new(3, "What is your favorite dish to cook?"),
        new(4, "What was the first recipe you learned to make?"),
        new(5, "What fruit would you never eat?"),
        new(6, "What is your favorite snack?")
    ];

    public static bool Exists(int? id) => id is not null && All.Any(q => q.Id == id);

    public static Question Get(int id) => All.First(q => q.Id == id);

    // For an email with no account, or an account with no question set:
    // always the same made-up question for that email. So the forgot
    // password page can't be used to check who has an account.
    public static Question StandIn(string email)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(email.Trim().ToUpperInvariant()));
        return All[hash[0] % All.Length];
    }
}