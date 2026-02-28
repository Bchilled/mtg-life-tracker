import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';
import { COLORS, PLAYER_COLOR_OPTIONS } from '../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STARTING_LIFE_OPTIONS = [20, 25, 30, 40, 60];

export default function SettingsModal({ visible, onClose }: Props) {
  const players = useGameStore((s) => s.players);
  const startingLife = useGameStore((s) => s.startingLife);
  const updatePlayerName = useGameStore((s) => s.updatePlayerName);
  const updatePlayerColor = useGameStore((s) => s.updatePlayerColor);
  const updateStartingLife = useGameStore((s) => s.updateStartingLife);
  const resetGame = useGameStore((s) => s.resetGame);

  const [editingName, setEditingName] = useState<{ id: string; value: string } | null>(null);

  const handleNameBlur = () => {
    if (editingName && editingName.value.trim()) {
      updatePlayerName(editingName.id, editingName.value.trim());
    }
    setEditingName(null);
  };

  const handleReset = () => {
    Alert.alert(
      'New Game',
      'Start a new game? Player names and colors will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Game',
          style: 'destructive',
          onPress: () => {
            resetGame();
            onClose();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Starting Life */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Starting Life Total</Text>
            <Text style={styles.sectionNote}>Change takes effect on new game</Text>
            <View style={styles.lifeOptions}>
              {STARTING_LIFE_OPTIONS.map((life) => (
                <TouchableOpacity
                  key={life}
                  style={[styles.lifeOption, startingLife === life && styles.lifeOptionActive]}
                  onPress={() => {
                    updateStartingLife(life);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.lifeOptionText, startingLife === life && styles.lifeOptionTextActive]}>
                    {life}
                  </Text>
                  {life === 40 && <Text style={styles.lifeOptionNote}>Commander</Text>}
                  {life === 20 && <Text style={styles.lifeOptionNote}>Standard</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Players */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Players</Text>
            {players.map((player, index) => (
              <View key={player.id} style={[styles.playerRow, { borderLeftColor: player.color }]}>
                <Text style={styles.playerIndex}>{index + 1}</Text>

                {/* Name */}
                {editingName?.id === player.id ? (
                  <TextInput
                    style={styles.nameInput}
                    value={editingName.value}
                    onChangeText={(v) => setEditingName({ id: player.id, value: v })}
                    onBlur={handleNameBlur}
                    onSubmitEditing={handleNameBlur}
                    autoFocus
                    maxLength={20}
                    returnKeyType="done"
                    placeholderTextColor={COLORS.textDim}
                    selectionColor={COLORS.gold}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.nameTouchable}
                    onPress={() => setEditingName({ id: player.id, value: player.name })}
                  >
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.editHint}>✎</Text>
                  </TouchableOpacity>
                )}

                {/* Color picker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorRow}>
                    {PLAYER_COLOR_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: opt.value },
                          player.color === opt.value && styles.colorSwatchActive,
                        ]}
                        onPress={() => {
                          updatePlayerColor(player.id, opt.value);
                          Haptics.selectionAsync();
                        }}
                      >
                        {player.color === opt.value && (
                          <Text style={styles.colorCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </View>

          {/* Game Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game</Text>
            <TouchableOpacity style={styles.newGameBtn} onPress={handleReset}>
              <Text style={styles.newGameBtnText}>⚔  Start New Game</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.aboutCard}>
              <Text style={styles.aboutTitle}>Commander Life Tracker</Text>
              <Text style={styles.aboutText}>
                Built for 4-player Commander (EDH) games.{'\n'}
                Features: life tracking, commander damage, poison counters, experience, energy,
                land drop tracker, draw tracker, spell stack counter, day/night cycle,
                monarch &amp; initiative, dice roller, full action log with undo.
              </Text>
              <Text style={styles.aboutText}>
                Tap left half of a player panel to −1 life.{'\n'}
                Tap right half to +1 life.{'\n'}
                Long-press for ±5.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionNote: {
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: -8,
  },

  // Starting life
  lifeOptions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  lifeOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    minWidth: 60,
  },
  lifeOptionActive: {
    borderColor: COLORS.gold,
    backgroundColor: `${COLORS.gold}22`,
  },
  lifeOptionText: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontWeight: '700',
  },
  lifeOptionTextActive: {
    color: COLORS.gold,
  },
  lifeOptionNote: {
    color: COLORS.textDim,
    fontSize: 9,
    marginTop: 2,
  },

  // Player rows
  playerRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    gap: 10,
  },
  playerIndex: {
    color: COLORS.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  nameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  editHint: {
    color: COLORS.textDim,
    fontSize: 14,
  },
  nameInput: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.gold,
    paddingVertical: 2,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: COLORS.text,
    transform: [{ scale: 1.15 }],
  },
  colorCheck: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // New game
  newGameBtn: {
    backgroundColor: `${COLORS.danger}22`,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newGameBtnText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '700',
  },

  // About
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aboutTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  aboutText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
