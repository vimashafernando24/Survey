import React from 'react';

function SectionChips({ chips, introId, onChipClick, onIntroClick, disableQuestionNavigation = false, editMode = false, t = (_key, fallback) => fallback }) {
  if (!chips || chips.length === 0) return null;

  const currentIndex = chips.findIndex(c => c.isCurrent);
  const answeredCount = chips.filter(c => c.isAnswered).length;

  return (
    <div className={`section-chips${editMode ? ' chips-edit-mode' : ''}`}>
      <div className="chips-header">
        {editMode
          ? t('static.clickToEdit','Click to edit')
          : currentIndex >= 0
            ? t('static.questionProgress','Question {current} of {total}').replace('{current}', currentIndex + 1).replace('{total}', chips.length)
            : answeredCount > 0
              ? t('static.answeredProgress','{answered} of {total} answered').replace('{answered}', answeredCount).replace('{total}', chips.length)
              : null}
      </div>
      <div className="chips-grid">
        {introId ? (
          <button
            className="chip chip-intro"
            onClick={() => onIntroClick ? onIntroClick(introId) : onChipClick(introId)}
            title={t('static.sectionIntroduction','Section introduction')}
            aria-label={t('static.sectionIntroduction','Section introduction')}
          >
            {t('static.introChip','Intro')}
          </button>
        ) : null}
        {chips.map((chip, index) => {
          const isFuture = !chip.isAnswered && !chip.isCurrent;
          // In edit mode on the review page, allow clicking any answered chip (including isCurrent).
          // While actively editing a question (disableQuestionNavigation=true), chips are locked
          // but the active chip still shows highlighted via isCurrent styling.
          const disabled = disableQuestionNavigation || isFuture || (!editMode && chip.isCurrent);
          return (
            <button
              key={chip.id}
              className={[
                'chip',
                chip.isCurrent   ? 'chip-current'  : '',
                chip.isAnswered && !chip.isCurrent ? 'chip-answered' : '',
                isFuture         ? 'chip-future'   : ''
              ].filter(Boolean).join(' ')}
              disabled={disabled}
              onClick={() => !disabled && onChipClick(chip.id)}
              title={editMode && chip.isAnswered ? t('static.editQuestion','Edit {id}').replace('{id}', chip.id) : chip.id}
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
