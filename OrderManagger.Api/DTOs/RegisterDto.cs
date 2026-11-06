using System.ComponentModel.DataAnnotations;

namespace OrderManager.Api.DTOs;

public class RegisterDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    // Optional: "Admin" or "Customer". Defaults to "Customer" if not provided.
    public string? Role { get; set; }
}