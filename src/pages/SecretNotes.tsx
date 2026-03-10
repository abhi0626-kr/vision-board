import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from '@/components/vision/ThemeToggle';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, Lock, Loader2, RotateCcw, Save, ShieldCheck, Trash2, Video, X, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SHARED_PASSCODE = '0626';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const INACTIVITY_MS = 10 * 60 * 1000;
const LOCKOUT_STORAGE_KEY = 'secret_notes_lockout_until';
const LOCAL_NOTE_PREFIX = 'secret_notes_local_';
const IMAGE_BUCKET = 'secret-note-images';
const VIDEO_BUCKET = 'secret-note-videos';
const IMAGE_UPLOAD_BATCH_SIZE = 8;
const VIDEO_UPLOAD_BATCH_SIZE = 3;
const SUPABASE_PROJECT_HOST = (() => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!url) return 'unknown-project';
  try {
    return new URL(url).host;
  } catch {
    return 'unknown-project';
  }
})();

type BucketId = typeof IMAGE_BUCKET | typeof VIDEO_BUCKET;

type StoredMediaRef = {
  bucket: BucketId;
  path: string;
};

type DisplayMedia = StoredMediaRef & {
  url: string | null;
  previewUnavailable?: boolean;
};

type PreviewResult = {
  items: DisplayMedia[];
  failed: number;
};

type UploadResult = {
  uploadedRefs: StoredMediaRef[];
  failedCount: number;
};

type BucketHealth = {
  ok: boolean;
  message: string;
};

type StorageHealth = {
  checked: boolean;
  images: BucketHealth;
  videos: BucketHealth;
};

type VaultParagraph = {
  id: string;
  text: string;
  createdAt: string;
};

type VaultPayload = {
  note: string;
  paragraphs: VaultParagraph[];
  images: StoredMediaRef[];
  videos: StoredMediaRef[];
};

type ParsedVaultPayload = VaultPayload & {
  legacyImages: string[];
  legacyVideos: string[];
};

const DEFAULT_PAYLOAD: VaultPayload = {
  note: '',
  paragraphs: [],
  images: [],
  videos: [],
};

