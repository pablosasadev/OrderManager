import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';
import { productService, orderService } from '../services/api';

interface CartItem {
  product: Product;
  quantity: number;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState('');
  const { user, isAdmin, isCustomer, logout } = useAuth();
  const navigate = useNavigate();

  const loadProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    try {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      await orderService.create({ items });
      setCart([]);
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to place order.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;

    try {
      await productService.delete(id);
      loadProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <p className="text-green-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white shadow border-b-4 border-green-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-800">OrderManager</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.fullName} ({user?.role})
            </span>
            {isAdmin && (
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-green-700 hover:underline"
              >
                All Orders
              </button>
            )}
            {isCustomer && (
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-green-700 hover:underline"
              >
                My Orders
              </button>
            )}
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {isAdmin && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/products/new')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + New Product
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded-lg shadow border border-green-100 hover:shadow-green-200 hover:shadow-lg transition-shadow flex flex-col h-full"
            >
              <h3 className="font-bold text-lg text-green-800">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2 flex-1">
                {product.description || '\u00A0'}
              </p>
              <p className="text-green-700 font-bold text-xl">
                ${product.price.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Stock: {product.stock}
              </p>

              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/products/edit/${product.id}`)}
                    className="text-sm text-green-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}

              {isCustomer && (
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              )}
            </div>
          ))}
        </div>

        {isCustomer && cart.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow border border-green-200">
            <h2 className="text-xl font-bold mb-4 text-green-800">Cart</h2>
            <ul className="space-y-2 mb-4">
              {cart.map((item) => (
                <li
                  key={item.product.id}
                  className="flex justify-between items-center"
                >
                  <span>
                    {item.product.name} × {item.quantity} = $
                    {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center border-t pt-4">
              <span className="font-bold text-green-800">
                Total: ${cartTotal.toFixed(2)}
              </span>
              <button
                onClick={placeOrder}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}