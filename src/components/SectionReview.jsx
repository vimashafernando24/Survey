import React from 'react';

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
  onEdit
}) {
  const formatAnswer = (q) => {
    const value = answers[q.id];
    if(value === undefined || value === '' || (Array.isArray(value) && value.length === 0)){
      return 'Not answered';
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

  return (
    <div className="section-review">
      <div className="review-head">
        <div>
          <div className="q-section">{eyebrow}</div>
          <h2>{title}</h2>
        </div>
        <button className="btn btn-back" onClick={onBack}>{t('static.buttons.back','← Back')}</button>
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
              {!readOnly ? (
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
