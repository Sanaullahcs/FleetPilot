import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, RoleAccents } from '@/constants/theme';

/** Minimal abstract route map — placeholder until real maps ship. */
export function TrackMapIllustration({
  live = false,
  fill = false,
  height = 200,
  style,
}: {
  live?: boolean;
  fill?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const bus = live ? Colors.success : RoleAccents.parent;

  return (
    <View style={[styles.wrap, fill && styles.fill, !fill && { height }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 360 280" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F4F6FB" />
            <Stop offset="0.55" stopColor="#E8EEF8" />
            <Stop offset="1" stopColor="#DFE8F4" />
          </LinearGradient>
          <LinearGradient id="routeGlow" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0" />
            <Stop offset="0.5" stopColor={Colors.primary} stopOpacity="0.25" />
            <Stop offset="1" stopColor={RoleAccents.parent} stopOpacity="0.35" />
          </LinearGradient>
        </Defs>

        <Path d="M0 0 H360 V280 H0 Z" fill="url(#bg)" />

        {/* Soft terrain */}
        <Circle cx="80" cy="220" r="90" fill="#E2EBF5" opacity={0.5} />
        <Circle cx="300" cy="60" r="70" fill="#E2EBF5" opacity={0.4} />

        {/* Route glow + line */}
        <Path
          d="M40 210 C100 170 160 150 220 120 S320 80 330 70"
          stroke="url(#routeGlow)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M40 210 C100 170 160 150 220 120 S320 80 330 70"
          stroke={Colors.primary}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity={0.55}
        />

        {/* School */}
        <Circle cx="58" cy="198" r="7" fill={RoleAccents.parent} opacity={0.35} />
        <Circle cx="58" cy="198" r="4" fill={RoleAccents.parent} />

        {/* Bus */}
        {live ? <Circle cx="278" cy="88" r="16" fill={bus} opacity={0.15} /> : null}
        <Circle cx="278" cy="88" r="6" fill={bus} stroke="#fff" strokeWidth="2.5" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: '#E8EEF8' },
  fill: { flex: 1, minHeight: 160 },
});
