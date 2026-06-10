import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getData } from '../../../lib/storage';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import AmountFrequencyFields from '../AmountFrequencyFields';

function toDraft(saved, members) {
  const s = saved || {};
  const rows = members.map((m) => {
    const md = s[m.id] || {};
    return {
      memberId: m.id,
      label: m.label,
      premium: amountToString(md.premium),
      frequency: md.frequency || 'monthly',
      coverage: md.coverage || null,
    };
  });
  return { _original: saved, members: rows };
}

function toPayload(draft) {
  const orig = draft._original || {};
  const next = { ...orig };
  (draft.members || []).forEach((m) => {
    next[m.memberId] = {
      ...(orig[m.memberId] || {}),
      premium: parseAmount(m.premium),
      frequency: m.frequency,
      coverage: m.coverage || orig[m.memberId]?.coverage,
      confirmed: true,
    };
  });
  return next;
}

export default function HealthEdit() {
  const { t } = useI18n();
  const [memberList, setMemberList] = useState([]);

  useEffect(() => {
    (async () => {
      const h = await getData('pocketos_household');
      const members = [{ id: 'user', label: t('onboarding.health.you') }];
      if (h?.partnerName) {
        members.push({ id: 'partner', label: h.partnerName });
      }
      (h?.children || []).forEach((child, idx) => {
        members.push({
          id: `child_${idx}`,
          label: child.displayName || `${t('onboarding.health.child')} ${idx + 1}`,
        });
      });
      setMemberList(members);
    })();
  }, [t]);

  if (memberList.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ ...T.helper }}>{t('sectionEdit.health.loading')}</Text>
      </View>
    );
  }

  return (
    <SectionEditForm
      key={memberList.map((m) => m.id).join(',')}
      storageKey={SECTION_STORAGE_KEYS.health}
      initialData={toDraft(null, memberList)}
      loadTransform={(saved) => toDraft(saved, memberList)}
      transformBeforeSave={toPayload}
      validate={(draft, tr) => {
        const active = (draft.members || []).filter((m) => parseAmount(m.premium) > 0);
        if (active.length === 0) return null;
        for (const m of active) {
          if (!parseAmount(m.premium)) return tr('sectionEdit.health.validation');
        }
        return null;
      }}
    >
      {({ data, setData, currency }) => {
        if (!data?.members?.length) {
          return <Text style={{ ...T.helper }}>{t('sectionEdit.health.loading')}</Text>;
        }

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.health.helper')}
            </Text>

            {data.members.map((member, idx) => (
              <View
                key={member.memberId}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surface,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 12 }}>
                  {member.label}
                </Text>
                <AmountFrequencyFields
                  amount={member.premium}
                  frequency={member.frequency}
                  onAmountChange={(v) => {
                    const members = [...data.members];
                    members[idx] = { ...members[idx], premium: v };
                    setData((prev) => ({ ...prev, members }));
                  }}
                  onFrequencyChange={(v) => {
                    const members = [...data.members];
                    members[idx] = { ...members[idx], frequency: v };
                    setData((prev) => ({ ...prev, members }));
                  }}
                  currency={currency}
                />
              </View>
            ))}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
