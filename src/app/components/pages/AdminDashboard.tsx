import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle, XCircle, Users, Store, Shield, LogOut, Phone, Mail,
  LayoutDashboard, Clock, Menu, Eye, EyeOff, ChevronRight, AlertCircle,
  TrendingUp, FileText, Search
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';
import type { User } from '../../App';

interface AdminDashboardProps {
  currentUser: User;
  onLogout?: () => void;
}

interface Shopkeeper {
  id: string;
  name: string;
  email: string;
  mobile: string;
  shopName: string;
  address: string;
  license: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
  medicineCount?: number;
  area: string;
}

type ActiveSection = 'dashboard' | 'pending' | 'approved' | 'rejected' | 'users';

const initialShopkeepers: Shopkeeper[] = [
  { id: '1', name: 'Rajesh Kumar', email: 'rajesh@apollo.com', mobile: '+91-9876543210', shopName: 'Apollo Pharmacy', address: 'Near Pink Square Mall, Mansarovar', license: 'DL-RJ-2024-123456', status: 'pending', registeredAt: '2026-04-20', medicineCount: 0, area: 'Mansarovar' },
  { id: '2', name: 'Priya Sharma', email: 'priya@medplus.com', mobile: '+91-9876543211', shopName: 'MedPlus C-Scheme', address: 'C-Scheme, Near Rajasthan Club', license: 'DL-RJ-2024-789012', status: 'pending', registeredAt: '2026-04-21', medicineCount: 0, area: 'C-Scheme' },
  { id: '3', name: 'Amit Patel', email: 'amit@wellness.com', mobile: '+91-9876543212', shopName: 'Wellness Forever', address: 'Vaishali Nagar, Main Road', license: 'DL-RJ-2023-345678', status: 'approved', registeredAt: '2026-04-18', medicineCount: 45, area: 'Vaishali Nagar' },
  { id: '4', name: 'Sunita Mehta', email: 'sunita@healthbuddy.com', mobile: '+91-9876543213', shopName: 'HealthBuddy Pharmacy', address: 'Malviya Nagar, New Delhi', license: 'DL-RJ-2023-901234', status: 'approved', registeredAt: '2026-04-15', medicineCount: 62, area: 'Malviya Nagar' },
  { id: '5', name: 'Vikas Gupta', email: 'vikas@jan.com', mobile: '+91-9876543214', shopName: 'Jan Aushadhi Store', address: 'Tonk Road, Near SBI Bank', license: 'DL-FAKE-000000', status: 'rejected', registeredAt: '2026-04-10', medicineCount: 0, area: 'Tonk Road' },
  { id: '6', name: 'Kavita Joshi', email: 'kavita@life.com', mobile: '+91-9876543215', shopName: 'Life Care Pharmacy', address: 'Whitefield, Bengaluru', license: 'DL-RJ-2024-567890', status: 'pending', registeredAt: '2026-04-22', medicineCount: 0, area: 'Whitefield' },
];

const initialUsers = [
  { id: '1', name: 'Anita Verma', email: 'anita@email.com', mobile: '+91-9123456789', registeredAt: '2026-04-15', searches: 12 },
  { id: '2', name: 'Vikram Singh', email: 'vikram@email.com', mobile: '+91-9123456790', registeredAt: '2026-04-16', searches: 8 },
  { id: '3', name: 'Neha Gupta', email: 'neha@email.com', mobile: '+91-9123456791', registeredAt: '2026-04-17', searches: 23 },
  { id: '4', name: 'Rohit Agarwal', email: 'rohit@email.com', mobile: '+91-9123456792', registeredAt: '2026-04-18', searches: 5 },
  { id: '5', name: 'Pooja Sharma', email: 'pooja@email.com', mobile: '+91-9123456793', registeredAt: '2026-04-19', searches: 17 },
];

