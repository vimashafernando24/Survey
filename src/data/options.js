// ─── DATA ───────────────────────────────────────────────────
const EDU = [
  {v:'0',l:'No schooling'},{v:'1',l:'Primary/Elementary (Grade 1–5)'},
  {v:'2',l:'O/L level (Grade 9–11)'},{v:'3',l:'A/L level (Grade 12–13)'},
  {v:'4',l:'Vocational certificate / NVQ'},{v:'5',l:'Diploma'},
  {v:'6',l:"Bachelor's degree"},{v:'7',l:'Post-graduate (Masters/PhD)'},
  {v:'99',l:'Do not know / prefer not to say'}
];
const OCC = [
  {v:'1',l:'Professional or technical worker'},{v:'2',l:'Manager / administrator'},
  {v:'3',l:'Clerical / office worker'},{v:'4',l:'Sales worker'},
  {v:'5',l:'Agricultural / farm worker'},{v:'6',l:'Factory / production / trade worker'},
  {v:'7',l:'Government / public sector employee'},{v:'8',l:'Other service worker'},
  {v:'9',l:'Unpaid family worker'},{v:'10',l:'Homemaker (full-time)'},
  {v:'11',l:'Unemployed / looking for work'},{v:'12',l:'Retired'},
  {v:'13',l:'Deceased / not applicable'},{v:'99',l:'Other'}
];
const DISTRICTS = ['Ampara','Anuradhapura','Badulla','Batticaloa','Colombo','Galle','Gampaha',
  'Hambantota','Jaffna','Kalutara','Kandy','Kegalle','Kilinochchi','Kurunegala','Mannar',
  'Matale','Matara','Monaragala','Mullaitivu','Nuwara Eliya','Polonnaruwa','Puttalam',
  'Ratnapura','Trincomalee','Vavuniya'].map(d=>({v:d,l:d}));
const CONTRACT = [
  {v:'1',l:'No contract at all'},{v:'2',l:'Oral contract — permanent/unlimited'},
  {v:'3',l:'Oral contract — temporary (12–36 months)'},{v:'4',l:'Oral contract — temporary (under 12 months)'},
  {v:'5',l:'Written contract — permanent/unlimited'},{v:'6',l:'Written contract — temporary (12–36 months)'},
  {v:'7',l:'Written contract — temporary (under 12 months)'},{v:'8',l:'Do not know'}
];
const SATISFACTION = [
  {v:'1',l:'Very satisfied'},
  {v:'2',l:'Somewhat satisfied'},
  {v:'3',l:'Somewhat unsatisfied'},
  {v:'4',l:'Very unsatisfied'}
];
const SEARCH = [
  {v:'1',l:'Through education or training institution'},{v:'2',l:'Attending job fairs'},
  {v:'3',l:'Public employment office registration'},{v:'4',l:'Private employment agency'},
  {v:'5',l:'Direct application to employers'},{v:'6',l:'Checking at worksites / factory gates'},
  {v:'7',l:'Placing or answering job advertisements'},{v:'8',l:'Online job ads (internet, social media)'},
  {v:'9',l:'Through friends, relatives, or colleagues'},{v:'10',l:'Looking for resources to start own business'},
  {v:'99',l:'Other method'}
];
const OBSTACLE = [
  {v:'1',l:'No education or qualifications'},{v:'2',l:'General education not suited to available jobs'},
  {v:'3',l:'Vocational training not suited to available jobs'},{v:'4',l:'No suitable training available nearby'},
  {v:'5',l:'Employers need higher qualifications than I have'},{v:'6',l:'No work experience'},
  {v:'7',l:'Not enough jobs available in this area'},{v:'8',l:'Considered too young by employers'},
  {v:'9',l:'Gender discrimination'},{v:'10',l:'Other discrimination (disability, ethnicity, religion, etc.)'},
  {v:'11',l:'Wages in available jobs are too low'},{v:'12',l:'Working conditions in available jobs are poor'},
  {v:'99',l:'Other obstacle'}
];
const TRAINING_T = [
  {v:'1',l:'Completion of vocational/NVQ training'},{v:'2',l:'Completion of secondary/A-Level education'},
  {v:'3',l:"University degree"},{v:'4',l:'Apprenticeship with an employer'},
  {v:'5',l:'Entrepreneurship training to start own business'},{v:'6',l:'Computer and IT training'},
  {v:'7',l:'Foreign language training'},{v:'8',l:'Professional/technical certification'},
  {v:'99',l:'Other type of training'}
];
const ACTIVITY = [
  {v:'wage_work',l:'Working for a salary or wage (employed)'},{v:'self_employed',l:'Self-employed / running own business'},
  {v:'unpaid_family',l:'Unpaid work in a family business or farm'},{v:'unemployed',l:'Looking for work / unemployed'},
  {v:'training',l:'In training or further education'},{v:'home_duties',l:'Home duties — caring for family or household'},
  {v:'other_inactive',l:'Not working or looking for other reasons'}
];

export {
  EDU,
  OCC,
  DISTRICTS,
  CONTRACT,
  SATISFACTION,
  SEARCH,
  OBSTACLE,
  TRAINING_T,
  ACTIVITY
};
