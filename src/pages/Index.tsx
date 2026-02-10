import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, Theory, Wish, VisionImage, VisionVideo } from '@/types/vision';
import { initialImages, initialVideos, initialTheories, initialWishes } from '@/data/initialData';
import { Header } from '@/components/vision/Header';
import { CategoryFilter } from '@/components/vision/CategoryFilter';
import { VisionGrid } from '@/components/vision/VisionGrid';
import { FocusMode } from '@/components/vision/FocusMode';
import { EditTheoryDialog } from '@/components/vision/EditTheoryDialog';
import { EditWishDialog } from '@/components/vision/EditWishDialog';
import { EditImageDialog } from '@/components/vision/EditImageDialog';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/vision/ThemeToggle';
import { Focus, LogOut, User } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';

const mapImageRow = (row: any): VisionImage => ({
  id: row.id,
  src: row.src,
  alt: row.alt,
  category: row.category as Category,
});

const mapVideoRow = (row: any): VisionVideo => ({
  id: row.id,
  url: row.url,
  title: row.title,
  category: row.category as Category,
  thumbnail: row.thumbnail ?? undefined,
});

const mapTheoryRow = (row: any): Theory => ({
  id: row.id,
  title: row.title,
  content: row.content,
  author: row.author ?? undefined,
  category: row.category as Category,
});

