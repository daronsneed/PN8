import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Camera type based on filename suffix: D = Digital, F = Film
export type CameraTypeSuffix = 'D' | 'F';

export interface CameraData {
  id: string;
  name: string;
  imagePath: string;
  typeSuffix: CameraTypeSuffix;
  promptValue: string;
  tooltip?: string;
}

// Camera type filter options
export const cameraTypeFilters = [
  { id: 'D', label: 'Digital', description: 'Modern digital cinema cameras' },
  { id: 'F', label: 'Film', description: 'Classic film cameras' },
] as const;

export type CameraTypeFilterId = typeof cameraTypeFilters[number]['id'];

// Camera data populated with actual camera images
export const cameraCollection: CameraData[] = [
  // Digital cameras (D)
  { id: 'arri-alexa', name: 'ARRI Alexa', imagePath: '/cameras/Arri_Alexa_D.png', typeSuffix: 'D', promptValue: 'shot on ARRI Alexa', tooltip: 'Industry standard digital cinema camera with natural color science' },
  { id: 'canon-mark-iv', name: 'Canon Mark IV', imagePath: '/cameras/CanonMark_IV_D.png', typeSuffix: 'D', promptValue: 'shot on Canon EOS 5D Mark IV', tooltip: 'Popular DSLR for hybrid photo/video work' },
  { id: 'canon-c300-iii', name: 'Canon C300 III', imagePath: '/cameras/Canon_EOS_C300_Mark_III_D.png', typeSuffix: 'D', promptValue: 'shot on Canon EOS C300 Mark III', tooltip: 'Professional cinema camera with Dual Gain Output' },
  { id: 'imax', name: 'IMAX', imagePath: '/cameras/IMAX_D.png', typeSuffix: 'D', promptValue: 'shot on IMAX camera', tooltip: 'Large format cinema for maximum resolution and immersion' },
  { id: 'red', name: 'RED', imagePath: '/cameras/RED_D.png', typeSuffix: 'D', promptValue: 'shot on RED camera', tooltip: 'High resolution digital cinema with RAW recording' },
  { id: 'sony-fx9', name: 'Sony FX9', imagePath: '/cameras/sony-fx9_D.png', typeSuffix: 'D', promptValue: 'shot on Sony FX9', tooltip: 'Full-frame cinema camera with fast autofocus' },
  { id: 'sony-venice', name: 'Sony Venice', imagePath: '/cameras/Sony_Venice_D.png', typeSuffix: 'D', promptValue: 'shot on Sony Venice', tooltip: 'High-end cinema camera with beautiful color reproduction' },
  { id: 'ursa-mini-pro', name: 'URSA Mini Pro 4.6K', imagePath: '/cameras/URSA-Mini-Pro-4.6K_D.png', typeSuffix: 'D', promptValue: 'shot on Blackmagic URSA Mini Pro 4.6K', tooltip: 'Versatile cinema camera with built-in ND filters' },

  // Film cameras (F)
  { id: 'arriflex-16sr', name: 'Arriflex 16SR', imagePath: '/cameras/Arriflex_16SR_F.png', typeSuffix: 'F', promptValue: 'shot on Arriflex 16SR', tooltip: 'Classic Super 16mm film camera for documentary and indie films' },
  { id: 'panaflex-millennium', name: 'Panaflex Millennium', imagePath: '/cameras/Panaflex_Millenium_F.png', typeSuffix: 'F', promptValue: 'shot on Panaflex Millennium', tooltip: 'Legendary 35mm film camera used on countless features' },
  { id: 'panavision-panaflex', name: 'Panavision Panaflex', imagePath: '/cameras/Panavision_Panaflex_F.png', typeSuffix: 'F', promptValue: 'shot on Panavision Panaflex', tooltip: 'Iconic Hollywood film camera with distinctive look' },
];

