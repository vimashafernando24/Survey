import householdMascot from '../assets/mascots/householdInfo.png';
import educationHistoryMascot from '../assets/mascots/edubackgroundInfo.png';
import inEducationMascot from '../assets/mascots/ineducation.png';
import unemployedMascot from '../assets/mascots/unemployed.png';
import employedMascot from '../assets/mascots/employed.png';
import outsideLabourMascot from '../assets/mascots/outsidelabour.png';
import introMascot from '../assets/mascots/rabbit1.png';
import householdMascotSmall from '../assets/mascots/small/householdInfo.png';
import educationHistoryMascotSmall from '../assets/mascots/small/edubackgroundInfo.png';
import inEducationMascotSmall from '../assets/mascots/small/ineducation.png';
import unemployedMascotSmall from '../assets/mascots/small/unemployed.png';
import employedMascotSmall from '../assets/mascots/small/employed.png';
import outsideLabourMascotSmall from '../assets/mascots/small/outsidelabour.png';
import introMascotSmall from '../assets/mascots/small/rabbit1.png';

const sectionThemes = {
  INTRO: {
    id: 'INTRO',
    label: 'Introduction',
    primaryColor: '#c98d35',
    softBackgroundColor: '#fff7e8',
    borderColor: '#ead2a4',
    gradientBackground: 'linear-gradient(135deg, #fff8ec 0%, #f7efe4 54%, #fffdf8 100%)',
    mascotImage: introMascot,
    mascotImageSmall: introMascotSmall,
    accent: '#f3c96f',
    textColor: '#3c3730'
  },
  A: {
    id: 'A',
    label: 'Personal & Household',
    primaryColor: '#f2bd32',
    softBackgroundColor: '#fff4cc',
    borderColor: '#efcf73',
    gradientBackground: 'linear-gradient(135deg, #fff7dc 0%, #fffdf6 48%, #f6e6ad 100%)',
    mascotImage: householdMascot,
    mascotImageSmall: householdMascotSmall,
    accent: '#f7d75c',
    textColor: '#3c3730'
  },
  B: {
    id: 'B',
    label: 'Education & Activity History',
    primaryColor: '#8f6845',
    softBackgroundColor: '#f4e7d6',
    borderColor: '#d9b992',
    gradientBackground: 'linear-gradient(135deg, #f6eadb 0%, #fffaf3 48%, #dbc1a2 100%)',
    mascotImage: educationHistoryMascot,
    mascotImageSmall: educationHistoryMascotSmall,
    accent: '#b99367',
    textColor: '#362d24'
  },
  C: {
    id: 'C',
    label: 'In Education',
    primaryColor: '#3d79b7',
    softBackgroundColor: '#e7f1fb',
    borderColor: '#b8d2eb',
    gradientBackground: 'linear-gradient(135deg, #e8f3ff 0%, #ffffff 50%, #c8def3 100%)',
    mascotImage: inEducationMascot,
    mascotImageSmall: inEducationMascotSmall,
    accent: '#7fb3de',
    textColor: '#26384a'
  },
  D: {
    id: 'D',
    label: 'Unemployed / Seeking Work',
    primaryColor: '#d77b36',
    softBackgroundColor: '#fff0e2',
    borderColor: '#efc19b',
    gradientBackground: 'linear-gradient(135deg, #fff1e3 0%, #fffdf9 48%, #f5c59e 100%)',
    mascotImage: unemployedMascot,
    mascotImageSmall: unemployedMascotSmall,
    accent: '#f0a45e',
    textColor: '#3d3027'
  },
  E: {
    id: 'E',
    label: 'Employed or Have a Job',
    primaryColor: '#5b8d63',
    softBackgroundColor: '#eaf5ea',
    borderColor: '#bad7bd',
    gradientBackground: 'linear-gradient(135deg, #eaf7ec 0%, #ffffff 48%, #c7dfca 100%)',
    mascotImage: employedMascot,
    mascotImageSmall: employedMascotSmall,
    accent: '#8fbd89',
    textColor: '#29382b'
  },
  F: {
    id: 'F',
    label: 'Currently Outside the Labour Force',
    primaryColor: '#8467aa',
    softBackgroundColor: '#f0eaf8',
    borderColor: '#cdbbe3',
    gradientBackground: 'linear-gradient(135deg, #f2ecfb 0%, #fffafe 50%, #d8c6ec 100%)',
    mascotImage: outsideLabourMascot,
    mascotImageSmall: outsideLabourMascotSmall,
    accent: '#aa8bd0',
    textColor: '#342c3e'
  },
  END: {
    id: 'END',
    label: 'Review & Submit',
    primaryColor: '#6c7f8a',
    softBackgroundColor: '#eef3f4',
    borderColor: '#c8d4d8',
    gradientBackground: 'linear-gradient(135deg, #eef3f4 0%, #ffffff 52%, #d9e3e7 100%)',
    mascotImage: introMascot,
    mascotImageSmall: introMascotSmall,
    accent: '#9cb1bb',
    textColor: '#30383d'
  }
};

function getSectionTheme(sectionId) {
  return sectionThemes[sectionId] || sectionThemes.INTRO;
}

function sectionThemeStyle(sectionId) {
  const theme = getSectionTheme(sectionId);
  return {
    '--section-primary': theme.primaryColor,
    '--section-soft': theme.softBackgroundColor,
    '--section-border': theme.borderColor,
    '--section-gradient': theme.gradientBackground,
    '--section-accent': theme.accent,
    '--section-text': theme.textColor
  };
}

export {
  sectionThemes,
  getSectionTheme,
  sectionThemeStyle
};
