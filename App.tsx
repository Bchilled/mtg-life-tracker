import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useGameStore } from './store/gameStore';
import { COLORS } from './constants';

import PlayerPanel from './components/PlayerPanel';
import GlobalControls from './components/GlobalControls';
import CommanderDamageModal from './components/CommanderDamageModal';
import ActionLogModal from './components/ActionLogModal';
import DiceRollerModal from './components/DiceRollerModal';
import SettingsModal from './components/SettingsModal';

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const players = useGameStore((s) => s.players);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const monarchPlayerId = useGameStore((s) => s.monarchPlayerId);
  const initiativePlayerId = useGameStore((s) => s.initiativePlayerId);
  const resetGame = useGameStore((s) => s.resetGame);

  // Modal visibility
  const [cmdrDmgTargetId, setCmdrDmgTargetId] = useState<string | null>(null);
  const [logVisible, setLogVisible] = useState(false);
  const [diceVisible, setDiceVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleResetGame = useCallback(() => {
    Alert.alert(
      'New Game',
      'Start a fresh game? Player names and colors are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Game',
          style: 'destructive',
          onPress: () => {
            resetGame();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }, [resetGame]);

  // ── Seat layout ──────────────────────────────────────────────────────────
  //
  //   [P3 ↕180°] [P4 ↕180°]   ← faces player sitting at the TOP
  //   ──── Center Controls ────
  //   [P1]       [P2]          ← faces player sitting at the BOTTOM
  //
  // Works on both phones (portrait) and tablets.

  const p1 = players[0]; // bottom-left  (0°)
  const p2 = players[1]; // bottom-right (0°)
  const p3 = players[2]; // top-left     (180°)
  const p4 = players[3]; // top-right    (180°)

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>

        {/* ── Top Row — rotated 180° ── */}
        <View style={styles.row}>
          <PlayerPanel
            player={p3}
            allPlayers={players}
            rotation={180}
            isActive={activePlayerIndex === 2}
            isMonarch={monarchPlayerId === p3.id}
            hasInitiative={initiativePlayerId === p3.id}
            onOpenCommanderDamage={setCmdrDmgTargetId}
          />
          <PlayerPanel
            player={p4}
            allPlayers={players}
            rotation={180}
            isActive={activePlayerIndex === 3}
            isMonarch={monarchPlayerId === p4.id}
            hasInitiative={initiativePlayerId === p4.id}
            onOpenCommanderDamage={setCmdrDmgTargetId}
          />
        </View>

        {/* ── Center Controls Strip ── */}
        <GlobalControls
          onOpenLog={() => setLogVisible(true)}
          onOpenDice={() => setDiceVisible(true)}
          onOpenSettings={() => setSettingsVisible(true)}
          onResetGame={handleResetGame}
        />

        {/* ── Bottom Row — normal orientation ── */}
        <View style={styles.row}>
          <PlayerPanel
            player={p1}
            allPlayers={players}
            rotation={0}
            isActive={activePlayerIndex === 0}
            isMonarch={monarchPlayerId === p1.id}
            hasInitiative={initiativePlayerId === p1.id}
            onOpenCommanderDamage={setCmdrDmgTargetId}
          />
          <PlayerPanel
            player={p2}
            allPlayers={players}
            rotation={0}
            isActive={activePlayerIndex === 1}
            isMonarch={monarchPlayerId === p2.id}
            hasInitiative={initiativePlayerId === p2.id}
            onOpenCommanderDamage={setCmdrDmgTargetId}
          />
        </View>

        {/* ── Modals ── */}
        <CommanderDamageModal
          targetPlayerId={cmdrDmgTargetId}
          onClose={() => setCmdrDmgTargetId(null)}
        />
        <ActionLogModal visible={logVisible} onClose={() => setLogVisible(false)} />
        <DiceRollerModal visible={diceVisible} onClose={() => setDiceVisible(false)} />
        <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
});
