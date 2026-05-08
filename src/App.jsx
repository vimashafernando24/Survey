import React, { useEffect, useMemo, useState } from 'react';
import {
  FIELD_RULES,
  Q,
  SEC_ORDER,
  SECTION_SUPPORT,
  SECTIONS_META,
  translations
} from './surveyData.js';
import MobileSectionNav from './components/MobileSectionNav.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import SectionChips from './components/SectionChips.jsx';
import SectionReview from './components/SectionReview.jsx';
import Sidebar from './components/Sidebar.jsx';
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
  const [reviewMode, setReviewMode] = useState(null);
  const [reviewEditContext, setReviewEditContext] = useState(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

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

  useEffect(() => {
    if(!savedFeedback) return;
    const timer = setTimeout(() => setSavedFeedback(false), 2500);
    return () => clearTimeout(timer);
  }, [savedFeedback]);

  const t = (path, fallback) => {
    let value = readPath(translations[currentLang], path);
    if (value !== undefined && value !== null) return value;
    value = readPath(translations.en, path);
    return value !== undefined && value !== null ? value : fallback || '';
  };

  const getSectionLabel = (sec) => t(`sections.${sec}`, SECTIONS_META[sec]?.label || sec);
  const translateQField = (question, field) => t(`questions.${question.id}.${field}`, question[field] || '');
  const translateOptionLabel = (qId, index, defaultLabel) => t(`questions.${qId}.opts.${index}.l`, defaultLabel);
  const translateOptionSub = (qId, index, defaultSub) => qId && defaultSub ? t(`questions.${qId}.opts.${index}.s`, defaultSub) : defaultSub;

  const getValidationError = (question, val) => {
    if(question.type !== 'number') return null;
    if(val === undefined || val === '') return null;
    const num = Number(val);
    if(isNaN(num)) return null;
    const rule = question.var ? FIELD_RULES[question.var] : null;
    if(rule){
      if(num < rule.min || num > rule.max){
        const msg = t('static.validationRange',
          `Please enter a value between ${rule.min} and ${rule.max}.`);
        return msg.replace('{min}', rule.min).replace('{max}', rule.max);
      }
    } else if(num < 0){
      return t('static.validationNegative','Please enter 0 or a positive number.');
    }
    if(['household_workers','household_unemployed'].includes(question.var)){
      const hsSizeQ = Q.find(q => q.var === 'household_size');
      if(hsSizeQ){
        const hsSize = Number(answers[hsSizeQ.id]);
        if(!isNaN(hsSize) && hsSize > 0 && num > hsSize){
          return t('static.validationExceedsHousehold',
            `This cannot exceed the total household size (${hsSize}).`);
        }
      }
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

  const getBranchSection = (answerSet = answers) => {
    switch(answerSet.C20){
      case 'education': return 'D';
      case 'unemployed':
      case 'finished_plan_look': return 'E';
      case 'working':
      case 'finished_plan_work':
      case 'temp_absent': return 'F';
      case 'home_duties':
      case 'other_inactive': return 'G';
      default: return answerSet.C20 ? 'G' : null;
    }
  };

  const getVisibleSections = (answerSet = answers) => {
    return ['A','B','C','D','E','F','G','END'];
  };

  const getPathSections = (answerSet = answers) => {
    const branchSec = getBranchSection(answerSet);
    return branchSec ? ['A','B','C',branchSec,'END'] : ['A','B','C','END'];
  };

  const isAnswerPresent = (question, answerSet = answers) => {
    const value = answerSet[question.id];
    if(question.type === 'radio' || question.type === 'select') return !!value;
    if(question.type === 'number') return value !== undefined && value !== '';
    if(question.type === 'checkbox') return Array.isArray(value) && value.length > 0;
    return true;
  };

  const hasStoredAnswer = (question, answerSet = answers) => {
    const value = answerSet[question.id];
    if(value === undefined || value === '') return false;
    if(Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  const getRequiredSectionQuestions = (sec, answerSet = answers) => {
    const divider = Q.find(q => q.sec === sec && q.type === 'divider');
    if(!divider){
      return Q.filter(question =>
        question.sec === sec &&
        question.var &&
        ['radio','select','number','checkbox'].includes(question.type) &&
        !shouldSkip(question, answerSet)
      );
    }
    const reachable = [];
    let walkedId = divider.id;
    const visited = new Set();
    while(walkedId && !visited.has(walkedId)){
      visited.add(walkedId);
      const wq = getQ(walkedId);
      if(!wq || wq.sec !== sec) break;
      if(wq.var && ['radio','select','number','checkbox'].includes(wq.type) && !shouldSkip(wq, answerSet)){
        reachable.push(wq);
      }
      const nextId = getNext(wq, answerSet);
      if(!nextId) break;
      const nextWq = getQ(nextId);
      if(!nextWq || nextWq.sec !== sec) break;
      walkedId = nextId;
    }
    return reachable;
  };

  const isSectionComplete = (sec, answerSet = answers, pathSections = getPathSections(answerSet)) => {
    if(sec === 'A') return false;
    if(!pathSections.includes(sec)) return false;
    if(sec === 'END') return submitted;
    const requiredQuestions = getRequiredSectionQuestions(sec, answerSet);
    if(requiredQuestions.length === 0){
      const activeSec = getQ(currentId)?.sec;
      return submitted || pathSections.indexOf(sec) < pathSections.indexOf(activeSec);
    }
    return requiredQuestions.every(question => isAnswerPresent(question, answerSet));
  };

  const getSectionStates = (visibleSections, activeSec) => {
    const branchSec = getBranchSection();
    const pathSections = getPathSections();
    const branchSections = new Set(['D','E','F','G']);
    return visibleSections.reduce((states, sec) => {
      const pathIndex = pathSections.indexOf(sec);
      const isBranch = branchSections.has(sec);
      const onPath = pathIndex >= 0;
      const active = sec === activeSec;
      const hasAnswers = Q.some(q => q.sec === sec && q.var && hasStoredAnswer(q, answers));
      // Include off-path sections (e.g. G reached via F→G re-routing) in completion check
      const pathForCompletion = hasAnswers && !onPath ? [...pathSections, sec] : pathSections;
      const completed = (onPath || hasAnswers) && isSectionComplete(sec, answers, pathForCompletion);
      const previousComplete = onPath && pathSections.slice(0, pathIndex).every(
        pathSec => isSectionComplete(pathSec, answers, pathSections)
      );
      const available = onPath && !active && !completed && previousComplete;
      // notApplicable only if truly off-path with no answers and not active
      const notApplicable = !!branchSec && isBranch && sec !== branchSec && !active && !hasAnswers;
      states[sec] = {
        active,
        completed,
        available,
        locked: !active && !completed && !available && !hasAnswers,
        notApplicable,
        selectedBranch: !!branchSec && (sec === branchSec || (isBranch && hasAnswers && !onPath))
      };
      return states;
    }, {});
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
    const currentSec = getQ(currentId)?.sec;
    const nextSec = nextQuestion.sec;
    const nextHistory = [...historySet, currentId];
    setHistory(nextHistory);
    setCurrentId(nextId);
    if(!submitted) setSubmitted(false);
    setReviewMode(null);
    setReviewEditContext(null);
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
    if(!submitted) setSubmitted(false);
    setReviewMode(null);
    setReviewEditContext(null);
    setPreviewVisible(false);
    saveDraft(answers, nextHistory, nextId, currentLang);
  };

  const openSectionReview = (section) => {
    setReviewMode({type:'section', section});
    setReviewEditContext(null);
    setValidationAttempted(false);
    setFieldTouched(false);
    setPreviewVisible(false);
  };

  const closeReview = () => {
    setReviewMode(null);
    setReviewEditContext(null);
    setValidationAttempted(false);
    setFieldTouched(false);
  };

  const goToSection = (targetSec, sectionState = {}) => {
    if(sectionState.locked || sectionState.notApplicable) return;

    // During edit-from-review: clicking the progress section returns to saved progress
    if(reviewEditContext) {
      const progressSec = getQ(reviewEditContext.progressId)?.sec;
      if(targetSec === progressSec) {
        returnFromReviewEdit('progress');
        return;
      }
    }

    // During section review (not edit): clicking the active (progress) section closes review
    if(reviewMode && !reviewEditContext) {
      if(targetSec === q?.sec) {
        closeReview();
        return;
      }
    }

    if(submitted && targetSec === 'END'){
      setReviewMode(null);
      return;
    }
    if(sectionState.completed && targetSec !== 'END') {
      openSectionReview(targetSec);
      return;
    }

    const firstQInSec = Q.find(qq => qq.sec === targetSec && qq.type !== 'divider');
    if(firstQInSec) {
      goTo(firstQInSec.id);
    }
  };

  const editReviewQuestion = (qId) => {
    if(submitted) return;
    const nextQ = getQ(qId);
    if(!nextQ) return;
    setReviewEditContext({
      reviewMode,
      progressId: currentId,
      progressHistory: history
    });
    setReviewMode(null);
    setValidationAttempted(false);
    setFieldTouched(false);
    setSavedFeedback(false);
    setCurrentId(qId);
    if(!submitted) setSubmitted(false);
    setPreviewVisible(false);
  };

  const validateCurrentQuestion = () => {
    if(!q) return true;
    if(!checkHasAnswer(q)){
      setValidationAttempted(true);
      return false;
    }
    const valErr = getValidationError(q, answers[q.id]);
    if(valErr){
      setValidationAttempted(true);
      setFieldTouched(true);
      return false;
    }
    setValidationAttempted(false);
    setFieldTouched(false);
    return true;
  };

  const returnFromReviewEdit = (destination) => {
    if(!reviewEditContext || !validateCurrentQuestion()) return;
    const progressId = reviewEditContext.progressId;
    const progressHistory = reviewEditContext.progressHistory || [];
    setCurrentId(progressId);
    setHistory(progressHistory);
    if(destination === 'review'){
      setReviewMode(reviewEditContext.reviewMode);
    } else {
      setReviewMode(null);
    }
    setReviewEditContext(null);
    setSavedFeedback(false);
    setPreviewVisible(false);
    saveDraft(answers, progressHistory, progressId, currentLang);
  };

  const checkHasAnswer = (question) => {
    return isAnswerPresent(question);
  };

  const handleNext = () => {
    if(!q) return;
    if(!validateCurrentQuestion()) return;
    goTo(getNext(q));
  };

  const pickRadio = (qId, val) => {
    setAnswers(prev => ({...prev, [qId]: val}));
    if(reviewEditContext) setSavedFeedback(true);
  };

  const toggleChk = (qId, val) => {
    setAnswers(prev => {
      const arr = prev[qId] ? [...prev[qId]] : [];
      const idx = arr.indexOf(val);
      if(idx >= 0) arr.splice(idx, 1);
      else arr.push(val);
      return {...prev, [qId]: arr};
    });
    if(reviewEditContext) setSavedFeedback(true);
  };

  const updateNumber = (qId, val) => {
    setFieldTouched(true);
    setAnswers(prev => ({...prev, [qId]: val}));
    if(reviewEditContext) setSavedFeedback(true);
  };

  const updateSelect = (qId, val) => {
    setAnswers(prev => ({...prev, [qId]: val}));
    if(reviewEditContext) setSavedFeedback(true);
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

  const buildPathMetadata = (answerSet = answers) => {
    const activeBranch = getBranchSection(answerSet) || 'unknown';
    const activeSections = getPathSections(answerSet);
    const activeSectionSet = new Set(activeSections);
    const answeredQuestions = Q.filter(question => question.var && hasStoredAnswer(question, answerSet));
    const answeredSections = [...new Set(answeredQuestions.map(question => question.sec))];
    const offPathSections = answeredSections.filter(section => !activeSectionSet.has(section));
    const activeQuestionIdSet = new Set();

    activeSections.forEach(section => {
      getRequiredSectionQuestions(section, answerSet).forEach(question => {
        if(hasStoredAnswer(question, answerSet)){
          activeQuestionIdSet.add(question.id);
        }
      });
    });

    const offPathQuestionIds = answeredQuestions
      .filter(question => !activeQuestionIdSet.has(question.id))
      .map(question => question.id);

    return {
      active_branch: activeBranch,
      active_sections: activeSections,
      answered_sections: answeredSections,
      off_path_sections: offPathSections,
      off_path_question_ids: offPathQuestionIds,
      active_question_ids: [...activeQuestionIdSet]
    };
  };

  const buildData = () => {
    const out = {_meta:{
      timestamp:new Date().toISOString(),
      version:'SWTS+Bourdieu+SDT',
      branch:answers.C20||'unknown',
      frameworks:['SWTS','Bourdieu','SDT'],
      ...buildPathMetadata(answers)
    }};
    Q.forEach(question => { if(question.var && answers[question.id] !== undefined) out[question.var] = answers[question.id]; });
    out.selected_language = currentLang;
    return out;
  };

  const exportJSON = () => {
    const data = buildData();
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `swts_response_${Date.now()}.json`;
    a.click();
  };

  const exportCSV = () => {
    const data = buildData();
    delete data._meta;
    const keys = Object.keys(data);
    const vals = keys.map(k=>{
      const v = data[k];
      return '"' + String(Array.isArray(v) ? v.join('|') : v).replace(/"/g,'""') + '"';
    });
    const csv = keys.join(',') + '\n' + vals.join(',');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `swts_response_${Date.now()}.csv`;
    a.click();
  };

  const submitSurvey = () => {
    if(submitting || submitted) return;
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
          setReviewMode(null);
          setReviewEditContext(null);
          setSubmitting(false);
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
      setReviewMode(null);
      setReviewEditContext(null);
      setSubmitting(false);
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
    setReviewMode(null);
    setReviewEditContext(null);
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
    setSubmitting(false);
    setReviewMode(null);
    setReviewEditContext(null);
  };

  const getSectionReviewQuestions = (section) => (
    Q.filter(question =>
      question.sec === section &&
      question.var &&
      hasStoredAnswer(question)
    )
  );

  const getReviewQuestions = () => {
    if(!reviewMode) return [];
    if(reviewMode.type === 'section') return getSectionReviewQuestions(reviewMode.section);
    return [];
  };

  const getFinalReviewSections = () => {
    const path = getPathSections().filter(s => s !== 'END');
    const offPath = ['D','E','F','G'].filter(s =>
      !path.includes(s) && Q.some(q => q.sec === s && q.var && hasStoredAnswer(q))
    );
    return [...path, ...offPath]
      .map(section => ({
        section,
        label: getSectionLabel(section),
        questions: getSectionReviewQuestions(section)
      }))
      .filter(group => group.questions.length > 0);
  };

  const visibleSections = getVisibleSections();
  const pct = q?.type === 'end' || submitted ? 100 : getPct();

  // Chips for current section — only during normal question flow
  let sectionChips = null;
  if (!reviewMode && !reviewEditContext && q?.sec && q.sec !== 'A' && q.sec !== 'END') {
    const chipSec = q.sec;
    const rawChips = Q.filter(question =>
      question.sec === chipSec &&
      ['radio','select','number','checkbox'].includes(question.type) &&
      !shouldSkip(question, answers)
    );
    if (rawChips.length > 0) {
      sectionChips = rawChips.map(question => ({
        id: question.id,
        isAnswered: hasStoredAnswer(question),
        isCurrent: question.id === currentId
      }));
    }
  }

  const hasSurveyStarted = history.length > 0;
  const topSec = reviewMode?.type === 'section'
    ? getSectionLabel(reviewMode.section)
    : (q ? getSectionLabel(q.sec) : '');
  const previewData = useMemo(() => JSON.stringify(buildData(), null, 2), [answers, currentLang]);
  const navCurrentSec = reviewEditContext
    ? getQ(reviewEditContext.progressId)?.sec
    : (submitted ? 'END' : q?.sec);
  const sectionStates = getSectionStates(visibleSections, navCurrentSec);
  const isBranchDivider = !!answers.C20 && q?.type === 'divider' && ['D','E','F','G'].includes(q.sec);
  const reviewQuestions = getReviewQuestions();
  const reviewTitle = t('static.reviewAnswers','Review answers');
  const reviewEyebrow = reviewMode?.type === 'section'
    ? getSectionLabel(reviewMode.section)
    : t('static.logo','Youth Transition Survey');
  const finalReviewSections = getFinalReviewSections();

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
            <button key={lang} className={`lang-btn${currentLang === lang ? ' active' : ''}`} id={`lang-${lang}`} onClick={() => switchLang(lang)}>{label}</button>
          ))}
        </div>
      </div>
      <ProgressBar pct={pct} />
      <MobileSectionNav
        visibleSections={visibleSections}
        sectionStates={sectionStates}
        getSectionLabel={getSectionLabel}
        onSectionClick={goToSection}
      />

      <div className="layout">
        <nav className="sidebar">
          <div className="sb-title" id="sectionsLabel">{t('static.sections','Sections')}</div>
          <Sidebar
            visibleSections={visibleSections}
            sectionStates={sectionStates}
            getSectionLabel={getSectionLabel}
            onSectionClick={goToSection}
          />
          <SectionChips chips={sectionChips} onChipClick={(qId) => goTo(qId)} />
          <div className="legend">
            <div className="leg-title">{t('static.frameworkKey','Framework Key')}</div>
            <div className="leg-row"><span className="badge SWTS">SWTS</span><span className="leg-txt">ILO School-to-Work</span></div>
            <div className="leg-row"><span className="badge Bourdieu">BOU</span><span className="leg-txt">Bourdieu Capital</span></div>
            <div className="leg-row"><span className="badge SDT">SDT</span><span className="leg-txt">Self-Determination</span></div>
          </div>
        </nav>
        <main className="main" id="mainArea">
          {reviewMode ? (
            <SectionReview
              title={reviewTitle}
              eyebrow={reviewEyebrow}
              questions={reviewQuestions}
              answers={answers}
              translateQField={translateQField}
              translateOptionLabel={translateOptionLabel}
              t={t}
              readOnly={submitted}
              onBack={closeReview}
              onEdit={editReviewQuestion}
            />
          ) : showResume ? (
            <ResumePrompt t={t} resumeDraft={resumeDraft} startFresh={startFresh} />
          ) : submitted ? (
            <ThankYou
              t={t}
              developerMode={developerMode}
              exportJSON={exportJSON}
              exportCSV={exportCSV}
              finalReviewSections={finalReviewSections}
              answers={answers}
              translateQField={translateQField}
              translateOptionLabel={translateOptionLabel}
            />
          ) : q?.type === 'info' ? (
            <InfoCard q={q} t={t} getSectionLabel={getSectionLabel} translateQField={translateQField} goTo={goTo} hasSurveyStarted={hasSurveyStarted} onGoToProgress={goBack} />
          ) : q?.type === 'divider' ? (
            <DividerCard q={q} t={t} getNext={getNext} getSectionLabel={getSectionLabel} translateQField={translateQField} history={history} goBack={goBack} goTo={goTo} branchNotice={isBranchDivider} />
          ) : q?.type === 'end' ? (
            <ConfirmCard
              t={t}
              history={history}
              goBack={goBack}
              submitSurvey={submitSurvey}
              submitting={submitting}
              developerMode={developerMode}
              exportJSON={exportJSON}
              exportCSV={exportCSV}
              previewVisible={previewVisible}
              setPreviewVisible={setPreviewVisible}
              previewData={previewData}
              finalReviewSections={finalReviewSections}
              answers={answers}
              translateQField={translateQField}
              translateOptionLabel={translateOptionLabel}
              onEdit={editReviewQuestion}
            />
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
              reviewEditContext={reviewEditContext}
              savedFeedback={savedFeedback}
              onReturnToReview={() => returnFromReviewEdit('review')}
              onReturnToProgress={() => returnFromReviewEdit('progress')}
            />
          ) : null}
        </main>
      </div>
    </>
  );
}

function InfoCard({q, t, getSectionLabel, translateQField, goTo, hasSurveyStarted, onGoToProgress}) {
  return (
    <div className="info-card">
      <div className="q-section">{getSectionLabel(q.sec)}</div>
      <h1>{translateQField(q,'title')}</h1>
      <div dangerouslySetInnerHTML={{__html: translateQField(q,'body')}} />
      <div className="nav" style={{marginTop:28}}>
        {hasSurveyStarted ? (
          <button className="btn btn-next" onClick={onGoToProgress}>Go to current progress →</button>
        ) : (
          <button className="btn btn-next" onClick={() => goTo(q.next)}>{t('static.buttons.begin','Begin Survey →')}</button>
        )}
      </div>
    </div>
  );
}

function DividerCard({q, t, getNext, getSectionLabel, translateQField, history, goBack, goTo, branchNotice}) {
  const next = getNext(q);
  const support = SECTION_SUPPORT[q.sec] || '';
  return (
    <>
      <div className="div-card">
        <h2>{translateQField(q,'title')}</h2>
        <p>{translateQField(q,'body')}</p>
        {branchNotice ? (
          <div className="branch-notice">Based on your answer, this is your survey path.</div>
        ) : null}
        {support ? <div className="sec-support">{support}</div> : null}
      </div>
      <div className="nav">
        {history.length > 0 ? <button className="btn btn-back" onClick={goBack}>{t('static.buttons.back','← Back')}</button> : null}
        <button className="btn btn-next" onClick={() => goTo(next)}>{t('static.buttons.continue','Continue →')}</button>
      </div>
    </>
  );
}

function ConfirmCard({
  t,
  history,
  goBack,
  submitSurvey,
  submitting,
  developerMode,
  exportJSON,
  exportCSV,
  previewVisible,
  setPreviewVisible,
  previewData,
  finalReviewSections,
  answers,
  translateQField,
  translateOptionLabel,
  onEdit
}) {
  return (
    <div className="confirm-card">
      <h2>{t('static.confirmTitle','Almost there — please review and submit')}</h2>
      <p>{t('static.confirmBody','You have completed all the survey questions. Your responses help us understand youth transitions in Sri Lanka and improve NYSC programmes for young people.')}</p>
      <FinalReview
        title="Review answers"
        sections={finalReviewSections}
        answers={answers}
        translateQField={translateQField}
        translateOptionLabel={translateOptionLabel}
        t={t}
        readOnly={false}
        onEdit={onEdit}
      />
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

function formatReviewAnswer(question, answers, translateOptionLabel) {
  const value = answers[question.id];
  if(value === undefined || value === '' || (Array.isArray(value) && value.length === 0)){
    return 'Not answered';
  }
  if(question.type === 'checkbox'){
    return (Array.isArray(value) ? value : []).map(v => {
      const index = (question.opts || []).findIndex(o => o.v === v);
      const opt = index >= 0 ? question.opts[index] : null;
      return opt ? translateOptionLabel(question.id, index, opt.l) : v;
    }).join(', ');
  }
  if(question.type === 'radio' || question.type === 'select'){
    const index = (question.opts || []).findIndex(o => o.v === value);
    const opt = index >= 0 ? question.opts[index] : null;
    return opt ? translateOptionLabel(question.id, index, opt.l) : value;
  }
  return String(value);
}

function FinalReview({title, sections, answers, translateQField, translateOptionLabel, t, readOnly, onEdit}) {
  return (
    <div className="final-review">
      <h3>{title}</h3>
      {sections.length === 0 ? (
        <p className="review-empty">{t('static.noReviewAnswers','No answered questions in this section yet.')}</p>
      ) : (
        sections.map((group, index) => (
          <details className="final-review-section" key={group.section} open={index === 0}>
            <summary>{group.label}</summary>
            <div className="review-list">
              {group.questions.map(question => (
                <div className="review-item" key={question.id}>
                  <div className="review-question">
                    <span className="q-id">{question.id}</span>
                    <span>{translateQField(question, 'text')}</span>
                  </div>
                  <div className="review-answer">{formatReviewAnswer(question, answers, translateOptionLabel)}</div>
                  {!readOnly ? (
                    <button className="btn btn-back review-edit" onClick={() => onEdit(question.id)}>{t('static.buttons.edit','Edit')}</button>
                  ) : null}
                </div>
              ))}
            </div>
          </details>
        ))
      )}
    </div>
  );
}

function ThankYou({t, developerMode, exportJSON, exportCSV, finalReviewSections, answers, translateQField, translateOptionLabel}) {
  return (
    <div className="thankyou-card">
      <div className="ty-check">✓</div>
      <h1>Submitted successfully</h1>
      <p style={{fontSize:14,color:'var(--positive)',fontWeight:700,marginBottom:12}}>{t('static.thankYouTitle','Survey Complete')}</p>
      <p>{t('static.thankYouBody','Thank you for participating. Your responses contribute to research on youth labour market transitions in Sri Lanka and will help NYSC design better programmes for young people.')}</p>
      <p style={{fontSize:14,color:'var(--dim)'}}>Your response has been recorded. You may now close this page.</p>
      <FinalReview
        title="Review answers"
        sections={finalReviewSections}
        answers={answers}
        translateQField={translateQField}
        translateOptionLabel={translateOptionLabel}
        t={t}
        readOnly
      />
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
