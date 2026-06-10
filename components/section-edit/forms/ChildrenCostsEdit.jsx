import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getData } from '../../../lib/storage';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import AmountFrequencyFields from '../AmountFrequencyFields';

function fieldLabel(t, fieldKey) {
  const known = `onboarding.childrenCosts.fields.${fieldKey}`;
  const translated = t(known);
  if (translated !== known) return translated;
  if (fieldKey.startsWith('other_')) return t('sectionEdit.children.otherCost');
  return fieldKey;
}

function toDraft(saved, children) {
  const s = saved || {};
  const blocks = children.map((child, idx) => {
    const childKey = `child_${idx}`;
    const childData = s[childKey] || {};
    const fields = Object.entries(childData).map(([fieldKey, val]) => ({
      fieldKey,
      amount: amountToString(val?.amount),
      frequency: val?.frequency || 'monthly',
    }));
    return {
      childKey,
      label: child.displayName || null,
      childIndex: idx + 1,
      fields,
    };
  });
  return { _original: saved, children: blocks };
}

function toPayload(draft) {
  const orig = draft._original || {};
  const next = { ...orig };
  (draft.children || []).forEach((block) => {
    const childData = { ...(orig[block.childKey] || {}) };
    block.fields.forEach((f) => {
      childData[f.fieldKey] = {
        ...(childData[f.fieldKey] || {}),
        amount: parseAmount(f.amount),
        frequency: f.frequency,
      };
    });
    next[block.childKey] = childData;
  });
  return next;
}

export default function ChildrenCostsEdit() {
  const { t } = useI18n();
  const [childList, setChildList] = useState([]);

  useEffect(() => {
    getData('pocketos_household').then((h) => {
      setChildList(h?.children || []);
    });
  }, []);

  if (childList.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ ...T.helper, textAlign: 'center' }}>{t('sectionEdit.children.noChildren')}</Text>
      </View>
    );
  }

  return (
    <SectionEditForm
      key={childList.map((c) => c.ageGroup).join(',')}
      storageKey={SECTION_STORAGE_KEYS['children-costs']}
      initialData={toDraft(null, childList)}
      loadTransform={(saved) => toDraft(saved, childList)}
      transformBeforeSave={toPayload}
    >
      {({ data, setData, currency }) => {
        if (!data?.children?.length) {
          return <Text style={{ ...T.helper }}>{t('sectionEdit.children.empty')}</Text>;
        }

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.children.helper')}
            </Text>

            {data.children.map((block, blockIdx) => (
              <View key={block.childKey} style={{ marginBottom: 20 }}>
                <Text style={{ ...T.fieldLabel, marginBottom: 12 }}>
                  {block.label || t('sectionEdit.children.childLabel', { n: block.childIndex })}
                </Text>
                {block.fields.length === 0 ? (
                  <Text style={{ ...T.caption, color: C.muted, marginBottom: 8 }}>
                    {t('sectionEdit.children.noFields')}
                  </Text>
                ) : null}
                {block.fields.map((field, fieldIdx) => (
                  <View
                    key={field.fieldKey}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: C.border,
                      backgroundColor: C.surface,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, marginBottom: 8 }}>
                      {fieldLabel(t, field.fieldKey)}
                    </Text>
                    <AmountFrequencyFields
                      amount={field.amount}
                      frequency={field.frequency}
                      onAmountChange={(v) => {
                        const children = [...data.children];
                        const fields = [...children[blockIdx].fields];
                        fields[fieldIdx] = { ...fields[fieldIdx], amount: v };
                        children[blockIdx] = { ...children[blockIdx], fields };
                        setData((prev) => ({ ...prev, children }));
                      }}
                      onFrequencyChange={(v) => {
                        const children = [...data.children];
                        const fields = [...children[blockIdx].fields];
                        fields[fieldIdx] = { ...fields[fieldIdx], frequency: v };
                        children[blockIdx] = { ...children[blockIdx], fields };
                        setData((prev) => ({ ...prev, children }));
                      }}
                      currency={currency}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
