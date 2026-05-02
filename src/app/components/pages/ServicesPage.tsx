import { useNavigate } from 'react-router';
import {
  Search, MapPin, Upload, TrendingUp, MessageSquare, Bell, Package,
  ShieldCheck, BarChart2, Users, Clock, CheckCircle, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import Navbar from '../Navbar';
import type { User } from '../../App';

interface ServicesPageProps {
  currentUser: User | null;
  onLogout?: () => void;
}

const userServices = [
  {
    icon: <Search className="w-7 h-7 text-blue-600" />,
    bg: 'bg-blue-50',
    title: 'Smart Medicine Search',
    desc: 'Search by medicine name, brand, or generic name. Get instant results showing availability across pharmacies nationwide with real-time stock status.',
    features: ['Search by brand or generic name', 'Real-time stock availability', 'Filter by distance, price & rating'],
    badge: 'Free',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    icon: <MapPin className="w-7 h-7 text-purple-600" />,
    bg: 'bg-purple-50',
    title: 'Interactive Pharmacy Map',
    desc: 'View all nearby pharmacies on an interactive map. See exact locations, get directions, and find the closest open pharmacy.',
    features: ['Google Maps integration', 'GPS-based nearest pharmacy', 'Opening hours & directions'],
    badge: 'Free',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    icon: <TrendingUp className="w-7 h-7 text-green-600" />,
    bg: 'bg-green-50',
    title: 'Price Comparison',
    desc: 'Compare medicine prices across 200+ pharmacies nationwide side by side. Find the most affordable option without leaving home.',
    features: ['Side-by-side price comparison', 'Best deal highlighted', 'Price history tracking'],
    badge: 'Free',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    icon: <Upload className="w-7 h-7 text-orange-500" />,
    bg: 'bg-orange-50',
    title: 'AI Prescription Reader',
    desc: 'Upload a photo of your doctor\'s prescription and our AI-powered OCR will extract all medicine names and search for them automatically.',
    features: ['OCR-powered text extraction', 'Supports handwritten prescriptions', 'Instant medicine search'],
    badge: 'AI Powered',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    icon: <MessageSquare className="w-7 h-7 text-teal-600" />,
    bg: 'bg-teal-50',
    title: 'WhatsApp Availability Check',
    desc: 'Send a pre-filled WhatsApp message directly to any pharmacy to confirm medicine availability before visiting — saves time and effort.',
    features: ['One-tap WhatsApp message', 'Pre-filled medicine details', 'Direct pharmacy contact'],
    badge: 'Popular',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    icon: <Clock className="w-7 h-7 text-red-500" />,
    bg: 'bg-red-50',
    title: 'Search History & Favourites',
    desc: 'Save your frequently searched medicines and favourite pharmacies for quick access. Your health profile at your fingertips.',
    features: ['Search history saved', 'Bookmark favourite pharmacies', 'Quick re-search'],
    badge: 'For Registered Users',
    badgeColor: 'bg-gray-100 text-gray-600',
  },
];

const shopkeeperServices = [
  {
    icon: <Package className="w-7 h-7 text-blue-600" />,
    bg: 'bg-blue-50',
    title: 'Inventory Management',
    desc: 'Add, edit, and delete medicines from your inventory with ease. Upload medicine images and set prices that customers can see.',
    features: ['Add/edit/delete medicines', 'Upload medicine images', 'Set custom prices'],
  },
  {
    icon: <Bell className="w-7 h-7 text-amber-500" />,
    bg: 'bg-amber-50',
    title: 'Smart Stock Alerts',
    desc: 'Set low stock thresholds and get instant alerts when medicines fall below the set quantity. Never run out unexpectedly again.',
    features: ['Custom threshold alerts', 'Out-of-stock warnings', 'Dashboard notifications'],
  },
  {
    icon: <BarChart2 className="w-7 h-7 text-green-600" />,
    bg: 'bg-green-50',
    title: 'Sales Analytics',
    desc: 'View which medicines are most searched by customers near your pharmacy. Use data to make better stocking decisions.',
    features: ['Most searched medicines', 'Enquiry tracking', 'Customer demand insights'],
  },
  {
    icon: <Users className="w-7 h-7 text-purple-600" />,
    bg: 'bg-purple-50',
    title: 'Customer Reach',
    desc: 'Once verified, your pharmacy is listed and visible to all PillPoint users across India. Grow your customer base organically.',
    features: ['City-wide visibility', 'Profile with shop images', 'Customer enquiries via app'],
  },
];

export default function ServicesPage({ currentUser, onLogout }: ServicesPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 py-14 md:py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center text-white relative z-10">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">Our Services</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Everything You Need for
            <span className="text-yellow-300"> Healthcare</span> in India
          </h1>
          <p className="text-blue-100 text-base md:text-xl leading-relaxed">
            From searching medicines to managing pharmacy inventory — PillPoint has a full suite of services for customers and pharmacies alike.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,40 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* For Customers */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">For Customers</h2>
            <p className="text-gray-500 text-sm">Services designed to help you find medicines faster</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {userServices.map((service) => (
            <Card key={service.title} className="p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center`}>
                  {service.icon}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${service.badgeColor}`}>
                  {service.badge}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.desc}</p>
              <ul className="space-y-1.5">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/auth/user')} size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
            Get Started as Customer
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </section>

      {/* Divider */}
      <div className="bg-gray-50 py-2" />

      {/* For Pharmacy Stores */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">For Pharmacy Stores</h2>
              <p className="text-gray-500 text-sm">Tools to grow your pharmacy business</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {shopkeeperServices.map((service) => (
              <Card key={service.title} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                <div className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center mb-4`}>
                  {service.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.desc}</p>
                <ul className="space-y-1.5">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="bg-green-600 rounded-2xl p-6 md:p-8 text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">How to Join as a Pharmacy Store?</h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    { step: '1', text: 'Register with your drug license' },
                    { step: '2', text: 'Admin verifies your details' },
                    { step: '3', text: 'Go live on PillPoint!' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white text-green-700 rounded-full flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                      <span className="text-green-100 text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => navigate('/auth/shopkeeper')}
                className="bg-white text-green-700 hover:bg-green-50 font-semibold flex-shrink-0"
                size="lg"
              >
                Register Your Pharmacy
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Verification */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <Card className="p-6 md:p-8 border border-blue-100 bg-blue-50">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Verification Process</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                PillPoint maintains strict quality standards. Every pharmacy that registers goes through a thorough
                verification process. Our admin team checks the drug license number, shop address, contact details, and
                photographs before approving a pharmacy. <strong>Only verified pharmacies appear on the PillPoint platform</strong>,
                ensuring customers always get accurate and trustworthy information.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { title: 'License Check', desc: 'Drug license number verified with official records' },
                  { title: 'Address Verified', desc: 'Physical location confirmed for accuracy' },
                  { title: 'Contact Confirmed', desc: 'Mobile number & email verified via OTP' },
                ].map((item) => (
                  <div key={item.title} className="bg-white rounded-xl p-4 border border-blue-100">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is PillPoint free to use for customers?', a: 'Yes, PillPoint is completely free for customers. Search medicines, compare prices, and contact pharmacies at no cost.' },
              { q: 'How long does pharmacy verification take?', a: 'Our admin team reviews and verifies pharmacy applications within 24-48 hours of submission. You will be notified via SMS.' },
              { q: 'Are all medicines available on PillPoint?', a: 'We list all medicines that our partner pharmacies stock. The inventory is updated by pharmacies themselves in real-time.' },
              { q: 'Can I trust the prices shown?', a: 'Yes, prices are set directly by pharmacy store owners. We encourage pharmacies to keep prices updated, but always confirm before purchase.' },
              { q: 'What if a pharmacy shows medicine in stock but it\'s not?', a: 'Use the WhatsApp or call feature to confirm availability before visiting. You can also report inaccurate listings through our Contact page.' },
            ].map((faq) => (
              <Card key={faq.q} className="p-5 border-0 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
            <p className="text-sm">© 2026 PillPoint, India. All rights reserved.</p>
            <Button onClick={() => navigate('/contact')} variant="link" className="text-gray-400 text-sm">
              Have questions? Contact Us →
            </Button>
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
      </footer>
    </div>
  );
}
