/**
 * Error handling utility for secure error management
 * 
 * This module provides functions to convert internal errors into user-friendly messages
 * without exposing sensitive system details like database structure, table names, or stack traces.
 */

export type ErrorCategory = 'validation' | 'auth' | 'network' | 'server' | 'not_found' | 'permission';

interface ErrorMapping {
  category: ErrorCategory;
  userMessage: string;
}

/**
 * Maps error messages or error objects to user-friendly messages
 * Logs detailed errors internally for debugging
 */
export function getSecureErrorMessage(error: any): string {
  // Log the full error details for server-side debugging
  console.error('Internal error:', error);

  // Extract error message if it's an Error object
  const errorMessage = error?.message || error?.toString() || '';

  // Categorize and map to user-friendly messages
  const mapping = categorizeError(errorMessage);
  return mapping.userMessage;
}

/**
 * Categorizes errors based on message patterns
 */
function categorizeError(errorMessage: string): ErrorMapping {
  const lowerMessage = errorMessage.toLowerCase();

  // Authentication/Authorization errors
  if (lowerMessage.includes('jwt') || 
      lowerMessage.includes('authentication') || 
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('not authenticated')) {
    return {
      category: 'auth',
      userMessage: 'Please log in to continue.'
    };
  }

  // Permission errors (RLS violations)
  if (lowerMessage.includes('permission') || 
      lowerMessage.includes('policy') ||
      lowerMessage.includes('row-level security') ||
      lowerMessage.includes('rls')) {
    return {
      category: 'permission',
      userMessage: 'You do not have permission to perform this action.'
    };
  }

  // Validation errors
  if (lowerMessage.includes('violates') ||
      lowerMessage.includes('constraint') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('validation')) {
    return {
      category: 'validation',
      userMessage: 'Please check your input and try again.'
    };
  }

  // Not found errors
  if (lowerMessage.includes('not found') ||
      lowerMessage.includes('does not exist')) {
    return {
      category: 'not_found',
      userMessage: 'The requested item was not found.'
    };
  }

  // Network errors
  if (lowerMessage.includes('network') ||
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('timeout')) {
    return {
      category: 'network',
      userMessage: 'Network error. Please check your connection and try again.'
    };
  }

  // Default server error
  return {
    category: 'server',
    userMessage: 'An error occurred. Please try again later.'
  };
}

/**
 * For operations that require specific user feedback
 */
export function getCustomErrorMessage(error: any, customMessage: string): string {
  console.error('Internal error:', error);
  return customMessage;
}
