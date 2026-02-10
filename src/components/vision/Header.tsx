import { useState, useEffect } from 'react';
import { AddContentDialog } from './AddContentDialog';
import { Theory, Wish, VisionImage } from '@/types/vision';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  onAddTheory: (theory: Omit<Theory, 'id'>) => void;
  onAddWish: (wish: Omit<Wish, 'id'>) => void;
  onAddImage: (image: Omit<VisionImage, 'id'>) => void;
}

export function Header({ onAddTheory, onAddWish, onAddImage }: HeaderProps) {
  const [profile, setProfile] = useState({ name: '', avatarUrl: '' });

  useEffect(() => {
    const saved = localStorage.getItem('vision-profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile({ name: parsed.name || '', avatarUrl: parsed.avatarUrl || '' });
    }
  }, []);

  const firstName = profile.name?.split(' ')[0];
  const initials = profile.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <header className="relative overflow-hidden py-16 md:py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal-light/50 to-transparent pointer-events-none" />
      
      {/* Subtle decorative elements */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gold/3 rounded-full blur-2xl pointer-events-none" />
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Avatar & Greeting */}
          {firstName ? (
            <div className="flex flex-col items-center gap-3 mb-2">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback className="text-xl font-serif bg-primary/20 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="font-sans text-lg text-cream-muted">
                Welcome back, <span className="text-gold font-medium">{firstName}</span>
              </p>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 mb-2">
              <img
                src="https://i.pinimg.com/736x/db/0e/e2/db0ee2de02e731141a8394b059f54c04.jpg"
                alt="Vision Board logo"
                className="h-16 w-16 object-contain rounded-full"
                loading="lazy"
              />
            </div>
          )}
          
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
            <AddContentDialog onAddTheory={onAddTheory} onAddWish={onAddWish} onAddImage={onAddImage} />
          </div>
        </div>
      </div>
    </header>
  );
}
