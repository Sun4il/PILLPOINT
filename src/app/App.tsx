import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useState } from 'react';
import LandingPage from './components/pages/LandingPage';
import UserDashboard from './components/pages/UserDashboard';
import ShopkeeperDashboard from './components/pages/ShopkeeperDashboard';
import AdminDashboard from './components/pages/AdminDashboard';
import AuthPage from './components/pages/AuthPage';
import SearchResults from './components/pages/SearchResults';
import CartPage from './components/pages/CartPage';
import AboutPage from './components/pages/AboutPage';
import ServicesPage from './components/pages/ServicesPage';
import ContactPage from './components/pages/ContactPage';
import { Toaster } from './components/ui/sonner';
import { CartProvider } from './lib/cart';

export type UserRole = 'user' | 'shopkeeper' | 'admin' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  shopId?: string | null;
  shopName?: string;
  shopAddress?: string;
  license?: string;
  openTime?: string;
  closeTime?: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="size-full bg-gray-50">
          <Routes>
            <Route
              path="/"
              element={<LandingPage currentUser={currentUser} onLogout={handleLogout} />}
            />
            <Route
              path="/about"
              element={<AboutPage currentUser={currentUser} onLogout={handleLogout} />}
            />
            <Route
              path="/services"
              element={<ServicesPage currentUser={currentUser} onLogout={handleLogout} />}
            />
            <Route
              path="/contact"
              element={<ContactPage currentUser={currentUser} onLogout={handleLogout} />}
            />
            <Route
              path="/auth/:role"
              element={<AuthPage setCurrentUser={setCurrentUser} />}
            />
            <Route
              path="/search"
              element={<SearchResults currentUser={currentUser} onLogout={handleLogout} />}
            />
            <Route
              path="/cart"
              element={<CartPage currentUser={currentUser} onLogout={handleLogout} />}
            />
            <Route
              path="/user/dashboard"
              element={
                currentUser?.role === 'user' ? (
                  <UserDashboard currentUser={currentUser} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/auth/user" replace />
                )
              }
            />
            <Route
              path="/shopkeeper/dashboard"
              element={
                currentUser?.role === 'shopkeeper' ? (
                  <ShopkeeperDashboard currentUser={currentUser} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/auth/shopkeeper" replace />
                )
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                currentUser?.role === 'admin' ? (
                  <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
                ) : (
                  <Navigate to="/auth/admin" replace />
                )
              }
            />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}
