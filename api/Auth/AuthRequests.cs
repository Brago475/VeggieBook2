namespace VeggieBook.Api.Auth;

// Request and response shapes for the account endpoints. Every field is
// nullable so a missing field becomes a clear error message instead of a
// framework error.

// Sign in. KeepGuestBooks only matters when a guest is signing in: true
// moves the guest's books into the account, false or missing starts fresh
// and deletes them.
public record CredentialsRequest(string? Email, string? Password, bool? KeepGuestBooks);

// Create Account. DisplayName is the username; left blank, one is made up.
// KeepGuestBooks works the same as on sign in.
public record RegisterRequest(
    string? FirstName,
    string? LastName,
    string? DisplayName,
    string? Email,
    string? Password,
    string? AgeRange,
    string? Pin,
    int? QuestionId,
    string? Answer,
    bool? AgreeToTerms,
    bool? KeepGuestBooks);

public record EmailRequest(string? Email);
public record ConfirmEmailRequest(string? UserId, string? Token);
public record ChangePasswordRequest(string? CurrentPassword, string? NewPassword);
public record DeleteAccountRequest(string? Password);

// Account recovery. See RecoveryController.
public record RecoveryPinRequest(string? Email, string? Pin);
public record RecoveryAnswerRequest(string? Email, string? Answer);

// Finishing a reset sets everything new: password, PIN, and question.
public record RecoveryResetRequest(
    string? Email,
    string? Ticket,
    string? NewPassword,
    string? NewPin,
    int? QuestionId,
    string? Answer);

// Setting or changing the PIN and question while signed in.
public record RecoverySettingsRequest(
    string? CurrentPassword,
    string? Pin,
    int? QuestionId,
    string? Answer);

public record RecoverySettingsResponse(bool HasPin, int? QuestionId, string? Question);

// What the site needs to know about the visitor.
//   Nobody signed in: Email null, Roles empty.
//   Guest:            Email null, Roles ["Guest"].
//   Account:          Email set,  Roles ["User"] or ["User", "Admin"],
//                     and the username, if the account has one.
public record MeResponse(string? Email, string[] Roles, string? DisplayName = null);