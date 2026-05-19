import { useState } from 'react';
import { Wish } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import { Check, Circle, ChevronDown, ChevronUp, Sparkles, Pencil } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface WishCardProps {
  wish: Wish;
  onToggle: (id: string) => void;
  onEdit: (wish: Wish) => void;
}

export function WishCard({ wish, onToggle, onEdit }: WishCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isCompleted = wish.completed;

  const formatDate = (value?: string | null) => {
    if (!value) return 'Not completed yet';
    return new Date(value).toLocaleString();
  };

  const completedAt = wish.achievedAt ?? (wish.completed ? wish.createdAt ?? null : null);

  return (
    <article className="masonry-item">
      <div
        className={`group relative overflow-hidden rounded-lg border transition-all duration-300 hover-lift ${
          isCompleted ? 'bg-gold/10 border-gold/30' : 'bg-card border-border/50 hover-glow'
        } ${detailsOpen ? 'p-5 pb-6' : 'p-5'}`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(wish);
          }}
          className="absolute right-3 top-3 z-20 rounded-full bg-secondary/80 p-2 text-muted-foreground opacity-0 transition-all duration-300 hover:bg-secondary hover:text-foreground group-hover:opacity-100"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {isCompleted && (
          <Sparkles className="absolute right-12 top-3 h-5 w-5 animate-pulse text-gold" />
        )}

        <div className="flex items-start gap-4">
          <button
            onClick={() => onToggle(wish.id)}
            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
              isCompleted ? 'border-gold bg-gold text-primary-foreground' : 'border-muted-foreground/50 hover:border-gold'
            }`}
          >
            {isCompleted ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3 text-transparent" />}
          </button>

          <div className="min-w-0 flex-1">
            <span className="mb-2 inline-block px-2 py-0.5 text-xs font-sans uppercase tracking-wider text-gold-muted">
              {categoryLabels[wish.category]}
            </span>

            <h3
              className={`mb-1 font-serif text-lg font-medium transition-all duration-300 ${
                isCompleted ? 'text-gold line-through' : 'text-foreground'
              }`}
            >
              {wish.title}
            </h3>

            {wish.description && <p className="mb-3 text-sm text-muted-foreground">{wish.description}</p>}

            {wish.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="text-gold">{wish.progress}%</span>
                </div>
                <Progress value={wish.progress} className="h-1.5 bg-muted" />
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDetailsOpen((current) => !current)}
                className="h-8 w-8 p-0"
                aria-label={detailsOpen ? 'View less details' : 'View more details'}
                title={detailsOpen ? 'View less details' : 'View more details'}
              >
                {detailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <div
              className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                detailsOpen ? 'mt-4 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0 rounded-md border border-border/60 bg-secondary/20 p-3 text-sm text-muted-foreground">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gold-muted">Created on</div>
                    <div className="text-foreground">{formatDate(wish.createdAt)}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-gold-muted">Achieved on</div>
                    <div className="text-foreground">{formatDate(completedAt)}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs uppercase tracking-wider text-gold-muted">Current progress</div>
                  <div className="text-foreground">
                    {wish.completed ? `${wish.progress ?? 100}% achieved now` : `${wish.progress ?? 0}%`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isCompleted && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        )}
      </div>
    </article>
  );
}
