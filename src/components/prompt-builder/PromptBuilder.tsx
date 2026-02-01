import { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Aperture,
  Timer,
  Film,
  Gauge,
  Focus,
  User,
  Shirt,
  MapPin,
  Sun,
  Wand2,
  ScanLine,
  Video,
  Palette,
  Users,
} from 'lucide-react';
import { allCategories } from '@/lib/prompt-builder-data';
import { CategorySection } from './CategorySection';
import { PromptPreview } from './PromptPreview';
import { LensSelector, lensCollection, type LensStyleFilterId } from './LensSelector';
import { CameraSelector, cameraCollection, type CameraTypeFilterId } from './CameraSelector';
import { SubjectActionSelector, type Subject } from './SubjectActionSelector';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession, signOut } from '@/lib/auth-client';

// Mask email with asterisks (e.g., "j***@hotmail.com")
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  if (localPart.length <= 1) {
    return `*@${domain}`;
  }

  const firstChar = localPart[0];
  const maskedPart = '*'.repeat(Math.min(localPart.length - 1, 5));
  return `${firstChar}${maskedPart}@${domain}`;
}

const categoryIcons: Record<string, React.ReactNode> = {
  style: <Palette className="w-4 h-4" />,  // Genre (using style id)
  camera: <Camera className="w-4 h-4" />,
  angles: <ScanLine className="w-4 h-4" />,
  filmStock: <Film className="w-4 h-4" />,
  iso: <Gauge className="w-4 h-4" />,
  aperture: <Aperture className="w-4 h-4" />,
  shutter: <Timer className="w-4 h-4" />,
  action: <Users className="w-4 h-4" />,
  wardrobe: <Shirt className="w-4 h-4" />,
  environment: <MapPin className="w-4 h-4" />,
  lighting: <Sun className="w-4 h-4" />,
  finalTouches: <Wand2 className="w-4 h-4" />,
};

// Group categories for better organization with nested sub-sections
const categoryGroups = [
  {
    title: 'Camera',
    description: 'Camera equipment and shot composition',
    categories: ['style', 'filmStock', 'angles'],
  },
  {
    title: 'Exposure & Settings',
    description: 'ISO, aperture, and shutter settings',
    categories: ['iso', 'aperture', 'shutter'],
  },
  {
    title: 'Scene Setup',
    description: 'Subject and environment',
    categories: ['action', 'wardrobe', 'environment'],
  },
  {
    title: 'Style & Quality',
    description: 'Final aesthetic touches',
    categories: ['lighting', 'finalTouches'],
  },
];

