import { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useRouter, useSegments } from 'expo-router';
import { navigateAppTab } from '../../lib/screenTransition';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../lib/i18n';
import { isConsentAccepted, revokeConsent } from '../../lib/consent';
import ConfirmDialog from '../ui/ConfirmDialog';
import { getUiPreferences, setUiPreferences } from '../../lib/uiPreferences';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { C, R, T } from '../../constants/onboarding-theme';
import {
  DashboardIcon,
  IncomeIcon,
  CostsIcon,
  BudgetIcon,
  GoalsIcon,
  SavingsIcon,
  TrackerIcon,
  SummaryIcon,
  AlertsIcon,
  SidebarToggleIcon,
  SidebarCollapseIcon,
  SidebarExpandIcon,
  RevokeConsentIcon,
  QuestionnaireIcon,
} from './AppNavIcons';
import LanguageSelector from './LanguageSelector';

const SIDEBAR_EXPANDED = 260;
const SIDEBAR_COLLAPSED = 68;
const WIDE_BREAKPOINT = 768;
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const NAV_ICON_SIZE = 16;

/** Fixed icon column — never changes during collapse animation */
const ICON_SLOT = 36;
const ROW_HEIGHT = 44;
const ROW_MARGIN_H = 8;
const ROW_MARGIN_V = 2;
/** Expanded row inset; collapsed inset centers the icon slot in the 68px rail */
const ROW_PAD_LEFT = 6;
const ROW_PAD_LEFT_COLLAPSED = (SIDEBAR_COLLAPSED - ICON_SLOT) / 2 - ROW_MARGIN_H;
const SECTION_LABEL_PAD_LEFT = ROW_PAD_LEFT + (ICON_SLOT - NAV_ICON_SIZE) / 2;
/** Label inset — absolute so expand/collapse never reflows the icon column */
const LABEL_LEFT = ROW_PAD_LEFT + ICON_SLOT + 4;
const TOGGLE_SIZE = 36;
const HEADER_HEIGHT = 56;
const HEADER_TOGGLE_INSET = 8;
const LANG_PANEL_MAX_H = 130;
const TOGGLE_RIGHT_OFFSET = 16;
/** Fixed slots — section labels fade out but never shrink (prevents icon vertical jump) */
const NAV_SECTION_LABEL_H = 44;
const TOOLS_SECTION_LABEL_H = 44;

const NAV_ITEMS = [
  { name: 'dashboard', labelKey: 'dashboard.title', Icon: DashboardIcon },
  { name: 'income', labelKey: 'dashboard.income', Icon: IncomeIcon },
  { name: 'costs', labelKey: 'dashboard.expenses', Icon: CostsIcon },
  { name: 'budget', labelKey: 'dashboard.budget', Icon: BudgetIcon },
  { name: 'tracker', labelKey: 'dashboard.tracker', Icon: TrackerIcon },
  { name: 'goals', labelKey: 'dashboard.goals', Icon: GoalsIcon },
  { name: 'savings', labelKey: 'dashboard.savings', Icon: SavingsIcon },
  { name: 'summary', labelKey: 'dashboard.summary', Icon: SummaryIcon },
];

