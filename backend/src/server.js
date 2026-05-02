import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import morgan from 'morgan';
import os from 'os';
import multer from 'multer';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const backendEnvFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(process.cwd(), '.env.example'),
  path.resolve(process.cwd(), '..', '.env.example'),
  path.resolve(process.cwd(), 'backend', '.env.example'),
];

const loadEnvFile = (envFile) => {
  if (!fs.existsSync(envFile)) {
    return;
  }

  const parsedEnv = dotenv.parse(fs.readFileSync(envFile));
  for (const [key, value] of Object.entries(parsedEnv)) {
    if (process.env[key] === undefined && value !== '') {
      process.env[key] = value;
    }
  }
};

for (const envFile of backendEnvFiles) {
  loadEnvFile(envFile);
}

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const easyOcrScriptPath = path.join(backendRoot, 'src', 'easyocr_reader.py');

const configuredPython = process.env.PYTHON_BIN?.trim() || '';
const workspacePython = process.platform === 'win32'
  ? path.resolve(backendRoot, '..', '.venv', 'Scripts', 'python.exe')
  : path.resolve(backendRoot, '..', '.venv', 'bin', 'python');
const virtualEnvPython = process.env.VIRTUAL_ENV
  ? (process.platform === 'win32'
    ? path.join(process.env.VIRTUAL_ENV, 'Scripts', 'python.exe')
    : path.join(process.env.VIRTUAL_ENV, 'bin', 'python'))
  : '';
const pythonCommand = configuredPython
  || (fs.existsSync(workspacePython) ? workspacePython : '')
  || (virtualEnvPython && fs.existsSync(virtualEnvPython) ? virtualEnvPython : '')
  || (process.platform === 'win32' ? 'python' : 'python3');
const pythonCommandArgs = [];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Create backend/.env and set your MongoDB connection string.');
  process.exit(1);
}

const shopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    ownerMobile: { type: String, required: true, trim: true },
    ownerEmail: { type: String, trim: true, default: '' },
    address: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    license: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '22:00' },
    imageUrl: { type: String, default: '' },
    rating: { type: Number, default: 4.5 },
    reviews: { type: Number, default: 0 },
    latitude: { type: Number, default: 26.9124 },
    longitude: { type: Number, default: 75.7873 },
  },
  { timestamps: true }
);

const medicineSchema = new mongoose.Schema(
  {
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    category: { type: String, default: 'Other', trim: true },
    imageUrl: { type: String, default: '' },
    distanceKm: { type: Number, default: 1.5, min: 0 },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    mobile: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'shopkeeper', 'admin'], required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
    shopName: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    license: { type: String, default: '' },
    openTime: { type: String, default: '' },
    closeTime: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.index({ mobile: 1, role: 1 }, { unique: true });

const Shop = mongoose.models.Shop || mongoose.model('Shop', shopSchema);
const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const prescriptionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const demoShopBrands = [
  'Apollo Pharmacy',
  'MedPlus',
  'Wellness Forever',
  'HealthBuddy Pharmacy',
  'Generic Medicos',
  'Pharmawell Pharmacy',
  'Jan Aushadhi Kendra',
  'Life Care Pharmacy',
  'Apollo Medical Store',
  'MediHub Pharmacy',
  'Cure Well Pharmacy',
  'City Medical Hall',
  'Raj Pharmacy',
  'India Drug House',
  'Safa Medical Store',
  'Navjeevan Pharmacy',
  'Sanjivani Medical',
  'Arogya Pharmacy',
  'Shreeji Pharmacy',
  'Mahaveer Medical',
  'Indira Medical Hall',
  'Gandhi Pharmacy',
  'Bhawani Medical Store',
  'Arihant Pharmacy',
  'JAI Medical Store',
  'Ratan Pharmacy',
  'Sagar Medical Hall',
  'Shivam Pharmacy',
  'Anand Medical',
  'Ayush Pharmacy',
];

const demoOwnerNames = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Mehta', 'Vijay Singh', 'Anita Gupta',
  'Rakesh Verma', 'Neha Jain', 'Deepak Yadav', 'Pooja Joshi', 'Manish Bansal', 'Kavita Agarwal',
  'Suresh Bhatia', 'Meenakshi Jain', 'Arun Kapoor', 'Seema Verma', 'Nitin Gupta', 'Anjali Sharma',
  'Raj Malhotra', 'Sneha Choudhary', 'Vikram Singh', 'Komal Mehta', 'Harish Kumar', 'Ritu Sharma',
  'Sanjay Patel', 'Preeti Jain', 'Alok Singh', 'Megha Gupta', 'Tarun Bhatia', 'Nandini Sharma',
];

const demoShopImages = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
  'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
  'https://images.unsplash.com/photo-1596428091679-61cfee25ac53?w=400',
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
];

