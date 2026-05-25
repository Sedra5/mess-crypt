using FluentValidation;

namespace MessengerApp.Application.Features.Auth.Commands.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters.");

        RuleFor(x => x.Pseudo)
            .NotEmpty().WithMessage("Pseudo is required.")
            .MinimumLength(3).WithMessage("Pseudo must be at least 3 characters.")
            .MaximumLength(50).WithMessage("Pseudo must not exceed 50 characters.")
            .Matches("^[a-zA-Z0-9_.-]+$").WithMessage("Pseudo can only contain letters, digits, underscores, dots, and hyphens.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters.");

        RuleFor(x => x.BirthDate)
            .NotEmpty().WithMessage("Birth date is required.")
            .Must(BeAtLeast13YearsOld).WithMessage("User must be at least 13 years old.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character.");

        RuleFor(x => x.PublicKey)
            .NotEmpty().WithMessage("Public key is required.")
            .Must(BeValidBase64Jwk).WithMessage("Public key must be a valid base64-encoded JWK.");

        RuleFor(x => x.EncryptedPrivateKey)
            .NotEmpty().WithMessage("Encrypted private key is required.");
    }

    private static bool BeValidBase64Jwk(string publicKeyBase64)
    {
        if (string.IsNullOrWhiteSpace(publicKeyBase64)) return false;
        try
        {
            var bytes = Convert.FromBase64String(publicKeyBase64);
            var json = System.Text.Encoding.UTF8.GetString(bytes);
            return json.Contains("\"kty\"") && json.Contains("\"n\"") && json.Contains("\"e\"");
        }
        catch
        {
            return false;
        }
    }

    private static bool BeAtLeast13YearsOld(DateOnly birthDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - birthDate.Year;
        if (birthDate > today.AddYears(-age)) age--;
        return age >= 13;
    }
}
