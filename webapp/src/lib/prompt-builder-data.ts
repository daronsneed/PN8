// Prompt Builder Data - All options for AI image generation prompts

export interface PromptOption {
  id: string;
  label: string;
  promptValue: string;
  group?: string;
  tooltip?: string;
  image?: string;
}

export interface PromptCategory {
  id: string;
  label: string;
  description: string;
  options: PromptOption[];
  allowMultiple?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
  textOnly?: boolean;
  allowOnePerGroup?: boolean;
  showDescriptions?: boolean;
  hintText?: string;
  defaultCustomValue?: string;
}

// Camera Types
export const cameraTypes: PromptOption[] = [
  { id: 'dslr', label: 'DSLR', promptValue: 'professional DSLR camera' },
  { id: 'mirrorless', label: 'Mirrorless', promptValue: 'mirrorless camera' },
  { id: 'medium-format', label: 'Medium Format', promptValue: 'medium format camera' },
  { id: 'large-format', label: 'Large Format 4x5', promptValue: 'large format 4x5 camera' },
  { id: 'hasselblad', label: 'Hasselblad', promptValue: 'Hasselblad' },
  { id: 'leica', label: 'Leica', promptValue: 'Leica' },
  { id: 'canon-5d', label: 'Canon 5D Mark IV', promptValue: 'Canon 5D Mark IV' },
  { id: 'sony-a7', label: 'Sony A7R IV', promptValue: 'Sony A7R IV' },
  { id: 'nikon-z9', label: 'Nikon Z9', promptValue: 'Nikon Z9' },
  { id: 'red-cinema', label: 'RED Cinema Camera', promptValue: 'RED cinema camera' },
  { id: 'arri-alexa', label: 'ARRI Alexa', promptValue: 'ARRI Alexa' },
  { id: 'polaroid', label: 'Polaroid', promptValue: 'Polaroid instant photo' },
  { id: 'disposable', label: 'Disposable Camera', promptValue: 'disposable camera aesthetic' },
  { id: 'iphone', label: 'iPhone Pro', promptValue: 'iPhone Pro' },
];

// Genre Options (Cinematic / Photorealistic)
export const genreOptions: PromptOption[] = [
  { id: 'cinematic', label: 'Cinematic', promptValue: 'cinematic' },
  { id: 'photorealistic', label: 'Photorealistic', promptValue: 'photorealistic' },
  { id: 'ultra-realistic', label: 'Ultra-Realistic', promptValue: 'ultra-realistic' },
];

// Film Stock Types
export const filmStocks: PromptOption[] = [
  { id: 'kodak-portra-400', label: 'Kodak Portra 400', promptValue: 'Kodak Portra 400 film' },
  { id: 'kodak-portra-800', label: 'Kodak Portra 800', promptValue: 'Kodak Portra 800 film' },
  { id: 'kodak-ektar-100', label: 'Kodak Ektar 100', promptValue: 'Kodak Ektar 100 film' },
  { id: 'kodak-gold-200', label: 'Kodak Gold 200', promptValue: 'Kodak Gold 200 film' },
  { id: 'kodak-tri-x', label: 'Kodak Tri-X 400', promptValue: 'Kodak Tri-X 400 black and white film' },
  { id: 'fuji-pro-400h', label: 'Fuji Pro 400H', promptValue: 'Fuji Pro 400H film' },
  { id: 'fuji-superia', label: 'Fuji Superia', promptValue: 'Fuji Superia film' },
  { id: 'fuji-velvia', label: 'Fuji Velvia 50', promptValue: 'Fuji Velvia 50 slide film' },
  { id: 'ilford-hp5', label: 'Ilford HP5 Plus', promptValue: 'Ilford HP5 Plus black and white film' },
  { id: 'ilford-delta', label: 'Ilford Delta 3200', promptValue: 'Ilford Delta 3200 high grain black and white film' },
  { id: 'cinestill-800t', label: 'CineStill 800T', promptValue: 'CineStill 800T tungsten film with halation' },
  { id: 'cinestill-50d', label: 'CineStill 50D', promptValue: 'CineStill 50D daylight film' },
  { id: 'lomography', label: 'Lomography', promptValue: 'Lomography film aesthetic with vignette and light leaks' },
];

