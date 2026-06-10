import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { setData } from './storage';
import { useSectionEditOptional } from './SectionEditContext';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { useI18n } from './i18n';

/**
 * Exit helpers for onboarding section screens — supports in-app edit modal vs full onboarding flow.
 */
export function useSectionExit() {
  const router = useRouter();
  const { t } = useI18n();
  const edit = useSectionEditOptional();
  const editRef = useRef(edit);
  editRef.current = edit;
  const isEditMode = Boolean(edit?.isActive);
  const editContinueLabel = isEditMode ? t('common.save') : undefined;

  const completeSection = async ({ persist, onboardingPatch, nextRoute }) => {
    await persist();
    if (editRef.current?.isActive) {
      notifyDashboardRefresh();
      editRef.current.onSaved();
      return;
    }
    if (onboardingPatch) {
      await setData('pocketos_onboarding', onboardingPatch);
    }
    router.replace(nextRoute);
  };

  const leaveSection = (fallback) => {
    if (editRef.current?.isActive) {
      editRef.current.onClose();
      return;
    }
    fallback();
  };

  return { isEditMode, completeSection, leaveSection, editContinueLabel };
}