const demoShopLocations = [
  { area: 'Mansarovar', address: 'Near Pink Square Mall, Mansarovar', latitude: 26.8766, longitude: 75.7690, openTime: '08:00', closeTime: '22:00', rating: 4.5, reviews: 234, distanceKm: 0.8 },
  { area: 'C-Scheme', address: 'C-Scheme, Near Rajasthan Club', latitude: 26.9050, longitude: 75.7995, openTime: '09:00', closeTime: '21:00', rating: 4.3, reviews: 156, distanceKm: 1.2 },
  { area: 'Vaishali Nagar', address: 'Vaishali Nagar, Main Road', latitude: 26.9073, longitude: 75.7340, openTime: '08:00', closeTime: '23:00', rating: 4.7, reviews: 312, distanceKm: 2.5 },
  { area: 'Malviya Nagar', address: 'Malviya Nagar, New Delhi', latitude: 26.8510, longitude: 75.8130, openTime: '07:00', closeTime: '22:00', rating: 4.1, reviews: 89, distanceKm: 3.1 },
  { area: 'MI Road', address: 'MI Road, Near Ajmer Gate', latitude: 26.9190, longitude: 75.8190, openTime: '08:00', closeTime: '21:00', rating: 4.4, reviews: 178, distanceKm: 1.5 },
  { area: 'Bani Park', address: 'Bani Park, Sector 12', latitude: 26.9270, longitude: 75.7940, openTime: '09:00', closeTime: '20:00', rating: 4.6, reviews: 145, distanceKm: 0.5 },
  { area: 'JLN Marg', address: 'JLN Marg, Near SMS Hospital', latitude: 26.9105, longitude: 75.8025, openTime: '24x7', closeTime: '24x7', rating: 4.8, reviews: 423, distanceKm: 2.2 },
  { area: 'Sodala', address: 'Sodala, Near ESI Hospital', latitude: 26.9004, longitude: 75.7802, openTime: '08:00', closeTime: '22:00', rating: 4.2, reviews: 97, distanceKm: 1.7 },
  { area: 'Jagatpura', address: 'Jagatpura, Near Gyan Vihar', latitude: 26.8431, longitude: 75.8247, openTime: '08:00', closeTime: '22:00', rating: 4.0, reviews: 71, distanceKm: 4.8 },
  { area: 'Raja Park', address: 'Raja Park, Main Market', latitude: 26.8965, longitude: 75.8329, openTime: '08:00', closeTime: '22:00', rating: 4.3, reviews: 112, distanceKm: 2.9 },
  { area: 'Adarsh Nagar', address: 'Adarsh Nagar, Tilak Nagar', latitude: 26.9084, longitude: 75.8236, openTime: '08:00', closeTime: '21:30', rating: 4.2, reviews: 84, distanceKm: 1.9 },
  { area: 'Gopalpura', address: 'Gopalpura Bypass, Near Riddhi Siddhi', latitude: 26.8855, longitude: 75.7512, openTime: '08:30', closeTime: '21:30', rating: 4.4, reviews: 130, distanceKm: 3.6 },
  { area: 'Tonk Road', address: 'Tonk Road, Durgapura', latitude: 26.8497, longitude: 75.8031, openTime: '08:00', closeTime: '22:00', rating: 4.1, reviews: 76, distanceKm: 4.0 },
  { area: 'Shyam Nagar', address: 'Shyam Nagar, New Sanganer Road', latitude: 26.8902, longitude: 75.7535, openTime: '08:00', closeTime: '22:00', rating: 4.0, reviews: 69, distanceKm: 2.1 },
  { area: 'Khatipura', address: 'Khatipura, Near Railway Station', latitude: 26.9334, longitude: 75.7422, openTime: '08:00', closeTime: '21:00', rating: 4.3, reviews: 95, distanceKm: 4.4 },
  { area: 'Ajmer Road', address: 'Ajmer Road, Nirman Nagar', latitude: 26.9138, longitude: 75.7446, openTime: '08:00', closeTime: '22:00', rating: 4.2, reviews: 101, distanceKm: 5.0 },
  { area: 'Civil Lines', address: 'Civil Lines, Opposite Secretariat', latitude: 26.9098, longitude: 75.7837, openTime: '08:00', closeTime: '22:00', rating: 4.6, reviews: 121, distanceKm: 1.3 },
  { area: 'Lal Kothi', address: 'Lal Kothi, Near Tonk Phatak', latitude: 26.8922, longitude: 75.8067, openTime: '08:00', closeTime: '22:00', rating: 4.2, reviews: 88, distanceKm: 2.4 },
  { area: 'Vidhyadhar Nagar', address: 'Vidhyadhar Nagar, Sector 2', latitude: 26.9542, longitude: 75.7835, openTime: '08:00', closeTime: '21:30', rating: 4.5, reviews: 118, distanceKm: 6.2 },
  { area: 'Pratap Nagar', address: 'Pratap Nagar, Sector 8', latitude: 26.8129, longitude: 75.7462, openTime: '08:00', closeTime: '22:00', rating: 4.0, reviews: 54, distanceKm: 7.5 },
  { area: 'Sanganer', address: 'Sanganer, Near Airport Road', latitude: 26.8218, longitude: 75.7785, openTime: '08:00', closeTime: '22:00', rating: 4.1, reviews: 66, distanceKm: 7.1 },
  { area: 'Sitapura', address: 'Sitapura, RIICO Industrial Area', latitude: 26.8187, longitude: 75.8472, openTime: '08:00', closeTime: '22:00', rating: 4.0, reviews: 49, distanceKm: 8.0 },
  { area: 'Ramganj', address: 'Ramganj, Bazaar Road', latitude: 26.9238, longitude: 75.8360, openTime: '09:00', closeTime: '21:00', rating: 4.2, reviews: 73, distanceKm: 1.8 },
  { area: 'Kishanpole Bazaar', address: 'Kishanpole Bazaar, Old City', latitude: 26.9194, longitude: 75.8185, openTime: '09:00', closeTime: '21:00', rating: 4.3, reviews: 104, distanceKm: 1.1 },
  { area: 'Kalwar Road', address: 'Kalwar Road, Jhotwara', latitude: 26.9927, longitude: 75.7428, openTime: '08:00', closeTime: '21:30', rating: 4.1, reviews: 58, distanceKm: 9.6 },
  { area: 'Patrakar Colony', address: 'Patrakar Colony, Mansarovar Extension', latitude: 26.8469, longitude: 75.7271, openTime: '08:00', closeTime: '22:00', rating: 4.2, reviews: 82, distanceKm: 6.8 },
  { area: 'Chitrakoot', address: 'Chitrakoot, Vaishali Link Road', latitude: 26.9162, longitude: 75.7254, openTime: '08:00', closeTime: '22:00', rating: 4.3, reviews: 91, distanceKm: 5.5 },
  { area: 'Shastri Nagar', address: 'Shastri Nagar, Near Moti Dungri', latitude: 26.9408, longitude: 75.7809, openTime: '08:00', closeTime: '22:00', rating: 4.4, reviews: 109, distanceKm: 3.0 },
  { area: 'Govindpura', address: 'Govindpura, Near railway junction', latitude: 26.8858, longitude: 75.7704, openTime: '08:00', closeTime: '22:00', rating: 4.2, reviews: 77, distanceKm: 0.9 },
  { area: 'Ghat Gate', address: 'Ghat Gate, Old Walled City', latitude: 26.9102, longitude: 75.8424, openTime: '09:00', closeTime: '21:00', rating: 4.1, reviews: 63, distanceKm: 2.7 },
];

