import { useState } from 'react';
import { Theory, Category } from '@/types/vision';
import { categoryLabels } from '@/data/initialData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface EditTheoryDialogProps {
  theory: Theory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (theory: Theory) => void;
  onDelete: (id: string) => void;
}

const categories: Category[] = ['career', 'health', 'travel', 'creativity', 'relationships', 'personal'];

export function EditTheoryDialog({ theory, open, onOpenChange, onSave, onDelete }: EditTheoryDialogProps) {
  const [title, setTitle] = useState(theory?.title || '');
  const [content, setContent] = useState(theory?.content || '');
  const [author, setAuthor] = useState(theory?.author || '');
  const [category, setCategory] = useState<Category>(theory?.category || 'personal');

  // Reset form when theory changes
  useState(() => {
    if (theory) {
      setTitle(theory.title);
      setContent(theory.content);
      setAuthor(theory.author || '');
      setCategory(theory.category);
    }
  });

  const handleSave = () => {
    if (!theory || !title.trim() || !content.trim()) return;
    onSave({
      ...theory,
      title: title.trim(),
      content: content.trim(),
      author: author.trim() || undefined,
      category,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!theory) return;
    onDelete(theory.id);
    onOpenChange(false);
  };

  if (!theory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-foreground">
            Edit Theory
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-sans text-muted-foreground">Category</label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-sans text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-sans text-muted-foreground">Quote or Theory</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-secondary border-border min-h-[100px] font-serif"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-sans text-muted-foreground">Author (optional)</label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
