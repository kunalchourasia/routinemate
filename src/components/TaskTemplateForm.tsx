import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { TaskTemplate, HouseholdMember, RecurrenceRule } from '../types';
import RecurrencePicker from './RecurrencePicker';
import AssignmentStrategyPicker from './AssignmentStrategyPicker';

interface TaskTemplateFormProps {
  householdId: string;
  householdMembers: HouseholdMember[];
  onSubmit: (template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  initialTemplate?: Partial<TaskTemplate>;
}

export const TaskTemplateForm: React.FC<TaskTemplateFormProps> = ({
  householdId,
  householdMembers,
  onSubmit,
  onCancel,
  initialTemplate,
}) => {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(initialTemplate?.recurrence_rule);
  const [assignmentStrategy, setAssignmentStrategy] = useState<'single' | 'round_robin' | 'load_balance'>(
    initialTemplate?.assignment_strategy || 'single'
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialTemplate?.round_robin_users || []);
  const [singleAssignee, setSingleAssignee] = useState<string | undefined>(initialTemplate?.default_assignee);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showAssignmentPicker, setShowAssignmentPicker] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (!recurrenceRule) {
      Alert.alert('Error', 'Please set a recurrence pattern');
      return;
    }

    if (assignmentStrategy === 'single' && !singleAssignee) {
      Alert.alert('Error', 'Please select an assignee');
      return;
    }

    if ((assignmentStrategy === 'round_robin' || assignmentStrategy === 'load_balance') && selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setIsSubmitting(true);
    try {
      const template: Omit<TaskTemplate, 'id' | 'created_at' | 'updated_at'> = {
        household_id: householdId,
        name: name.trim(),
        description: description.trim(),
        recurrence_rule_id: recurrenceRule.id,
        default_assignee: assignmentStrategy === 'single' ? singleAssignee : undefined,
        round_robin_users: assignmentStrategy !== 'single' ? selectedUsers : [],
        assignment_strategy: assignmentStrategy,
        is_active: true,
        created_by: '', // Will be set by API service
      };

      await onSubmit(template);
    } catch (error) {
      Alert.alert('Error', 'Failed to create template. Please try again.');
      console.error('Template creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRecurrenceSummary = () => {
    if (!recurrenceRule) return 'Not set';
    switch (recurrenceRule.frequency) {
      case 'daily':
        return recurrenceRule.interval === 1 ? 'Every day' : `Every ${recurrenceRule.interval} days`;
      case 'weekly':
        return recurrenceRule.interval === 1 ? 'Every week' : `Every ${recurrenceRule.interval} weeks`;
      case 'monthly':
        return recurrenceRule.interval === 1 ? 'Every month' : `Every ${recurrenceRule.interval} months`;
      default:
        return 'Custom';
    }
  };

  const getAssignmentSummary = () => {
    switch (assignmentStrategy) {
      case 'single':
        const assignee = householdMembers.find(m => m.user_id === singleAssignee);
        return `Always: ${assignee?.user?.full_name || assignee?.user?.email || 'Unknown'}`;
      case 'round_robin':
        return `Round-robin: ${selectedUsers.length} members`;
      case 'load_balance':
        return `Load balance: ${selectedUsers.length} members`;
      default:
        return 'Not set';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {initialTemplate ? 'Edit Task Template' : 'Create Task Template'}
        </Text>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.label}>Template Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Take out trash, Clean kitchen"
            maxLength={255}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details about this task..."
            multiline
            numberOfLines={3}
            maxLength={1000}
          />
        </View>

        {/* Recurrence Pattern */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurrence Pattern</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowRecurrencePicker(true)}
          >
            <Text style={styles.pickerButtonLabel}>Recurrence</Text>
            <Text style={styles.pickerButtonValue}>
              {getRecurrenceSummary()}
            </Text>
            <Text style={styles.pickerButtonArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Assignment Strategy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignment Strategy</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowAssignmentPicker(true)}
          >
            <Text style={styles.pickerButtonLabel}>Assignment</Text>
            <Text style={styles.pickerButtonValue}>
              {getAssignmentSummary()}
            </Text>
            <Text style={styles.pickerButtonArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>{name || 'Template Name'}</Text>
            <Text style={styles.previewDetail}>📅 {getRecurrenceSummary()}</Text>
            <Text style={styles.previewDetail}>👥 {getAssignmentSummary()}</Text>
            {description && (
              <Text style={styles.previewDescription}>{description}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, isSubmitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Creating...' : initialTemplate ? 'Update Template' : 'Create Template'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {showRecurrencePicker && (
        <RecurrencePicker
          value={recurrenceRule}
          onChange={setRecurrenceRule}
          onClose={() => setShowRecurrencePicker(false)}
        />
      )}

      {showAssignmentPicker && (
        <AssignmentStrategyPicker
          strategy={assignmentStrategy}
          selectedUsers={selectedUsers}
          singleAssignee={singleAssignee}
          householdMembers={householdMembers}
          onChange={(config) => {
            setAssignmentStrategy(config.strategy);
            setSelectedUsers(config.selectedUsers);
            setSingleAssignee(config.singleAssignee);
          }}
          onClose={() => setShowAssignmentPicker(false)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  pickerButtonValue: {
    fontSize: 14,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  pickerButtonArrow: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 8,
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default TaskTemplateForm;