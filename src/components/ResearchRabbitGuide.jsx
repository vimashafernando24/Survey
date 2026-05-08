import React, { useEffect, useMemo, useState } from 'react';
import ResearchInsightBubble from './ResearchInsightBubble.jsx';
import rabbit1 from '../assets/mascots/rabbit1.png';
import rabbit2 from '../assets/mascots/rabbit2.png';
import rabbit3 from '../assets/mascots/rabbit3.png';
import rabbit4 from '../assets/mascots/rabbit4.png';
import rabbit5 from '../assets/mascots/rabbit5.png';

const rabbitPoses = [rabbit1, rabbit2, rabbit3, rabbit4, rabbit5].filter(Boolean);

function ResearchRabbitGuide({ questionId, insight, onDismiss, onLearnMore }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const rabbitSrc = useMemo(() => {
    if (rabbitPoses.length === 0) return null;
    return rabbitPoses[Math.floor(Math.random() * rabbitPoses.length)];
  }, [questionId]);

  // Reset prompt + bubble whenever the question changes
  useEffect(() => {
    setShowPrompt(false);
    setIsExpanded(false);
  }, [questionId]);

  // Show the curiosity prompt 1500ms after an insight becomes available for this question
  useEffect(() => {
    if (!insight) {
      setShowPrompt(false);
      setIsExpanded(false);
      return;
    }
    const timer = setTimeout(() => setShowPrompt(true), 1500);
    return () => clearTimeout(timer);
  }, [insight]);

  if (!insight) return null;

  return (
    <aside
      className={`research-rabbit-guide${isExpanded ? ' expanded' : ''}`}
      aria-live="polite"
    >
      <button
        className="research-rabbit-button"
        onClick={() => setIsExpanded(true)}
        aria-label="Open research insight"
      >
        {rabbitSrc ? <img src={rabbitSrc} alt="" /> : <span aria-hidden="true">?</span>}
      </button>
      {(showPrompt || isExpanded) && (
        <ResearchInsightBubble
          insight={insight}
          expanded={isExpanded}
          onExpand={() => setIsExpanded(true)}
          onDismiss={() => setIsExpanded(false)}
          onLearnMore={onLearnMore}
        />
      )}
    </aside>
  );
}

export default ResearchRabbitGuide;
