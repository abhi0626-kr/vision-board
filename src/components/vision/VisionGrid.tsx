import { VisionImage, VisionVideo, Theory, Wish, Category } from '@/types/vision';
import { TheoryCard } from './TheoryCard';
import { WishCard } from './WishCard';
import { ImageCard } from './ImageCard';
import { VideoCard } from './VideoCard';
import { useMemo } from 'react';

interface VisionGridProps {
  images: VisionImage[];
  videos: VisionVideo[];
  theories: Theory[];
  wishes: Wish[];
  categoryFilter: Category | 'all';
  onToggleWish: (id: string) => void;
  onEditTheory: (theory: Theory) => void;
  onEditWish: (wish: Wish) => void;
}

type GridItem = 
  | { type: 'image'; data: VisionImage }
  | { type: 'video'; data: VisionVideo }
  | { type: 'theory'; data: Theory }
  | { type: 'wish'; data: Wish };

export function VisionGrid({ 
  images, 
  videos, 
  theories, 
  wishes, 
  categoryFilter,
  onToggleWish,
  onEditTheory,
  onEditWish,
}: VisionGridProps) {
  // Combine and filter all items
  const filteredItems = useMemo(() => {
    const items: GridItem[] = [
      ...images.map(data => ({ type: 'image' as const, data })),
      ...videos.map(data => ({ type: 'video' as const, data })),
      ...theories.map(data => ({ type: 'theory' as const, data })),
      ...wishes.map(data => ({ type: 'wish' as const, data })),
    ];

    const filtered = categoryFilter === 'all' 
      ? items 
      : items.filter(item => item.data.category === categoryFilter);

    // Stable sort by type, then id
    return filtered.sort((a, b) => {
      const typeOrder = { theory: 0, wish: 1, image: 2, video: 3 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.data.id.localeCompare(b.data.id);
    });
  }, [images, videos, theories, wishes, categoryFilter]);

  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-xl text-muted-foreground">
          No items in this category yet.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Add something to your vision board to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="masonry">
      {filteredItems.map((item, index) => (
        <div 
          key={`${item.type}-${item.data.id}`}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {item.type === 'theory' && <TheoryCard theory={item.data} onEdit={onEditTheory} />}
          {item.type === 'wish' && <WishCard wish={item.data} onToggle={onToggleWish} onEdit={onEditWish} />}
          {item.type === 'image' && <ImageCard image={item.data} />}
          {item.type === 'video' && <VideoCard video={item.data} />}
        </div>
      ))}
    </div>
  );
}
