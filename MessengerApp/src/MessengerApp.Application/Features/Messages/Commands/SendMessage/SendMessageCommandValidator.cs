using FluentValidation;

namespace MessengerApp.Application.Features.Messages.Commands.SendMessage;

public class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.ConversationId)
            .NotEmpty().WithMessage("Conversation ID is required.");

        RuleFor(x => x.Ciphertext)
            .NotEmpty().WithMessage("Ciphertext is required.");

        RuleFor(x => x.EncryptedKey)
            .NotEmpty().WithMessage("Encrypted key is required.");

        RuleFor(x => x.Iv)
            .NotEmpty().WithMessage("Initialization vector is required.");
    }
}