// ISO Settings
export const isoSettings: PromptOption[] = [
  // Low (Bright)
  { id: 'iso-100', label: '100', promptValue: 'ISO 100', group: 'Low (for bright scenes)' },
  { id: 'iso-200', label: '200', promptValue: 'ISO 200', group: 'Low (for bright scenes)' },
  { id: 'iso-300', label: '300', promptValue: 'ISO 300', group: 'Low (for bright scenes)' },
  { id: 'iso-400-low', label: '400', promptValue: 'ISO 400', group: 'Low (for bright scenes)' },
  // Medium (Indoor)
  { id: 'iso-400', label: '400', promptValue: 'ISO 400', group: 'Medium (best for indoors)' },
  { id: 'iso-500', label: '500', promptValue: 'ISO 500', group: 'Medium (best for indoors)' },
  { id: 'iso-600', label: '600', promptValue: 'ISO 600', group: 'Medium (best for indoors)' },
  { id: 'iso-700', label: '700', promptValue: 'ISO 700', group: 'Medium (best for indoors)' },
  { id: 'iso-800', label: '800', promptValue: 'ISO 800', group: 'Medium (best for indoors)' },
  { id: 'iso-900', label: '900', promptValue: 'ISO 900', group: 'Medium (best for indoors)' },
  { id: 'iso-1000', label: '1000', promptValue: 'ISO 1000', group: 'Medium (best for indoors)' },
  { id: 'iso-1100', label: '1100', promptValue: 'ISO 1100', group: 'Medium (best for indoors)' },
  { id: 'iso-1200', label: '1200', promptValue: 'ISO 1200', group: 'Medium (best for indoors)' },
  { id: 'iso-1300', label: '1300', promptValue: 'ISO 1300', group: 'Medium (best for indoors)' },
  { id: 'iso-1400', label: '1400', promptValue: 'ISO 1400', group: 'Medium (best for indoors)' },
  { id: 'iso-1500', label: '1500', promptValue: 'ISO 1500', group: 'Medium (best for indoors)' },
  { id: 'iso-1600-med', label: '1600', promptValue: 'ISO 1600', group: 'Medium (best for indoors)' },
  // High (Low Light)
  { id: 'iso-1600', label: '1600', promptValue: 'ISO 1600', group: 'High (special use settings)' },
  { id: 'iso-1700', label: '1700', promptValue: 'ISO 1700', group: 'High (special use settings)' },
  { id: 'iso-1800', label: '1800', promptValue: 'ISO 1800', group: 'High (special use settings)' },
  { id: 'iso-1900', label: '1900', promptValue: 'ISO 1900', group: 'High (special use settings)' },
  { id: 'iso-2000', label: '2000', promptValue: 'ISO 2000', group: 'High (special use settings)' },
];

// Aperture Settings
export const apertureSettings: PromptOption[] = [
  { id: 'f1.2', label: 'f/1.2', promptValue: 'f/1.2 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f1.4', label: 'f/1.4', promptValue: 'f/1.4 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f1.8', label: 'f/1.8', promptValue: 'f/1.8 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f2.8', label: 'f/2.8', promptValue: 'f/2.8 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f4', label: 'f/4', promptValue: 'f/4 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f5.6', label: 'f/5.6', promptValue: 'f/5.6 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f8', label: 'f/8', promptValue: 'f/8 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f11', label: 'f/11', promptValue: 'f/11 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f16', label: 'f/16', promptValue: 'f/16 aperture', group: 'Lower f-stop increases Depth of Field' },
  { id: 'f22', label: 'f/22', promptValue: 'f/22 aperture', group: 'Lower f-stop increases Depth of Field' },
];

// Shutter Speed
export const shutterSpeeds: PromptOption[] = [
  // Standard Shutter Speeds (Natural Look)
  { id: '1-125', label: '1/125s', promptValue: '1/125 shutter speed', group: 'Standard (Natural Look)' },
  { id: '1-60', label: '1/60s', promptValue: '1/60 shutter speed', group: 'Standard (Natural Look)' },
  { id: '1-30', label: '1/30s', promptValue: '1/30 shutter speed', group: 'Standard (Natural Look)' },
  // Slow Shutter Speeds (Long Exposure)
  { id: '1-15', label: '1/15s', promptValue: '1/15 shutter speed', group: 'Slow (Long Exposure)' },
  { id: '1-8', label: '1/8s', promptValue: '1/8 shutter speed', group: 'Slow (Long Exposure)' },
  { id: '0.5s', label: '0.5s', promptValue: '0.5 second exposure', group: 'Slow (Long Exposure)' },
  { id: '1s', label: '1s', promptValue: '1 second exposure', group: 'Slow (Long Exposure)' },
  { id: '5s', label: '5s', promptValue: '5 second exposure', group: 'Slow (Long Exposure)' },
  // Fast Shutter Speeds (Freeze Motion)
  { id: '1-250', label: '1/250s', promptValue: '1/250 shutter speed', group: 'Fast (Freeze Motion)' },
  { id: '1-500', label: '1/500s', promptValue: '1/500 shutter speed', group: 'Fast (Freeze Motion)' },
  { id: '1-1000', label: '1/1000s', promptValue: '1/1000 shutter speed', group: 'Fast (Freeze Motion)' },
  { id: '1-2000', label: '1/2000s', promptValue: '1/2000 shutter speed', group: 'Fast (Freeze Motion)' },
  { id: '1-4000', label: '1/4000s', promptValue: '1/4000 shutter speed', group: 'Fast (Freeze Motion)' },
];