interface CameraSelectorProps {
  selectedCameraId: string | null;
  selectedType: CameraTypeFilterId | null;
  onSelectCamera: (cameraId: string | null) => void;
  onSelectType: (type: CameraTypeFilterId | null) => void;
  cameras?: CameraData[];
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

// Default camera to highlight when no selection is made
const DEFAULT_CAMERA_ID = 'canon-c300-iii';

export function CameraSelector({
  selectedCameraId,
  selectedType,
  onSelectCamera,
  onSelectType,
  cameras = cameraCollection,
  isExpanded,
  onExpandedChange,
}: CameraSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Find default camera index based on filtered cameras
  const getDefaultIndex = (filteredCams: CameraData[]) => {
    const defaultIndex = filteredCams.findIndex(c => c.id === DEFAULT_CAMERA_ID);
    return defaultIndex >= 0 ? defaultIndex : 0;
  };

  const [focusedIndex, setFocusedIndex] = useState(() => {
    // Initial state: find Canon C300 in full camera list
    const defaultIndex = cameras.findIndex(c => c.id === DEFAULT_CAMERA_ID);
    return defaultIndex >= 0 ? defaultIndex : 0;
  });

  // Filter cameras based on selected type
  const filteredCameras = useMemo(() => {
    if (!selectedType) return cameras;
    return cameras.filter((camera) => camera.typeSuffix === selectedType);
  }, [cameras, selectedType]);

  // Reset index when filter changes - default to Canon C300 if no selection
  useEffect(() => {
    if (!selectedCameraId) {
      setFocusedIndex(getDefaultIndex(filteredCameras));
    } else {
      // If there's a selection, focus on it
      const selectedIndex = filteredCameras.findIndex(c => c.id === selectedCameraId);
      if (selectedIndex >= 0) {
        setFocusedIndex(selectedIndex);
      } else {
        setFocusedIndex(getDefaultIndex(filteredCameras));
      }
    }
  }, [selectedType, filteredCameras, selectedCameraId]);

  // Scroll to focused camera
  useEffect(() => {
    if (scrollContainerRef.current && filteredCameras.length > 0) {
      const container = scrollContainerRef.current;

      // Use requestAnimationFrame to ensure DOM is rendered
      requestAnimationFrame(() => {
        const cameraElements = container.querySelectorAll('button');
        const focusedElement = cameraElements[focusedIndex];

        if (focusedElement) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = focusedElement.getBoundingClientRect();
          const elementCenter = elementRect.left + elementRect.width / 2;
          const containerCenter = containerRect.left + containerRect.width / 2;
          const scrollOffset = elementCenter - containerCenter + container.scrollLeft;

          // Use instant scroll on initial load (focusedIndex === 0), smooth for navigation
          container.scrollTo({
            left: scrollOffset,
            behavior: focusedIndex === 0 ? 'instant' : 'smooth'
          });
        }
      });
    }
  }, [focusedIndex, filteredCameras.length, selectedType]);

