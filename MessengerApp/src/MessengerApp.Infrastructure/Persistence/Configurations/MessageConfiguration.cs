using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MessengerApp.Infrastructure.Persistence.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Ciphertext)
            .IsRequired();

        builder.Property(m => m.EncryptedKey)
            .IsRequired();

        builder.Property(m => m.EncryptedKeyForSender)
            .IsRequired();

        builder.Property(m => m.Iv)
            .IsRequired();

        builder.Property(m => m.SentAt)
            .HasDefaultValueSql("NOW()");

        builder.HasOne(m => m.Conversation)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Composite index for efficient message loading by conversation, ordered by time
        builder.HasIndex(m => new { m.ConversationId, m.SentAt });
    }
}
