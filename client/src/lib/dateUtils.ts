// dateUtils.ts - Date formatting utilities for East Africa Time (EAT)
// Purpose: Provide consistent date and time formatting across the entire application
//          using East Africa Time (UTC+3) for all timestamps.
//          This ensures farmers in Uganda, Kenya, Tanzania, and surrounding regions
//          see dates in their local timezone.

// East Africa Time (EAT) = UTC+3
// Using Africa/Nairobi timezone which covers Uganda, Kenya, Tanzania, and surrounding regions

/**
 * Format a date as a short date string in East Africa Time
 * Example output: "12 May 2026"
 * 
 * @param date - Date object or ISO string
 * @returns Formatted date string in EAT
 */
export const formatLocalDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format a date and time as a full datetime string in East Africa Time
 * Example output: "12 May 2026, 3:30 PM"
 * 
 * Used for:
 * - Scan detail pages
 * - Report generation
 * - Timestamp displays
 * 
 * @param date - Date object or ISO string
 * @returns Formatted datetime string in EAT
 */
export const formatLocalDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format a time only as a time string in East Africa Time
 * Example output: "3:30 PM"
 * 
 * Used for:
 - Time displays where date is shown separately
 * - Quick reference timestamps
 * 
 * @param date - Date object or ISO string
 * @returns Formatted time string in EAT
 */
export const formatLocalTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};