const COPY = {
  en: {
    title: 'Your Reflective Journey',
    intro: 'Thank you for sharing your journey with us.',
    heading: 'The path you shared',
    paragraph: 'Your answers have been recorded as part of this youth transition research. They reflect the education, work, and future pathways you chose to share today.',
    closing: 'Every journey is different, and your contribution matters.'
  },
  si: {
    title: 'ඔබේ ආවර්ජනාත්මක ගමන',
    intro: 'ඔබේ ගමන අප සමඟ බෙදාගැනීම ගැන ස්තුතියි.',
    heading: 'ඔබ බෙදාගත් මඟ',
    paragraph: 'ඔබ අද බෙදාගැනීමට තෝරාගත් අධ්‍යාපන, රැකියා සහ අනාගත මාර්ග පිළිබඳ පිළිතුරු මෙම තරුණ සංක්‍රාන්ති පර්යේෂණයේ කොටසක් ලෙස සටහන් කර ඇත.',
    closing: 'සෑම ගමනක්ම වෙනස් වන අතර ඔබේ දායකත්වය වැදගත් වේ.'
  },
  ta: {
    title: 'உங்கள் பிரதிபலிப்புப் பயணம்',
    intro: 'உங்கள் பயணத்தை எங்களுடன் பகிர்ந்ததற்கு நன்றி.',
    heading: 'நீங்கள் பகிர்ந்த பாதை',
    paragraph: 'கல்வி, வேலை மற்றும் எதிர்காலப் பாதைகள் குறித்து இன்று நீங்கள் பகிரத் தேர்ந்தெடுத்த பதில்கள் இந்த இளைஞர் மாற்ற ஆய்வின் ஒரு பகுதியாகப் பதிவு செய்யப்பட்டுள்ளன.',
    closing: 'ஒவ்வொரு பயணமும் வேறுபட்டது; உங்கள் பங்களிப்பு முக்கியமானது.'
  }
};

function fallbackReflection(language) {
  const copy = COPY[language] || COPY.en;
  return {
    title: copy.title,
    intro: copy.intro,
    sections: [{ heading: copy.heading, paragraph: copy.paragraph }],
    closing: copy.closing
  };
}

module.exports = { fallbackReflection };
