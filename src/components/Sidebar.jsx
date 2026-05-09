import React from 'react';
function Sidebar({visibleSections, sectionStates, getSectionLabel, onSectionClick}) {
  return (
    <div id="secNav">
      {visibleSections.map((s) => {
        const state = sectionStates[s] || {};
        const active = !!state.active;
        const done = !!state.completed;
        const isLocked = !!state.locked;
        const notApplicable = !!state.notApplicable;
        const selectedBranch = !!state.selectedBranch;
        const available = !!state.available;
        const offPath = !!state.offPathWithAnswers;

        return (
          <button
            key={s}
            className={`sb-item${active ? ' active' : ''}${done ? ' done' : ''}${available ? ' available' : ''}${isLocked ? ' locked' : ''}${notApplicable ? ' not-path' : ''}${selectedBranch ? ' your-path' : ''}${offPath ? ' prev-path' : ''}`}
            onClick={() => onSectionClick(s, { completed: done, active, locked: isLocked, notApplicable, available, offPathWithAnswers: offPath })}
            disabled={isLocked || notApplicable || offPath}
            title={isLocked && !notApplicable ? 'Complete earlier sections to unlock' : ''}
          >
            <div className="sb-dot" aria-hidden="true">
              {done ? '✓' : null}
              {isLocked && !notApplicable ? <span className="lock-shape"></span> : null}
              {available ? <span className="unlock-shape"></span> : null}
            </div>
            <span className="sb-label">{getSectionLabel(s)}</span>
            {selectedBranch && !notApplicable ? <span className="sb-lock path">Your survey path</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export default Sidebar;
