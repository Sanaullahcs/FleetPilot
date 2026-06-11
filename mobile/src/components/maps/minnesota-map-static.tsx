import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, RoleAccents } from '@/constants/theme';

/**
 * Stylized Minnesota / Twin Cities map for demos until a Google Maps key is added.
 * Not geographically exact — presentation-only.
 */
export function MinnesotaMapStatic({
  live = false,
  fill = false,
  height = 200,
  style,
  showLabel = true,
}: {
  live?: boolean;
  fill?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  showLabel?: boolean;
}) {
  const bus = live ? Colors.success : RoleAccents.parent;

  return (
    <View style={[styles.wrap, fill && styles.fill, !fill && { height }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="mnSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#EAF2FA" />
            <Stop offset="1" stopColor="#D8E4EF" />
          </LinearGradient>
          <LinearGradient id="mnLake" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9ECAE8" />
            <Stop offset="1" stopColor="#6BAED6" />
          </LinearGradient>
          <LinearGradient id="mnPark" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C8E6C9" />
            <Stop offset="1" stopColor="#A5D6A7" />
          </LinearGradient>
        </Defs>

        {/* Base */}
        <Rect x="0" y="0" width="400" height="320" fill="url(#mnSky)" />

        {/* Parks */}
        <Ellipse cx="70" cy="240" rx="55" ry="38" fill="url(#mnPark)" opacity={0.85} />
        <Ellipse cx="330" cy="90" rx="48" ry="32" fill="url(#mnPark)" opacity={0.7} />
        <Ellipse cx="200" cy="160" rx="35" ry="22" fill="url(#mnPark)" opacity={0.55} />

        {/* Lakes — Minnesota 10,000 lakes vibe */}
        <Ellipse cx="120" cy="95" rx="42" ry="28" fill="url(#mnLake)" opacity={0.9} />
        <Ellipse cx="290" cy="200" rx="50" ry="34" fill="url(#mnLake)" opacity={0.85} />
        <Ellipse cx="340" cy="130" rx="28" ry="18" fill="url(#mnLake)" opacity={0.75} />

        {/* River curve (Mississippi-ish) */}
        <Path
          d="M0 180 Q80 150 140 170 T260 155 T400 190"
          stroke="#8ECAE6"
          strokeWidth="18"
          fill="none"
          opacity={0.45}
        />
        <Path
          d="M0 180 Q80 150 140 170 T260 155 T400 190"
          stroke="#4292C6"
          strokeWidth="3"
          fill="none"
          opacity={0.5}
        />

        {/* Street grid */}
        <G opacity={0.35}>
          {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((x) => (
            <Path key={`v${x}`} d={`M${x} 0 V320`} stroke="#94A3B8" strokeWidth="1.2" />
          ))}
          {[40, 80, 120, 160, 200, 240, 280].map((y) => (
            <Path key={`h${y}`} d={`M0 ${y} H400`} stroke="#94A3B8" strokeWidth="1.2" />
          ))}
        </G>

        {/* Major roads */}
        <Path d="M20 260 L380 60" stroke="#CBD5E1" strokeWidth="5" strokeLinecap="round" />
        <Path d="M30 80 L370 280" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
        <Path d="M180 20 L180 300" stroke="#E2E8F0" strokeWidth="6" strokeLinecap="round" />

        {/* Route highlight */}
        <Path
          d="M55 245 C110 210 155 185 210 150 S310 95 345 75"
          stroke={RoleAccents.parent}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity={0.35}
        />
        <Path
          d="M55 245 C110 210 155 185 210 150 S310 95 345 75"
          stroke={live ? Colors.success : RoleAccents.parent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={live ? undefined : '8 6'}
        />

        {/* School stop */}
        <Circle cx="58" cy="238" r="11" fill={RoleAccents.parent} opacity={0.2} />
        <Circle cx="58" cy="238" r="6" fill={RoleAccents.parent} stroke="#fff" strokeWidth="2" />

        {/* Bus */}
        {live ? <Circle cx="338" cy="78" r="20" fill={bus} opacity={0.15} /> : null}
        <Circle cx="338" cy="78" r="9" fill={bus} stroke="#fff" strokeWidth="2.5" />

        {showLabel ? (
          <G>
            <Rect x="12" y="268" width="118" height="28" rx="8" fill="rgba(255,255,255,0.92)" />
            <SvgText x="22" y="286" fill="#475569" fontSize="11">
              Minnesota · Preview
            </SvgText>
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', backgroundColor: '#D8E4EF' },
  fill: { flex: 1, minHeight: 200 },
});
