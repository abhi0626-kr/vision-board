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
  onToggleWish 
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

    // Interleave items for visual variety
    return filtered.sort(() => Math.random() - 0.5);
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
          {item.type === 'theory' && <TheoryCard theory={item.data} />}
          {item.type === 'wish' && <WishCard wish={item.data} onToggle={onToggleWish} />}
          {item.type === 'image' && <ImageCard image={item.data} />}
          {item.type === 'video' && <VideoCard video={item.data} />}
        </div>
      ))}
    </div>
  );
}
