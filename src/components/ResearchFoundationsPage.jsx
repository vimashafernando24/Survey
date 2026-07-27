import React from 'react';
import { frameworkPages } from '../data/frameworkPageData.js';
import { getFrameworkTheme } from '../data/frameworkTheme.js';
import { researchPages } from '../insightData.js';
import FrameworkTag from './FrameworkTag.jsx';
import ResponsiveMascotImage from './ResponsiveMascotImage.jsx';
import rabbit1 from '../assets/mascots/rabbit1.png';
import rabbit2 from '../assets/mascots/rabbit2.png';
import rabbit3 from '../assets/mascots/rabbit3.png';
import rabbit4 from '../assets/mascots/rabbit4.png';
import rabbit1Small from '../assets/mascots/small/rabbit1.png';
import rabbit2Small from '../assets/mascots/small/rabbit2.png';
import rabbit3Small from '../assets/mascots/small/rabbit3.png';
import rabbit4Small from '../assets/mascots/small/rabbit4.png';

const pageMascots = [
  { src: rabbit1, smallSrc: rabbit1Small },
  { src: rabbit2, smallSrc: rabbit2Small },
  { src: rabbit3, smallSrc: rabbit3Small },
  { src: rabbit4, smallSrc: rabbit4Small }
];
const pageOrder = ['swts', 'srilanka', 'bourdieu', 'sdt'];
function getMascot(index) {
  if (pageMascots.length === 0) return null;
  return pageMascots[index % pageMascots.length];
}

function ResearchNav({ activePageId, onOpenPage, compact = false, t = (_key, fallback) => fallback }) {
  return (
    <div className={compact ? 'research-mobile-nav' : 'research-nav'} aria-label={t('static.researchFoundations','Research foundations')}>
      {!compact ? <div className="research-nav-title">{t('static.researchPages','Research Pages')}</div> : null}
      {researchPages.map((page) => {
        const theme = getFrameworkTheme(page.navLabel);
        return (
          <button
            key={page.id}
            className={`research-nav-item research-nav-tile${activePageId === page.id ? ' active' : ''}`}
            style={{
              '--framework-color': theme.color,
              '--framework-bg': theme.bg,
              '--framework-border': theme.border
            }}
            onClick={() => onOpenPage(page.id)}
          >
            <span className="research-nav-mark" aria-hidden="true" />
            <span className="research-nav-copy">
              <span className="research-nav-label">{theme.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ResearchFoundationsPage({ pageId, onSelectPage, onBackToSurvey, t = (_key, fallback) => fallback }) {
  const selectedIndex = Math.max(0, pageOrder.indexOf(pageId));
  const page = frameworkPages[pageId] || frameworkPages[pageOrder[0]];
  const mascot = getMascot(selectedIndex);
  const pageText = {
    title: t(`research.${pageId}.title`, page.title),
    subtitle: t(`research.${pageId}.subtitle`, page.subtitle),
    shortExplanation: t(`research.${pageId}.shortExplanation`, page.shortExplanation),
    whyItMatters: t(`research.${pageId}.whyItMatters`, page.whyItMatters),
    whatItHelpsUnderstand: t(`research.${pageId}.whatItHelpsUnderstand`, page.whatItHelpsUnderstand),
    connectionToTransitions: t(`research.${pageId}.connectionToTransitions`, page.connectionToTransitions),
    surveyQuestionsSupported: t(`research.${pageId}.surveyQuestionsSupported`, page.surveyQuestionsSupported),
    whatThisIsNot: t(`research.${pageId}.whatThisIsNot`, page.whatThisIsNot)
  };

  return (
    <section className="research-page">
      <div className="research-page-head">
        <div>
          <div className="research-eyebrow">{t('static.researchFoundation','Research foundation')}</div>
          <h1>{pageText.title}</h1>
          {pageText.subtitle ? (
            <p className="research-subtitle">{pageText.subtitle}</p>
          ) : null}
          {page.frameworkTag ? (
            <div style={{ marginTop: 10 }}>
              <FrameworkTag tag={page.frameworkTag} />
            </div>
          ) : null}
        </div>
        {mascot ? (
          <div className="mascot-stage research-mascot-stage" aria-hidden="true">
            <ResponsiveMascotImage
              className="research-page-mascot"
              src={mascot.src}
              smallSrc={mascot.smallSrc}
              sizes="(max-width: 768px) 45vw, 288px"
              alt=""
            />
          </div>
        ) : null}
      </div>

      <div className="research-tabs">
        {pageOrder.map((id) => {
          const p = frameworkPages[id];
          const theme = getFrameworkTheme(p.frameworkTag || p.tabLabel);
          return (
            <button
              key={id}
              className={`research-tab${id === pageId ? ' active' : ''}`}
              style={{
                '--framework-color': theme.color,
                '--framework-bg': theme.bg,
                '--framework-border': theme.border
              }}
              onClick={() => onSelectPage(id)}
            >
              {theme.label}
            </button>
          );
        })}
      </div>

      <div className="research-section-grid">
        <article className="research-info-panel">
          <h2>{t('static.shortExplanation','Short explanation')}</h2>
          <p>{pageText.shortExplanation}</p>
        </article>

        <article className="research-info-panel">
          <h2>{t('static.whyItMatters','Why it matters')}</h2>
          <p>{pageText.whyItMatters}</p>
        </article>

        <article className="research-info-panel">
          <h2>{t('static.whatItHelpsUnderstand','What it helps understand')}</h2>
          <p>{pageText.whatItHelpsUnderstand}</p>
        </article>

        <article className="research-info-panel">
          <h2>{t('static.connectionToYouthTransitions','Connection to youth transitions')}</h2>
          <p>{pageText.connectionToTransitions}</p>
        </article>

        <article className="research-info-panel wide">
          <h2>{t('static.surveyQuestionsItSupports','Survey questions it supports')}</h2>
          <div className="survey-questions-pills">
            {(pageText.surveyQuestionsSupported || []).map((q) => (
              <span key={q} className="survey-question-pill">{q}</span>
            ))}
          </div>
        </article>
      </div>

      <div className="what-this-is-not">
        <strong>{t('static.whatThisIsNot','What this is not')}</strong>
        <p>{pageText.whatThisIsNot}</p>
      </div>

      {page.attribution ? (
        <aside className="research-attribution" aria-label={t('static.academicSourceAttribution','Academic source attribution')}>
          <span className="research-attribution-label">{t('static.sourceAttribution','Source attribution')}</span>
          <cite>
            <strong>{page.attribution.title}</strong>
            <span>{page.attribution.authors}</span>
            <span>{page.attribution.publication}</span>
          </cite>
        </aside>
      ) : null}

      <div className="nav research-page-actions">
        <button className="btn btn-back" onClick={onBackToSurvey}>{t('static.backToSurvey','Back to survey')}</button>
      </div>
    </section>
  );
}

export {
  ResearchNav,
  ResearchFoundationsPage
};
