using FluentValidation;

namespace MessengerApp.Application.Features.Users.Commands.UpdateProfile;

public class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
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
    }
}
