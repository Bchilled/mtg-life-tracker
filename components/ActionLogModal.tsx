import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useGameStore } from '../store/gameStore';
import { ActionLogEntry, ActionCategory } from '../types';
import { COLORS } from '../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ActionCategory, { icon: string; color: string }> = {
  life: { icon: '♥', color: '#DD4444' },
  poison: { icon: '☠', color: COLORS.poison },
  experience: { icon: '★', color: COLORS.experience },
  energy: { icon: '⚡', color: COLORS.energy },
  commander: { icon: '⚔', color: '#CC8844' },
  land: { icon: '🌾', color: COLORS.land },
  draw: { icon: '🃏', color: COLORS.draw },
  turn: { icon: '⏱', color: COLORS.gold },
  stack: { icon: '≡', color: COLORS.stack },
  system: { icon: '◈', color: COLORS.textMuted },
  dice: { icon: '🎲', color: '#AA88DD' },
};

// ─── Log Item ─────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function LogItem({ entry, index }: { entry: ActionLogEntry; index: number }) {
  const cat = CATEGORY_CONFIG[entry.category] ?? { icon: '●', color: COLORS.textMuted };
  const isUndo = entry.action.startsWith('↩');
  const isSystem = entry.category === 'system' || entry.category === 'turn';

  return (
    <View style={[styles.logItem, index === 0 && styles.logItemFirst, isUndo && styles.logItemUndo]}>
      <View style={[styles.logIcon, { backgroundColor: `${cat.color}22` }]}>
        <Text style={[styles.logIconText, { color: cat.color }]}>{cat.icon}</Text>
      </View>
      <View style={styles.logContent}>
        {entry.playerName && !isSystem && (
          <Text style={styles.logPlayer}>{entry.playerName}</Text>
        )}
        <Text style={[styles.logAction, isSystem && styles.logActionSystem]}>
          {entry.action}
        </Text>
      </View>
      <Text style={styles.logTime}>{formatTime(entry.timestamp)}</Text>
    </View>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | ActionCategory;

const FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'life', label: '♥ Life' },
  { key: 'commander', label: '⚔ Cmdr' },
  { key: 'poison', label: '☠ Poison' },
  { key: 'land', label: '🌾 Land' },
  { key: 'draw', label: '🃏 Draw' },
  { key: 'stack', label: '≡ Stack' },
  { key: 'turn', label: '⏱ Turn' },
  { key: 'dice', label: '🎲 Dice' },
];

export default function ActionLogModal({ visible, onClose }: Props) {
  const actionLog = useGameStore((s) => s.actionLog);
  const undoLastAction = useGameStore((s) => s.undoLastAction);
  const undoHistory = useGameStore((s) => s.undoHistory);
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered =
    filter === 'all' ? actionLog : actionLog.filter((e) => e.category === filter);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Action Log</Text>
            <Text style={styles.subtitle}>{actionLog.length} events recorded</Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.undoBtn, undoHistory.length === 0 && styles.btnDisabled]}
              onPress={undoLastAction}
              disabled={undoHistory.length === 0}
            >
              <Text style={styles.undoBtnText}>↩ Undo</Text>
              {undoHistory.length > 0 && (
                <Text style={styles.undoCount}>{undoHistory.length}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter row */}
        <View style={styles.filterRow}>
          <FlatList
            data={FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(f) => f.key}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Text
                  style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Log list */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>Actions will appear here as you play</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(e) => e.id}
            renderItem={({ item, index }) => <LogItem entry={item} index={index} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Undo hint */}
        {undoHistory.length > 0 && (
          <View style={styles.undoHint}>
            <Text style={styles.undoHintText}>
              {undoHistory.length} action{undoHistory.length > 1 ? 's' : ''} can be undone
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  undoBtnText: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 14,
  },
  undoCount: {
    backgroundColor: COLORS.gold,
    color: '#000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  btnDisabled: {
    opacity: 0.35,
    borderColor: COLORS.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },

  // Filters
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterList: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    borderColor: COLORS.gold,
    backgroundColor: `${COLORS.gold}22`,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },

  // Log items
  list: {
    paddingVertical: 8,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  logItemFirst: {
    backgroundColor: `${COLORS.gold}0A`,
  },
  logItemUndo: {
    backgroundColor: `${COLORS.textDim}22`,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  logContent: {
    flex: 1,
  },
  logPlayer: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 1,
  },
  logAction: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  logActionSystem: {
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  logTime: {
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
  },

  // Empty state
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.textDim,
    fontSize: 13,
  },

  // Undo hint bar
  undoHint: {
    backgroundColor: `${COLORS.gold}15`,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.gold}44`,
    padding: 12,
    alignItems: 'center',
  },
  undoHintText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '500',
  },
});
