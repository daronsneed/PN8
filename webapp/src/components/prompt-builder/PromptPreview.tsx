import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Download, RotateCcw, Save, ChevronDown, Trash2, FileText, ImagePlus, ImageMinus, LogIn, LogOut, User, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { allCategories } from '@/lib/prompt-builder-data';
import { api } from '@/lib/api';
import { useSession, signOut } from '@/lib/auth-client';
import type { GenerateImageResponse } from '../../../../backend/src/types';
import { parsePromptText, getMatchSummary } from '@/lib/prompt-parser';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LensData, LensStyleFilterId } from './LensSelector';
import { lensStyleFilters } from './LensSelector';
import type { CameraData, CameraTypeFilterId } from './CameraSelector';
import type { Subject } from './SubjectActionSelector';

const aspectRatioOptions = [
  { value: 'auto', label: 'Auto' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '16:9', label: '16:9' },
  { value: '21:9', label: '21:9' },
  { value: '9:19.5', label: '9:19.5' },
  { value: '19.5:9', label: '19.5:9' },
];

const resolutionOptions = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

interface SavedPrompt {
  id: string;
  name: string;
  prompt: string;
  selections: Record<string, string[]>;
  customValues: Record<string, string[]>;
  createdAt: number;
  image?: string | null;
  imageFull?: string | null;
  selectedLensId?: string | null;
  selectedLensStyle?: LensStyleFilterId | null;
  selectedCameraId?: string | null;
  selectedCameraType?: CameraTypeFilterId | null;
}

interface PromptPreviewProps {
  selections: Record<string, string[]>;
  customValues: Record<string, string[]>;
  subjectDescription: string;
  onSubjectChange: (value: string) => void;
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
  onReset: () => void;
  onLoadPrompt?: (
    selections: Record<string, string[]>,
    customValues: Record<string, string[]>,
    lensId?: string | null,
    lensStyle?: LensStyleFilterId | null,
    cameraId?: string | null,
    cameraType?: CameraTypeFilterId | null
  ) => void;
  onParsePrompt?: (
    selections: Record<string, string[]>,
    customValues: Record<string, string[]>,
    lensId: string | null,
    cameraId: string | null,
    subjects: Subject[]
  ) => void;
  selectedLens?: LensData | null;
  selectedLensStyle?: LensStyleFilterId | null;
  selectedCamera?: CameraData | null;
  selectedCameraType?: CameraTypeFilterId | null;
}

const STORAGE_KEY = 'promptinator-saved-prompts';

type TabId = 'prompt' | 'preview' | 'account';

