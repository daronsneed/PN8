import { allCategories } from './prompt-builder-data';
import { lensCollection } from '@/components/prompt-builder/LensSelector';
import { cameraCollection } from '@/components/prompt-builder/CameraSelector';
import type { Subject } from '@/components/prompt-builder/SubjectActionSelector';

interface ParsedPromptResult {
  selections: Record<string, string[]>;
  customValues: Record<string, string[]>;
  matchedLensId: string | null;
  matchedCameraId: string | null;
  subjects: Subject[];
  unmatchedText: string;
}

/**
 * Parse a prompt text and try to match it against known options
 */
export function parsePromptText(text: string): ParsedPromptResult {
  const lowerText = text.toLowerCase();
  const selections: Record<string, string[]> = {};
  const customValues: Record<string, string[]> = {};
  let matchedLensId: string | null = null;
  let matchedCameraId: string | null = null;
  const subjects: Subject[] = [];

  // Helper to check if a phrase exists in the text - prioritize exact matches
  const findMatch = (promptValue: string): boolean => {
    const lowerPromptValue = promptValue.toLowerCase();
    // Only match if the exact phrase is found
    return lowerText.includes(lowerPromptValue);
  };

  // Parse [Subjects] and [Actions] sections
  const subjectsMatch = text.match(/\[Subjects\]([\s\S]*?)(?=\[Actions]|\[Details]|\[Environment]|\[Lighting]|\[Consistency]|$)/i);
  const actionsMatch = text.match(/\[Actions\]([\s\S]*?)(?=\[Details]|\[Environment]|\[Lighting]|\[Consistency]|$)/i);

  if (subjectsMatch) {
    const subjectsContent = subjectsMatch[1];

    // Parse Primary subject
    const primaryMatch = subjectsContent.match(/\[Primary:\]\s*([^[]*?)(?=\[Secondary:]|$)/i);
    // Parse Secondary subject
    const secondaryMatch = subjectsContent.match(/\[Secondary:\]\s*([^[]*?)$/i);

    // Parse actions
    let primaryAction = '';
    let secondaryAction = '';
    if (actionsMatch) {
      const actionsContent = actionsMatch[1];
      const primaryActionMatch = actionsContent.match(/\[Primary:\]\s*([^[]*?)(?=\[Secondary:]|$)/i);
      const secondaryActionMatch = actionsContent.match(/\[Secondary:\]\s*([^[]*?)$/i);

      if (primaryActionMatch) {
        primaryAction = primaryActionMatch[1].trim();
      }
      if (secondaryActionMatch) {
        secondaryAction = secondaryActionMatch[1].trim();
      }
    }

    if (primaryMatch) {
      const primaryContent = primaryMatch[1].trim();
      // Parse name, age, appearance from comma-separated content
      const parts = primaryContent.split(',').map(p => p.trim());
      subjects.push({
        id: `subject-parsed-1`,
        name: parts[0] || '',
        age: parts[1] || '',
        appearance: parts.slice(2).join(', '),
        action: primaryAction,
      });
    }

    if (secondaryMatch) {
      const secondaryContent = secondaryMatch[1].trim();
      const parts = secondaryContent.split(',').map(p => p.trim());
      subjects.push({
        id: `subject-parsed-2`,
        name: parts[0] || '',
        age: parts[1] || '',
        appearance: parts.slice(2).join(', '),
        action: secondaryAction,
      });
    }
  }

  // Extract bracketed sections like [Details], [Environment], [Lighting], [Camera/Lens]
  // Map bracket labels to category IDs
  const bracketToCategoryMap: Record<string, string> = {
    'details': 'wardrobe',
    'environment': 'environment',
    'lighting': 'lighting',
    'camera/lens': 'camera', // We'll handle this specially
  };

  // Parse bracketed sections
  const bracketRegex = /\[([^\]]+)\]\s*([^[]*?)(?=\[|$)/gi;
  let match;
  while ((match = bracketRegex.exec(text)) !== null) {
    const bracketLabel = match[1].toLowerCase().trim();
    const content = match[2].trim();

    // Skip subjects/actions/primary/secondary - already handled
    if (['subjects', 'actions', 'primary:', 'secondary:'].includes(bracketLabel)) continue;

    if (content) {
      const categoryId = bracketToCategoryMap[bracketLabel];
      if (categoryId && categoryId !== 'camera') {
        // For text-only categories, store as custom values
        const category = allCategories.find(c => c.id === categoryId);
        if (category?.textOnly) {
          customValues[categoryId] = [content];
        }
      }
    }
  }

  // Match against all categories with predefined options
  for (const category of allCategories) {
    // Skip text-only categories that we've already handled via brackets
    if (category.textOnly && customValues[category.id]) continue;

    // For text-only categories without bracket matches, skip
    if (category.textOnly) continue;

    const matchedIds: string[] = [];

    for (const option of category.options) {
      if (findMatch(option.promptValue)) {
        matchedIds.push(option.id);
      }
    }

    if (matchedIds.length > 0) {
      // Respect category rules
      if (category.allowMultiple || category.allowOnePerGroup) {
        selections[category.id] = matchedIds;
      } else {
        // Only keep the first match for single-select categories
        selections[category.id] = [matchedIds[0]];
      }
    }
  }

  // Match lenses
  for (const lens of lensCollection) {
    if (findMatch(lens.promptValue) || findMatch(lens.name)) {
      matchedLensId = lens.id;
      break; // Only one lens can be selected
    }
  }

  // Match cameras
  for (const camera of cameraCollection) {
    if (findMatch(camera.promptValue) || findMatch(camera.name)) {
      matchedCameraId = camera.id;
      break; // Only one camera can be selected
    }
  }

  // Calculate unmatched text (everything not matched)
  const unmatchedText = text;
  // This is simplified - in reality we'd want to track exact positions
  // For now, just return the original text as "unmatched" context

  return {
    selections,
    customValues,
    matchedLensId,
    matchedCameraId,
    subjects,
    unmatchedText,
  };
}

/**
 * Get a summary of what was matched
 */
export function getMatchSummary(result: ParsedPromptResult): string[] {
  const summaries: string[] = [];

  // Add custom values (text-only fields)
  for (const [categoryId, values] of Object.entries(result.customValues)) {
    const category = allCategories.find(c => c.id === categoryId);
    if (category && values.length > 0) {
      const truncated = values[0].length > 30 ? values[0].substring(0, 30) + '...' : values[0];
      summaries.push(`${category.label}: "${truncated}"`);
    }
  }

  for (const [categoryId, ids] of Object.entries(result.selections)) {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) continue;

    const matchedLabels = ids.map(id => {
      const option = category.options.find(o => o.id === id);
      return option?.label || id;
    });

    if (matchedLabels.length > 0) {
      summaries.push(`${category.label}: ${matchedLabels.join(', ')}`);
    }
  }

  if (result.matchedLensId) {
    const lens = lensCollection.find(l => l.id === result.matchedLensId);
    if (lens) {
      summaries.push(`Lens: ${lens.name}`);
    }
  }

  if (result.matchedCameraId) {
    const camera = cameraCollection.find(c => c.id === result.matchedCameraId);
    if (camera) {
      summaries.push(`Camera: ${camera.name}`);
    }
  }

  return summaries;
}