export function PromptBuilder() {
  const { data: session } = useSession();
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customValues, setCustomValues] = useState<Record<string, string[]>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [subjectDescription, setSubjectDescription] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Lens selector state
  const [selectedLensId, setSelectedLensId] = useState<string | null>(null);
  const [selectedLensStyle, setSelectedLensStyle] = useState<LensStyleFilterId | null>(null);
  const [lensOpen, setLensOpen] = useState(false);

  // Camera selector state
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedCameraType, setSelectedCameraType] = useState<CameraTypeFilterId | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Refs for scroll behavior
  const cameraRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const sceneSetupRef = useRef<HTMLDivElement>(null);

  // Scroll to center when camera section opens
  useEffect(() => {
    if (cameraOpen && cameraRef.current) {
      setTimeout(() => {
        cameraRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [cameraOpen]);

  // Scroll to center when lens section opens
  useEffect(() => {
    if (lensOpen && lensRef.current) {
      setTimeout(() => {
        lensRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [lensOpen]);

  // Scroll to center when subjects section opens
  useEffect(() => {
    if (openSections['action'] && sceneSetupRef.current) {
      setTimeout(() => {
        sceneSetupRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [openSections['action']]);

  // Get selected lens data for prompt generation
  const selectedLens = selectedLensId
    ? lensCollection.find(l => l.id === selectedLensId)
    : null;

  // Get selected camera data for prompt generation
  const selectedCamera = selectedCameraId
    ? cameraCollection.find(c => c.id === selectedCameraId)
    : null;

  const handleSelect = (categoryId: string, ids: string[]) => {
    setSelections((prev) => ({
      ...prev,
      [categoryId]: ids,
    }));
    // Close the section after a selection is made (except for Genre which allows multiple, Framing which allows one per group, and Lighting which shows descriptions)
    if (ids.length > 0 && categoryId !== 'style' && categoryId !== 'angles' && categoryId !== 'lighting') {
      setOpenSections((prev) => ({
        ...prev,
        [categoryId]: false,
      }));
    }
  };

  const handleCustomValuesChange = (categoryId: string, values: string[]) => {
    setCustomValues((prev) => ({
      ...prev,
      [categoryId]: values,
    }));
  };

  const handleOpenChange = (categoryId: string, open: boolean) => {
    if (open) {
      // Close all other sections and open only this one
      const newOpenSections: Record<string, boolean> = {};
      newOpenSections[categoryId] = true;
      setOpenSections(newOpenSections);
      // Also close camera and lens sections
      setCameraOpen(false);
      setLensOpen(false);
    } else {
      setOpenSections((prev) => ({
        ...prev,
        [categoryId]: false,
      }));
    }
  };

  const handleReset = () => {
    setSelections({});
    setCustomValues({});
    setSubjectDescription('');
    setSubjects([]);
    setSelectedLensId(null);
    setSelectedLensStyle(null);
    setSelectedCameraId(null);
    setSelectedCameraType(null);
  };

  const handleCameraOpenChange = (open: boolean) => {
    if (open) {
      // Close all other sections
      setOpenSections({});
      setLensOpen(false);
    }
    setCameraOpen(open);
  };

  const handleLensOpenChange = (open: boolean) => {
    if (open) {
      // Close all other sections
      setOpenSections({});
      setCameraOpen(false);
    }
    setLensOpen(open);
  };

  const handleLoadPrompt = (
    loadedSelections: Record<string, string[]>,
    loadedCustomValues: Record<string, string[]>,
    lensId?: string | null,
    lensStyle?: LensStyleFilterId | null,
    cameraId?: string | null,
    cameraType?: CameraTypeFilterId | null
  ) => {
    setSelections(loadedSelections);
    setCustomValues(loadedCustomValues);
    setSelectedLensId(lensId || null);
    setSelectedLensStyle(lensStyle || null);
    setSelectedCameraId(cameraId || null);
    setSelectedCameraType(cameraType || null);
  };

  const renderCategory = (categoryId: string) => {
    const category = allCategories.find((c) => c.id === categoryId);
    if (!category) return null;

    // Show group in tooltip for Exposure & Settings categories
    const exposureCategories = ['iso', 'aperture', 'shutter'];
    const showGroupInTooltip = exposureCategories.includes(category.id);

    return (
      <CategorySection
        key={category.id}
        category={category}
        selected={selections[category.id] || []}
        onSelect={(ids) => handleSelect(category.id, ids)}
        customValues={customValues[category.id]}
        onCustomValuesChange={(values) =>
          handleCustomValuesChange(category.id, values)
        }
        isOpen={openSections[category.id] || false}
        onOpenChange={(open) => handleOpenChange(category.id, open)}
        icon={categoryIcons[category.id]}
        onDone={() => handleOpenChange(category.id, false)}
        showGroupInTooltip={showGroupInTooltip}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="w-24 h-24 rounded-2xl object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight font-heading">
                  PROMPTN8
                </h1>
                <p className="text-base text-muted-foreground">
                  build better text-to-image prompts
                </p>
              </div>
            </div>
            {session?.user && (
              <div className="text-right">
                <div className="text-sm whitespace-nowrap flex items-center justify-end gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Logged in as </span>
                  <span className="text-foreground">{maskEmail(session.user.email)}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-sm font-medium text-primary hover:text-white transition-colors mt-1"
                >
                  LOG OUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Category Selections */}
          <div className="space-y-8">
            {categoryGroups.map((group, groupIndex) => (
              <div key={group.title} className="space-y-4" ref={groupIndex === 2 ? sceneSetupRef : undefined}>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
                </div>
                <div className="space-y-3">
                  {/* Camera group: Genre, Camera Body, Film Stock, Lens, Framing */}
                  {groupIndex === 0 && (
                    <>
                      {/* Genre */}
                      {renderCategory('style')}

                      {/* Camera Body Selector */}
                      <Collapsible open={cameraOpen} onOpenChange={handleCameraOpenChange}>
                        <div ref={cameraRef}>
                          <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                selectedCamera ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                              )}>
                                <Camera className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-foreground">Camera Body</h3>
                                <p className="text-xs text-muted-foreground">Select digital or film camera</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedCamera && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md truncate max-w-[120px]">
                                  {selectedCamera.name}
                                </span>
                              )}
                              <ChevronDown
                                className={cn(
                                  'w-4 h-4 text-muted-foreground transition-transform',
                                  cameraOpen && 'rotate-180'
                                )}
                              />
                            </div>
                          </button>
                        </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="relative ml-4">
                            {/* Connecting line with arrow - vertical line to center */}
                            <div
                              className="absolute left-0 top-0 h-1/2 w-px"
                              style={{ backgroundColor: '#c9c9c9', marginLeft: '-12px' }}
                            />
                            <div
                              className="absolute left-0 top-1/2 w-2 h-px"
                              style={{ backgroundColor: '#c9c9c9', marginLeft: '-12px' }}
                            />
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
                            <div className="mt-2 p-4 rounded-xl border border-border/60 bg-card">
                              <CameraSelector
                                selectedCameraId={selectedCameraId}
                                selectedType={selectedCameraType}
                                onSelectCamera={setSelectedCameraId}
                                onSelectType={setSelectedCameraType}
                                isExpanded={cameraOpen}
                                onExpandedChange={setCameraOpen}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Film Stock - only show if a film camera is selected */}
                      {selectedCamera?.typeSuffix === 'F' && renderCategory('filmStock')}

                      {/* Lens Selector */}
                      <Collapsible open={lensOpen} onOpenChange={handleLensOpenChange}>
                        <div ref={lensRef}>
                          <CollapsibleTrigger asChild>
                            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center",
                                  selectedLens ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                  <Focus className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <h3 className="font-semibold text-foreground">Lens</h3>
                                  <p className="text-xs text-muted-foreground">Select style and lens type</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedLens && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md truncate max-w-[120px]">
                                    {selectedLens.name}
                                  </span>
                                )}
                                <ChevronDown
                                  className={cn(
                                    'w-4 h-4 text-muted-foreground transition-transform',
                                    lensOpen && 'rotate-180'
                                  )}
                                />
                              </div>
                            </button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="relative ml-4">
                            {/* Connecting line with arrow - vertical line to center */}
                            <div
                              className="absolute left-0 top-0 h-1/2 w-px"
                              style={{ backgroundColor: '#c9c9c9', marginLeft: '-12px' }}
                            />
                            <div
                              className="absolute left-0 top-1/2 w-2 h-px"
                              style={{ backgroundColor: '#c9c9c9', marginLeft: '-12px' }}
                            />
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
                            <div className="mt-2 p-4 rounded-xl border border-border/60 bg-card">
                              <LensSelector
                                selectedLensId={selectedLensId}
                                selectedStyle={selectedLensStyle}
                                onSelectLens={setSelectedLensId}
                                onSelectStyle={setSelectedLensStyle}
                                isExpanded={lensOpen}
                                onExpandedChange={setLensOpen}
                              />
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Framing */}
                      {renderCategory('angles')}
                    </>
                  )}

                  {/* Other groups render normally */}
                  {groupIndex !== 0 && group.categories.map((categoryId) => {
                    // Special handling for action category - use SubjectActionSelector
                    if (categoryId === 'action') {
                      const category = allCategories.find((c) => c.id === 'action');
                      if (!category) return null;

                      const hasSubjects = subjects.length > 0 && subjects.some(s => s.name || s.age || s.appearance || s.action);

                      return (
                        <Collapsible
                          key="action"
                          open={openSections['action'] || false}
                          onOpenChange={(open) => handleOpenChange('action', open)}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              className={cn(
                                'w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200',
                                'border bg-card hover:bg-muted/50 hover:border-primary/30 hover:shadow-md',
                                hasSubjects ? 'border-primary/20 shadow-sm' : 'border-border/50',
                                openSections['action'] && 'rounded-b-none border-b-transparent'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                                    hasSubjects ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  <Users className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                  <h3 className="font-semibold text-foreground">{category.label}</h3>
                                  <p className="text-xs text-muted-foreground">{category.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {hasSubjects && (
                                  <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                    {subjects.length} subject{subjects.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                <ChevronDown
                                  className={cn(
                                    'w-5 h-5 text-muted-foreground transition-transform duration-200',
                                    openSections['action'] && 'rotate-180'
                                  )}
                                />
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="relative ml-4">
                              {/* Connecting line with arrow - points to primary subject */}
                              {/* Vertical line from top to primary subject */}
                              <div
                                className="absolute left-0 w-px"
                                style={{
                                  backgroundColor: '#c9c9c9',
                                  marginLeft: '-12px',
                                  top: '0',
                                  height: '130px',
                                }}
                              />
                              {/* Horizontal line to primary subject */}
                              <div
                                className="absolute left-0 h-px"
                                style={{
                                  backgroundColor: '#c9c9c9',
                                  marginLeft: '-12px',
                                  top: '130px',
                                  width: '8px',
                                }}
                              />
                              {/* Arrow pointing to primary subject */}
                              <div
                                className="absolute"
                                style={{
                                  marginLeft: '-6px',
                                  top: '130px',
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
                                  'p-4 border border-t-0 rounded-b-xl bg-muted/30',
                                  hasSubjects ? 'border-primary/20' : 'border-border/50'
                                )}
                              >
                                <SubjectActionSelector
                                  subjects={subjects}
                                  onSubjectsChange={setSubjects}
                                  onDone={() => handleOpenChange('action', false)}
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    }
                    return renderCategory(categoryId);
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <div className="text-center mb-4 p-4 rounded-xl border border-border/50 bg-black flex flex-col justify-center">
              <p className="text-base text-muted-foreground/70">
                While these prompts work with various AI
              </p>
              <p className="text-base text-muted-foreground/70">
                models, they were made specifically for
              </p>
              <div className="flex justify-center mt-1">
                <a href="https://nanobananapro.com/" target="_blank" rel="noopener noreferrer">
                  <img src="/nbp-logo-1.png" alt="Nano Banana Pro" className="h-4" />
                </a>
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-border/50 bg-card shadow-xl shadow-black/5">
              <PromptPreview
                selections={selections}
                customValues={customValues}
                subjectDescription={subjectDescription}
                onSubjectChange={setSubjectDescription}
                subjects={subjects}
                onSubjectsChange={setSubjects}
                onReset={handleReset}
                onLoadPrompt={handleLoadPrompt}
                onParsePrompt={(parsedSelections, parsedCustomValues, lensId, cameraId, parsedSubjects) => {
                  // Merge parsed selections with existing ones
                  setSelections(prev => ({
                    ...prev,
                    ...parsedSelections,
                  }));
                  // Merge parsed custom values
                  setCustomValues(prev => ({
                    ...prev,
                    ...parsedCustomValues,
                  }));
                  if (lensId) {
                    setSelectedLensId(lensId);
                  }
                  if (cameraId) {
                    setSelectedCameraId(cameraId);
                  }
                  if (parsedSubjects && parsedSubjects.length > 0) {
                    setSubjects(parsedSubjects);
                  }
                }}
                selectedLens={selectedLens}
                selectedLensStyle={selectedLensStyle}
                selectedCamera={selectedCamera}
                selectedCameraType={selectedCameraType}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
