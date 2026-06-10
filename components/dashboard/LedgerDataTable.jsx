import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import AnimatedRow from '../onboarding/AnimatedRow';
import { textButtonStyle } from '../../lib/pressableHover';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import DashboardSectionHeader from './DashboardSectionHeader';

const ACTION_WIDTH = 52;
const COLUMN_GAP = 12;

/**
 * Unified ledger table — header + optional per-row edit panel.
 */
export default function LedgerDataTable({
  title,
  titleTrailing,
  columns,
  rows,
  emptyLabel,
  renderEditPanel,
  editLabel = 'Edit',
}) {
  const [expandedId, setExpandedId] = useState(null);
  const editable = Boolean(renderEditPanel);

  const toggleRow = (rowId) => {
    setExpandedId((prev) => (prev === rowId ? null : rowId));
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {title ? (
        <DashboardSectionHeader title={title} trailing={titleTrailing} />
      ) : null}

      <View style={{
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: R.card,
        overflow: 'hidden',
        backgroundColor: C.surface,
      }}>
        <View style={{
          flexDirection: 'row',
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: C.bg,
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
          gap: COLUMN_GAP,
        }}>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={{
                ...T.caption,
                fontWeight: '600',
                color: C.muted,
                flex: col.flex ?? 1,
                flexBasis: 0,
                textAlign: col.align || 'left',
              }}
              numberOfLines={1}
            >
              {col.label}
            </Text>
          ))}
          {editable ? <View style={{ width: ACTION_WIDTH }} /> : null}
        </View>

        {rows.length === 0 ? (
          <Text style={{ ...T.helper, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
            {emptyLabel}
          </Text>
        ) : rows.map((row, idx) => {
          const isOpen = expandedId === row.id;
          return (
            <View key={row.id} style={{ borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: C.divider }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 14,
                gap: COLUMN_GAP,
                backgroundColor: C.surface,
              }}>
                {columns.map((col) => (
                  <Text
                    key={col.key}
                    style={{
                      flex: col.flex ?? 1,
                      flexBasis: 0,
                      fontSize: col.key === 'name' ? 15 : 14,
                      fontWeight: col.key === 'name' ? '500' : '600',
                      color: col.key === 'share' ? C.muted : C.primary,
                      textAlign: col.align || 'left',
                      ...tabularNums,
                    }}
                    numberOfLines={2}
                  >
                    {row.cells[col.key]}
                  </Text>
                ))}
                {editable ? (
                  <Pressable
                    onPress={() => toggleRow(row.id)}
                    accessibilityRole="button"
                    accessibilityLabel={editLabel}
                    accessibilityState={{ expanded: isOpen }}
                    style={({ pressed, hovered }) => ({
                      width: ACTION_WIDTH,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 32,
                      ...textButtonStyle({ pressed, hovered }),
                    })}
                  >
                    {({ pressed, hovered }) => (
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: hovered ? C.accentPressed : C.accent,
                        opacity: pressed ? 0.7 : 1,
                        textAlign: 'center',
                      }}>
                        {editLabel}
                      </Text>
                    )}
                  </Pressable>
                ) : null}
              </View>

              {editable ? (
                <AnimatedRow visible={isOpen}>
                  <View style={{
                    marginTop: 8,
                    paddingHorizontal: 14,
                    paddingTop: 16,
                    paddingBottom: 16,
                    borderTopWidth: 1,
                    borderTopColor: C.divider,
                    backgroundColor: C.bg,
                  }}>
                    {renderEditPanel(row, {
                      onDone: () => setExpandedId(null),
                      onCancel: () => setExpandedId(null),
                    })}
                  </View>
                </AnimatedRow>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
