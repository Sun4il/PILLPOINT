import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Phone, User as UserIcon, Mail, Building2, MapPin, Clock, FileText, Pill, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { toast } from 'sonner';
import type { User, UserRole } from '../../App';
import { requestOtp, verifyOtp } from '../../lib/api';

interface AuthPageProps {
  setCurrentUser: (user: User) => void;
}

export default function AuthPage({ setCurrentUser }: AuthPageProps) {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');

  // Form states
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Pharmacy store specific
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [license, setLicense] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [shopLatitude, setShopLatitude] = useState('');
  const [shopLongitude, setShopLongitude] = useState('');

  const captureShopLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location access is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setShopLatitude(position.coords.latitude.toFixed(6));
        setShopLongitude(position.coords.longitude.toFixed(6));
        toast.success('Store location captured.');
      },
      () => {
        toast.error('Unable to capture store location. Please allow location access or enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const roleTitle = role === 'user' ? 'Customer' : role === 'shopkeeper' ? 'Pharmacy Store' : 'Admin';
  const roleColor = role === 'admin' ? 'from-purple-700 to-purple-900' : role === 'shopkeeper' ? 'from-green-700 to-green-900' : 'from-blue-700 to-blue-900';

  const handleSendOTP = () => {
    if (!role || !['user', 'shopkeeper', 'admin'].includes(role)) {
      toast.error('Invalid role selected');
      return;
    }
    if (!mobile || mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    requestOtp({ mobile, role: role as UserRole })
      .then((response) => {
        toast.success(response.message || `OTP sent to +91-${mobile}`);
        setShowOTP(true);
      })
      .catch((error: Error) => {
        toast.error(error.message);
      });
  };

  const handleVerifyOTP = () => {
    if (!role || !['user', 'shopkeeper', 'admin'].includes(role)) {
      toast.error('Invalid role selected');
      return;
    }
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    if (role === 'shopkeeper' && authMode === 'signup' && (!shopLatitude.trim() || !shopLongitude.trim())) {
      toast.error('Please capture or enter your store location before registering.');
      return;
    }

    verifyOtp({
      mobile,
      role: role as UserRole,
      mode: authMode,
      otp,
      name,
      email,
      shopName,
      shopAddress,
      license,
      openTime,
      closeTime,
      latitude: shopLatitude ? Number(shopLatitude) : undefined,
      longitude: shopLongitude ? Number(shopLongitude) : undefined,
    })
      .then((response) => {
        const authenticatedUser: User = response.user;
        setCurrentUser(authenticatedUser);
        toast.success(response.message || 'Successfully authenticated!');
        navigate(`/${role}/dashboard`);
      })
      .catch((error: Error) => {
        toast.error(error.message);
      });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${roleColor} flex flex-col`}>
      {/* Top bar */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back to Home</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold">PillPoint</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className={`w-14 h-14 bg-gradient-to-br ${roleColor} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
              {role === 'shopkeeper' ? <Building2 className="w-7 h-7 text-white" /> : role === 'admin' ? <FileText className="w-7 h-7 text-white" /> : <UserIcon className="w-7 h-7 text-white" />}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{roleTitle} {authMode === 'login' ? 'Login' : 'Registration'}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {role === 'admin' ? 'Admin access only' : role === 'shopkeeper' ? 'Register or login your pharmacy store' : 'Find medicines across India'}
            </p>
          </div>

          <Tabs value={authMode} onValueChange={(v) => { setAuthMode(v as 'login' | 'signup'); setShowOTP(false); setOtp(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-5">
              <TabsTrigger value="login">Login</TabsTrigger>
              {role !== 'admin' && <TabsTrigger value="signup">Sign Up</TabsTrigger>}
              {role === 'admin' && <TabsTrigger value="signup" disabled>Admin only</TabsTrigger>}
            </TabsList>

            <TabsContent value="login">
              {!showOTP ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">+91</span>
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={mobile}
                        onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="pl-12"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <Button onClick={handleSendOTP} className="w-full bg-blue-600 hover:bg-blue-700">
                    Send OTP
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <Label className="block mb-1">Enter 6-Digit OTP</Label>
                    <p className="text-sm text-gray-500 mb-4">Sent to +91-{mobile}</p>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <Button onClick={handleVerifyOTP} className="w-full bg-blue-600 hover:bg-blue-700">
                    Verify & Login
                  </Button>
                  <Button onClick={() => { setShowOTP(false); setOtp(''); }} variant="outline" className="w-full">
                    Change Number
                  </Button>
                  <p className="text-xs text-center text-gray-400">Demo: Enter any 6 digits to login</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signup">
              {!showOTP ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative mt-1">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="signup-name" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input id="signup-email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signup-mobile">Mobile Number</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">+91</span>
                      <Input id="signup-mobile" type="tel" placeholder="10-digit mobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} className="pl-12" maxLength={10} />
                    </div>
                  </div>

                  {role === 'shopkeeper' && (
                    <>
                      <div>
                        <Label htmlFor="shop-name">Pharmacy Store Name</Label>
                        <div className="relative mt-1">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input id="shop-name" placeholder="Your pharmacy store name" value={shopName} onChange={e => setShopName(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="shop-address">Shop Address</Label>
                        <div className="relative mt-1">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input id="shop-address" placeholder="Full shop address in India" value={shopAddress} onChange={e => setShopAddress(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="license">Drug License Number</Label>
                        <div className="relative mt-1">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input id="license" placeholder="e.g., DL-RJ-2024-123456" value={license} onChange={e => setLicense(e.target.value)} className="pl-10" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="open-time">Opening Time</Label>
                          <div className="relative mt-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input id="open-time" type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="pl-10" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="close-time">Closing Time</Label>
                          <div className="relative mt-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input id="close-time" type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="pl-10" />
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Store Location</p>
                            <p className="text-xs text-gray-500">Capture your pharmacy location for distance and directions.</p>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={captureShopLocation}>
                            <MapPin className="w-4 h-4 mr-1.5" />
                            Use Current Location
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="shop-latitude">Latitude</Label>
                            <Input
                              id="shop-latitude"
                              type="number"
                              step="any"
                              placeholder="26.9124"
                              value={shopLatitude}
                              onChange={(e) => setShopLatitude(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shop-longitude">Longitude</Label>
                            <Input
                              id="shop-longitude"
                              type="number"
                              step="any"
                              placeholder="75.7873"
                              value={shopLongitude}
                              onChange={(e) => setShopLongitude(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                        ⚠️ After registration, Admin will verify your drug license before activating your pharmacy on PillPoint (24–48 hours).
                      </div>
                    </>
                  )}

                  <Button onClick={handleSendOTP} className="w-full bg-blue-600 hover:bg-blue-700">
                    Send OTP & Register
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <Label className="block mb-1">Verify with OTP</Label>
                    <p className="text-sm text-gray-500 mb-4">Sent to +91-{mobile}</p>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <Button onClick={handleVerifyOTP} className="w-full bg-blue-600 hover:bg-blue-700">
                    Verify & Sign Up
                  </Button>
                  <Button onClick={() => { setShowOTP(false); setOtp(''); }} variant="outline" className="w-full">
                    Go Back
                  </Button>
                  <p className="text-xs text-center text-gray-400">Demo: Enter any 6 digits to register</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}