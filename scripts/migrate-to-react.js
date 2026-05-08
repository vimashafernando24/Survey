const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'nysc_swts_survey.html'), 'utf8');

const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

if (!style || !script) {
  throw new Error('Could not extract style or script from nysc_swts_survey.html');
}

const slice = (startMarker, endMarker) => {
  const start = script.indexOf(startMarker);
  const end = script.indexOf(endMarker);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not slice ${startMarker} to ${endMarker}`);
  }
  return script.slice(start, end).trim();
};

const dataPart = slice('// ─── DATA', 'let currentLang');
const supportPart = slice('// ─── SECTION SUPPORT', '// ─── LOCAL PROGRESS');
const questionsPart = slice('// ─── QUESTIONS', 'function getValidationError');

const surveyData = `${dataPart}

${supportPart}

${questionsPart}

function buildEnglishQuestionTranslations() {
  Q.forEach(q => {
    const copy = { title: q.title, body: q.body, text: q.text, hint: q.hint, opts: [] };
    if (q.opts) {
      copy.opts = q.opts.map(opt => ({ l: opt.l, s: opt.s }));
    }
    translations.en.questions[q.id] = copy;
  });
}

buildEnglishQuestionTranslations();

export {
  EDU,
  OCC,
  DISTRICTS,
  CONTRACT,
  SEARCH,
  OBSTACLE,
  TRAINING_T,
  ACTIVITY,
  SECTIONS_META,
  SEC_ORDER,
  translations,
  SECTION_SUPPORT,
  Q,
  FIELD_RULES
};
`;

const app = `import React, { useEffect, useMemo, useState } from 'react';
import {
  FIELD_RULES,
  Q,
  SEC_ORDER,
  SECTION_SUPPORT,
  SECTIONS_META,
  translations
} from './surveyData.js';
import './styles.css';

const DRAFT_KEY = 'nysc_swts_v1';
const enableApiSubmit = true;
const developerMode = false;
const SEC_EST = {A:1,B:22,C:22,D:14,E:29,F:55,G:10,END:0};

function readPath(obj, path) {
  return path.split('.').reduce((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return value[key];
  }, obj);
}

function loadDraft(){
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if(!raw) return null;
    const d = JSON.parse(raw);
    if(!d || !d.id || d.id === 'INTRO') return null;
    return d;
  } catch(e){ return null; }
}

function clearDraft(){
  try { localStorage.removeItem(DRAFT_KEY); } catch(e){}
}

function getQ(id){ return Q.find(q=>q.id===id); }

function fwBadgeLabel(fw){
  return fw === 'Bourdieu' ? 'BOU' : fw;
}

