import { useState, useEffect, useMemo } from 'react';
import { AddContentDialog } from './AddContentDialog';
import { Theory, Wish, VisionImage, VisionVideo } from '@/types/vision';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, CheckCircle2, ImageIcon, Sparkles } from 'lucide-react';

const DAILY_QUOTES = [
  "The future belongs to those who believe in the beauty of their dreams.",
  "What you think, you become. What you feel, you attract. What you imagine, you create.",
  "Your vision will become clear only when you look into your heart.",
  "The only way to do great work is to love what you do.",
  "Dream big, start small, act now.",
  "Everything you can imagine is real.",
  "The best way to predict the future is to create it.",
  "Believe you can and you're halfway there.",
  "Your limitation—it's only your imagination.",
  "Turn your wounds into wisdom.",
  "What we achieve inwardly will change outer reality.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The mind is everything. What you think you shall become.",
  "Go confidently in the direction of your dreams.",
  "Act as if what you do makes a difference. It does.",
  "You are never too old to set another goal or to dream a new dream.",
  "Visualize your highest self and start showing up as her.",
  "A year from now, you'll wish you had started today.",
  "Don't watch the clock; do what it does. Keep going.",
  "Stars can't shine without darkness.",
  "She remembered who she was and the game changed.",
  "Be the energy you want to attract.",
  "Small steps every day lead to big changes.",
  "You didn't come this far to only come this far.",
  "What is coming is better than what is gone.",
  "Difficult roads often lead to beautiful destinations.",
  "You are the artist of your own life. Don't hand the paintbrush to anyone else.",
  "Inhale confidence, exhale doubt.",
  "The universe is not outside of you. Look inside yourself.",
  "Wake up with determination. Go to bed with satisfaction.",
  "She designed a life she loved.",
];

function getDailyQuote(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
}

interface HeaderProps {
  onAddTheory: (theory: Omit<Theory, 'id'>) => void;
  onAddWish: (wish: Omit<Wish, 'id'>) => void;
  onAddImage: (image: Omit<VisionImage, 'id'>) => void;
  images?: VisionImage[];
  videos?: VisionVideo[];
  theories?: Theory[];
  wishes?: Wish[];
}

export function Header({ onAddTheory, onAddWish, onAddImage, images = [], videos = [], theories = [], wishes = [] }: HeaderProps) {
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

  const dailyQuote = useMemo(() => getDailyQuote(), []);

  const completedWishes = wishes.filter(w => w.completed).length;
  const totalWishes = wishes.length;

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

          {/* Daily Quote */}
          <div className="max-w-lg mx-auto">
            <p className="font-serif text-base md:text-lg text-muted-foreground italic leading-relaxed">
              <Sparkles className="inline h-4 w-4 text-gold mr-1.5 -mt-0.5" />
              "{dailyQuote}"
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 md:gap-10 pt-2">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-gold">
                <ImageIcon className="h-4 w-4" />
                <span className="text-2xl font-semibold text-foreground">{images.length + videos.length}</span>
              </div>
              <span className="text-xs text-muted-foreground">Media</span>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-gold">
                <BookOpen className="h-4 w-4" />
                <span className="text-2xl font-semibold text-foreground">{theories.length}</span>
              </div>
              <span className="text-xs text-muted-foreground">Theories</span>
            </div>
            <div className="w-px h-8 bg-border/40" />
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-gold">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-2xl font-semibold text-foreground">{completedWishes}/{totalWishes}</span>
              </div>
              <span className="text-xs text-muted-foreground">Wishes Done</span>
            </div>
          </div>
          
          {/* CTA */}
          <div className="pt-4">
            <AddContentDialog onAddTheory={onAddTheory} onAddWish={onAddWish} onAddImage={onAddImage} />
          </div>
        </div>
      </div>
    </header>
  );
}
