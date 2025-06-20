
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreditCard, Smartphone, Banknote, CheckCircle, AlertCircle, Construction } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProcessing(false);
    onPaymentSuccess();
    onClose();
    
    toast({
      title: "🎉 Pesanan Berhasil!",
      description: "Pesanan Anda telah dikonfirmasi dan akan dibayar di tempat",
      className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-300 shadow-xl animate-bounce-gentle"
    });
  };

  const paymentMethods = [
    { id: 'cash', name: 'Bayar di Tempat', icon: Banknote, available: true },
    { id: 'card', name: 'Kartu Kredit/Debit', icon: CreditCard, available: false },
    { id: 'ovo', name: 'OVO', icon: Smartphone, available: false },
    { id: 'gopay', name: 'GoPay', icon: Smartphone, available: false },
    { id: 'ewallet', name: 'E-Wallet Lainnya', icon: Smartphone, available: false }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] bg-gradient-to-br from-white to-orange-50 border-orange-200 p-0">
        <div className="flex flex-col max-h-[90vh]">
          {/* Fixed Header */}
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-orange-100 flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <Banknote className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              Metode Pembayaran
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full max-h-[50vh]">
              <div className="px-4 sm:px-6 py-4 space-y-4">
                {/* Total Payment */}
                <div className="bg-gradient-to-r from-orange-100 to-amber-100 p-3 sm:p-4 rounded-xl border border-orange-200">
                  <p className="text-xs sm:text-sm text-gray-600">Total Pembayaran</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    Rp {total.toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <h3 className="text-sm sm:text-base font-medium text-gray-700">Pilih Metode Pembayaran:</h3>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2 sm:space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isDisabled = !method.available;
                      
                      return (
                        <div key={method.id} className={`flex items-center space-x-3 p-3 sm:p-4 border rounded-xl transition-all duration-200 ${
                          isDisabled 
                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}>
                          <RadioGroupItem 
                            value={method.id} 
                            id={method.id} 
                            disabled={isDisabled}
                            className={`${isDisabled ? 'opacity-50' : ''} flex-shrink-0`}
                          />
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isDisabled 
                              ? 'bg-gray-300' 
                              : 'bg-gradient-to-r from-orange-400 to-amber-500'
                          }`}>
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isDisabled ? 'text-gray-500' : 'text-white'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={method.id} 
                              className={`block text-sm sm:text-base font-medium ${
                                isDisabled 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-gray-700 cursor-pointer'
                              }`}
                            >
                              {method.name}
                            </Label>
                            {isDisabled && (
                              <div className="flex items-center gap-1 mt-1">
                                <Construction className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <span className="text-xs text-amber-600 font-medium">Dalam Pengembangan</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                {/* Information */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-blue-800 mb-1">Informasi Pembayaran</p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Pembayaran dilakukan secara tunai saat pesanan tiba di lokasi Anda. 
                        Pastikan menyiapkan uang pas atau kembalian akan diberikan oleh kurir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">Ketentuan Pembayaran:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Pembayaran dilakukan saat pesanan tiba</li>
                    <li>• Kurir akan memberikan struk pembayaran</li>
                    <li>• Pesanan dapat dibatalkan sebelum diproses</li>
                    <li>• Hubungi customer service untuk bantuan</li>
                    <li>• Pastikan alamat delivery sudah benar</li>
                    <li>• Waktu delivery 30-45 menit</li>
                    <li>• Gratis ongkir untuk pembelian minimal Rp 50.000</li>
                    <li>• Kembalian akan diberikan dalam bentuk tunai</li>
                  </ul>
                </div>

                {/* Extra content to test scroll */}
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Tips Pembayaran:</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Siapkan uang pas untuk mempercepat transaksi</li>
                    <li>• Periksa pesanan sebelum membayar</li>
                    <li>• Simpan struk untuk keperluan komplain</li>
                    <li>• Rating dan review sangat membantu kami</li>
                  </ul>
                </div>

                {/* Bottom spacing */}
                <div className="h-6"></div>
              </div>
            </ScrollArea>
          </div>

          {/* Fixed Footer */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-3 border-t border-orange-100 bg-white/90 flex-shrink-0">
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Memproses Pesanan...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Konfirmasi Pesanan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
