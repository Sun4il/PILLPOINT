import { useNavigate } from 'react-router';
import { Target, Heart, Users, Shield, MapPin, Award, CheckCircle, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import Navbar from '../Navbar';
import type { User } from '../../App';

interface AboutPageProps {
  currentUser: User | null;
  onLogout?: () => void;
}

const MISSION_IMG = 'https://images.unsplash.com/photo-1758653500437-26660f405fe4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';
const MEDICINE_IMG = 'https://images.unsplash.com/photo-1659019480504-ed06c5cf2bab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

const milestones = [
  { year: '2024', title: 'PillPoint Founded', desc: 'Started with a vision to solve medicine availability problem across India' },
  { year: '2024', title: 'First 50 Pharmacies', desc: 'Onboarded and verified 50+ pharmacies across India in first 3 months' },
  { year: '2025', title: 'AI Prescription Reader', desc: 'Launched OCR-based prescription reading to simplify medicine search' },
  { year: '2026', title: '10,000+ Users', desc: 'Crossed 10,000 registered users and 200 verified pharmacies' },
];

export default function AboutPage({ currentUser, onLogout }: AboutPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback src={MEDICINE_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">About PillPoint</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Making Medicines<br />
            <span className="text-yellow-300">Easy to Find</span> in India
          </h1>
          <p className="text-blue-100 text-base md:text-xl leading-relaxed max-w-2xl mx-auto">
            We started PillPoint with a simple mission — no one in India should struggle to find a medicine.
            Our platform connects patients with verified local pharmacies instantly.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,40 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">Our Mission</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Connecting Patients with the Right Medicine, Right Now
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Every day, thousands of Indian residents face the frustrating experience of visiting multiple pharmacies
              to find a specific medicine. PillPoint was built to end this problem — a single search should tell you
              exactly where your medicine is available and at what price.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              We partner with licensed pharmacies across India — from metro cities to smaller towns —
              ensuring coverage wherever you need medicine.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Target className="w-5 h-5 text-blue-600" />, label: 'Mission-driven' },
                { icon: <Heart className="w-5 h-5 text-red-500" />, label: 'Patient-first' },
                { icon: <Shield className="w-5 h-5 text-green-600" />, label: 'Verified Only' },
                { icon: <Zap className="w-5 h-5 text-yellow-500" />, label: 'Fast Results' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  {item.icon}
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <ImageWithFallback
              src={MISSION_IMG}
              alt="Healthcare and pharmacy network across India"
              className="w-full h-72 md:h-96 object-cover rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">200+</p>
                  <p className="text-gray-500 text-xs">Indian Pharmacies</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">What We Stand For</h2>
            <p className="text-gray-500">Our core values that guide everything we do</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <Shield className="w-8 h-8 text-blue-600" />, bg: 'bg-blue-50', title: 'Trust & Safety', desc: 'Every pharmacy on our platform is verified with a valid drug license by our admin team.' },
              { icon: <Users className="w-8 h-8 text-purple-600" />, bg: 'bg-purple-50', title: 'Community First', desc: 'We work for both patients and pharmacy stores, creating a win-win ecosystem.' },
              { icon: <Zap className="w-8 h-8 text-yellow-500" />, bg: 'bg-yellow-50', title: 'Speed & Accuracy', desc: 'Real-time stock updates ensure you get accurate information every time you search.' },
              { icon: <Heart className="w-8 h-8 text-red-500" />, bg: 'bg-red-50', title: 'Healthcare Access', desc: 'We believe quality healthcare access is a right, not a privilege, for everyone in India.' },
            ].map((v) => (
              <Card key={v.title} className="p-5 border-0 shadow-sm text-center">
                <div className={`w-16 h-16 ${v.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  {v.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Our Journey</h2>
          <p className="text-gray-500">From a small idea to India's trusted medicine finder</p>
        </div>
        <div className="space-y-6">
          {milestones.map((m, idx) => (
            <div key={idx} className="flex gap-5 items-start">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  {m.year.slice(2)}
                </div>
                {idx < milestones.length - 1 && <div className="w-0.5 h-10 bg-blue-200 mt-2" />}
              </div>
              <Card className="flex-1 p-4 border border-gray-100 shadow-sm">
                <p className="text-xs text-blue-600 font-semibold mb-1">{m.year}</p>
                <h4 className="font-semibold text-gray-900 mb-1">{m.title}</h4>
                <p className="text-gray-500 text-sm">{m.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Why Choose PillPoint?</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            'Only verified, licensed pharmacies are listed on our platform',
            'Real-time stock updates directly from pharmacy stores',
            'AI-powered prescription reader for instant medicine search',
            'Price comparison across 200+ pharmacies nationwide',
            'WhatsApp & call integration for quick confirmation',
            'Covers all major areas of India including outskirts',
          ].map((point) => (
            <div key={point} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700 text-sm">{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <Award className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Join the PillPoint Community</h2>
          <p className="text-blue-100 mb-7">Whether you're a patient or a pharmacy store owner — PillPoint is for you</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/auth/user')} className="bg-white text-blue-700 hover:bg-blue-50 font-semibold" size="lg">
              Sign Up as Customer
            </Button>
            <Button onClick={() => navigate('/auth/shopkeeper')} variant="outline" className="border-white/40 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white dark:border-white/40 dark:bg-transparent dark:hover:bg-white/10" size="lg">
              Register Your Pharmacy
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
            <p className="text-sm">© 2026 PillPoint, India. All rights reserved.</p>
            <p className="text-xs text-center">Always consult your doctor before taking any medicine.</p>
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
