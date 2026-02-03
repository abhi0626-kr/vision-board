export type Category = 'career' | 'health' | 'travel' | 'creativity' | 'relationships' | 'personal';

export interface VisionImage {
  id: string;
  src: string;
  alt: string;
  category: Category;
}

export interface VisionVideo {
  id: string;
  url: string;
  title: string;
  category: Category;
  thumbnail?: string;
}

export interface Theory {
  id: string;
  title: string;
  content: string;
  author?: string;
  category: Category;
}

export interface Wish {
  id: string;
  title: string;
  description?: string;
  category: Category;
  completed: boolean;
  progress?: number;
}

export type ContentType = 'image' | 'video' | 'theory' | 'wish';
