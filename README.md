\# OrderManager



A full stack order management system built with \*\*.NET 10\*\* and \*\*React 19\*\*, featuring role-based access control (Admin/Customer), product catalog, shopping cart, and order lifecycle management.



\## 📺 Demo



\*Video demo coming soon.\*



\## 🎯 Features



\- 🔐 JWT authentication with role-based access control (Admin/Customer)

\- 👥 Two distinct user roles with different permissions

\- 📦 Product catalog with stock management

\- 🛒 Shopping cart for customers

\- 📋 Order creation with automatic stock decrement

\- 🔄 Order status workflow (Pending → Confirmed → Shipped → Delivered → Cancelled)

\- 🗑️ Soft-delete for products (preserves order history)

\- 📸 Snapshot of product name and price at purchase time

\- 🎨 Responsive UI with Tailwind CSS

\- 🛡️ Protected routes by authentication and role



\## 🛠️ Tech Stack



\### Backend

\- \*\*.NET 10\*\* (LTS)

\- \*\*ASP.NET Core Web API\*\*

\- \*\*Entity Framework Core 10\*\*

\- \*\*SQL Server (LocalDB)\*\*

\- \*\*JWT\*\* for authentication

\- \*\*BCrypt.Net\*\* for password hashing

\- \*\*Swashbuckle\*\* for API documentation



\### Frontend

\- \*\*React 19\*\*

\- \*\*TypeScript\*\*

\- \*\*Vite 8\*\*

\- \*\*React Router 7\*\*

\- \*\*Tailwind CSS 4\*\*

\- \*\*Axios\*\*



\## 🧠 Technical Decisions



This section explains \*\*why\*\* certain design choices were made. These are the decisions that differentiate a production-minded project from a tutorial clone.



\### 1. Role-Based Access Control (RBAC) with JWT Claims



Instead of storing roles in a separate table (which requires extra joins) or using ASP.NET Identity (which is heavier than needed), the role is stored as a simple string on the `User` entity (`"Admin"` or `"Customer"`). When generating the JWT, the role is added as a \*\*claim\*\* using `ClaimTypes.Role`. On the backend, endpoints are protected with `\[Authorize(Roles = "Admin")]`, which the framework validates automatically.



\*\*Trade-off:\*\* This is simpler than ASP.NET Identity, but it doesn't support fine-grained permissions or multi-tenancy. For a small-to-medium application, it's the right balance.



\### 2. Soft-Delete for Products (`IsActive` flag)



When an Admin deletes a product, it is \*\*not physically removed\*\* from the database. Instead, `IsActive` is set to `false`. This is critical because products are referenced by `OrderItems`. A hard delete would either:

\- Break foreign key constraints (with `Restrict`).

\- Cascade-delete order history (with `Cascade`), which is unacceptable in e-commerce.



The `GET /api/products` endpoint filters by `IsActive`, so customers never see deleted products, but order history remains intact.



\### 3. Snapshot of Product Data in `OrderItem`



Each `OrderItem` stores `ProductName` and `UnitPrice` at the time of purchase, in addition to the `ProductId` foreign key. This means that if an Admin later changes a product's name or price, \*\*historical orders remain unchanged\*\*. This is a common requirement in invoicing and order management systems: the customer should see what they bought, at the price they paid.



\### 4. Stock Validation and Decrement at Order Time



When a customer places an order, the backend:

1\. Validates that all referenced products exist.

2\. Checks that each product has enough stock.

3\. Decrements the stock atomically within the same transaction.

4\. Calculates the total from the current product prices.



This prevents overselling and ensures data consistency.



\### 5. Explicit DTOs for Order Creation



The `POST /api/orders` endpoint uses a dedicated `CreateOrderDto` instead of accepting the `Order` entity directly. This avoids over-posting (e.g., a client sending `Total` or `Status` fields) and keeps the API contract explicit.



\## 📁 Project Structure



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

&#x20;   ├── public/                      # Static assets

&#x20;   ├── src/

&#x20;   │   ├── assets/                  # Images and SVGs

&#x20;   │   ├── components/              # ProtectedRoute, AdminRoute

&#x20;   │   ├── context/                 # AuthContext

&#x20;   │   ├── pages/                   # Login, Register, Products, Orders, ProductForm

&#x20;   │   ├── services/                # API client (axios)

&#x20;   │   ├── types/                   # TypeScript types

&#x20;   │   ├── App.tsx                  # Root component with routes

&#x20;   │   ├── main.tsx                 # React entry point

&#x20;   │   └── index.css                # Tailwind CSS import

&#x20;   ├── index.html                   # HTML template

&#x20;   ├── package.json                 # Dependencies and scripts

&#x20;   ├── tsconfig.json                # TypeScript configuration

&#x20;   └── vite.config.ts               # Vite + Tailwind configuration

```



> \*\*Note:\*\* `bin/`, `obj/`, and `node\_modules/` are auto-generated and excluded from the repository via `.gitignore`.



\## 🚀 Getting Started



\### Prerequisites

\- \[.NET 10 SDK](https://dotnet.microsoft.com/download)

\- \[Node.js LTS](https://nodejs.org/)

\- SQL Server Express LocalDB (comes with Visual Studio)



\### Backend Setup



1\. Navigate to the backend folder:

&#x20;  ```bash

&#x20;  cd OrderManagger.Api

&#x20;  ```



2\. Apply database migrations:

&#x20;  ```bash

&#x20;  dotnet ef database update

&#x20;  ```



3\. Run the API:

&#x20;  ```bash

&#x20;  dotnet run

&#x20;  ```



4\. The API will be available at `https://localhost:7068`. Open Swagger at `https://localhost:7068/swagger`.



\### Frontend Setup



1\. Navigate to the frontend folder:

&#x20;  ```bash

&#x20;  cd ordermanager-client

&#x20;  ```



2\. Install dependencies:

&#x20;  ```bash

&#x20;  npm install

&#x20;  ```



3\. Run the development server:

&#x20;  ```bash

&#x20;  npm run dev

&#x20;  ```



4\. Open `http://localhost:5173` in your browser.



\## 📡 API Endpoints



\### Authentication

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/auth/register` | Register a new user (role: Admin or Customer) |

| POST | `/api/auth/login` | Login and receive a JWT |



\### Products

| Method | Endpoint | Role | Description |

|--------|----------|------|-------------|

| GET | `/api/products` | Any authenticated | List active products |

| GET | `/api/products/{id}` | Any authenticated | Get a product |

| POST | `/api/products` | Admin | Create a product |

| PUT | `/api/products/{id}` | Admin | Update a product |

| DELETE | `/api/products/{id}` | Admin | Soft-delete a product |



\### Orders

| Method | Endpoint | Role | Description |

|--------|----------|------|-------------|

| GET | `/api/orders` | Any authenticated | Admin sees all; Customer sees own |

| GET | `/api/orders/{id}` | Any authenticated | Admin sees any; Customer sees own |

| POST | `/api/orders` | Any authenticated | Create an order |

| PUT | `/api/orders/{id}/status` | Admin | Update order status |



\## 🔐 Authentication Flow



1\. User registers or logs in via the frontend.

2\. Backend validates credentials and returns a JWT containing the user's role.

3\. Frontend stores the JWT in `localStorage`.

4\. Axios interceptor attaches the JWT to every subsequent request.

5\. Backend validates the JWT and extracts the user id and role from claims.

6\. Protected endpoints check `\[Authorize]` for authentication and `\[Authorize(Roles = "Admin")]` for role-specific access.



\## 📄 License



This project is open source and available under the MIT License.

