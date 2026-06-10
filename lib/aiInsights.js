/**
 * Phase 4 AI narrative layer (DeepSeek via Supabase Edge Function).
 * Returns null until API is wired — UI falls back to rule-based insights.
 */

/**
 * @param {import('./insights').computeInsights} insights
 * @param {string} sectionKey - 'headline' | section id
 * @returns {Promise<string|null>}
 */
export async function fetchAINarrative(insights, sectionKey) {
  void insights;
  void sectionKey;
  return null;
}
