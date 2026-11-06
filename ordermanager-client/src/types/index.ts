// User data returned by the API after authentication
export interface User {
  email: string;
  fullName: string;
  role: 'Admin' | 'Customer';
}

// Response body from /api/auth/login and /api/auth/register
export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Customer';
  expiresAt: string;
}

// Product entity
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

// Payload for creating or updating a product
export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

// Order item as returned by the API
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

// Order entity
export interface Order {
  id: number;
  userId: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  createdAt: string;
  items: OrderItem[];
}

// Payload for creating an order
export interface OrderInput {
  items: { productId: number; quantity: number }[];
}