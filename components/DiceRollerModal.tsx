import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';
import { COLORS, DICE_OPTIONS } from '../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DiceRollerModal({ visible, onClose }: Props) {
  const addDiceRollLog = useGameStore((s) => s.addDiceRollLog);
  const [selectedDie, setSelectedDie] = useState(20);
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<Array<{ sides: number; result: number }>>([]);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const roll = () => {
    if (isRolling) return;
    setIsRolling(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate shake
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(shakeAnim, { toValue: 10, useNativeDriver: true, speed: 50, bounciness: 20 }),
      Animated.spring(shakeAnim, { toValue: -10, useNativeDriver: true, speed: 50, bounciness: 20 }),
      Animated.spring(shakeAnim, { toValue: 8, useNativeDriver: true, speed: 50, bounciness: 20 }),
      Animated.spring(shakeAnim, { toValue: -8, useNativeDriver: true, speed: 50, bounciness: 20 }),
      Animated.spring(shakeAnim, { toValue: 0, useNativeDriver: true, speed: 50, bounciness: 20 }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      const rolled = Math.floor(Math.random() * selectedDie) + 1;
      setResult(rolled);
      setHistory((h) => [{ sides: selectedDie, result: rolled }, ...h].slice(0, 10));
      addDiceRollLog(selectedDie, rolled);
      setIsRolling(false);
    });
  };

  const isNat = result === selectedDie;
  const isOne = result === 1;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Dice Roller</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Die selector */}
          <View style={styles.dieSelector}>
            {DICE_OPTIONS.map((sides) => (
              <TouchableOpacity
                key={sides}
                style={[styles.dieChip, selectedDie === sides && styles.dieChipActive]}
                onPress={() => {
                  setSelectedDie(sides);
                  setResult(null);
                  Haptics.selectionAsync();
                }}
              >
                <Text style={[styles.dieChipText, selectedDie === sides && styles.dieChipTextActive]}>
                  d{sides}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Roll display */}
          <View style={styles.rollArea}>
            <Animated.View
              style={[
                styles.dieDisplay,
                {
                  transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
                  borderColor: isNat ? COLORS.gold : isOne ? COLORS.danger : COLORS.border,
                  backgroundColor: isNat
                    ? `${COLORS.gold}22`
                    : isOne
                      ? `${COLORS.danger}22`
                      : COLORS.surfaceElevated,
                },
              ]}
            >
              {result !== null ? (
                <>
                  <Text
                    style={[
                      styles.resultNumber,
                      { color: isNat ? COLORS.goldLight : isOne ? COLORS.danger : COLORS.text },
                    ]}
                  >
                    {result}
                  </Text>
                  {isNat && <Text style={styles.natLabel}>NATURAL {selectedDie}!</Text>}
                  {isOne && <Text style={styles.oneLabel}>CRITICAL MISS</Text>}
                  <Text style={styles.dieLabel}>d{selectedDie}</Text>
                </>
              ) : (
                <Text style={styles.rollHint}>d{selectedDie}</Text>
              )}
            </Animated.View>

            <TouchableOpacity style={styles.rollBtn} onPress={roll} disabled={isRolling}>
              <Text style={styles.rollBtnText}>{isRolling ? '...' : 'Roll'}</Text>
            </TouchableOpacity>
          </View>

          {/* Coin flip */}
          <TouchableOpacity
            style={styles.coinBtn}
            onPress={() => {
              const flip = Math.random() < 0.5 ? 'Heads' : 'Tails';
              setResult(null);
              addDiceRollLog(2, flip === 'Heads' ? 2 : 1);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setHistory((h) => [{ sides: 0, result: flip === 'Heads' ? 2 : 1 }, ...h].slice(0, 10));
              alert(`Coin flip: ${flip}`);
            }}
          >
            <Text style={styles.coinBtnText}>🪙 Flip Coin</Text>
          </TouchableOpacity>

          {/* Roll history */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Rolls</Text>
              <View style={styles.historyList}>
                {history.map((h, i) => (
                  <View key={i} style={styles.historyItem}>
                    <Text style={styles.historyDie}>{h.sides > 0 ? `d${h.sides}` : '🪙'}</Text>
                    <Text style={styles.historyResult}>{h.result}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },

  dieSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dieChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
  },
  dieChipActive: {
    borderColor: COLORS.gold,
    backgroundColor: `${COLORS.gold}22`,
  },
  dieChipText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  dieChipTextActive: {
    color: COLORS.gold,
  },

  rollArea: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 20,
  },
  dieDisplay: {
    width: 160,
    height: 160,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultNumber: {
    fontSize: 72,
    fontWeight: '800',
    lineHeight: 76,
  },
  dieLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  natLabel: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  oneLabel: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rollHint: {
    color: COLORS.textDim,
    fontSize: 40,
    fontWeight: '300',
  },
  rollBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 30,
  },
  rollBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  coinBtn: {
    marginHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
  },
  coinBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },

  historySection: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  historyTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyItem: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  historyDie: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  historyResult: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
