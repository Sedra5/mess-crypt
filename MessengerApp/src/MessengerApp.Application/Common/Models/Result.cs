namespace MessengerApp.Application.Common.Models;

public class Result<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Error { get; init; }
    public IDictionary<string, string[]>? ValidationErrors { get; init; }

    public static Result<T> Ok(T data) => new() { Success = true, Data = data };

    public static Result<T> Fail(string error) => new() { Success = false, Error = error };

    public static Result<T> ValidationFail(IDictionary<string, string[]> errors) =>
        new() { Success = false, Error = "Validation failed.", ValidationErrors = errors };
}
