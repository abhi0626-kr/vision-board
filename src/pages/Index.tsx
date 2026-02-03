import { useState, useCallback } from 'react';
import { Category, Theory, Wish, VisionImage, VisionVideo } from '@/types/vision';
import { initialImages, initialVideos, initialTheories, initialWishes } from '@/data/initialData';
import { Header } from '@/components/vision/Header';
import { CategoryFilter } from '@/components/vision/CategoryFilter';
import { VisionGrid } from '@/components/vision/VisionGrid';

const Index = () => {
  const [images] = useState<VisionImage[]>(initialImages);
  const [videos] = useState<VisionVideo[]>(initialVideos);
  const [theories, setTheories] = useState<Theory[]>(initialTheories);
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const handleAddTheory = useCallback((newTheory: Omit<Theory, 'id'>) => {
    setTheories(prev => [
      { ...newTheory, id: Date.now().toString() },
      ...prev,
    ]);
  }, []);

  const handleAddWish = useCallback((newWish: Omit<Wish, 'id'>) => {
    setWishes(prev => [
      { ...newWish, id: Date.now().toString() },
      ...prev,
    ]);
  }, []);

  const handleToggleWish = useCallback((id: string) => {
    setWishes(prev => prev.map(wish => 
      wish.id === id 
        ? { ...wish, completed: !wish.completed, progress: wish.completed ? wish.progress : 100 }
        : wish
    ));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <Header onAddTheory={handleAddTheory} onAddWish={handleAddWish} />
      
      {/* Main Content */}
      <main className="container pb-16">
        {/* Category Filter */}
        <div className="mb-12">
          <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
        </div>
        
        {/* Vision Grid */}
        <VisionGrid
          images={images}
          videos={videos}
          theories={theories}
          wishes={wishes}
          categoryFilter={categoryFilter}
          onToggleWish={handleToggleWish}
        />
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container text-center">
          <p className="font-serif text-sm text-muted-foreground">
            Your vision, your journey, your becoming.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
