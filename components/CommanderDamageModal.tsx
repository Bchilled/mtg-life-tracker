import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';
import { COLORS } from '../constants';
import { COMMANDER_DAMAGE_THRESHOLD } from '../types';

interface Props {
  targetPlayerId: string | null;
  onClose: () => void;
}

export default function CommanderDamageModal({ targetPlayerId, onClose }: Props) {
  const players = useGameStore((s) => s.players);
  const adjustCommanderDamage = useGameStore((s) => s.adjustCommanderDamage);

  const target = players.find((p) => p.id === targetPlayerId);
  if (!target) return null;

  const opponents = players.filter((p) => p.id !== targetPlayerId);

  return (
    <Modal visible={!!targetPlayerId} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Commander Damage</Text>
              <Text style={styles.subtitle}>
                Tracking damage dealt TO{' '}
                <Text style={{ color: target.color }}>{target.name}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.rule}>
            21+ damage from a single commander eliminates a player
          </Text>

          <ScrollView contentContainerStyle={styles.list}>
            {opponents.map((source) => {
              const dmg = target.commanderDamage[source.id] || 0;
              const atLimit = dmg >= COMMANDER_DAMAGE_THRESHOLD;
              const nearLimit = dmg >= COMMANDER_DAMAGE_THRESHOLD - 3;

              return (
                <View
                  key={source.id}
                  style={[
                    styles.row,
                    { borderColor: atLimit ? COLORS.danger : nearLimit ? '#CC6600' : COLORS.border },
                    atLimit && styles.rowDanger,
                  ]}
                >
                  {/* Source player info */}
                  <View style={styles.sourceInfo}>
                    <View style={[styles.colorDot, { backgroundColor: source.color }]} />
                    <Text style={styles.sourceName}>{source.name}'s</Text>
                    <Text style={styles.commanderLabel}>Commander</Text>
                  </View>

                  {/* Damage controls */}
                  <View style={styles.controls}>
                    <TouchableOpacity
                      style={[styles.adjBtn, styles.adjBtnMinus]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        adjustCommanderDamage(target.id, source.id, -1);
                      }}
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        adjustCommanderDamage(target.id, source.id, -5);
                      }}
                      delayLongPress={400}
                    >
                      <Text style={styles.adjBtnText}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.dmgDisplay}>
                      <Text
                        style={[
                          styles.dmgValue,
                          { color: atLimit ? COLORS.danger : nearLimit ? '#FF9944' : COLORS.text },
                        ]}
                      >
                        {dmg}
                      </Text>
                      <Text style={styles.dmgLimit}>/ {COMMANDER_DAMAGE_THRESHOLD}</Text>
                      {atLimit && <Text style={styles.dmgWarn}>LETHAL</Text>}
                    </View>

                    <TouchableOpacity
                      style={[styles.adjBtn, styles.adjBtnPlus]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        adjustCommanderDamage(target.id, source.id, +1);
                      }}
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        adjustCommanderDamage(target.id, source.id, +5);
                      }}
                      delayLongPress={400}
                    >
                      <Text style={styles.adjBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Total commander damage received:{' '}
              <Text style={styles.summaryValue}>
                {Object.values(target.commanderDamage).reduce((a, b) => a + b, 0)}
              </Text>
            </Text>
            <Text style={styles.summaryNote}>
              Note: Commander damage also reduces life total
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  rule: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    fontStyle: 'italic',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  row: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  rowDanger: {
    backgroundColor: `${COLORS.danger}15`,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sourceName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  commanderLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  adjBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  adjBtnMinus: {
    borderColor: COLORS.danger,
    backgroundColor: `${COLORS.danger}22`,
  },
  adjBtnPlus: {
    borderColor: COLORS.success,
    backgroundColor: `${COLORS.success}22`,
  },
  adjBtnText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '300',
  },
  dmgDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dmgValue: {
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 46,
  },
  dmgLimit: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  dmgWarn: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  summary: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: COLORS.text,
    fontWeight: '700',
  },
  summaryNote: {
    color: COLORS.textDim,
    fontSize: 11,
    fontStyle: 'italic',
  },
});
