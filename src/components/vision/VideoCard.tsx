import { VisionVideo } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import { Play } from 'lucide-react';
import { useState } from 'react';

interface VideoCardProps {
  video: VisionVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID for YouTube thumbnail
  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/embed\/([^?]+)/);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    return '/placeholder.svg';
  };

  return (
    <article className="masonry-item">
      <div className="group relative overflow-hidden rounded-lg bg-card hover-lift transition-all duration-300">
        {/* Video container */}
        <div className="aspect-video overflow-hidden bg-charcoal-light relative">
          {isPlaying ? (
            <iframe
              src={`${video.url}?autoplay=1&mute=1`}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={video.thumbnail || getYouTubeThumbnail(video.url)}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Play button overlay */}
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-charcoal/40 group-hover:bg-charcoal/30 transition-colors duration-300"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/90 text-primary-foreground transition-transform duration-300 group-hover:scale-110 shadow-lg">
                  <Play className="h-7 w-7 ml-1" fill="currentColor" />
                </div>
              </button>
            </>
          )}
        </div>
        
        {/* Info bar */}
        <div className="p-4 border-t border-border/30">
          <span className="inline-block px-2 py-0.5 text-xs font-sans uppercase tracking-wider text-gold-muted mb-2">
            {categoryLabels[video.category]}
          </span>
          <h3 className="font-serif text-base font-medium text-foreground">
            {video.title}
          </h3>
        </div>
      </div>
    </article>
  );
}
