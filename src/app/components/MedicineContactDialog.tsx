import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Send, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface MedicineContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacy: {
    id: string;
    name: string;
    address: string;
    phone: string;
    shopImage?: string;
  };
  medicine: {
    name: string;
    price: number;
    image?: string;
  };
}

export default function MedicineContactDialog({
  open,
  onOpenChange,
  pharmacy,
  medicine,
}: MedicineContactDialogProps) {
  const [message, setMessage] = useState(
    `Hello, I would like to confirm the availability of ${medicine.name} at ₹${medicine.price}. Is this medicine currently in stock?`
  );

  const handleSendMessage = () => {
    toast.success('Message sent to pharmacy! They will respond shortly.');
    onOpenChange(false);
  };

  const handleWhatsAppMessage = () => {
    const whatsappMessage = encodeURIComponent(
      `Hello ${pharmacy.name},\n\nI would like to confirm the availability of:\n\n*Medicine:* ${medicine.name}\n*Price:* ₹${medicine.price}\n\nIs this medicine currently in stock?\n\nThank you!`
    );
    const phoneNumber = pharmacy.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contact Pharmacy</DialogTitle>
          <DialogDescription>Send a message or contact the pharmacy via WhatsApp</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Pharmacy Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex gap-4">
              {pharmacy.shopImage && (
                <ImageWithFallback
                  src={pharmacy.shopImage}
                  alt={pharmacy.name}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg mb-1">{pharmacy.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{pharmacy.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{pharmacy.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medicine Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <Label className="text-sm text-gray-600 mb-2 block">Enquiring About:</Label>
            <div className="flex gap-4 items-center">
              {medicine.image && (
                <ImageWithFallback
                  src={medicine.image}
                  alt={medicine.name}
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div>
                <p className="text-lg">{medicine.name}</p>
                <p className="text-xl text-green-600">₹{medicine.price}</p>
              </div>
            </div>
          </div>

          {/* Message Box */}
          <div>
            <Label htmlFor="contact-message">Your Message</Label>
            <Textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-2"
              placeholder="Type your message here..."
            />
            <p className="text-xs text-gray-500 mt-1">
              The pharmacy will receive your message and contact details
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSendMessage}
              className="flex-1"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button
              onClick={handleWhatsAppMessage}
              variant="outline"
              className="flex-1 bg-green-50 border-green-200 hover:bg-green-100"
            >
              <Phone className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <p>
              💡 <strong>Tip:</strong> It's always good to confirm availability before visiting the pharmacy. You can also call them directly at {pharmacy.phone}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
