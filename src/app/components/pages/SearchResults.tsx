import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import {
  MapPin,
  Phone,
  Star,
  Navigation,
  Upload,
  Filter,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  ShoppingCart,
  X,
  Loader2,
  Sparkles,
  FlaskConical,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import MedicineContactDialog from '../MedicineContactDialog';
import Navbar from '../Navbar';
import type { User } from '../../App';
import { toast } from 'sonner';
import { extractPrescription, fetchSearchResults, type SearchAssistant, type SearchResult } from '../../lib/api';
import { useCart } from '../../lib/cart';

const SEARCH_SEGMENT_SPLIT_RE = /(?:,|\/|;|\||&|\band\b|\n)+/i;
const SEARCH_NOISE_WORDS = new Set([
  'plot', 'sardar', 'patel', 'colony', 'consultant', 'neuro', 'psychiatrist', 'regd', 'reg',
  'no', 'telephone', 'resi', 'emergency', 'doctor', 'patient', 'male', 'female', 'age', 'address',
  'clinic', 'hospital', 'medical', 'psychiatry', 'counsell', 'counsellor', 'secunderabad',
  'hashmathpet', 'trimulgherry', 'tirumalagiri', 'socunderabed', 'call', 'me', 'mobile', 'phone',
  'plotno', 'consult', 'consultation', 'history', 'report', 'reports', 'name', 'signature', 'stamp',
  'blood', 'test', 'tests', 'lab', 'labs', 'weight', 'height', 'dob', 'date', 'prescription', 'medicine',
  'medication', 'today', 'tomorrow', 'yesterday', 'day', 'days', 'week', 'weeks', 'month', 'months',
]);

const MEDICINE_SUFFIXES = [
  'mab', 'pril', 'sartan', 'olol', 'statin', 'prazole', 'cillin', 'mycin', 'vir', 'azole',
  'tidine', 'dine', 'caine', 'floxacin', 'fenac', 'nide', 'semide', 'thiazide', 'oxetine',
  'dipine', 'parin', 'sone', 'done', 'lamide', 'azole', 'formin', 'xazole', 'trazole',
];

const MEDICINE_ALLOWLIST = new Set([
  'paracetamol', 'azithromycin', 'cetirizine', 'amoxicillin', 'omeprazole', 'vitamin', 'vitaminc',
  'ibuprofen', 'metformin', 'atorvastatin', 'aspirin', 'montelukast', 'aceclofenac', 'diclofenac',
  'cotrimoxazole', 'crocin', 'dolo', 'combiflam', 'pan', 'pantoprazole', 'rabeprazole', 'lansoprazole',
]);

const SHORT_VARIANT_WORDS = new Set(['p', 'plus', 'sr', 'xl', 'ds', 'forte']);

const normalizeToken = (token: string) => token.toLowerCase().replace(/[^a-z0-9]/g, '');

const titleCaseToken = (token: string) => token ? token[0].toUpperCase() + token.slice(1).toLowerCase() : '';

const countVowels = (token: string) => (token.match(/[aeiou]/g) || []).length;

const looksMedicineLike = (token: string) => {
  if (!token) return false;
  if (MEDICINE_ALLOWLIST.has(token)) return true;
  if (token.length <= 2) return SHORT_VARIANT_WORDS.has(token);
  return MEDICINE_SUFFIXES.some((suffix) => token.endsWith(suffix));
};

const normalizeSearchQuery = (input: string) => {
  const segments = String(input || '').split(SEARCH_SEGMENT_SPLIT_RE);
  const candidates = new Set<string>();

  for (const rawSegment of segments) {
    const segment = rawSegment.trim();
    if (!segment) continue;

    const dosageMatch = segment.match(/\b\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|units?)\b/i);
    const searchSegment = dosageMatch ? segment.slice(0, dosageMatch.index).trim() : segment;
    const tokens = searchSegment.match(/[A-Za-z][A-Za-z0-9'.-]*/g) || [];
    const normalizedTokens = tokens.map(normalizeToken).filter(Boolean);

    if (!normalizedTokens.length) continue;

    const filteredTokens = normalizedTokens.filter((token) => !SEARCH_NOISE_WORDS.has(token));
    if (!filteredTokens.length) continue;

    const medicineHints = filteredTokens.filter(looksMedicineLike);
    const isLongNoise = filteredTokens.length > 3 && !dosageMatch && medicineHints.length === 0;
    if (isLongNoise) continue;

    if (filteredTokens.length === 1) {
      const token = filteredTokens[0];
      if (token.length >= 4 && (MEDICINE_ALLOWLIST.has(token) || looksMedicineLike(token))) {
        candidates.add(titleCaseToken(token));
      }
      continue;
    }

    if (filteredTokens.length === 2) {
      const [first, second] = filteredTokens;
      const isVariantPair = SHORT_VARIANT_WORDS.has(second);
      const looksPronounceable = countVowels(first) >= 2;
      if (medicineHints.length > 0 || dosageMatch || (first.length >= 4 && isVariantPair && looksPronounceable)) {
        candidates.add(filteredTokens.map(titleCaseToken).join(' '));
      }
      continue;
    }

    if (filteredTokens.length === 3) {
      if (medicineHints.length > 0 || dosageMatch || MEDICINE_ALLOWLIST.has(filteredTokens[0])) {
        candidates.add(filteredTokens.slice(0, 3).map(titleCaseToken).join(' '));
      }
    }
  }

  return Array.from(candidates).slice(0, 6).join(', ');
};

interface SearchResultsProps {
  currentUser: User | null;
  onLogout?: () => void;
}

export default function SearchResults({ currentUser, onLogout }: SearchResultsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';
  const searchDescription = searchParams.get('desc') || '';
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery);
  const activeSearchQuery = [searchQuery, searchDescription].filter(Boolean).join(' | ');
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [patientDescription, setPatientDescription] = useState(searchDescription);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [locationError, setLocationError] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [ocrSummary, setOcrSummary] = useState('');
  const [ocrFeedback, setOcrFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [assistantInfo, setAssistantInfo] = useState<SearchAssistant | null>(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<SearchResult | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'instock'>('all');
  const prescriptionInputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useCart();

  const clearUploadQueryParam = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('upload');
    setSearchParams(next, { replace: true });
  };

  const showPrescriptionInvite = searchParams.get('upload') === '1';

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setPatientDescription(searchDescription);
  }, [searchDescription]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Location access is not supported in this browser.');
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('ready');
        setLocationError('');
      },
      (error) => {
        setUserLocation(null);
        setLocationStatus('error');
        setLocationError(error.message || 'Location access was denied.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadResults = async () => {
      setIsLoading(true);
      try {
        const response = await fetchSearchResults({
          query: normalizedSearchQuery || searchQuery,
          description: searchDescription,
          lat: userLocation?.latitude,
          lng: userLocation?.longitude,
          stock: 'all',
          sort: sortBy,
        });
        if (isMounted) {
          setResults(response.results);
          setAssistantInfo(response.assistant ?? null);
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : 'Unable to load search results';
          toast.error(message);
          setResults([]);
          setAssistantInfo(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      isMounted = false;
    };
  }, [activeSearchQuery, sortBy, userLocation?.latitude, userLocation?.longitude]);

  const sortedResults = [...results]
    .filter(r => stockFilter === 'all' || r.inStock)
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      return a.price - b.price;
    });

  const commitSearch = (queryValue: string, descriptionValue = patientDescription.trim()) => {
    const cleanedQuery = normalizeSearchQuery(queryValue).trim();
    const trimmedQuery = cleanedQuery || queryValue.trim();
    const params = new URLSearchParams();

    if (trimmedQuery) {
      params.set('q', trimmedQuery);
    }

    if (descriptionValue.trim()) {
      params.set('desc', descriptionValue.trim());
    }

    const search = params.toString();
    navigate(search ? `/search?${search}` : '/search');
  };

  const handleSearch = () => {
    commitSearch(localQuery);
  };

  const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  const handleDescriptionSearch = () => {
    const descriptionValue = patientDescription.trim();

    if (!descriptionValue && !localQuery.trim()) {
      return;
    }

    commitSearch(localQuery, descriptionValue);
  };

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setIsOcrRunning(true);
      setOcrSummary('');
      setOcrFeedback(null);

      try {
        const response = await extractPrescription(file);
        const detectedMedicines = response.medicines
          .map((medicine) => normalizeSearchQuery(medicine.name).trim())
          .filter(Boolean);
        const recognizedQuery = normalizeSearchQuery(response.searchQuery || response.assistant?.normalizedQuery || '').trim() || detectedMedicines.join(', ');

        if (!recognizedQuery) {
          throw new Error('No medicine names were detected. Try a clearer prescription image.');
        }

        setLocalQuery(recognizedQuery);
        commitSearch(recognizedQuery);
        setOcrSummary(detectedMedicines.length > 0 ? detectedMedicines.join(', ') : recognizedQuery);
        setOcrFeedback({ type: 'success', message: `Medicine names detected: ${recognizedQuery}` });
        toast.success(`Medicine names detected: ${recognizedQuery}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to read the prescription image';
        setOcrFeedback({ type: 'error', message });
        toast.error(message);
      } finally {
        setIsOcrRunning(false);
        e.target.value = '';
      }
    }
  };

  const handleContactPharmacy = (pharmacy: SearchResult) => {
    setSelectedPharmacy(pharmacy);
    setShowContactDialog(true);
  };

  const handleDirections = (pharmacy: SearchResult) => {
    const destination = `${pharmacy.lat},${pharmacy.lng}`;
    const origin = userLocation ? `${userLocation.latitude},${userLocation.longitude}` : '';
    const mapsUrl = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;

    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const lowestPrice = sortedResults.length > 0 ? Math.min(...sortedResults.map(r => r.price)) : 0;
  const displayedQuery = assistantInfo?.normalizedQuery || searchQuery || searchDescription || 'all medicines';

  const assistantBadgeLabel = assistantInfo
    ? assistantInfo.mode === 'symptom'
      ? 'Symptom to medicine'
      : assistantInfo.mode === 'medicine'
        ? 'Medicine alternatives'
        : 'Smart suggestions'
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      {/* Browsers block file picker unless opened from a real click — show CTA instead of auto-opening */}
      {showPrescriptionInvite && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 border-b border-blue-800/20 shadow-md z-40 relative">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm font-medium text-blue-50 pr-2">
              Upload a clear photo of your prescription — we detect medicine names and search availability for you.
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-sm"
                onClick={() => prescriptionInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose prescription image
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-white hover:bg-white/15 border border-white/30"
                onClick={clearUploadQueryParam}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar — top-16 matches Navbar row height (h-16); z-40 keeps controls above page content */}
      <div className="sticky top-16 z-40 border-b bg-white shadow-sm isolate">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="touch-manipulation flex-shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <form
              className="flex min-w-0 flex-1 touch-manipulation flex-col gap-2 sm:flex-row sm:items-center"
              onSubmit={handleSearchFormSubmit}
              role="search"
              aria-label="Medicine search"
            >
              <Input
                name="q"
                autoComplete="off"
                enterKeyHint="search"
                inputMode="search"
                value={localQuery}
                onChange={e => setLocalQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.nativeEvent.isComposing) {
                    e.preventDefault();
                  }
                }}
                placeholder="Search medicines (e.g., Paracetamol, acidity)"
                className="min-h-11 w-full min-w-0 flex-1 py-2.5 sm:min-w-[12rem]"
              />
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-stretch">
                <Button
                  type="button"
                  variant="outline"
                  onClick={e => {
                    e.preventDefault();
                    prescriptionInputRef.current?.click();
                  }}
                  disabled={isOcrRunning}
                  className="min-h-11 w-full border-purple-200 text-purple-700 hover:bg-purple-50 sm:min-w-[8.5rem] sm:shrink-0"
                >
                  {isOcrRunning ? <Loader2 className="h-4 w-4 mr-1.5 shrink-0 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5 shrink-0" />}
                  <span className="hidden sm:inline">{isOcrRunning ? 'Reading...' : 'Upload Prescription'}</span>
                  <span className="sm:hidden">{isOcrRunning ? 'Reading' : 'Upload'}</span>
                </Button>
                <Button
                  type="submit"
                  className="min-h-11 w-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 sm:min-w-[6.5rem] sm:shrink-0"
                >
                  Search
                </Button>
              </div>
            </form>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-label="Toggle sort filters"
              className={`touch-manipulation flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors ${showFilters ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
          <input
            id="prescription-upload-input"
            ref={prescriptionInputRef}
            type="file"
            accept="image/*"
            onChange={handlePrescriptionUpload}
            className="sr-only"
          />

          {ocrSummary && (
            <div className="mt-2 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs text-purple-700">
              OCR detected: {ocrSummary}
            </div>
          )}

          {/* Filter bar */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Filter by:</span>
                <div className="flex gap-1">
                  {[
                    { val: 'distance', label: 'Distance' },
                    { val: 'price', label: 'Price' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setSortBy(opt.val as typeof sortBy)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        sortBy === opt.val ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Stock:</span>
                <button
                  onClick={() => setStockFilter(stockFilter === 'all' ? 'instock' : 'all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    stockFilter === 'instock' ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  {stockFilter === 'instock' ? '✓ In Stock Only' : 'In Stock Only'}
                </button>
              </div>
            </div>
          )}
          <div
            className={`mt-3 flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${
              locationStatus === 'ready'
                ? 'border-green-100 bg-green-50 text-green-700'
                : locationStatus === 'error'
                  ? 'border-amber-100 bg-amber-50 text-amber-700'
                  : 'border-blue-100 bg-blue-50 text-blue-700'
            }`}
          >
            <div>
              {locationStatus === 'ready' && <p>Using your current location to calculate distance and directions.</p>}
              {locationStatus === 'loading' && <p>Detecting your location for nearest pharmacy sorting...</p>}
              {locationStatus === 'error' && <p>{locationError || 'Location access is off. Distance will use pharmacy coordinates until you allow it.'}</p>}
            </div>
            {locationStatus === 'error' && (
              <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Left: Prescription & sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Prescription Reader */}
            <Card className="p-4 border-0 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-600" />
                Prescription Reader
              </h3>
              <p className="text-xs text-gray-500 mb-3">Use the upload button beside the search bar to scan a prescription and auto-fill the medicine search.</p>
              <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                <label htmlFor="patient-description" className="block text-sm font-medium text-gray-800 mb-2">
                  Description
                </label>
                <div className="relative">
                  <Textarea
                    id="patient-description"
                    value={patientDescription}
                    onChange={(e) => setPatientDescription(e.target.value)}
                    placeholder="Describe symptoms, diseases, allergies, or duration. Example: fever for 2 days, body pain, diabetes, and acidity."
                    className="min-h-28 rounded-xl border border-blue-100 bg-white px-4 py-3 pr-14 pb-12 text-gray-900 placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleDescriptionSearch}
                    disabled={!patientDescription.trim() && !localQuery.trim()}
                    aria-label="Search with patient description"
                    className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  The AI will combine this with the prescription to suggest medicines in a better way.
                </p>
              </div>
              {uploadedImage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-purple-100 bg-purple-50 px-3 py-2">
                    <span className="text-sm text-purple-700 truncate">{uploadedImage.name}</span>
                    <button onClick={() => { setUploadedImage(null); setOcrSummary(''); setOcrFeedback(null); }} className="flex-shrink-0">
                      <X className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>
                  {ocrFeedback ? (
                    <div
                      className={`rounded-xl px-3 py-2 text-xs ${
                        ocrFeedback.type === 'success'
                          ? 'border border-blue-100 bg-blue-50 text-blue-700'
                          : 'border border-rose-100 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {ocrFeedback.message}
                    </div>
                  ) : ocrSummary ? (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      Detected medicines: {ocrSummary}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      Reading prescription text...
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                ⚠️ OCR results are suggestions only. Always consult your doctor.
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 border-0 shadow-sm text-center">
                <p className="text-xl font-bold text-green-600">{sortedResults.filter(r => r.inStock).length}</p>
                <p className="text-xs text-gray-500">In Stock</p>
              </Card>
              <Card className="p-3 border-0 shadow-sm text-center">
                <p className="text-xl font-bold text-blue-600">₹{lowestPrice}</p>
                <p className="text-xs text-gray-500">Lowest Price</p>
              </Card>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{sortedResults.length} pharmacies</span> found for "<span className="text-blue-600">{displayedQuery}</span>"
              </p>
            </div>

            {isLoading && (
              <Card className="mb-3 border-0 p-4 shadow-sm text-sm text-gray-500">
                Loading live pharmacy results...
              </Card>
            )}

            {assistantInfo && (
              <Card className="mb-4 overflow-hidden border border-indigo-100 shadow-lg shadow-indigo-950/10 bg-gradient-to-br from-indigo-50/95 via-white to-violet-50/90 ring-1 ring-indigo-100/60">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" aria-hidden />
                <div className="p-5 md:p-6 space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-white/50">
                        <Sparkles className="h-7 w-7" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full border-0 bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                            AI guidance
                          </Badge>
                          <Badge
                            variant="outline"
                            className="rounded-full border-indigo-200 bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-800 shadow-sm"
                          >
                            {assistantBadgeLabel}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-gray-900 md:text-[1.35rem]">
                          {assistantInfo.summary}
                        </h3>
                        {assistantInfo.explanation && (
                          <p className="mt-2 text-base leading-relaxed text-gray-600">{assistantInfo.explanation}</p>
                        )}
                      </div>
                    </div>
                    {assistantInfo.activeIngredient && (
                      <div className="flex w-full shrink-0 items-center gap-3 rounded-2xl border border-indigo-100 bg-white/90 px-4 py-3 shadow-sm sm:w-auto sm:min-w-[12rem]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                          <FlaskConical className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">Active ingredient</p>
                          <p className="mt-0.5 text-base font-bold text-gray-900">{assistantInfo.activeIngredient}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {assistantInfo.suggestedMedicines.length > 0 && (
                    <div className="rounded-2xl border border-indigo-100/80 bg-white/70 p-4 shadow-inner">
                      <div className="mb-3 flex items-center gap-2">
                        <Search className="h-5 w-5 text-indigo-600" />
                        <p className="text-sm font-bold uppercase tracking-wide text-indigo-900">Suggested searches</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {assistantInfo.suggestedMedicines.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => commitSearch(suggestion)}
                            className="inline-flex items-center gap-2 rounded-full border-2 border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-800 shadow-md shadow-indigo-900/5 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-lg active:scale-[0.98]"
                          >
                            <Search className="h-4 w-4 shrink-0 text-indigo-500" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {assistantInfo.sameSaltAlternatives.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-violet-600" />
                        <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Same salt alternatives</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {assistantInfo.sameSaltAlternatives.map((alternative) => (
                          <button
                            key={alternative.id}
                            type="button"
                            onClick={() => commitSearch(alternative.name)}
                            className="rounded-2xl border-2 border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-gray-900">{alternative.name}</p>
                                <p className="mt-1 text-sm text-gray-600">{alternative.reason}</p>
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {alternative.shopName ? `${alternative.shopName} · ` : ''}
                                  {alternative.category}
                                  {alternative.distance ? ` · ${alternative.distance} km` : ''}
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-lg font-bold text-green-700">₹{alternative.price}</p>
                                <Badge
                                  className={`mt-2 px-2.5 py-0.5 text-xs font-semibold ${
                                    alternative.inStock
                                      ? 'border-green-200 bg-green-100 text-green-800'
                                      : 'border-gray-200 bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {alternative.inStock ? 'In Stock' : 'Out of Stock'}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {assistantInfo.caution && (
                    <div className="flex gap-3 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-3.5 text-sm leading-relaxed text-amber-950 shadow-sm">
                      <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
                      <p className="font-medium">{assistantInfo.caution}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {sortedResults.map((pharmacy, idx) => (
                <Card key={pharmacy.id} className={`overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow ${!pharmacy.inStock ? 'opacity-75' : ''}`}>
                  {/* Best Deal Badge */}
                  {idx === 0 && pharmacy.inStock && (
                    <div className="bg-green-600 text-white text-xs font-semibold px-3 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Best Option — Closest with lowest price
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Shop Image */}
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {pharmacy.shopImage && (
                          <ImageWithFallback src={pharmacy.shopImage} alt={pharmacy.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{pharmacy.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{pharmacy.address}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-green-700">₹{pharmacy.price}</p>
                            {pharmacy.inStock ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">In Stock</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium text-gray-700">{pharmacy.rating}</span>
                            <span>({pharmacy.reviews})</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{pharmacy.distance} km away</span>
                          </div>
                          <span>Open {pharmacy.openTime}–{pharmacy.closeTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Medicine Preview */}
                    {pharmacy.medicineImage && pharmacy.inStock && (
                      <div className="mt-3 flex items-center gap-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white border">
                          <ImageWithFallback src={pharmacy.medicineImage} alt={searchQuery} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Enquiring about</p>
                          <p className="text-sm font-medium text-gray-800">{pharmacy.medicineName || searchQuery}</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-xs text-gray-400">MRP</p>
                          <p className="text-sm font-bold text-green-700">₹{pharmacy.price}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        onClick={() => handleContactPharmacy(pharmacy)}
                        disabled={!pharmacy.inStock}
                        className="bg-blue-600 hover:bg-blue-700 text-xs flex-1 sm:flex-none"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Confirm Availability
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          addItem(pharmacy);
                          toast.success(`${pharmacy.medicineName || pharmacy.name} added to cart`);
                        }}
                        disabled={!pharmacy.inStock}
                        className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`tel:${pharmacy.phone}`)}
                        className="text-xs"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDirections(pharmacy)} className="text-xs">
                        <Navigation className="w-3.5 h-3.5 mr-1.5" />
                        Directions
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <p>⚠️ <strong>Medical Disclaimer:</strong> Always consult a qualified doctor before purchasing or taking any medicine. PillPoint only helps you locate medicines at nearby pharmacies.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      {selectedPharmacy && (
        <MedicineContactDialog
          open={showContactDialog}
          onOpenChange={setShowContactDialog}
          pharmacy={{
            id: selectedPharmacy.id,
            name: selectedPharmacy.name,
            address: selectedPharmacy.address,
            phone: selectedPharmacy.phone,
            shopImage: selectedPharmacy.shopImage,
          }}
          medicine={{
            name: selectedPharmacy.medicineName || searchQuery,
            price: selectedPharmacy.price,
            image: selectedPharmacy.medicineImage,
          }}
        />
      )}
    </div>
  );
}
