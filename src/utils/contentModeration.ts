// Free content moderation using keyword filtering
// This is a basic profanity/explicit content filter

// Feature flag - set to true to enable image moderation
export const IMAGE_MODERATION_ENABLED = false;

const BLOCKED_WORDS = [
  // Profanity - common offensive words
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn', 'crap', 'piss',
  'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut', 'fag', 'nigger',
  'retard', 'spic', 'kike', 'chink', 'wetback',
  // Explicit/Adult content
  'porn', 'xxx', 'nude', 'naked', 'sex', 'penis', 'vagina', 'boobs',
  'tits', 'anal', 'blowjob', 'handjob', 'masturbat', 'orgasm', 'cum',
  // Violence/Threats
  'kill', 'murder', 'rape', 'terrorist', 'bomb', 'suicide',
  // Spam indicators
  'buy now', 'click here', 'free money', 'make money fast', 'casino',
  'viagra', 'cialis', 'lottery', 'winner',
];

// Suspicious image URL patterns (explicit content indicators)
const BLOCKED_IMAGE_PATTERNS = [
  /nsfw/i, /xxx/i, /porn/i, /nude/i, /naked/i, /adult/i,
  /explicit/i, /sex/i, /onlyfans/i, /xvideos/i, /pornhub/i,
  /xhamster/i, /redtube/i, /youporn/i, /brazzers/i, /bangbros/i,
];

// Common character substitutions to bypass filters
const SUBSTITUTIONS: { [key: string]: string[] } = {
  'a': ['@', '4', 'Д'],
  'e': ['3', '€'],
  'i': ['1', '!', '|'],
  'o': ['0', '()'],
  's': ['$', '5'],
  'l': ['1', '|'],
  't': ['7', '+'],
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // Replace common substitutions
  Object.entries(SUBSTITUTIONS).forEach(([letter, subs]) => {
    subs.forEach(sub => {
      normalized = normalized.split(sub.toLowerCase()).join(letter);
    });
  });
  
  // Remove special characters and extra spaces
  normalized = normalized.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
  
  return normalized;
}

export interface ModerationResult {
  isClean: boolean;
  flaggedWords: string[];
  message: string;
}

export function moderateContent(content: string): ModerationResult {
  const normalizedContent = normalizeText(content);
  const flaggedWords: string[] = [];
  
  BLOCKED_WORDS.forEach(word => {
    const wordPattern = new RegExp(`\\b${word}\\b`, 'i');
    if (wordPattern.test(normalizedContent) || normalizedContent.includes(word)) {
      flaggedWords.push(word);
    }
  });
  
  if (flaggedWords.length > 0) {
    return {
      isClean: false,
      flaggedWords,
      message: 'Your content contains inappropriate language. Please revise and try again.',
    };
  }
  
  return {
    isClean: true,
    flaggedWords: [],
    message: '',
  };
}

// Check for suspicious patterns (spam, excessive caps, etc.)
export function checkForSpam(content: string): { isSpam: boolean; reason: string } {
  // Check for excessive caps (more than 50% uppercase)
  const letters = content.replace(/[^a-zA-Z]/g, '');
  const upperCount = (content.match(/[A-Z]/g) || []).length;
  if (letters.length > 20 && upperCount / letters.length > 0.5) {
    return { isSpam: true, reason: 'Excessive use of capital letters' };
  }
  
  // Check for excessive repeated characters
  if (/(.)\1{4,}/.test(content)) {
    return { isSpam: true, reason: 'Excessive repeated characters' };
  }
  
  // Check for too many links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) {
    return { isSpam: true, reason: 'Too many links in content' };
  }
  
  return { isSpam: false, reason: '' };
}

// Check image URLs for explicit content indicators
export function checkImageUrl(url: string): { isSafe: boolean; reason: string } {
  if (!IMAGE_MODERATION_ENABLED) {
    return { isSafe: true, reason: '' };
  }
  
  const normalizedUrl = url.toLowerCase();
  
  for (const pattern of BLOCKED_IMAGE_PATTERNS) {
    if (pattern.test(normalizedUrl)) {
      return { 
        isSafe: false, 
        reason: 'Image URL contains potentially inappropriate content indicators' 
      };
    }
  }
  
  return { isSafe: true, reason: '' };
}

// Moderate uploaded images (returns moderation status)
// This is a placeholder for future AI-based image moderation
// Currently uses URL pattern checking only
export function moderateImage(imageUrl: string): {
  passed: boolean;
  requiresReview: boolean;
  reason: string;
} {
  if (!IMAGE_MODERATION_ENABLED) {
    return { passed: true, requiresReview: false, reason: '' };
  }
  
  const urlCheck = checkImageUrl(imageUrl);
  if (!urlCheck.isSafe) {
    return { 
      passed: false, 
      requiresReview: false, 
      reason: urlCheck.reason 
    };
  }
  
  // For now, all images pass URL check but could be flagged for manual review
  // Future: integrate with free browser-based NSFW detection
  return { passed: true, requiresReview: false, reason: '' };
}

// Combined moderation check
export function fullContentCheck(content: string, imageUrls: string[] = []): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  const moderation = moderateContent(content);
  if (!moderation.isClean) {
    issues.push(moderation.message);
  }
  
  const spam = checkForSpam(content);
  if (spam.isSpam) {
    issues.push(spam.reason);
  }
  
  // Check image URLs if moderation is enabled
  if (IMAGE_MODERATION_ENABLED && imageUrls.length > 0) {
    for (const url of imageUrls) {
      const imageCheck = moderateImage(url);
      if (!imageCheck.passed) {
        issues.push(imageCheck.reason);
        break;
      }
    }
  }
  
  return {
    passed: issues.length === 0,
    issues,
  };
}