import React from 'react';
import { Text } from 'react-native';

const ICON_SIZE = 16;

/** Emoji fallbacks — SvgXml is unavailable in the installed react-native-svg build. */
const SERVICE_EMOJI = {
  netflix: '🎬',
  primeVideo: '▶',
  disneyPlus: '✨',
  appleTvPlus: '',
  hboMax: '📺',
  spotify: '🎵',
  appleMusic: '🎵',
  youtubePremium: '▶',
  deezer: '🎵',
  revolut: '💳',
  wise: '💳',
  icloudPlus: '☁',
  googleOne: '☁',
  microsoft365: '📄',
  adobeCC: '🎨',
  playstationPlus: '🎮',
  xboxGamePass: '🎮',
  other: '+',
};

function EmojiIcon({ emoji }) {
  return (
    <Text style={{ fontSize: ICON_SIZE, lineHeight: ICON_SIZE, width: ICON_SIZE, textAlign: 'center' }}>
      {emoji}
    </Text>
  );
}

export const SERVICE_ICON_COMPONENTS = Object.fromEntries(
  Object.entries(SERVICE_EMOJI).map(([key, emoji]) => [
    key,
    () => <EmojiIcon emoji={emoji} />,
  ]),
);