// Camera Angles / Shot Types - Organized by HEIGHT, VIEW, SIZE
export const cameraAngles: PromptOption[] = [
  // HEIGHT
  { id: 'height-eye', label: 'Eye', promptValue: 'Eye-level', group: 'Height', tooltip: 'Camera at eye level with subject' },
  { id: 'height-high', label: 'High', promptValue: 'High-angle', group: 'Height', tooltip: 'Camera above subject looking down' },
  { id: 'height-low', label: 'Low', promptValue: 'Low-angle', group: 'Height', tooltip: 'Camera below subject looking up' },
  { id: 'height-worm', label: 'Worm', promptValue: "Worm's eye-view", group: 'Height', tooltip: 'Extreme low angle from ground level' },
  { id: 'height-top', label: 'Top', promptValue: 'Top-down-view', group: 'Height', tooltip: 'Camera directly above looking straight down' },
  { id: 'height-aerial', label: 'Aerial', promptValue: 'Aerial view', group: 'Height', tooltip: 'High altitude from above' },

  // VIEW
  { id: 'view-front', label: 'Front', promptValue: 'from the front', group: 'View', tooltip: 'Subject facing directly at camera' },
  { id: 'view-side', label: 'Side', promptValue: 'from the side', group: 'View', tooltip: 'Profile from the side' },
  { id: 'view-three-quarter', label: '¾', promptValue: 'three quarters', group: 'View', tooltip: 'Subject angled 45 degrees to camera' },
  { id: 'view-ots', label: 'OTS', promptValue: 'over-the-shoulder', group: 'View', tooltip: 'Camera behind one person looking at another' },
  { id: 'view-rear', label: 'Rear', promptValue: 'from the rear', group: 'View', tooltip: 'From behind the subject' },
  { id: 'view-dutch', label: 'Dutch', promptValue: 'Dutch angle', group: 'View', tooltip: 'Camera tilted creating unease or tension' },

  // SIZE
  { id: 'size-xwide', label: 'Xwide', promptValue: 'extreme wide shot,', group: 'Size', tooltip: 'Vast scene where subject may be barely visible' },
  { id: 'size-wide', label: 'Wide', promptValue: 'wide shot,', group: 'Size', tooltip: 'Full body visible with environment' },
  { id: 'size-medium', label: 'Medium', promptValue: 'medium shot,', group: 'Size', tooltip: 'Subject from waist up' },
  { id: 'size-close', label: 'Close', promptValue: 'closeup shot,', group: 'Size', tooltip: 'Face or specific detail fills frame' },
  { id: 'size-xclose', label: 'Xclose', promptValue: 'extreme closeup,', group: 'Size', tooltip: 'Tight on specific detail like eyes' },
];

// Lens Style Options (Spherical, Anamorphic, Vintage)
export const lensStyleOptions: PromptOption[] = [
  { id: 'spherical', label: 'Spherical', promptValue: 'Spherical' },
  { id: 'anamorphic', label: 'Anamorphic', promptValue: 'Anamorphic' },
  { id: 'vintage', label: 'Vintage', promptValue: 'Vintage' },
];