function isVaultParagraph(value: unknown): value is VaultParagraph {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as { id?: unknown; text?: unknown; createdAt?: unknown };
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.text === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

function isStoredMediaRef(value: unknown, bucket: BucketId): value is StoredMediaRef {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as { bucket?: unknown; path?: unknown };
  return candidate.bucket === bucket && typeof candidate.path === 'string' && candidate.path.length > 0;
}

function parseVaultPayload(raw: string | null): ParsedVaultPayload {
  if (!raw) {
    return {
      ...DEFAULT_PAYLOAD,
      legacyImages: [],
      legacyVideos: [],
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.note === 'string' && Array.isArray(parsed.images) && Array.isArray(parsed.videos)) {
      const storedImages = parsed.images.filter((value: unknown) => isStoredMediaRef(value, IMAGE_BUCKET));
      const storedVideos = parsed.videos.filter((value: unknown) => isStoredMediaRef(value, VIDEO_BUCKET));
      const parsedParagraphs = Array.isArray(parsed.paragraphs)
        ? parsed.paragraphs.filter((value: unknown) => isVaultParagraph(value))
        : [];
      const legacyImages = parsed.images.filter(
        (value: unknown) => typeof value === 'string' && value.startsWith('data:')
      );
      const legacyVideos = parsed.videos.filter(
        (value: unknown) => typeof value === 'string' && value.startsWith('data:')
      );

      const fallbackParagraphs =
        parsedParagraphs.length === 0 && parsed.note.trim().length > 0
          ? [
              {
                id: `legacy-${crypto.randomUUID()}`,
                text: parsed.note,
                createdAt: new Date().toISOString(),
              },
            ]
          : [];

      return {
        note: '',
        paragraphs: [...parsedParagraphs, ...fallbackParagraphs],
        images: storedImages,
        videos: storedVideos,
        legacyImages,
        legacyVideos,
      };
    }
  } catch {
    // Legacy records may be plain text; treat them as note content.
  }

  return {
    ...DEFAULT_PAYLOAD,
    note: '',
    paragraphs:
      raw.trim().length > 0
        ? [
            {
              id: `legacy-${crypto.randomUUID()}`,
              text: raw,
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    legacyImages: [],
    legacyVideos: [],
  };
}

function serializeVaultPayload(payload: VaultPayload): string {
  return JSON.stringify(payload);
}

function toStandardPayload(payload: ParsedVaultPayload): VaultPayload {
  return {
    note: payload.note,
    paragraphs: payload.paragraphs,
    images: payload.images,
    videos: payload.videos,
  };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unknown error';
}

const UNKNOWN_HEALTH: BucketHealth = {
  ok: false,
  message: 'Not checked yet',
};

const SecretNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [note, setNote] = useState('');
  const [paragraphs, setParagraphs] = useState<VaultParagraph[]>([]);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [images, setImages] = useState<StoredMediaRef[]>([]);
  const [videos, setVideos] = useState<StoredMediaRef[]>([]);
  const [imagePreviewItems, setImagePreviewItems] = useState<DisplayMedia[]>([]);
  const [videoPreviewItems, setVideoPreviewItems] = useState<DisplayMedia[]>([]);
  const [healthChecking, setHealthChecking] = useState(false);
  const [storageHealth, setStorageHealth] = useState<StorageHealth>({
    checked: false,
    images: UNKNOWN_HEALTH,
    videos: UNKNOWN_HEALTH,
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerType, setViewerType] = useState<'image' | 'video'>('image');
  const [viewerIndex, setViewerIndex] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());
  const viewerTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const localNoteKey = `${LOCAL_NOTE_PREFIX}${user?.id || 'guest'}`;

  const currentViewerItems = viewerType === 'image' ? imagePreviewItems : videoPreviewItems;
  const currentViewerItem = currentViewerItems[viewerIndex] || null;

  const openViewer = (type: 'image' | 'video', index: number) => {
    setViewerType(type);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const moveViewer = (direction: 'next' | 'prev') => {
    const items = viewerType === 'image' ? imagePreviewItems : videoPreviewItems;
    if (items.length === 0) return;

    setViewerIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % items.length;
      }
      return (prev - 1 + items.length) % items.length;
    });
  };

  const handleViewerTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    viewerTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleViewerTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = viewerTouchStartRef.current;
    if (!start) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    viewerTouchStartRef.current = null;

    // Only treat mostly-horizontal swipes as navigation.
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX < 0) {
      moveViewer('next');
    } else {
      moveViewer('prev');
    }
  };

  const buildStoragePath = (fileName: string): string => {
    const normalizedName = fileName.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
    const randomPart = crypto.randomUUID();
    return `${user?.id}/${Date.now()}-${randomPart}-${normalizedName}`;
  };

  const createSignedUrl = async (ref: StoredMediaRef): Promise<string> => {
    const { data, error } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, 60 * 60 * 24 * 7);
    if (error || !data?.signedUrl) {
      throw error || new Error('Could not create signed URL');
    }
    return data.signedUrl;
  };

  const hydrateMediaPreviews = async (refs: StoredMediaRef[]): Promise<PreviewResult> => {
    if (refs.length === 0) return { items: [], failed: 0 };

    const settled = await Promise.allSettled(
      refs.map(async (ref) => {
        const url = await createSignedUrl(ref);
        return { ...ref, url };
      })
    );

    const items: DisplayMedia[] = [];
    let failed = 0;

    for (let index = 0; index < settled.length; index += 1) {
      const result = settled[index];
      const ref = refs[index];
      if (result.status === 'fulfilled') {
        items.push(result.value);
      } else {
        items.push({ ...ref, url: null, previewUnavailable: true });
        failed += 1;
      }
    }

    return { items, failed };
  };

  const refreshPreviews = async (nextImages: StoredMediaRef[], nextVideos: StoredMediaRef[]) => {
    try {
      const [imageResult, videoResult] = await Promise.all([
        hydrateMediaPreviews(nextImages),
        hydrateMediaPreviews(nextVideos),
      ]);

      setImagePreviewItems(imageResult.items);
      setVideoPreviewItems(videoResult.items);

      const failedCount = imageResult.failed + videoResult.failed;
      if (failedCount > 0) {
        toast({
          title: 'Some previews unavailable',
          description: `${failedCount} media file(s) could not be previewed.`,
          variant: 'destructive',
        });
      }
    } catch {
      setImagePreviewItems([]);
      setVideoPreviewItems([]);
      toast({
        title: 'Media preview failed',
        description: 'Could not load one or more private media previews.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const stored = Number(localStorage.getItem(LOCKOUT_STORAGE_KEY) || '0');
    if (stored > Date.now()) {
      setLockedUntil(stored);
    } else {
      localStorage.removeItem(LOCKOUT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!unlocked) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, updateActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      const inactiveFor = Date.now() - lastActivityRef.current;
      if (inactiveFor >= INACTIVITY_MS) {
        setUnlocked(false);
        setPasscode('');
        toast({
          title: 'Vault locked',
          description: 'Auto-locked due to inactivity.',
        });
      }
    }, 5000);

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, updateActivity);
      }
      window.clearInterval(interval);
    };
  }, [unlocked, toast]);

  const loadNote = async () => {
    if (!user) return;

    setNoteLoading(true);
    try {
      const { data, error } = await supabase
        .from('secret_notes')
        .select('content')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const payload = parseVaultPayload(data?.content || '');
      const normalized = await maybeMigrateLegacyMedia(payload, true);

      setNote(normalized.note);
      setParagraphs(normalized.paragraphs);
      setImages(normalized.images);
      setVideos(normalized.videos);
      localStorage.setItem(localNoteKey, serializeVaultPayload(normalized));
      await refreshPreviews(normalized.images, normalized.videos);
    } catch {
      const localFallback = parseVaultPayload(localStorage.getItem(localNoteKey));
      const normalized = await maybeMigrateLegacyMedia(localFallback, false);

      setNote(normalized.note);
      setParagraphs(normalized.paragraphs);
      setImages(normalized.images);
      setVideos(normalized.videos);
      localStorage.setItem(localNoteKey, serializeVaultPayload(normalized));
      await refreshPreviews(normalized.images, normalized.videos);
      toast({
        title: 'Loaded local note',
        description: 'Cloud sync is unavailable right now, using local backup.',
      });
    } finally {
      setNoteLoading(false);
    }
  };

  const unlockNotes = async (event: React.FormEvent) => {
    event.preventDefault();

    if (lockedUntil > Date.now()) {
      const minutes = Math.ceil((lockedUntil - Date.now()) / 60000);
      toast({
        title: 'Too many attempts',
        description: `Try again in about ${minutes} minute(s).`,
        variant: 'destructive',
      });
      return;
    }

    if (passcode !== SHARED_PASSCODE) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        const nextLockUntil = Date.now() + LOCKOUT_MS;
        setLockedUntil(nextLockUntil);
        localStorage.setItem(LOCKOUT_STORAGE_KEY, String(nextLockUntil));
        setFailedAttempts(0);
      }

      toast({
        title: 'Incorrect password',
        description: `Wrong passcode. Attempt ${Math.min(nextAttempts, MAX_FAILED_ATTEMPTS)}/${MAX_FAILED_ATTEMPTS}.`,
        variant: 'destructive',
      });
      return;
    }

    setFailedAttempts(0);
    setUnlocked(true);
    setPasscode('');
    lastActivityRef.current = Date.now();
    await loadNote();
  };

  const persistVaultPayload = async (
    payload: VaultPayload,
    options?: { title?: string; description?: string; silent?: boolean }
  ) => {
    if (!user) return;

    const serialized = serializeVaultPayload(payload);
    setNoteSaving(true);
    try {
      const { error } = await supabase
        .from('secret_notes')
        .upsert(
          {
            user_id: user.id,
            content: serialized,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      localStorage.setItem(localNoteKey, serialized);

      if (!options?.silent) {
        toast({
          title: options?.title || 'Vault saved',
          description: options?.description || 'Synced with your account across devices.',
        });
      }
    } catch {
      localStorage.setItem(localNoteKey, serialized);
      if (!options?.silent) {
        toast({
          title: 'Saved locally',
          description: 'Cloud sync failed, but your note is safe on this device.',
        });
      }
    } finally {
      setNoteSaving(false);
    }
  };

  const saveNote = async () => {
    const trimmed = note.trim();

    if (trimmed.length === 0 && paragraphs.length === 0) {
      toast({
        title: 'Nothing to save',
        description: 'Type a paragraph first, then save.',
        variant: 'destructive',
      });
      return;
    }

    const nextParagraphs =
      trimmed.length > 0
        ? [
            ...paragraphs,
            {
              id: crypto.randomUUID(),
              text: trimmed,
              createdAt: new Date().toISOString(),
            },
          ]
        : paragraphs;

    if (trimmed.length > 0) {
      setParagraphs(nextParagraphs);
      setNote('');
    }

    await persistVaultPayload(
      {
        note: '',
        paragraphs: nextParagraphs,
        images,
        videos,
      },
      {
        title: trimmed.length > 0 ? 'Paragraph saved' : 'Vault saved',
        description:
          trimmed.length > 0
            ? 'Saved as a separate paragraph. You can add another one now.'
            : 'Vault synced with your account across devices.',
      }
    );
  };

  const lockNotes = () => {
    setUnlocked(false);
    setPasscode('');
  };

  const uploadFilesToBucket = async (
    files: FileList,
    bucket: BucketId,
    batchSize: number
  ): Promise<UploadResult> => {
    if (!user) return { uploadedRefs: [], failedCount: files.length };

    const selected = Array.from(files);
    const uploadedRefs: StoredMediaRef[] = [];
    let failedCount = 0;

    for (let index = 0; index < selected.length; index += batchSize) {
      const chunk = selected.slice(index, index + batchSize);

      const chunkResults = await Promise.allSettled(
        chunk.map(async (file) => {
          const path = buildStoragePath(file.name);
          const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
          if (error) throw error;
          return { bucket, path } as StoredMediaRef;
        })
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          uploadedRefs.push(result.value);
        } else {
          failedCount += 1;
        }
      }
    }

    return { uploadedRefs, failedCount };
  };

  const checkSingleBucketHealth = async (bucket: BucketId): Promise<BucketHealth> => {
    if (!user) {
      return {
        ok: false,
        message: 'No authenticated user',
      };
    }

    const userFolder = `${user.id}`;
    const probePath = `${userFolder}/health-check-${crypto.randomUUID()}.txt`;

    const listResult = await supabase.storage.from(bucket).list(userFolder, { limit: 1 });
    if (listResult.error) {
      return {
        ok: false,
        message: `List failed: ${listResult.error.message}`,
      };
    }

    const probeBlob = new Blob(['ok'], { type: 'text/plain' });
    const uploadResult = await supabase.storage.from(bucket).upload(probePath, probeBlob, {
      upsert: false,
      contentType: 'text/plain',
    });

    if (uploadResult.error) {
      return {
        ok: false,
        message: `Upload policy failed: ${uploadResult.error.message}`,
      };
    }

    const removeResult = await supabase.storage.from(bucket).remove([probePath]);
    if (removeResult.error) {
      return {
        ok: false,
        message: `Delete policy failed: ${removeResult.error.message}`,
      };
    }

    return {
      ok: true,
      message: 'Bucket and policies are working',
    };
  };

  const runStorageHealthCheck = async () => {
    if (!user) return;

    setHealthChecking(true);
    try {
      const [imageHealth, videoHealth] = await Promise.all([
        checkSingleBucketHealth(IMAGE_BUCKET),
        checkSingleBucketHealth(VIDEO_BUCKET),
      ]);

      const nextHealth: StorageHealth = {
        checked: true,
        images: imageHealth,
        videos: videoHealth,
      };

      setStorageHealth(nextHealth);

      const allGood = imageHealth.ok && videoHealth.ok;
      toast({
        title: allGood ? 'Storage healthy' : 'Storage issue detected',
        description: allGood
          ? 'Both media buckets are ready for upload.'
          : 'One or more bucket checks failed. See health details below.',
        variant: allGood ? 'default' : 'destructive',
      });
    } finally {
      setHealthChecking(false);
    }
  };

  const uploadLegacyDataUrls = async (
    dataUrls: string[],
    bucket: BucketId,
    label: string
  ): Promise<StoredMediaRef[]> => {
    if (!user || dataUrls.length === 0) return [];

    const uploadedRefs: StoredMediaRef[] = [];
    for (const [index, dataUrl] of dataUrls.entries()) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const extension = (blob.type.split('/')[1] || 'bin').toLowerCase();
      const path = buildStoragePath(`legacy-${label}-${index + 1}.${extension}`);

      const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        upsert: false,
        contentType: blob.type,
      });

      if (error) throw error;

      uploadedRefs.push({ bucket, path });
    }

    return uploadedRefs;
  };

  const maybeMigrateLegacyMedia = async (
    payload: ParsedVaultPayload,
    persistToCloud: boolean
  ): Promise<VaultPayload> => {
    const hasLegacyMedia = payload.legacyImages.length > 0 || payload.legacyVideos.length > 0;
    if (!hasLegacyMedia || !user) {
      return toStandardPayload(payload);
    }

    setUploadingMedia(true);
    try {
      const [migratedImages, migratedVideos] = await Promise.all([
        uploadLegacyDataUrls(payload.legacyImages, IMAGE_BUCKET, 'image'),
        uploadLegacyDataUrls(payload.legacyVideos, VIDEO_BUCKET, 'video'),
      ]);

      const migratedPayload: VaultPayload = {
        note: payload.note,
        paragraphs: payload.paragraphs,
        images: [...payload.images, ...migratedImages],
        videos: [...payload.videos, ...migratedVideos],
      };

      const serialized = serializeVaultPayload(migratedPayload);
      localStorage.setItem(localNoteKey, serialized);

      if (persistToCloud) {
        const { error } = await supabase
          .from('secret_notes')
          .upsert({ user_id: user.id, content: serialized }, { onConflict: 'user_id' });

        if (error) throw error;
      }

      toast({
        title: 'Legacy media migrated',
        description: 'Older media was moved to secure storage automatically.',
      });

      return migratedPayload;
    } catch {
      toast({
        title: 'Legacy migration skipped',
        description: 'Could not migrate older media right now. You can still access text and new uploads.',
        variant: 'destructive',
      });

      return toStandardPayload(payload);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    try {
      const { uploadedRefs, failedCount } = await uploadFilesToBucket(files, IMAGE_BUCKET, IMAGE_UPLOAD_BATCH_SIZE);
      const nextImages = [...images, ...uploadedRefs];
      setImages(nextImages);
      await refreshPreviews(nextImages, videos);

      await persistVaultPayload(
        {
          note,
          paragraphs,
          images: nextImages,
          videos,
        },
        { silent: true }
      );

      toast({
        title: 'Photos uploaded',
        description:
          failedCount > 0
            ? `${uploadedRefs.length} uploaded, ${failedCount} failed.`
            : `${uploadedRefs.length} photo(s) stored securely.`,
      });
    } catch (error) {
      const reason = getErrorMessage(error);
      toast({
        title: 'Upload failed',
        description: reason.toLowerCase().includes('bucket not found')
          ? 'Bucket not found. Create storage bucket: secret-note-images.'
          : `Could not upload photo(s): ${reason}`,
        variant: 'destructive',
      });
    } finally {
      setUploadingMedia(false);
      event.target.value = '';
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    try {
      const { uploadedRefs, failedCount } = await uploadFilesToBucket(files, VIDEO_BUCKET, VIDEO_UPLOAD_BATCH_SIZE);
      const nextVideos = [...videos, ...uploadedRefs];
      setVideos(nextVideos);
      await refreshPreviews(images, nextVideos);

      await persistVaultPayload(
        {
          note,
          paragraphs,
          images,
          videos: nextVideos,
        },
        { silent: true }
      );

      toast({
        title: 'Videos uploaded',
        description:
          failedCount > 0
            ? `${uploadedRefs.length} uploaded, ${failedCount} failed.`
            : `${uploadedRefs.length} video(s) stored securely.`,
      });
    } catch (error) {
      const reason = getErrorMessage(error);
      toast({
        title: 'Upload failed',
        description: reason.toLowerCase().includes('bucket not found')
          ? 'Bucket not found. Create storage bucket: secret-note-videos.'
          : `Could not upload video(s): ${reason}`,
        variant: 'destructive',
      });
    } finally {
      setUploadingMedia(false);
      event.target.value = '';
    }
  };

  const removeImageAt = async (index: number) => {
    const target = images[index];
    const nextImages = images.filter((_, current) => current !== index);
    setImages(nextImages);
    setImagePreviewItems((prev) => prev.filter((_, current) => current !== index));

    if (!target) return;

    const { error } = await supabase.storage.from(target.bucket).remove([target.path]);
    if (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not remove the photo from storage.',
        variant: 'destructive',
      });
    }

    await persistVaultPayload(
      {
        note,
        paragraphs,
        images: nextImages,
        videos,
      },
      { silent: true }
    );
  };

  const removeVideoAt = async (index: number) => {
    const target = videos[index];
    const nextVideos = videos.filter((_, current) => current !== index);
    setVideos(nextVideos);
    setVideoPreviewItems((prev) => prev.filter((_, current) => current !== index));

    if (!target) return;

    const { error } = await supabase.storage.from(target.bucket).remove([target.path]);
    if (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not remove the video from storage.',
        variant: 'destructive',
      });
    }

    await persistVaultPayload(
      {
        note,
        paragraphs,
        images,
        videos: nextVideos,
      },
      { silent: true }
    );
  };

  const removeParagraphAt = async (index: number) => {
    const nextParagraphs = paragraphs.filter((_, current) => current !== index);
    setParagraphs(nextParagraphs);

    await persistVaultPayload(
      {
        note: '',
        paragraphs: nextParagraphs,
        images,
        videos,
      },
      {
        title: 'Paragraph removed',
        description: 'Vault synced after paragraph removal.',
      }
    );
  };

  const retryPreviewAt = async (type: 'image' | 'video', index: number) => {
    const source = type === 'image' ? images[index] : videos[index];
    if (!source) return;

    try {
      const url = await createSignedUrl(source);
      if (type === 'image') {
        setImagePreviewItems((prev) =>
          prev.map((item, current) => (current === index ? { ...item, url, previewUnavailable: false } : item))
        );
      } else {
        setVideoPreviewItems((prev) =>
          prev.map((item, current) => (current === index ? { ...item, url, previewUnavailable: false } : item))
        );
      }
      toast({
        title: 'Preview restored',
        description: 'Media preview loaded successfully.',
      });
    } catch {
      toast({
        title: 'Retry failed',
        description: 'Still unable to load this preview right now.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/30">
        <div className="container flex items-center justify-between py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Board
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <main className="container max-w-2xl py-10">
        <Card className="border-border/30">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Private Notes Vault</CardTitle>
            <CardDescription>
              Hidden page for personal notes protected by a shared passcode and synced to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!unlocked ? (
              <form onSubmit={unlockNotes} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passcode"
                    autoComplete="off"
                    required
                  />
                </div>
                {lockedUntil > Date.now() && (
                  <p className="text-sm text-destructive">
                    Vault locked. Try again in {Math.ceil((lockedUntil - Date.now()) / 60000)} minute(s).
                  </p>
                )}
                <Button type="submit" className="w-full gap-2">
                  <Lock className="h-4 w-4" />
                  Unlock Notes
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">Storage Health Check</div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={runStorageHealthCheck}
                      disabled={healthChecking || uploadingMedia}
                    >
                      {healthChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {healthChecking ? 'Checking...' : 'Check Storage'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Connected project: {SUPABASE_PROJECT_HOST}</p>

                  {storageHealth.checked && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className={`rounded-md border p-2 text-xs ${storageHealth.images.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                        <div className="mb-1 flex items-center gap-1 font-medium">
                          {storageHealth.images.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          Photos Bucket
                        </div>
                        <div>{storageHealth.images.message}</div>
                      </div>

                      <div className={`rounded-md border p-2 text-xs ${storageHealth.videos.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                        <div className="mb-1 flex items-center gap-1 font-medium">
                          {storageHealth.videos.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          Videos Bucket
                        </div>
                        <div>{storageHealth.videos.message}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    Upload Photos
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingMedia} />
                  </label>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                    Upload Videos
                    <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} disabled={uploadingMedia} />
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Photos ({images.length})</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {imagePreviewItems.map((imageItem, index) => (
                        <div key={`${imageItem.path}-${index}`} className="relative overflow-hidden rounded-md border border-border">
                          {imageItem.url ? (
                            <button type="button" className="block h-24 w-full" onClick={() => openViewer('image', index)}>
                              <img src={imageItem.url} alt={`Vault upload ${index + 1}`} className="h-24 w-full object-cover" />
                            </button>
                          ) : (
                            <div className="flex h-24 w-full flex-col items-center justify-center gap-2 bg-muted px-2 text-center text-xs text-muted-foreground">
                              <span>Preview unavailable</span>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px]"
                                onClick={() => retryPreviewAt('image', index)}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Retry
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            className="absolute right-1 top-1 rounded bg-background/80 p-1"
                            onClick={() => removeImageAt(index)}
                            aria-label="Remove photo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {videos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Videos ({videos.length})</p>
                    <div className="space-y-2">
                      {videoPreviewItems.map((videoItem, index) => (
                        <div key={`${videoItem.path}-${index}`} className="relative rounded-md border border-border p-2">
                          {videoItem.url ? (
                            <button type="button" className="block h-36 w-full" onClick={() => openViewer('video', index)}>
                              <video src={videoItem.url} className="h-36 w-full rounded object-cover" muted />
                            </button>
                          ) : (
                            <div className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded bg-muted px-2 text-center text-xs text-muted-foreground">
                              <span>Preview unavailable</span>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px]"
                                onClick={() => retryPreviewAt('video', index)}
                              >
                                <RotateCcw className="h-3 w-3" />
                                Retry
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            className="absolute right-3 top-3 rounded bg-background/80 p-1"
                            onClick={() => removeVideoAt(index)}
                            aria-label="Remove video"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {noteLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading your note...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Type one paragraph and click Save Paragraph..."
                      rows={5}
                    />

                    {paragraphs.length > 0 && (
                      <div className="space-y-2 rounded-md border border-border/60 p-3">
                        <p className="text-sm font-medium">Saved Paragraphs ({paragraphs.length})</p>
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                          {paragraphs.map((paragraph, index) => (
                            <div key={paragraph.id} className="rounded-md border border-border/50 p-2 text-sm">
                              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                <span>{new Date(paragraph.createdAt).toLocaleString()}</span>
                                <button
                                  type="button"
                                  className="rounded p-1 hover:bg-muted"
                                  onClick={() => removeParagraphAt(index)}
                                  aria-label="Remove paragraph"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <p className="whitespace-pre-wrap">{paragraph.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={saveNote} disabled={noteLoading || noteSaving || uploadingMedia} className="gap-2 sm:flex-1">
                    {noteSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {noteSaving ? 'Saving...' : 'Save Paragraph'}
                  </Button>
                  <Button variant="outline" onClick={lockNotes} className="sm:flex-1">
                    Lock Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {viewerOpen && currentViewerItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onTouchStart={handleViewerTouchStart}
          onTouchEnd={handleViewerTouchEnd}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setViewerOpen(false)}
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => moveViewer('prev')}
            aria-label="Previous media"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="max-h-[90vh] max-w-[92vw]">
            {viewerType === 'image' ? (
              currentViewerItem.url ? (
                <img src={currentViewerItem.url} alt="Fullscreen preview" className="max-h-[90vh] max-w-[92vw] object-contain" />
              ) : (
                <div className="text-sm text-white">Preview unavailable</div>
              )
            ) : currentViewerItem.url ? (
              <video src={currentViewerItem.url} controls autoPlay className="max-h-[90vh] max-w-[92vw] rounded object-contain" />
            ) : (
              <div className="text-sm text-white">Preview unavailable</div>
            )}
          </div>

          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => moveViewer('next')}
            aria-label="Next media"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SecretNotes;
