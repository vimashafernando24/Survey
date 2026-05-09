import React from 'react';
import { getFrameworkTheme } from '../data/frameworkTheme.js';
import FrameworkTag from './FrameworkTag.jsx';

function ResearchInsightBubble({
  insight,
  expanded,
  onExpand,
  onDismiss,
  onLearnMore,
  t = (_key, fallback) => fallback
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
          <span className="research-prompt-copy">{insight.rabbitPrompt}</span>
          <span className="research-prompt-action">{t('static.showInsight','Show insight')}</span>
        </button>
      ) : (
        <div
          className="research-insight-card"
          role="dialog"
          aria-modal="false"
          aria-label={t('static.researchInsight','Research insight')}
        >
          <button className="research-dismiss" onClick={onDismiss} aria-label={t('static.dismissResearchInsight','Dismiss research insight')}>×</button>
          <div className="research-insight-title">{t('static.whyThisQuestionMatters','Why this question matters')}</div>
          <p>{insight.whyItMatters}</p>
          <div style={{ marginBottom: 10 }}>
            <FrameworkTag tag={insight.frameworkTag} />
          </div>
          {insight.quoteInsight ? (
            <blockquote>{insight.quoteInsight}</blockquote>
          ) : null}
          <button className="btn btn-back research-learn" onClick={onLearnMore}>{t('static.learnMore','Learn more')}</button>
        </div>
      )}
    </div>
  );
}

export default ResearchInsightBubble;
