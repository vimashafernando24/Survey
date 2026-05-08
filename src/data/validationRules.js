const FIELD_RULES = {
  edu_end_year:          {min:1950, max:2026},
  age_first_married:     {min:10,   max:35},
  household_size:        {min:1,    max:30},
  num_children:          {min:0,    max:20},
  household_workers:     {min:0,    max:30},
  household_unemployed:  {min:0,    max:30},
  usual_hours_per_week:  {min:0,    max:100},
  actual_hours_last_week:{min:0,    max:120},
  num_applications:      {min:0,    max:500},
  num_interviews:        {min:0,    max:200},
  jobs_applied_before_hire:{min:0,  max:500},
  interviews_before_hire:  {min:0,  max:200}
};

export {
  FIELD_RULES
};
