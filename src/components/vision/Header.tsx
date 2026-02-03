import { AddContentDialog } from './AddContentDialog';
import { Theory, Wish } from '@/types/vision';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  onAddTheory: (theory: Omit<Theory, 'id'>) => void;
  onAddWish: (wish: Omit<Wish, 'id'>) => void;
}

export function Header({ onAddTheory, onAddWish }: HeaderProps) {
  return (
    <header className="relative overflow-hidden py-16 md:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-light/50 to-transparent pointer-events-none" />
      
      {/* Subtle decorative elements */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gold/3 rounded-full blur-2xl pointer-events-none" />
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Decorative icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 mb-2">
            <Sparkles className="h-6 w-6 text-gold" />
          </div>
          
          {/* Title */}
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground tracking-tight">
            Vision <span className="text-gradient-gold">Board</span>
          </h1>
          
          {/* Subtitle */}
          <p className="font-sans text-lg md:text-xl text-cream-muted max-w-xl mx-auto leading-relaxed">
            A digital sanctuary for your dreams, philosophies, and aspirations. 
            Curate your path to becoming.
          </p>
          
          {/* CTA */}
          <div className="pt-4">
            <AddContentDialog onAddTheory={onAddTheory} onAddWish={onAddWish} />
          </div>
        </div>
      </div>
    </header>
  );
}
