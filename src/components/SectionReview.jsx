import React from 'react';
import ResponsiveMascotImage from './ResponsiveMascotImage.jsx';

function SectionReview({
  title,
  eyebrow,
  questions,
  answers,
  translateQField,
  translateOptionLabel,
  t,
  readOnly,
  onBack,
  onEdit,
  editMode,
  onEnterEditMode,
  onExitEditMode,
  sectionTheme
}) {
  const formatAnswer = (q) => {
    const value = answers[q.id];
    if(value === undefined || value === '' || (Array.isArray(value) && value.length === 0)){
      return t('static.notAnswered','Not answered');
    }
    if(q.type === 'checkbox'){
      const values = Array.isArray(value) ? value : [];
      return values.map(v => {
        const index = (q.opts || []).findIndex(o => o.v === v);
        const opt = index >= 0 ? q.opts[index] : null;
        return opt ? translateOptionLabel(q.id, index, opt.l) : v;
      }).join(', ');
    }
    if(q.type === 'radio' || q.type === 'select'){
      const index = (q.opts || []).findIndex(o => o.v === value);
      const opt = index >= 0 ? q.opts[index] : null;
      return opt ? translateOptionLabel(q.id, index, opt.l) : value;
    }
    return String(value);
  };

  // Parse "Section A — Personal & Household" → kicker + name for clean stacked display
  const eyebrowMatch = (eyebrow || '').match(/^(Section\s+[A-Z])\s+—\s+(.+)$/);
  const eyebrowKicker = eyebrowMatch ? eyebrowMatch[1].toUpperCase() : null;
  const eyebrowName = eyebrowMatch ? eyebrowMatch[2] : null;

  return (
    <div className="section-review">
      <div className="review-head">
        <div>
          <div className="q-section">{eyebrowKicker || eyebrow}</div>
          {eyebrowName ? <div className="review-eyebrow-name">{eyebrowName}</div> : null}
          <h2>{title}</h2>
        </div>
        {sectionTheme?.mascotImage ? (
          <div className="review-mascot" aria-hidden="true">
            <ResponsiveMascotImage
              src={sectionTheme.mascotImage}
              smallSrc={sectionTheme.mascotImageSmall}
              sizes="(max-width: 768px) 50vw, 340px"
              alt=""
            />
          </div>
        ) : null}
        <div className="review-actions">
          <button className="btn btn-back" onClick={onBack}>{t('static.buttons.back','← Back')}</button>
          {!readOnly && !editMode ? (
            <button className="btn-edit-answers" onClick={onEnterEditMode}>
              {t('static.editAnswers','Edit Answers')}
            </button>
          ) : null}
          {!readOnly && editMode ? (
            <button className="btn-edit-answers exit" onClick={onExitEditMode}>
              {t('static.doneEditing','Done Editing')}
            </button>
          ) : null}
        </div>
      </div>
      {questions.length === 0 ? (
        <p className="review-empty">{t('static.noReviewAnswers','No answered questions in this section yet.')}</p>
      ) : (
        <div className="review-list">
          {questions.map(q => (
            <div className="review-item" key={q.id}>
              <div className="review-question">
                <span className="q-id">{q.id}</span>
                <span>{translateQField(q, 'text')}</span>
              </div>
              <div className="review-answer">{formatAnswer(q)}</div>
              {!readOnly && editMode ? (
                <button className="btn btn-back review-edit" onClick={() => onEdit(q.id)}>{t('static.buttons.edit','Edit')}</button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SectionReview;
