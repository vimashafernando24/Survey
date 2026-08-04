import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import ResearchRabbitGuide from './components/ResearchRabbitGuide.jsx';
import ResponsiveMascotImage from './components/ResponsiveMascotImage.jsx';
import { ResearchFoundationsPage, ResearchNav } from './components/ResearchFoundationsPage.jsx';
import { insightData, researchPages } from './insightData.js';
import { getSectionTheme, sectionThemeStyle } from './data/sectionThemes.js';
import './styles.css';

const DRAFT_KEY = 'nysc_swts_v2';
const SESSION_KEY = 'nysc_swts_session_id';
const enableApiSubmit = true;
const developerMode = false;
const SEC_EST = {INTRO:1,A:22,B:22,C:14,D:29,E:55,F:10,END:0};

function splitDisplaySectionLabel(label) {
  const match = String(label || '').match(/^(Section\s+[A-Z])\s+—\s+(.+)$/);
  if (match) return { kicker: match[1].toUpperCase(), title: match[2] };
  return { kicker: '', title: label || '' };
}

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

function getSessionId(){
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if(!id){
      const random = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      id = `nysc-${random}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch(e){
    return `nysc-${Date.now()}`;
  }
}

function getQ(id){ return Q.find(q=>q.id===id); }

function isAnswerableQuestion(question) {
  return ['radio','select','number','checkbox'].includes(question.type);
}

function hasAnswerValue(question, answerSet) {
  const value = answerSet[question.id];
  if(question.type === 'radio' || question.type === 'select') return !!value;
  if(question.type === 'number') return value !== undefined && value !== '';
  if(question.type === 'checkbox') return Array.isArray(value) && value.length > 0;
  return true;
}

// Walk the question graph and return question IDs that are reachable and not skipped.
function computeActivePathIds(answerSet) {
  const active = [];
  let id = 'INTRO';
  const vis = new Set();
  while (id && !vis.has(id)) {
    vis.add(id);
    const q = getQ(id);
    if (!q) break;
    const skipped = q.skip && q.skip(answerSet);
    if (!skipped) {
      active.push(id);
      if (q.type === 'end') break;
      if (isAnswerableQuestion(q) && !hasAnswerValue(q, answerSet)) break;
    }
    if (!q.next) break;
    id = typeof q.next === 'function' ? q.next(answerSet) : q.next;
  }
  return active;
}

function computeActivePath(answerSet) {
  return new Set(computeActivePathIds(answerSet));
}

// Walk the graph and return the first unanswered question ID plus the history array up to it.
function computePathAndFirstUnanswered(answerSet) {
  const hist = [];
  let id = 'INTRO';
  const vis = new Set();
  while (id && !vis.has(id)) {
    vis.add(id);
    const q = getQ(id);
    if (!q) break;
    const skipped = q.skip && q.skip(answerSet);
    if (!skipped) {
      if (q.type === 'end') return { firstUnanswered: q.id, history: hist };
      if (q.type !== 'info' && q.type !== 'divider') {
        if (!hasAnswerValue(q, answerSet)) return { firstUnanswered: id, history: hist };
      }
      hist.push(id);
    }
    if (!q.next) break;
    id = typeof q.next === 'function' ? q.next(answerSet) : q.next;
  }
  return { firstUnanswered: 'END_SCREEN', history: hist };
}

function App() {
  const [currentLang, setCurrentLang] = useState('en');
  const [languageSelected, setLanguageSelected] = useState(false);
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
  const [reviewChipEditMode, setReviewChipEditMode] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [activeResearchPage, setActiveResearchPage] = useState(null);
  const [dismissedInsights, setDismissedInsights] = useState(() => new Set());
  const [pathChangeConfirm, setPathChangeConfirm] = useState(null);

  const _browserNavRef = useRef(null);

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
    document.documentElement.lang = currentLang === 'si' ? 'si' : currentLang === 'ta' ? 'ta' : 'en';
  }, [currentLang]);

  useEffect(() => {
    if(!savedFeedback) return;
    const timer = setTimeout(() => setSavedFeedback(false), 2500);
    return () => clearTimeout(timer);
  }, [savedFeedback]);

  useEffect(() => {
    // Tag the current history entry, then push one extra so popstate fires before leaving.
    window.history.replaceState({ nysc: 0 }, '');
    window.history.pushState({ nysc: 1 }, '');
    const onPopState = () => {
      const nav = _browserNavRef.current;
      if (!nav) return;
      let handled = false;
      if (nav.pathChangeConfirm) {
        nav.cancelPathChange(); handled = true;
      } else if (nav.activeResearchPage) {
        nav.closeResearchPage(); handled = true;
      } else if (nav.reviewEditContext) {
        nav.returnFromReviewEdit('review'); handled = true;
      } else if (nav.reviewMode) {
        nav.closeReview(); handled = true;
      } else if (nav.history.length > 0 && !nav.submitted) {
        nav.goBack(); handled = true;
      }
      // If not handled (first screen / post-submit) let the browser navigate away.
      if (handled) window.history.pushState({ nysc: 1 }, '');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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
  const translateInsight = (questionId, insight) => {
    if(!insight) return null;
    return {
      ...insight,
      rabbitPrompt: t(`insights.${questionId}.rabbitPrompt`, insight.rabbitPrompt),
      whyItMatters: t(`insights.${questionId}.whyItMatters`, insight.whyItMatters),
      quoteInsight: insight.quoteInsight ? t(`insights.${questionId}.quoteInsight`, insight.quoteInsight) : insight.quoteInsight
    };
  };

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
            `This cannot exceed the total household size (${hsSize}).`).replace('{size}', hsSize);
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
    switch(answerSet.B20){
      case 'education': return 'C';
      case 'unemployed':
      case 'finished_plan_look': return 'D';
      case 'working':
      case 'finished_plan_work':
      case 'temp_absent': return 'E';
      case 'home_duties':
      case 'other_inactive': return 'F';
      default: return answerSet.B20 ? 'F' : null;
    }
  };

  const getVisibleSections = (answerSet = answers) => {
    return ['INTRO','A','B','C','D','E','F','END'];
  };

  const getPathSections = (answerSet = answers) => {
    const activePathIds = computeActivePathIds(answerSet);
    const sections = [];
    activePathIds.forEach(id => {
      const question = getQ(id);
      if(question.sec && !sections.includes(question.sec)) sections.push(question.sec);
    });
    return sections.length ? sections : ['INTRO'];
  };

  const isAnswerPresent = (question, answerSet = answers) => {
    return hasAnswerValue(question, answerSet);
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
    if(sec === 'INTRO') return false;
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
    const pathSections = getPathSections();
    const branchSections = new Set(['C','D','E','F']);
    const hasBranchAnswer = !!answers.B20;
    return visibleSections.reduce((states, sec) => {
      // INTRO has no answerable questions — treat as done once the user has moved forward
      if (sec === 'INTRO') {
        states[sec] = {
          active: activeSec === 'INTRO',
          completed: history.length > 0,
          available: false,
          locked: false,
          notApplicable: false,
          offPathWithAnswers: false,
          selectedBranch: false
        };
        return states;
      }
      const pathIndex = pathSections.indexOf(sec);
      const isBranch = branchSections.has(sec);
      const onPath = pathIndex >= 0;
      const active = sec === activeSec;
      const hasAnswers = Q.some(q => q.sec === sec && q.var && hasStoredAnswer(q, answers));
      // Only sections on the current path can be marked complete
      const completed = onPath && isSectionComplete(sec, answers, pathSections);
      // INTRO is always considered "done" for the purpose of unlocking Section A
      const previousComplete = onPath && pathSections.slice(0, pathIndex).every(
        pathSec => pathSec === 'INTRO' || isSectionComplete(pathSec, answers, pathSections)
      );
      const available = onPath && !active && !completed && previousComplete;
      // Branch section that has stale answers from a previous path — show as muted, not navigable
      const offPathWithAnswers = hasBranchAnswer && isBranch && !onPath && !active && hasAnswers;
      const notApplicable = hasBranchAnswer && isBranch && !onPath && !active && !hasAnswers;
      states[sec] = {
        active,
        completed,
        available,
        locked: !active && !completed && !available && !hasAnswers && !offPathWithAnswers,
        notApplicable,
        offPathWithAnswers,
        selectedBranch: hasBranchAnswer && isBranch && onPath
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
    setActiveResearchPage(null);
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
    setActiveResearchPage(null);
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
    setActiveResearchPage(null);
    setReviewMode({type:'section', section});
    setReviewEditContext(null);
    setValidationAttempted(false);
    setFieldTouched(false);
    setPreviewVisible(false);
  };

  const closeReview = () => {
    setActiveResearchPage(null);
    setReviewMode(null);
    setReviewEditContext(null);
    setReviewChipEditMode(false);
    setValidationAttempted(false);
    setFieldTouched(false);
  };

  const openIntroPage = () => {
    setActiveResearchPage(null);
    setReviewMode(null);
    setReviewEditContext(null);
    setValidationAttempted(false);
    setFieldTouched(false);
    setPreviewVisible(false);

    if(currentId === 'INTRO') return;

    const nextHistory = [...history, currentId];
    setHistory(nextHistory);
    setCurrentId('INTRO');
    saveDraft(answers, history, currentId, currentLang);
  };

  const goToSection = (targetSec, sectionState = {}) => {
    if(targetSec === 'INTRO') {
      openIntroPage();
      return;
    }

    if(sectionState.locked || sectionState.notApplicable || sectionState.offPathWithAnswers) return;

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
      progressHistory: history,
      answersSnapshot: { ...answers }
    });
    setReviewMode(null);
    setValidationAttempted(false);
    setFieldTouched(false);
    setSavedFeedback(false);
    setCurrentId(qId);
    if(!submitted) setSubmitted(false);
    setPreviewVisible(false);
    setActiveResearchPage(null);
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

    const snapshot = reviewEditContext.answersSnapshot;
    if (snapshot) {
      const getSecs = path => new Set([...path].map(id => getQ(id)?.sec).filter(s => s && s !== 'INTRO' && s !== 'END'));
      const oldSecs = getSecs(computeActivePath(snapshot));
      const newSecs = getSecs(computeActivePath(answers));
      let pathChanged = oldSecs.size !== newSecs.size;
      if (!pathChanged) { for (const s of oldSecs) if (!newSecs.has(s)) { pathChanged = true; break; } }
      if (pathChanged) { setPathChangeConfirm({ destination }); return; }
    }

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

  const confirmPathChange = () => {
    const { firstUnanswered, history: newHistory } = computePathAndFirstUnanswered(answers);
    const firstQuestion = getQ(firstUnanswered);
    const sectionDivider = firstQuestion?.type !== 'divider' && firstQuestion?.sec
      ? Q.find(question => question.sec === firstQuestion.sec && question.type === 'divider')
      : null;
    const redirectId = sectionDivider?.id || firstUnanswered;
    const dividerIndex = sectionDivider ? newHistory.indexOf(sectionDivider.id) : -1;
    const redirectHistory = sectionDivider && dividerIndex >= 0
      ? newHistory.slice(0, dividerIndex)
      : newHistory;
    setPathChangeConfirm(null);
    setCurrentId(redirectId);
    setHistory(redirectHistory);
    setReviewMode(null);
    setReviewEditContext(null);
    setSavedFeedback(false);
    setPreviewVisible(false);
    saveDraft(answers, redirectHistory, redirectId, currentLang);
  };

  const cancelPathChange = () => {
    const ctx = reviewEditContext;
    const dest = pathChangeConfirm?.destination;
    const snapshot = ctx?.answersSnapshot;
    const progressId = ctx?.progressId;
    const progressHistory = ctx?.progressHistory || [];
    setPathChangeConfirm(null);
    if (snapshot) setAnswers({ ...snapshot });
    setCurrentId(progressId);
    setHistory(progressHistory);
    if (dest === 'review') { setReviewMode(ctx?.reviewMode || null); } else { setReviewMode(null); }
    setReviewEditContext(null);
    setSavedFeedback(false);
    setPreviewVisible(false);
    saveDraft(snapshot || answers, progressHistory, progressId, currentLang);
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

  const buildPathMetadata = (answerSet = answers) => {
    const activeBranch = getBranchSection(answerSet) || 'unknown';
    const activeSections = getPathSections(answerSet);
    const activeSectionSet = new Set(activeSections);
    const activePath = computeActivePath(answerSet);
    const answeredQuestions = Q.filter(question => question.var && hasStoredAnswer(question, answerSet));
    const answeredSections = [...new Set(answeredQuestions.map(question => question.sec))];
    const offPathSections = answeredSections.filter(section => !activeSectionSet.has(section));
    const activeQuestionIdSet = new Set(
      answeredQuestions
        .filter(question => activePath.has(question.id))
        .map(question => question.id)
    );

    const offPathQuestionIds = answeredQuestions
      .filter(question => !activeQuestionIdSet.has(question.id))
      .map(question => question.id);

    return {
      active_branch: activeBranch,
      active_sections: activeSections,
      answered_sections: answeredSections,
      off_path_sections: offPathSections,
      off_path_question_ids: offPathQuestionIds,
      active_question_ids: computeActivePathIds(answerSet).filter(id => activeQuestionIdSet.has(id))
    };
  };

  const buildData = () => {
    const activePath = computeActivePath(answers);
    const activeValues = {};
    const activeLabels = {};
    const activeItems = [];
    const offPathValues = {};
    const offPathLabels = {};
    const offPathItems = [];
    const formatAnswerDetail = (question) => {
      const value = answers[question.id];
      if(Array.isArray(value)){
        const labels = value.map(v => {
          const index = question.opts?.findIndex(option => option.v === v);
          return index >= 0 ? question.opts[index].l : String(v);
        });
        return { value, label: labels.join(', ') };
      }
      const index = question.opts?.findIndex(option => option.v === value);
      return {
        value,
        label: index >= 0 ? question.opts[index].l : String(value)
      };
    };
    const addAnswerItem = (targetValues, targetLabels, targetItems, question) => {
      const detail = formatAnswerDetail(question);
      targetValues[question.var] = detail.value;
      targetLabels[question.var] = detail.label;
      targetItems.push({
        question_id: question.id,
        variable: question.var,
        section: question.sec,
        framework: question.fw,
        value: detail.value,
        label: detail.label,
        question_text: question.text || question.title || ''
      });
    };
    const out = {_meta:{
      timestamp:new Date().toISOString(),
      version:'SWTS+Bourdieu+SDT',
      session_id:getSessionId(),
      branch:answers.B20||'unknown',
      frameworks:['SWTS','Bourdieu','SDT'],
      completion_status: currentId === 'END_SCREEN' || submitted ? 'complete' : 'in_progress',
      completion_percentage: currentId === 'END_SCREEN' || submitted ? 100 : getPct(),
      ...buildPathMetadata(answers)
    }};
    Q.forEach(question => {
      if(!question.var || answers[question.id] === undefined) return;
      if(activePath.has(question.id)){
        addAnswerItem(activeValues, activeLabels, activeItems, question);
        out[question.var] = answers[question.id];
      } else {
        addAnswerItem(offPathValues, offPathLabels, offPathItems, question);
      }
    });
    out._analysis = {
      values: activeValues,
      labels: activeLabels,
      items: activeItems
    };
    if(Object.keys(offPathValues).length > 0) {
      out._audit = {
        off_path_answers: {
          values: offPathValues,
          labels: offPathLabels,
          items: offPathItems
        }
      };
    }
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
    const keys = Object.keys(data).filter(key => !key.startsWith('_'));
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

  const submitSurvey = async () => {
    if(submitting || submitted) return;
    setSubmitting(true);
    const formData = buildData();
    if(enableApiSubmit){
      try {
        const response = await fetch('/api/responses', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(formData)
        });
        if(!response.ok){
          let message = t('static.submitFail','Submission failed. Please try again later.');
          try {
            const errorBody = await response.json();
            if(errorBody?.error) message = errorBody.error;
          } catch(e){}
          alert(message);
          return;
        }
        clearDraft();
        setReviewMode(null);
        setReviewEditContext(null);
        setSubmitted(true);
      } catch(e){
        alert(t('static.submitError','Submission failed. Please check your connection.'));
      } finally {
        setSubmitting(false);
      }
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

  const chooseInitialLanguage = (lang) => {
    setCurrentLang(lang);
    setLanguageSelected(true);
  };

  const resumeDraft = () => {
    if(!pendingDraft){
      startFresh();
      return;
    }
    setAnswers(pendingDraft.a || {});
    setHistory(pendingDraft.h || []);
    setCurrentId(pendingDraft.id || 'INTRO');
    setPendingDraft(null);
    setShowResume(false);
    setReviewMode(null);
    setReviewEditContext(null);
    setActiveResearchPage(null);
  };

  const startFresh = () => {
    clearDraft();
    setPendingDraft(null);
    setShowResume(false);
    setAnswers({});
    setHistory([]);
    setCurrentId('INTRO');
    setSubmitted(false);
    setSubmitting(false);
    setReviewMode(null);
    setReviewEditContext(null);
    setActiveResearchPage(null);
  };

  const openResearchPage = (pageId) => {
    setActiveResearchPage(pageId);
    setReviewMode(null);
    setReviewEditContext(null);
    setValidationAttempted(false);
    setFieldTouched(false);
    setPreviewVisible(false);
  };

  const closeResearchPage = () => {
    setActiveResearchPage(null);
  };

  const dismissInsight = (questionId) => {
    setDismissedInsights(prev => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
  };

  const getSectionReviewQuestions = (section) => {
    const activePath = computeActivePath(answers);
    return Q.filter(question =>
      question.sec === section &&
      question.var &&
      hasStoredAnswer(question) &&
      activePath.has(question.id)
    );
  };

  const getReviewQuestions = () => {
    if(!reviewMode) return [];
    if(reviewMode.type === 'section') return getSectionReviewQuestions(reviewMode.section);
    return [];
  };

  const getFinalReviewSections = () => {
    const path = getPathSections().filter(s => s !== 'END' && s !== 'INTRO');
    return path
      .map(section => ({
        section,
        label: getSectionLabel(section),
        questions: getSectionReviewQuestions(section)
      }))
      .filter(group => group.questions.length > 0);
  };

  const visibleSections = getVisibleSections();
  const pct = q?.type === 'end' || submitted ? 100 : getPct();

  // Chips for current section
  let sectionChips = null;
  let sectionIntroId = null;
  const chipSec = reviewMode?.type === 'section'
    ? reviewMode.section
    : (reviewChipEditMode && reviewEditContext?.reviewMode?.type === 'section')
      ? reviewEditContext.reviewMode.section
      : (!reviewEditContext && q?.sec && q.sec !== 'INTRO' && q.sec !== 'END' ? q.sec : null);
  if (!activeResearchPage && chipSec) {
    const rawChips = Q.filter(question =>
      question.sec === chipSec &&
      ['radio','select','number','checkbox'].includes(question.type) &&
      !shouldSkip(question, answers)
    );
    const divider = Q.find(question => question.sec === chipSec && question.type === 'divider');
    if (rawChips.length > 0) {
      sectionIntroId = divider?.id || null;
      sectionChips = rawChips.map(question => ({
        id: question.id,
        isAnswered: hasStoredAnswer(question),
        isCurrent: question.id === currentId
      }));
    }
  }

  const hasSurveyStarted = history.length > 0;
  const activeResearchMeta = researchPages.find(page => page.id === activeResearchPage);
  const topSec = activeResearchPage
    ? (activeResearchMeta?.title || 'Research foundation')
    : reviewMode?.type === 'section'
    ? getSectionLabel(reviewMode.section)
    : (q ? getSectionLabel(q.sec) : '');
  const visualSection = activeResearchPage
    ? 'INTRO'
    : reviewMode?.type === 'section'
    ? reviewMode.section
    : (q?.sec || 'INTRO');
  const activeSectionTheme = getSectionTheme(visualSection);
  const activeThemeStyle = sectionThemeStyle(visualSection);
  const previewData = useMemo(() => JSON.stringify(buildData(), null, 2), [answers, currentLang]);
  const navCurrentSec = activeResearchPage
    ? 'INTRO'
    : reviewMode?.type === 'section'
    ? reviewMode.section
    : (q?.sec || (submitted ? 'END' : undefined));
  const sectionStates = getSectionStates(visibleSections, navCurrentSec);
  const isBranchDivider = !!answers.B20 && q?.type === 'divider' && ['C','D','E','F'].includes(q.sec);
  const reviewQuestions = getReviewQuestions();
  const reviewTitle = t('static.reviewAnswers','Review answers');
  const reviewEyebrow = reviewMode?.type === 'section'
    ? getSectionLabel(reviewMode.section)
    : t('static.logo','Youth Transition Survey');
  const finalReviewSections = getFinalReviewSections();
  const topSecParts = splitDisplaySectionLabel(topSec);
  const currentInsight = q &&
    !activeResearchPage &&
    !reviewMode &&
    !reviewEditContext &&
    insightData[q.id] &&
    hasStoredAnswer(q) &&
    !dismissedInsights.has(q.id)
      ? translateInsight(q.id, insightData[q.id])
      : null;

  // Keep ref in sync with latest state and actions so the popstate handler
  // always calls the current-render versions without re-registering the listener.
  _browserNavRef.current = {
    history,
    submitted,
    pathChangeConfirm,
    activeResearchPage,
    reviewMode,
    reviewEditContext,
    cancelPathChange,
    closeResearchPage,
    returnFromReviewEdit,
    closeReview,
    goBack,
  };

  return (
    <div className="survey-shell" style={activeThemeStyle}>
      {!languageSelected ? (
        <LanguageSelection onSelect={chooseInitialLanguage} />
      ) : (
      <>
      {pathChangeConfirm ? (
        <PathChangeModal onConfirm={confirmPathChange} onCancel={cancelPathChange} t={t} />
      ) : null}
      <div className="topbar">
        <span className="logo" id="logoText">{t('static.logo','Youth Transition Survey')}</span>
        <span className="top-pct" id="topPct">{pct}% {t('static.complete','complete')}</span>
        <div className="lang-switcher">
          {[
            ['en','English'],
            ['si','සිංහල'],
            ['ta','தமிழ்']
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
        t={t}
      />
      <ResearchNav
        activePageId={activeResearchPage}
        onOpenPage={openResearchPage}
        compact
        t={t}
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
          <SectionChips
            chips={sectionChips}
            introId={sectionIntroId}
            onChipClick={(qId) => reviewMode && reviewChipEditMode ? editReviewQuestion(qId) : goTo(qId)}
            onIntroClick={(introId) => goTo(introId)}
            disableQuestionNavigation={submitted || (!!reviewMode && !reviewChipEditMode) || !!reviewEditContext}
            editMode={reviewChipEditMode}
            t={t}
          />
          <ResearchNav activePageId={activeResearchPage} onOpenPage={openResearchPage} t={t} />
        </nav>
        <main className="main" id="mainArea">
          {activeResearchPage ? (
            <ResearchFoundationsPage
              pageId={activeResearchPage}
              onSelectPage={openResearchPage}
              onBackToSurvey={closeResearchPage}
              t={t}
            />
          ) : reviewMode ? (
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
              editMode={reviewChipEditMode}
              onEnterEditMode={() => setReviewChipEditMode(true)}
              onExitEditMode={() => setReviewChipEditMode(false)}
              sectionTheme={getSectionTheme(reviewMode.section)}
            />
          ) : showResume ? (
            <ResumePrompt t={t} resumeDraft={resumeDraft} startFresh={startFresh} />
          ) : q?.type === 'info' ? (
            <InfoCard q={q} t={t} getSectionLabel={getSectionLabel} translateQField={translateQField} goTo={goTo} hasSurveyStarted={hasSurveyStarted} onGoToProgress={goBack} sectionTheme={activeSectionTheme} submitted={submitted} />
          ) : q?.type === 'divider' ? (
            <DividerCard q={q} t={t} getNext={getNext} getSectionLabel={getSectionLabel} translateQField={translateQField} history={history} goBack={goBack} goTo={goTo} branchNotice={isBranchDivider} sectionTheme={activeSectionTheme} submitted={submitted} />
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
              getSectionTheme={getSectionTheme}
            />
          ) : q ? (
            <div className="question-stage">
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
                onOpenFrameworkPage={openResearchPage}
              />
              <DecorativeSectionMascot
                theme={activeSectionTheme}
                hidden={!!currentInsight}
              />
              <ResearchRabbitGuide
                questionId={q.id}
                insight={currentInsight}
                onDismiss={() => dismissInsight(q.id)}
                onLearnMore={() => openResearchPage(currentInsight.learnMorePage)}
                t={t}
              />
            </div>
          ) : null}
        </main>
      </div>
      </>
      )}
    </div>
  );
}

function LanguageSelection({onSelect}) {
  const languages = [
    {code:'en', name:'English', prompt:'Continue in English'},
    {code:'si', name:'සිංහල', prompt:'සිංහලෙන් ඉදිරියට යන්න'},
    {code:'ta', name:'தமிழ்', prompt:'தமிழில் தொடரவும்'}
  ];

  return (
    <main className="language-entry" aria-labelledby="language-title">
      <section className="language-card">
        <h1 id="language-title">Choose your language</h1>
        <p className="language-intro">
          ඔබේ භාෂාව තෝරන්න · உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்
        </p>
        <div className="language-options">
          {languages.map(language => (
            <button
              key={language.code}
              className="language-option"
              onClick={() => onSelect(language.code)}
              lang={language.code}
            >
              <span className="language-name">{language.name}</span>
              <span className="language-prompt">{language.prompt}</span>
              <span className="language-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        <p className="language-note">
          <span lang="en">You can change the language at any time during the survey.</span>
          <span lang="si">සමීක්ෂණය අතරතුර ඕනෑම වේලාවක භාෂාව වෙනස් කළ හැකිය.</span>
          <span lang="ta">கணக்கெடுப்பின் போது எந்த நேரத்திலும் மொழியை மாற்றலாம்.</span>
        </p>
      </section>
    </main>
  );
}

function InfoCard({q, t, getSectionLabel, translateQField, goTo, hasSurveyStarted, onGoToProgress, sectionTheme, submitted}) {
  const rawTitle = translateQField(q, 'title');
  // Split "X — Y" into main + subtitle; for INTRO this is "Youth Transition Survey — NYSC Sri Lanka"
  const dashIdx = rawTitle.indexOf(' — ');
  const titleMain = dashIdx >= 0 ? rawTitle.slice(0, dashIdx) : rawTitle;
  const titleSub = dashIdx >= 0 ? rawTitle.slice(dashIdx + 3) : null;
  // For non-INTRO: parse "Section A — Name" into kicker + name
  const secParts = q.id !== 'INTRO' ? splitDisplaySectionLabel(getSectionLabel(q.sec)) : null;

  return (
    <div className={`info-card${q.id === 'INTRO' ? ' survey-intro-card' : ''}`}>
      <div className="intro-card-layout">
        <div className="intro-copy">
          {q.id === 'INTRO' ? (
            <div className="intro-eyebrow">{t('static.introEyebrow','NYSC Sri Lanka · Research-driven survey')}</div>
          ) : (
            <>
              {secParts?.kicker ? <div className="intro-eyebrow">{secParts.kicker}</div> : null}
              {secParts?.title ? <div className="q-section" style={{marginBottom:8}}>{secParts.title}</div> : null}
            </>
          )}
          <h1>
            <span className="intro-title-main">{titleMain}</span>
            {titleSub ? <span className="intro-title-sub">{titleSub}</span> : null}
          </h1>
          <div className="intro-body" dangerouslySetInnerHTML={{__html: translateQField(q,'body')}} />
          <div className="nav intro-actions">
            {submitted ? (
              <button className="btn btn-submitted" disabled>{t('static.answersSubmitted','Answers Submitted')}</button>
            ) : hasSurveyStarted ? (
              <button className="btn btn-next" onClick={onGoToProgress}>{t('static.returnToCurrentProgress','Return to current progress →')}</button>
            ) : (
              <button className="btn btn-next" onClick={() => goTo(q.next)}>{t('static.buttons.begin','Start Survey →')}</button>
            )}
          </div>
        </div>
        {sectionTheme?.mascotImage ? (
          <div className="mascot-stage intro-mascot-stage" aria-hidden="true">
            <div className="mascot-section-label">{sectionTheme.label}</div>
            <ResponsiveMascotImage
              className="page-mascot"
              src={sectionTheme.mascotImage}
              smallSrc={sectionTheme.mascotImageSmall}
              sizes="(max-width: 768px) 45vw, 425px"
              alt=""
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DividerCard({q, t, getNext, getSectionLabel, translateQField, history, goBack, goTo, branchNotice, sectionTheme, submitted}) {
  const next = getNext(q);
  const support = q.sec ? t(`sectionSupport.${q.sec}`, SECTION_SUPPORT[q.sec] || '') : '';
  const rawTitle = translateQField(q, 'title');
  // Parse "Section A — Personal & Household" → kicker + clean name
  const divParts = splitDisplaySectionLabel(rawTitle);
  return (
    <>
      <div className="div-card">
        <div className="section-card-layout">
          <div className="section-copy">
            <div className="section-page-head">
              {divParts.kicker ? <div className="div-section-kicker">{divParts.kicker}</div> : null}
              <h2>{divParts.title || rawTitle}</h2>
            </div>
            <p>{translateQField(q,'body')}</p>
            {branchNotice ? (
              <div className="branch-notice">{t('static.branchNotice','Based on your answer, this is your survey path.')}</div>
            ) : null}
            {support ? <div className="sec-support">{support}</div> : null}
          </div>
          {sectionTheme?.mascotImage ? (
            <div className="mascot-stage section-mascot-stage" aria-hidden="true">
              <div className="mascot-section-label">{sectionTheme.label}</div>
              <ResponsiveMascotImage
                className="section-mascot"
                src={sectionTheme.mascotImage}
                smallSrc={sectionTheme.mascotImageSmall}
                sizes="(max-width: 768px) 40vw, 344px"
                alt=""
              />
            </div>
          ) : null}
        </div>
      </div>
      <div className="nav">
        {history.length > 0 ? <button className="btn btn-back" onClick={goBack}>{t('static.buttons.back','← Back')}</button> : null}
        {submitted ? (
          <button className="btn btn-submitted" disabled>{t('static.answersSubmitted','Answers Submitted')}</button>
        ) : (
          <button className="btn btn-next" onClick={() => goTo(next)}>{t('static.buttons.continue','Continue →')}</button>
        )}
      </div>
    </>
  );
}

function DecorativeSectionMascot({ theme, hidden }) {
  if(!theme?.mascotImage) return null;
  return (
    <div className={`decorative-section-mascot${hidden ? ' hidden' : ''}`} aria-hidden="true">
      <ResponsiveMascotImage
        src={theme.mascotImage}
        smallSrc={theme.mascotImageSmall}
        sizes="(max-width: 768px) 35vw, 360px"
        alt=""
      />
    </div>
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
  onEdit,
  getSectionTheme
}) {
  return (
    <div className="confirm-card">
      <h2>{t('static.confirmTitle','Almost there — please review and submit')}</h2>
      <p>{t('static.confirmBody','You have completed all the survey questions. Your responses help us understand youth transitions in Sri Lanka and improve NYSC programmes for young people.')}</p>
      <FinalReview
        title={t('static.reviewAnswers','Review answers')}
        sections={finalReviewSections}
        answers={answers}
        translateQField={translateQField}
        translateOptionLabel={translateOptionLabel}
        t={t}
        readOnly={false}
        onEdit={onEdit}
        getSectionTheme={getSectionTheme}
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

function formatReviewAnswer(question, answers, translateOptionLabel, t) {
  const value = answers[question.id];
  if(value === undefined || value === '' || (Array.isArray(value) && value.length === 0)){
    return t('static.notAnswered','Not answered');
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

function FinalReview({title, sections, answers, translateQField, translateOptionLabel, t, readOnly, onEdit, getSectionTheme}) {
  const [editMode, setEditMode] = useState(false);
  return (
    <div className="final-review">
      <div className="final-review-header">
        <h3>{title}</h3>
        {!readOnly ? (
          <button
            className={`btn-edit-answers${editMode ? ' active' : ''}`}
            onClick={() => setEditMode(true)}
            disabled={editMode}
            aria-pressed={editMode}
          >
            {editMode ? t('static.editingAnswers','✏ Select a question to edit') : t('static.editAnswers','Edit Answers')}
          </button>
        ) : null}
      </div>
      {sections.length === 0 ? (
        <p className="review-empty">{t('static.noReviewAnswers','No answered questions in this section yet.')}</p>
      ) : (
        sections.map((group, index) => (
          <details
            className="final-review-section"
            key={group.section}
            style={getSectionTheme ? sectionThemeStyle(group.section) : undefined}
          >
            <summary>
              {(() => {
                const parts = splitDisplaySectionLabel(group.label);
                return (
                  <span className="final-review-summary-copy">
                    <span className="final-review-kicker">{parts.kicker}</span>
                    <span className="final-review-label-name">{parts.title || group.label}</span>
                  </span>
                );
              })()}
              {getSectionTheme?.(group.section)?.mascotImage ? (
                <ResponsiveMascotImage
                  className="review-summary-mascot"
                  src={getSectionTheme(group.section).mascotImage}
                  smallSrc={getSectionTheme(group.section).mascotImageSmall}
                  sizes="(max-width: 768px) 32vw, 176px"
                  alt=""
                  aria-hidden="true"
                />
              ) : null}
            </summary>
            <div className="review-list">
              {group.questions.map(question => (
                <div className="review-item" key={question.id}>
                  <div className="review-question">
                    <span className="q-id">{question.id}</span>
                    <span>{translateQField(question, 'text')}</span>
                  </div>
                  <div className="review-answer">{formatReviewAnswer(question, answers, translateOptionLabel, t)}</div>
                  {!readOnly && editMode ? (
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
      <h1>{t('static.submittedSuccessfully','Submitted successfully')}</h1>
      <p style={{fontSize:14,color:'var(--positive)',fontWeight:700,marginBottom:12}}>{t('static.thankYouTitle','Survey Complete')}</p>
      <p>{t('static.thankYouBody','Thank you for participating. Your responses contribute to research on youth labour market transitions in Sri Lanka and will help NYSC design better programmes for young people.')}</p>
      <p style={{fontSize:14,color:'var(--dim)'}}>{t('static.responseRecorded','Your response has been recorded. You may now close this page.')}</p>
      <FinalReview
        title={t('static.reviewAnswers','Review answers')}
        sections={finalReviewSections}
        answers={answers}
        translateQField={translateQField}
        translateOptionLabel={translateOptionLabel}
        t={t}
        readOnly
        getSectionTheme={getSectionTheme}
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

function PathChangeModal({ onConfirm, onCancel, t }) {
  return (
    <div className="path-change-overlay">
      <div className="path-change-modal">
        <p className="path-change-notice">{t('static.pathChangeNotice','Changing this answer updates your survey path.')}</p>
        <p className="path-change-body">{t('static.pathChangeBody',"Answers from sections that no longer apply will be kept safely, but won't be included in your active responses. You'll be taken to the next relevant introduction or question on your new path.")}</p>
        <div className="path-change-actions">
          <button className="btn btn-next" onClick={onConfirm}>{t('static.updateMyPath','Yes, update my path')}</button>
          <button className="btn btn-back" onClick={onCancel}>{t('static.keepOriginalAnswer','Keep original answer')}</button>
        </div>
      </div>
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
