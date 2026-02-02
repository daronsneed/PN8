import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Lens style types based on filename suffix
export type LensStyleSuffix = 'A' | 'S' | 'AS' | 'M' | 'T';

export interface LensData {
  id: string;
  name: string;
  imagePath: string;
  styleSuffix: LensStyleSuffix;
  promptValue: string;
  tooltip?: string;
}

// Style filter options
export const lensStyleFilters = [
  { id: 'A', label: 'Anamorphic', description: 'Cinematic wide aspect ratio look with oval bokeh' },
  { id: 'S', label: 'Spherical', description: 'Standard lens with natural circular bokeh' },
  { id: 'M', label: 'Macro', description: 'Extreme close-up detail and magnification' },
  { id: 'T', label: 'Telephoto', description: 'Long focal length for distant subjects' },
] as const;

export type LensStyleFilterId = typeof lensStyleFilters[number]['id'];

// Lens data populated with actual lens images
export const lensCollection: LensData[] = [
  // Anamorphic lenses (A)
  { id: '20mm-a', name: '20mm Anamorphic', imagePath: '/lenses/20mm-a.png', styleSuffix: 'A', promptValue: '20mm anamorphic lens', tooltip: 'Ultra wide anamorphic for dramatic perspectives' },
  { id: '40mm-a', name: '40mm Anamorphic', imagePath: '/lenses/40mm-a.png', styleSuffix: 'A', promptValue: '40mm anamorphic lens', tooltip: 'Classic anamorphic standard focal length' },
  { id: '50mm-a', name: '50mm Anamorphic', imagePath: '/lenses/50mm-a.png', styleSuffix: 'A', promptValue: '50mm anamorphic lens', tooltip: 'Versatile anamorphic with natural field of view' },
  { id: '75mm-a', name: '75mm Anamorphic', imagePath: '/lenses/75mm-a.png', styleSuffix: 'A', promptValue: '75mm anamorphic lens', tooltip: 'Portrait-friendly anamorphic focal length' },
  { id: '85mm-a', name: '85mm Anamorphic', imagePath: '/lenses/85mm-a.png', styleSuffix: 'A', promptValue: '85mm anamorphic lens', tooltip: 'Classic portrait anamorphic' },
  { id: '100mm-a', name: '100mm Anamorphic', imagePath: '/lenses/100mm-a.png', styleSuffix: 'A', promptValue: '100mm anamorphic lens', tooltip: 'Tight anamorphic for compressed backgrounds' },
  { id: '135mm-a', name: '135mm Anamorphic', imagePath: '/lenses/135mm-a.png', styleSuffix: 'A', promptValue: '135mm anamorphic lens', tooltip: 'Telephoto anamorphic for cinematic compression' },
  { id: '150mm-a', name: '150mm Anamorphic', imagePath: '/lenses/150mm-a.png', styleSuffix: 'A', promptValue: '150mm anamorphic lens', tooltip: 'Long anamorphic for dramatic isolation' },
  { id: '200mm-a', name: '200mm Anamorphic', imagePath: '/lenses/200mm-a.png', styleSuffix: 'A', promptValue: '200mm anamorphic lens', tooltip: 'Super telephoto anamorphic' },

  // Spherical lenses (S)
  { id: '35mm-s', name: '35mm Standard', imagePath: '/lenses/35mmstandard-s.png', styleSuffix: 'S', promptValue: '35mm spherical lens', tooltip: 'Classic standard spherical lens' },
  { id: '50mm-s', name: '50mm Spherical', imagePath: '/lenses/50mm-s.png', styleSuffix: 'S', promptValue: '50mm spherical lens', tooltip: 'Nifty fifty - versatile standard lens' },

  // Both Anamorphic and Spherical (AS)
  { id: '6mm-fisheye', name: '6mm Fisheye', imagePath: '/lenses/6mmfisheye-as.png', styleSuffix: 'AS', promptValue: '6mm fisheye lens', tooltip: 'Extreme fisheye for creative distortion' },
  { id: '8mm-fisheye', name: '8mm Fisheye', imagePath: '/lenses/8mmfisheye-as.png', styleSuffix: 'AS', promptValue: '8mm fisheye lens', tooltip: 'Wide fisheye with barrel distortion' },
  { id: '14mm-ultrawide', name: '14mm Ultra Wide', imagePath: '/lenses/14mmultrawide-as.png', styleSuffix: 'AS', promptValue: '14mm ultra wide lens', tooltip: 'Ultra wide angle for expansive scenes' },

  // Macro lenses (M)
  { id: '35mm-m', name: '35mm Macro', imagePath: '/lenses/35mm-m.png', styleSuffix: 'M', promptValue: '35mm macro lens', tooltip: 'Wide angle macro for environmental close-ups' },
  { id: '60mm-m', name: '60mm Macro', imagePath: '/lenses/60mm-m.png', styleSuffix: 'M', promptValue: '60mm macro lens', tooltip: 'Standard macro for detailed close-ups' },
  { id: '100mm-m', name: '100mm Macro', imagePath: '/lenses/100mm-m.png', styleSuffix: 'M', promptValue: '100mm macro lens', tooltip: 'Classic macro for 1:1 reproduction' },
  { id: '150mm-m', name: '150mm Macro', imagePath: '/lenses/150mm-m.png', styleSuffix: 'M', promptValue: '150mm macro lens', tooltip: 'Long macro for working distance' },

  // Telephoto lenses (T)
  { id: '400mm-t', name: '400mm Telephoto', imagePath: '/lenses/400mm-t.png', styleSuffix: 'T', promptValue: '400mm super telephoto lens', tooltip: 'Super telephoto for wildlife and sports' },
];

