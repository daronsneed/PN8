import { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { OptionSelector } from './OptionSelector';
import type { PromptCategory } from '@/lib/prompt-builder-data';

interface CategorySectionProps {
  category: PromptCategory;
  selected: string[];
  onSelect: (ids: string[]) => void;
  customValues?: string[];
  onCustomValuesChange?: (values: string[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  onDone?: () => void;
  showGroupInTooltip?: boolean;
}

export function CategorySection({
  category,
  selected,
  onSelect,
  customValues = [],
  onCustomValuesChange,
  isOpen,
  onOpenChange,
  icon,
  onDone,
  showGroupInTooltip = false,
}: CategorySectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasSelection = selected.length > 0 || customValues.length > 0;

  // Scroll when section opens - higher for lighting (large content), center for others
  useEffect(() => {
    if (isOpen && sectionRef.current) {
      setTimeout(() => {
        if (category.id === 'lighting') {
          // Scroll with offset to show card higher on screen
          const rect = sectionRef.current!.getBoundingClientRect();
          const scrollTop = window.scrollY + rect.top - 100; // 100px from top
          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
        } else {
          sectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
    }
  }, [isOpen, category.id]);

  // Get the display text for selections
  const getSelectionText = (): string => {
    const selectedLabels: string[] = [];

    // Get labels from selected options
    selected.forEach((id) => {
      const option = category.options.find((opt) => opt.id === id);
      if (option) {
        selectedLabels.push(option.label);
      }
    });

    // For custom values, just show "complete" instead of truncated text
    if (customValues.length > 0) {
      selectedLabels.push('complete');
    }

    return selectedLabels.join(', ');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <div ref={sectionRef}>
        <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200',
            'border bg-card hover:bg-muted/50 hover:border-primary/30 hover:shadow-md',
            hasSelection ? 'border-primary/20 shadow-sm' : 'border-border/50',
            isOpen && 'rounded-b-none border-b-transparent'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                hasSelection ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {icon}
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">{category.label}</h3>
              <p className="text-xs text-muted-foreground">
                {category.id === 'finalTouches' ? (
                  <>Instructions of what to <span className="text-red-400/70">AVOID</span> and <span className="text-green-400/60">ENSURE</span></>
                ) : (
                  category.description
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasSelection && (
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium max-w-[150px] truncate">
                {getSelectionText()}
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>
      </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="relative ml-4">
          {/* Connecting line with arrow - vertical line to center, horizontal to content */}
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
          <div
            className={cn(
              'p-4 border border-t-0 rounded-b-xl bg-muted/30',
              hasSelection ? 'border-primary/20' : 'border-border/50'
            )}
          >
            <OptionSelector
              options={category.options}
              selected={selected}
              onSelect={onSelect}
              allowMultiple={category.allowMultiple}
              allowCustom={category.allowCustom}
              customValues={customValues}
              onCustomValuesChange={onCustomValuesChange}
              textOnly={category.textOnly}
              customPlaceholder={category.customPlaceholder}
              onDone={onDone}
              showGroupInTooltip={showGroupInTooltip}
              allowOnePerGroup={category.allowOnePerGroup}
              showDescriptions={category.showDescriptions}
              hintText={category.hintText}
              categoryId={category.id}
              defaultCustomValue={category.defaultCustomValue}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
