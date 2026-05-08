import React from 'react';
function MobileSectionNav({visibleSections, sectionStates, getSectionLabel, onSectionClick}) {
  return (
    <div className="mobile-section-nav" aria-label="Survey sections">
      {visibleSections.map((s) => {
        const state = sectionStates[s] || {};
        const active = !!state.active;
        const done = !!state.completed;
        const isLocked = !!state.locked;
        const notApplicable = !!state.notApplicable;
        const selectedBranch = !!state.selectedBranch;
        const available = !!state.available;

        return (
          <button
            key={s}
            className={`mobile-sec-btn${active ? ' active' : ''}${done ? ' done' : ''}${available ? ' available' : ''}${isLocked ? ' locked' : ''}${notApplicable ? ' not-path' : ''}${selectedBranch ? ' your-path' : ''}`}
            onClick={() => onSectionClick(s, { completed: done, active, locked: isLocked, notApplicable, available })}
            disabled={isLocked || notApplicable}
            title={selectedBranch ? `${getSectionLabel(s)} — Your survey path` : (notApplicable ? '' : getSectionLabel(s))}
          >
            <span>{s}</span>
            {done ? <span aria-hidden="true">✓</span> : null}
            {isLocked && !notApplicable ? <span className="mobile-lock" aria-hidden="true"></span> : null}
            {available ? <span className="mobile-unlock" aria-hidden="true"></span> : null}
          </button>
        );
      })}
    </div>
  );
}

export default MobileSectionNav;
