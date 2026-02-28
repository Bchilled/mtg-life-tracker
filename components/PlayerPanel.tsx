import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Player, COMMANDER_DAMAGE_THRESHOLD, POISON_THRESHOLD } from '../types';
import { COLORS } from '../constants';
import { useGameStore } from '../store/gameStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  player: Player;
  allPlayers: Player[];
  rotation: 0 | 180;
  isActive: boolean;
  isMonarch: boolean;
  hasInitiative: boolean;
  onOpenCommanderDamage: (playerId: string) => void;
}

// ─── Counter Badge ────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  value: number;
  color: string;
  darkColor: string;
  onInc: () => void;
  onDec: () => void;
  warn?: boolean;
}

function CounterBadge({ label, value, color, darkColor, onInc, onDec, warn }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: darkColor, borderColor: color }]}>
      <TouchableOpacity onPress={onDec} style={styles.badgeBtn}>
        <Text style={[styles.badgeBtnText, { color }]}>−</Text>
      </TouchableOpacity>
      <View style={styles.badgeCenter}>
        <Text style={[styles.badgeLabel, { color: warn && value > 0 ? '#FF6644' : color }]}>
          {label}
        </Text>
        <Text style={[styles.badgeValue, { color: warn && value > 0 ? '#FF6644' : COLORS.text }]}>
          {value}
        </Text>
      </View>
      <TouchableOpacity onPress={onInc} style={styles.badgeBtn}>
        <Text style={[styles.badgeBtnText, { color }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Player Panel ─────────────────────────────────────────────────────────────

export default function PlayerPanel({
  player,
  allPlayers,
  rotation,
  isActive,
  isMonarch,
  hasInitiative,
  onOpenCommanderDamage,
}: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const adjustLife = useGameStore((s) => s.adjustLife);
  const adjustPoison = useGameStore((s) => s.adjustPoison);
  const adjustExperience = useGameStore((s) => s.adjustExperience);
  const adjustEnergy = useGameStore((s) => s.adjustEnergy);
  const toggleLandPlayed = useGameStore((s) => s.toggleLandPlayed);
  const adjustCardsDrawn = useGameStore((s) => s.adjustCardsDrawn);
  const toggleEliminated = useGameStore((s) => s.toggleEliminated);

  // Flash animation when life changes
  const flashAnim = useRef(new Animated.Value(0)).current;

  const triggerFlash = useCallback(
    (isPositive: boolean) => {
      flashAnim.setValue(isPositive ? 1 : -1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
      }).start();
    },
    [flashAnim],
  );

  const handleLife = useCallback(
    (delta: number) => {
      Haptics.impactAsync(
        delta > 0 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
      );
      adjustLife(player.id, delta);
      triggerFlash(delta > 0);
    },
    [adjustLife, player.id, triggerFlash],
  );

  // Background color derived from flash animation
  const flashBg = flashAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['rgba(180,30,30,0.35)', 'rgba(0,0,0,0)', 'rgba(30,160,60,0.35)'],
  });

  // Commander damage total from all opponents
  const totalCmdrDmg = Object.values(player.commanderDamage).reduce((a, b) => a + b, 0);
  const maxCmdrDmg = Math.max(0, ...Object.values(player.commanderDamage));
  const cmdrWarn = maxCmdrDmg >= COMMANDER_DAMAGE_THRESHOLD;
  const poisonWarn = player.poison >= POISON_THRESHOLD;

  const playerColor = player.color;
  const darkBg = player.isEliminated ? COLORS.eliminated : `${playerColor}22`;
  const borderColor = isActive ? COLORS.gold : `${playerColor}66`;

  const lifeFontSize = isTablet ? 110 : player.life >= 100 || player.life <= -100 ? 64 : 80;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkBg, borderColor, transform: [{ rotate: `${rotation}deg` }] },
        isActive && styles.activeContainer,
        player.isEliminated && styles.eliminatedContainer,
      ]}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: `${playerColor}44` }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.colorDot, { backgroundColor: playerColor }]} />
          <Text style={styles.playerName} numberOfLines={1}>
            {player.name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isMonarch && <Text style={styles.specialBadge}>👑</Text>}
          {hasInitiative && <Text style={styles.specialBadge}>⚡</Text>}
          {player.isEliminated && <Text style={styles.specialBadge}>💀</Text>}
        </View>
      </View>

      {/* ── Life Total + Tap Zones ── */}
      <Animated.View style={[styles.lifeArea, { backgroundColor: flashBg }]}>
        {/* Left tap = decrease */}
        <TouchableOpacity
          style={[styles.lifeTapZone, styles.lifeTapLeft]}
          onPress={() => handleLife(-1)}
          onLongPress={() => handleLife(-5)}
          delayLongPress={350}
          activeOpacity={0.7}
        >
          <Text style={[styles.tapHint, { color: `${playerColor}99` }]}>−</Text>
        </TouchableOpacity>

        {/* Right tap = increase */}
        <TouchableOpacity
          style={[styles.lifeTapZone, styles.lifeTapRight]}
          onPress={() => handleLife(+1)}
          onLongPress={() => handleLife(+5)}
          delayLongPress={350}
          activeOpacity={0.7}
        >
          <Text style={[styles.tapHint, { color: `${playerColor}99` }]}>+</Text>
        </TouchableOpacity>

        {/* Life total (non-interactive overlay) */}
        <View style={styles.lifeTotalOverlay} pointerEvents="none">
          <Text
            style={[
              styles.lifeTotal,
              { fontSize: lifeFontSize, color: player.isEliminated ? COLORS.eliminatedText : COLORS.text },
            ]}
          >
            {player.life}
          </Text>
          {player.isEliminated && (
            <Text style={styles.eliminatedLabel}>ELIMINATED</Text>
          )}
        </View>
      </Animated.View>

      {/* ── Quick Adjust Buttons ── */}
      <View style={styles.quickRow}>
        {[-10, -5, +5, +10].map((delta) => (
          <TouchableOpacity
            key={delta}
            style={[
              styles.quickBtn,
              { borderColor: `${playerColor}55`, backgroundColor: `${playerColor}22` },
            ]}
            onPress={() => handleLife(delta)}
          >
            <Text style={[styles.quickBtnText, { color: delta < 0 ? '#FF7766' : '#77DD77' }]}>
              {delta > 0 ? `+${delta}` : delta}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Counters Row ── */}
      <View style={styles.countersRow}>
        <CounterBadge
          label="☠"
          value={player.poison}
          color={COLORS.poison}
          darkColor={COLORS.poisonDark}
          onInc={() => { Haptics.selectionAsync(); adjustPoison(player.id, 1); }}
          onDec={() => { Haptics.selectionAsync(); adjustPoison(player.id, -1); }}
          warn={poisonWarn}
        />
        <CounterBadge
          label="★"
          value={player.experience}
          color={COLORS.experience}
          darkColor={COLORS.experienceDark}
          onInc={() => { Haptics.selectionAsync(); adjustExperience(player.id, 1); }}
          onDec={() => { Haptics.selectionAsync(); adjustExperience(player.id, -1); }}
        />
        <CounterBadge
          label="⚡"
          value={player.energy}
          color={COLORS.energy}
          darkColor={COLORS.energyDark}
          onInc={() => { Haptics.selectionAsync(); adjustEnergy(player.id, 1); }}
          onDec={() => { Haptics.selectionAsync(); adjustEnergy(player.id, -1); }}
        />
      </View>

      {/* ── Status Row ── */}
      <View style={styles.statusRow}>
        {/* Land Played */}
        <TouchableOpacity
          style={[
            styles.statusBtn,
            {
              backgroundColor: player.landPlayedThisTurn ? COLORS.landDark : 'transparent',
              borderColor: player.landPlayedThisTurn ? COLORS.land : COLORS.border,
            },
          ]}
          onPress={() => { Haptics.selectionAsync(); toggleLandPlayed(player.id); }}
        >
          <Text style={[styles.statusBtnText, { color: player.landPlayedThisTurn ? COLORS.land : COLORS.textMuted }]}>
            {player.landPlayedThisTurn ? '🌾 Land ✓' : '🌾 Land'}
          </Text>
        </TouchableOpacity>

        {/* Cards Drawn */}
        <View style={[styles.statusBtn, { borderColor: COLORS.border, flexDirection: 'row', gap: 4 }]}>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); adjustCardsDrawn(player.id, -1); }}>
            <Text style={[styles.statusBtnText, { color: COLORS.textMuted }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.statusBtnText, { color: COLORS.draw }]}>
            🃏 {player.cardsDrawnThisTurn}
          </Text>
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); adjustCardsDrawn(player.id, 1); }}>
            <Text style={[styles.statusBtnText, { color: COLORS.draw }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Commander Damage */}
        <TouchableOpacity
          style={[
            styles.statusBtn,
            {
              borderColor: cmdrWarn ? COLORS.danger : COLORS.border,
              backgroundColor: cmdrWarn ? `${COLORS.danger}22` : 'transparent',
            },
          ]}
          onPress={() => onOpenCommanderDamage(player.id)}
        >
          <Text style={[styles.statusBtnText, { color: cmdrWarn ? COLORS.danger : COLORS.textMuted }]}>
            {cmdrWarn ? '⚔ ' : '⚔ '}{totalCmdrDmg > 0 ? totalCmdrDmg : 'Cmdr'}
          </Text>
        </TouchableOpacity>

        {/* Eliminate Toggle */}
        <TouchableOpacity
          style={[styles.statusBtn, { borderColor: player.isEliminated ? COLORS.danger : COLORS.border }]}
          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); toggleEliminated(player.id); }}
        >
          <Text style={[styles.statusBtnText, { color: player.isEliminated ? COLORS.danger : COLORS.textMuted }]}>
            {player.isEliminated ? '💀 Out' : '💀'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 0,
    overflow: 'hidden',
  },
  activeContainer: {
    borderWidth: 2.5,
  },
  eliminatedContainer: {
    opacity: 0.65,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    minHeight: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  playerName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  specialBadge: {
    fontSize: 14,
  },

  // Life Area
  lifeArea: {
    flex: 1,
    position: 'relative',
  },
  lifeTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifeTapLeft: {
    left: 0,
  },
  lifeTapRight: {
    right: 0,
  },
  tapHint: {
    fontSize: 36,
    fontWeight: '200',
    opacity: 0.4,
  },
  lifeTotalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lifeTotal: {
    fontWeight: '700',
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  eliminatedLabel: {
    color: COLORS.eliminatedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },

  // Quick Adjust
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 3,
  },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Counters
  countersRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 3,
    gap: 4,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  badgeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  badgeCenter: {
    flex: 1,
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  badgeValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },

  // Status Row
  statusRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 4,
    gap: 3,
  },
  statusBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 4,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  statusBtnText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