const iconSlotStyle = {
  width: ICON_SLOT,
  height: ICON_SLOT,
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  ...(Platform.OS === 'web' ? { transform: [{ translateZ: 0 }] } : {}),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Nav row — icon locked in a fixed slot; label fades beside it without flex reflow.
 */
const SidebarNavRow = memo(function SidebarNavRow({
  isActive,
  onPress,
  Icon,
  iconColor,
  label,
  labelAnimatedStyle,
  rowPadAnimatedStyle,
  danger = false,
  accessibilityLabel,
  showTooltip = false,
  trailing = null,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const backgroundColor = isActive
    ? C.chipSelectedBg
    : danger && pressed
      ? C.dangerBg
      : pressed
        ? C.overlayPressed
        : hovered
          ? C.overlayHover
          : 'transparent';

  const a11yLabel = accessibilityLabel ?? label;

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: isActive }}
      {...(Platform.OS === 'web' && showTooltip ? { title: a11yLabel } : {})}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          position: 'relative',
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: ROW_HEIGHT,
          marginHorizontal: ROW_MARGIN_H,
          marginVertical: ROW_MARGIN_V,
          paddingLeft: ROW_PAD_LEFT,
          paddingRight: 8,
          borderRadius: R.input,
          backgroundColor,
          ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
        },
        rowPadAnimatedStyle,
      ]}
    >
      <View style={iconSlotStyle} collapsable={false}>
        <Icon color={iconColor} size={NAV_ICON_SIZE} />
      </View>
      {labelAnimatedStyle ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: LABEL_LEFT,
              right: 8,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              pointerEvents: 'none',
            },
            labelAnimatedStyle,
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: isActive ? '600' : '500',
              color: danger ? C.danger : isActive ? C.primary : C.muted,
            }}
          >
            {label}
          </Text>
        </Animated.View>
      ) : (
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: isActive ? '600' : '500',
              color: danger ? C.danger : isActive ? C.primary : C.muted,
            }}
          >
            {label}
          </Text>
        </View>
      )}
      {trailing}
    </AnimatedPressable>
  );
});

function CollapseToggleButton({ isWide, onPress, collapseProgress, accessibilityLabel }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const expandIconStyle = useAnimatedStyle(() => ({
    opacity: collapseProgress.value < 0.5 ? 1 : 0,
  }));

  const collapseIconStyle = useAnimatedStyle(() => ({
    opacity: collapseProgress.value >= 0.5 ? 1 : 0,
  }));

  const buttonPosStyle = useAnimatedStyle(() => {
    if (!isWide) return { right: 8 };
    const left = interpolate(
      collapseProgress.value,
      [0, 1],
      [SIDEBAR_EXPANDED - TOGGLE_SIZE - TOGGLE_RIGHT_OFFSET, (SIDEBAR_COLLAPSED - TOGGLE_SIZE) / 2 - 3],
      Extrapolation.CLAMP,
    );
    return { left };
  });

  const bg = pressed ? C.overlayPressed : hovered ? C.overlayHover : 'transparent';

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        top: HEADER_TOGGLE_INSET,
        width: TOGGLE_SIZE,
        height: HEADER_HEIGHT - HEADER_TOGGLE_INSET * 2,
        justifyContent: 'center',
      }, buttonPosStyle]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{
          width: TOGGLE_SIZE,
          height: HEADER_HEIGHT - HEADER_TOGGLE_INSET * 2,
          minWidth: 44,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: R.input,
          backgroundColor: bg,
          ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
        }}
      >
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute' }, expandIconStyle]}>
            <SidebarCollapseIcon color={C.muted} size={20} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, collapseIconStyle]}>
            <SidebarExpandIcon color={C.muted} size={20} />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function AppSidebarMobileTrigger({ onMobileOpen }) {
  const { t } = useI18n();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onMobileOpen}
      accessibilityRole="button"
      accessibilityLabel={t('common.menu')}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        width: 44,
        height: 44,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: R.input,
        backgroundColor: pressed ? C.overlayPressed : hovered ? C.overlayHover : 'transparent',
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SidebarToggleIcon color={C.primary} size={20} />
    </Pressable>
  );
}

