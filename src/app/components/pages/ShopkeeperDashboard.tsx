import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Edit, Trash2, AlertCircle, Package, Bell, Store, LogOut,
  LayoutDashboard, Camera, X, Upload, TrendingUp, Eye, Menu, ChevronRight, ImageIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { User } from '../../App';
import {
  createShopkeeperMedicine,
  deleteShopkeeperMedicine,
  fetchShopkeeperInventory,
  updateShopProfile,
  updateShopkeeperMedicine,
  type MedicineRecord,
  type ShopProfile,
} from '../../lib/api';

interface ShopkeeperDashboardProps {
  currentUser: User;
  onLogout?: () => void;
}

type ActiveSection = 'overview' | 'inventory' | 'profile' | 'alerts';

const CATEGORIES = ['Antibiotics', 'Painkillers', 'Antihistamines', 'Antacids', 'Vitamins', 'Cardiac', 'Diabetes', 'Skin Care', 'Eye/Ear Drops', 'Other'];

const initialMedicines: MedicineRecord[] = [
  { id: '1', name: 'Paracetamol 500mg', price: 45, stock: 150, lowStockThreshold: 20, category: 'Painkillers' },
  { id: '2', name: 'Azithromycin 250mg', price: 120, stock: 8, lowStockThreshold: 10, category: 'Antibiotics' },
  { id: '3', name: 'Cetirizine 10mg', price: 35, stock: 0, lowStockThreshold: 15, category: 'Antihistamines' },
  { id: '4', name: 'Amoxicillin 500mg', price: 85, stock: 45, lowStockThreshold: 20, category: 'Antibiotics' },
  { id: '5', name: 'Omeprazole 20mg', price: 60, stock: 25, lowStockThreshold: 10, category: 'Antacids' },
  { id: '6', name: 'Vitamin C 500mg', price: 30, stock: 90, lowStockThreshold: 20, category: 'Vitamins' },
];

const emptyForm = { name: '', price: '', stock: '', lowStockThreshold: '', category: 'Other', imageUrl: '' };