// Lens Types
export const lensTypes: PromptOption[] = [
  { id: 'fisheye', label: '8mm Fisheye', promptValue: 'on a 8mm fisheye lens' },
  { id: 'ultrawide', label: '14mm Ultra Wide', promptValue: 'on a 14mm lens' },
  { id: 'wide', label: '24mm Wide', promptValue: 'on a 24mm lens' },
  { id: 'standard-35', label: '35mm Standard', promptValue: 'on a 35mm lens' },
  { id: 'standard-50', label: '50mm Nifty Fifty', promptValue: 'on a 50mm lens' },
  { id: 'portrait-85', label: '85mm Portrait', promptValue: 'on a 85mm lens' },
  { id: 'portrait-105', label: '105mm Portrait', promptValue: 'on a 105mm lens' },
  { id: 'tele-135', label: '135mm Telephoto', promptValue: 'on a 135mm lens' },
  { id: 'tele-200', label: '200mm Telephoto', promptValue: 'on a 200mm lens' },
  { id: 'super-tele', label: '400mm Super Telephoto', promptValue: 'on a 400mm lens' },
  { id: 'macro', label: '100mm Macro', promptValue: 'on 100mm lens' },
];

// Subject Actions - Now text-only input
export const subjectActions: PromptOption[] = [];

// Wardrobe/Attire
export const wardrobeOptions: PromptOption[] = [
  { id: 'casual', label: 'Casual', promptValue: 'wearing casual clothes' },
  { id: 'formal', label: 'Formal', promptValue: 'wearing formal attire' },
  { id: 'business', label: 'Business', promptValue: 'wearing business attire' },
  { id: 'streetwear', label: 'Streetwear', promptValue: 'wearing streetwear fashion' },
  { id: 'vintage', label: 'Vintage', promptValue: 'wearing vintage clothing' },
  { id: 'bohemian', label: 'Bohemian', promptValue: 'wearing bohemian style clothing' },
  { id: 'minimalist', label: 'Minimalist', promptValue: 'wearing minimalist clothing' },
  { id: 'athletic', label: 'Athletic', promptValue: 'wearing athletic wear' },
  { id: 'haute-couture', label: 'Haute Couture', promptValue: 'wearing haute couture designer fashion' },
  { id: 'traditional', label: 'Traditional', promptValue: 'wearing traditional cultural attire' },
  { id: 'cyberpunk', label: 'Cyberpunk', promptValue: 'wearing cyberpunk futuristic clothing' },
  { id: 'fantasy', label: 'Fantasy', promptValue: 'wearing fantasy costume' },
  { id: 'uniform', label: 'Uniform', promptValue: 'wearing a uniform' },
  { id: 'layered', label: 'Layered', promptValue: 'wearing layered clothing' },
];

// Environments
export const environments: PromptOption[] = [
  { id: 'studio', label: 'Studio', promptValue: 'in a photography studio' },
  { id: 'urban', label: 'Urban Street', promptValue: 'on urban city street' },
  { id: 'nature', label: 'Nature', promptValue: 'in nature setting' },
  { id: 'forest', label: 'Forest', promptValue: 'in a dense forest' },
  { id: 'beach', label: 'Beach', promptValue: 'on a beach' },
  { id: 'mountain', label: 'Mountain', promptValue: 'in the mountains' },
  { id: 'desert', label: 'Desert', promptValue: 'in the desert' },
  { id: 'industrial', label: 'Industrial', promptValue: 'in industrial setting, abandoned warehouse' },
  { id: 'rooftop', label: 'Rooftop', promptValue: 'on a rooftop' },
  { id: 'cafe', label: 'Café', promptValue: 'in a cozy café' },
  { id: 'office', label: 'Office', promptValue: 'in a modern office' },
  { id: 'home', label: 'Home Interior', promptValue: 'in a home interior' },
  { id: 'garden', label: 'Garden', promptValue: 'in a lush garden' },
  { id: 'underwater', label: 'Underwater', promptValue: 'underwater' },
  { id: 'space', label: 'Space', promptValue: 'in outer space' },
  { id: 'neon-city', label: 'Neon City', promptValue: 'in neon-lit city at night' },
  { id: 'rain', label: 'Rain', promptValue: 'in the rain' },
  { id: 'snow', label: 'Snow', promptValue: 'in snowy landscape' },
];

