using MediatR;
using MessengerApp.Application.Common.Models;
using NBitcoin;

namespace MessengerApp.Application.Features.Auth.Queries.GenerateRecoveryPhrase;

public class GenerateRecoveryPhraseQueryHandler : IRequestHandler<GenerateRecoveryPhraseQuery, Result<string>>
{
    public Task<Result<string>> Handle(GenerateRecoveryPhraseQuery request, CancellationToken cancellationToken)
    {
        // Generate a 12-word recovery phrase using NBitcoin
        var mnemonic = new Mnemonic(Wordlist.French, WordCount.Twelve);
        var phrase = mnemonic.ToString();
        
        return Task.FromResult(Result<string>.Ok(phrase));
    }
}
