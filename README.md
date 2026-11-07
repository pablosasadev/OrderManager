# OrderManager

A full stack order management system built with **.NET 10** and **React 19**, featuring role-based access control (Admin/Customer), product catalog, shopping cart, and order lifecycle management.

## 📺 Demo

[![OrderManager Demo](https://img.youtube.com/vi/ApjZyjBS254/maxresdefault.jpg)](https://www.youtube.com/watch?v=ApjZyjBS254)

*Click the image to watch a 2-minute demo of the application.*

## 🎯 Features

- 🔐 JWT authentication with role-based access control (Admin/Customer)
- 👥 Two distinct user roles with different permissions
- 📦 Product catalog with stock management
- 🛒 Shopping cart for customers
- 📋 Order creation with automatic stock decrement
- 🔄 Order status workflow (Pending → Confirmed → Shipped → Delivered → Cancelled)
- 🗑️ Soft-delete for products (preserves order history)
- 📸 Snapshot of product name and price at purchase time
- 🎨 Responsive UI with Tailwind CSS
- 🛡️ Protected routes by authentication and role

## 🛠️ Tech Stack

### Backend
- **.NET 10** (LTS)
- **ASP.NET Core Web API**
- **Entity Framework Core 10**
- **SQL Server (LocalDB)**
- **JWT** for authentication
- **BCrypt.Net** for password hashing
- **Swashbuckle** for API documentation

### Frontend
- **React 19**
- **TypeScript**
- **Vite 8**
- **React Router 7**
- **Tailwind CSS 4**
- **Axios**

## 🧠 Technical Decisions

This section explains **why** certain design choices were made. These are the decisions that differentiate a production-minded project from a tutorial clone.

### 1. Role-Based Access Control (RBAC) with JWT Claims

Instead of storing roles in a separate table (which requires extra joins) or using ASP.NET Identity (which is heavier than needed), the role is stored as a simple string on the `User` entity (`"Admin"` or `"Customer"`). When generating the JWT, the role is added as a **claim** using `ClaimTypes.Role`. On the backend, endpoints are protected with `[Authorize(Roles = "Admin")]`, which the framework validates automatically.

**Trade-off:** This is simpler than ASP.NET Identity, but it doesn't support fine-grained permissions or multi-tenancy. For a small-to-medium application, it's the right balance.

### 2. Soft-Delete for Products (`IsActive` flag)

When an Admin deletes a product, it is **not physically removed** from the database. Instead, `IsActive` is set to `false`. This is critical because products are referenced by `OrderItems`. A hard delete would either:
- Break foreign key constraints (with `Restrict`).
- Cascade-delete order history (with `Cascade`), which is unacceptable in e-commerce.

The `GET /api/products` endpoint filters by `IsActive`, so customers never see deleted products, but order history remains intact.

### 3. Snapshot of Product Data in `OrderItem`

Each `OrderItem` stores `ProductName` and `UnitPrice` at the time of purchase, in addition to the `ProductId` foreign key. This means that if an Admin later changes a product's name or price, **historical orders remain unchanged**. This is a common requirement in invoicing and order management systems: the customer should see what they bought, at the price they paid.

### 4. Stock Validation and Decrement at Order Time

When a customer places an order, the backend:
1. Validates that all referenced products exist.
2. Checks that each product has enough stock.
3. Decrements the stock atomically within the same transaction.
4. Calculates the total from the current product prices.

This prevents overselling and ensures data consistency.

### 5. Explicit DTOs for Order Creation

The `POST /api/orders` endpoint uses a dedicated `CreateOrderDto` instead of accepting the `Order` entity directly. This avoids over-posting (e.g., a client sending `Total` or `Status` fields) and keeps the API contract explicit.

## 📁 Project Structure

```
OrderManager/
├── OrderManagger.Api/               # Backend (.NET 10 Web API)
│   ├── Controllers/                 # API endpoints (Auth, Products, Orders)
│   ├── Data/                        # EF Core DbContext
│   ├── DTOs/                        # Data Transfer Objects
│   ├── Migrations/                  # EF Core migrations
│   ├── Models/                      # Domain entities (User, Product, Order, OrderItem)
│   ├── Properties/                  # Launch settings
│   ├── Services/                    # JWT token generation
│   ├── Program.cs                   # Application entry point
│   ├── appsettings.json             # Configuration
│   └── OrderManagger.Api.csproj     # Project file
└── ordermanager-client/             # Frontend (React + TypeScript)
    ├── public/                      # Static assets
    ├── src/
    │   ├── assets/                  # Images and SVGs
    │   ├── components/              # ProtectedRoute, AdminRoute
    │   ├── context/                 # AuthContext
    │   ├── pages/                   # Login, Register, Products, Orders, ProductForm
    │   ├── services/                # API client (axios)
    │   ├── types/                   # TypeScript types
    │   ├── App.tsx                  # Root component with routes
    │   ├── main.tsx                 # React entry point
    │   └── index.css                # Tailwind CSS import
    ├── index.html                   # HTML template
    ├── package.json                 # Dependencies and scripts
    ├── tsconfig.json                # TypeScript configuration
    └── vite.config.ts               # Vite + Tailwind configuration
```

> **Note:** `bin/`, `obj/`, and `node_modules/` are auto-generated and excluded from the repository via `.gitignore`.

## 🚀 Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js LTS](https://nodejs.org/)
- SQL Server Express LocalDB (comes with Visual Studio)

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd OrderManagger.Api
   ```

2. Apply database migrations:
   ```bash
   dotnet ef database update
   ```

3. Run the API:
   ```bash
   dotnet run
   ```

4. The API will be available at `https://localhost:7068`. Open Swagger at `https://localhost:7068/swagger`.

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd ordermanager-client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## 📡 API Endpoints

### Authentication

- **POST** `/api/auth/register` — Register a new user (role: Admin or Customer)
- **POST** `/api/auth/login` — Login and receive a JWT

### Products

- **GET** `/api/products` — Any authenticated user. List active products.
- **GET** `/api/products/{id}` — Any authenticated user. Get a product.
- **POST** `/api/products` — Admin only. Create a product.
- **PUT** `/api/products/{id}` — Admin only. Update a product.
- **DELETE** `/api/products/{id}` — Admin only. Soft-delete a product.

### Orders

- **GET** `/api/orders` — Any authenticated user. Admin sees all; Customer sees own.
- **GET** `/api/orders/{id}` — Any authenticated user. Admin sees any; Customer sees own.
- **POST** `/api/orders` — Any authenticated user. Create an order.
- **PUT** `/api/orders/{id}/status` — Admin only. Update order status.

## 🔐 Authentication Flow

1. User registers or logs in via the frontend.
2. Backend validates credentials and returns a JWT containing the user's role.
3. Frontend stores the JWT in `localStorage`.
4. Axios interceptor attaches the JWT to every subsequent request.
5. Backend validates the JWT and extracts the user id and role from claims.
6. Protected endpoints check `[Authorize]` for authentication and `[Authorize(Roles = "Admin")]` for role-specific access.

## 📄 License

This project is open source and available under the MIT License.