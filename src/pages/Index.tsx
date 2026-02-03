import { useState, useCallback } from 'react';
import { Category, Theory, Wish, VisionImage, VisionVideo } from '@/types/vision';
import { initialImages, initialVideos, initialTheories, initialWishes } from '@/data/initialData';
import { Header } from '@/components/vision/Header';
import { CategoryFilter } from '@/components/vision/CategoryFilter';
import { VisionGrid } from '@/components/vision/VisionGrid';
import { FocusMode } from '@/components/vision/FocusMode';
import { EditTheoryDialog } from '@/components/vision/EditTheoryDialog';
import { EditWishDialog } from '@/components/vision/EditWishDialog';
import { Button } from '@/components/ui/button';
import { Focus } from 'lucide-react';

const Index = () => {
  const [images] = useState<VisionImage[]>(initialImages);
  const [videos] = useState<VisionVideo[]>(initialVideos);
  const [theories, setTheories] = useState<Theory[]>(initialTheories);
  const [wishes, setWishes] = useState<Wish[]>(initialWishes);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  
  // Focus mode state
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  
  // Edit dialogs state
  const [editingTheory, setEditingTheory] = useState<Theory | null>(null);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);

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

  // Edit handlers
  const handleSaveTheory = useCallback((updatedTheory: Theory) => {
    setTheories(prev => prev.map(t => t.id === updatedTheory.id ? updatedTheory : t));
  }, []);

  const handleDeleteTheory = useCallback((id: string) => {
    setTheories(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSaveWish = useCallback((updatedWish: Wish) => {
    setWishes(prev => prev.map(w => w.id === updatedWish.id ? updatedWish : w));
  }, []);

  const handleDeleteWish = useCallback((id: string) => {
    setWishes(prev => prev.filter(w => w.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <Header onAddTheory={handleAddTheory} onAddWish={handleAddWish} />
      
      {/* Main Content */}
      <main className="container pb-16">
        {/* Category Filter + Focus Mode */}
        <div className="mb-12 space-y-6">
          <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
          
          {/* Focus Mode Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setFocusModeOpen(true)}
              variant="outline"
              className="gap-2 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
            >
              <Focus className="h-4 w-4" />
              Enter Focus Mode
            </Button>
          </div>
        </div>
        
        {/* Vision Grid */}
        <VisionGrid
          images={images}
          videos={videos}
          theories={theories}
          wishes={wishes}
          categoryFilter={categoryFilter}
          onToggleWish={handleToggleWish}
          onEditTheory={setEditingTheory}
          onEditWish={setEditingWish}
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

      {/* Focus Mode */}
      <FocusMode
        images={images}
        videos={videos}
        theories={theories}
        wishes={wishes}
        isOpen={focusModeOpen}
        onClose={() => setFocusModeOpen(false)}
      />

      {/* Edit Dialogs */}
      <EditTheoryDialog
        theory={editingTheory}
        open={!!editingTheory}
        onOpenChange={(open) => !open && setEditingTheory(null)}
        onSave={handleSaveTheory}
        onDelete={handleDeleteTheory}
      />

      <EditWishDialog
        wish={editingWish}
        open={!!editingWish}
        onOpenChange={(open) => !open && setEditingWish(null)}
        onSave={handleSaveWish}
        onDelete={handleDeleteWish}
      />
    </div>
  );
};

export default Index;
