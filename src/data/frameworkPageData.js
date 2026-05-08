export const frameworkPages = {

  swts: {
    id: 'swts',
    tabLabel: 'SWTS / ILO',
    frameworkTag: 'SWTS / ILO',
    title: 'School-to-Work Transition Survey',
    subtitle: 'ILO Employment Policy Department · Validated across 28+ countries',
    shortExplanation: 'The SWTS is an internationally tested survey method developed by the ILO — the United Nations agency for work and employment. It was designed specifically for young people, because the path from education to stable work is not a single step. It involves decisions, setbacks, periods in and out of work, and transitions that look completely different from one person to the next. This survey maps that path.',
    whyItMatters: 'Most surveys only ask what you\'re doing now. The SWTS asks how you got here — which is often the more useful question for understanding what kind of support would actually help. It\'s been used in over 28 countries, including Sri Lanka, to understand the real diversity of how young people experience the world of work.',
    whatItHelpsUnderstand: 'Whether someone is studying, working, searching, or doing something else entirely — and the full journey that brought them to that point. It\'s the structural backbone of this survey.',
    connectionToTransitions: 'Young people in Sri Lanka don\'t move from education to employment in a single clean step. The SWTS is built to capture the messy, multi-stage reality — including informal work, repeated job searching, re-entry into education, and periods of inactivity — and find meaningful patterns within that complexity.',
    surveyQuestionsSupported: ['Activity status', 'Transition history', 'Job search behaviour', 'Employment quality', 'Barriers to work', 'Aspirations'],
    whatThisIsNot: 'This is not an assessment of whether you made the right decisions — it is a map of the journey you actually took, without judgment.',
    attribution: {
      title: 'ILO school-to-work transition survey: A methodological guide — SWTS Questionnaires, Module 2',
      authors: 'Sara Elder',
      publication: 'International Labour Office, 2009.'
    },
  },

  bourdieu: {
    id: 'bourdieu',
    tabLabel: 'Bourdieu Capital',
    frameworkTag: 'Bourdieu Capital',
    title: "Bourdieu's Forms of Capital",
    subtitle: 'Pierre Bourdieu · Sociology of Education, 1986',
    shortExplanation: "Pierre Bourdieu was a French sociologist who argued that opportunity isn't just about individual effort or talent. It's also about the resources you start with — money and financial security (economic capital), education and knowledge (cultural capital), and who you know (social capital). These aren't just advantages. They're the invisible infrastructure that makes some doors easier to open than others.",
    whyItMatters: "Two young people with identical qualifications and identical motivation may face entirely different realities — because one has well-connected family contacts and financial cushion, and the other is starting from zero. Bourdieu's framework gives this survey the tools to see that difference and account for it.",
    whatItHelpsUnderstand: 'Why people in the same structural position — both unemployed, both A/L qualified — can have such different chances. Capital explains the gap that effort and qualifications alone can\'t.',
    connectionToTransitions: 'The transition from education to stable work is heavily shaped by the capital a young person has access to. Social capital connects people to opportunities. Economic capital determines whether they can afford to wait for the right one. Cultural capital shapes which pathways are even visible to them. This survey maps all three.',
    surveyQuestionsSupported: ['Household income', 'Parental education and occupation', 'Employment network quality', 'Funding access', 'Institutional type', 'Qualification–job match', 'Sector formality'],
    whatThisIsNot: "This is not about blaming families or background — it's about understanding what resources are available and what support can compensate for gaps.",
    attribution: {
      title: 'The Forms of Capital',
      authors: 'Pierre Bourdieu',
      publication: 'In Handbook of Theory and Research for the Sociology of Education, edited by J. G. Richardson, 1986.'
    },
  },

  sdt: {
    id: 'sdt',
    tabLabel: 'Self-Determination',
    frameworkTag: 'Self-Determination',
    title: 'Self-Determination Theory',
    subtitle: 'Deci & Ryan · Psychological Inquiry, 2000',
    shortExplanation: "Self-Determination Theory proposes that human motivation isn't simply 'motivated' or 'not motivated.' It exists on a spectrum — from feeling completely directionless, through acting only because of external pressure, all the way to acting because you genuinely care about what you're doing. Where someone sits on that spectrum shapes what kind of support actually works for them.",
    whyItMatters: "A skills programme delivered to someone who feels hopeless about their future will have a very different outcome than the same programme delivered to someone who is intrinsically driven but lacks the right qualification. Understanding motivational state isn't about judging people — it's about not wasting their time with interventions that won't land.",
    whatItHelpsUnderstand: 'Whether someone is actively planning their future, drifting without direction, or genuinely blocked by a lack of confidence or support. This shapes what type of intervention comes first — psychosocial support, guidance, or direct skills training.',
    connectionToTransitions: 'The transition into stable work requires more than opportunity. It requires belief that effort leads somewhere, a sense of direction, and the feeling that you\'re supported. SDT gives this survey the framework to measure those psychological dimensions — not as abstract feelings, but as specific, actionable indicators.',
    surveyQuestionsSupported: ['Study motivation type', 'Job search self-efficacy', 'Autonomy in learning and work', 'Future planning orientation', 'Work motivation', 'Anticipated social support'],
    whatThisIsNot: 'This is not a psychological test and it does not produce a personality result — it identifies what type of programme environment and support structure would work best for you right now.',
    attribution: {
      title: 'Self-Determination Theory and the Facilitation of Intrinsic Motivation, Social Development, and Well-Being',
      authors: 'Richard M. Ryan and Edward L. Deci',
      publication: 'American Psychologist, Vol. 55, No. 1, 2000.'
    },
  },

  srilanka: {
    id: 'srilanka',
    tabLabel: 'Sri Lanka Study',
    frameworkTag: null,
    title: 'The Sri Lankan Context',
    subtitle: 'Local adaptation · ILO Sri Lanka country reports · Labour market research',
    shortExplanation: "This page isn't a separate research framework. It's the local lens through which the survey's three frameworks are applied. Research on youth transitions in Sri Lanka shows that the patterns measured by SWTS, Bourdieu, and SDT play out in specific ways here: the role of NVQ qualifications in formal sector access, the significance of the Colombo–province gap, the weight of family expectation on career decisions, and the scale of informal employment among youth under 30.",
    whyItMatters: "Generic frameworks need local grounding to be useful. The income bands in this survey are in LKR. The districts are Sri Lanka's 25 districts. The occupational categories and institutional types reflect what actually exists here — not an imported template.",
    whatItHelpsUnderstand: 'That the survey is not a generic imported tool. Every adaptation — every question about NVQ levels, every income band, every district option — is grounded in what we know about how youth transitions actually work in Sri Lanka.',
    connectionToTransitions: 'Sri Lanka has a specific combination of factors that shape youth labour market experience: a large public sector that many aspire to but few reach, a well-established NVQ system that connects to formal employment, high youth underemployment rather than pure unemployment, and strong family influence on career decisions. This context shapes how the three frameworks are applied throughout the survey.',
    surveyQuestionsSupported: ['NVQ level references', 'LKR income bands', 'Sri Lanka district options', 'Institution type classifications', 'Occupational categories'],
    whatThisIsNot: 'This is not a fourth theoretical framework — it is the contextual layer that makes the three frameworks meaningful in a Sri Lankan setting.',
    attribution: {
      title: 'School-to-work transition of youth in Sri Lanka',
      authors: 'Edited by S. T. Hettige, Markus Mayer, and Maleeka Salih',
      publication: 'ILO Employment Strategy Papers, 2004/19.'
    },
  },
};
