import { useState, useEffect, useCallback } from 'react';
import { Theory, Wish, VisionImage, VisionVideo } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import { X, ChevronLeft, ChevronRight, Quote, Star, Image, Video, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FocusModeProps {
  images: VisionImage[];
  videos: VisionVideo[];
  theories: Theory[];
  wishes: Wish[];
  isOpen: boolean;
  onClose: () => void;
}

type FocusItem = 
  | { type: 'image'; data: VisionImage }
  | { type: 'video'; data: VisionVideo }
  | { type: 'theory'; data: Theory }
  | { type: 'wish'; data: Wish };

export function FocusMode({ images, videos, theories, wishes, isOpen, onClose }: FocusModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<FocusItem[]>([]);

  // Build and shuffle items
  const shuffleItems = useCallback(() => {
    const allItems: FocusItem[] = [
      ...images.map(data => ({ type: 'image' as const, data })),
      ...videos.map(data => ({ type: 'video' as const, data })),
      ...theories.map(data => ({ type: 'theory' as const, data })),
      ...wishes.map(data => ({ type: 'wish' as const, data })),
    ];
    const shuffled = allItems.sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setCurrentIndex(0);
  }, [images, videos, theories, wishes]);

  useEffect(() => {
    if (isOpen) {
      shuffleItems();
    }
  }, [isOpen, shuffleItems]);

  const goNext = () => setCurrentIndex(prev => (prev + 1) % items.length);
  const goPrev = () => setCurrentIndex(prev => (prev - 1 + items.length) % items.length);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || items.length === 0) return null;

  const current = items[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex items-center justify-center animate-fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Shuffle button */}
      <button
        onClick={shuffleItems}
        className="absolute top-6 left-6 p-2 rounded-full bg-card hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2 px-4"
      >
        <Shuffle className="h-4 w-4" />
        <span className="text-sm">Shuffle</span>
      </button>

      {/* Navigation */}
      <button
        onClick={goPrev}
        className="absolute left-4 md:left-8 p-3 rounded-full bg-card hover:bg-secondary transition-all hover:scale-110 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={goNext}
        className="absolute right-4 md:right-8 p-3 rounded-full bg-card hover:bg-secondary transition-all hover:scale-110 text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Content */}
      <div className="max-w-2xl w-full mx-8 animate-scale-in" key={currentIndex}>
        {current.type === 'theory' && (
          <div className="text-center space-y-6 p-8">
            <Quote className="h-12 w-12 mx-auto text-gold/30" />
            <span className="inline-block px-3 py-1 text-xs font-sans uppercase tracking-wider text-gold bg-gold/10 rounded-full">
              {categoryLabels[current.data.category]}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              {current.data.title}
            </h2>
            <blockquote className="font-serif text-xl md:text-2xl italic text-cream-muted leading-relaxed">
              "{current.data.content}"
            </blockquote>
            {current.data.author && (
              <cite className="block font-sans text-lg not-italic text-gold">
                — {current.data.author}
              </cite>
            )}
          </div>
        )}

        {current.type === 'wish' && (
          <div className="text-center space-y-6 p-8">
            <Star className={`h-12 w-12 mx-auto ${current.data.completed ? 'text-gold fill-gold' : 'text-gold/30'}`} />
            <span className="inline-block px-3 py-1 text-xs font-sans uppercase tracking-wider text-gold bg-gold/10 rounded-full">
              {categoryLabels[current.data.category]}
            </span>
            <h2 className={`font-serif text-3xl md:text-4xl font-semibold ${current.data.completed ? 'text-gold' : 'text-foreground'}`}>
              {current.data.title}
            </h2>
            {current.data.description && (
              <p className="font-sans text-lg text-cream-muted">
                {current.data.description}
              </p>
            )}
            {current.data.progress !== undefined && (
              <div className="max-w-xs mx-auto space-y-2">
                <Progress value={current.data.progress} className="h-2" />
                <span className="text-sm text-gold">{current.data.progress}% complete</span>
              </div>
            )}
          </div>
        )}

        {current.type === 'image' && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden shadow-2xl">
              <img
                src={current.data.src}
                alt={current.data.alt}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 text-xs font-sans uppercase tracking-wider text-gold bg-gold/10 rounded-full mb-2">
                {categoryLabels[current.data.category]}
              </span>
              <p className="font-serif text-lg text-cream-muted">{current.data.alt}</p>
            </div>
          </div>
        )}

        {current.type === 'video' && (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={current.data.url}
                title={current.data.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 text-xs font-sans uppercase tracking-wider text-gold bg-gold/10 rounded-full mb-2">
                {categoryLabels[current.data.category]}
              </span>
              <p className="font-serif text-lg text-foreground">{current.data.title}</p>
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {items.length}
        </span>
      </div>
    </div>
  );
}
