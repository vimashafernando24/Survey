function normalizeSurveyResponse(payload) {
  const meta = payload._meta || {};
  const analysisItems = payload._analysis?.items || [];
  const offPathAnswers = payload._audit?.off_path_answers || null;
  const receivedAt = new Date();
  const answers = {};

  analysisItems.forEach(item => {
    answers[item.question_id] = {
      variable: item.variable,
      section: item.section,
      framework: item.framework || null,
      value: item.value,
      label: item.label,
      question_text: item.question_text || '',
      is_active_path: true
    };
  });

  return {
    respondent: {
      session_id: meta.session_id || null,
      language: payload.selected_language || null
    },
    submission: {
      submitted_at: meta.timestamp ? new Date(meta.timestamp) : receivedAt,
      received_at: receivedAt,
      status: meta.completion_status || 'complete',
      completion_percentage: meta.completion_percentage ?? null
    },
    path: {
      branch: meta.branch || null,
      active_branch: meta.active_branch || meta.branch || null,
      active_sections: meta.active_sections || [],
      answered_sections: meta.answered_sections || [],
      off_path_sections: meta.off_path_sections || [],
      active_question_ids: meta.active_question_ids || [],
      off_path_question_ids: meta.off_path_question_ids || []
    },
    answers,
    audit: {
      off_path_answers: offPathAnswers
    },
    selected_language: payload.selected_language || null,
    createdAt: receivedAt,
    schema_version: 'v2'
  };
}

module.exports = { normalizeSurveyResponse };
