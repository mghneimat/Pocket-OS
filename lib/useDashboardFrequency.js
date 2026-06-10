import { useState, useEffect, useCallback } from 'react';
import { getUiPreferences, setUiPreferences } from './uiPreferences';

/**
 * Shared dashboard amount display frequency (daily / weekly / monthly).
 */
export function useDashboardFrequency(defaultFrequency = 'monthly') {
  const [frequency, setFrequencyState] = useState(defaultFrequency);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const prefs = await getUiPreferences();
      if (prefs.dashboardDisplayFrequency) {
        setFrequencyState(prefs.dashboardDisplayFrequency);
      }
      setReady(true);
    })();
  }, []);

  const setFrequency = useCallback(async (next) => {
    setFrequencyState(next);
    await setUiPreferences({ dashboardDisplayFrequency: next });
  }, []);

  return { frequency, setFrequency, ready };
}
