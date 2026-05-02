import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Pill, Menu, X, LogOut, LayoutDashboard, ShoppingCart, FileUp } from 'lucide-react';
import { Button } from './ui/button';
import type { User } from '../App';
import { useCart } from '../lib/cart';

interface NavbarProps {
  currentUser: User | null;
  onLogout?: () => void;
}

export default function Navbar({ currentUser, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    onLogout?.();
    navigate('/');
    setMobileOpen(false);
  };

  const navBtnBase =
    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150';
  const navInactive = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90';
  const navActive = 'bg-blue-50 text-blue-700 font-semibold shadow-sm shadow-blue-600/5';

  const outlineNavBtn =
    'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="flex items-center gap-2.5 rounded-xl py-1 pr-2 -ml-1 transition-opacity hover:opacity-90"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/25 ring-1 ring-blue-600/20">
              <Pill className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
              Pill<span className="text-blue-600">Point</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 rounded-xl bg-slate-100/60 p-1 border border-slate-200/60">
            {navLinks.map(link => (
              <button
                key={link.path}
                type="button"
                onClick={() => handleNav(link.path)}
                className={`${navBtnBase} ${isActive(link.path) ? navActive : navInactive}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate('/cart')}
              variant="outline"
              size="sm"
              className={`relative ${outlineNavBtn}`}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5 text-slate-600" />
              Cart
              {itemCount > 0 && (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                  {itemCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/search?upload=1')}
              variant="outline"
              size="sm"
              className={`${outlineNavBtn} hidden md:inline-flex`}
              title="Upload a prescription photo to find medicines"
            >
              <FileUp className="w-4 h-4 mr-1.5 text-slate-600" />
              Prescription
            </Button>
            {currentUser ? (
              <>
                <div className="text-right mr-1 hidden lg:block max-w-[9rem]">
                  <p className="text-sm font-medium text-slate-800 truncate">{currentUser.name}</p>
                  <p className="text-xs text-blue-600 capitalize font-medium">{currentUser.role}</p>
                </div>
                <Button
                  onClick={() => navigate(`/${currentUser.role}/dashboard`)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm" className={outlineNavBtn}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/auth/user')} variant="outline" size="sm" className={outlineNavBtn}>
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/auth/admin')}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400"
                >
                  Admin Login
                </Button>
                <Button
                  onClick={() => navigate('/auth/shopkeeper')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/25 font-semibold"
                >
                  For Pharmacy Stores
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50/95 backdrop-blur-sm shadow-inner">
          <div className="px-4 py-4 space-y-1 max-h-[min(70vh,28rem)] overflow-y-auto">
            {navLinks.map(link => (
              <button
                key={link.path}
                type="button"
                onClick={() => handleNav(link.path)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-white text-blue-700 font-semibold shadow-sm border border-blue-100'
                    : 'text-slate-700 hover:bg-white/80'
                }`}
              >
                {link.label}
              </button>
            ))}
            <Button
              onClick={() => handleNav('/cart')}
              variant="outline"
              className={`w-full mt-2 ${outlineNavBtn}`}
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2 text-slate-600" />
              Cart{itemCount > 0 ? ` (${itemCount})` : ''}
            </Button>
            <Button
              type="button"
              onClick={() => handleNav('/search?upload=1')}
              variant="outline"
              className={`w-full ${outlineNavBtn}`}
              size="sm"
            >
              <FileUp className="w-4 h-4 mr-2 text-slate-600" />
              Upload prescription
            </Button>
            <div className="pt-3 border-t border-slate-200 space-y-2 mt-2">
              {currentUser ? (
                <>
                  <div className="px-4 py-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-xs text-slate-500">Logged in as</p>
                    <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-blue-600 capitalize font-medium">{currentUser.role}</p>
                  </div>
                  <Button
                    onClick={() => { navigate(`/${currentUser.role}/dashboard`); setMobileOpen(false); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                    size="sm"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                  <Button onClick={handleLogout} variant="outline" className={`w-full ${outlineNavBtn}`} size="sm">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => handleNav('/auth/user')} variant="outline" className={`w-full ${outlineNavBtn}`} size="sm">
                    Sign In as Customer
                  </Button>
                  <Button onClick={() => handleNav('/auth/shopkeeper')} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm" size="sm">
                    Register Your Pharmacy
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleNav('/auth/admin')}
                    className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-800 py-2.5 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    Admin Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