export default function AppSidebar({ mobileOpen = false, onMobileClose }) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const reduceMotion = useReducedMotion();
  const animDuration = reduceMotion ? 0 : 260;
  const animDurationFast = reduceMotion ? 0 : 220;

  const [collapsed, setCollapsed] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMounted, setMobileMounted] = useState(false);
  const [showRevokeConsent, setShowRevokeConsent] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  const slideX = useSharedValue(-SIDEBAR_EXPANDED);
  const backdropOpacity = useSharedValue(0);
  const sidebarWidth = useSharedValue(SIDEBAR_EXPANDED);
  const collapseProgress = useSharedValue(0);
  const langHeight = useSharedValue(0);

  const currentRoute = segments[segments.length - 1];

  useEffect(() => {
    (async () => {
      const [prefs, consentOk] = await Promise.all([
        getUiPreferences(),
        isConsentAccepted(),
      ]);
      setShowRevokeConsent(consentOk);
      if (!prefs.sidebarVisited) {
        setCollapsed(false);
        await setUiPreferences({ sidebarVisited: true, sidebarCollapsed: false });
      } else {
        setCollapsed(prefs.sidebarCollapsed);
      }
      setPrefsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!prefsReady) return;
    const targetWidth = collapsed && isWide ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
    const targetCollapse = collapsed && isWide ? 1 : 0;
    sidebarWidth.value = withTiming(targetWidth, { duration: animDuration, easing: EASE });
    collapseProgress.value = withTiming(targetCollapse, { duration: animDuration, easing: EASE });
  }, [collapsed, isWide, prefsReady, animDuration]);

  useEffect(() => {
    langHeight.value = withTiming(langOpen ? 1 : 0, { duration: animDurationFast, easing: EASE });
  }, [langOpen, animDurationFast]);

  useEffect(() => {
    if (!isWide && mobileOpen) {
      setMobileMounted(true);
      slideX.value = withTiming(0, { duration: 280, easing: EASE });
      backdropOpacity.value = withTiming(1, { duration: 280, easing: EASE });
    } else if (!isWide && mobileMounted) {
      slideX.value = withTiming(-SIDEBAR_EXPANDED, { duration: 240, easing: EASE });
      backdropOpacity.value = withTiming(0, { duration: 240, easing: EASE }, (finished) => {
        if (finished) scheduleOnRN(() => setMobileMounted(false));
      });
    }
  }, [mobileOpen, isWide]);

  const animatedSidebarWidth = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  const labelClipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.2, 1], [1, 0, 0], Extrapolation.CLAMP),
  }));

  const sectionLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.2, 1], [1, 0, 0], Extrapolation.CLAMP),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 0.25, 1], [1, 0, 0], Extrapolation.CLAMP),
  }));

  const rowPadStyle = useAnimatedStyle(() => ({
    paddingLeft: interpolate(
      collapseProgress.value,
      [0, 1],
      [ROW_PAD_LEFT, ROW_PAD_LEFT_COLLAPSED],
      Extrapolation.CLAMP,
    ),
  }));

  const animatedDrawer = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const animatedBackdrop = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedLangPanel = useAnimatedStyle(() => ({
    opacity: langHeight.value,
    maxHeight: langHeight.value * LANG_PANEL_MAX_H,
  }));

  const langDropdownInsetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(langHeight.value, [0, 0.4, 1], [0, 0.6, 1], Extrapolation.CLAMP),
    transform: [{
      translateY: interpolate(langHeight.value, [0, 1], [-6, 0], Extrapolation.CLAMP),
    }],
  }));

  const navigate = (route) => {
    navigateAppTab(router, route, currentRoute);
    if (!isWide && onMobileClose) onMobileClose();
  };

  const handleRevokeConsent = () => {
    if (!isWide && onMobileClose) onMobileClose();
    setTimeout(() => setRevokeDialogOpen(true), isWide ? 0 : 240);
  };

  const handleConfirmRevokeConsent = async () => {
    setRevokeDialogOpen(false);
    await revokeConsent();
    setShowRevokeConsent(false);
    router.replace('/(onboarding)/consent');
  };

  const handleToggleCollapse = () => {
    if (isWide) {
      setCollapsed((c) => {
        const next = !c;
        if (next) setLangOpen(false);
        setUiPreferences({ sidebarVisited: true, sidebarCollapsed: next });
        return next;
      });
    } else if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleRetakeQuestionnaire = () => {
    if (!isWide && onMobileClose) onMobileClose();
    setTimeout(() => router.push('/(onboarding)/welcome'), isWide ? 0 : 240);
  };

  const handleLanguagePress = () => {
    if (isWide && collapsed) {
      setCollapsed(false);
      setLangOpen(true);
      return;
    }
    setLangOpen((open) => !open);
  };

  const renderNavItem = (item) => {
    const isActive = currentRoute === item.name;
    const color = isActive ? C.primary : C.muted;
    const { Icon } = item;

    const showTooltip = isWide && collapsed;

    return (
      <SidebarNavRow
        key={item.name}
        isActive={isActive}
        onPress={() => navigate(item.name)}
        Icon={Icon}
        iconColor={color}
        label={t(item.labelKey)}
        labelAnimatedStyle={isWide ? labelClipStyle : undefined}
        rowPadAnimatedStyle={isWide ? rowPadStyle : undefined}
        showTooltip={showTooltip}
      />
    );
  };

  /** Inner panel is always SIDEBAR_EXPANDED — outer wrapper clips width */
  const sidebarContent = (
    <View
      style={{
        width: SIDEBAR_EXPANDED,
        flex: 1,
        backgroundColor: C.surface,
        paddingTop: insets.top + (Platform.OS === 'web' ? 8 : 4),
        paddingBottom: insets.bottom + 8,
        ...(Platform.OS === 'web' ? { transform: [{ translateZ: 0 }] } : {}),
      }}
    >
      {/* Header */}
      <View style={{
        flexShrink: 0,
        height: HEADER_HEIGHT,
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        marginBottom: 8,
        paddingLeft: ROW_PAD_LEFT + 14,
        justifyContent: 'center',
      }}>
        <Animated.View style={[{ overflow: 'hidden' }, isWide ? logoStyle : {}]}>
          <Text style={{ fontSize: 23, fontWeight: '700', color: C.primary, letterSpacing: -0.4 }}>
            {t('app.name')}
          </Text>
        </Animated.View>
        <CollapseToggleButton
          isWide={isWide}
          onPress={handleToggleCollapse}
          collapseProgress={collapseProgress}
          accessibilityLabel={collapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')}
        />
      </View>

      {/* Navigation — scrollable so short viewports don't crush the layout */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 4 }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        bounces={false}
      >
        <View style={{ height: NAV_SECTION_LABEL_H, justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.Text style={[{
            ...T.sectionLabel,
            paddingLeft: SECTION_LABEL_PAD_LEFT,
            paddingTop: 14,
            paddingBottom: 14,
          }, isWide ? sectionLabelStyle : {}]}>
            {t('app.sidebar.navigation')}
          </Animated.Text>
        </View>
        {NAV_ITEMS.map(renderNavItem)}

        <View style={{ height: TOOLS_SECTION_LABEL_H, justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.Text style={[{
            ...T.sectionLabel,
            paddingLeft: SECTION_LABEL_PAD_LEFT,
            paddingTop: 14,
            paddingBottom: 14,
          }, isWide ? sectionLabelStyle : {}]}>
            {t('app.sidebar.tools')}
          </Animated.Text>
        </View>

        <SidebarNavRow
          isActive={false}
          onPress={handleRetakeQuestionnaire}
          Icon={QuestionnaireIcon}
          iconColor={C.muted}
          label={t('app.sidebar.retakeQuestionnaire')}
          labelAnimatedStyle={isWide ? labelClipStyle : undefined}
          rowPadAnimatedStyle={isWide ? rowPadStyle : undefined}
          showTooltip={isWide && collapsed}
        />

        <SidebarNavRow
          isActive={currentRoute === 'alerts'}
          onPress={() => navigate('alerts')}
          Icon={AlertsIcon}
          iconColor={currentRoute === 'alerts' ? C.primary : C.muted}
          label={t('dashboard.alerts')}
          labelAnimatedStyle={isWide ? labelClipStyle : undefined}
          rowPadAnimatedStyle={isWide ? rowPadStyle : undefined}
          showTooltip={isWide && collapsed}
        />
      </ScrollView>

      {/* Footer — pinned; never shrinks when viewport is short */}
      <View style={{
        flexShrink: 0,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 8,
      }}>
        <LanguageSelector
          locale={locale}
          open={langOpen}
          onToggle={handleLanguagePress}
          onSelect={(code) => { setLocale(code); setLangOpen(false); }}
          triggerLabel={t('common.language')}
          labelAnimatedStyle={isWide ? labelClipStyle : undefined}
          rowPadAnimatedStyle={isWide ? rowPadStyle : undefined}
          showTooltip={isWide && collapsed}
          panelStyle={animatedLangPanel}
          insetStyle={langDropdownInsetStyle}
        />

        {showRevokeConsent ? (
          <SidebarNavRow
            isActive={false}
            onPress={handleRevokeConsent}
            Icon={RevokeConsentIcon}
            iconColor={C.danger}
            label={t('settings.revokeConsent')}
            labelAnimatedStyle={isWide ? labelClipStyle : undefined}
            rowPadAnimatedStyle={isWide ? rowPadStyle : undefined}
            showTooltip={isWide && collapsed}
            danger
          />
        ) : null}

        <Animated.View style={[
          {
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: ROW_MARGIN_H,
            marginVertical: ROW_MARGIN_V,
            paddingLeft: ROW_PAD_LEFT,
            paddingVertical: 12,
            minHeight: ROW_HEIGHT,
          },
          isWide ? rowPadStyle : null,
        ]}>
          <View style={{
            ...iconSlotStyle,
            borderRadius: ICON_SLOT / 2,
            backgroundColor: C.chipSelectedBg,
            borderWidth: 1,
            borderColor: C.border,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary }}>B</Text>
          </View>
          {isWide ? (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  left: LABEL_LEFT,
                  right: 8,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  pointerEvents: 'none',
                },
                labelClipStyle,
              ]}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }} numberOfLines={1}>
                {t('app.name')}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
                {t('app.sidebar.planLabel')}
              </Text>
            </Animated.View>
          ) : (
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }} numberOfLines={1}>
                {t('app.name')}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
                {t('app.sidebar.planLabel')}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );

  const revokeConfirmDialog = (
    <ConfirmDialog
      visible={revokeDialogOpen}
      title={t('settings.revokeConsentConfirmTitle')}
      message={t('settings.revokeConsentConfirmMessage')}
      confirmLabel={t('settings.revokeConsentConfirmButton')}
      cancelLabel={t('common.cancel')}
      destructive
      onConfirm={handleConfirmRevokeConsent}
      onCancel={() => setRevokeDialogOpen(false)}
    />
  );

  if (!prefsReady) {
    return <View style={{ width: SIDEBAR_EXPANDED, height: '100%', backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border }} />;
  }

  if (!isWide) {
    return (
      <>
        <Modal
          visible={mobileMounted}
          transparent
          animationType="none"
          onRequestClose={onMobileClose}
          statusBarTranslucent
        >
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <Animated.View
              style={[{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(30,58,95,0.35)',
              }, animatedBackdrop]}
            >
              <Pressable style={{ flex: 1 }} onPress={onMobileClose} />
            </Animated.View>
            <Animated.View style={[{ width: SIDEBAR_EXPANDED, height: '100%', borderRightWidth: 1, borderRightColor: C.border }, animatedDrawer]}>
              {sidebarContent}
            </Animated.View>
          </View>
        </Modal>
        {revokeConfirmDialog}
      </>
    );
  }

  return (
    <>
      <Animated.View style={[{ height: '100%', overflow: 'hidden', borderRightWidth: 1, borderRightColor: C.border }, animatedSidebarWidth]}>
        {sidebarContent}
      </Animated.View>
      {revokeConfirmDialog}
    </>
  );
}
