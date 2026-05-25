using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MessengerApp.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.Property(u => u.FirstName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.LastName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(u => u.Pseudo)
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(u => u.Pseudo)
            .IsUnique();

        builder.Property(u => u.PublicKey)
            .IsRequired();

        builder.Property(u => u.RecoveryKeyHash);

        builder.Property(u => u.BirthDate)
            .IsRequired();

        builder.Property(u => u.CreatedAt)
            .HasDefaultValueSql("NOW()");
    }
}
