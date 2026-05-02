import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import Navbar from '../Navbar';
import { toast } from 'sonner';
import type { User } from '../../App';

interface ContactPageProps {
  currentUser: User | null;
  onLogout?: () => void;
}

const SUPPORT_IMG = 'https://images.unsplash.com/photo-1553775282-20af80779df7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';

export default function ContactPage({ currentUser, onLogout }: ContactPageProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', subject: '', message: '', type: 'general' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }
    toast.success('Message sent successfully! We\'ll respond within 24 hours.');
    setSubmitted(true);
  };

  const contactTypes = [
    { value: 'general', label: 'General Query' },
    { value: 'pharmacy', label: 'Pharmacy Registration' },
    { value: 'medicine', label: 'Medicine Availability Issue' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'complaint', label: 'Lodge Complaint' },
  ];

  const offices = [
    {
      title: 'Main Office',
      address: 'C-13, Sector 4, Connaught Place, New Delhi - 110001',
      phone: '+91-9876543000',
      email: 'hello@medifinder.in',
      hours: 'Mon–Sat: 9:00 AM – 6:00 PM',
    },
    {
      title: 'Support Center',
      address: 'Malviya Nagar, South Delhi - 110017',
      phone: '+91-9876543001',
      email: 'support@medifinder.in',
      hours: 'Mon–Sun: 8:00 AM – 10:00 PM',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback src={SUPPORT_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">Contact Us</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            We're Here to <span className="text-yellow-300">Help You</span>
          </h1>
          <p className="text-blue-100 text-base md:text-xl">
            Have a question, complaint, or feedback? Our India-based support team is ready to assist you.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,40 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: <Phone className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50', title: 'Call Us', lines: ['+91-9876543000', '+91-9876543001'], sub: 'Mon–Sun 8AM–10PM' },
            { icon: <Mail className="w-6 h-6 text-green-600" />, bg: 'bg-green-50', title: 'Email Us', lines: ['hello@medifinder.in', 'support@medifinder.in'], sub: 'Reply within 24 hours' },
            { icon: <MessageSquare className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50', title: 'WhatsApp', lines: ['+91-9876543000'], sub: 'Quick response on WhatsApp' },
          ].map((c) => (
            <Card key={c.title} className="p-5 border border-gray-100 text-center hover:shadow-md transition-shadow">
              <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                {c.icon}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{c.title}</h4>
              {c.lines.map(l => <p key={l} className="text-sm text-gray-700 font-medium">{l}</p>)}
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </Card>
          ))}
        </div>

        {/* Contact Form + Info */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <Card className="p-6 border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Send Us a Message</h2>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-500 mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                  <Button onClick={() => setSubmitted(false)} variant="outline">Send Another Message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Query Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {contactTypes.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm({ ...form, type: t.value })}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            form.type === t.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-200 text-gray-600 hover:border-blue-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        placeholder="+91 XXXXXXXXXX"
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief subject of your query"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      rows={5}
                      placeholder="Describe your query in detail..."
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Offices */}
            {offices.map((office) => (
              <Card key={office.title} className="p-5 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3">{office.title}</h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>{office.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{office.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>{office.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span>{office.hours}</span>
                  </div>
                </div>
              </Card>
            ))}

            {/* Map Placeholder */}
            <Card className="overflow-hidden border border-gray-100">
              <div className="bg-gray-100 h-44 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm font-medium">New Delhi, India</p>
                  <p className="text-xs">National headquarters — 110001</p>
                </div>
              </div>
              <div className="p-4 bg-blue-50">
                <p className="text-sm text-blue-700 font-medium">📍 Serving customers across India</p>
                <p className="text-xs text-blue-500 mt-1">Metro cities • tier-2 towns • expanding nationwide</p>
              </div>
            </Card>

            {/* Response Time */}
            <Card className="p-4 border border-green-100 bg-green-50">
              <h4 className="font-medium text-green-800 mb-3">Expected Response Times</h4>
              <div className="space-y-2">
                {[
                  { type: 'WhatsApp', time: '< 1 hour', color: 'text-green-700' },
                  { type: 'Phone Call', time: 'Immediate', color: 'text-green-700' },
                  { type: 'Email', time: '24 hours', color: 'text-blue-700' },
                  { type: 'Contact Form', time: '24–48 hours', color: 'text-orange-700' },
                ].map((r) => (
                  <div key={r.type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{r.type}</span>
                    <span className={`font-medium ${r.color}`}>{r.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* For Pharmacies CTA */}
      <section className="bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Own a Pharmacy Store?</h3>
          <p className="text-gray-500 mb-5">
            For pharmacy registration issues, license verification, or dashboard support — contact us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/auth/shopkeeper')} className="bg-blue-600 hover:bg-blue-700">
              Register Your Pharmacy
            </Button>
            <Button onClick={() => navigate('/services')} variant="outline">
              View Pharmacy Store Services
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
            <p className="text-sm">© 2026 PillPoint, India. All rights reserved.</p>
            <p className="text-xs">Always consult your doctor before taking any medicine.</p>
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
