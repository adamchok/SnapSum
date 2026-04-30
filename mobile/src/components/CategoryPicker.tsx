import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing, radius } from '../theme/tokens';
import { useCategoriesQuery, useCreateCategory } from '../features/categories/hooks';
import { Category } from '../features/categories/types';

type CategoryPickerProps = {
  visible: boolean;
  selected: string;
  onSelect: (name: string) => void;
  onClose: () => void;
};

export function CategoryPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: CategoryPickerProps) {
  const { colors } = useTheme();
  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateCategory();
  const [newName, setNewName] = useState('');
  const categories = categoriesQuery.data ?? [];

  const handleSelect = (cat: Category) => {
    onSelect(cat.name);
    onClose();
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const existing = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      onSelect(existing.name);
      setNewName('');
      onClose();
      return;
    }

    const created = await createMutation.mutateAsync({ name: trimmed });
    onSelect(created.name);
    setNewName('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surfaceBase }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.ink900 }]}>
              Pick a category
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close category picker"
            >
              <Text style={[styles.close, { color: colors.ink500 }]}>Done</Text>
            </Pressable>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item.name === selected;
              return (
                <Pressable
                  style={[
                    styles.row,
                    { borderBottomColor: colors.strokeSubtle },
                    isSelected && { backgroundColor: colors.surfaceSunken },
                  ]}
                  onPress={() => handleSelect(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.name}`}
                >
                  <View
                    style={[styles.dot, { backgroundColor: item.color }]}
                  />
                  <Text style={[styles.name, { color: colors.ink900 }]}>
                    {item.name}
                  </Text>
                  {isSelected && (
                    <Text style={{ color: colors.brandPrimary, fontWeight: '700' }}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />

          <View style={[styles.createRow, { borderTopColor: colors.strokeSubtle }]}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="New category name"
              placeholderTextColor={colors.ink500}
              style={[
                styles.input,
                {
                  borderColor: colors.strokeSubtle,
                  color: colors.ink900,
                  backgroundColor: colors.surfaceRaised,
                },
              ]}
            />
            <Pressable
              onPress={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
              style={[
                styles.addBtn,
                { backgroundColor: colors.brandPrimary },
                (!newName.trim() || createMutation.isPending) && styles.disabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add new category"
            >
              <Text style={styles.addLabel}>Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    gap: spacing.md,
    minHeight: 48,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  addBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.5,
  },
});
