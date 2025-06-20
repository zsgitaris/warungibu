
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import MenuCard from "@/components/home/MenuCard";
import SearchBar from "@/components/search/SearchBar";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/common/PaginationControls";

interface MenuPageProps {
  user?: User | null;
  onBack: () => void;
  selectedCategoryId?: string | null;
  initialSearchQuery?: string;
  onShowAuth: () => void;
}

const MenuPage = ({ user, onBack, selectedCategoryId, initialSearchQuery = "", onShowAuth }: MenuPageProps) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(selectedCategoryId || null);

  // Update selected category when prop changes
  useEffect(() => {
    if (selectedCategoryId) {
      console.log("Setting initial category filter:", selectedCategoryId);
      setSelectedCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // Update search query when initial prop changes
  useEffect(() => {
    if (initialSearchQuery) {
      console.log("Setting initial search query:", initialSearchQuery);
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('is_available', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      query = query.order('name');

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Pagination
  const {
    currentItems: paginatedMenuItems,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    canGoNext,
    canGoPrev,
  } = usePagination({ data: menuItems, itemsPerPage: 12 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button onClick={onBack} variant="ghost" size="sm">
          ← Kembali
        </Button>
        <h1 className="text-2xl font-bold ml-4">Menu Lengkap</h1>
      </div>

      <div className="mb-6">
        <SearchBar 
          onSearch={setSearchQuery} 
          initialValue={searchQuery}
          placeholder="Cari menu..."
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          Semua
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className={selectedCategory === category.id ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Tidak ada menu yang ditemukan</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMenuItems.map((item) => (
              <MenuCard key={item.id} item={item} user={user} onShowAuth={onShowAuth} />
            ))}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={goToPage}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            itemsPerPage={12}
          />
        </>
      )}
    </div>
  );
};

export default MenuPage;
