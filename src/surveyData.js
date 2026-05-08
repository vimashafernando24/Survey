import {
  EDU,
  OCC,
  DISTRICTS,
  CONTRACT,
  SEARCH,
  OBSTACLE,
  TRAINING_T,
  ACTIVITY
} from './data/options.js';
import {
  SECTIONS_META,
  SEC_ORDER
} from './data/sections.js';
import {
  SECTION_SUPPORT
} from './data/sectionSupport.js';
import {
  Q
} from './data/questions.js';
import {
  FIELD_RULES
} from './data/validationRules.js';
import {
  en
} from './translations/en.js';
import {
  si
} from './translations/si.js';
import {
  ta
} from './translations/ta.js';

const translations = {
  en,
  si,
  ta
};

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
