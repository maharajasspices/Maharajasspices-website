/**
 * Password validation and leaked password detection
 * Client-side protection against common/leaked passwords
 */

import { checkLeakedPassword } from './leakedPasswordChecker';

// Keyboard patterns to detect
const KEYBOARD_PATTERNS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1qaz2wsx', 'qweasd', 'qazwsx',
  '1234567890', '0987654321', 'abcdefgh', 'zyxwvuts'
];

export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  isLeaked: boolean;
}

/**
 * Validates password strength and checks for common/leaked passwords
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  let isLeaked = false;

  // Basic requirements
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
    return { isValid: false, score: 0, feedback, isLeaked };
  }

  // Check for leaked/common passwords using our extended checker
  const leakedCheck = checkLeakedPassword(password);
  if (leakedCheck.isLeaked) {
    feedback.push(leakedCheck.reason || 'This password is too common and has been leaked in data breaches');
    isLeaked = true;
    return { isValid: false, score: 0, feedback, isLeaked };
  }

  const lowerPassword = password.toLowerCase();
  // Check for keyboard patterns
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lowerPassword.includes(pattern) || lowerPassword.includes(pattern.split('').reverse().join(''))) {
      feedback.push('Password contains a common keyboard pattern');
      isLeaked = true;
      return { isValid: false, score: 0, feedback, isLeaked };
    }
  }

  // Check for repeated characters (e.g., 'aaaa', '1111')
  if (/(.)\1{3,}/.test(password)) {
    feedback.push('Password contains too many repeated characters');
    return { isValid: false, score: 20, feedback, isLeaked };
  }

  // Check for sequential characters (e.g., 'abcd', '1234')
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    feedback.push('Password contains sequential characters');
    return { isValid: false, score: 25, feedback, isLeaked };
  }

  // Length scoring
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety scoring
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) score += 15;
  if (hasUpper) score += 15;
  if (hasNumber) score += 15;
  if (hasSpecial) score += 15;

  // Require at least 3 character types
  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (varietyCount < 3) {
    feedback.push('Password must contain at least uppercase, lowercase, and numbers');
    return { isValid: false, score, feedback, isLeaked };
  }

  // Check for dictionary words (simple check)
  if (/^[a-zA-Z]+$/.test(password) && password.length < 12) {
    feedback.push('Password appears to be a simple word - add numbers and special characters');
    score -= 10;
  }

  // Final scoring feedback
  if (score >= 80) {
    feedback.push('✓ Strong password');
  } else if (score >= 60) {
    feedback.push('✓ Good password - consider making it longer');
  } else if (score >= 40) {
    feedback.push('⚠ Fair password - add more variety');
  }

  return {
    isValid: score >= 40 && !isLeaked,
    score: Math.min(score, 100),
    feedback,
    isLeaked
  };
}

/**
 * Enhanced bot detection for human verification
 * Multiple checks to ensure legitimate user interaction
 */
export function detectBot(): boolean {
  // Check for headless browser
  if (navigator.webdriver) return true;
  
  // Check for common bot user agents
  const botPattern = /bot|crawler|spider|crawling|headless/i;
  if (botPattern.test(navigator.userAgent)) return true;
  
  // Check for automation tools
  if ((window as any).callPhantom || (window as any)._phantom || (window as any).__nightmare) return true;
  
  // Check for suspicious browser properties
  if (!(window as any).chrome && !(window as any).safari && !/Firefox/.test(navigator.userAgent)) return true;
  
  // Check for plugins (bots usually have none)
  if (navigator.plugins.length === 0) return true;
  
  // Check for languages (bots often have empty array)
  if (!navigator.languages || navigator.languages.length === 0) return true;
  
  return false;
}

/**
 * Advanced human verification without email confirmation
 * Combines multiple signals to determine if user is human
 */
export const verifyHuman = (): { isHuman: boolean; reason?: string } => {
  // Check if bot detected
  if (detectBot()) {
    return { isHuman: false, reason: 'Bot detection failed' };
  }

  // Check for mouse movement (stored by interaction tracker)
  const hasMouseMovement = sessionStorage.getItem('user_mouse_activity');
  if (!hasMouseMovement) {
    return { isHuman: false, reason: 'No mouse activity detected' };
  }

  // Check for keyboard activity
  const hasKeyboardActivity = sessionStorage.getItem('user_keyboard_activity');
  if (!hasKeyboardActivity) {
    return { isHuman: false, reason: 'No keyboard activity detected' };
  }

  // Check session duration (humans take time to interact)
  const sessionStart = sessionStorage.getItem('session_start');
  if (sessionStart) {
    const duration = Date.now() - parseInt(sessionStart);
    if (duration < 5000) { // Less than 5 seconds is suspicious
      return { isHuman: false, reason: 'Session too short' };
    }
  }

  return { isHuman: true };
};

/**
 * Initialize interaction tracking for human verification
 * Call this on app mount to start tracking user interactions
 */
export const initInteractionTracking = () => {
  // Set session start time
  if (!sessionStorage.getItem('session_start')) {
    sessionStorage.setItem('session_start', Date.now().toString());
  }

  // Track mouse movement
  let mouseMoveTimeout: ReturnType<typeof setTimeout>;
  const trackMouseMove = () => {
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
      sessionStorage.setItem('user_mouse_activity', 'true');
    }, 100);
  };

  // Track keyboard activity
  let keyboardTimeout: ReturnType<typeof setTimeout>;
  const trackKeyboard = () => {
    clearTimeout(keyboardTimeout);
    keyboardTimeout = setTimeout(() => {
      sessionStorage.setItem('user_keyboard_activity', 'true');
    }, 100);
  };

  // Add event listeners
  window.addEventListener('mousemove', trackMouseMove, { passive: true });
  window.addEventListener('keydown', trackKeyboard, { passive: true });
  window.addEventListener('touchstart', trackMouseMove, { passive: true });

  // Cleanup function
  return () => {
    window.removeEventListener('mousemove', trackMouseMove);
    window.removeEventListener('keydown', trackKeyboard);
    window.removeEventListener('touchstart', trackMouseMove);
  };
};
