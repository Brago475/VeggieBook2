using Microsoft.AspNetCore.Identity;
using VeggieBook.Api.Data;

namespace VeggieBook.Api.Auth;

// The rules for the recovery PIN and the security question.
//
// Forgot password has two steps, each with 3 wrong tries a day:
//   1. The 6-digit PIN. After 3 wrong PINs, that step closes for the day and
//      the user answers their security question instead.
//   2. The security question. After 3 wrong answers, password reset is
//      locked for the account until the admin unlocks it.
//
// The lock only stops password reset. Signing in with the password still
// works, so a stranger guessing wrong can't lock anyone out of their account.
//
// The PIN and the answer are hashed with Identity's password hasher, the
// same way as the password, so the database never holds them in plain text.
public class AccountRecovery(IPasswordHasher<AppUser> hasher)
{
    public const int MaxTries = 3;
    public const int MaxAnswerLength = 100;
    public static readonly TimeSpan TryWindow = TimeSpan.FromDays(1);

    public const string LockedMessage =
        "Password reset is locked for this account. Please contact the VeggieBook admin.";

    public static bool IsLocked(AppUser user) => user.RecoveryLockedAt is not null;

    // Checks a new PIN when it is being set.
    public static string? CheckNewPin(string? pin)
    {
        if (pin is null || pin.Length != 6 || !pin.All(char.IsAsciiDigit))
            return "Your PIN must be exactly 6 digits.";
        if (pin.Distinct().Count() == 1
            || "0123456789".Contains(pin)
            || "9876543210".Contains(pin))
            return "That PIN is too easy to guess. Please pick another one.";
        return null;
    }

    // Checks a new question and answer when they are being set.
    public static string? CheckNewAnswer(int? questionId, string? answer)
    {
        if (!RecoveryQuestions.Exists(questionId))
            return "Please choose a security question.";
        if (answer is not null && answer.Length > MaxAnswerLength * 2)
            return $"Your answer must be at most {MaxAnswerLength} characters.";
        var normalized = Normalize(answer);
        if (normalized.Length == 0)
            return "Please answer your security question.";
        if (normalized.Length > MaxAnswerLength)
            return $"Your answer must be at most {MaxAnswerLength} characters.";
        return null;
    }

    // "  Sweet   Potato " and "sweet potato" count as the same answer.
    public static string Normalize(string? answer) =>
        string.Join(' ', (answer ?? "").Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
              .ToLowerInvariant();

    // Saves a new PIN, question, and answer, and clears every wrong try and
    // the lock. Call users.UpdateAsync afterward to save it.
    public void SetRecovery(AppUser user, string pin, int questionId, string answer)
    {
        user.RecoveryPinHash = hasher.HashPassword(user, pin);
        user.SecurityQuestionId = questionId;
        user.SecurityAnswerHash = hasher.HashPassword(user, Normalize(answer));
        ClearTries(user);
    }

    public static void ClearTries(AppUser user)
    {
        user.PinFailedCount = 0;
        user.PinFailWindowStart = null;
        user.AnswerFailedCount = 0;
        user.AnswerFailWindowStart = null;
        user.RecoveryLockedAt = null;
    }

    public bool PinMatches(AppUser user, string? pin)
    {
        if (user.RecoveryPinHash is null || pin is null || pin.Length != 6)
        {
            BurnTime();
            return false;
        }
        return hasher.VerifyHashedPassword(user, user.RecoveryPinHash, pin)
            != PasswordVerificationResult.Failed;
    }

    public bool AnswerMatches(AppUser user, string? answer)
    {
        if (user.SecurityAnswerHash is null || answer is null || answer.Length > MaxAnswerLength * 2)
        {
            BurnTime();
            return false;
        }
        return hasher.VerifyHashedPassword(user, user.SecurityAnswerHash, Normalize(answer))
            != PasswordVerificationResult.Failed;
    }

    // Takes about as long as a real check. Used when there is nothing to
    // check, so the response time can't tell anyone whether an account exists.
    public void BurnTime() => hasher.HashPassword(new AppUser(), "000000");

    public static bool PinTriesUsedUp(AppUser user, DateTime now) =>
        TriesUsed(user.PinFailedCount, user.PinFailWindowStart, now) >= MaxTries;

    public static void RecordPinFailure(AppUser user, DateTime now)
    {
        if (TriesUsed(user.PinFailedCount, user.PinFailWindowStart, now) == 0)
        {
            user.PinFailWindowStart = now;
            user.PinFailedCount = 1;
        }
        else
        {
            user.PinFailedCount++;
        }
    }

    // Records a wrong answer. The third one in a day locks password reset.
    public static void RecordAnswerFailure(AppUser user, DateTime now)
    {
        if (TriesUsed(user.AnswerFailedCount, user.AnswerFailWindowStart, now) == 0)
        {
            user.AnswerFailWindowStart = now;
            user.AnswerFailedCount = 1;
        }
        else
        {
            user.AnswerFailedCount++;
        }

        if (user.AnswerFailedCount >= MaxTries)
            user.RecoveryLockedAt = now;
    }

    // Wrong tries count only within 24 hours of the first one.
    private static int TriesUsed(int count, DateTime? windowStart, DateTime now) =>
        windowStart is null || now - windowStart.Value >= TryWindow ? 0 : count;
}