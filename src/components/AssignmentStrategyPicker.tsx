import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { HouseholdMember } from '../types';

interface AssignmentStrategyPickerProps {
  strategy: 'single' | 'round_robin' | 'load_balance';
  selectedUsers: string[];
  singleAssignee?: string;
  householdMembers: HouseholdMember[];
  onChange: (config: {
    strategy: 'single' | 'round_robin' | 'load_balance';
    selectedUsers: string[];
    singleAssignee?: string;
  }) => void;
  onClose: () => void;
}

export const AssignmentStrategyPicker: React.FC<AssignmentStrategyPickerProps> = ({
  strategy: initialStrategy,
  selectedUsers: initialSelectedUsers,
  singleAssignee: initialSingleAssignee,
  householdMembers,
  onChange,
  onClose,
}) => {
  const [strategy, setStrategy] = useState(initialStrategy);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialSelectedUsers);
  const [singleAssignee, setSingleAssignee] = useState<string | undefined>(initialSingleAssignee);

  const handleStrategyChange = (newStrategy: 'single' | 'round_robin' | 'load_balance') => {
    setStrategy(newStrategy);
    if (newStrategy === 'single') {
      setSelectedUsers([]);
    } else if (newStrategy === 'round_robin' || newStrategy === 'load_balance') {
      setSingleAssignee(undefined);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = () => {
    onChange({
      strategy,
      selectedUsers,
      singleAssignee,
    });
    onClose();
  };

  const getStrategyDescription = (strat: string) => {
    switch (strat) {
      case 'single':
        return 'Always assign to the same person';
      case 'round_robin':
        return 'Rotate assignments among selected members';
      case 'load_balance':
        return 'Assign to member with fewest tasks';
      default:
        return '';
    }
  };

  const isValid = () => {
    if (strategy === 'single') {
      return !!singleAssignee;
    }
    if (strategy === 'round_robin' || strategy === 'load_balance') {
      return selectedUsers.length > 0;
    }
    return true;
  };

  return (
    <Modal animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Assignment Strategy</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Strategy Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How should tasks be assigned?</Text>
              {(['single', 'round_robin', 'load_balance'] as const).map(strat => (
                <TouchableOpacity
                  key={strat}
                  style={[styles.strategyOption, strategy === strat && styles.selectedStrategy]}
                  onPress={() => handleStrategyChange(strat)}
                >
                  <View style={styles.strategyContent}>
                    <Text style={[styles.strategyTitle, strategy === strat && styles.selectedStrategyText]}>
                      {strat === 'single' ? 'Single Person' :
                       strat === 'round_robin' ? 'Round Robin' : 'Load Balance'}
                    </Text>
                    <Text style={[styles.strategyDescription, strategy === strat && styles.selectedStrategyText]}>
                      {getStrategyDescription(strat)}
                    </Text>
                  </View>
                  {strategy === strat && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Single Assignee Selection */}
            {strategy === 'single' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Person</Text>
                {householdMembers.map(member => (
                  <TouchableOpacity
                    key={member.user_id}
                    style={[styles.userOption, singleAssignee === member.user_id && styles.selectedUser]}
                    onPress={() => setSingleAssignee(member.user_id)}
                  >
                    <Text style={[styles.userName, singleAssignee === member.user_id && styles.selectedUserText]}>
                      {member.user?.full_name || member.user?.email || 'Unknown User'}
                    </Text>
                    <Text style={[styles.userRole, singleAssignee === member.user_id && styles.selectedUserText]}>
                      {member.role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Multi-user Selection */}
            {(strategy === 'round_robin' || strategy === 'load_balance') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Select Members ({selectedUsers.length} selected)
                </Text>
                {householdMembers.map(member => (
                  <TouchableOpacity
                    key={member.user_id}
                    style={[styles.userOption, selectedUsers.includes(member.user_id) && styles.selectedUser]}
                    onPress={() => handleUserToggle(member.user_id)}
                  >
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, selectedUsers.includes(member.user_id) && styles.selectedUserText]}>
                        {member.user?.full_name || member.user?.email || 'Unknown User'}
                      </Text>
                      <Text style={[styles.userRole, selectedUsers.includes(member.user_id) && styles.selectedUserText]}>
                        {member.role}
                      </Text>
                    </View>
                    {selectedUsers.includes(member.user_id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewContainer}>
                {strategy === 'single' && singleAssignee && (
                  <Text style={styles.previewText}>
                    Tasks will always be assigned to{' '}
                    <Text style={styles.previewHighlight}>
                      {householdMembers.find(m => m.user_id === singleAssignee)?.user?.full_name || 'selected person'}
                    </Text>
                  </Text>
                )}
                {(strategy === 'round_robin' || strategy === 'load_balance') && (
                  <Text style={styles.previewText}>
                    Tasks will be assigned {strategy === 'round_robin' ? 'in rotation' : 'to the least busy member'} among{' '}
                    <Text style={styles.previewHighlight}>
                      {selectedUsers.length} selected members
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !isValid() && styles.disabledButton]}
              onPress={handleSave}
              disabled={!isValid()}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  strategyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedStrategy: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  strategyContent: {
    flex: 1,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedStrategyText: {
    color: '#1976D2',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '600',
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedUser: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  selectedUserText: {
    color: '#2E7D32',
  },
  previewContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  previewHighlight: {
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    marginLeft: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default AssignmentStrategyPicker;