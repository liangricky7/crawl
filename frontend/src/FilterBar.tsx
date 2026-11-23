import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import type { Mode } from './api';
import { colors, shadow } from './theme';

const MODE_META: Record<Mode, { label: string; icon: keyof typeof Icon.glyphMap }> = {
  walk: { label: 'Walk', icon: 'walk' },
  bike: { label: 'Bike', icon: 'bike' },
  bus: { label: 'Bus', icon: 'bus' },
  car: { label: 'Car', icon: 'car' },
};
const MODES = Object.keys(MODE_META) as Mode[];
const PRESETS = [5, 10, 15, 20, 30];

type Props = {
  loading: boolean;
  modes: Mode[];
  onModes: (m: Mode[]) => void;
  minutes: number;
  onMinutes: (n: number) => void;
  originIsPin: boolean;
  onUseMyLocation: () => void;
};

export function FilterBar({ loading, modes, onModes, minutes, onMinutes, originIsPin, onUseMyLocation }: Props) {
  const [open, setOpen] = useState<'modes' | 'time' | null>(null);
  const toggle = (p: 'modes' | 'time') => setOpen(open === p ? null : p);

  const toggleMode = (m: Mode) => {
    const next = modes.includes(m) ? modes.filter(x => x !== m) : [...modes, m];
    if (next.length) onModes(next); // at least one mode stays selected
  };

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open === 'modes' && (
        <Card title="Getting there" onDone={() => setOpen(null)}>
          <View style={styles.origin}>
            <Icon name="map-marker-outline" size={22} color={colors.ink} />
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>Starting from</Text>
              <Text style={styles.bold}>{originIsPin ? 'Dropped pin' : 'Current location'}</Text>
            </View>
            {originIsPin
              ? <Pressable onPress={onUseMyLocation} hitSlop={8}><Text style={styles.bold}>Use mine</Text></Pressable>
              : <Text style={styles.small}>Long-press map{'\n'}to change</Text>}
          </View>
          <View style={styles.grid}>
            {MODES.map(m => {
              const on = modes.includes(m);
              return (
                <Pressable key={m} onPress={() => toggleMode(m)} style={[styles.modeBtn, on && styles.modeBtnOn]}
                  accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <Icon name={MODE_META[m].icon} size={24} color={colors.ink} />
                  <Text style={[styles.bold, { flex: 1 }]}>{MODE_META[m].label}</Text>
                  <View style={[styles.check, on && styles.checkOn]}>
                    {on && <Icon name="check" size={16} color={colors.cream} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}

      {open === 'time' && (
        <Card title="How far" subtitle="Travel time" onDone={() => setOpen(null)}>
          <View style={styles.stepper}>
            <StepBtn icon="minus" onPress={() => onMinutes(Math.max(5, minutes - 5))} label="Less time" />
            <Text style={styles.big}>{minutes} <Text style={styles.unit}>min</Text></Text>
            <StepBtn icon="plus" onPress={() => onMinutes(Math.min(120, minutes + 5))} label="More time" />
          </View>
          <View style={styles.presets}>
            {PRESETS.map(p => (
              <Pressable key={p} onPress={() => onMinutes(p)} style={[styles.preset, p === minutes && styles.presetOn]}>
                <Text style={[styles.bold, p === minutes && { color: colors.cream }]}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      )}

      <View style={styles.row}>
        <Pill active={open === 'modes'} onPress={() => toggle('modes')} label="Travel modes">
          {modes.map(m => <Icon key={m} name={MODE_META[m].icon} size={22} color={open === 'modes' ? colors.cream : colors.ink} />)}
        </Pill>
        <Pill active={open === 'time'} onPress={() => toggle('time')} label="Travel time">
          <Icon name="clock-outline" size={22} color={open === 'time' ? colors.cream : colors.ink} />
          <Text style={[styles.bold, open === 'time' && { color: colors.cream }]}>{minutes} min</Text>
        </Pill>
        {loading && (
          <View style={styles.spinner} accessibilityLabel="Updating travel area">
            <ActivityIndicator size="small" color={colors.green} />
          </View>
        )}
      </View>
    </View>
  );
}

function Pill({ active, onPress, label, children }: { active: boolean; onPress: () => void; label: string; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillOn]} accessibilityLabel={label} accessibilityRole="button">
      {children}
      <Icon name={active ? 'chevron-down' : 'chevron-up'} size={20} color={active ? colors.cream : colors.ink} />
    </Pressable>
  );
}

function Card({ title, subtitle, onDone, children }: { title: string; subtitle?: string; onDone: () => void; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.small}>{subtitle}</Text>}
        </View>
        <Pressable onPress={onDone} hitSlop={8}><Text style={styles.bold}>Done</Text></Pressable>
      </View>
      {children}
    </View>
  );
}

function StepBtn({ icon, onPress, label }: { icon: 'minus' | 'plus'; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.stepBtn} accessibilityLabel={label}>
      <Icon name={icon} size={26} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, bottom: 40, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 48,
    borderRadius: 14, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.hairline, ...shadow,
  },
  pillOn: { backgroundColor: colors.green, borderColor: colors.green },
  spinner: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.hairline, ...shadow,
  },
  card: { backgroundColor: colors.cream, borderRadius: 20, padding: 18, gap: 14, ...shadow },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  small: { fontSize: 13, color: colors.muted },
  bold: { fontSize: 16, fontWeight: '600', color: colors.ink },
  origin: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 12, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeBtn: {
    flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.white,
  },
  modeBtnOn: { borderColor: colors.green, borderWidth: 2 },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.green, borderColor: colors.green },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderRadius: 14, padding: 8 },
  stepBtn: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  big: { fontSize: 34, fontWeight: '700', color: colors.ink },
  unit: { fontSize: 18, fontWeight: '400' },
  presets: { flexDirection: 'row', gap: 8 },
  preset: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  presetOn: { backgroundColor: colors.green, borderColor: colors.green },
});
