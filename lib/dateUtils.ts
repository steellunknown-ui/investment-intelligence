// Date formatting utilities for "Last Updated" display

export const formatUpdatedAt = (dateString?: string): string => {
  if (!dateString) return "Never updated";
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dateOnly.getTime() === today.getTime()) {
    return "Updated Today";
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return "Updated Yesterday";
  } else {
    return `Updated ${date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}`;
  }
};

export const formatUpdatedAtWithTime = (dateString?: string): string => {
  if (!dateString) return "Never updated";
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  if (dateOnly.getTime() === today.getTime()) {
    return `Updated Today, ${timeString}`;
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return `Updated Yesterday, ${timeString}`;
  } else {
    return `Updated ${date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}, ${timeString}`;
  }
};