const mapWishRow = (row: any): Wish => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  category: row.category as Category,
  completed: row.completed,
  progress: row.progress ?? undefined,
});

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [images, setImages] = useState<VisionImage[]>([]);
  const [videos, setVideos] = useState<VisionVideo[]>([]);
  const [theories, setTheories] = useState<Theory[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Focus mode state
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  
  // Edit dialogs state
  const [editingTheory, setEditingTheory] = useState<Theory | null>(null);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [editingImage, setEditingImage] = useState<VisionImage | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user) return;

    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      const [imagesResult, videosResult, theoriesResult, wishesResult] = await Promise.all([
        supabase.from('vision_images').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vision_videos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vision_theories').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vision_wishes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (!isMounted) return;

      if (imagesResult.error || videosResult.error || theoriesResult.error || wishesResult.error) {
        setLoadError('Failed to load data from Supabase.');
        setIsLoading(false);
        return;
      }

      const imagesData = imagesResult.data?.map(mapImageRow) ?? [];
      const videosData = videosResult.data?.map(mapVideoRow) ?? [];
      const theoriesData = theoriesResult.data?.map(mapTheoryRow) ?? [];
      const wishesData = wishesResult.data?.map(mapWishRow) ?? [];

      // Show demo data if user has no content at all
      const hasNoData = imagesData.length === 0 && videosData.length === 0 && 
                        theoriesData.length === 0 && wishesData.length === 0;

      setImages(hasNoData ? initialImages : imagesData);
      setVideos(hasNoData ? initialVideos : videosData);
      setTheories(hasNoData ? initialTheories : theoriesData);
      setWishes(hasNoData ? initialWishes : wishesData);
      setIsLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAddTheory = useCallback(async (newTheory: Omit<Theory, 'id'>) => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setTheories(prev => [
        { ...newTheory, id: Date.now().toString() },
        ...prev,
      ]);
      return;
    }

    const { data, error } = await supabase
      .from('vision_theories')
      .insert({
        user_id: user.id,
        title: newTheory.title,
        content: newTheory.content,
        author: newTheory.author ?? null,
        category: newTheory.category,
      })
      .select('*')
      .single();

    if (error || !data) {
      setTheories(prev => [
        { ...newTheory, id: Date.now().toString() },
        ...prev,
      ]);
      return;
    }

    setTheories(prev => [mapTheoryRow(data), ...prev]);
  }, [user]);

  const handleAddWish = useCallback(async (newWish: Omit<Wish, 'id'>) => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setWishes(prev => [
        { ...newWish, id: Date.now().toString() },
        ...prev,
      ]);
      return;
    }

    const { data, error } = await supabase
      .from('vision_wishes')
      .insert({
        user_id: user.id,
        title: newWish.title,
        description: newWish.description ?? null,
        category: newWish.category,
        completed: newWish.completed,
        progress: newWish.progress ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      setWishes(prev => [
        { ...newWish, id: Date.now().toString() },
        ...prev,
      ]);
      return;
    }

    setWishes(prev => [mapWishRow(data), ...prev]);
  }, [user]);

  const handleAddImage = useCallback(async (newImage: Omit<VisionImage, 'id'>) => {
    if (!isSupabaseConfigured || !supabase || !user) {
      setImages(prev => [
        { ...newImage, id: Date.now().toString() },
        ...prev,
      ]);
      return;
    }

    const { data, error } = await supabase
      .from('vision_images')
      .insert({
        user_id: user.id,
        src: newImage.src,
        alt: newImage.alt,
        category: newImage.category,
      })
      .select('*')
      .single();

    if (error || !data) {
      setImages(prev => [
        { ...newImage, id: Date.now().toString() },
        ...prev,
      ]);
      return;
    }

    setImages(prev => [mapImageRow(data), ...prev]);
  }, [user]);

  const handleToggleWish = useCallback(async (id: string) => {
    let nextCompleted = false;
    let nextProgress: number | undefined;

    setWishes(prev => prev.map(wish => {
      if (wish.id !== id) return wish;
      nextCompleted = !wish.completed;
      nextProgress = wish.completed ? wish.progress : 100;
      return { ...wish, completed: nextCompleted, progress: nextProgress };
    }));

    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('vision_wishes')
      .update({
        completed: nextCompleted,
        progress: nextProgress ?? null,
      })
      .eq('id', id);
  }, []);

  // Edit handlers
  const handleSaveTheory = useCallback(async (updatedTheory: Theory) => {
    setTheories(prev => prev.map(t => t.id === updatedTheory.id ? updatedTheory : t));

    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('vision_theories')
      .update({
        title: updatedTheory.title,
        content: updatedTheory.content,
        author: updatedTheory.author ?? null,
        category: updatedTheory.category,
      })
      .eq('id', updatedTheory.id);
  }, []);

  const handleDeleteTheory = useCallback(async (id: string) => {
    setTheories(prev => prev.filter(t => t.id !== id));

    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('vision_theories')
      .delete()
      .eq('id', id);
  }, []);

  const handleSaveWish = useCallback(async (updatedWish: Wish) => {
    setWishes(prev => prev.map(w => w.id === updatedWish.id ? updatedWish : w));

    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('vision_wishes')
      .update({
        title: updatedWish.title,
        description: updatedWish.description ?? null,
        category: updatedWish.category,
        completed: updatedWish.completed,
        progress: updatedWish.progress ?? null,
      })
      .eq('id', updatedWish.id);
  }, []);

  const handleDeleteWish = useCallback(async (id: string) => {
    setWishes(prev => prev.filter(w => w.id !== id));

    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('vision_wishes')
      .delete()
      .eq('id', id);
  }, []);

  // Image handlers
  const handleSaveImage = useCallback(async (updatedImage: VisionImage) => {
    setImages(prev => prev.map(img => img.id === updatedImage.id ? updatedImage : img));

    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('vision_images')
      .update({
        src: updatedImage.src,
        alt: updatedImage.alt,
        category: updatedImage.category,
      })
      .eq('id', updatedImage.id);
  }, []);

  const handleDeleteImage = useCallback(async (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));

    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('vision_images')
      .delete()
      .eq('id', id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative">
        <Header onAddTheory={handleAddTheory} onAddWish={handleAddWish} onAddImage={handleAddImage} />
        
        {/* Top right controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="text-muted-foreground hover:text-foreground"
            title="Profile"
          >
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container pb-16">
        {isLoading && (
          <div className="mb-6 rounded-lg border border-border/40 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
            Loading your vision board...
          </div>
        )}
        {loadError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}
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
          onEditImage={setEditingImage}
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

      <EditImageDialog
        image={editingImage}
        open={!!editingImage}
        onOpenChange={(open) => !open && setEditingImage(null)}
        onSave={handleSaveImage}
        onDelete={handleDeleteImage}
      />
    </div>
  );
};

export default Index;
