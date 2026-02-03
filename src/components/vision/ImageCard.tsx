import { VisionImage } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';

interface ImageCardProps {
  image: VisionImage;
}

export function ImageCard({ image }: ImageCardProps) {
  return (
    <article className="masonry-item">
      <div className="group relative overflow-hidden rounded-lg hover-lift transition-all duration-300">
        {/* Image */}
        <div className="aspect-[4/5] overflow-hidden bg-charcoal-light">
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="inline-block px-2 py-1 text-xs font-sans uppercase tracking-wider text-gold bg-charcoal/50 rounded mb-2">
              {categoryLabels[image.category]}
            </span>
            <p className="font-serif text-sm text-cream">{image.alt}</p>
          </div>
        </div>
        
        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-lg border border-gold/0 group-hover:border-gold/20 transition-colors duration-300 pointer-events-none" />
      </div>
    </article>
  );
}
