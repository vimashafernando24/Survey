import React from 'react';
import { frameworkPages } from '../data/frameworkPageData.js';
import { getFrameworkTheme } from '../data/frameworkTheme.js';
import { researchPages } from '../insightData.js';
import FrameworkTag from './FrameworkTag.jsx';
import rabbit1 from '../assets/mascots/rabbit1.png';
import rabbit2 from '../assets/mascots/rabbit2.png';
import rabbit3 from '../assets/mascots/rabbit3.png';
import rabbit4 from '../assets/mascots/rabbit4.png';

const pageMascots = [rabbit1, rabbit2, rabbit3, rabbit4].filter(Boolean);
const pageOrder = ['swts', 'srilanka', 'bourdieu', 'sdt'];
function getMascot(index) {
  if (pageMascots.length === 0) return null;
  return pageMascots[index % pageMascots.length];
}

function ResearchNav({ activePageId, onOpenPage, compact = false }) {
  return (
    <div className={compact ? 'research-mobile-nav' : 'research-nav'} aria-label="Research foundations">
      {!compact ? <div className="research-nav-title">Research Pages</div> : null}
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

function ResearchFoundationsPage({ pageId, onSelectPage, onBackToSurvey }) {
  const selectedIndex = Math.max(0, pageOrder.indexOf(pageId));
  const page = frameworkPages[pageId] || frameworkPages[pageOrder[0]];
  const mascot = getMascot(selectedIndex);

  return (
    <section className="research-page">
      <div className="research-page-head">
        <div>
          <div className="research-eyebrow">Research foundation</div>
          <h1>{page.title}</h1>
          {page.subtitle ? (
            <p className="research-subtitle">{page.subtitle}</p>
          ) : null}
          {page.frameworkTag ? (
            <div style={{ marginTop: 10 }}>
              <FrameworkTag tag={page.frameworkTag} />
            </div>
          ) : null}
        </div>
        {mascot ? (
          <div className="mascot-stage research-mascot-stage" aria-hidden="true">
            <img className="research-page-mascot" src={mascot} alt="" />
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
          <h2>Short explanation</h2>
          <p>{page.shortExplanation}</p>
        </article>

        <article className="research-info-panel">
          <h2>Why it matters</h2>
          <p>{page.whyItMatters}</p>
        </article>

        <article className="research-info-panel">
          <h2>What it helps understand</h2>
          <p>{page.whatItHelpsUnderstand}</p>
        </article>

        <article className="research-info-panel">
          <h2>Connection to youth transitions</h2>
          <p>{page.connectionToTransitions}</p>
        </article>

        <article className="research-info-panel wide">
          <h2>Survey questions it supports</h2>
          <div className="survey-questions-pills">
            {page.surveyQuestionsSupported.map((q) => (
              <span key={q} className="survey-question-pill">{q}</span>
            ))}
          </div>
        </article>
      </div>

      <div className="what-this-is-not">
        <strong>What this is not</strong>
        <p>{page.whatThisIsNot}</p>
      </div>

      {page.attribution ? (
        <aside className="research-attribution" aria-label="Academic source attribution">
          <span className="research-attribution-label">Source attribution</span>
          <cite>
            <strong>{page.attribution.title}</strong>
            <span>{page.attribution.authors}</span>
            <span>{page.attribution.publication}</span>
          </cite>
        </aside>
      ) : null}

      <div className="nav research-page-actions">
        <button className="btn btn-back" onClick={onBackToSurvey}>Back to survey</button>
      </div>
    </section>
  );
}

export {
  ResearchNav,
  ResearchFoundationsPage
};
