import { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, FolderOpen, ChevronDown, Users, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

export interface Subject {
  id: string;
  name: string;
  age: string;
  appearance: string;
  action: string;
}

interface ScenePreset {
  id: string;
  name: string;
  category: string;
  value: string;
  createdAt: string;
}

interface SubjectActionSelectorProps {
  subjects: Subject[];
  onSubjectsChange: (subjects: Subject[]) => void;
  onDone?: () => void;
}

const createEmptySubject = (index: number): Subject => ({
  id: `subject-${Date.now()}-${index}`,
  name: '',
  age: '',
  appearance: '',
  action: '',
});

export function SubjectActionSelector({
  subjects,
  onSubjectsChange,
  onDone,
}: SubjectActionSelectorProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  // Initialize with one subject if empty
  useEffect(() => {
    if (subjects.length === 0) {
      onSubjectsChange([createEmptySubject(1)]);
    }
  }, []);

  // Scene preset state
  const [presets, setPresets] = useState<ScenePreset[]>([]);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Check if current subjects differ from the active preset
  const activePreset = activePresetId ? presets.find(p => p.id === activePresetId) : null;
  const hasChangesFromActivePreset = useMemo(() => {
    if (!activePreset) return false;
    try {
      const savedSubjects = JSON.parse(activePreset.value) as Subject[];
      // Compare current subjects with saved ones
      if (subjects.length !== savedSubjects.length) return true;
      return subjects.some((s, i) => {
        const saved = savedSubjects[i];
        return s.name !== saved.name ||
               s.age !== saved.age ||
               s.appearance !== saved.appearance ||
               s.action !== saved.action;
      });
    } catch {
      return false;
    }
  }, [subjects, activePreset]);

  // Load presets when component mounts
  useEffect(() => {
    if (isLoggedIn) {
      loadPresets();
    }
  }, [isLoggedIn]);

  const loadPresets = async () => {
    setIsLoadingPresets(true);
    try {
      const data = await api.get<ScenePreset[]>('/api/scene-presets?category=subjects');
      setPresets(data);
    } catch (err) {
      console.error('Failed to load presets:', err);
    } finally {
      setIsLoadingPresets(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a name to save');
      return;
    }

    // Check if any subject has content
    const hasContent = subjects.some(s => s.name || s.age || s.appearance || s.action);
    if (!hasContent) {
      toast.error('Please add some subject details to save');
      return;
    }

    try {
      const saved = await api.post<ScenePreset>('/api/scene-presets', {
        name: presetName.trim(),
        category: 'subjects',
        value: JSON.stringify(subjects),
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
    try {
      const loadedSubjects = JSON.parse(preset.value) as Subject[];
      onSubjectsChange(loadedSubjects);
      setActivePresetId(preset.id);
      toast.success(`Recalled "${preset.name}"`);
    } catch (err) {
      console.error('Failed to parse preset:', err);
      toast.error('Failed to recall preset');
    }
  };

  const handleUpdatePreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    // Check if any subject has content
    const hasContent = subjects.some(s => s.name || s.age || s.appearance || s.action);
    if (!hasContent) {
      toast.error('Please add some subject details to update');
      return;
    }

    try {
      const updated = await api.patch<ScenePreset>(`/api/scene-presets/${presetId}`, {
        value: JSON.stringify(subjects),
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

  // Check if age contains a specific number (not a range like "20s" or "mid-20s")
  const isSpecificAge = (age: string): boolean => {
    const trimmed = age.trim();
    // Match standalone numbers like "25", "30", "45" but not "20s", "mid-20s", "early 30s"
    return /^\d+$/.test(trimmed);
  };

  const handleSubjectChange = (index: number, field: keyof Subject, value: string) => {
    // Warn if user enters a specific age number
    if (field === 'age' && isSpecificAge(value)) {
      toast.error('=============WARNING=============\nYou must use an age range e.g., "mid-20s"');
    }

    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    onSubjectsChange(updated);
  };

  const handleAddSubject = () => {
    if (subjects.length >= 2) {
      toast.error('Maximum of 2 subjects allowed');
      return;
    }
    onSubjectsChange([...subjects, createEmptySubject(subjects.length + 1)]);
  };

  const handleRemoveSubject = (index: number) => {
    if (subjects.length <= 1) {
      toast.error('At least one subject is required');
      return;
    }
    const updated = subjects.filter((_, i) => i !== index);
    onSubjectsChange(updated);
  };

  // Auto-expand textareas
  const autoExpandTextarea = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(60, el.scrollHeight)}px`;
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-amber-500/60 font-medium italic">
        Define your subject(s) with their name, age, appearance, and what they're doing in the shot.
      </p>

      <div className="ml-4 space-y-2">
        {subjects.map((subject, index) => {
          const isLast = index === subjects.length - 1;
          return (
            <div key={subject.id} className="relative">
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
              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Users className="w-4 h-4" />
              {index === 0 ? 'Subject 1 (Primary)' : 'Subject 2 (Secondary)'}
            </h4>
            {subjects.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSubject(index)}
                className="h-7 px-2 text-red-400/60 hover:bg-destructive hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input
                value={subject.name}
                onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                placeholder="e.g., John, Sarah..."
                className="h-8 text-sm bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Age (early, mid, late) years</label>
              <Input
                value={subject.age}
                onChange={(e) => handleSubjectChange(index, 'age', e.target.value)}
                placeholder="e.g. mid-20s"
                className="h-8 text-sm bg-background"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Appearance</label>
            <Textarea
              value={subject.appearance}
              onChange={(e) => {
                handleSubjectChange(index, 'appearance', e.target.value);
                autoExpandTextarea(e.target);
              }}
              placeholder="Describe physical features, hair, expression..."
              className="min-h-[60px] text-sm bg-background resize-none overflow-hidden"
              spellCheck={true}
              ref={autoExpandTextarea}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Action</label>
            <Textarea
              value={subject.action}
              onChange={(e) => {
                handleSubjectChange(index, 'action', e.target.value);
                autoExpandTextarea(e.target);
              }}
              placeholder="What is this subject doing in the shot?"
              className="min-h-[60px] text-sm bg-background resize-none overflow-hidden"
              spellCheck={true}
              ref={autoExpandTextarea}
            />
          </div>
              </div>
            </div>
          );
        })}
      </div>

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

      {/* Add Subject Button */}
      {subjects.length < 2 && (
        <Button
          variant="outline"
          onClick={handleAddSubject}
          className="w-full border-dashed border-primary/40 text-primary hover:bg-primary/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subject 2
        </Button>
      )}

      {/* Save/Recall for logged in users */}
      {isLoggedIn && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          {/* Save current subjects */}
          <div className="flex gap-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Save these subjects as..."
              className="flex-1 h-8 text-sm bg-card"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
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
                    Saved Subjects ({presets.length})
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
                <p className="text-xs text-muted-foreground mt-2 mb-1">Click on a saved preset to recall it</p>
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
