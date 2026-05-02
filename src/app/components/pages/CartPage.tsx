import { useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Minus, Plus, ShoppingCart, Trash2, Phone, Navigation } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import Navbar from '../Navbar';
import type { User } from '../../App';
import { useCart } from '../../lib/cart';

interface CartPageProps {
  currentUser: User | null;
  onLogout?: () => void;
}

export default function CartPage({ currentUser, onLogout }: CartPageProps) {
  const navigate = useNavigate();
  const { items, itemCount, updateQuantity, removeItem, clearCart } = useCart();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasItems = items.length > 0;

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleDirections = (pharmacyName: string, address: string) => {
    const query = encodeURIComponent(`${pharmacyName} ${address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              Cart
            </h1>
            <p className="text-sm text-gray-500">
              {hasItems ? `${itemCount} units in your cart` : 'Your cart is empty'}
            </p>
          </div>

          {hasItems && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate('/search')}>
                Continue Shopping
              </Button>
              <Button variant="outline" onClick={clearCart} className="border-red-200 text-red-700 hover:bg-red-50">
                Clear Cart
              </Button>
            </div>
          )}
        </div>

        {hasItems ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4 border-0 shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border">
                      {item.medicineImage ? (
                        <ImageWithFallback src={item.medicineImage} alt={item.medicineName} className="w-full h-full object-cover" />
                      ) : item.shopImage ? (
                        <ImageWithFallback src={item.shopImage} alt={item.pharmacyName} className="w-full h-full object-cover" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="font-semibold text-gray-900 truncate">{item.medicineName}</h2>
                          <p className="text-sm text-gray-500 truncate">{item.pharmacyName}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-green-700">₹{item.price}</p>
                          <Badge className={item.inStock ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => (item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1))}
                            className="h-9 w-9 inline-flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-9 w-9 inline-flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm text-gray-500">
                          Line total: <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                        </p>

                        <div className="ml-auto flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleCall(item.phone)}>
                            <Phone className="w-4 h-4 mr-1.5" />
                            Call
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDirections(item.pharmacyName, item.address)}>
                            <Navigation className="w-4 h-4 mr-1.5" />
                            Directions
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-5 border-0 shadow-sm h-fit lg:sticky lg:top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Medicines</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Total units</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>₹{subtotal}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Cart is stored on this device. Please confirm availability before visiting the pharmacy.
                </p>
              </div>

              <Button className="w-full mt-4" onClick={() => navigate('/search')}>
                Continue Shopping
              </Button>
              <Button variant="outline" className="w-full mt-2" onClick={clearCart}>
                Clear Cart
              </Button>
            </Card>
          </div>
        ) : (
          <Card className="p-10 text-center border-0 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No items in your cart</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Search medicines, add them from the results page, and view everything here before visiting the pharmacy.
            </p>
            <Button className="mt-5" onClick={() => navigate('/search')}>
              Search Medicines
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}