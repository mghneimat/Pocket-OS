import { useState } from 'react';

import { View, Pressable, Platform } from 'react-native';

import { Text } from '@gluestack-ui/themed';

import { C, R, T, tabularNums } from '../../constants/onboarding-theme';

import { InfoIcon } from '../app/AppNavIcons';

import StatusChip from './StatusChip';

import { DASHBOARD_CARD_TONES, resolveDashboardCardTone } from './dashboardCardTones';



const INFO_SIZE = 22;

const INFO_HIT = 40;



function InfoIconButton({ onPress, accessibilityLabel, tone }) {

  const [hovered, setHovered] = useState(false);

  const [pressed, setPressed] = useState(false);

  const palette = tone ? DASHBOARD_CARD_TONES[tone] : null;

  const iconColor = hovered || pressed

    ? (palette?.valueColor ?? C.primary)

    : (palette?.iconColor ?? C.muted);

  const backgroundColor = pressed

    ? (palette?.bgPressed ?? C.overlayPressed)

    : hovered

      ? (palette?.bgHover ?? C.overlayHover)

      : 'transparent';



  return (

    <Pressable

      onPress={onPress}

      accessibilityRole="button"

      accessibilityLabel={accessibilityLabel}

      onPressIn={() => setPressed(true)}

      onPressOut={() => setPressed(false)}

      onHoverIn={() => setHovered(true)}

      onHoverOut={() => setHovered(false)}

      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}

      style={{

        width: INFO_HIT,

        height: INFO_HIT,

        alignItems: 'center',

        justifyContent: 'center',

        borderRadius: R.input,

        backgroundColor,

        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),

      }}

    >

      <InfoIcon color={iconColor} size={INFO_SIZE} />

    </Pressable>

  );

}



/**

 * Metric card — card press navigates; info icon opens modal; optional frequency slot stays outside pressable.

 */

export default function MetricExplainCard({

  label,

  labelIcon,

  value,

  subtitle,

  footerLabel,

  statusChip,

  statusLabel,

  statusColor,

  frequencySlot,

  onPress,

  onInfoPress,

  variant = 'compact',

  tone,

  accessibilityLabel,

  infoAccessibilityLabel,

  style,

}) {

  const [hovered, setHovered] = useState(false);

  const [pressed, setPressed] = useState(false);



  const isHero = variant === 'hero';

  const isPanel = variant === 'hero-panel';

  const isSnapshot = variant === 'snapshot';

  const valueSize = isHero || isPanel ? 32 : 22;

  const valueLineHeight = isHero || isPanel ? 38 : 28;

  const padH = isHero ? 20 : isPanel ? 18 : 16;

  const padV = isHero ? 24 : isPanel ? 20 : isSnapshot ? 16 : 16;



  const toneStyle = resolveDashboardCardTone(tone, { hovered, pressed });



  const borderColor = toneStyle

    ? toneStyle.borderColor

    : hovered || pressed

      ? C.chipSelectedBorder

      : C.border;



  const backgroundColor = toneStyle

    ? toneStyle.backgroundColor

    : pressed

      ? C.overlayPressed

      : hovered

        ? C.overlayHover

        : C.surface;



  const valueColor = toneStyle?.valueColor || C.primary;



  const hoverHandlers = Platform.OS === 'web'

    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }

    : {};



  return (

    <View

      {...hoverHandlers}

      style={{

        position: 'relative',

        flex: isPanel ? 1 : isHero ? undefined : 1,

        minWidth: isHero || isPanel ? undefined : 120,

        width: isHero ? '100%' : undefined,

        backgroundColor,

        borderRadius: R.card,

        borderWidth: 1,

        borderColor,

        ...(toneStyle?.borderLeftWidth ? {

          borderLeftWidth: toneStyle.borderLeftWidth,

          borderLeftColor: toneStyle.borderLeftColor,

        } : {}),

        ...(isSnapshot ? { minHeight: 112 } : {}),

        ...(Platform.OS === 'web' ? { transition: 'background-color 0.15s ease, border-color 0.15s ease' } : {}),

        ...style,

      }}

    >

      <Pressable

        onPress={onPress}

        accessibilityRole="button"

        accessibilityLabel={accessibilityLabel ?? `${label}, ${value}`}

        onPressIn={() => setPressed(true)}

        onPressOut={() => setPressed(false)}

        onHoverIn={() => setHovered(true)}

        onHoverOut={() => setHovered(false)}

        style={{

          paddingHorizontal: padH,

          paddingTop: padV,

          paddingBottom: frequencySlot ? 8 : padV,

          paddingRight: onInfoPress ? padH + INFO_HIT - 8 : padH,

          ...(Platform.OS === 'web' ? { cursor: onPress ? 'pointer' : 'default' } : {}),

        }}

      >

        <View

          style={{

            flexDirection: 'row',

            alignItems: 'center',

            gap: 6,

            marginBottom: isHero || isPanel ? 8 : 4,

            paddingRight: onInfoPress ? 4 : 0,

          }}

        >

          {labelIcon ? (

            <View style={{ flexShrink: 0 }}>{labelIcon}</View>

          ) : null}

          <Text style={{ ...T.fieldLabel, flex: 1 }} numberOfLines={2}>

            {label}

          </Text>

        </View>

        <Text style={{

          fontSize: valueSize,

          lineHeight: valueLineHeight,

          fontWeight: '700',

          color: valueColor,

          letterSpacing: isHero ? -0.02 : 0,

          ...tabularNums,

        }} numberOfLines={2}>

          {value}

        </Text>

        {statusChip ? (

          <StatusChip label={statusChip.label} variant={statusChip.variant} />

        ) : null}

        {subtitle ? (

          <Text style={{ ...T.helper, marginTop: isHero || isPanel ? 8 : 4 }} numberOfLines={3}>

            {subtitle}

          </Text>

        ) : null}

        {footerLabel ? (

          <Text style={{ ...T.caption, color: C.muted, marginTop: statusChip ? 4 : 6 }} numberOfLines={3}>

            {footerLabel}

          </Text>

        ) : null}

        {!statusChip && statusLabel ? (

          <Text style={{ ...T.caption, color: statusColor || C.muted, marginTop: 6 }} numberOfLines={3}>

            {statusLabel}

          </Text>

        ) : null}

      </Pressable>



      {frequencySlot ? (

        <View style={{ paddingHorizontal: padH, paddingBottom: padV }}>

          {frequencySlot}

        </View>

      ) : null}



      {onInfoPress ? (

        <View

          style={{

            position: 'absolute',

            top: padV - 4,

            right: padH - 4,

            zIndex: 1,

            pointerEvents: 'box-none',

          }}

        >

          <InfoIconButton onPress={onInfoPress} accessibilityLabel={infoAccessibilityLabel} tone={tone} />

        </View>

      ) : null}

    </View>

  );

}

