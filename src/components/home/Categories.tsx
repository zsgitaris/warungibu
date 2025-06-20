import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface CategoriesProps {
  categories: Category[];
  onCategoryClick?: (categoryId: string) => void;
}

const Categories = ({ categories, onCategoryClick }: CategoriesProps) => {
  const handleCategoryClick = (categoryId: string) => {
    console.log("Category clicked:", categoryId);
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
  };

  return (
    <section className="py-16 canvas-gradient-peach">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Kategori Makanan
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pilih dari berbagai kategori makanan yang kami sediakan
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 group 
                         bg-white/95 backdrop-blur-sm
                         border-2 border-orange-200/80 hover:border-orange-400/90 
                         shadow-soft hover:shadow-strong 
                         hover:-translate-y-2 hover:scale-105
                         rounded-2xl overflow-hidden"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardContent className="p-4 md:p-6 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 
                               bg-gradient-to-br from-orange-500 to-red-500 
                               rounded-full flex items-center justify-center 
                               mx-auto mb-3 md:mb-4 
                               group-hover:from-orange-600 group-hover:to-red-600 
                               transition-all duration-300 
                               overflow-hidden border-3 border-white 
                               shadow-lg group-hover:shadow-xl
                               group-hover:scale-110">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-full h-full object-cover rounded-full"
                      onLoad={(e) => {
                        console.log("Category image loaded successfully:", category.image_url);
                        const target = e.target as HTMLImageElement;
                        const fallback = target.parentElement?.querySelector('.fallback-emoji');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'none';
                        }
                      }}
                      onError={(e) => {
                        console.error("Failed to load category image:", category.image_url);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-emoji');
                        if (fallback) {
                          (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <span 
                    className="fallback-emoji text-xl md:text-2xl flex items-center justify-center w-full h-full text-white font-bold drop-shadow-lg" 
                    style={{ display: category.image_url ? 'none' : 'flex' }}
                  >
                    🍽️
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base 
                               group-hover:text-orange-600 transition-colors duration-300">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2 
                                group-hover:text-gray-700 transition-colors duration-300">
                    {category.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;