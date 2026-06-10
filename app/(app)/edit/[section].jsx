import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { SectionEditProvider } from '../../../lib/SectionEditContext';
import { SECTION_EDIT_SCREENS, SECTION_TITLE_KEYS } from '../../../lib/sectionEditRegistry';
import SectionEditShell from '../../../components/app/SectionEditShell';

export default function SectionEditRoute() {
  const { section } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useI18n();

  const sectionId = Array.isArray(section) ? section[0] : section;
  const Screen = sectionId ? SECTION_EDIT_SCREENS[sectionId] : null;
  const titleKey = sectionId ? SECTION_TITLE_KEYS[sectionId] : null;

  const close = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace('/(app)/dashboard');
  };

  useEffect(() => {
    if (!Screen) close();
  }, [Screen]);

  if (!Screen || !titleKey) return null;

  return (
    <SectionEditProvider onClose={close} onSaved={close}>
      <SectionEditShell
        title={t(titleKey)}
        onClose={close}
        closeA11y={t('sectionEdit.closeA11y')}
      >
        <Screen />
      </SectionEditShell>
    </SectionEditProvider>
  );
}