export function PromptPreview({
  selections,
  customValues,
  subjectDescription,
  onSubjectChange,
  subjects,
  onSubjectsChange,
  onReset,
  onLoadPrompt,
  onParsePrompt,
  selectedLens,
  selectedLensStyle,
  selectedCamera,
  selectedCameraType,
}: PromptPreviewProps) {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = useSession();
  const isLoggedIn = !!session?.user;

  const [activeTab, setActiveTab] = useState<TabId>('prompt');
  const [copied, setCopied] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [savedPromptsOpen, setSavedPromptsOpen] = useState(false);
  const [loadedPromptId, setLoadedPromptId] = useState<string | null>(null);
  const [manualPromptEdit, setManualPromptEdit] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPromptId, setUploadingPromptId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gpt-image' | 'nano-banana'>('gpt-image');
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [pendingModel, setPendingModel] = useState<'gpt-image' | 'nano-banana' | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('auto');
  const [selectedResolution, setSelectedResolution] = useState('2K');
  const hasLoadedFromServer = useRef(false);

  // Track custom lighting text appended by user (persists across selection changes)
  const [lightingCustomText, setLightingCustomText] = useState<string>('');

  // Load saved prompts - from API if logged in, localStorage if not
  const loadPrompts = useCallback(async () => {
    if (isSessionPending) return;

    if (isLoggedIn) {
      // Only load from server once per session
      if (hasLoadedFromServer.current) return;

      setIsLoading(true);
      try {
        const prompts = await api.get<SavedPrompt[]>('/api/prompts');
        setSavedPrompts(prompts);
        hasLoadedFromServer.current = true;
      } catch (err) {
        console.error('Failed to load prompts from server:', err);
        toast.error('Failed to load your saved prompts');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Load from localStorage for guests
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSavedPrompts(JSON.parse(stored));
        } catch {
          console.error('Failed to parse saved prompts');
        }
      }
    }
  }, [isLoggedIn, isSessionPending]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Reset when login state changes
  useEffect(() => {
    hasLoadedFromServer.current = false;
  }, [isLoggedIn]);

  // Save prompts to localStorage for guests (not for logged in users - they use API)
  useEffect(() => {
    if (!isLoggedIn && !isSessionPending) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPrompts));
    }
  }, [savedPrompts, isLoggedIn, isSessionPending]);

  const generatedPrompt = useMemo(() => {
    const parts: string[] = [];

    // Check if Photorealistic is selected (needed early for filtering)
    const isPhotorealisticSelected = (selections['style'] || []).includes('photorealistic');

    // Helper function to get parts for a category
    const getCategoryParts = (categoryId: string): string[] => {
      const category = allCategories.find((c) => c.id === categoryId);
      if (!category) return [];

      const categoryParts: string[] = [];
      const selectedIds = selections[categoryId] || [];
      const custom = customValues[categoryId] || [];

      selectedIds.forEach((id) => {
        // Skip photorealistic from style category - it will be added at the end
        if (categoryId === 'style' && id === 'photorealistic') {
          return;
        }
        const option = category.options.find((opt) => opt.id === id);
        if (option?.promptValue) {
          categoryParts.push(option.promptValue);
        }
      });

      custom.forEach((value) => {
        categoryParts.push(value);
      });

      return categoryParts;
    };

    // Add subject description if provided
    if (subjectDescription.trim()) {
      parts.push(subjectDescription.trim());
    }

    // Camera section categories
    // Order: angle + lens (no comma), then genre (style), film stock, iso, aperture, shutter
    const cameraCategoriesAfterLens = ['style', 'filmStock', 'iso', 'aperture', 'shutter'];

    // Categories with special prefixes
    const prefixedCategories: Record<string, string> = {
      wardrobe: '[Details]',
      environment: '[Environment]',
      lighting: '[Lighting]',
    };

    // Build camera section parts
    const cameraParts: string[] = [];

    // Get angle parts in specific order: Height, View, Size
    const getOrderedAngleParts = (): string[] => {
      const category = allCategories.find((c) => c.id === 'angles');
      if (!category) return [];

      const selectedIds = selections['angles'] || [];
      const orderedParts: string[] = [];

      // Define the group order
      const groupOrder = ['Height', 'View', 'Size'];

      // For each group in order, find if there's a selection
      groupOrder.forEach((groupName) => {
        const selectedOption = category.options.find(
          (opt) => opt.group === groupName && selectedIds.includes(opt.id)
        );
        if (selectedOption?.promptValue) {
          orderedParts.push(selectedOption.promptValue);
        }
      });

      return orderedParts;
    };

    const angleParts = getOrderedAngleParts();

    // Get lens info from new LensSelector
    let lensPromptValue = '';
    if (selectedLens) {
      // Get the style name for the prompt
      const styleFilter = selectedLensStyle
        ? lensStyleFilters.find(s => s.id === selectedLensStyle)
        : null;
      const styleName = styleFilter ? styleFilter.label : '';

      // Build lens prompt: "Cooke Anamorphic lens" or just the lens promptValue
      lensPromptValue = selectedLens.promptValue;

      // If we have a style and the lens name doesn't already include it, add style context
      if (styleName && !lensPromptValue.toLowerCase().includes(styleName.toLowerCase())) {
        // Add style as a prefix descriptor
        lensPromptValue = `${styleName.toLowerCase()} ${lensPromptValue}`;
      }

      // Add "look" at the end of any lens selection
      lensPromptValue = `${lensPromptValue} look`;
    }

    // Combine angle and lens without comma
    if (angleParts.length > 0 || lensPromptValue) {
      // Join angle parts with spaces (no commas, no "shot")
      const angleStr = angleParts.length > 0
        ? angleParts.join(' ')
        : '';

      if (angleStr && lensPromptValue) {
        cameraParts.push(`${angleStr} ${lensPromptValue}`);
      } else if (angleStr) {
        cameraParts.push(angleStr);
      } else if (lensPromptValue) {
        cameraParts.push(lensPromptValue);
      }
    }

    // Process remaining camera categories (genre, camera type, film stock)
    cameraCategoriesAfterLens.forEach((categoryId) => {
      const categoryParts = getCategoryParts(categoryId);
      cameraParts.push(...categoryParts);
    });

    // Add selected camera body
    if (selectedCamera) {
      cameraParts.push(selectedCamera.promptValue);
    }

    // Add "natural film grain, photorealistic" at the end when Photorealistic is selected
    if (isPhotorealisticSelected) {
      cameraParts.push('natural film grain, photorealistic');
    }

    // Add camera section with prefix if there are selections
    if (cameraParts.length > 0) {
      parts.push(`[Camera/Lens] ${cameraParts.join(', ')}`);
    }

    // Add subjects with [Subjects] section
    const validSubjects = subjects.filter(s => s.name || s.age || s.appearance || s.action);
    if (validSubjects.length > 0) {
      // Build [Subjects] section with descriptions
      const subjectLines: string[] = ['[Subjects]'];
      validSubjects.forEach((subject, index) => {
        const subjectParts: string[] = [];
        if (subject.name) subjectParts.push(subject.name);
        if (subject.age) subjectParts.push(subject.age);
        if (subject.appearance) subjectParts.push(subject.appearance);

        const subjectDesc = subjectParts.join(', ');
        if (subjectDesc) {
          const label = index === 0 ? '[Primary:]' : '[Secondary:]';
          // Add blank line before Secondary
          if (index === 1) {
            subjectLines.push('');
          }
          subjectLines.push(`${label} ${subjectDesc}`);
        }
      });

      if (subjectLines.length > 1) {
        parts.push(subjectLines.join('\n'));
      }

      // Build [Actions] section
      const actionLines: string[] = ['[Actions]'];
      validSubjects.forEach((subject, index) => {
        if (subject.action) {
          const label = index === 0 ? '[Primary:]' : '[Secondary:]';
          // Add blank line before Secondary
          if (index === 1 && actionLines.length > 1) {
            actionLines.push('');
          }
          actionLines.push(`${label} ${subject.action}`);
        }
      });

      if (actionLines.length > 1) {
        parts.push(actionLines.join('\n'));
      }
    }

    // Process remaining categories
    const allCameraCategories = ['angles', 'style', 'filmStock', 'iso', 'aperture', 'shutter'];
    allCategories.forEach((category) => {
      // Skip camera categories (already processed), old lens categories, action (now handled via subjects), and finalTouches (handled in negative prompt)
      if (allCameraCategories.includes(category.id) || category.id === 'lensStyle' || category.id === 'lens' || category.id === 'finalTouches' || category.id === 'action') return;

      const categoryParts = getCategoryParts(category.id);

      if (categoryParts.length > 0) {
        // Check if this category has a special prefix
        const prefix = prefixedCategories[category.id];
        if (prefix) {
          // For lighting, append any custom text the user has added
          if (category.id === 'lighting' && lightingCustomText) {
            parts.push(`${prefix} ${categoryParts.join(', ')}${lightingCustomText}`);
          } else {
            parts.push(`${prefix} ${categoryParts.join(', ')}`);
          }
        } else {
          // No prefix, just add the parts
          categoryParts.forEach((part) => parts.push(part));
        }
      }
    });

    // Join with double newlines to separate sections with blank lines
    const mainPrompt = parts.join('\n\n');

    if (mainPrompt.length === 0) {
      return '';
    }

    // Build the negative prompt line from the finalTouches category (which has the default negative text)
    const negativeParts = getCategoryParts('finalTouches');

    // Use the negative prompt content exactly as entered in the textarea
    const negativeContent = negativeParts.join(', ');

    // Add negative content if there's any (with blank line before it)
    if (negativeContent) {
      return `${mainPrompt}\n\n${negativeContent}`;
    }

    return mainPrompt;
  }, [selections, customValues, subjectDescription, subjects, selectedLens, selectedLensStyle, selectedCamera, lightingCustomText]);

  // Base negative prompt text for comparison
  const baseNegativeText = '[Consistency] Maintain consistent lighting direction, facial proportions, and wardrobe across generations.\n\n[Negative] No extra limbs, no distorted hands, no plastic or waxy skin, no blown highlights, no CGI look, no modern LED lighting, no fantasy elements.';

  // Generate the base lighting text (without custom additions) for comparison
  const baseLightingText = useMemo(() => {
    const category = allCategories.find((c) => c.id === 'lighting');
    if (!category) return '';

    const selectedIds = selections['lighting'] || [];
    const parts: string[] = [];

    selectedIds.forEach((id) => {
      const option = category.options.find((opt) => opt.id === id);
      if (option?.promptValue) {
        parts.push(option.promptValue);
      }
    });

    return parts.length > 0 ? `[Lighting] ${parts.join(', ')}` : '';
  }, [selections]);

  // The final prompt is either the manual edit or the generated prompt
  const finalPrompt = manualPromptEdit !== null ? manualPromptEdit : generatedPrompt;

  // Extract custom lighting text when user edits the prompt
  const handlePromptChange = (newValue: string) => {
    setManualPromptEdit(newValue);

    // Try to extract any custom text added to the lighting line
    if (baseLightingText) {
      const lightingLineRegex = /\[Lighting\] (.+?)(?:\n|$)/;
      const match = newValue.match(lightingLineRegex);

      if (match) {
        const fullLightingContent = match[1];
        // Get the base content without prefix
        const baseContent = baseLightingText.replace('[Lighting] ', '');

        // If the line starts with base content, extract any additional text
        if (fullLightingContent.startsWith(baseContent)) {
          const additionalText = fullLightingContent.slice(baseContent.length);
          setLightingCustomText(additionalText);
        }
      }
    }

  };

  // Reset manual edit when selections change, but only if not currently loading a saved prompt
  // We use a ref to track if we're in the middle of loading
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!isLoadingRef.current) {
      setManualPromptEdit(null);
    }
    isLoadingRef.current = false;
  }, [generatedPrompt]);

  const handleCopy = async () => {
    if (!finalPrompt) return;

    let success = false;

    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(finalPrompt);
        success = true;
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback for non-secure contexts (e.g., iframes, HTTP)
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = finalPrompt;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        // Fall through
      }
    }

    if (success) {
      setCopied(true);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      // If all copy methods fail, offer to select the text for manual copy
      toast.error('Auto-copy not supported. Please select the prompt text and copy manually (Ctrl+C / Cmd+C)');
    }
  };

  const handleDownload = () => {
    if (!finalPrompt) return;

    const blob = new Blob([finalPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Prompt downloaded!');
  };

  const handleSavePrompt = async () => {
    if (!promptName.trim()) {
      toast.error('Please enter a name for this prompt');
      return;
    }
    if (!finalPrompt) {
      toast.error('No prompt to save');
      return;
    }

    const promptData = {
      name: promptName.trim(),
      prompt: finalPrompt,
      selections: { ...selections },
      customValues: { ...customValues },
      selectedLensId: selectedLens?.id || null,
      selectedLensStyle: selectedLensStyle || null,
      selectedCameraId: selectedCamera?.id || null,
      selectedCameraType: selectedCameraType || null,
    };

    if (isLoggedIn) {
      // Save to API
      setIsLoading(true);
      try {
        const saved = await api.post<SavedPrompt>('/api/prompts', promptData);
        setSavedPrompts((prev) => [saved, ...prev]);
        setPromptName('');
        setSavedPromptsOpen(true);
        toast.success('Prompt saved!');
      } catch (err) {
        console.error('Failed to save prompt:', err);
        toast.error('Failed to save prompt');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Save to localStorage
      const newPrompt: SavedPrompt = {
        id: Date.now().toString(),
        ...promptData,
        createdAt: Date.now(),
      };
      setSavedPrompts((prev) => [newPrompt, ...prev]);
      setPromptName('');
      setSavedPromptsOpen(true);
      toast.success('Prompt saved locally! Sign in to sync across devices.');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (isLoggedIn) {
      try {
        await api.delete(`/api/prompts/${id}`);
        setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
        if (loadedPromptId === id) {
          setLoadedPromptId(null);
        }
        toast.success('Prompt deleted');
      } catch (err) {
        console.error('Failed to delete prompt:', err);
        toast.error('Failed to delete prompt');
      }
    } else {
      setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
      if (loadedPromptId === id) {
        setLoadedPromptId(null);
      }
      toast.success('Prompt deleted');
    }
  };

  const handleLoadPrompt = (prompt: SavedPrompt) => {
    // If clicking on the already loaded prompt, exit edit mode
    if (loadedPromptId === prompt.id) {
      setLoadedPromptId(null);
      setManualPromptEdit(null);
      return;
    }

    if (onLoadPrompt) {
      // Set flag to prevent useEffect from resetting manualPromptEdit
      isLoadingRef.current = true;
      onLoadPrompt(
        prompt.selections,
        prompt.customValues,
        prompt.selectedLensId,
        prompt.selectedLensStyle,
        prompt.selectedCameraId,
        prompt.selectedCameraType
      );
      setLoadedPromptId(prompt.id);
      // Set the manual edit to the saved prompt text so any manual edits are preserved
      setManualPromptEdit(prompt.prompt);
      toast.success(`Loaded "${prompt.name}"`);
    }
  };

  const handleUpdateSavedPrompt = async (id: string) => {
    const currentPrompt = finalPrompt;
    const existingPrompt = savedPrompts.find(p => p.id === id);
    if (!existingPrompt) return;

    const updatedData = {
      name: existingPrompt.name,
      prompt: currentPrompt,
      selections: { ...selections },
      customValues: { ...customValues },
      selectedLensId: selectedLens?.id || null,
      selectedLensStyle: selectedLensStyle || null,
      selectedCameraId: selectedCamera?.id || null,
      selectedCameraType: selectedCameraType || null,
    };

    if (isLoggedIn) {
      try {
        const updated = await api.put<SavedPrompt>(`/api/prompts/${id}`, updatedData);
        setSavedPrompts((prev) =>
          prev.map((p) => p.id === id ? updated : p)
        );
        toast.success('Prompt updated!');
      } catch (err) {
        console.error('Failed to update prompt:', err);
        toast.error('Failed to update prompt');
      }
    } else {
      setSavedPrompts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...updatedData }
            : p
        )
      );
      toast.success('Prompt updated!');
    }
  };

  // Check if a loaded prompt has been modified
  const isPromptModified = (promptId: string): boolean => {
    const savedPrompt = savedPrompts.find((p) => p.id === promptId);
    if (!savedPrompt) return false;
    return savedPrompt.prompt !== finalPrompt;
  };

  const handleImageClick = (promptId: string) => {
    setUploadingPromptId(promptId);
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPromptId) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PNG, JPG, JPEG, and GIF files are allowed');
      e.target.value = '';
      setUploadingPromptId(null);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const promptId = uploadingPromptId;

    img.onload = async () => {
      // Create thumbnail (40x36)
      canvas.width = 40;
      canvas.height = 36;
      ctx?.drawImage(img, 0, 0, 40, 36);
      const thumbnailImage = canvas.toDataURL('image/jpeg', 0.8);

      // Create full size image (max 800x600, maintain aspect ratio)
      let fullWidth = img.width;
      let fullHeight = img.height;

      if (fullWidth > 800) {
        fullHeight = (800 / fullWidth) * fullHeight;
        fullWidth = 800;
      }
      if (fullHeight > 600) {
        fullWidth = (600 / fullHeight) * fullWidth;
        fullHeight = 600;
      }

      canvas.width = fullWidth;
      canvas.height = fullHeight;
      ctx?.drawImage(img, 0, 0, fullWidth, fullHeight);
      const fullImage = canvas.toDataURL('image/jpeg', 0.9);

      if (isLoggedIn) {
        try {
          await api.patch(`/api/prompts/${promptId}/image`, {
            image: thumbnailImage,
            imageFull: fullImage,
          });
          setSavedPrompts((prev) =>
            prev.map((p) =>
              p.id === promptId ? { ...p, image: thumbnailImage, imageFull: fullImage } : p
            )
          );
          toast.success('Image added!');
        } catch (err) {
          console.error('Failed to add image:', err);
          toast.error('Failed to add image');
        }
      } else {
        setSavedPrompts((prev) =>
          prev.map((p) =>
            p.id === promptId ? { ...p, image: thumbnailImage, imageFull: fullImage } : p
          )
        );
        toast.success('Image added!');
      }

      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);

    // Reset file input
    e.target.value = '';
    setUploadingPromptId(null);
  };

  const handleRemoveImage = async (promptId: string) => {
    if (isLoggedIn) {
      try {
        await api.patch(`/api/prompts/${promptId}/image`, {
          image: null,
          imageFull: null,
        });
        setSavedPrompts((prev) =>
          prev.map((p) =>
            p.id === promptId ? { ...p, image: undefined, imageFull: undefined } : p
          )
        );
        toast.success('Image removed!');
      } catch (err) {
        console.error('Failed to remove image:', err);
        toast.error('Failed to remove image');
      }
    } else {
      setSavedPrompts((prev) =>
        prev.map((p) =>
          p.id === promptId ? { ...p, image: undefined, imageFull: undefined } : p
        )
      );
      toast.success('Image removed!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setSavedPrompts([]);
    hasLoadedFromServer.current = false;
    toast.success('Signed out');
  };

  const handleOpenOptionsDialog = (model: 'gpt-image' | 'nano-banana') => {
    if (!finalPrompt) {
      toast.error('No prompt to generate from');
      return;
    }
    setPendingModel(model);
    setShowOptionsDialog(true);
  };

  const handleGenerateImage = async () => {
    if (!finalPrompt || !pendingModel) {
      toast.error('No prompt to generate from');
      return;
    }

    setShowOptionsDialog(false);
    setSelectedModel(pendingModel);
    setIsGenerating(true);
    try {
      const result = await api.post<GenerateImageResponse>('/api/generate-image', {
        prompt: finalPrompt,
        model: pendingModel,
        aspectRatio: selectedAspectRatio,
        resolution: selectedResolution,
      });
      const dataUri = `data:${result.mimeType};base64,${result.imageData}`;
      setGeneratedImage(dataUri);
      toast.success('Image generated successfully!');
    } catch (err) {
      console.error('Failed to generate image:', err);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
      setPendingModel(null);
    }
  };

  const selectionCount = Object.values(selections).flat().length +
    Object.values(customValues).flat().length;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'prompt', label: 'PROMPT' },
    { id: 'preview', label: 'ARCHIVE' },
  ];

  return (
    <div className="space-y-5">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept=".png,.jpg,.jpeg,.gif"
        className="hidden"
      />

      {/* Tab Bar */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm rounded-lg border transition-all duration-200',
              'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
              activeTab === tab.id
                ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                : 'border-border/60 bg-card text-green-400/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PROMPT Tab Content */}
      {activeTab === 'prompt' && (
        <>
          {/* Generated Prompt Preview */}
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase" style={{ color: '#bdf005' }}>
              GENERATED PROMPT
            </label>
            <Textarea
              value={finalPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              onPaste={(e) => {
                // Get pasted text
                const pastedText = e.clipboardData.getData('text');
                if (pastedText && onParsePrompt) {
                  // Parse the pasted text to extract settings
                  const result = parsePromptText(pastedText);
                  const matchSummary = getMatchSummary(result);

                  if (matchSummary.length > 0 || result.subjects.length > 0) {
                    // Apply the parsed selections
                    onParsePrompt(
                      result.selections,
                      result.customValues,
                      result.matchedLensId,
                      result.matchedCameraId,
                      result.subjects
                    );
                    const subjectInfo = result.subjects.length > 0 ? `${result.subjects.length} subject(s)` : '';
                    const detectedItems = [...matchSummary.slice(0, 3), subjectInfo].filter(Boolean);
                    toast.success(`Detected: ${detectedItems.join(', ')}${matchSummary.length > 3 ? ` +${matchSummary.length - 3} more` : ''}`);
                  }
                }
              }}
              placeholder="Your prompt will appear here as you make selections... Paste an existing prompt to auto-detect settings!"
              className={cn(
                'min-h-[120px] p-4 rounded-xl bg-background text-sm resize-y overflow-hidden',
                finalPrompt
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
              style={{
                height: 'auto',
                minHeight: '120px',
                borderColor: '#bdf005',
                borderWidth: '1px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.max(120, target.scrollHeight)}px`;
              }}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = `${Math.max(120, el.scrollHeight)}px`;
                }
              }}
            />
            <span className="text-xs text-muted-foreground">
              {finalPrompt.length} characters
            </span>
          </div>

          {/* Action Buttons for PROMPT tab */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => {
                setLoadedPromptId(null);
                setManualPromptEdit(null);
                setLightingCustomText('');
                onReset();
              }}
              disabled={selectionCount === 0 && !subjectDescription && !finalPrompt}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-all duration-200 flex items-center gap-1.5',
                'hover:border-red-400/40 hover:bg-red-400/10 hover:shadow-sm',
                'border-red-400/30 bg-card text-red-400/70',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-red-400/30 disabled:hover:bg-card disabled:hover:shadow-none'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!finalPrompt}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition-all duration-200 flex items-center gap-1.5',
                  'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                  copied
                    ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                    : 'border-border/60 bg-card text-green-400/60',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:bg-card disabled:hover:shadow-none'
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                disabled={!generatedPrompt}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition-all duration-200 flex items-center gap-1.5',
                  'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                  'border-border/60 bg-card text-green-400/60',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:bg-card disabled:hover:shadow-none'
                )}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </>
      )}

      {/* PREVIEW Tab Content */}
      {activeTab === 'preview' && (
        <>
          {/* Generated Image Display */}
          {generatedImage && (
            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold uppercase" style={{ color: '#bdf005' }}>
                  GENERATED IMAGE
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGeneratedImage(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Dismiss
                </Button>
              </div>
              <img
                src={generatedImage}
                alt="Generated image"
                className="w-full h-auto max-h-[400px] object-contain cursor-pointer"
                onClick={() => setViewingImage(generatedImage)}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Click image to view full size
                </p>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedImage;
                    link.download = `generated-image-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success('Image saved!');
                  }}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border transition-all duration-200 flex items-center gap-1.5',
                    'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                    'border-border/60 bg-card text-green-400/60'
                  )}
                >
                  <Download className="w-4 h-4" />
                  Save Image
                </button>
              </div>
            </div>
          )}

          {/* Name This Prompt Input */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Save This Prompt
            </label>
            <div className="flex gap-2">
              <Input
                value={promptName}
                onChange={(e) => setPromptName(e.target.value)}
                placeholder="Enter a name for this prompt..."
                className="flex-1 bg-background border-border/60 focus:border-primary"
              />
              <Button
                onClick={handleSavePrompt}
                disabled={!finalPrompt || !promptName.trim() || isLoading}
                size="default"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Saved Prompts Section */}
          {savedPrompts.length > 0 && (
            <Collapsible open={savedPromptsOpen} onOpenChange={setSavedPromptsOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium text-foreground">
                    Saved Prompts ({savedPrompts.length})
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform',
                      savedPromptsOpen && 'rotate-180'
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-xs text-muted-foreground mt-2 ml-4 mb-1">Click on a saved prompt to recall it</p>
                <div className="mt-2 ml-4 space-y-2">
                  {savedPrompts.map((prompt, index) => {
                    const isLoaded = loadedPromptId === prompt.id;
                    const isModified = isLoaded && isPromptModified(prompt.id);
                    const isLast = index === savedPrompts.length - 1;
                    return (
                      <div key={prompt.id} className="relative">
                        {/* Vertical connecting line */}
                        <div
                          className="absolute left-0 w-px"
                          style={{
                            backgroundColor: '#c9c9c9',
                            marginLeft: '-12px',
                            top: 0,
                            height: isLast ? '50%' : '100%',
                          }}
                        />
                        {/* Horizontal line to arrow */}
                        <div
                          className="absolute left-0 top-1/2 w-2 h-px"
                          style={{ backgroundColor: '#c9c9c9', marginLeft: '-12px' }}
                        />
                        {/* Arrow pointing to item */}
                        <div
                          className="absolute top-1/2"
                          style={{
                            marginLeft: '-6px',
                            width: 0,
                            height: 0,
                            borderTop: '4px solid transparent',
                            borderBottom: '4px solid transparent',
                            borderLeft: '5px solid #c9c9c9',
                            transform: 'translateY(-50%)'
                          }}
                        />
                        <div
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors",
                            isLoaded && "bg-primary/5 border-primary/40"
                          )}
                        >
                        <button
                          onClick={() => handleLoadPrompt(prompt)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary hover:underline">
                              {prompt.name}
                            </span>
                            {isModified && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateSavedPrompt(prompt.id);
                                }}
                                size="sm"
                                className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                UPDATE
                              </Button>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(prompt.createdAt).toLocaleDateString()}
                          </span>
                        </button>
                        <div className="flex items-center gap-1">
                          {prompt.image && (
                            <button
                              onClick={() => setViewingImage(prompt.imageFull ?? prompt.image ?? null)}
                              className="rounded overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                              title="Click to view full image"
                            >
                              <img
                                src={prompt.image}
                                alt="Prompt thumbnail"
                                className="object-cover"
                                style={{ width: '40px', height: '36px' }}
                              />
                            </button>
                          )}
                          {prompt.image ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400/60 hover:bg-destructive hover:text-white"
                                  title="Remove image"
                                >
                                  <ImageMinus className="w-5 h-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleRemoveImage(prompt.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  Remove Image
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-400/60 hover:bg-primary hover:text-white"
                              title="Add Preview Image"
                              onClick={() => handleImageClick(prompt.id)}
                            >
                              <ImagePlus className="w-5 h-5" />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeletePrompt(prompt.id)}
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:bg-destructive hover:text-white"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-[800px] max-h-[600px]">
            <img
              src={viewingImage}
              alt="Full size preview"
              className="max-w-full max-h-[600px] object-contain"
            />
          </div>
        </div>
      )}

      {/* Image Generation Options Dialog */}
      <Dialog open={showOptionsDialog} onOpenChange={setShowOptionsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Image Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
              <div className="flex flex-wrap gap-2">
                {aspectRatioOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedAspectRatio(option.value)}
                    className={cn(
                      'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                      'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                      selectedAspectRatio === option.value
                        ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                        : 'border-border/60 bg-card text-green-400/60'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Resolution</label>
              <div className="flex flex-wrap gap-2">
                {resolutionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedResolution(option.value)}
                    className={cn(
                      'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                      'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                      selectedResolution === option.value
                        ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                        : 'border-border/60 bg-card text-green-400/60'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateImage}
              className="w-full"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Image
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
