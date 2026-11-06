using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderManager.Api.Data;
using OrderManager.Api.Models;

namespace OrderManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool IsAdmin =>
        User.IsInRole("Admin");

    /// <summary>
    /// Returns orders. Admin sees all orders; Customer sees only their own.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .AsQueryable();

        if (!IsAdmin)
            query = query.Where(o => o.UserId == CurrentUserId);

        return await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
    }

    /// <summary>
    /// Returns a single order by id. Admin can see any; Customer only their own.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetOrder(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();
        if (!IsAdmin && order.UserId != CurrentUserId) return NotFound();

        return order;
    }

    /// <summary>
    /// Creates a new order for the authenticated customer.
    /// Validates stock, decrements it, and calculates the total from current product prices.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            return BadRequest(new { message = "Order must contain at least one item." });

        // Load all referenced products in one query
        var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        if (products.Count != productIds.Count)
            return BadRequest(new { message = "One or more products do not exist." });

        var order = new Order
        {
            UserId = CurrentUserId,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        foreach (var itemDto in dto.Items)
        {
            var product = products.First(p => p.Id == itemDto.ProductId);

            if (itemDto.Quantity <= 0)
                return BadRequest(new { message = $"Quantity for product {product.Name} must be greater than zero." });

            if (product.Stock < itemDto.Quantity)
                return BadRequest(new { message = $"Not enough stock for product {product.Name}. Available: {product.Stock}." });

            product.Stock -= itemDto.Quantity;

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = itemDto.Quantity,
                UnitPrice = product.Price
            });
        }

        order.Total = order.Items.Sum(i => i.Quantity * i.UnitPrice);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    /// <summary>
    /// Updates an order's status. Admin-only.
    /// Valid statuses: Pending, Confirmed, Shipped, Delivered, Cancelled.
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateOrderStatusDto dto)
    {
        var validStatuses = new[] { "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled" };
        if (!validStatuses.Contains(dto.Status))
            return BadRequest(new { message = "Invalid status." });

        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.Status = dto.Status;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

// DTOs for order operations
public class CreateOrderDto
{
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

public class CreateOrderItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
}