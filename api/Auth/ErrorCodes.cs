namespace VeggieBook.Api.Auth;

// Fixed codes for every message the main site can show. The site translates
// by code (web/src/i18n/strings/serverMessages.ts); the English text sent
// with each code is the fallback, and is what appears in logs.
//
// Every new message a user can see gets a code here. Never rename or reuse
// a code; add a new one instead. Admin-only messages need no code.

public static class ErrorCodes
{
    // Signing in, signing up, guests
    public const string AlreadySignedIn = "already_signed_in";
    public const string EmailInvalid = "email_invalid";
    public const string TermsRequired = "terms_required";
    public const string WrongCredentials = "wrong_credentials";
    public const string EmailTaken = "email_taken";
    public const string UsernameTakenSignUp = "username_taken_signup";
    public const string UsernameTaken = "username_taken";
    public const string TooManyAttempts = "too_many_attempts";
    public const string GuestsOff = "guests_off";

    // Names, username, age (SignUpRules). Name codes are built by Name():
    // first_name_empty, first_name_too_long, first_name_chars, and the same
    // for last_name.
    public const string UsernameRequired = "username_required";
    public const string UsernameLength = "username_length";
    public const string UsernameChars = "username_chars";
    public const string AgeRangeRequired = "age_range_required";

    // Passwords
    public const string PasswordRule = "password_rule";
    public const string PasswordTooLong = "password_too_long";
    public const string PasswordIncorrect = "password_incorrect";
    public const string CurrentPasswordIncorrect = "current_password_incorrect";
    public const string TooManyWrongPasswords = "too_many_wrong_passwords";
    public const string PasswordSame = "password_same";
    public const string TicketExpired = "ticket_expired";

    // Recovery PIN and security question
    public const string PinDigits = "pin_digits";
    public const string PinEasy = "pin_easy";
    public const string PinWrong = "pin_wrong";
    public const string PinMismatch = "pin_mismatch";
    public const string PinClosedForgot = "pin_closed_forgot";
    public const string PinClosedChange = "pin_closed_change";
    public const string QuestionRequired = "question_required";
    public const string AnswerEmpty = "answer_empty";
    public const string AnswerTooLong = "answer_too_long";
    public const string AnswerMismatch = "answer_mismatch";
    public const string RecoveryLocked = "recovery_locked";
    public const string ResetExpired = "reset_expired";

    // An error from ASP.NET Identity itself, sent with Identity's English text.
    public const string IdentityError = "identity_error";

    // "first name" + "empty" gives first_name_empty.
    public static string Name(string label, string problem) =>
        $"{label.Replace(' ', '_')}_{problem}";
}