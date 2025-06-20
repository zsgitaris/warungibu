import { Phone, Mail, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-16 canvas-gradient-peach">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Hubungi Kami
            </h2>
            <p className="text-lg text-gray-600">
              Punya pertanyaan atau ingin memesan? Jangan ragu untuk menghubungi kami!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-lg shadow-medium">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Alamat</h3>
                  <p className="text-gray-600">
                    Jl.Dapur Areng<br />
                    Cengkong<br />
                    Indonesia 41376
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-lg shadow-medium">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Telepon</h3>
                  <p className="text-gray-600">
                    <a href="tel:+6281234567890" className="hover:text-orange-600 transition-colors">
                      +62 857-1919-0301
                    </a>
                  </p>
                  <p className="text-gray-600">
                    <a href="tel:+622112345678" className="hover:text-orange-600 transition-colors">
                      (021) 1234-5678
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-lg shadow-medium">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                  <p className="text-gray-600">
                    <a href="mailto:info@warungibu.com" className="hover:text-orange-600 transition-colors">
                      info@warungibu.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-lg shadow-medium">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Jam Operasional</h3>
                  <div className="text-gray-600 space-y-1">
                    <p>Senin - Kamis : 09:30 - 21:00</p>
                    <p>Jum'at - Minggu: Libur</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action - Fixed Colors */}
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-strong border border-orange-200/50 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Siap Melayani Anda
              </h3>
              <p className="text-gray-600 mb-6">
                Tim kami siap membantu Anda dengan pertanyaan apapun tentang menu, pesanan, atau layanan kami. 
                Hubungi kami melalui telepon, email, atau kunjungi langsung warung kami.
              </p>
              
              <div className="space-y-3">
                <a 
                  href="tel:+6281234567890"
                  className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 px-4 rounded-xl text-center transition-all duration-300 shadow-medium hover:shadow-strong hover:-translate-y-1"
                >
                  Hubungi Sekarang
                </a>
                <a 
                  href="mailto:info@warungibu.com"
                  className="block w-full bg-white/90 hover:bg-white text-gray-800 font-medium py-3 px-4 rounded-xl text-center transition-all duration-300 border-2 border-gray-200 hover:border-orange-300 shadow-soft hover:shadow-medium"
                >
                  Kirim Email
                </a>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-orange-100/80 to-amber-100/80 rounded-xl border border-orange-200/50">
                <h4 className="font-semibold text-orange-800 mb-2">Pesan Takeaway</h4>
                <p className="text-sm text-orange-700">
                  Untuk pemesanan takeaway, silakan hubungi kami minimal 30 menit sebelum waktu pengambilan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;