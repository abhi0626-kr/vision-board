import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Category, Theory, Wish, VisionImage, VisionVideo } from '@/types/vision';
import { Header } from '@/components/vision/Header';
import { CategoryFilter } from '@/components/vision/CategoryFilter';
import { VisionGrid } from '@/components/vision/VisionGrid';
import { EditTheoryDialog } from '@/components/vision/EditTheoryDialog';
import { EditWishDialog } from '@/components/vision/EditWishDialog';
import { EditImageDialog } from '@/components/vision/EditImageDialog';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/vision/ThemeToggle';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const mapImageRow = (row: any, id?: string): VisionImage => ({
  id: id ?? row.id,
  src: row.src,
  alt: row.alt,
  category: row.category as Category,
});

const mapVideoRow = (row: any, id?: string): VisionVideo => ({
  id: id ?? row.id,
  url: row.url,
  title: row.title,
  category: row.category as Category,
  thumbnail: row.thumbnail ?? undefined,
});

const mapTheoryRow = (row: any, id?: string): Theory => ({
  id: id ?? row.id,
  title: row.title,
  content: row.content,
  author: row.author ?? undefined,
  category: row.category as Category,
});

const mapWishRow = (row: any, id?: string): Wish => ({
  id: id ?? row.id,
  title: row.title,
  description: row.description ?? undefined,
  category: row.category as Category,
  completed: row.completed,
  progress: row.progress ?? undefined,
  createdAt: row.createdAt ?? undefined,
  achievedAt: row.achievedAt ?? undefined,
});

const sortByCreatedAtDesc = <T,>(items: T[]) => {
  return [...items].sort((left, right) => {
    const leftCreatedAt = (left as { createdAt?: string }).createdAt || '';
    const rightCreatedAt = (right as { createdAt?: string }).createdAt || '';
    return rightCreatedAt.localeCompare(leftCreatedAt);
  });
};

const createFallbackId = () => {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString();
};

