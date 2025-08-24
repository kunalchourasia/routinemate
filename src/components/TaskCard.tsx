import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TaskAssignment, User } from '../types';

interface TaskCardProps {
  assignment: TaskAssignment & { task?: { title: string; description?: string } };
  onComplete: (assignmentId: string) => void;
  onPress?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  assignment,
  onComplete,
  onPress
}) => {
  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date();
  const isCompleted = assignment.is_completed;

  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completed]}
      onPress={onPress}
      disabled={isCompleted}
    >
      <View style={styles.header}>
        <Text style={[styles.title, isCompleted && styles.completedText]}>
          {assignment.task?.title || 'Untitled Task'}
        </Text>
        {isOverdue && !isCompleted && (
          <Text style={styles.overdueBadge}>Overdue</Text>
        )}
      </View>

      {assignment.task?.description && (
        <Text style={[styles.description, isCompleted && styles.completedText]}>
          {assignment.task.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.assigneeInfo}>
          <Text style={styles.assignedTo}>
            Assigned to: {assignment.user ? 'You' : 'Unknown'}
          </Text>
          {assignment.due_date && (
            <Text style={[styles.dueDate, isOverdue && styles.overdueText]}>
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </Text>
          )}
        </View>

        {!isCompleted && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => onComplete(assignment.id)}
          >
            <Text style={styles.completeButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completed: {
    backgroundColor: '#f0f9f0',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  completedText: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  overdueBadge: {
    backgroundColor: '#ff6b6b',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assigneeInfo: {
    flex: 1,
  },
  assignedTo: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  overdueText: {
    color: '#ff6b6b',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TaskCard;