function App() {
  const [currentLang, setCurrentLang] = useState('en');
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]);
  const [currentId, setCurrentId] = useState('INTRO');
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [fieldTouched, setFieldTouched] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [showResume, setShowResume] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const q = getQ(currentId);

  useEffect(() => {
    const draft = loadDraft();
    if(draft){
      setCurrentLang(draft.lang || 'en');
      setPendingDraft(draft);
      setShowResume(true);
    }
  }, []);

  useEffect(() => {
    if(!showResume) window.scrollTo({top:0,behavior:'smooth'});
  }, [currentId, currentLang, submitted, showResume]);

  const t = (path, fallback) => {
    let value = readPath(translations[currentLang], path);
    if (value !== undefined && value !== null) return value;
    value = readPath(translations.en, path);
    return value !== undefined && value !== null ? value : fallback || '';
  };

  const getSectionLabel = (sec) => t(\`sections.\${sec}\`, SECTIONS_META[sec]?.label || sec);
  const translateQField = (question, field) => t(\`questions.\${question.id}.\${field}\`, question[field] || '');
  const translateOptionLabel = (qId, index, defaultLabel) => t(\`questions.\${qId}.opts.\${index}.l\`, defaultLabel);
  const translateOptionSub = (qId, index, defaultSub) => qId && defaultSub ? t(\`questions.\${qId}.opts.\${index}.s\`, defaultSub) : defaultSub;

  const getValidationError = (question, val) => {
    if(question.type !== 'number') return null;
    if(val === undefined || val === '') return null;
    const num = Number(val);
    if(isNaN(num)) return null;
    const rule = question.var ? FIELD_RULES[question.var] : null;
    if(rule){
      if(num < rule.min || num > rule.max){
        const msg = t('static.validationRange',
          \`Please enter a value between \${rule.min} and \${rule.max}.\`);
        return msg.replace('{min}', rule.min).replace('{max}', rule.max);
      }
    } else if(num < 0){
      return t('static.validationNegative','Please enter 0 or a positive number.');
    }
    return null;
  };

  const shouldSkip = (question, answerSet = answers) => {
    if(!question.skip) return false;
    return question.skip(answerSet);
  };

  const getNext = (question, answerSet = answers) => {
    if(!question.next) return null;
    if(typeof question.next === 'function') return question.next(answerSet);
    return question.next;
  };

  const saveDraft = (nextAnswers, nextHistory, nextId, nextLang) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        a:nextAnswers, h:nextHistory, id:nextId, lang:nextLang, ts:Date.now()
      }));
    } catch(e){}
  };

  const goTo = (nextId, answerSet = answers, historySet = history, lang = currentLang) => {
    if(!nextId) return;
    const nextQuestion = getQ(nextId);
    if(!nextQuestion) return;
    if(shouldSkip(nextQuestion, answerSet)){
      const further = getNext(nextQuestion, answerSet);
      if(further) goTo(further, answerSet, historySet, lang);
      return;
    }
    const nextHistory = [...historySet, currentId];
    setHistory(nextHistory);
    setCurrentId(nextId);
    setSubmitted(false);
    setPreviewVisible(false);
    saveDraft(answerSet, nextHistory, nextId, lang);
  };

  const goBack = () => {
    if(history.length === 0) return;
    const nextHistory = history.slice(0, -1);
    const nextId = history[history.length - 1];
    setValidationAttempted(false);
    setFieldTouched(false);
    setHistory(nextHistory);
    setCurrentId(nextId);
    setSubmitted(false);
    setPreviewVisible(false);
    saveDraft(answers, nextHistory, nextId, currentLang);
  };

  const checkHasAnswer = (question) => {
    const a = answers[question.id];
    if(question.type === 'radio' || question.type === 'select') return !!a;
    if(question.type === 'number') return a !== undefined && a !== '';
    if(question.type === 'checkbox') return Array.isArray(a) && a.length > 0;
    return true;
  };

  const handleNext = () => {
    if(!q) return;
    if(!checkHasAnswer(q)){
      setValidationAttempted(true);
      return;
    }
    const valErr = getValidationError(q, answers[q.id]);
    if(valErr){
      setValidationAttempted(true);
      setFieldTouched(true);
      return;
    }
    setValidationAttempted(false);
    setFieldTouched(false);
    goTo(getNext(q));
  };

  const pickRadio = (qId, val) => {
    setAnswers(prev => ({...prev, [qId]: val}));
  };

  const toggleChk = (qId, val) => {
    setAnswers(prev => {
      const arr = prev[qId] ? [...prev[qId]] : [];
      const idx = arr.indexOf(val);
      if(idx >= 0) arr.splice(idx, 1);
      else arr.push(val);
      return {...prev, [qId]: arr};
    });
  };

  const updateNumber = (qId, val) => {
    setFieldTouched(true);
    setAnswers(prev => ({...prev, [qId]: val}));
  };

  const updateSelect = (qId, val) => {
    setAnswers(prev => ({...prev, [qId]: val}));
  };

  const getPct = () => {
    const currentQ = getQ(currentId);
    if(!currentQ) return 0;
    const si = SEC_ORDER.indexOf(currentQ.sec);
    let total = 0, done = 0;
    SEC_ORDER.forEach((s,i)=>{
      const e = SEC_EST[s] || 0;
      total += e;
      if(i < si) done += e;
      else if(i === si){
        const sqs = Q.filter(x=>x.sec === s);
        const qi = sqs.findIndex(x=>x.id === currentId);
        if(qi >= 0) done += Math.floor((qi / Math.max(sqs.length, 1)) * e);
      }
    });
    return Math.min(97, Math.round((done / Math.max(total, 1)) * 100));
  };

  const getProgressMessage = (pct) => {
    if(pct < 30) return t('static.progressMsg1','This survey is anonymous academic research and takes about 15–25 minutes.');
    if(pct < 70) return t('static.progressMsg2','You are making good progress — thank you for sharing your experience.');
    return t('static.progressMsg3','Great work — you are almost finished.');
  };

  const buildData = () => {
    const out = {_meta:{timestamp:new Date().toISOString(),version:'SWTS+Bourdieu+SDT',branch:answers.C20||'unknown',frameworks:['SWTS','Bourdieu','SDT']}};
    Q.forEach(question => { if(question.var && answers[question.id] !== undefined) out[question.var] = answers[question.id]; });
    out.selected_language = currentLang;
    return out;
  };

  const exportJSON = () => {
    const data = buildData();
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = \`swts_response_\${Date.now()}.json\`;
    a.click();
  };

  const exportCSV = () => {
    const data = buildData();
    delete data._meta;
    const keys = Object.keys(data);
    const vals = keys.map(k=>{
      const v = data[k];
      return '\"' + String(Array.isArray(v) ? v.join('|') : v).replace(/\"/g,'\"\"') + '\"';
    });
    const csv = keys.join(',') + '\\n' + vals.join(',');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = \`swts_response_\${Date.now()}.csv\`;
    a.click();
  };

  const submitSurvey = () => {
    setSubmitting(true);
    const formData = buildData();
    if(enableApiSubmit){
      fetch('/api/responses', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(formData)
      })
      .then(response=>{
        if(response.ok){
          clearDraft();
          setSubmitted(true);
        } else {
          setSubmitting(false);
          alert(t('static.submitFail','Submission failed. Please try again later.'));
        }
      })
      .catch(()=>{
        setSubmitting(false);
        alert(t('static.submitError','Submission failed. Please check your connection.'));
      });
    } else {
      clearDraft();
      setSubmitted(true);
    }
  };

  const switchLang = (lang) => {
    setCurrentLang(lang);
    saveDraft(answers, history, currentId, lang);
  };

  const resumeDraft = () => {
    if(!pendingDraft){
      startFresh();
      return;
    }
    setAnswers(pendingDraft.a || {});
    setHistory(pendingDraft.h || []);
    setCurrentId(pendingDraft.id || 'INTRO');
    setCurrentLang(pendingDraft.lang || 'en');
    setPendingDraft(null);
    setShowResume(false);
  };

  const startFresh = () => {
    clearDraft();
    setPendingDraft(null);
    setShowResume(false);
    setAnswers({});
    setHistory([]);
    setCurrentId('INTRO');
    setCurrentLang('en');
    setSubmitted(false);
  };

  const pct = q?.type === 'end' || submitted ? 100 : getPct();
  const topSec = q ? getSectionLabel(q.sec) : '';
  const previewData = useMemo(() => JSON.stringify(buildData(), null, 2), [answers, currentLang]);

  return (
    <>
      <div className="topbar">
        <span className="logo" id="logoText">{t('static.logo','Youth Transition Survey')}</span>
        <div className="top-controls">
          <span className="top-section" id="topSec">{topSec}</span>
          <span id="topNote" className="top-note">{getProgressMessage(pct)}</span>
        </div>
        <span className="top-pct" id="topPct">{pct}% {t('static.complete','complete')}</span>
        <div className="lang-switcher">
          {[
            ['en','EN'],
            ['si','සිං'],
            ['ta','தமி']
          ].map(([lang,label]) => (
            <button key={lang} className={\`lang-btn\${currentLang === lang ? ' active' : ''}\`} id={\`lang-\${lang}\`} onClick={() => switchLang(lang)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="prog-outer"><div className="prog-inner" id="progBar" style={{width:\`\${pct}%\`}} /></div>

      <div className="layout">
        <nav className="sidebar">
          <div className="sb-title" id="sectionsLabel">{t('static.sections','Sections')}</div>
          <Sidebar currentSec={submitted ? 'END' : q?.sec} getSectionLabel={getSectionLabel} />
          <div className="legend">
            <div className="leg-title">{t('static.frameworkKey','Framework Key')}</div>
            <div className="leg-row"><span className="badge SWTS">SWTS</span><span className="leg-txt">ILO School-to-Work</span></div>
            <div className="leg-row"><span className="badge Bourdieu">BOU</span><span className="leg-txt">Bourdieu Capital</span></div>
            <div className="leg-row"><span className="badge SDT">SDT</span><span className="leg-txt">Self-Determination</span></div>
          </div>
        </nav>
        <main className="main" id="mainArea">
          {showResume ? (
            <ResumePrompt t={t} resumeDraft={resumeDraft} startFresh={startFresh} />
          ) : submitted ? (
            <ThankYou t={t} developerMode={developerMode} exportJSON={exportJSON} exportCSV={exportCSV} />
          ) : q?.type === 'info' ? (
            <InfoCard q={q} t={t} getSectionLabel={getSectionLabel} translateQField={translateQField} goTo={goTo} />
          ) : q?.type === 'divider' ? (
            <DividerCard q={q} t={t} getNext={getNext} getSectionLabel={getSectionLabel} translateQField={translateQField} history={history} goBack={goBack} goTo={goTo} />
          ) : q?.type === 'end' ? (
            <ConfirmCard t={t} history={history} goBack={goBack} submitSurvey={submitSurvey} submitting={submitting} developerMode={developerMode} exportJSON={exportJSON} exportCSV={exportCSV} previewVisible={previewVisible} setPreviewVisible={setPreviewVisible} previewData={previewData} />
          ) : q ? (
            <QuestionCard
              q={q}
              answers={answers}
              history={history}
              t={t}
              getSectionLabel={getSectionLabel}
              translateQField={translateQField}
              translateOptionLabel={translateOptionLabel}
              translateOptionSub={translateOptionSub}
              getValidationError={getValidationError}
              validationAttempted={validationAttempted}
              fieldTouched={fieldTouched}
              pickRadio={pickRadio}
              toggleChk={toggleChk}
              updateNumber={updateNumber}
              updateSelect={updateSelect}
              checkHasAnswer={checkHasAnswer}
              handleNext={handleNext}
              goBack={goBack}
            />
          ) : null}
        </main>
      </div>
    </>
  );
}

function Sidebar({currentSec, getSectionLabel}) {
  const ci = SEC_ORDER.indexOf(currentSec);
  return (
    <div id="secNav">
      {SEC_ORDER.map((s) => {
        const si = SEC_ORDER.indexOf(s);
        const active = s === currentSec;
        const done = si < ci;
        return (
          <div key={s} className={\`sb-item\${active ? ' active' : ''}\${done ? ' done' : ''}\`}>
            <div className="sb-dot"></div>
            <span className="sb-label">{getSectionLabel(s)}</span>
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({q, t, getSectionLabel, translateQField, goTo}) {
  return (
    <div className="info-card">
      <div className="q-section">{getSectionLabel(q.sec)}</div>
      <h1>{translateQField(q,'title')}</h1>
      <div dangerouslySetInnerHTML={{__html: translateQField(q,'body')}} />
      <div className="nav" style={{marginTop:28}}>
        <button className="btn btn-next" onClick={() => goTo(q.next)}>{t('static.buttons.begin','Begin Survey →')}</button>
      </div>
    </div>
  );
}

function DividerCard({q, t, getNext, getSectionLabel, translateQField, history, goBack, goTo}) {
  const next = getNext(q);
  const support = SECTION_SUPPORT[q.sec] || '';
  return (
    <>
      <div className="div-card">
        <h2>{translateQField(q,'title')}</h2>
        <p>{translateQField(q,'body')}</p>
        {support ? <div className="sec-support">{support}</div> : null}
      </div>
      <div className="nav">
        {history.length > 0 ? <button className="btn btn-back" onClick={goBack}>{t('static.buttons.back','← Back')}</button> : null}
        <button className="btn btn-next" onClick={() => goTo(next)}>{t('static.buttons.continue','Continue →')}</button>
      </div>
    </>
  );
}

function QuestionCard(props) {
  const {
    q, answers, history, t, getSectionLabel, translateQField, translateOptionLabel,
    translateOptionSub, getValidationError, validationAttempted, fieldTouched,
    pickRadio, toggleChk, updateNumber, updateSelect, checkHasAnswer, handleNext, goBack
  } = props;
  const saved = answers[q.id];
  const hasAnswer = checkHasAnswer(q);
  const showError = validationAttempted && !hasAnswer;
  const valErr = (validationAttempted || fieldTouched) ? getValidationError(q, saved) : null;

  return (
    <div className="card">
      <div className="q-meta">
        <span className="q-id">{q.id}</span>
        <span className={\`badge \${q.fw}\`}>{fwBadgeLabel(q.fw)}</span>
        <span className="q-section">{getSectionLabel(q.sec)}</span>
      </div>
      <div className="q-text">{translateQField(q,'text')}</div>
      {q.hint ? <div className="q-hint">{translateQField(q,'hint')}</div> : null}
      {showError ? <div className="q-error">{t('static.required','Please answer this question to continue.')}</div> : null}
      {q.type === 'radio' ? (
        <div className="options">
          {(q.opts || []).map((o,index) => (
            <div key={o.v} className={\`opt\${saved === o.v ? ' sel' : ''}\`} onClick={() => pickRadio(q.id,o.v)}>
              <div className="opt-dot"></div>
              <span className="opt-label">
                {translateOptionLabel(q.id,index,o.l)}
                {o.s ? <span className="opt-sub">{translateOptionSub(q.id,index,o.s)}</span> : null}
              </span>
            </div>
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
                <div key={o.v} className={\`opt chk\${arr.includes(o.v) ? ' sel' : ''}\`} onClick={() => toggleChk(q.id,o.v)}>
                  <div className="opt-dot"></div>
                  <span className="opt-label">{translateOptionLabel(q.id,index,o.l)}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
      {q.type === 'number' ? (
        <>
          <input
            type="number"
            id={\`num_\${q.id}\`}
            value={saved || ''}
            placeholder="Enter number"
            min={q.var && FIELD_RULES[q.var] ? FIELD_RULES[q.var].min : 0}
            max={q.var && FIELD_RULES[q.var] ? FIELD_RULES[q.var].max : undefined}
            onInput={(event) => updateNumber(q.id, event.currentTarget.value)}
          />
          <div id={\`val_err_\${q.id}\`} className="q-error" style={{display: valErr ? '' : 'none'}}>{valErr || ''}</div>
        </>
      ) : null}
      {q.type === 'select' ? (
        <select id={\`sel_\${q.id}\`} value={saved || ''} onChange={(event) => updateSelect(q.id, event.currentTarget.value)}>
          <option value="">{t('static.selectPlaceholder','— Select district —')}</option>
          {(q.opts || []).map((o,index) => <option key={o.v} value={o.v}>{translateOptionLabel(q.id,index,o.l)}</option>)}
        </select>
      ) : null}
      <div className="nav">
        {history.length > 0 ? <button className="btn btn-back" onClick={goBack}>{t('static.buttons.back','← Back')}</button> : null}
        <button className="btn btn-next" id="btnNext" onClick={handleNext}>{t('static.buttons.next','Next →')}</button>
      </div>
    </div>
  );
}

function ConfirmCard({t, history, goBack, submitSurvey, submitting, developerMode, exportJSON, exportCSV, previewVisible, setPreviewVisible, previewData}) {
  return (
    <div className="confirm-card">
      <h2>{t('static.confirmTitle','Almost there — please review and submit')}</h2>
      <p>{t('static.confirmBody','You have completed all the survey questions. Your responses help us understand youth transitions in Sri Lanka and improve NYSC programmes for young people.')}</p>
      <div className="nav" style={{gap:12, marginBottom:24}}>
        {history.length > 0 ? <button className="btn btn-back" onClick={goBack}>{t('static.buttons.back','← Back')}</button> : null}
        <button className="btn-submit" id="btnSubmit" disabled={submitting} onClick={submitSurvey}>{submitting ? t('static.submitting','Submitting…') : t('static.confirmCta','Submit My Responses →')}</button>
      </div>
      {developerMode ? (
        <div style={{borderTop:'1px solid var(--border)',paddingTop:20}}>
          <div className="export-row">
            <button className="btn" style={{background:'var(--bou)',color:'white',fontSize:13,padding:'10px 16px'}} onClick={exportJSON}>{t('static.buttons.exportJson','↓ Export JSON')}</button>
            <button className="btn" style={{background:'var(--sdt)',color:'white',fontSize:13,padding:'10px 16px'}} onClick={exportCSV}>{t('static.buttons.exportCsv','↓ Export CSV Row')}</button>
            <button className="btn btn-back" style={{fontSize:13,padding:'10px 16px'}} onClick={() => setPreviewVisible(!previewVisible)}>{t('static.buttons.viewData','View Data')}</button>
          </div>
          <pre className="data-pre" id="dataPreview" style={{display: previewVisible ? 'block' : 'none'}}>{previewData}</pre>
        </div>
      ) : null}
    </div>
  );
}

function ThankYou({t, developerMode, exportJSON, exportCSV}) {
  return (
    <div className="thankyou-card">
      <div className="ty-check">✓</div>
      <h1>{t('static.thankYouTitle','Survey Complete')}</h1>
      <p>{t('static.thankYouBody','Thank you for participating. Your responses contribute to research on youth labour market transitions in Sri Lanka and will help NYSC design better programmes for young people.')}</p>
      <p style={{fontSize:14,color:'var(--dim)'}}>Your response has been recorded. You may now close this page.</p>
      {developerMode ? (
        <div style={{marginTop:28,borderTop:'1px solid var(--border)',paddingTop:20}}>
          <div className="export-row" style={{justifyContent:'center'}}>
            <button className="btn" style={{background:'var(--bou)',color:'white'}} onClick={exportJSON}>{t('static.buttons.exportJson','↓ Export JSON')}</button>
            <button className="btn" style={{background:'var(--sdt)',color:'white'}} onClick={exportCSV}>{t('static.buttons.exportCsv','↓ Export CSV Row')}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResumePrompt({t, resumeDraft, startFresh}) {
  return (
    <div className="resume-card">
      <h2>{t('static.resumeTitle','Continue where you left off?')}</h2>
      <p>{t('static.resumeBody','You have an unfinished survey saved on this device. Would you like to continue from where you stopped, or start over?')}</p>
      <div className="resume-actions">
        <button className="btn btn-next" onClick={resumeDraft}>{t('static.resumeBtn','Continue Survey')}</button>
        <button className="btn btn-back" onClick={startFresh}>{t('static.startOver','Start Over')}</button>
      </div>
    </div>
  );
}

export default App;
`;

const main = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

const index = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Youth Transition Survey — NYSC Sri Lanka</title>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
`;

fs.mkdirSync(path.join(root, 'src'), { recursive: true });
fs.writeFileSync(path.join(root, 'src', 'surveyData.js'), surveyData);
fs.writeFileSync(path.join(root, 'src', 'styles.css'), `${style.trim()}\n`);
fs.writeFileSync(path.join(root, 'src', 'App.jsx'), app);
fs.writeFileSync(path.join(root, 'src', 'main.jsx'), main);
fs.writeFileSync(path.join(root, 'index.html'), index);
