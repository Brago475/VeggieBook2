namespace VeggieBook.Api.Auth;

// A message the main site can show: a fixed code (ErrorCodes) and the
// English text. Body() is the JSON sent back: { code, error }, plus values
// for a message that includes a number, and status for the answers the
// site reacts to (locked, pinClosed).

public sealed record ApiError(string Code, string Message)
{
    public object? Values { get; init; }
    public string? Status { get; init; }

    public Dictionary<string, object> Body()
    {
        var body = new Dictionary<string, object> { ["code"] = Code, ["error"] = Message };
        if (Values is not null) body["values"] = Values;
        if (Status is not null) body["status"] = Status;
        return body;
    }
}