// Lighting
export const lightingOptions: PromptOption[] = [
  { id: 'dramatic-rim', label: 'Dramatic Rim', promptValue: 'rim lighting emphasizing the edges of the subject', tooltip: 'This is a photography technique that emphasizes the edges of a subject, creating a striking visual effect. This method involves positioning a light source behind or slightly to the side of the subject, which produces a halo or outline effect. This technique is often used to enhance the subject\'s silhouette and add depth to the image.', image: '/rim.png' },
  { id: 'soft-studio', label: 'Soft Studio', promptValue: 'softstudio lighting creating gentle transitions between light and shadow', tooltip: 'This refers to a type of lighting that creates gentle transitions between light and shadow. It minimizes harsh shadows and highlights, resulting in a more flattering appearance for subjects. This lighting is often used in portrait photography to enhance skin tones and reduce the visibility of imperfections.', image: '/softstudio.png' },
  { id: 'cinematic', label: 'Cinematic', promptValue: 'cinematic lighting creating mood depth and focus', tooltip: 'Refers to the use of light in film to create mood, depth, and atmosphere. It goes beyond basic lighting techniques to enhance storytelling and visual appeal. This type of lighting is essential for guiding the audience\'s attention and conveying emotions.', image: '/cinematic.png' },
  { id: 'low-key', label: 'Low-key', promptValue: 'low key lighting producing high contrast between light and shadow', tooltip: '(Dramatic) This is a photography and cinematography technique characterized by high contrast between light and shadow. It emphasizes dark tones and shadows, creating a dramatic and moody atmosphere. This style often uses a single key light source, with minimal fill light, to accentuate the contours of the subject.', image: '/lowkey.png' },
  { id: 'directional', label: 'Directional', promptValue: 'highlight the subject with directional lighting', tooltip: 'This is a type of illumination that focuses light in a specific direction, creating a concentrated beam. This contrasts with diffused lighting, which spreads light evenly across an area. Directional lighting is often used to highlight particular subjects or areas, making it a powerful tool in photography and design.', image: '/directional.png' },
  { id: 'balanced', label: 'Balanced', promptValue: 'balanced lighting creating a harmonious and visually appealing environment', tooltip: 'Refers to the effective combination of different light sources to create a harmonious and visually appealing environment. It is essential in various fields, including photography, film production, and interior design.', image: '/balanced.png' },
  { id: 'backlight', label: 'Backlight', promptValue: 'backlight lighting creating a halo or outline effect', tooltip: 'Backlighting (silhouette) is a lighting technique where the light source is positioned behind the subject, facing the camera. This setup creates a glowing outline around the subject, enhancing its contours and separating it from the background. It is commonly used in photography, film, and theater to add depth and dimension to visuals.', image: '/backlight.png' },
  { id: 'bokeh', label: 'Bokeh Light Effects', promptValue: 'bokeh lighting using quality blurs to enhance the subject', tooltip: 'Bokeh is a photography technique that emphasizes the aesthetic quality of the blur in out-of-focus areas of an image. The term originates from the Japanese word "boke," meaning "blur" or "haze." It is often used to create visually appealing backgrounds that enhance the subject of a photograph.', image: '/bokeh.png' },
  { id: 'colored-gel', label: 'Colored Gel', promptValue: 'gel lighting creating mood', tooltip: 'This lighting technique is used in photography and videography to modify the color of light emitted from a source. This is achieved by placing colored filters, known as gels, in front of the light source. These gels can create various moods, enhance visual storytelling, and correct color temperature.', image: '/gel.png' },
  { id: 'rembrandt', label: 'Rembrandt', promptValue: 'High-contrast Rembrandt lighting', tooltip: 'This lighting is a popular technique used in portrait photography and cinematography. It creates a distinct triangle of light on one side of the subject\'s face, known as the "Rembrandt patch." This effect adds depth and dimension to portraits, making them visually compelling.', image: '/rembrandt.png' },
  { id: 'contre-jour', label: 'Contre-Jour', promptValue: 'contre-jour lighting creating a back light effect', tooltip: 'This means "against daylight" in French. It is a photographic technique where the camera is positioned directly toward a light source, such as the sun. This method creates a backlighting effect that can dramatically alter the appearance of the subject.', image: '/contre-jour.png' },
];