  const handlePrevious = () => {
    setFocusedIndex((prev) =>
      prev <= 0 ? filteredCameras.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setFocusedIndex((prev) =>
      prev >= filteredCameras.length - 1 ? 0 : prev + 1
    );
  };

  const handleCameraClick = (index: number, cameraId: string) => {
    if (focusedIndex === index) {
      // Toggle selection if already focused
      if (selectedCameraId === cameraId) {
        onSelectCamera(null);
      } else {
        onSelectCamera(cameraId);
        // Close the entire camera section after selection
        onSelectType(null);
        onExpandedChange(false);
      }
    } else {
      // First click focuses, select immediately too for better UX
      setFocusedIndex(index);
      onSelectCamera(cameraId);
      // Close the entire camera section after selection
      onSelectType(null);
      onExpandedChange(false);
    }
  };

  const handleTypeClick = (typeId: CameraTypeFilterId) => {
    if (selectedType === typeId) {
      onSelectType(null);
    } else {
      onSelectType(typeId);
    }
    onSelectCamera(null);
  };

  // Handle clicking on the selected camera display to re-open
  const handleSelectedCameraClick = () => {
    if (selectedCamera) {
      // Set the type filter to match the selected camera
      onSelectType(selectedCamera.typeSuffix);

      // Find the index of the selected camera in the filtered list
      const camerasForType = cameras.filter((camera) => camera.typeSuffix === selectedCamera.typeSuffix);
      const selectedIndex = camerasForType.findIndex(c => c.id === selectedCameraId);
      if (selectedIndex >= 0) {
        setFocusedIndex(selectedIndex);
      }
    }
  };

  const focusedCamera = filteredCameras[focusedIndex];

  // Get the selected camera data for display when carousel is closed
  const selectedCamera = selectedCameraId ? cameras.find(c => c.id === selectedCameraId) : null;

  return (
    <div className="space-y-4">
      {/* Info text */}
      <p className="text-xs text-amber-400/70 italic">
        Camera Type isn't always acknowledged, but doesn't hurt the prompt's strength
      </p>

      {/* Type Filter Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Camera Type
        </span>
        <div className="flex flex-wrap gap-2">
          {cameraTypeFilters.map((type) => (
            <Tooltip key={type.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleTypeClick(type.id)}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                    'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                    selectedType === type.id
                      ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                      : 'border-border/60 bg-card text-green-400/60'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {selectedType === type.id && <Check className="w-3.5 h-3.5" />}
                    {type.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{type.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Selected Camera Display (when carousel is closed) */}
      {selectedCamera && !selectedType && (
        <button
          onClick={handleSelectedCameraClick}
          className="w-full p-3 rounded-lg bg-primary/5 border border-primary/30 text-left hover:bg-primary/10 transition-colors"
        >
          <p className="text-sm font-medium text-primary">
            {selectedCamera.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedCamera.tooltip}
          </p>
        </button>
      )}

      {/* Filmstrip Camera Carousel */}
      {selectedType && filteredCameras.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Select Camera
            </span>
            <span className="text-xs text-muted-foreground">
              {focusedIndex + 1} / {filteredCameras.length}
            </span>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevious}
              disabled={filteredCameras.length <= 1}
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 z-10',
                'w-8 h-8 rounded-full bg-background/90 border border-border/60 shadow-lg',
                'flex items-center justify-center',
                'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                'transition-all duration-200',
                'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90 disabled:hover:text-foreground disabled:hover:border-border/60'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              disabled={filteredCameras.length <= 1}
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 z-10',
                'w-8 h-8 rounded-full bg-background/90 border border-border/60 shadow-lg',
                'flex items-center justify-center',
                'hover:bg-primary hover:text-primary-foreground hover:border-primary',
                'transition-all duration-200',
                'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/90 disabled:hover:text-foreground disabled:hover:border-border/60'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Filmstrip */}
            <div
              ref={scrollContainerRef}
              className="mx-10 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div
                className="flex gap-2 py-2 justify-center"
                style={{ minWidth: 'max-content' }}
              >
                {filteredCameras.map((camera, index) => {
                  const isSelected = selectedCameraId === camera.id;
                  const isFocused = focusedIndex === index;
                  const distance = Math.abs(index - focusedIndex);

                  return (
                    <Tooltip key={camera.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleCameraClick(index, camera.id)}
                          className={cn(
                            'relative shrink-0 w-20 rounded-xl overflow-hidden transition-all duration-300',
                            'border-2',
                            isFocused
                              ? 'scale-110 shadow-xl z-10'
                              : distance === 1
                              ? 'scale-95 opacity-70'
                              : 'scale-90 opacity-40',
                            isSelected
                              ? 'border-primary ring-2 ring-primary/30'
                              : isFocused
                              ? 'border-primary/50'
                              : 'border-transparent'
                          )}
                        >
                          {/* Camera Image Container */}
                          <div className={cn(
                            'relative bg-gradient-to-b from-muted/30 to-muted/60 p-2',
                            'flex items-center justify-center h-20'
                          )}>
                            <img
                              src={camera.imagePath}
                              alt={camera.name}
                              className="max-w-[60px] max-h-[60px] object-contain drop-shadow-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />

                            {/* Selection checkmark */}
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Camera Name */}
                          <div className={cn(
                            'px-1.5 py-1.5 text-center',
                            'bg-card/90 backdrop-blur-sm',
                            isSelected ? 'bg-primary/10' : ''
                          )}>
                            <span className={cn(
                              'text-[10px] font-medium leading-tight block truncate',
                              isSelected ? 'text-primary' : 'text-foreground'
                            )}>
                              {camera.name}
                            </span>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="font-medium">{camera.name}</p>
                        <p className="text-xs text-muted-foreground">{camera.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Focus indicator dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {filteredCameras.map((camera, index) => (
                <button
                  key={camera.id}
                  onClick={() => setFocusedIndex(index)}
                  className={cn(
                    'transition-all duration-200',
                    focusedIndex === index
                      ? 'w-6 h-1.5 rounded-full bg-primary'
                      : selectedCameraId === camera.id
                      ? 'w-1.5 h-1.5 rounded-full bg-primary/60'
                      : 'w-1.5 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Selected Camera Info */}
          {focusedCamera && (
            <div className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              'bg-muted/30 border border-border/40',
              selectedCameraId === focusedCamera.id && 'bg-primary/5 border-primary/30'
            )}>
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  selectedCameraId === focusedCamera.id ? 'text-primary' : 'text-foreground'
                )}>
                  {focusedCamera.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {focusedCamera.tooltip}
                </p>
              </div>
              {selectedCameraId === focusedCamera.id ? (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md font-medium">
                  Selected
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Click to select
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* No cameras message */}
      {selectedType && filteredCameras.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No cameras available for this type
        </div>
      )}
    </div>
  );
}
