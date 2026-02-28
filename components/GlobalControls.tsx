import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants';

interface Props {
  onOpenLog: () => void;
  onOpenDice: () => void;
  onOpenSettings: () => void;
  onResetGame: () => void;
}

export default function GlobalControls({ onOpenLog, onOpenDice, onOpenSettings, onResetGame }: Props) {
  const players = useGameStore((s) => s.players);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const turnNumber = useGameStore((s) => s.turnNumber);
  const spellStackCount = useGameStore((s) => s.spellStackCount);
  const isDay = useGameStore((s) => s.isDay);
  const monarchPlayerId = useGameStore((s) => s.monarchPlayerId);
  const initiativePlayerId = useGameStore((s) => s.initiativePlayerId);
  const undoHistory = useGameStore((s) => s.undoHistory);

  const nextTurn = useGameStore((s) => s.nextTurn);
  const setActivePlayer = useGameStore((s) => s.setActivePlayer);
  const adjustSpellStack = useGameStore((s) => s.adjustSpellStack);
  const clearSpellStack = useGameStore((s) => s.clearSpellStack);
  const toggleDayNight = useGameStore((s) => s.toggleDayNight);
  const setMonarch = useGameStore((s) => s.setMonarch);
  const setInitiative = useGameStore((s) => s.setInitiative);
  const undoLastAction = useGameStore((s) => s.undoLastAction);

  const activePlayer = players[activePlayerIndex];
  const monarch = monarchPlayerId ? players.find((p) => p.id === monarchPlayerId) : null;
  const initiativeHolder = initiativePlayerId ? players.find((p) => p.id === initiativePlayerId) : null;

  // Cycle monarch / initiative through players (null → P1 → P2 → P3 → P4 → null)
  const cycleMonarch = () => {
    Haptics.selectionAsync();
    if (!monarchPlayerId) {
      setMonarch(players[0].id);
    } else {
      const idx = players.findIndex((p) => p.id === monarchPlayerId);
      const next = idx >= players.length - 1 ? null : players[idx + 1].id;
      setMonarch(next);
    }
  };

  const cycleInitiative = () => {
    Haptics.selectionAsync();
    if (!initiativePlayerId) {
      setInitiative(players[0].id);
    } else {
      const idx = players.findIndex((p) => p.id === initiativePlayerId);
      const next = idx >= players.length - 1 ? null : players[idx + 1].id;
      setInitiative(next);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Turn Control ── */}
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.prevPlayerBtn}
            onPress={() => {
              Haptics.selectionAsync();
              const prev = (activePlayerIndex - 1 + players.length) % players.length;
              setActivePlayer(prev);
            }}
          >
            <Text style={styles.arrowText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.turnDisplay} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); nextTurn(); }}>
            <Text style={styles.turnLabel}>T{turnNumber}</Text>
            <View style={[styles.activePlayerDot, { backgroundColor: activePlayer?.color ?? COLORS.gold }]} />
            <Text style={styles.activePlayerName} numberOfLines={1}>
              {activePlayer?.name ?? '—'}
            </Text>
            <Text style={styles.nextHint}>tap→next</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextPlayerBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              nextTurn();
            }}
          >
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* ── Spell Stack ── */}
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.stackBtn}
            onPress={() => { Haptics.selectionAsync(); adjustSpellStack(-1); }}
          >
            <Text style={styles.stackBtnText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.stackDisplay} onLongPress={clearSpellStack} delayLongPress={600}>
            <Text style={styles.stackIcon}>≡</Text>
            <Text style={[styles.stackCount, spellStackCount > 0 && styles.stackCountActive]}>
              {spellStackCount}
            </Text>
            {spellStackCount > 0 && <Text style={styles.stackHint}>hold→clear</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stackBtn}
            onPress={() => { Haptics.selectionAsync(); adjustSpellStack(+1); }}
          >
            <Text style={styles.stackBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* ── Day/Night ── */}
        <TouchableOpacity style={styles.iconBtn} onPress={toggleDayNight}>
          <Text style={styles.iconBtnIcon}>{isDay ? '☀' : '🌙'}</Text>
          <Text style={[styles.iconBtnLabel, { color: isDay ? COLORS.day : COLORS.night }]}>
            {isDay ? 'Day' : 'Night'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ── Monarch ── */}
        <TouchableOpacity style={styles.iconBtn} onPress={cycleMonarch}>
          <Text style={styles.iconBtnIcon}>👑</Text>
          <Text style={[styles.iconBtnLabel, { color: monarch ? COLORS.monarch : COLORS.textDim }]} numberOfLines={1}>
            {monarch ? monarch.name.split(' ')[0] : 'None'}
          </Text>
        </TouchableOpacity>

        {/* ── Initiative ── */}
        <TouchableOpacity style={styles.iconBtn} onPress={cycleInitiative}>
          <Text style={styles.iconBtnIcon}>⚡</Text>
          <Text style={[styles.iconBtnLabel, { color: initiativeHolder ? COLORS.initiative : COLORS.textDim }]} numberOfLines={1}>
            {initiativeHolder ? initiativeHolder.name.split(' ')[0] : 'None'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* ── Undo ── */}
        <TouchableOpacity
          style={[styles.actionBtn, undoHistory.length === 0 && styles.actionBtnDisabled]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); undoLastAction(); }}
          disabled={undoHistory.length === 0}
        >
          <Text style={styles.actionBtnText}>↩</Text>
          {undoHistory.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{undoHistory.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Log ── */}
        <TouchableOpacity style={styles.actionBtn} onPress={onOpenLog}>
          <Text style={styles.actionBtnText}>📋</Text>
        </TouchableOpacity>

        {/* ── Dice ── */}
        <TouchableOpacity style={styles.actionBtn} onPress={onOpenDice}>
          <Text style={styles.actionBtnText}>🎲</Text>
        </TouchableOpacity>

        {/* ── Settings ── */}
        <TouchableOpacity style={styles.actionBtn} onPress={onOpenSettings}>
          <Text style={styles.actionBtnText}>⚙</Text>
        </TouchableOpacity>

        {/* ── New Game ── */}
        <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={onResetGame}>
          <Text style={[styles.actionBtnText, styles.resetBtnText]}>⚔</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    height: 60,
  },
  scrollContent: {
    paddingHorizontal: 6,
    alignItems: 'center',
    height: 60,
    gap: 4,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },

  // Turn control
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  prevPlayerBtn: {
    width: 24,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPlayerBtn: {
    width: 24,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: COLORS.textMuted,
    fontSize: 22,
    fontWeight: '300',
  },
  turnDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.gold + '55',
  },
  turnLabel: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  activePlayerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activePlayerName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 70,
  },
  nextHint: {
    color: COLORS.textDim,
    fontSize: 9,
  },

  // Spell stack
  stackBtn: {
    width: 26,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackBtnText: {
    color: COLORS.stack,
    fontSize: 18,
    fontWeight: '600',
  },
  stackDisplay: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: `${COLORS.stack}55`,
    minWidth: 48,
  },
  stackIcon: {
    color: COLORS.stack,
    fontSize: 14,
    fontWeight: '600',
  },
  stackCount: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  stackCountActive: {
    color: COLORS.stack,
  },
  stackHint: {
    color: COLORS.textDim,
    fontSize: 8,
  },

  // Icon buttons (day/night, monarch, initiative)
  iconBtn: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 44,
  },
  iconBtnIcon: {
    fontSize: 18,
  },
  iconBtnLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },

  // Action buttons (undo, log, dice, settings, reset)
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  actionBtnText: {
    fontSize: 16,
  },
  resetBtn: {
    borderColor: `${COLORS.danger}55`,
    backgroundColor: `${COLORS.danger}15`,
  },
  resetBtnText: {
    color: COLORS.danger,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },
});
