import { useState, useEffect, useMemo, useRef } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { webFocusRing } from '../../lib/a11y';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, S, T } from '../../constants/onboarding-theme';
import {
  buildDateSuggestions,
  formatDateDisplay,
  parseLooseDate,
} from '../../lib/datePicker';
import { elevationShadow } from '../../lib/shadow';

/**
 * Typeable date field with autocomplete suggestions.
 * Stores DD/MM/YYYY (with day) or MM/YYYY (month/year only).
 *
 * @param {Object} props
 * @param {string} props.value - Stored date string
 * @param {Function} props.onChange - Called with canonical date string
 * @param {boolean} [props.showDay=true]
 * @param {number} [props.yearStart]
 * @param {number} [props.yearEnd]
 * @param {boolean} [props.inGroup] - Flat styling inside InputGroup card
 */
export default function DatePicker({
  value,
  onChange,
  showDay = true,
  yearStart,
  yearEnd,
  inGroup = false,
}) {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const selectingRef = useRef(false);

  const currentYear = new Date().getFullYear();
  const startYear = yearStart ?? currentYear - 10;
  const endYear = yearEnd ?? currentYear + 10;

  const placeholder = showDay
    ? t('common.datePicker.placeholderFull')
    : t('common.datePicker.placeholderMonthYear');

  useEffect(() => {
    if (!focused) {
      setDraft(value ? formatDateDisplay(value, showDay, t) : '');
    }
  }, [value, focused, showDay, t]);

  const suggestions = useMemo(() => {
    if (!focused) return [];
    const query = draft || value;
    if (!query.trim()) {
      return buildDateSuggestions({
        query: String(new Date().getMonth() + 1),
        showDay,
        yearStart: startYear,
        yearEnd: endYear,
        t,
      });
    }
    return buildDateSuggestions({
      query,
      showDay,
      yearStart: startYear,
      yearEnd: endYear,
      t,
    });
  }, [draft, value, focused, showDay, startYear, endYear, t]);

  const commitDraft = () => {
    const parsed = parseLooseDate(draft, showDay, t);
    if (parsed) {
      onChange(parsed);
      setDraft(formatDateDisplay(parsed, showDay, t));
    } else if (!draft.trim()) {
      onChange('');
      setDraft('');
    } else if (value) {
      setDraft(formatDateDisplay(value, showDay, t));
    }
  };

  const selectSuggestion = (item) => {
    onChange(item.value);
    setDraft(item.label);
    setFocused(false);
  };

  const inputStyle = inGroup
    ? {
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: focused ? C.accent : C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: C.text,
        minHeight: 44,
      }
    : {
        backgroundColor: C.surface,
        borderWidth: 2,
        borderColor: focused ? C.accent : C.border,
        borderRadius: R.input,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 17,
        color: C.text,
        minHeight: 48,
      };

  return (
    <View style={{ marginBottom: inGroup ? 0 : S.fieldGap }}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        accessibilityLabel={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setTimeout(() => {
            if (!selectingRef.current) {
              commitDraft();
              setFocused(false);
            }
            selectingRef.current = false;
          }, 120);
        }}
        style={{
          ...inputStyle,
          outlineStyle: 'none',
          outlineWidth: 0,
          ...webFocusRing(focused),
        }}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {focused && suggestions.length > 0 ? (
        <View style={{
          marginTop: 6,
          backgroundColor: C.surface,
          borderRadius: R.input,
          borderWidth: 1,
          borderColor: C.border,
          overflow: 'hidden',
          ...elevationShadow({ offsetY: 4, blur: 8, opacity: 0.08 }),
        }}>
          {suggestions.map((item) => (
            <Pressable
              key={item.value}
              onPressIn={() => { selectingRef.current = true; }}
              onPress={() => selectSuggestion(item)}
              style={({ pressed }) => ({
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: pressed ? C.bg : 'transparent',
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              })}
            >
              <Text style={{ fontSize: 14, color: C.text, fontWeight: '500' }}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {focused ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 6 }}>
          {t('common.datePicker.hint')}
        </Text>
      ) : null}
    </View>
  );
}
