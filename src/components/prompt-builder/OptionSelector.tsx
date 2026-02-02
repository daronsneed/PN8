import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, Plus, X, Save, FolderOpen, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { PromptOption } from '@/lib/prompt-builder-data';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

interface ScenePreset {
  id: string;
  name: string;
  category: string;
  value: string;
  createdAt: string;
}

interface OptionSelectorProps {
  options: PromptOption[];
  selected: string[];
  onSelect: (ids: string[]) => void;
  allowMultiple?: boolean;
  allowCustom?: boolean;
  customValues?: string[];
  onCustomValuesChange?: (values: string[]) => void;
  textOnly?: boolean;
  customPlaceholder?: string;
  onDone?: () => void;
  showGroupInTooltip?: boolean;
  allowOnePerGroup?: boolean;
  showDescriptions?: boolean;
  hintText?: string;
  categoryId?: string;
  defaultCustomValue?: string;
}

export function OptionSelector({
  options,
  selected,
  onSelect,
  allowMultiple = false,
  allowCustom = false,
  customValues = [],
  onCustomValuesChange,
  textOnly = false,
  customPlaceholder,
  onDone,
  showGroupInTooltip = false,
  allowOnePerGroup = false,
  showDescriptions = false,
  hintText,
  categoryId,
  defaultCustomValue,
}: OptionSelectorProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [customInput, setCustomInput] = useState('');
  const [textAreaValue, setTextAreaValue] = useState(customValues[0] || defaultCustomValue || '');
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Initialize with default value if provided and no custom values exist
  useEffect(() => {
    if (defaultCustomValue && customValues.length === 0 && onCustomValuesChange) {
      onCustomValuesChange([defaultCustomValue]);
    }
  }, []);

  // Scene preset state
  const [presets, setPresets] = useState<ScenePreset[]>([]);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Check if current text differs from the active preset
  const activePreset = activePresetId ? presets.find(p => p.id === activePresetId) : null;
  const hasChangesFromActivePreset = useMemo(() => {
    if (!activePreset) return false;
    return textAreaValue.trim() !== activePreset.value.trim();
  }, [textAreaValue, activePreset]);

  // Scene categories that support save/recall
  const sceneCategories = ['action', 'wardrobe', 'environment'];
  const isSceneCategory = categoryId && sceneCategories.includes(categoryId);

  // Load presets when component mounts or categoryId changes
  useEffect(() => {
    if (isLoggedIn && isSceneCategory) {
      loadPresets();
    }
  }, [isLoggedIn, categoryId]);

  const loadPresets = async () => {
    if (!categoryId) return;
    setIsLoadingPresets(true);
    try {
      const data = await api.get<ScenePreset[]>(`/api/scene-presets?category=${categoryId}`);
      setPresets(data);
    } catch (err) {
      console.error('Failed to load presets:', err);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim() || !textAreaValue.trim() || !categoryId) {
      toast.error('Please enter a name and some text to save');
      return;
    }

    try {
      const saved = await api.post<ScenePreset>('/api/scene-presets', {
        name: presetName.trim(),
        category: categoryId,
        value: textAreaValue.trim(),
      });
      setPresets(prev => [saved, ...prev]);
      setPresetName('');
      toast.success('Preset saved!');
    } catch (err) {
      console.error('Failed to save preset:', err);
      toast.error('Failed to save preset');
    }
  };

  const handleRecallPreset = (preset: ScenePreset) => {
    setTextAreaValue(preset.value);
    if (onCustomValuesChange) {
      onCustomValuesChange([preset.value]);
    }
    setActivePresetId(preset.id);
    toast.success(`Recalled "${preset.name}"`);
  };

  const handleUpdatePreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    if (!textAreaValue.trim()) {
      toast.error('Please add some text to update');
      return;
    }

    try {
      const updated = await api.patch<ScenePreset>(`/api/scene-presets/${presetId}`, {
        value: textAreaValue.trim(),
      });
      setPresets(prev => prev.map(p => p.id === presetId ? updated : p));
      toast.success(`Updated "${preset.name}"`);
    } catch (err) {
      console.error('Failed to update preset:', err);
      toast.error('Failed to update preset');
    }
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await api.delete(`/api/scene-presets/${id}`);
      setPresets(prev => prev.filter(p => p.id !== id));
      toast.success('Preset deleted');
    } catch (err) {
      console.error('Failed to delete preset:', err);
      toast.error('Failed to delete preset');
    }
  };

  // For showDescriptions mode - find selected option
  const selectedDescOption = showDescriptions
    ? options.find((opt) => selected.includes(opt.id))
    : null;

  // Scroll to description when selection changes in showDescriptions mode
  useEffect(() => {
    if (showDescriptions && selectedDescOption && descriptionRef.current) {
      setTimeout(() => {
        descriptionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [showDescriptions, selectedDescOption?.id]);

  // Group options by their group property
  const groupedOptions = useMemo(() => {
    const groups: { group: string | null; options: PromptOption[] }[] = [];
    let currentGroup: string | null = null;
    let currentOptions: PromptOption[] = [];

    options.forEach((option) => {
      const optionGroup = option.group || null;
      if (optionGroup !== currentGroup) {
        if (currentOptions.length > 0) {
          groups.push({ group: currentGroup, options: currentOptions });
        }
        currentGroup = optionGroup;
        currentOptions = [option];
      } else {
        currentOptions.push(option);
      }
    });

    if (currentOptions.length > 0) {
      groups.push({ group: currentGroup, options: currentOptions });
    }

    return groups;
  }, [options]);

  const hasGroups = groupedOptions.some((g) => g.group !== null);

  const handleSelect = (id: string, optionGroup?: string | null) => {
    if (allowOnePerGroup && optionGroup) {
      // One selection per group mode
      if (selected.includes(id)) {
        // Deselect if already selected
        onSelect(selected.filter((s) => s !== id));
      } else {
        // Find all option IDs in the same group
        const groupOptionIds = options
          .filter((opt) => opt.group === optionGroup)
          .map((opt) => opt.id);

        // Remove any existing selection from this group, then add the new one
        let filteredSelected = selected.filter((s) => !groupOptionIds.includes(s));

        // Height options that conflict with OTS
        const heightOptionsThatDisableOts = ['height-high', 'height-low', 'height-worm', 'height-top', 'height-aerial'];

        // If selecting OTS, also remove Close/Xclose/Xwide from Size group and conflicting Heights
        if (id === 'view-ots') {
          filteredSelected = filteredSelected.filter((s) =>
            s !== 'size-close' && s !== 'size-xclose' && s !== 'size-xwide' && !heightOptionsThatDisableOts.includes(s)
          );
        }

        // If selecting certain Height options, remove OTS from View group
        if (heightOptionsThatDisableOts.includes(id)) {
          filteredSelected = filteredSelected.filter((s) => s !== 'view-ots');
        }

        // If selecting TOP, remove Side, 3/4, OTS, Rear, Dutch from View group
        const viewOptionsDisabledByTop = ['view-side', 'view-three-quarter', 'view-ots', 'view-rear', 'view-dutch'];
        if (id === 'height-top') {
          filteredSelected = filteredSelected.filter((s) => !viewOptionsDisabledByTop.includes(s));
        }

        // If selecting WORM, remove Dutch from View group
        if (id === 'height-worm') {
          filteredSelected = filteredSelected.filter((s) => s !== 'view-dutch');
        }

        // If selecting DUTCH, remove Worm and Top from Height group
        if (id === 'view-dutch') {
          filteredSelected = filteredSelected.filter((s) => s !== 'height-worm' && s !== 'height-top');
        }

        // If selecting TOP, also remove Front from View group
        if (id === 'height-top') {
          filteredSelected = filteredSelected.filter((s) => s !== 'view-front');
        }

        // If selecting FRONT, remove Top from Height group
        if (id === 'view-front') {
          filteredSelected = filteredSelected.filter((s) => s !== 'height-top');
        }

        // If selecting AERIAL, remove Close and Xclose from Size group
        if (id === 'height-aerial') {
          filteredSelected = filteredSelected.filter((s) => s !== 'size-close' && s !== 'size-xclose');
        }

        onSelect([...filteredSelected, id]);
      }
    } else if (allowMultiple) {
      if (selected.includes(id)) {
        onSelect(selected.filter((s) => s !== id));
      } else {
        onSelect([...selected, id]);
      }
    } else {
      onSelect(selected.includes(id) ? [] : [id]);
    }
  };

  const handleAddCustom = () => {
    if (customInput.trim() && onCustomValuesChange) {
      onCustomValuesChange([...customValues, customInput.trim()]);
      setCustomInput('');
    }
  };

  const handleRemoveCustom = (index: number) => {
    if (onCustomValuesChange) {
      onCustomValuesChange(customValues.filter((_, i) => i !== index));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const handleTextAreaChange = (value: string) => {
    setTextAreaValue(value);
    if (onCustomValuesChange) {
      if (value.trim()) {
        onCustomValuesChange([value.trim()]);
      } else {
        onCustomValuesChange([]);
      }
    }
  };

  const renderOption = (option: PromptOption) => {
    const isSelected = selected.includes(option.id);
    // Use group description for tooltip if showGroupInTooltip is true, otherwise use tooltip or promptValue
    const tooltipText = showGroupInTooltip && option.group
      ? option.group
      : option.tooltip || option.promptValue;

    // Check if OTS is selected and this is Close, Xclose, or Xwide - disable them
    const isOtsSelected = selected.includes('view-ots');
    const isDisabledByOts = isOtsSelected && (option.id === 'size-close' || option.id === 'size-xclose' || option.id === 'size-xwide');

    // Check if AERIAL is selected - disable Close and Xclose
    const isAerialSelected = selected.includes('height-aerial');
    const isDisabledByAerial = isAerialSelected && (option.id === 'size-close' || option.id === 'size-xclose');

    // Check if certain Height options are selected - disable OTS
    const heightOptionsThatDisableOts = ['height-high', 'height-low', 'height-worm', 'height-top', 'height-aerial'];
    const isHeightSelectedThatDisablesOts = heightOptionsThatDisableOts.some(id => selected.includes(id));
    const isOtsDisabledByHeight = isHeightSelectedThatDisablesOts && option.id === 'view-ots';

    // Check if OTS is selected - disable certain Height options
    const isHeightDisabledByOts = isOtsSelected && heightOptionsThatDisableOts.includes(option.id);

    // Check if TOP is selected - disable Side, 3/4, OTS, Rear, Dutch, Front
    const isTopSelected = selected.includes('height-top');
    const viewOptionsDisabledByTop = ['view-side', 'view-three-quarter', 'view-ots', 'view-rear', 'view-dutch', 'view-front'];
    const isDisabledByTop = isTopSelected && viewOptionsDisabledByTop.includes(option.id);

    // Check if WORM is selected - disable Dutch
    const isWormSelected = selected.includes('height-worm');
    const isDisabledByWorm = isWormSelected && option.id === 'view-dutch';

    // Check if DUTCH is selected - disable Worm and Top
    const isDutchSelected = selected.includes('view-dutch');
    const isWormDisabledByDutch = isDutchSelected && option.id === 'height-worm';
    const isTopDisabledByDutch = isDutchSelected && option.id === 'height-top';

    // Check if FRONT is selected - disable Top
    const isFrontSelected = selected.includes('view-front');
    const isTopDisabledByFront = isFrontSelected && option.id === 'height-top';

    const isDisabled = isDisabledByOts || isOtsDisabledByHeight || isHeightDisabledByOts || isDisabledByTop || isDisabledByWorm || isWormDisabledByDutch || isTopDisabledByDutch || isTopDisabledByFront || isDisabledByAerial;
    const disabledTooltip = isDisabledByOts
      ? 'Not available with OTS view'
      : isDisabledByAerial
        ? 'Not available with Aerial height'
        : isOtsDisabledByHeight
        ? 'Not available with selected height'
        : isHeightDisabledByOts
          ? 'Not available with OTS view'
          : isDisabledByTop
            ? 'Not available with Top view'
            : isDisabledByWorm
              ? 'Not available with Worm view'
              : isWormDisabledByDutch
                ? 'Not available with Dutch view'
                : isTopDisabledByDutch
                  ? 'Not available with Dutch view'
                  : isTopDisabledByFront
                    ? 'Not available with Front view'
                    : '';

    return (
      <Tooltip key={option.id}>
        <TooltipTrigger asChild>
          <button
            onClick={() => !isDisabled && handleSelect(option.id, option.group)}
            disabled={isDisabled}
            className={cn(
              'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
              isDisabled
                ? 'border-border/30 bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                : 'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
              isSelected && !isDisabled
                ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                : !isDisabled && 'border-border/60 bg-card text-green-400/60'
            )}
          >
            <span className="flex items-center gap-1.5">
              {isSelected && !isDisabled && <Check className="w-3.5 h-3.5" />}
              {option.label}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{isDisabled ? disabledTooltip : tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Ref for auto-expanding textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea when content changes
  useEffect(() => {
    if (textareaRef.current && textOnly) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`;
    }
  }, [textAreaValue, textOnly]);

  // Text-only mode - just show a textarea
  if (textOnly) {
    return (
      <div className="space-y-3">
        {hintText && (
          <p
            className="text-xs text-amber-500/60 font-medium italic [&_strong]:text-amber-400 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: hintText }}
          />
        )}
        <Textarea
          ref={textareaRef}
          value={textAreaValue}
          onChange={(e) => handleTextAreaChange(e.target.value)}
          placeholder={customPlaceholder || 'Enter description...'}
          className="min-h-[80px] bg-card border-border resize-y text-sm overflow-hidden"
          spellCheck={categoryId === 'wardrobe' || categoryId === 'environment'}
        />

        {/* Update prompt when active preset has changes */}
        {hasChangesFromActivePreset && activePreset && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-500/40 bg-amber-500/10">
            <span className="text-sm text-amber-400">
              Changes detected for "{activePreset.name}"
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdatePreset(activePreset.id)}
              className="h-7 px-3 border-amber-500/40 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Update
            </Button>
          </div>
        )}

        {/* Save/Recall for Scene categories (logged in users only) */}
        {isLoggedIn && isSceneCategory && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            {/* Save current text */}
            <div className="flex gap-2">
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder={categoryId === 'action' ? 'Save this action...' : categoryId === 'wardrobe' ? 'Save this wardrobe...' : categoryId === 'environment' ? 'Save this environment...' : 'Name this preset...'}
                className="flex-1 h-8 text-sm bg-card"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSavePreset}
                disabled={!presetName.trim() || !textAreaValue.trim()}
                className="h-8 px-3"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>

            {/* Saved presets collapsible */}
            {presets.length > 0 && (
              <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <FolderOpen className="w-3.5 h-3.5" />
                      {categoryId === 'action' ? 'Saved Actions' : categoryId === 'wardrobe' ? 'Saved Wardrobes' : categoryId === 'environment' ? 'Saved Environments' : 'Saved Presets'} ({presets.length})
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-muted-foreground transition-transform',
                        presetsOpen && 'rotate-180'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-xs text-muted-foreground mt-2 mb-1">Click on a saved {categoryId === 'action' ? 'action' : categoryId === 'wardrobe' ? 'wardrobe' : categoryId === 'environment' ? 'environment' : 'preset'} to recall it</p>
                  <div className="mt-2 space-y-1">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                      >
                        <button
                          onClick={() => handleRecallPreset(preset)}
                          className="flex-1 text-left text-sm text-primary hover:underline truncate"
                        >
                          {preset.name}
                        </button>
                        <Button
                          onClick={() => handleDeletePreset(preset.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:bg-destructive hover:text-white"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {onDone && (
          <Button
            onClick={onDone}
            size="sm"
            className="w-full"
          >
            Done
          </Button>
        )}
      </div>
    );
  }

  // Show descriptions mode - display options with their descriptions
  if (showDescriptions) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-amber-500/60 font-medium italic">
          Click a technique for a description. Click again to de-select.
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id, option.group)}
                className={cn(
                  'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                  'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                  isSelected
                    ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                    : 'border-border/60 bg-card text-green-400/60'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        {selectedDescOption && selectedDescOption.tooltip && (
          <div ref={descriptionRef} className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedDescOption.tooltip}
            </p>
            {selectedDescOption.image && (
              <div className="flex justify-center mt-4">
                <img
                  src={selectedDescOption.image}
                  alt={selectedDescOption.label}
                  className="max-w-full h-auto"
                />
              </div>
            )}
          </div>
        )}
        {onDone && (
          <Button
            onClick={onDone}
            size="sm"
            className="w-full"
          >
            Done
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instruction text for allowOnePerGroup mode */}
      {allowOnePerGroup && hasGroups && (
        <p className="text-xs text-amber-500/60 font-medium italic">
          Select one option from each group. No minimum selections required.
        </p>
      )}
      {hasGroups ? (
        <div className="space-y-4">
          {groupedOptions.map((group, index) => {
            const groupName = group.group || `group-${index}`;

            return group.group ? (
              <div key={groupName} className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/70">
                  {group.group}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {group.options.map(renderOption)}
                </div>
              </div>
            ) : (
              <div key={groupName} className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {group.options.map(renderOption)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        options.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {options.map(renderOption)}
          </div>
        )
      )}

      {allowCustom && !textOnly && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={customPlaceholder || 'Add custom value...'}
              className="flex-1 h-8 text-sm bg-card"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              className="h-8 px-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {customValues.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customValues.map((value, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-accent/20 text-accent border border-accent/30"
                >
                  {value}
                  <button
                    onClick={() => handleRemoveCustom(index)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