export default function ShopkeeperDashboard({ currentUser, onLogout }: ShopkeeperDashboardProps) {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<MedicineRecord[]>(initialMedicines);
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineRecord | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shopId = currentUser.shopId || currentUser.id;

  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    id: shopId,
    shopId,
    name: 'HealthCare Pharmacy',
    ownerName: currentUser.name || 'Pharmacy Store',
    address: 'Near Sindhi Colony, Koramangala, Bengaluru - 560034',
    area: 'C-Scheme',
    phone: currentUser.mobile || '+91-9876543210',
    email: currentUser.email || 'shop@example.com',
    license: 'DL-RJ-2024-56789',
    openTime: '08:00',
    closeTime: '22:00',
    imageUrl: '',
    rating: 4.5,
    reviews: 0,
    latitude: 26.9124,
    longitude: 75.7873,
  });

  const lowStockMedicines = medicines.filter(m => m.stock > 0 && m.stock <= m.lowStockThreshold);
  const outOfStockMedicines = medicines.filter(m => m.stock === 0);
  const inStockMedicines = medicines.filter(m => m.stock > m.lowStockThreshold);

  const filteredMedicines = medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchCategory = categoryFilter === 'All' || m.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const loadInventory = async () => {
    if (!shopId) return;

    setIsLoadingInventory(true);
    try {
      const response = await fetchShopkeeperInventory(shopId);
      setMedicines(response.medicines.length > 0 ? response.medicines : initialMedicines);
      setShopProfile(response.shop);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load inventory';
      toast.error(message);
      setMedicines(initialMedicines);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [shopId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleShopImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setShopProfile(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      toast.success('Pharmacy store photo updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedicine = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error('Please fill Medicine Name, Price, and Stock');
      return;
    }

    try {
      const response = await createShopkeeperMedicine(shopId, {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        category: formData.category,
        imageUrl: formData.imageUrl || '',
      });
      setMedicines(prev => [...prev, response.medicine]);
      toast.success('Medicine added successfully!');
      setFormData(emptyForm);
      setImagePreview('');
      setShowAddDialog(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add medicine';
      toast.error(message);
    }
  };

  const handleUpdateMedicine = async () => {
    if (!editingMedicine || !formData.name || !formData.price || !formData.stock) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const response = await updateShopkeeperMedicine(shopId, editingMedicine.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        category: formData.category,
        imageUrl: formData.imageUrl || '',
      });
      setMedicines(prev => prev.map(m => (m.id === editingMedicine.id ? response.medicine : m)));
      toast.success('Medicine updated!');
      setEditingMedicine(null);
      setFormData(emptyForm);
      setImagePreview('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update medicine';
      toast.error(message);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    try {
      await deleteShopkeeperMedicine(shopId, id);
      setMedicines(prev => prev.filter(m => m.id !== id));
      toast.success('Medicine removed from inventory');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete medicine';
      toast.error(message);
    }
  };

  const startEditing = (medicine: MedicineRecord) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      price: medicine.price.toString(),
      stock: medicine.stock.toString(),
      lowStockThreshold: medicine.lowStockThreshold.toString(),
      category: medicine.category,
      imageUrl: medicine.imageUrl || '',
    });
    setImagePreview(medicine.imageUrl || '');
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const response = await updateShopProfile(shopId, {
        name: shopProfile.name,
        ownerName: shopProfile.ownerName,
        address: shopProfile.address,
        area: shopProfile.area,
        phone: shopProfile.phone,
        email: shopProfile.email,
        license: shopProfile.license,
        openTime: shopProfile.openTime,
        closeTime: shopProfile.closeTime,
        imageUrl: shopProfile.imageUrl,
      });
      setShopProfile(response.shop);
      toast.success(response.message || 'Pharmacy store profile updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    onLogout?.();
    navigate('/');
  };

  const navItems: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
    { id: 'alerts', label: `Alerts ${(lowStockMedicines.length + outOfStockMedicines.length) > 0 ? `(${lowStockMedicines.length + outOfStockMedicines.length})` : ''}`, icon: <Bell className="w-4 h-4" /> },
    { id: 'profile', label: 'Pharmacy Store Profile', icon: <Store className="w-4 h-4" /> },
  ];

  const MedicineForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Image Upload */}
      <div>
        <Label className="mb-2 block">Medicine Image (Optional)</Label>
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-lg mx-auto" />
              <button
                onClick={(e) => { e.stopPropagation(); setImagePreview(''); setFormData(prev => ({ ...prev, imageUrl: '' })); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-gray-400">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Click to upload medicine photo</p>
              <p className="text-xs mt-1">JPG, PNG, WEBP (max 5MB)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="med-name">Medicine Name *</Label>
        <Input id="med-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Paracetamol 500mg" className="mt-1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="med-price">Price (₹) *</Label>
          <Input id="med-price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="45" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="med-stock">Stock Qty *</Label>
          <Input id="med-stock" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} placeholder="100" className="mt-1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="med-threshold">Low Stock Alert</Label>
          <Input id="med-threshold" type="number" value={formData.lowStockThreshold} onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })} placeholder="10" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="med-category">Category</Label>
          <select
            id="med-category"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <Button onClick={onSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">Pharmacy Store Panel</p>
                  <p className="text-xs text-gray-500 leading-tight">{shopProfile.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(lowStockMedicines.length + outOfStockMedicines.length) > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200 text-xs">
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lowStockMedicines.length + outOfStockMedicines.length} alerts</span>
              </div>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs">
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r min-h-[calc(100vh-56px)] sticky top-14 h-fit">
          <nav className="p-3 space-y-1 flex-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                {item.label}
                {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t">
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
              <p className="font-medium text-gray-700 mb-1">{currentUser.name}</p>
              <p>Pharmacy Store Account</p>
            </div>
          </div>
        </aside>

        {/* Mobile Nav Drawer */}
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
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">

          {/* OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Overview</h2>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Medicines', value: medicines.length, icon: <Package className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', color: 'text-blue-700' },
                  { label: 'In Stock', value: inStockMedicines.length, icon: <TrendingUp className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', color: 'text-green-700' },
                  { label: 'Low Stock', value: lowStockMedicines.length, icon: <AlertCircle className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50', color: 'text-amber-700' },
                  { label: 'Out of Stock', value: outOfStockMedicines.length, icon: <AlertCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50', color: 'text-red-700' },
                ].map(stat => (
                  <Card key={stat.label} className="p-4 border-0 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500">{stat.label}</p>
                      <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>{stat.icon}</div>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </Card>
                ))}
              </div>

              {/* Alerts Preview */}
              {(outOfStockMedicines.length > 0 || lowStockMedicines.length > 0) && (
                <Card className="p-4 border-0 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" /> Stock Alerts
                  </h3>
                  <div className="space-y-2">
                    {outOfStockMedicines.slice(0, 3).map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
                        <span className="text-sm text-gray-800">{m.name}</span>
                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                      </div>
                    ))}
                    {lowStockMedicines.slice(0, 3).map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg">
                        <span className="text-sm text-gray-800">{m.name}</span>
                        <Badge className="bg-amber-500 text-xs">{m.stock} left</Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="link" className="text-blue-600 text-sm p-0 mt-2" onClick={() => setActiveSection('alerts')}>
                    View all alerts →
                  </Button>
                </Card>
              )}

              {/* Recent inventory */}
              <Card className="p-4 border-0 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Recent Inventory</h3>
                  <Button onClick={() => setActiveSection('inventory')} variant="outline" size="sm" className="text-xs">
                    View All
                  </Button>
                </div>
                <div className="space-y-2">
                  {medicines.slice(0, 4).map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="w-9 h-9 bg-white border rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {m.imageUrl ? (
                          <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500">₹{m.price} • {m.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {m.stock === 0 ? (
                          <Badge variant="destructive" className="text-xs">Out</Badge>
                        ) : m.stock <= m.lowStockThreshold ? (
                          <Badge className="bg-amber-500 text-xs">{m.stock}</Badge>
                        ) : (
                          <Badge className="bg-green-600 text-xs">{m.stock}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* INVENTORY */}
          {activeSection === 'inventory' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900">Medicine Inventory</h2>
                <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) { setFormData(emptyForm); setImagePreview(''); } }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" /> Add Medicine
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Medicine</DialogTitle>
                      <DialogDescription>Add a new medicine to your inventory</DialogDescription>
                    </DialogHeader>
                    <MedicineForm onSubmit={handleAddMedicine} submitLabel="Add Medicine" />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search medicines..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Medicine Cards - Mobile */}
              <div className="block md:hidden space-y-3">
                {filteredMedicines.map(medicine => (
                  <Card key={medicine.id} className="p-4 border-0 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        {medicine.imageUrl ? (
                          <img src={medicine.imageUrl} alt={medicine.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{medicine.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{medicine.category}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-sm font-semibold text-green-700">₹{medicine.price}</span>
                          <span className="text-xs text-gray-500">{medicine.stock} units</span>
                          {medicine.stock === 0 ? (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          ) : medicine.stock <= medicine.lowStockThreshold ? (
                            <Badge className="bg-amber-500 text-xs">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-600 text-xs">In Stock</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Dialog
                        open={editingMedicine?.id === medicine.id}
                        onOpenChange={o => { if (!o) { setEditingMedicine(null); setFormData(emptyForm); setImagePreview(''); } }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => startEditing(medicine)} className="flex-1">
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Medicine</DialogTitle>
                            <DialogDescription>Update medicine details and pricing</DialogDescription>
                          </DialogHeader>
                          <MedicineForm onSubmit={handleUpdateMedicine} submitLabel="Update Medicine" />
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteMedicine(medicine.id)} className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Medicine Table - Desktop */}
              <Card className="hidden md:block border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Medicine</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMedicines.map(medicine => (
                        <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {medicine.imageUrl ? (
                                  <img src={medicine.imageUrl} alt={medicine.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-gray-300" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{medicine.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{medicine.category}</span>
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-green-700">₹{medicine.price}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{medicine.stock} units</td>
                          <td className="py-3 px-4">
                            {medicine.stock === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : medicine.stock <= medicine.lowStockThreshold ? (
                              <Badge className="bg-amber-500">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-green-600">In Stock</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog
                                open={editingMedicine?.id === medicine.id}
                                onOpenChange={o => { if (!o) { setEditingMedicine(null); setFormData(emptyForm); setImagePreview(''); } }}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => startEditing(medicine)}>
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                            <DialogTitle>Edit Medicine</DialogTitle>
                            <DialogDescription>Update medicine details and pricing</DialogDescription>
                          </DialogHeader>
                                  <MedicineForm onSubmit={handleUpdateMedicine} submitLabel="Update Medicine" />
                                </DialogContent>
                              </Dialog>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteMedicine(medicine.id)} className="text-red-600 hover:bg-red-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredMedicines.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No medicines found</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ALERTS */}
          {activeSection === 'alerts' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Stock Alerts</h2>
              {outOfStockMedicines.length === 0 && lowStockMedicines.length === 0 ? (
                <Card className="p-10 text-center border-0 shadow-sm">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">All Good!</h3>
                  <p className="text-gray-500 text-sm">No stock alerts. All medicines are well-stocked.</p>
                </Card>
              ) : (
                <>
                  {outOfStockMedicines.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Out of Stock ({outOfStockMedicines.length})
                      </h3>
                      <div className="space-y-2">
                        {outOfStockMedicines.map(m => (
                          <Alert key={m.id} variant="destructive" className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="flex items-center justify-between">
                              <span>{m.name} — <strong>0 units remaining</strong></span>
                              <Button size="sm" variant="outline" onClick={() => { startEditing(m); setActiveSection('inventory'); }} className="ml-2 text-xs">
                                Update Stock
                              </Button>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  {lowStockMedicines.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Low Stock ({lowStockMedicines.length})
                      </h3>
                      <div className="space-y-2">
                        {lowStockMedicines.map(m => (
                          <Alert key={m.id} className="border-amber-200 bg-amber-50">
                            <Bell className="h-4 w-4 text-amber-500" />
                            <AlertDescription className="flex items-center justify-between">
                              <span className="text-amber-800">{m.name} — <strong>{m.stock} units left</strong> (threshold: {m.lowStockThreshold})</span>
                              <Button size="sm" variant="outline" onClick={() => { startEditing(m); setActiveSection('inventory'); }} className="ml-2 text-xs">
                                Update
                              </Button>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-900">Pharmacy Store Profile</h2>

              {/* Shop Image */}
              <Card className="p-5 border-0 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Shop Photo</h3>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-200 flex-shrink-0">
                    {shopProfile.imageUrl ? (
                      <img src={shopProfile.imageUrl} alt="Shop" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-xs">No photo</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Upload a clear photo of your pharmacy storefront. This will be visible to customers searching for medicines.</p>
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors w-fit">
                        <Upload className="w-4 h-4" />
                        Upload Shop Photo
                      </div>
                      <input type="file" accept="image/*" onChange={handleShopImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </Card>

              {/* Pharmacy Store Details */}
              <Card className="p-5 border-0 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Pharmacy Store Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Pharmacy Store Name', key: 'name', type: 'text' },
                    { label: 'Owner Name', key: 'ownerName', type: 'text' },
                    { label: 'Phone Number', key: 'phone', type: 'tel' },
                    { label: 'Email Address', key: 'email', type: 'email' },
                    { label: 'Drug License No.', key: 'license', type: 'text' },
                    { label: 'Full Address', key: 'address', type: 'text' },
                    { label: 'Opening Time', key: 'openTime', type: 'time' },
                    { label: 'Closing Time', key: 'closeTime', type: 'time' },
                  ].map((field) => (
                    <div key={field.key}>
                      <Label className="text-sm mb-1 block">{field.label}</Label>
                      <Input
                        type={field.type}
                        value={shopProfile[field.key as keyof typeof shopProfile]}
                        onChange={e => setShopProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </Card>

              {/* Verification Status */}
              <Card className="p-5 border border-green-200 bg-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Your pharmacy is Live on PillPoint</p>
                    <p className="text-green-700 text-sm mt-0.5">Customers across India can find and contact your pharmacy. Admin has approved your license.</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
