const NARRATIVE_VARIABLES = new Set([
  'edu_status',
  'reason_left_edu',
  'highest_edu_completed',
  'spell1_activity',
  'spell1_contract',
  'spell1_satisfaction',
  'spell1_end_reason',
  'spell2_activity',
  'spell2_contract',
  'spell2_satisfaction',
  'spell2_end_reason',
  'spell3_activity',
  'worked_while_studying',
  'work_while_study_type',
  'work_while_study_paid',
  'work_while_study_hours',
  'work_while_study_motivation',
  'most_important_life_goal',
  'most_useful_quality_for_job',
  'ideal_work_type',
  'ideal_sector',
  'current_activity_status',
  'plans_after_education',
  'already_job_searching',
  'job_search_method_d',
  're_entered_education',
  'reason_re_entered',
  'expected_highest_edu_d',
  'study_field_preference',
  'institution_type',
  'study_motivation_type',
  'desire_for_work',
  'active_search_4weeks',
  'search_method_primary',
  'wanted_to_work',
  'reason_not_seeking',
  'available_to_start',
  'job_search_duration',
  'job_type_sought',
  'activity_while_searching',
  'main_obstacle_finding_work',
  'past_edu_usefulness',
  'training_type_would_help',
  'plans_further_edu',
  'expected_highest_edu_e',
  'reason_temp_absence',
  'occupational_class',
  'contract_type',
  'contract_satisfaction',
  'has_second_job',
  'income_hours_preference',
  'reason_below_normal_hours',
  'job_satisfaction',
  'hopes_to_change_job',
  'reason_wants_to_change',
  'plans_further_edu_f',
  'expected_highest_edu_f',
  'received_training',
  'training_type_received',
  'training_provider',
  'obstacle_finding_this_job',
  'past_edu_useful_for_job',
  'employment_status',
  'job_recruitment_method',
  'reason_self_employed',
  'business_helpers',
  'main_business_obstacle',
  'qualification_job_match',
  'reason_not_in_labour_force',
  'ever_worked',
  'wants_to_work_future',
  'wants_further_edu',
  'expected_highest_edu_g'
]);

const SENSITIVE_ANSWER = /illness|injury|disability|health reason|got married|have a baby|family responsibilities|religious|discrimination|social security benefits/i;

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function extractApprovedFacts(savedResponse) {
  const answers = savedResponse?.answers || {};

  return Object.values(answers)
    .filter(answer => answer?.is_active_path === true)
    .filter(answer => NARRATIVE_VARIABLES.has(answer.variable))
    .map(answer => ({
      topic: cleanText(answer.question_text),
      answer: cleanText(answer.label)
    }))
    .filter(fact => fact.topic && fact.answer)
    .filter(fact => !/prefer not to say|do not know/i.test(fact.answer))
    .filter(fact => !SENSITIVE_ANSWER.test(fact.answer))
    .slice(0, 28);
}

module.exports = { extractApprovedFacts };