interface LensSelectorProps {
  selectedLensId: string | null;
  selectedStyle: LensStyleFilterId | null;
  onSelectLens: (lensId: string | null) => void;
  onSelectStyle: (style: LensStyleFilterId | null) => void;
  lenses?: LensData[];
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export function LensSelector({
  selectedLensId,
  selectedStyle,
  onSelectLens,
  onSelectStyle,
  lenses = lensCollection,
  isExpanded,
  onExpandedChange,
}: LensSelectorProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter lenses based on selected style
  const filteredLenses = useMemo(() => {
    if (!selectedStyle) return lenses;

    return lenses.filter((lens) => {
      if (lens.styleSuffix === 'AS') {
        return selectedStyle === 'A' || selectedStyle === 'S';
      }
      return lens.styleSuffix === selectedStyle;
    });
  }, [lenses, selectedStyle]);

  // Reset index when filter changes, default to preferred lens based on style
  useEffect(() => {
    let defaultIndex = 0;
    if (selectedStyle === 'M') {
      // For Macro, default to 60mm
      const index60mm = filteredLenses.findIndex(lens => lens.id.includes('60mm'));
      defaultIndex = index60mm >= 0 ? index60mm : 0;
    } else {
      // For other styles, default to 50mm if available
      const index50mm = filteredLenses.findIndex(lens => lens.id.includes('50mm'));
      defaultIndex = index50mm >= 0 ? index50mm : 0;
    }
    setFocusedIndex(defaultIndex);
  }, [selectedStyle, filteredLenses]);

  // Scroll to focused lens
  useEffect(() => {
    if (scrollContainerRef.current && filteredLenses.length > 0) {
      const container = scrollContainerRef.current;

      // Use requestAnimationFrame to ensure DOM is rendered
      requestAnimationFrame(() => {
        const lensElements = container.querySelectorAll('button');
        const focusedElement = lensElements[focusedIndex];

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
  }, [focusedIndex, filteredLenses.length, selectedStyle]);

  const handlePrevious = () => {
    setFocusedIndex((prev) =>
      prev <= 0 ? filteredLenses.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setFocusedIndex((prev) =>
      prev >= filteredLenses.length - 1 ? 0 : prev + 1
    );
  };

  const handleLensClick = (index: number, lensId: string) => {
    if (focusedIndex === index) {
      // Toggle selection if already focused
      if (selectedLensId === lensId) {
        onSelectLens(null);
      } else {
        onSelectLens(lensId);
        // Close the entire lens section after selection
        onSelectStyle(null);
        onExpandedChange(false);
      }
    } else {
      // First click focuses, select immediately too for better UX
      setFocusedIndex(index);
      onSelectLens(lensId);
      // Close the entire lens section after selection
      onSelectStyle(null);
      onExpandedChange(false);
    }
  };

  const handleStyleClick = (styleId: LensStyleFilterId) => {
    if (selectedStyle === styleId) {
      onSelectStyle(null);
    } else {
      onSelectStyle(styleId);
    }
    onSelectLens(null);
  };

  // Handle clicking on the selected lens display to re-open
  const handleSelectedLensClick = () => {
    if (selectedLens) {
      // Find the style suffix of the selected lens
      const lensStyleSuffix = selectedLens.styleSuffix;
      // Map AS to A (or could be S, defaulting to A)
      const styleToSelect = lensStyleSuffix === 'AS' ? 'A' : lensStyleSuffix;
      onSelectStyle(styleToSelect as LensStyleFilterId);

      // Find the index of the selected lens in the filtered list
      const lensesForStyle = lenses.filter((lens) => {
        if (lens.styleSuffix === 'AS') {
          return styleToSelect === 'A' || styleToSelect === 'S';
        }
        return lens.styleSuffix === styleToSelect;
      });
      const selectedIndex = lensesForStyle.findIndex(l => l.id === selectedLensId);
      if (selectedIndex >= 0) {
        setFocusedIndex(selectedIndex);
      }
    }
  };

  const focusedLens = filteredLenses[focusedIndex];

  // Get the selected lens data for display when carousel is closed
  const selectedLens = selectedLensId ? lenses.find(l => l.id === selectedLensId) : null;

  return (
    <div className="space-y-4">
      {/* Instruction text */}
      <p className="text-xs text-amber-500/60 font-medium italic">
        Select a LENS STYLE to see available lenses. No minimum selection required.
      </p>

      {/* Style Filter Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Lens Style
        </span>
        <div className="flex flex-wrap gap-2">
          {lensStyleFilters.map((style) => (
            <Tooltip key={style.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleStyleClick(style.id)}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
                    'hover:border-green-400/40 hover:bg-green-400/5 hover:shadow-sm',
                    selectedStyle === style.id
                      ? 'border-green-400/60 bg-green-400/10 text-green-400 font-medium shadow-sm'
                      : 'border-border/60 bg-card text-green-400/60'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {selectedStyle === style.id && <Check className="w-3.5 h-3.5" />}
                    {style.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{style.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Selected Lens Display (when carousel is closed) */}
      {selectedLens && !selectedStyle && (
        <button
          onClick={handleSelectedLensClick}
          className="w-full p-3 rounded-lg bg-primary/5 border border-primary/30 text-left hover:bg-primary/10 transition-colors"
        >
          <p className="text-sm font-medium text-primary">
            {selectedLens.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedLens.tooltip}
          </p>
        </button>
      )}

      {/* Filmstrip Lens Carousel */}
      {selectedStyle && filteredLenses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Select Lens
            </span>
            <span className="text-xs text-muted-foreground">
              {focusedIndex + 1} / {filteredLenses.length}
            </span>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={handlePrevious}
              disabled={filteredLenses.length <= 1}
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
              disabled={filteredLenses.length <= 1}
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
                {filteredLenses.map((lens, index) => {
                  const isSelected = selectedLensId === lens.id;
                  const isFocused = focusedIndex === index;
                  const distance = Math.abs(index - focusedIndex);

                  return (
                    <Tooltip key={lens.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleLensClick(index, lens.id)}
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
                          {/* Lens Image Container */}
                          <div className={cn(
                            'relative bg-gradient-to-b from-muted/30 to-muted/60 p-2',
                            'flex items-center justify-center h-20'
                          )}>
                            <img
                              src={lens.imagePath}
                              alt={lens.name}
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

                          {/* Lens Name */}
                          <div className={cn(
                            'px-1.5 py-1.5 text-center',
                            'bg-card/90 backdrop-blur-sm',
                            isSelected ? 'bg-primary/10' : ''
                          )}>
                            <span className={cn(
                              'text-[10px] font-medium leading-tight block truncate',
                              isSelected ? 'text-primary' : 'text-foreground'
                            )}>
                              {lens.name.replace(' Anamorphic', '').replace(' Spherical', '').replace(' Macro', '').replace(' Telephoto', '')}
                            </span>
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <p className="font-medium">{lens.name}</p>
                        <p className="text-xs text-muted-foreground">{lens.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Focus indicator dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {filteredLenses.map((lens, index) => (
                <button
                  key={lens.id}
                  onClick={() => setFocusedIndex(index)}
                  className={cn(
                    'transition-all duration-200',
                    focusedIndex === index
                      ? 'w-6 h-1.5 rounded-full bg-primary'
                      : selectedLensId === lens.id
                      ? 'w-1.5 h-1.5 rounded-full bg-primary/60'
                      : 'w-1.5 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Selected Lens Info */}
          {focusedLens && (
            <div className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              'bg-muted/30 border border-border/40',
              selectedLensId === focusedLens.id && 'bg-primary/5 border-primary/30'
            )}>
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  selectedLensId === focusedLens.id ? 'text-primary' : 'text-foreground'
                )}>
                  {focusedLens.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {focusedLens.tooltip}
                </p>
              </div>
              {selectedLensId === focusedLens.id ? (
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

      {/* No lenses message */}
      {selectedStyle && filteredLenses.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No lenses available for this style
        </div>
      )}
    </div>
  );
}
