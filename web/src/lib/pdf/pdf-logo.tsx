import { Circle, G, Line, Path, Rect, Svg, Text, View } from "@react-pdf/renderer";
import { pdfColors } from "@/lib/pdf/pdf-colors";

export function PdfFleetLogoMark({ size = 26 }: { size?: number }) {
  const height = Math.round(size * (56 / 48));
  return (
    <Svg width={size} height={height} viewBox="0 0 48 56">
      <Path
        d="M24 1.5C14.887 1.5 7.5 8.887 7.5 18c0 10.8 16.5 34.5 16.5 34.5S40.5 28.8 40.5 18C40.5 8.887 33.113 1.5 24 1.5Z"
        fill="#F97316"
      />
      <Circle cx={24} cy={18.5} r={12.5} fill="#FFFFFF" />
      <G transform="translate(24 18.5)">
        <Rect x={-9.5} y={-6.5} width={19} height={11} rx={2.2} fill={pdfColors.primary} />
        <Rect x={-8} y={-7.8} width={16} height={2.2} rx={1} fill={pdfColors.dark} />
        <Circle cx={-4.5} cy={-8.6} r={0.9} fill="#FDE68A" />
        <Circle cx={0} cy={-8.6} r={0.9} fill="#FDE68A" />
        <Circle cx={4.5} cy={-8.6} r={0.9} fill="#FDE68A" />
        <Rect x={-7.2} y={-5.2} width={6.2} height={4.2} rx={0.8} fill="#EEF0F9" />
        <Rect x={1} y={-5.2} width={6.2} height={4.2} rx={0.8} fill="#EEF0F9" />
        <Rect x={-11.2} y={-3.8} width={1.6} height={2.4} rx={0.5} fill={pdfColors.dark} />
        <Rect x={9.6} y={-3.8} width={1.6} height={2.4} rx={0.5} fill={pdfColors.dark} />
        <Circle cx={-5.8} cy={2.8} r={1.35} fill="#FEF3C7" />
        <Circle cx={5.8} cy={2.8} r={1.35} fill="#FEF3C7" />
        <Rect x={-3.2} y={1.6} width={6.4} height={1.2} rx={0.35} fill={pdfColors.dark} />
        <Line x1={-2.2} y1={1.6} x2={-2.2} y2={2.8} stroke="#FFFFFF" strokeWidth={0.45} />
        <Line x1={0} y1={1.6} x2={0} y2={2.8} stroke="#FFFFFF" strokeWidth={0.45} />
        <Line x1={2.2} y1={1.6} x2={2.2} y2={2.8} stroke="#FFFFFF" strokeWidth={0.45} />
        <Rect x={-8.2} y={4.2} width={16.4} height={1.3} rx={0.45} fill={pdfColors.dark} />
      </G>
    </Svg>
  );
}

export function PdfFleetBrand({ compact }: { compact?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <PdfFleetLogoMark size={compact ? 20 : 26} />
      <View style={{ marginLeft: 8 }}>
        <Text
          style={{
            fontSize: compact ? 10 : 12,
            fontFamily: "Helvetica-Bold",
            color: pdfColors.dark,
            letterSpacing: 0.3,
          }}
        >
          FleetPilot
        </Text>
        {!compact ? (
          <Text style={{ fontSize: 7, color: pdfColors.muted, marginTop: 1 }}>Transportation</Text>
        ) : null}
      </View>
    </View>
  );
}
