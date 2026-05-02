import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Pill, MapPin, Upload, Star, Shield, ChevronRight,
  Zap, Clock, CheckCircle, Phone, TrendingUp, Users
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import Navbar from '../Navbar';
import type { User } from '../../App';

interface LandingPageProps {
  currentUser: User | null;
  onLogout?: () => void;
}

const PHARMACY_IMG = 'https://images.unsplash.com/photo-1617461122868-404045518939?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';
const MEDICINE_IMG = 'https://images.unsplash.com/photo-1659019480504-ed06c5cf2bab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';
const HERO_IMG = 'https://images.unsplash.com/photo-1700019704809-d764d5ba2bc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

export default function LandingPage({ currentUser, onLogout }: LandingPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : '/search');
  };

  const popularSearches = ['Paracetamol', 'Azithromycin', 'Cetirizine', 'Amoxicillin', 'Omeprazole', 'Metformin'];

  const features = [
    {
      icon: <MapPin className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-100',
      title: 'Nearest Pharmacies',
      desc: 'Locate verified pharmacies near you on an interactive map with real-time availability',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      bg: 'bg-green-100',
      title: 'Price Comparison',
      desc: 'Compare medicine prices across stores nationwide and find the most affordable option',
    },
    {
      icon: <Upload className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-100',
      title: 'AI Prescription Reader',
      desc: 'Upload your doctor\'s prescription and let AI extract and search medicines instantly',
    },
    {
      icon: <Phone className="w-6 h-6 text-orange-600" />,
      bg: 'bg-orange-100',
      title: 'WhatsApp Confirm',
      desc: 'Confirm medicine availability via WhatsApp or call before visiting the pharmacy',
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-teal-600" />,
      bg: 'bg-teal-100',
      title: 'Verified Pharmacies',
      desc: 'All listed pharmacies are verified with valid drug licenses by our admin team',
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      bg: 'bg-yellow-100',
      title: 'Real-Time Stock',
      desc: 'Pharmacy stores update stock daily so you always see accurate availability info',
    },
  ];

  const stats = [
    { value: '200+', label: 'Verified Pharmacies' },
    { value: '50,000+', label: 'Medicines Listed' },
    { value: '10,000+', label: 'Happy Customers' },
    { value: '4.8★', label: 'App Rating' },
  ];

  const steps = [
    { step: '1', title: 'Search Medicine', desc: 'Enter medicine name or upload your prescription', color: 'bg-blue-600' },
    { step: '2', title: 'View Results', desc: 'See availability, prices & nearby pharmacy locations', color: 'bg-green-600' },
    { step: '3', title: 'Compare & Choose', desc: 'Filter by price, distance, rating & stock status', color: 'bg-purple-600' },
    { step: '4', title: 'Confirm & Visit', desc: 'Call, WhatsApp or get directions to the pharmacy', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback src={HERO_IMG} alt="India" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center text-white">
            <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm px-4 py-1.5">
              🇮🇳 Serving All of India
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Find Any Medicine in
              <span className="text-yellow-300"> India </span>
              Instantly
            </h1>
            <p className="text-blue-100 text-base md:text-xl mb-8 leading-relaxed">
              Search medicines, compare prices, check availability at nearby pharmacies — all in one place.
            </p>

            {/* Search Box */}
            <div className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search medicine or symptom (e.g., Paracetamol, bukhar, acidity)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 py-6 text-base bg-white text-gray-900 rounded-xl border-0 shadow-lg"
                />
              </div>
              <Button
                onClick={() => navigate('/search?upload=1')}
                size="lg"
                variant="outline"
                className="bg-white text-blue-700 border-0 shadow-lg font-semibold px-5 rounded-xl"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Prescription
              </Button>
              <Button
                onClick={handleSearch}
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 rounded-xl shadow-lg"
              >
                Search
              </Button>
            </div>

            <p className="text-blue-100 text-xs mt-3">Tip: you can type a medicine name or a symptom like bukhar, acidity, or allergy.</p>

            {/* Popular Searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-blue-200 text-sm">Popular:</span>
              {popularSearches.map(med => (
                <button
                  key={med}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(med)}`)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 transition-colors"
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none">
            <path d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,30 L1440,60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 -mt-6 relative z-10 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 text-center shadow-md border-0">
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Everything You Need</h2>
          <p className="text-gray-500 max-w-xl mx-auto">PillPoint makes finding medicines across India quick, easy, and reliable</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => (
            <Card key={feat.title} className="p-5 hover:shadow-md transition-shadow border border-gray-100">
              <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-4`}>
                {feat.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feat.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500">Get your medicine in 4 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, idx) => (
              <div key={item.step} className="relative text-center">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-2/3 w-full h-px bg-gray-200 z-0" />
                )}
                <div className={`w-16 h-16 ${item.color} text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg relative z-10`}>
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pharmacy Banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-teal-600 p-8 md:p-12">
          <div className="absolute right-0 bottom-0 opacity-20 w-64 h-64">
            <ImageWithFallback src={PHARMACY_IMG} alt="" className="w-full h-full object-cover rounded-tl-2xl" />
          </div>
          <div className="relative max-w-xl">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">For Pharmacy Stores</Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Register Your Pharmacy on PillPoint</h3>
            <p className="text-green-100 mb-6 leading-relaxed">
              Reach thousands of customers across India. Manage your inventory, update stock, and get more walk-ins.
              Admin verification ensures only genuine pharmacies are listed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/auth/shopkeeper')}
                className="bg-white text-green-700 hover:bg-green-50 font-semibold"
                size="lg"
              >
                Register Your Pharmacy
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                onClick={() => navigate('/about')}
                variant="outline"
                className="border-white/40 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white dark:border-white/40 dark:bg-transparent dark:hover:bg-white/10"
                size="lg"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8">What People Say</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: 'Anita Verma', area: 'Vaishali Nagar', text: 'Found Azithromycin at the lowest price in just 2 minutes! Amazing app for anyone in India.', rating: 5 },
              { name: 'Ramesh Gupta', area: 'C-Scheme', text: 'The WhatsApp confirmation feature saved me a wasted trip to the pharmacy. Highly recommended!', rating: 5 },
              { name: 'Pooja Sharma', area: 'Malviya Nagar', text: 'AI prescription reader is a game changer. Uploaded my doctor\'s prescription and got all medicines listed instantly.', rating: 5 },
            ].map((t) => (
              <Card key={t.name} className="p-5 border-0 shadow-sm">
                <div className="flex items-center gap-1 mb-3">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.area}, India</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Ready to Find Your Medicine?</h2>
        <p className="text-gray-500 mb-8 max-w-xl mx-auto">Join thousands across India who trust PillPoint for their healthcare needs</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/auth/user')} size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
            <Users className="w-4 h-4 mr-2" />
            Sign Up as Customer
          </Button>
          <Button onClick={() => navigate('/search')} variant="outline" size="lg" className="px-8">
            <Search className="w-4 h-4 mr-2" />
            Search Without Login
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Pill className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold">PillPoint</span>
              </div>
              <p className="text-sm leading-relaxed">Your trusted medicine finder for India. Quick, reliable, verified.</p>
            </div>
            <div>
              <p className="text-white font-medium mb-3">Quick Links</p>
              <div className="space-y-2 text-sm">
                {[['Home', '/'], ['About', '/about'], ['Services', '/services'], ['Contact', '/contact']].map(([label, path]) => (
                  <button key={path} onClick={() => navigate(path)} className="block hover:text-white transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-medium mb-3">For Users</p>
              <div className="space-y-2 text-sm">
                <button onClick={() => navigate('/auth/user')} className="block hover:text-white transition-colors">Sign Up / Login</button>
                <button onClick={() => navigate('/search')} className="block hover:text-white transition-colors">Search Medicines</button>
                <button onClick={() => navigate('/search?upload=1')} className="block hover:text-white transition-colors">Upload Prescription</button>
              </div>
            </div>
            <div>
              <p className="text-white font-medium mb-3">For Pharmacies</p>
              <div className="space-y-2 text-sm">
                <button onClick={() => navigate('/auth/shopkeeper')} className="block hover:text-white transition-colors">Register Pharmacy</button>
                <button onClick={() => navigate('/auth/shopkeeper')} className="block hover:text-white transition-colors">Pharmacy Store Login</button>
                <button onClick={() => navigate('/contact')} className="block hover:text-white transition-colors">Get Support</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" />
                <span>All pharmacies are verified with valid drug licenses</span>
              </div>
              <p className="text-xs text-center">
                © 2026 PillPoint, India. Always consult your doctor before taking medicine.
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/auth/admin')}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Admin Access
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
