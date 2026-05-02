import { useNavigate } from 'react-router';
import { Search, Upload, History, Star, MapPin, User as UserIcon, Bell, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import Navbar from '../Navbar';
import type { User } from '../../App';
import { useState } from 'react';

interface UserDashboardProps {
  currentUser: User;
  onLogout?: () => void;
}

export default function UserDashboard({ currentUser, onLogout }: UserDashboardProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const recentSearches = [
    { medicine: 'Paracetamol 500mg', date: '2026-04-20', found: 4 },
    { medicine: 'Azithromycin 250mg', date: '2026-04-19', found: 3 },
    { medicine: 'Cetirizine 10mg', date: '2026-04-18', found: 5 },
  ];

  const savedPharmacies = [
    { name: 'Apollo Pharmacy', address: 'Near Pink Square Mall', rating: 4.5, area: 'Mansarovar' },
    { name: 'MedPlus', address: 'C-Scheme', rating: 4.3, area: 'C-Scheme' },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Welcome back</p>
              <p className="font-semibold text-lg">{currentUser.name}</p>
            </div>
          </div>
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
placeholder="Search medicine or symptom (e.g., Paracetamol, bukhar, acidity)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-white text-gray-900"
              />
            </div>
            <Button onClick={handleSearch} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold flex-shrink-0">
              Search
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { icon: <Search className="w-5 h-5 text-blue-600" />, label: 'Browse Medicines', bg: 'bg-blue-50', path: '/search' },
            { icon: <Upload className="w-5 h-5 text-purple-600" />, label: 'Upload Prescription', bg: 'bg-purple-50', path: '/search?upload=1' },
            { icon: <MapPin className="w-5 h-5 text-green-600" />, label: 'Nearby Pharmacies', bg: 'bg-green-50', path: '/search' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.bg} rounded-xl p-3 text-center hover:shadow-sm transition-shadow`}
            >
              <div className="flex justify-center mb-1.5">{action.icon}</div>
              <p className="text-xs font-medium text-gray-700 leading-tight">{action.label}</p>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Recent Searches */}
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-400" />
                Recent Searches
              </h3>
              <Badge variant="secondary" className="text-xs">{recentSearches.length}</Badge>
            </div>
            <div className="space-y-2">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(search.medicine)}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{search.medicine}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{search.date} · {search.found} pharmacies found</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </Card>

          {/* Saved Pharmacies */}
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Saved Pharmacies
              </h3>
              <Badge variant="secondary" className="text-xs">{savedPharmacies.length}</Badge>
            </div>
            <div className="space-y-2">
              {savedPharmacies.map((pharmacy, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pharmacy.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {pharmacy.address}, {pharmacy.area}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-gray-700">{pharmacy.rating}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full text-xs"
                    onClick={() => navigate('/search')}
                  >
                    Search medicines here
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Tips */}
        <Card className="mt-4 p-4 border border-blue-100 bg-blue-50">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 text-sm mb-1">💡 Pro Tip</p>
              <p className="text-blue-700 text-sm">
                Upload your doctor's prescription to automatically search all medicines at once.
                Use the WhatsApp feature to confirm availability before visiting any pharmacy.
              </p>
              <Button onClick={() => navigate('/search?upload=1')} className="mt-2 bg-blue-600 hover:bg-blue-700" size="sm">
                Try Prescription Upload
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
