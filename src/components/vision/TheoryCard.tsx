import { Theory } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import { Quote, Pencil } from 'lucide-react';

interface TheoryCardProps {
  theory: Theory;
  onEdit: (theory: Theory) => void;
}

export function TheoryCard({ theory, onEdit }: TheoryCardProps) {
  return (
    <article className="masonry-item">
      <div className="group relative overflow-hidden rounded-lg bg-card p-6 hover-lift hover-glow border border-border/50 transition-all duration-300">
        {/* Edit button */}
        <button
          onClick={() => onEdit(theory)}
          className="absolute top-3 right-3 p-2 rounded-full bg-secondary/80 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-secondary text-muted-foreground hover:text-foreground z-20"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        
        {/* Decorative quote icon */}
        <Quote className="absolute -top-2 -left-2 h-16 w-16 text-gold/10 transition-all duration-300 group-hover:text-gold/20" />
        
        {/* Category badge */}
        <span className="inline-block px-2 py-1 text-xs font-sans uppercase tracking-wider text-gold-muted mb-4">
          {categoryLabels[theory.category]}
        </span>
        
        {/* Title */}
        <h3 className="font-serif text-xl font-semibold text-foreground mb-3 relative z-10">
          {theory.title}
        </h3>
        
        {/* Quote content */}
        <blockquote className="font-serif text-lg italic text-cream-muted leading-relaxed relative z-10">
          "{theory.content}"
        </blockquote>
        
        {/* Author */}
        {theory.author && (
          <footer className="mt-4 pt-4 border-t border-border/30">
            <cite className="font-sans text-sm not-italic text-gold">
              — {theory.author}
            </cite>
          </footer>
        )}
        
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </article>
  );
}
