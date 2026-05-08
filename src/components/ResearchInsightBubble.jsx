import React from 'react';
import { getFrameworkTheme } from '../data/frameworkTheme.js';
import FrameworkTag from './FrameworkTag.jsx';

function ResearchInsightBubble({
  insight,
  expanded,
  onExpand,
  onDismiss,
  onLearnMore
}) {
  if (!insight) return null;
  const theme = getFrameworkTheme(insight.frameworkTag);

  return (
    <div
      className={`research-bubble${expanded ? ' expanded' : ''}`}
      style={{
        '--framework-color': theme.color,
        '--framework-bg': theme.bg,
        '--framework-border': theme.border
      }}
    >
      {!expanded ? (
        <button className="research-prompt" onClick={onExpand}>
          <span className="research-prompt-dot" aria-hidden="true"></span>
          <span>{insight.rabbitPrompt}</span>
        </button>
      ) : (
        <div
          className="research-insight-card"
          role="dialog"
          aria-modal="false"
          aria-label="Research insight"
        >
          <button className="research-dismiss" onClick={onDismiss} aria-label="Dismiss research insight">×</button>
          <div className="research-insight-title">Why this question matters</div>
          <p>{insight.whyItMatters}</p>
          <div style={{ marginBottom: 10 }}>
            <FrameworkTag tag={insight.frameworkTag} />
          </div>
          {insight.quoteInsight ? (
            <blockquote>{insight.quoteInsight}</blockquote>
          ) : null}
          <button className="btn btn-back research-learn" onClick={onLearnMore}>Learn more</button>
        </div>
      )}
    </div>
  );
}

export default ResearchInsightBubble;
