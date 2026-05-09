import React from 'react';
import { sectionThemeStyle } from '../data/sectionThemes.js';

function splitSectionLabel(sectionId, label) {
  if(sectionId === 'INTRO') return { kicker: 'Introduction', title: 'Welcome' };
  if(sectionId === 'END') return { kicker: 'Final Step', title: 'Review & Submit' };
  const match = label.match(/^(Section\s+[A-Z])\s+—\s+(.+)$/);
  if(match) return { kicker: match[1], title: match[2] };
  return { kicker: sectionId, title: label };
}

function Sidebar({visibleSections, sectionStates, getSectionLabel, onSectionClick}) {
  return (
    <div id="secNav">
      {visibleSections.map((s) => {
        const labelParts = splitSectionLabel(s, getSectionLabel(s));
        const state = sectionStates[s] || {};
        const active = !!state.active;
        const done = !!state.completed;
        const isLocked = !!state.locked;
        const notApplicable = !!state.notApplicable;
        const selectedBranch = !!state.selectedBranch;
        const available = !!state.available;
        const offPath = !!state.offPathWithAnswers;
        const isUnavailable = isLocked || notApplicable || offPath;

        return (
          <div
            key={s}
            className={`sb-item${active ? ' active' : ''}${done ? ' done' : ''}${available ? ' available' : ''}${isLocked ? ' locked' : ''}${notApplicable ? ' not-path' : ''}${selectedBranch ? ' your-path' : ''}${offPath ? ' prev-path' : ''}`}
            style={sectionThemeStyle(s)}
          >
            <button
              type="button"
              className="sb-main"
              onClick={() => onSectionClick(s, { completed: done, active, locked: isLocked, notApplicable, available, offPathWithAnswers: offPath })}
              disabled={isUnavailable}
              title={isLocked && !notApplicable ? 'Complete earlier sections to unlock' : ''}
            >
              <div className="sb-dot" aria-hidden="true">
                {done ? '✓' : null}
                {isLocked && !notApplicable ? <span className="lock-shape"></span> : null}
                {available ? <span className="unlock-shape"></span> : null}
              </div>
              <span className="sb-label">
                <span className="sb-kicker">{labelParts.kicker}</span>
                <span className="sb-name">{labelParts.title}</span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Sidebar;
