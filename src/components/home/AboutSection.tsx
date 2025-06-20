
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-16 canvas-gradient-peach">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Tentang Warung Ibu
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Warung Ibu adalah usaha kuliner keluarga yang telah melayani masyarakat selama bertahun-tahun. 
            Kami berkomitmen untuk menyajikan makanan rumahan yang lezat, sehat, dan terjangkau dengan 
            cita rasa autentik yang mengingatkan Anda pada masakan ibu di rumah.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="bg-orange-200/90 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Selalu Fresh</h3>
              <p className="text-gray-600 text-sm">
                Semua makanan dibuat fresh setiap hari dengan bahan-bahan pilihan terbaik
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-200/90 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Lokasi Strategis</h3>
              <p className="text-gray-600 text-sm">
                Berlokasi di pusat kota dengan akses mudah dan tempat parkir yang luas
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-200/90 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Pelayanan Ramah</h3>
              <p className="text-gray-600 text-sm">
                Tim kami siap melayani dengan ramah dan memastikan kepuasan pelanggan
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