const Index = () => {
  const VAULT_SHORTCUT = '2006';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signOut } = useAuth();
  const [images, setImages] = useState<VisionImage[]>([]);
  const [videos, setVideos] = useState<VisionVideo[]>([]);
  const [theories, setTheories] = useState<Theory[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const updatingWishIdsRef = useRef(new Set<string>());
  const recentlyUpdatedWishesRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingTheory, setEditingTheory] = useState<Theory | null>(null);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [editingImage, setEditingImage] = useState<VisionImage | null>(null);
  const [homeLongNotes, setHomeLongNotes] = useState('');
  const keyBufferRef = useRef('');
  const footerTapCountRef = useRef(0);
  const footerLastTapRef = useRef(0);

  useEffect(() => {
    const handleSecretShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1) return;

      keyBufferRef.current = `${keyBufferRef.current}${event.key.toLowerCase()}`.slice(-VAULT_SHORTCUT.length);

      if (keyBufferRef.current === VAULT_SHORTCUT) {
        keyBufferRef.current = '';
        navigate('/abhi');
      }
    };

    window.addEventListener('keydown', handleSecretShortcut);
    return () => window.removeEventListener('keydown', handleSecretShortcut);
  }, [navigate]);

  const handleFooterSecretTap = () => {
    const now = Date.now();
    const withinWindow = now - footerLastTapRef.current <= 1200;

    footerTapCountRef.current = withinWindow ? footerTapCountRef.current + 1 : 1;
    footerLastTapRef.current = now;

    if (footerTapCountRef.current >= 5) {
      footerTapCountRef.current = 0;
      footerLastTapRef.current = 0;
      navigate('/abhi');
    }
  };

  const handleReflectionSaved = useCallback((longNotes: string) => {
    setHomeLongNotes(longNotes);
  }, []);

  const notifyFirestoreFailure = useCallback((action: string, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to ${action}:`, error);
    toast({
      title: `Could not ${action}`,
      description: message,
      variant: 'destructive',
    });
  }, [toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    if (!isFirebaseConfigured || !db) {
      setLoadError('Firebase is not configured.');
      return;
    }

    let active = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [imagesSnapshot, videosSnapshot, theoriesSnapshot, wishesSnapshot, reflectionSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'vision_images'), where('userId', '==', user.id))),
          getDocs(query(collection(db, 'vision_videos'), where('userId', '==', user.id))),
          getDocs(query(collection(db, 'vision_theories'), where('userId', '==', user.id))),
          getDocs(query(collection(db, 'vision_wishes'), where('userId', '==', user.id))),
          getDoc(doc(db, 'user_reflections', user.id)),
        ]);

        if (!active) return;

        setImages(sortByCreatedAtDesc(imagesSnapshot.docs.map((entry) => mapImageRow(entry.data(), entry.id))));
        setVideos(sortByCreatedAtDesc(videosSnapshot.docs.map((entry) => mapVideoRow(entry.data(), entry.id))));
        setTheories(sortByCreatedAtDesc(theoriesSnapshot.docs.map((entry) => mapTheoryRow(entry.data(), entry.id))));
        setWishes(sortByCreatedAtDesc(wishesSnapshot.docs.map((entry) => mapWishRow(entry.data(), entry.id))));
        setHomeLongNotes(reflectionSnapshot.exists() ? (reflectionSnapshot.data().longNotes || '') : '');
      } catch (error) {
        console.error('Failed to load Firebase data:', error);
        if (active) {
          setLoadError('Failed to load data from Firebase.');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    const imagesQuery = query(collection(db, 'vision_images'), where('userId', '==', user.id));
    const videosQuery = query(collection(db, 'vision_videos'), where('userId', '==', user.id));
    const theoriesQuery = query(collection(db, 'vision_theories'), where('userId', '==', user.id));
    const wishesQuery = query(collection(db, 'vision_wishes'), where('userId', '==', user.id));
    const reflectionRef = doc(db, 'user_reflections', user.id);

    const unsubscribeImages = onSnapshot(
      imagesQuery,
      (snapshot) => {
        if (!active) return;

        setImages(sortByCreatedAtDesc(snapshot.docs.map((entry) => mapImageRow(entry.data(), entry.id))));
      },
      (error) => {
        if (active) {
          notifyFirestoreFailure('keep images in sync with Firestore', error);
          setLoadError('Failed to keep images in sync with Firebase.');
        }
      }
    );

    const unsubscribeVideos = onSnapshot(
      videosQuery,
      (snapshot) => {
        if (!active) return;

        setVideos(sortByCreatedAtDesc(snapshot.docs.map((entry) => mapVideoRow(entry.data(), entry.id))));
      },
      (error) => {
        if (active) {
          notifyFirestoreFailure('keep videos in sync with Firestore', error);
          setLoadError('Failed to keep videos in sync with Firebase.');
        }
      }
    );

    const unsubscribeTheories = onSnapshot(
      theoriesQuery,
      (snapshot) => {
        if (!active) return;

        setTheories(sortByCreatedAtDesc(snapshot.docs.map((entry) => mapTheoryRow(entry.data(), entry.id))));
      },
      (error) => {
        if (active) {
          notifyFirestoreFailure('keep theories in sync with Firestore', error);
          setLoadError('Failed to keep theories in sync with Firebase.');
        }
      }
    );

    const unsubscribeWishes = onSnapshot(
      wishesQuery,
      (snapshot) => {
        if (!active) return;
        // eslint-disable-next-line no-console
        console.log('Wishes listener fired, snapshot docs:', snapshot.docs.length);
        const updatedWishes = sortByCreatedAtDesc(snapshot.docs.map((entry) => {
          const mapped = mapWishRow(entry.data(), entry.id);
          // Skip listener update for recently-updated wishes to prevent overwriting optimistic updates
          if (recentlyUpdatedWishesRef.current.has(mapped.id)) {
            // eslint-disable-next-line no-console
            console.log('Skipping listener update for recently-updated wish:', mapped.id);
            // Return current state for this wish instead of listener data
            return wishes.find(w => w.id === mapped.id) || mapped;
          }
          // eslint-disable-next-line no-console
          console.log('Wish from listener:', { id: mapped.id, completed: mapped.completed });
          return mapped;
        }));
        setWishes(updatedWishes);
      },
      (error) => {
        if (active) {
          notifyFirestoreFailure('keep wishes in sync with Firestore', error);
          setLoadError('Failed to keep wishes in sync with Firebase.');
        }
      }
    );

    const unsubscribeReflection = onSnapshot(
      reflectionRef,
      (snapshot) => {
        if (!active) return;

        setHomeLongNotes(snapshot.exists() ? (snapshot.data().longNotes || '') : '');
      },
      (error) => {
        if (active) {
          notifyFirestoreFailure('keep reflections in sync with Firestore', error);
          setLoadError('Failed to keep reflections in sync with Firebase.');
        }
      }
    );

    return () => {
      active = false;
      unsubscribeImages();
      unsubscribeVideos();
      unsubscribeTheories();
      unsubscribeWishes();
      unsubscribeReflection();
    };
  }, [user]);

  const handleAddTheory = useCallback(async (newTheory: Omit<Theory, 'id'>) => {
    const createdAt = new Date().toISOString();

    if (!user || !isFirebaseConfigured || !db) {
      setTheories((prev) => [{ ...newTheory, id: createFallbackId() }, ...prev]);
      return;
    }

    try {
      const ref = await addDoc(collection(db, 'vision_theories'), {
        userId: user.id,
        title: newTheory.title,
        content: newTheory.content,
        author: newTheory.author ?? null,
        category: newTheory.category,
        createdAt,
        updatedAt: createdAt,
      });

      setTheories((prev) => [{ ...newTheory, id: ref.id }, ...prev]);
    } catch (error) {
      console.error('Failed to add theory:', error);
      setTheories((prev) => [{ ...newTheory, id: createFallbackId() }, ...prev]);
    }
  }, [user]);

  const handleAddWish = useCallback(async (newWish: Omit<Wish, 'id'>) => {
    const createdAt = new Date().toISOString();

    if (!user || !isFirebaseConfigured || !db) {
      setWishes((prev) => [
        {
          ...newWish,
          id: createFallbackId(),
          createdAt,
          achievedAt: newWish.completed ? createdAt : null,
        },
        ...prev,
      ]);
      return;
    }

    try {
      const ref = await addDoc(collection(db, 'vision_wishes'), {
        userId: user.id,
        title: newWish.title,
        description: newWish.description ?? null,
        category: newWish.category,
        completed: newWish.completed,
        progress: newWish.progress ?? null,
        createdAt,
        updatedAt: createdAt,
        achievedAt: newWish.completed ? createdAt : null,
      });

      // Insert the new wish into state, ensuring we don't create duplicates
      setWishes((prev) => {
        const filtered = prev.filter((w) => w.id !== ref.id);
        return [
          {
            ...newWish,
            id: ref.id,
            createdAt,
            achievedAt: newWish.completed ? createdAt : null,
          },
          ...filtered,
        ];
      });
    } catch (error) {
      console.error('Failed to add wish:', error);
      setWishes((prev) => [
        {
          ...newWish,
          id: createFallbackId(),
          createdAt,
          achievedAt: newWish.completed ? createdAt : null,
        },
        ...prev,
      ]);
    }
  }, [user]);

  const handleAddImage = useCallback(async (newImage: Omit<VisionImage, 'id'>) => {
    const createdAt = new Date().toISOString();

    if (!user || !isFirebaseConfigured || !db) {
      setImages((prev) => [{ ...newImage, id: createFallbackId() }, ...prev]);
      return;
    }

    try {
      const ref = await addDoc(collection(db, 'vision_images'), {
        userId: user.id,
        src: newImage.src,
        alt: newImage.alt,
        category: newImage.category,
        createdAt,
        updatedAt: createdAt,
      });

      setImages((prev) => [{ ...newImage, id: ref.id }, ...prev]);
    } catch (error) {
      console.error('Failed to add image:', error);
      setImages((prev) => [{ ...newImage, id: createFallbackId() }, ...prev]);
    }
  }, [user]);

  const handleToggleWish = useCallback(async (id: string) => {
    let nextCompleted = false;
    let nextProgress: number | undefined;
    let nextAchievedAt: string | null = null;
    const now = new Date().toISOString();

    // Prevent concurrent toggles on the same wish
    if (updatingWishIdsRef.current.has(id)) {
      // eslint-disable-next-line no-console
      console.log('Toggle ignored (in-flight):', id);
      return;
    }
    // eslint-disable-next-line no-console
    console.log('Toggle starting for:', id);
    updatingWishIdsRef.current.add(id);
    // eslint-disable-next-line no-console
    console.log('Added to updating set:', id);

    setWishes((prev) => {
      // eslint-disable-next-line no-console
      console.log('setWishes called, current wishes count:', prev.length);
      return prev.map((wish) => {
        if (wish.id !== id) return wish;
        // eslint-disable-next-line no-console
        console.log('Found wish to toggle, current completed:', wish.completed);
        nextCompleted = !wish.completed;
        nextProgress = wish.completed ? wish.progress : 100;
        nextAchievedAt = nextCompleted ? (wish.achievedAt ?? now) : null;
        // eslint-disable-next-line no-console
        console.log('Updated wish state:', { nextCompleted, nextProgress, nextAchievedAt });
        return { ...wish, completed: nextCompleted, progress: nextProgress, achievedAt: nextAchievedAt ?? undefined };
      });
    });

    // Mark this wish as recently updated so listener skips it temporarily
    const oldTimeout = recentlyUpdatedWishesRef.current.get(id);
    if (oldTimeout) clearTimeout(oldTimeout);
    recentlyUpdatedWishesRef.current.set(id, setTimeout(() => {
      recentlyUpdatedWishesRef.current.delete(id);
      // eslint-disable-next-line no-console
      console.log('Cleared recently-updated flag for wish:', id);
    }, 2000));
    // eslint-disable-next-line no-console
    console.log('Marked wish as recently-updated:', id);

    if (!isFirebaseConfigured || !db) return;

    try {
      await setDoc(
        doc(db, 'vision_wishes', id),
        {
          completed: nextCompleted,
          progress: nextProgress ?? null,
          achievedAt: nextAchievedAt,
          updatedAt: now,
        },
        { merge: true }
      );
      // eslint-disable-next-line no-console
      console.log('setDoc completed for wish:', id, 'completed:', nextCompleted);
    } catch (error) {
      notifyFirestoreFailure('update wish', error);
    }
    finally {
      updatingWishIdsRef.current.delete(id);
      // eslint-disable-next-line no-console
      console.log('Removed from updating set:', id);
    }
  }, [isFirebaseConfigured, db, notifyFirestoreFailure]);

  const handleSaveTheory = useCallback(async (updatedTheory: Theory) => {
    setTheories((prev) => prev.map((theory) => (theory.id === updatedTheory.id ? updatedTheory : theory)));

    if (!isFirebaseConfigured || !db) return;

    try {
      await setDoc(
        doc(db, 'vision_theories', updatedTheory.id),
        {
          title: updatedTheory.title,
          content: updatedTheory.content,
          author: updatedTheory.author ?? null,
          category: updatedTheory.category,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      notifyFirestoreFailure('update theory', error);
    }
  }, []);

  const handleDeleteTheory = useCallback(async (id: string) => {
    setTheories((prev) => prev.filter((theory) => theory.id !== id));

    if (!isFirebaseConfigured || !db) return;

    try {
      await deleteDoc(doc(db, 'vision_theories', id));
    } catch (error) {
      notifyFirestoreFailure('delete theory', error);
    }
  }, []);

  const handleSaveWish = useCallback(async (updatedWish: Wish) => {
    let nextAchievedAt: string | null = updatedWish.achievedAt ?? null;
    const now = new Date().toISOString();

    setWishes((prev) => prev.map((wish) => {
      if (wish.id !== updatedWish.id) return wish;

      nextAchievedAt = updatedWish.completed
        ? (updatedWish.achievedAt ?? wish.achievedAt ?? now)
        : null;

      return { ...updatedWish, achievedAt: nextAchievedAt ?? undefined };
    }));

    if (!isFirebaseConfigured || !db) return;

    try {
      await setDoc(
        doc(db, 'vision_wishes', updatedWish.id),
        {
          title: updatedWish.title,
          description: updatedWish.description ?? null,
          category: updatedWish.category,
          completed: updatedWish.completed,
          progress: updatedWish.progress ?? null,
          achievedAt: nextAchievedAt,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (error) {
      notifyFirestoreFailure('update wish', error);
    }
  }, []);

  const handleDeleteWish = useCallback(async (id: string) => {
    setWishes((prev) => prev.filter((wish) => wish.id !== id));

    if (!isFirebaseConfigured || !db) return;

    try {
      await deleteDoc(doc(db, 'vision_wishes', id));
    } catch (error) {
      notifyFirestoreFailure('delete wish', error);
    }
  }, []);

  const handleSaveImage = useCallback(async (updatedImage: VisionImage) => {
    setImages((prev) => prev.map((image) => (image.id === updatedImage.id ? updatedImage : image)));

    if (!isFirebaseConfigured || !db) return;

    try {
      await setDoc(
        doc(db, 'vision_images', updatedImage.id),
        {
          src: updatedImage.src,
          alt: updatedImage.alt,
          category: updatedImage.category,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      notifyFirestoreFailure('update image', error);
    }
  }, []);

  const handleDeleteImage = useCallback(async (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id));

    if (!isFirebaseConfigured || !db) return;

    try {
      await deleteDoc(doc(db, 'vision_images', id));
    } catch (error) {
      notifyFirestoreFailure('delete image', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative">
        <Header
          onAddTheory={handleAddTheory}
          onAddWish={handleAddWish}
          onAddImage={handleAddImage}
          onReflectionSaved={handleReflectionSaved}
          images={images}
          videos={videos}
          theories={theories}
          wishes={wishes}
        />
        
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
        {/* Category Filter */}
        <div className="mb-12 space-y-6">
          <CategoryFilter selected={categoryFilter} onChange={setCategoryFilter} />
        </div>

        {homeLongNotes.trim().length > 0 && (
          <section className="mb-10 rounded-xl border border-border/40 bg-secondary/25 p-4 md:p-6">
            <h2 className="mb-2 font-serif text-2xl text-foreground">Long Notes</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground md:text-base">
              {homeLongNotes}
            </p>
          </section>
        )}
        
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
          <p
            className="font-serif text-sm text-muted-foreground select-none"
            onClick={handleFooterSecretTap}
          >
            Your vision, your journey, your becoming.
          </p>
        </div>
      </footer>

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