// Final Touches / Style Modifiers
export const finalTouches: PromptOption[] = [
  { id: 'high-detail', label: 'High Detail', promptValue: 'highly detailed, sharp focus' },
  { id: 'cinematic', label: 'Cinematic', promptValue: 'cinematic look, movie still' },
  { id: 'editorial', label: 'Editorial', promptValue: 'editorial photography, magazine quality' },
  { id: 'documentary', label: 'Documentary', promptValue: 'documentary style, candid' },
  { id: 'fine-art', label: 'Fine Art', promptValue: 'fine art photography' },
  { id: 'moody', label: 'Moody', promptValue: 'moody atmosphere, dark tones' },
  { id: 'dreamy', label: 'Dreamy', promptValue: 'dreamy soft aesthetic' },
  { id: 'gritty', label: 'Gritty', promptValue: 'gritty raw aesthetic' },
  { id: 'clean', label: 'Clean', promptValue: 'clean crisp aesthetic' },
  { id: 'vintage-look', label: 'Vintage Look', promptValue: 'vintage aesthetic, retro color grading' },
  { id: 'desaturated', label: 'Desaturated', promptValue: 'desaturated muted colors' },
  { id: 'vibrant', label: 'Vibrant', promptValue: 'vibrant saturated colors' },
  { id: 'contrasty', label: 'High Contrast', promptValue: 'high contrast' },
  { id: 'soft-contrast', label: 'Soft Contrast', promptValue: 'soft low contrast' },
  { id: 'film-grain', label: 'Film Grain', promptValue: 'visible film grain' },
  { id: 'noise-free', label: 'Noise Free', promptValue: 'clean noise-free image' },
  { id: 'vignette', label: 'Vignette', promptValue: 'subtle vignette' },
  { id: 'light-leaks', label: 'Light Leaks', promptValue: 'light leaks and flares' },
  { id: 'award-winning', label: 'Award Winning', promptValue: 'award winning photography' },
  { id: '8k', label: '8K Resolution', promptValue: '8K resolution, ultra high definition' },
];

// All categories for easy iteration
export const allCategories: PromptCategory[] = [
  {
    id: 'style',
    label: 'Genre',
    description: 'Visual style of the image',
    options: genreOptions,
    allowMultiple: true,
  },
  {
    id: 'camera',
    label: 'Type',
    description: 'Type of camera used',
    options: cameraTypes,
    allowCustom: true,
  },
  {
    id: 'angles',
    label: 'Framing',
    description: 'Shot types and camera angles',
    options: cameraAngles,
    allowOnePerGroup: true,
  },
  {
    id: 'lensStyle',
    label: 'Lens Style',
    description: 'Spherical, Anamorphic, or Vintage',
    options: lensStyleOptions,
  },
  {
    id: 'lens',
    label: 'Lens',
    description: 'Focal length and lens type',
    options: lensTypes,
  },
  {
    id: 'filmStock',
    label: 'Film Stock',
    description: 'Film emulation or digital',
    options: filmStocks,
  },
  {
    id: 'iso',
    label: 'ISO',
    description: 'Sensitivity and grain',
    options: isoSettings,
  },
  {
    id: 'aperture',
    label: 'Aperture',
    description: 'Depth of field control',
    options: apertureSettings,
  },
  {
    id: 'shutter',
    label: 'Shutter Speed',
    description: 'Motion and exposure time',
    options: shutterSpeeds,
  },
  {
    id: 'action',
    label: 'Subject(s) / Action(s)',
    description: 'Define who is in the shot and what they are doing',
    options: subjectActions,
    allowCustom: true,
    textOnly: true,
    customPlaceholder: 'WHO is doing WHAT...describe their actions',
    hintText: "Don't write a novel, but be clear and <strong>only mention</strong> what is actually visible in the shot. Also consider using ChatGPT or Grok to help you refine your scene",
  },
  {
    id: 'wardrobe',
    label: 'Wardrobe',
    description: 'Clothing and attire',
    options: wardrobeOptions,
    allowCustom: true,
    textOnly: true,
    customPlaceholder: 'Describe clothing and attire...',
    hintText: 'Be sure to only mention what will be seen in the shot',
  },
  {
    id: 'environment',
    label: 'Environment',
    description: 'Location and setting',
    options: environments,
    allowCustom: true,
    textOnly: true,
    customPlaceholder: "Describe the location and setting and don't forget 'Volumetric Haze'",
  },
  {
    id: 'lighting',
    label: 'Lighting',
    description: 'Light source and style',
    options: lightingOptions,
    showDescriptions: true,
  },
  {
    id: 'finalTouches',
    label: 'Negative Prompts',
    description: 'Instructions of what to AVOID and ENSURE',
    options: finalTouches,
    allowCustom: true,
    textOnly: true,
    customPlaceholder: 'Add additional negative prompts...',
    defaultCustomValue: '[Consistency] Maintain consistent lighting direction, facial proportions, and wardrobe across generations.\n\n[Negative] No extra limbs, no distorted hands, no plastic or waxy skin, no blown highlights, no CGI look, no modern LED lighting, no fantasy elements. Avoid perfectly symmetrical facial features, Natural human facial asymmetry, No over-smoothed skin, no visible AI artifacts, no text or watermarks',
  },
];
