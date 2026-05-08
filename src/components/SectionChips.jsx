import React from 'react';

function SectionChips({ chips, onChipClick }) {
  if (!chips || chips.length === 0) return null;

  const currentIndex = chips.findIndex(c => c.isCurrent);
  const answeredCount = chips.filter(c => c.isAnswered).length;

  return (
    <div className="section-chips">
      <div className="chips-header">
        {currentIndex >= 0
          ? `Question ${currentIndex + 1} of ${chips.length}`
          : answeredCount > 0
            ? `${answeredCount} of ${chips.length} answered`
            : null}
      </div>
      <div className="chips-grid">
        {chips.map((chip, index) => {
          const isFuture = !chip.isAnswered && !chip.isCurrent;
          return (
            <button
              key={chip.id}
              className={[
                'chip',
                chip.isCurrent   ? 'chip-current'  : '',
                chip.isAnswered && !chip.isCurrent ? 'chip-answered' : '',
                isFuture         ? 'chip-future'   : ''
              ].filter(Boolean).join(' ')}
              disabled={isFuture || chip.isCurrent}
              onClick={() => !isFuture && !chip.isCurrent && onChipClick(chip.id)}
              title={chip.id}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SectionChips;
