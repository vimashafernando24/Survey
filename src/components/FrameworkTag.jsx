import React from 'react';
import { getFrameworkTheme } from '../data/frameworkTheme.js';

function FrameworkTag({ tag, className = '' }) {
  if (!tag) return null;
  const theme = getFrameworkTheme(tag);
  return (
    <span
      className={`framework-tag${className ? ` ${className}` : ''}`}
      style={{
        '--framework-color': theme.color,
        '--framework-bg': theme.bg,
        '--framework-border': theme.border
      }}
    >
      {theme.label}
    </span>
  );
}

export default FrameworkTag;
