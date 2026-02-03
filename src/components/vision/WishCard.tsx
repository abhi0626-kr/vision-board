import { Wish } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import { Check, Circle, Sparkles, Pencil } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WishCardProps {
  wish: Wish;
  onToggle: (id: string) => void;
  onEdit: (wish: Wish) => void;
}

export function WishCard({ wish, onToggle, onEdit }: WishCardProps) {
  const isCompleted = wish.completed;
  
  return (
    <article className="masonry-item">
      <div 
        className={`group relative overflow-hidden rounded-lg p-5 hover-lift transition-all duration-300 border ${
          isCompleted 
            ? 'bg-gold/10 border-gold/30' 
            : 'bg-card border-border/50 hover-glow'
        }`}
      >
        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(wish);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-secondary/80 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-secondary text-muted-foreground hover:text-foreground z-20"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        
        {/* Completed sparkle effect */}
        {isCompleted && (
          <Sparkles className="absolute top-3 right-12 h-5 w-5 text-gold animate-pulse" />
        )}
        
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <button 
            onClick={() => onToggle(wish.id)}
            className={`flex-shrink-0 mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isCompleted 
                ? 'bg-gold border-gold text-primary-foreground' 
                : 'border-muted-foreground/50 hover:border-gold'
            }`}
          >
            {isCompleted ? (
              <Check className="h-4 w-4" />
            ) : (
              <Circle className="h-3 w-3 text-transparent" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <span className="inline-block px-2 py-0.5 text-xs font-sans uppercase tracking-wider text-gold-muted mb-2">
              {categoryLabels[wish.category]}
            </span>
            
            {/* Title */}
            <h3 className={`font-serif text-lg font-medium mb-1 transition-all duration-300 ${
              isCompleted ? 'text-gold line-through' : 'text-foreground'
            }`}>
              {wish.title}
            </h3>
            
            {/* Description */}
            {wish.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {wish.description}
              </p>
            )}
            
            {/* Progress bar */}
            {wish.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="text-gold">{wish.progress}%</span>
                </div>
                <Progress 
                  value={wish.progress} 
                  className="h-1.5 bg-muted"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Glow effect on hover for incomplete wishes */}
        {!isCompleted && (
          <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        )}
      </div>
    </article>
  );
}
