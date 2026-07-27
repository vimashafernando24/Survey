import React, { useEffect, useMemo, useRef, useState } from 'react';
import ResearchInsightBubble from './ResearchInsightBubble.jsx';
import ResponsiveMascotImage from './ResponsiveMascotImage.jsx';
import rabbit1 from '../assets/mascots/rabbit1.png';
import rabbit2 from '../assets/mascots/rabbit2.png';
import rabbit3 from '../assets/mascots/rabbit3.png';
import rabbit4 from '../assets/mascots/rabbit4.png';
import rabbit5 from '../assets/mascots/rabbit5.png';
import rabbit1Small from '../assets/mascots/small/rabbit1.png';
import rabbit2Small from '../assets/mascots/small/rabbit2.png';
import rabbit3Small from '../assets/mascots/small/rabbit3.png';
import rabbit4Small from '../assets/mascots/small/rabbit4.png';
import rabbit5Small from '../assets/mascots/small/rabbit5.png';

const rabbitPoses = [
  { src: rabbit1, smallSrc: rabbit1Small },
  { src: rabbit2, smallSrc: rabbit2Small },
  { src: rabbit3, smallSrc: rabbit3Small },
  { src: rabbit4, smallSrc: rabbit4Small },
  { src: rabbit5, smallSrc: rabbit5Small }
];

function playSoftRabbitCue() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const startCue = () => {
      const now = audioContext.currentTime;
      const master = audioContext.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.035, now + 0.025);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      master.connect(audioContext.destination);

      [660, 880].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.08);
        oscillator.connect(master);
        oscillator.start(now + index * 0.08);
        oscillator.stop(now + 0.24 + index * 0.08);
      });

      window.setTimeout(() => {
        audioContext.close().catch(() => {});
      }, 650);
    };

    if (audioContext.state === 'suspended') {
      audioContext.resume().then(startCue).catch(() => {});
    } else {
      startCue();
    }
  } catch {
    // Browser audio policies can block this; the popup still works normally.
  }
}

function ResearchRabbitGuide({ questionId, insight, onDismiss, onLearnMore, t }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const lastSoundKey = useRef(null);

  const rabbitSrc = useMemo(() => {
    if (rabbitPoses.length === 0) return null;
    return rabbitPoses[Math.floor(Math.random() * rabbitPoses.length)];
  }, [questionId]);

  // Reset prompt + bubble whenever the question changes
  useEffect(() => {
    setShowPrompt(false);
    setIsExpanded(false);
  }, [questionId]);

  // Show the curiosity prompt immediately after an insight becomes available.
  useEffect(() => {
    if (!insight) {
      setShowPrompt(false);
      setIsExpanded(false);
      return;
    }
    setShowPrompt(true);
    const soundKey = `${questionId}:${insight.frameworkTag || ''}`;
    if (lastSoundKey.current !== soundKey) {
      lastSoundKey.current = soundKey;
      playSoftRabbitCue();
    }
  }, [insight, questionId]);

  if (!insight) return null;

  return (
    <aside
      className={`research-rabbit-guide${isExpanded ? ' expanded' : ''}`}
      aria-live="polite"
    >
      <button
        className="research-rabbit-button"
        onClick={() => setIsExpanded(true)}
        aria-label={t ? t('static.openResearchInsight','Open research insight') : 'Open research insight'}
      >
        {rabbitSrc ? (
          <ResponsiveMascotImage
            src={rabbitSrc.src}
            smallSrc={rabbitSrc.smallSrc}
            sizes="(max-width: 768px) 30vw, 292px"
            alt=""
          />
        ) : <span aria-hidden="true">?</span>}
      </button>
      {(showPrompt || isExpanded) && (
        <ResearchInsightBubble
          insight={insight}
          expanded={isExpanded}
          onExpand={() => setIsExpanded(true)}
          onDismiss={() => setIsExpanded(false)}
          onLearnMore={onLearnMore}
          t={t}
        />
      )}
    </aside>
  );
}

export default ResearchRabbitGuide;