const demoMedicineCatalog = [
  { name: 'Paracetamol 500mg', price: 45, stock: 140, lowStockThreshold: 20, category: 'Painkillers', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', distanceKm: 0.8 },
  { name: 'Crocin 650mg', price: 52, stock: 96, lowStockThreshold: 20, category: 'Painkillers', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', distanceKm: 0.8 },
  { name: 'Dolo 650mg', price: 48, stock: 118, lowStockThreshold: 30, category: 'Painkillers', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', distanceKm: 1.5 },
  { name: 'Ibuprofen 400mg', price: 35, stock: 200, lowStockThreshold: 30, category: 'Painkillers', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', distanceKm: 1.5 },
  { name: 'Diclofenac 50mg', price: 40, stock: 300, lowStockThreshold: 50, category: 'Painkillers', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200', distanceKm: 0.5 },
  { name: 'Aceclofenac 100mg', price: 65, stock: 60, lowStockThreshold: 15, category: 'Painkillers', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', distanceKm: 2.2 },
  { name: 'Cetirizine 10mg', price: 38, stock: 0, lowStockThreshold: 15, category: 'Antihistamines', imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=200', distanceKm: 1.2 },
  { name: 'Levocetirizine 5mg', price: 44, stock: 55, lowStockThreshold: 15, category: 'Antihistamines', imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=200', distanceKm: 1.2 },
  { name: 'Montelukast 10mg', price: 180, stock: 45, lowStockThreshold: 15, category: 'Antihistamines', imageUrl: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=200', distanceKm: 2.2 },
  { name: 'Cetzine 10mg', price: 41, stock: 68, lowStockThreshold: 15, category: 'Antihistamines', imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=200', distanceKm: 1.2 },
  { name: 'Amoxicillin 500mg', price: 85, stock: 52, lowStockThreshold: 20, category: 'Antibiotics', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 2.5 },
  { name: 'Amoxicillin 250mg', price: 65, stock: 180, lowStockThreshold: 30, category: 'Antibiotics', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 0.5 },
  { name: 'Azithromycin 250mg', price: 42, stock: 16, lowStockThreshold: 10, category: 'Antibiotics', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200', distanceKm: 0.8 },
  { name: 'Metronidazole 400mg', price: 58, stock: 72, lowStockThreshold: 15, category: 'Antibiotics', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 3.6 },
  { name: 'Ofloxacin 200mg', price: 54, stock: 88, lowStockThreshold: 15, category: 'Antibiotics', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 4.0 },
  { name: 'Omeprazole 20mg', price: 60, stock: 25, lowStockThreshold: 10, category: 'Antacids', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 3.1 },
  { name: 'Pantocid 40mg', price: 92, stock: 70, lowStockThreshold: 15, category: 'Antacids', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 3.1 },
  { name: 'Rabeprazole 20mg', price: 88, stock: 42, lowStockThreshold: 10, category: 'Antacids', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 3.1 },
  { name: 'Pan 40mg', price: 88, stock: 84, lowStockThreshold: 15, category: 'Antacids', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 0.5 },
  { name: 'Metformin 500mg', price: 55, stock: 150, lowStockThreshold: 25, category: 'Antidiabetics', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200', distanceKm: 1.5 },
  { name: 'Glimepiride 1mg', price: 64, stock: 78, lowStockThreshold: 15, category: 'Antidiabetics', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200', distanceKm: 2.0 },
  { name: 'Atorvastatin 20mg', price: 75, stock: 80, lowStockThreshold: 20, category: 'Statins', imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=200', distanceKm: 1.5 },
  { name: 'Amlodipine 5mg', price: 32, stock: 110, lowStockThreshold: 20, category: 'Antihypertensives', imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=200', distanceKm: 2.4 },
  { name: 'Aspirin 75mg', price: 28, stock: 120, lowStockThreshold: 25, category: 'Anticoagulants', imageUrl: 'https://images.unsplash.com/photo-1550572017-4d4e7dddf7c6?w=200', distanceKm: 2.2 },
  { name: 'Vitamin C 500mg', price: 30, stock: 90, lowStockThreshold: 20, category: 'Vitamins', imageUrl: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=200', distanceKm: 3.1 },
  { name: 'Zincovit Tablet', price: 72, stock: 64, lowStockThreshold: 15, category: 'Vitamins', imageUrl: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=200', distanceKm: 3.1 },
  { name: 'ORS Sachet', price: 22, stock: 240, lowStockThreshold: 40, category: 'Electrolytes', imageUrl: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=200', distanceKm: 4.5 },
  { name: 'Mupirocin Ointment', price: 95, stock: 30, lowStockThreshold: 10, category: 'Topicals', imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=200', distanceKm: 5.0 },
  { name: 'Salbutamol Inhaler', price: 165, stock: 38, lowStockThreshold: 10, category: 'Respiratory', imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200', distanceKm: 6.0 },
  { name: 'Calcium + Vitamin D3', price: 120, stock: 88, lowStockThreshold: 20, category: 'Supplements', imageUrl: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=200', distanceKm: 2.8 },
  { name: 'Insulin Glargine', price: 520, stock: 18, lowStockThreshold: 5, category: 'Antidiabetics', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200', distanceKm: 7.5 },
];

const seedShops = demoShopLocations.map((location, index) => {
  const ownerMobile = `98765433${String(index).padStart(2, '0')}`;
  const ownerEmail = `demo${index + 1}@pharmacy.com`;

  return {
    key: `demo-${index + 1}`,
    name: `${demoShopBrands[index % demoShopBrands.length]} ${location.area}`,
    ownerName: demoOwnerNames[index],
    ownerMobile,
    ownerEmail,
    address: location.address,
    area: location.area,
    license: `DL-RJ-2026-${String(120000 + index).padStart(6, '0')}`,
    phone: `+91${ownerMobile}`,
    email: ownerEmail,
    openTime: location.openTime,
    closeTime: location.closeTime,
    imageUrl: demoShopImages[index % demoShopImages.length],
    rating: location.rating,
    reviews: location.reviews,
    latitude: location.latitude,
    longitude: location.longitude,
  };
});

const roundDistanceKm = (value) => (Number.isFinite(value) ? Math.round(value * 10) / 10 : 0);

const seedMedicines = demoShopLocations.flatMap((location, index) => {
  const medicineIndexes = [index, index + 10, index + 20];
  return medicineIndexes.map((medicineIndex, slotIndex) => {
    const medicine = demoMedicineCatalog[medicineIndex % demoMedicineCatalog.length];
    return {
      shopKey: `demo-${index + 1}`,
      name: medicine.name,
      price: medicine.price + (index % 4) * 2 + slotIndex,
      stock: Math.max(10, medicine.stock - (index % 3) * 5 + slotIndex * 4),
      lowStockThreshold: medicine.lowStockThreshold,
      category: medicine.category,
      imageUrl: medicine.imageUrl,
      distanceKm: roundDistanceKm(location.distanceKm + slotIndex * 0.1),
    };
  });
});

const seedShopCoordinates = new Map(
  seedShops.map((shop) => [shop.name.toLowerCase(), { latitude: shop.latitude, longitude: shop.longitude }])
);

const seedShopNameByKey = new Map(
  seedShops.map((shop) => [shop.key, shop.name])
);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SEARCH_STOP_WORDS = new Set([
  'rx', 'take', 'tablet', 'tablets', 'tab', 'tabs', 'cap', 'capsule', 'capsules', 'syrup', 'susp',
  'suspension', 'injection', 'inj', 'drops', 'drop', 'ointment', 'cream', 'gel', 'apply', 'daily',
  'morning', 'night', 'before', 'after', 'food', 'dose', 'dosage', 'and', 'with', 'for', 'to', 'mg',
  'mcg', 'ml', 'iu', 'unit', 'units', 'po', 'od', 'bd', 'tds', 'qid', 'hs'
]);

const extractSearchTerms = (query) => {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9.]+/g)
        .map((term) => term.trim())
        .filter((term) => term.length > 2 && !SEARCH_STOP_WORDS.has(term))
    )
  ).slice(0, 12);
};

const normalizeMobile = (mobile) => String(mobile || '').replace(/\D/g, '').slice(-10);

const parseJsonSafely = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizePrescriptionMedicines = (medicines) => {
  if (!Array.isArray(medicines)) {
    return [];
  }

  return medicines
    .map((medicine) => ({
      name: String(medicine?.name || '').trim(),
      dosage: String(medicine?.dosage || '').trim(),
      frequency: String(medicine?.frequency || '').trim(),
      duration: String(medicine?.duration || '').trim(),
    }))
    .filter((medicine) => medicine.name);
};

const buildPrescriptionSearchQuery = (medicines) => medicines
  .map((medicine) => medicine.name)
  .map((name) => String(name || '').trim())
  .filter(Boolean)
  .filter((name, index, list) => list.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index)
  .join(', ');

const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

const uniqueStrings = (values) => Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));

const parseCoordinate = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const calculateDistanceKm = (fromLatitude, fromLongitude, toLatitude, toLongitude) => {
  const radiusKm = 6371;
  const startLatitude = (fromLatitude * Math.PI) / 180;
  const endLatitude = (toLatitude * Math.PI) / 180;
  const deltaLatitude = ((toLatitude - fromLatitude) * Math.PI) / 180;
  const deltaLongitude = ((toLongitude - fromLongitude) * Math.PI) / 180;

  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radiusKm * c;
};

const resolveDistanceKm = (medicine, shop, userLocation = null) => {
  const shopLatitude = parseCoordinate(shop?.latitude);
  const shopLongitude = parseCoordinate(shop?.longitude);

  if (userLocation && shopLatitude !== null && shopLongitude !== null) {
    return roundDistanceKm(calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      shopLatitude,
      shopLongitude,
    ));
  }

  return roundDistanceKm(parseCoordinate(medicine?.distanceKm) ?? 0);
};

const MEDICINE_INGREDIENT_ALIASES = new Map([
  ['paracetamol', 'Paracetamol'],
  ['crocin', 'Paracetamol'],
  ['dolo', 'Paracetamol'],
  ['ibuprofen', 'Ibuprofen'],
  ['combiflam', 'Ibuprofen + Paracetamol'],
  ['cetirizine', 'Cetirizine'],
  ['cetzine', 'Cetirizine'],
  ['levocetirizine', 'Levocetirizine'],
  ['azithromycin', 'Azithromycin'],
  ['amoxicillin', 'Amoxicillin'],
  ['omeprazole', 'Omeprazole'],
  ['pantoprazole', 'Pantoprazole'],
  ['pantocid', 'Pantoprazole'],
  ['pan', 'Pantoprazole'],
  ['rabeprazole', 'Rabeprazole'],
  ['lansoprazole', 'Lansoprazole'],
  ['metformin', 'Metformin'],
  ['atorvastatin', 'Atorvastatin'],
  ['aspirin', 'Aspirin'],
  ['montelukast', 'Montelukast'],
  ['aceclofenac', 'Aceclofenac'],
  ['diclofenac', 'Diclofenac'],
  ['cotrimoxazole', 'Sulfamethoxazole + Trimethoprim'],
  ['vitamin c', 'Ascorbic Acid'],
]);

const KNOWN_ACTIVE_INGREDIENTS = [
  'Paracetamol',
  'Ibuprofen',
  'Cetirizine',
  'Levocetirizine',
  'Azithromycin',
  'Amoxicillin',
  'Omeprazole',
  'Pantoprazole',
  'Rabeprazole',
  'Lansoprazole',
  'Metformin',
  'Atorvastatin',
  'Aspirin',
  'Montelukast',
  'Aceclofenac',
  'Diclofenac',
  'Sulfamethoxazole + Trimethoprim',
  'Ascorbic Acid',
];

const INGREDIENT_MEDICINE_HINTS = new Map([
  ['paracetamol', ['Paracetamol 500mg', 'Crocin 650mg', 'Dolo 650mg']],
  ['ibuprofen', ['Ibuprofen 400mg', 'Combiflam']],
  ['cetirizine', ['Cetirizine 10mg', 'Cetzine 10mg']],
  ['levocetirizine', ['Levocetirizine 5mg']],
  ['azithromycin', ['Azithromycin 250mg']],
  ['amoxicillin', ['Amoxicillin 500mg', 'Amoxicillin 250mg']],
  ['omeprazole', ['Omeprazole 20mg']],
  ['pantoprazole', ['Pantoprazole 40mg', 'Pantocid 40mg', 'Pan 40mg']],
  ['rabeprazole', ['Rabeprazole 20mg']],
  ['lansoprazole', ['Lansoprazole 30mg']],
  ['metformin', ['Metformin 500mg']],
  ['atorvastatin', ['Atorvastatin 20mg']],
  ['aspirin', ['Aspirin 75mg']],
  ['montelukast', ['Montelukast 10mg']],
  ['aceclofenac', ['Aceclofenac 100mg']],
  ['diclofenac', ['Diclofenac 50mg']],
  ['sulfamethoxazole trimethoprim', ['Cotrimoxazole']],
  ['ascorbic acid', ['Vitamin C 500mg']],
]);

const SYMPTOM_GUIDE = [
  {
    symptom: 'Fever',
    aliases: ['fever', 'bukhar', 'jwar', 'temperature'],
    activeIngredients: ['Paracetamol'],
    medicines: ['Paracetamol 500mg', 'Crocin 650mg', 'Dolo 650mg'],
    explanation: 'Common fever relief options are usually paracetamol-based.',
    caution: 'If fever is high, lasts more than 3 days, or comes with rash, breathing trouble, or severe weakness, seek medical care.',
  },
  {
    symptom: 'Body Pain',
    aliases: ['body pain', 'headache', 'sir dard', 'sirdard', 'pain', 'dard'],
    activeIngredients: ['Paracetamol', 'Ibuprofen', 'Aceclofenac', 'Diclofenac'],
    medicines: ['Paracetamol 500mg', 'Ibuprofen 400mg', 'Aceclofenac 100mg', 'Diclofenac 50mg'],
    explanation: 'Common pain-relief options are often paracetamol or anti-inflammatory medicines.',
    caution: 'For severe, repeated, or one-sided pain, consult a doctor.',
  },
  {
    symptom: 'Acidity',
    aliases: ['acidity', 'gas', 'heartburn', 'indigestion'],
    activeIngredients: ['Omeprazole', 'Pantoprazole', 'Rabeprazole', 'Lansoprazole'],
    medicines: ['Omeprazole 20mg', 'Pan 40mg', 'Pantocid 40mg'],
    explanation: 'Acidity is often handled with acid-reducing medicines.',
    caution: 'If you have chest pain, vomiting blood, or frequent acidity, seek medical care.',
  },
  {
    symptom: 'Cold / Allergy',
    aliases: ['cold', 'sardi', 'allergy', 'sneezing', 'runny nose', 'nasal allergy'],
    activeIngredients: ['Cetirizine', 'Levocetirizine', 'Montelukast'],
    medicines: ['Cetirizine 10mg', 'Cetzine 10mg', 'Montelukast 10mg'],
    explanation: 'Allergy-type symptoms are often managed with antihistamines.',
    caution: 'If breathing trouble or wheezing occurs, seek urgent care.',
  },
  {
    symptom: 'Eye Redness / Allergy',
    aliases: ['redness in eye', 'red eyes', 'eye redness', 'eye irritation', 'itchy eyes', 'watery eyes', 'eye itching', 'eye allergy'],
    activeIngredients: ['Cetirizine', 'Levocetirizine', 'Montelukast'],
    medicines: ['Cetirizine 10mg', 'Cetzine 10mg', 'Levocetirizine 5mg', 'Montelukast 10mg'],
    explanation: 'Eye redness that comes with allergy or irritation is often managed with antihistamines.',
    caution: 'If the eye is painful, has discharge, blurred vision, light sensitivity, or one-sided severe redness, get medical care promptly.',
  },
];

const getIngredientEntries = () => Array.from(MEDICINE_INGREDIENT_ALIASES.entries()).sort((left, right) => right[0].length - left[0].length);

const resolveActiveIngredientFromText = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return '';
  }

  for (const [alias, ingredient] of getIngredientEntries()) {
    if (normalized === alias || normalized.includes(alias)) {
      return ingredient;
    }
  }

  for (const ingredient of KNOWN_ACTIVE_INGREDIENTS.sort((left, right) => right.length - left.length)) {
    const normalizedIngredient = normalizeText(ingredient);
    if (normalized === normalizedIngredient || normalized.includes(normalizedIngredient)) {
      return ingredient;
    }
  }

  return '';
};

const resolveSymptomGuide = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  return SYMPTOM_GUIDE.find((guide) => guide.aliases.some((alias) => normalized.includes(normalizeText(alias)))) || null;
};

const getMedicineHintsForIngredient = (ingredient) => {
  const normalizedIngredient = normalizeText(ingredient);
  return normalizedIngredient ? (INGREDIENT_MEDICINE_HINTS.get(normalizedIngredient) || []) : [];
};

const inferActiveIngredientFromName = (name) => {
  const resolvedIngredient = resolveActiveIngredientFromText(name);
  if (resolvedIngredient) {
    return resolvedIngredient;
  }

  const cleanedName = String(name || '').replace(/\b\d+(?:\.\d+)?\s?(?:mg|mcg|g|ml|iu|units?)\b/gi, '').trim();
  return cleanedName || String(name || '').trim();
};

const buildLocalSearchIntent = (query) => {
  const rawQuery = String(query || '').trim();
  const normalizedQuery = normalizeText(rawQuery);
  const symptomGuide = resolveSymptomGuide(rawQuery);
  const activeIngredient = resolveActiveIngredientFromText(rawQuery) || symptomGuide?.activeIngredients?.[0] || '';
  const suggestedMedicines = symptomGuide?.medicines
    ? [...symptomGuide.medicines]
    : activeIngredient
      ? [...getMedicineHintsForIngredient(activeIngredient)]
      : [];
  const mode = symptomGuide ? 'symptom' : activeIngredient ? 'medicine' : rawQuery ? 'unknown' : 'unknown';

  return {
    mode,
    normalizedQuery: rawQuery,
    symptom: symptomGuide?.symptom || '',
    activeIngredient,
    suggestedMedicines,
    explanation: symptomGuide?.explanation || (activeIngredient ? `Searching medicines related to ${activeIngredient}.` : 'Searching for matching medicines and common alternatives.'),
    caution: symptomGuide?.caution || 'This information is for guidance only. Consult a qualified doctor or pharmacist for medical advice.',
  };
};

const buildSearchTargets = (query, intent) => uniqueStrings([
  query,
  intent.normalizedQuery,
  intent.activeIngredient,
  intent.symptom,
  ...intent.suggestedMedicines,
  ...getMedicineHintsForIngredient(intent.activeIngredient),
]);

const parseJsonResponse = (content) => {
  const trimmed = String(content || '').trim();
  const stripped = trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(stripped);
};

const runOpenAiJson = async ({ systemPrompt, userPrompt, temperature = 0.2 }) => {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    return parseJsonResponse(content);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const enhancePrescriptionExtractionWithOpenAi = async ({ fullText, localMedicines, localConfidence }) => {
  const response = await runOpenAiJson({
    systemPrompt: [
      'You extract medicine names from prescription OCR text for a medicine finder app.',
      'Return JSON only with: searchQuery (string), medicines (array of { name, dosage?, frequency?, duration? }), confidence (number or null), notes (string or null).',
      'Only include medicine names that are visible or strongly implied by the text. Do not add doses, diagnosis, or patient details unless clearly present.',
    ].join(' '),
    userPrompt: JSON.stringify({
      fullText,
      localMedicines,
      localConfidence,
    }),
    temperature: 0.1,
  });

  if (!response) {
    return null;
  }

  const medicines = normalizePrescriptionMedicines(response.medicines);
  const searchQuery = String(response.searchQuery || buildPrescriptionSearchQuery(medicines) || '').trim();

  if (!searchQuery && medicines.length === 0) {
    return null;
  }

  return {
    medicines: medicines.length > 0 ? medicines : localMedicines,
    searchQuery: searchQuery || buildPrescriptionSearchQuery(medicines) || buildPrescriptionSearchQuery(localMedicines),
    confidence: typeof response.confidence === 'number' ? response.confidence : localConfidence,
  };
};

const enhanceSearchIntentWithOpenAi = async ({ query, localIntent }) => {
  const response = await runOpenAiJson({
    systemPrompt: [
      'You help a medicine finder app understand a search query.',
      'Return JSON only with: mode (medicine|symptom|mixed|unknown), normalizedQuery (string), symptom (string or null), activeIngredient (string or null), suggestedMedicines (string array), explanation (string or null), caution (string or null).',
      'If the user describes a symptom, suggest common OTC medicines only. Do not diagnose, do not recommend antibiotics unless they are already obvious from the query, and do not provide dosage.',
      'Prefer common medicine names that can map to the provided inventory names/ingredients.',
    ].join(' '),
    userPrompt: JSON.stringify({
      query,
      localIntent,
      knownIngredients: KNOWN_ACTIVE_INGREDIENTS,
      symptomCatalog: SYMPTOM_GUIDE.map((item) => ({
        symptom: item.symptom,
        aliases: item.aliases,
        activeIngredients: item.activeIngredients,
        medicines: item.medicines,
      })),
    }),
    temperature: 0.2,
  });

  if (!response) {
    return null;
  }

  const normalizedQuery = String(response.normalizedQuery || localIntent.normalizedQuery || query || '').trim();
  const activeIngredient = resolveActiveIngredientFromText(response.activeIngredient) || localIntent.activeIngredient || '';
  const symptom = String(response.symptom || localIntent.symptom || '').trim();
  const suggestedMedicines = uniqueStrings([
    ...(Array.isArray(response.suggestedMedicines) ? response.suggestedMedicines : []),
    ...localIntent.suggestedMedicines,
  ]);
  const mode = ['medicine', 'symptom', 'mixed'].includes(response.mode) ? response.mode : localIntent.mode;

  return {
    ...localIntent,
    mode,
    normalizedQuery: normalizedQuery || localIntent.normalizedQuery,
    symptom,
    activeIngredient,
    suggestedMedicines,
    explanation: String(response.explanation || localIntent.explanation || '').trim(),
    caution: String(response.caution || localIntent.caution || '').trim(),
  };
};

const buildSearchAssistant = async ({ query, intent, results, medicines, userLocation }) => {
  const normalizedQuery = String(query || '').trim();
  const hasUserQuery = Boolean(normalizedQuery);

  if (!hasUserQuery && !intent.activeIngredient && !intent.symptom) {
    return {
      mode: 'unknown',
      normalizedQuery: '',
      symptom: '',
      activeIngredient: '',
      summary: 'Search by medicine or symptom',
      explanation: 'Try a medicine name like Paracetamol or a symptom like bukhar, acidity, or allergy.',
      caution: 'This guidance is for discovery only. Please consult a doctor or pharmacist for treatment advice.',
      suggestedMedicines: uniqueStrings([
        ...SYMPTOM_GUIDE.flatMap((guide) => guide.medicines),
        'Paracetamol 500mg',
        'Cetirizine 10mg',
        'Omeprazole 20mg',
      ]),
      sameSaltAlternatives: [],
    };
  }

  const primaryResult = results[0] || null;
  const primaryIngredient = intent.activeIngredient || inferActiveIngredientFromName(primaryResult?.medicineName || primaryResult?.name || query);
  const normalizedPrimaryIngredient = normalizeText(primaryIngredient);
  const excludedNames = new Set([
    normalizeText(primaryResult?.medicineName || ''),
    normalizeText(query),
    ...results.map((result) => normalizeText(result.medicineName || '')),
  ]);

  const sameSaltAlternatives = [];
  for (const medicine of medicines) {
    const ingredient = inferActiveIngredientFromName(medicine.name);
    if (!ingredient || normalizeText(ingredient) !== normalizedPrimaryIngredient) {
      continue;
    }

    const suggestionName = String(medicine.name || '').trim();
    const normalizedName = normalizeText(suggestionName);
    if (!suggestionName || excludedNames.has(normalizedName)) {
      continue;
    }

    const shop = medicine.shopId && typeof medicine.shopId === 'object' ? medicine.shopId : null;
    excludedNames.add(normalizedName);
    sameSaltAlternatives.push({
      id: String(medicine._id),
      name: suggestionName,
      activeIngredient: ingredient,
      category: medicine.category || 'Other',
      price: medicine.price,
      stock: medicine.stock,
      inStock: medicine.stock > 0,
      distance: resolveDistanceKm(medicine, shop, userLocation),
      shopId: shop ? String(shop._id) : String(medicine.shopId || ''),
      shopName: shop?.name || '',
      shopAddress: shop?.address || '',
      reason: `Same salt: ${ingredient}`,
    });

    if (sameSaltAlternatives.length >= 4) {
      break;
    }
  }

  const suggestedMedicines = uniqueStrings([
    ...intent.suggestedMedicines,
    ...sameSaltAlternatives.map((item) => item.name),
  ]);

  const summary = intent.mode === 'symptom'
    ? `Common options for ${intent.symptom || query}`
    : primaryIngredient
      ? `Same-salt options for ${primaryIngredient}`
      : normalizedQuery
        ? `Smart suggestions for ${normalizedQuery}`
        : 'Smart medicine suggestions';

  return {
    mode: intent.mode,
    normalizedQuery: intent.normalizedQuery || query,
    symptom: intent.symptom || '',
    activeIngredient: primaryIngredient || '',
    summary,
    explanation: intent.explanation,
    caution: intent.caution,
    suggestedMedicines,
    sameSaltAlternatives,
  };
};

const runEasyOcrReader = async (file) => {
  const tempExtension = path.extname(file.originalname || '').toLowerCase() || '.png';
  const tempFilePath = path.join(
    os.tmpdir(),
    `smart-medicine-prescription-${randomUUID()}${tempExtension}`
  );

  await fs.promises.writeFile(tempFilePath, file.buffer);

  try {
    const stdout = await new Promise((resolve, reject) => {
      const child = spawn(pythonCommand, [...pythonCommandArgs, easyOcrScriptPath, tempFilePath], {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (chunk) => {
        output += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        errorOutput += chunk.toString();
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(errorOutput.trim() || `EasyOCR exited with code ${code}.`));
          return;
        }

        resolve(output);
      });
    });

    const parsedOutput = parseJsonSafely(stdout);
    if (!parsedOutput) {
      throw new Error('EasyOCR returned an invalid response.');
    }

    return parsedOutput;
  } finally {
    await fs.promises.unlink(tempFilePath).catch(() => {});
  }
};

const defaultUserName = (role, name, shopName) => {
  if (name && name.trim()) return name.trim();
  if (role === 'shopkeeper' && shopName && shopName.trim()) return shopName.trim();
  if (role === 'admin') return 'Admin User';
  return 'Customer';
};

const shopToResponse = (shop) => ({
  id: String(shop._id),
  shopId: String(shop._id),
  name: shop.name,
  ownerName: shop.ownerName,
  owner: shop.ownerName,
  address: shop.address,
  area: shop.area,
  phone: shop.phone,
  email: shop.email,
  license: shop.license,
  openTime: shop.openTime,
  closeTime: shop.closeTime,
  imageUrl: shop.imageUrl,
  rating: shop.rating,
  reviews: shop.reviews,
  latitude: shop.latitude,
  longitude: shop.longitude,
});

const medicineToResponse = (medicine) => ({
  id: String(medicine._id),
  shopId: String(medicine.shopId),
  name: medicine.name,
  price: medicine.price,
  stock: medicine.stock,
  lowStockThreshold: medicine.lowStockThreshold,
  category: medicine.category,
  imageUrl: medicine.imageUrl || '',
  distanceKm: medicine.distanceKm,
});

const searchToResponse = (medicine, shop) => ({
  id: String(medicine._id),
  shopId: String(shop._id),
  name: shop.name,
  medicineName: medicine.name,
  address: shop.address,
  area: shop.area,
  distance: medicine.distanceKm,
  price: medicine.price,
  inStock: medicine.stock > 0,
  rating: shop.rating,
  reviews: shop.reviews,
  phone: shop.phone,
  openTime: shop.openTime,
  closeTime: shop.closeTime,
  lat: shop.latitude,
  lng: shop.longitude,
  shopImage: shop.imageUrl || '',
  medicineImage: medicine.imageUrl || '',
  stock: medicine.stock,
  category: medicine.category,
});

const buildUserResponse = (user, shop) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  shopId: user.shopId ? String(user.shopId) : null,
  shopName: user.shopName || shop?.name || '',
  shopAddress: user.shopAddress || shop?.address || '',
  license: user.license || shop?.license || '',
  openTime: user.openTime || shop?.openTime || '',
  closeTime: user.closeTime || shop?.closeTime || '',
});

const ensureSeedData = async () => {
  const shopOperations = seedShops.map((shop) => {
    const { key, ...shopValues } = shop;

    return {
      updateOne: {
        filter: { name: shopValues.name },
        update: { $set: shopValues },
        upsert: true,
      },
    };
  });

  if (shopOperations.length > 0) {
    await Shop.bulkWrite(shopOperations);
  }

  const shops = await Shop.find({ name: { $in: seedShops.map((shop) => shop.name) } }).lean();
  const shopByName = new Map(shops.map((shop) => [shop.name, shop]));
  const demoShopIds = shops.map((shop) => shop._id);

  if (demoShopIds.length > 0) {
    await Medicine.deleteMany({ shopId: { $in: demoShopIds } });
  }

  const medicines = seedMedicines
    .map((medicine) => {
      const shopName = seedShopNameByKey.get(medicine.shopKey);
      const shop = shopName ? shopByName.get(shopName) : null;
      if (!shop) {
        return null;
      }

      return {
        ...medicine,
        shopId: shop._id,
      };
    })
    .filter(Boolean);

  if (medicines.length > 0) {
    await Medicine.insertMany(medicines);
  }
};

const upsertShopkeeperProfile = async ({ mobile, name, email, shopName, shopAddress, license, openTime, closeTime, latitude, longitude }) => {
  const resolvedMobile = normalizeMobile(mobile);
  const existingShop = await Shop.findOne({ ownerMobile: resolvedMobile }).lean();
  const ownerName = (name && name.trim()) || existingShop?.ownerName || (shopName && shopName.trim()) || 'Pharmacy Store';
  const resolvedShopName = (shopName && shopName.trim()) || existingShop?.name || `${ownerName} Pharmacy`;
  const resolvedAddress = (shopAddress && shopAddress.trim()) || existingShop?.address || 'Shop address pending';
  const resolvedArea = (shopAddress && shopAddress.split(',')?.[0]?.trim()) || existingShop?.area || 'India';
  const resolvedLatitude = parseCoordinate(latitude) ?? parseCoordinate(existingShop?.latitude) ?? 26.9124;
  const resolvedLongitude = parseCoordinate(longitude) ?? parseCoordinate(existingShop?.longitude) ?? 75.7873;
  const shopValues = {
    name: resolvedShopName,
    ownerName,
    ownerMobile: resolvedMobile,
    ownerEmail: (email && email.trim()) || existingShop?.ownerEmail || '',
    address: resolvedAddress,
    area: resolvedArea,
    license: (license && license.trim()) || existingShop?.license || '',
    phone: `+91-${resolvedMobile}`,
    email: (email && email.trim()) || existingShop?.email || '',
    openTime: (openTime && openTime.trim()) || existingShop?.openTime || '08:00',
    closeTime: (closeTime && closeTime.trim()) || existingShop?.closeTime || '22:00',
    imageUrl: existingShop?.imageUrl || '',
    rating: typeof existingShop?.rating === 'number' ? existingShop.rating : 4.5,
    reviews: typeof existingShop?.reviews === 'number' ? existingShop.reviews : 0,
    latitude: resolvedLatitude,
    longitude: resolvedLongitude,
  };

  const shop = await Shop.findOneAndUpdate(
    { ownerMobile: resolvedMobile },
    { $set: shopValues },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const user = await User.findOneAndUpdate(
    { mobile: resolvedMobile, role: 'shopkeeper' },
    {
      $set: {
        name: ownerName,
        email: (email && email.trim()) || existingShop?.ownerEmail || '',
        mobile: resolvedMobile,
        role: 'shopkeeper',
        shopId: shop._id,
        shopName: shopValues.name,
        shopAddress: shopValues.address,
        license: shopValues.license,
        openTime: shopValues.openTime,
        closeTime: shopValues.closeTime,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return { user, shop };
};

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.redirect(302, CLIENT_ORIGIN);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy', dbState: mongoose.connection.readyState });
});

app.post('/api/prescription/extract', prescriptionUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a prescription image.' });
    }

    const easyOcrResult = await runEasyOcrReader(req.file);
    const localMedicines = normalizePrescriptionMedicines(easyOcrResult?.medicines);
    const localSearchQuery = buildPrescriptionSearchQuery(localMedicines);
    const enhancedExtraction = await enhancePrescriptionExtractionWithOpenAi({
      fullText: easyOcrResult?.fullText || '',
      localMedicines,
      localConfidence: typeof easyOcrResult?.confidence === 'number' ? easyOcrResult.confidence : null,
    });
    const medicines = enhancedExtraction?.medicines?.length ? enhancedExtraction.medicines : localMedicines;
    const searchQuery = enhancedExtraction?.searchQuery || localSearchQuery;

    if (!searchQuery) {
      return res.status(422).json({
        message: 'No medicine names were detected. Try a clearer prescription image.',
        raw: easyOcrResult,
      });
    }

    return res.json({
      message: 'Prescription extracted successfully with EasyOCR.',
      searchQuery,
      medicines,
      confidence: enhancedExtraction?.confidence ?? (typeof easyOcrResult?.confidence === 'number' ? easyOcrResult.confidence : null),
      doctor: null,
      patient: null,
      date: null,
      diagnosis: null,
      raw: easyOcrResult,
    });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return res.status(500).json({
        message: 'Python runtime not found. Set PYTHON_BIN in backend/.env or make sure the workspace venv is available.',
      });
    }

    return res.status(500).json({
      message: 'Failed to extract prescription.',
      error: error.message,
    });
  }
});

app.post('/api/auth/request-otp', async (req, res) => {
  const mobile = normalizeMobile(req.body?.mobile);
  const role = req.body?.role;
  if (!mobile || mobile.length !== 10) {
    return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
  }
  if (!['user', 'shopkeeper', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  return res.json({
    message: 'OTP queued for demo verification.',
    requestId: `otp-${mobile}-${role}`,
  });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const mobile = normalizeMobile(req.body?.mobile);
    const role = req.body?.role;
    const otp = String(req.body?.otp || '').trim();
    const mode = req.body?.mode === 'signup' ? 'signup' : 'login';
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const shopName = String(req.body?.shopName || '').trim();
    const shopAddress = String(req.body?.shopAddress || '').trim();
    const license = String(req.body?.license || '').trim();
    const openTime = String(req.body?.openTime || '').trim();
    const closeTime = String(req.body?.closeTime || '').trim();
    const latitude = req.body?.latitude;
    const longitude = req.body?.longitude;

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number.' });
    }
    if (!['user', 'shopkeeper', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'Enter a valid 6-digit OTP.' });
    }

    let user;
    let shop = null;

    if (role === 'shopkeeper') {
      const shopResult = await upsertShopkeeperProfile({ mobile, name, email, shopName, shopAddress, license, openTime, closeTime, latitude, longitude });
      user = shopResult.user;
      shop = shopResult.shop;
    } else {
      const existingUser = await User.findOne({ mobile, role });
      const userName = mode === 'signup' ? defaultUserName(role, name, '') : existingUser?.name || defaultUserName(role, name, '');
      const userEmail = mode === 'signup' ? email : existingUser?.email || email;

      user = await User.findOneAndUpdate(
        { mobile, role },
        {
          $set: {
            name: userName,
            email: userEmail,
            mobile,
            role,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    return res.json({
      message: 'Authentication successful.',
      user: buildUserResponse(user, shop),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify OTP.', error: error.message });
  }
});

app.get('/api/medicines/search', async (req, res) => {
  try {
    const query = String(req.query.q || req.query.query || '').trim();
    const description = String(req.query.desc || '').trim();
    const combinedQuery = [query, description].filter(Boolean).join(' ').trim();
    const userLatitude = parseCoordinate(req.query.lat ?? req.query.userLat);
    const userLongitude = parseCoordinate(req.query.lng ?? req.query.userLng);
    const userLocation = userLatitude !== null && userLongitude !== null
      ? { latitude: userLatitude, longitude: userLongitude }
      : null;
    const stock = String(req.query.stock || 'all');
    const sort = String(req.query.sort || 'distance');
    const localIntent = buildLocalSearchIntent(combinedQuery);
    const enhancedIntent = await enhanceSearchIntentWithOpenAi({ query: combinedQuery, localIntent }) || localIntent;
    const searchTargets = buildSearchTargets(combinedQuery, enhancedIntent).map(normalizeText).filter(Boolean);

    const allMedicines = await Medicine.find().populate('shopId').lean();
    const results = allMedicines
      .filter((medicine) => {
        if (stock === 'instock' && medicine.stock <= 0) {
          return false;
        }

        if (searchTargets.length === 0) {
          return true;
        }

        const shopName = medicine.shopId && typeof medicine.shopId === 'object' ? medicine.shopId.name : '';
        const searchableValues = [
          medicine.name,
          medicine.category,
          shopName,
          inferActiveIngredientFromName(medicine.name),
        ].map(normalizeText).filter(Boolean);

        return searchTargets.some((target) => searchableValues.some((value) => value.includes(target) || target.includes(value)));
      })
      .filter((medicine) => (stock === 'instock' ? medicine.stock > 0 : true))
      .map((medicine) => {
        const shop = medicine.shopId && typeof medicine.shopId === 'object' ? medicine.shopId : null;
        const distanceKm = resolveDistanceKm(medicine, shop, userLocation);
        return searchToResponse({ ...medicine, distanceKm }, medicine.shopId);
      })
      .sort((a, b) => {
        if (sort === 'price') return a.price - b.price;
        if (sort === 'rating') return b.rating - a.rating;
        return a.distance - b.distance;
      });

    const assistant = await buildSearchAssistant({ query: combinedQuery, intent: enhancedIntent, results, medicines: allMedicines, userLocation });

    return res.json({
      query: assistant.normalizedQuery || combinedQuery,
      total: results.length,
      results,
      assistant,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to search medicines.', error: error.message });
  }
});

app.get('/api/shopkeepers/:shopId/medicines', async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const medicines = await Medicine.find({ shopId }).sort({ updatedAt: -1 }).lean();
    return res.json({ shop: shopToResponse(shop), medicines: medicines.map(medicineToResponse) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load shop medicines.', error: error.message });
  }
});

app.put('/api/shopkeepers/:shopId/profile', async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const name = String(req.body?.name || shop.name).trim();
    const ownerName = String(req.body?.ownerName || shop.ownerName).trim();
    const address = String(req.body?.address || shop.address).trim();
    const area = String(req.body?.area || shop.area).trim();
    const phone = String(req.body?.phone || shop.phone).trim();
    const email = String(req.body?.email || shop.email).trim();
    const license = String(req.body?.license || shop.license).trim();
    const openTime = String(req.body?.openTime || shop.openTime).trim();
    const closeTime = String(req.body?.closeTime || shop.closeTime).trim();
    const imageUrl = String(req.body?.imageUrl || shop.imageUrl || '').trim();

    shop.name = name;
    shop.ownerName = ownerName;
    shop.address = address;
    shop.area = area;
    shop.phone = phone;
    shop.email = email;
    shop.license = license;
    shop.openTime = openTime;
    shop.closeTime = closeTime;
    shop.imageUrl = imageUrl;
    await shop.save();

    await User.updateMany(
      { shopId: shop._id, role: 'shopkeeper' },
      {
        $set: {
          name: ownerName,
          email,
          shopName: name,
          shopAddress: address,
          license,
          openTime,
          closeTime,
        },
      }
    );

    return res.json({ message: 'Shop profile saved successfully.', shop: shopToResponse(shop) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save shop profile.', error: error.message });
  }
});

app.post('/api/shopkeepers/:shopId/medicines', async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const name = String(req.body?.name || '').trim();
    const price = Number(req.body?.price);
    const stock = Number(req.body?.stock);
    const lowStockThreshold = Number(req.body?.lowStockThreshold || 10);
    const category = String(req.body?.category || 'Other').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();
    const distanceKm = Number(req.body?.distanceKm || 1.5);

    if (!name || Number.isNaN(price) || Number.isNaN(stock)) {
      return res.status(400).json({ message: 'Medicine name, price, and stock are required.' });
    }

    const medicine = await Medicine.create({
      shopId,
      name,
      price,
      stock,
      lowStockThreshold,
      category,
      imageUrl,
      distanceKm,
    });

    return res.status(201).json({ shop: shopToResponse(shop), medicine: medicineToResponse(medicine) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create medicine.', error: error.message });
  }
});

app.put('/api/shopkeepers/:shopId/medicines/:medicineId', async (req, res) => {
  try {
    const { shopId, medicineId } = req.params;
    const medicine = await Medicine.findOne({ _id: medicineId, shopId });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    const name = String(req.body?.name || '').trim();
    const price = Number(req.body?.price);
    const stock = Number(req.body?.stock);
    const lowStockThreshold = Number(req.body?.lowStockThreshold || 10);
    const category = String(req.body?.category || 'Other').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();
    const distanceKm = Number(req.body?.distanceKm || medicine.distanceKm || 1.5);

    if (!name || Number.isNaN(price) || Number.isNaN(stock)) {
      return res.status(400).json({ message: 'Medicine name, price, and stock are required.' });
    }

    medicine.name = name;
    medicine.price = price;
    medicine.stock = stock;
    medicine.lowStockThreshold = lowStockThreshold;
    medicine.category = category;
    medicine.imageUrl = imageUrl;
    medicine.distanceKm = distanceKm;
    await medicine.save();

    const shop = await Shop.findById(shopId);
    return res.json({ shop: shop ? shopToResponse(shop) : null, medicine: medicineToResponse(medicine) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update medicine.', error: error.message });
  }
});

app.delete('/api/shopkeepers/:shopId/medicines/:medicineId', async (req, res) => {
  try {
    const { shopId, medicineId } = req.params;
    const medicine = await Medicine.findOneAndDelete({ _id: medicineId, shopId });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found.' });
    }

    return res.json({ message: 'Medicine deleted successfully.', deletedId: String(medicine._id) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete medicine.', error: error.message });
  }
});

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: 'Unexpected server error.', error: error.message });
});

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    await ensureSeedData();

    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
};

startServer();