export default function AdminDashboard({ currentUser, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate();
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>(initialShopkeepers);
  const [users] = useState(initialUsers);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedShopkeeper, setSelectedShopkeeper] = useState<Shopkeeper | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingList = shopkeepers.filter(s => s.status === 'pending');
  const approvedList = shopkeepers.filter(s => s.status === 'approved');
  const rejectedList = shopkeepers.filter(s => s.status === 'rejected');

  const handleApprove = (id: string) => {
    setShopkeepers(shopkeepers.map(s => s.id === id ? { ...s, status: 'approved' as const } : s));
    toast.success('Pharmacy approved! It is now live on PillPoint.');
    setSelectedShopkeeper(null);
  };

  const handleReject = (id: string) => {
    setShopkeepers(shopkeepers.map(s => s.id === id ? { ...s, status: 'rejected' as const } : s));
    toast.error('Pharmacy registration rejected.');
    setSelectedShopkeeper(null);
    setRejectReason('');
  };

  const handleRevoke = (id: string) => {
    setShopkeepers(shopkeepers.map(s => s.id === id ? { ...s, status: 'rejected' as const } : s));
    toast.success('Pharmacy has been removed from live listings.');
  };

  const handleLogout = () => {
    onLogout?.();
    navigate('/');
  };

  const navItems: { id: ActiveSection; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending Approvals', icon: <Clock className="w-4 h-4" />, count: pendingList.length },
    { id: 'approved', label: 'Live Pharmacies', icon: <CheckCircle className="w-4 h-4" />, count: approvedList.length },
    { id: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
    { id: 'users', label: 'All Users', icon: <Users className="w-4 h-4" />, count: users.length },
  ];

  const StatusBadge = ({ status }: { status: Shopkeeper['status'] }) => {
    if (status === 'approved') return (
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <Badge className="bg-green-100 text-green-700 border-green-200">Live on Website</Badge>
      </div>
    );
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>;
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ShopkeeperCard = ({ shop, showActions = true }: { shop: Shopkeeper; showActions?: boolean }) => (
    <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">{shop.shopName}</h4>
            <StatusBadge status={shop.status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{shop.address}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span>{shop.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{shop.mobile}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{shop.license}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{shop.registeredAt}</span>
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2 pt-3 border-t">
          {shop.status === 'pending' && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setSelectedShopkeeper(shop)}>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Review Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Review Pharmacy Application</DialogTitle>
                    <DialogDescription>
                      Verify pharmacy details and approve or reject the application
                    </DialogDescription>
                  </DialogHeader>
                  {selectedShopkeeper && (
                    <div className="space-y-4 mt-2">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                        <p>⚠️ <strong>Review carefully:</strong> Once approved, this pharmacy will be visible to all PillPoint users across India.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Shop Name', value: selectedShopkeeper.shopName },
                          { label: 'Owner Name', value: selectedShopkeeper.name },
                          { label: 'Mobile', value: selectedShopkeeper.mobile },
                          { label: 'Email', value: selectedShopkeeper.email },
                          { label: 'Drug License', value: selectedShopkeeper.license },
                          { label: 'Area', value: selectedShopkeeper.area },
                        ].map(field => (
                          <div key={field.label} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-0.5">{field.label}</p>
                            <p className="text-sm font-medium text-gray-800">{field.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-0.5">Full Address</p>
                        <p className="text-sm font-medium text-gray-800">{selectedShopkeeper.address}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 block mb-1">Rejection reason (if rejecting)</label>
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="e.g., Invalid license number, incomplete address..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleApprove(selectedShopkeeper.id)} className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" /> Approve & Make Live
                        </Button>
                        <Button onClick={() => handleReject(selectedShopkeeper.id)} variant="destructive" className="flex-1">
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <Button size="sm" onClick={() => handleApprove(shop.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-xs">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Quick Approve
              </Button>
            </>
          )}
          {shop.status === 'approved' && (
            <Button size="sm" variant="outline" onClick={() => handleRevoke(shop.id)} className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-xs">
              <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Remove from Live
            </Button>
          )}
          {shop.status === 'rejected' && (
            <Button size="sm" onClick={() => handleApprove(shop.id)} variant="outline" className="flex-1 bg-green-50 text-green-700 border-green-200 text-xs">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Re-approve
            </Button>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">Admin Panel</p>
                <p className="text-xs text-gray-500 leading-tight">PillPoint Control</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingList.length > 0 && (
              <button
                onClick={() => setActiveSection('pending')}
                className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200 text-xs font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {pendingList.length} pending
              </button>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs">
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r min-h-[calc(100vh-56px)] sticky top-14 h-fit">
          <nav className="p-3 space-y-1 flex-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    item.id === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
                {activeSection === item.id && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t">
            <div className="bg-blue-50 rounded-xl p-3 text-xs">
              <p className="font-semibold text-blue-800 mb-1">Admin Access</p>
              <p className="text-blue-600">Full control over pharmacies & users</p>
            </div>
          </div>
        </aside>

        {/* Mobile Nav */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-30" onClick={() => setMobileNavOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute top-14 left-0 bottom-0 w-64 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              <nav className="p-4 space-y-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setMobileNavOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeSection === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{item.count}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Users', value: users.length, icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', color: 'text-blue-700' },
                  { label: 'Live Pharmacies', value: approvedList.length, icon: <Eye className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', color: 'text-green-700', sub: 'Visible on website' },
                  { label: 'Pending Review', value: pendingList.length, icon: <Clock className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50', color: 'text-amber-700' },
                  { label: 'Rejected', value: rejectedList.length, icon: <XCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50', color: 'text-red-700' },
                ].map(stat => (
                  <Card key={stat.label} className="p-4 border-0 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>{stat.icon}</div>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    {stat.sub && <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>}
                  </Card>
                ))}
              </div>

              {/* Important Notice */}
              <Card className="p-4 border border-blue-100 bg-blue-50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">How Approval Works</p>
                    <p className="text-blue-700 text-sm">
                      Only <strong>Approved</strong> pharmacies are visible to customers on PillPoint search results.
                      Pending and Rejected pharmacies are NOT shown on the website.
                      Review each application carefully before approving.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Pending Approvals Preview */}
              {pendingList.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Pending Approvals ({pendingList.length})
                    </h3>
                    <Button variant="link" className="text-blue-600 text-sm p-0" onClick={() => setActiveSection('pending')}>
                      View all →
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {pendingList.slice(0, 2).map(shop => (
                      <ShopkeeperCard key={shop.id} shop={shop} />
                    ))}
                  </div>
                </div>
              )}

              {/* Live Pharmacies */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Live on PillPoint ({approvedList.length})
                  </h3>
                  <Button variant="link" className="text-blue-600 text-sm p-0" onClick={() => setActiveSection('approved')}>
                    Manage →
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {approvedList.map(shop => (
                    <div key={shop.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Store className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{shop.shopName}</p>
                          <p className="text-xs text-gray-400">{shop.area}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">Live</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PENDING APPROVALS */}
          {activeSection === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
                <Badge className="bg-amber-100 text-amber-700">{pendingList.length} pending</Badge>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                ⚠️ <strong>Action Required:</strong> These pharmacies are waiting for your review. They are NOT visible to customers yet.
              </div>
              {pendingList.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow-sm">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500">No pending approvals. All caught up!</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pendingList.map(shop => <ShopkeeperCard key={shop.id} shop={shop} />)}
                </div>
              )}
            </div>
          )}

          {/* APPROVED */}
          {activeSection === 'approved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Live Pharmacies</h2>
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {approvedList.length} visible on website
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                ✅ These pharmacies are <strong>live and visible</strong> to all PillPoint users. You can remove any pharmacy if needed.
              </div>
              {approvedList.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow-sm">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No approved pharmacies yet. Approve pending applications to add them.</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {approvedList.map(shop => <ShopkeeperCard key={shop.id} shop={shop} />)}
                </div>
              )}
            </div>
          )}

          {/* REJECTED */}
          {activeSection === 'rejected' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Rejected Pharmacies</h2>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                ❌ These pharmacies were rejected and are <strong>not visible</strong> on PillPoint. You can re-approve them if needed.
              </div>
              {rejectedList.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow-sm">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500">No rejected pharmacies.</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {rejectedList.map(shop => <ShopkeeperCard key={shop.id} shop={shop} />)}
                </div>
              )}
            </div>
          )}

          {/* USERS */}
          {activeSection === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900">All Users ({users.length})</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="block md:hidden space-y-3">
                {filteredUsers.map(user => (
                  <Card key={user.id} className="p-4 border-0 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span><Phone className="w-3 h-3 inline mr-1" />{user.mobile}</span>
                      <span>Joined: {user.registeredAt}</span>
                      <span><Search className="w-3 h-3 inline mr-1" />{user.searches} searches</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table */}
              <Card className="hidden md:block border-0 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['User', 'Mobile', 'Email', 'Searches', 'Joined'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-semibold">
                              {user.name[0]}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.mobile}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{user.searches}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">{user.registeredAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
