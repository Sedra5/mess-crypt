using MediatR;
using MessengerApp.Application.Common.Models;

namespace MessengerApp.Application.Features.Auth.Queries.GenerateRecoveryPhrase;

public record GenerateRecoveryPhraseQuery : IRequest<Result<string>>;
