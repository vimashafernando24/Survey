import React from 'react';
import { FIELD_RULES } from '../surveyData.js';
import { getFrameworkTheme } from '../data/frameworkTheme.js';
import OptionCard from './OptionCard.jsx';

function QuestionCard(props) {
  const {
    q, answers, history, t, getSectionLabel, translateQField, translateOptionLabel,
    translateOptionSub, getValidationError, validationAttempted, fieldTouched,
    pickRadio, toggleChk, updateNumber, updateSelect, checkHasAnswer, handleNext, goBack,
    reviewEditContext, savedFeedback, onReturnToReview, onReturnToProgress
  } = props;
  const saved = answers[q.id];
  const hasAnswer = checkHasAnswer(q);
  const showError = validationAttempted && !hasAnswer;
  const valErr = (validationAttempted || fieldTouched) ? getValidationError(q, saved) : null;
  const frameworkTheme = getFrameworkTheme(q.fw);

  return (
    <div className="card">
      <div className="q-meta">
        <span className="q-id">{q.id}</span>
        <span
          className="badge framework-badge"
          style={{
            '--framework-color': frameworkTheme.color,
            '--framework-bg': frameworkTheme.bg,
            '--framework-border': frameworkTheme.border
          }}
        >
          {frameworkTheme.label}
        </span>
        <span className="q-section">{getSectionLabel(q.sec)}</span>
      </div>
      <div className="q-text">{translateQField(q,'text')}</div>
      {q.hint ? <div className="q-hint">{translateQField(q,'hint')}</div> : null}
      {showError ? <div className="q-error">{t('static.required','Please answer this question to continue.')}</div> : null}
      {q.type === 'radio' ? (
        <div className="options">
          {(q.opts || []).map((o,index) => (
            <OptionCard
              key={o.v}
              option={o}
              label={translateOptionLabel(q.id,index,o.l)}
              subLabel={o.s ? translateOptionSub(q.id,index,o.s) : null}
              selected={saved === o.v}
              onSelect={() => pickRadio(q.id,o.v)}
            />
          ))}
        </div>
      ) : null}
      {q.type === 'checkbox' ? (
        <>
          <div className="multi-hint">{t('static.multiHint','Select all that apply')}</div>
          <div className="options">
            {(q.opts || []).map((o,index) => {
              const arr = saved || [];
              return (
                <OptionCard
                  key={o.v}
                  option={o}
                  label={translateOptionLabel(q.id,index,o.l)}
                  selected={arr.includes(o.v)}
                  checkbox
                  onSelect={() => toggleChk(q.id,o.v)}
                />
              );
            })}
          </div>
        </>
      ) : null}
      {q.type === 'number' ? (
        <>
          <input
            type="number"
            id={`num_${q.id}`}
            value={saved || ''}
            placeholder="Enter number"
            min={q.var && FIELD_RULES[q.var] ? FIELD_RULES[q.var].min : 0}
            max={q.var && FIELD_RULES[q.var] ? FIELD_RULES[q.var].max : undefined}
            onInput={(event) => updateNumber(q.id, event.currentTarget.value)}
          />
          <div id={`val_err_${q.id}`} className="q-error" style={{display: valErr ? '' : 'none'}}>{valErr || ''}</div>
        </>
      ) : null}
      {q.type === 'select' ? (
        <select id={`sel_${q.id}`} value={saved || ''} onChange={(event) => updateSelect(q.id, event.currentTarget.value)}>
          <option value="">{t('static.selectPlaceholder','— Select district —')}</option>
          {(q.opts || []).map((o,index) => <option key={o.v} value={o.v}>{translateOptionLabel(q.id,index,o.l)}</option>)}
        </select>
      ) : null}
      {savedFeedback ? (
        <div className="answer-saved-feedback">New answer saved</div>
      ) : null}
      <div className="nav">
        {reviewEditContext ? (
          <>
            <button className="btn btn-back" onClick={onReturnToReview}>Back to review</button>
            <button className="btn btn-next" id="btnNext" onClick={onReturnToProgress}>Return to current progress →</button>
          </>
        ) : (
          <>
            {history.length > 0 ? <button className="btn btn-back" onClick={goBack}>{t('static.buttons.back','← Back')}</button> : null}
            <button className="btn btn-next" id="btnNext" onClick={handleNext}>{t('static.buttons.next','Next →')}</button>
          </>
        )}
      </div>
    </div>
  );
}

export default QuestionCard;
