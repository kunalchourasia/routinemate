import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { RecurrenceRule } from '../types';

interface RecurrencePickerProps {
  value?: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
  onClose: () => void;
}

export const RecurrencePicker: React.FC<RecurrencePickerProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>(
    value?.frequency || 'daily'
  );
  const [interval, setInterval] = useState(value?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    value?.days_of_week || []
  );
  const [dayOfMonth, setDayOfMonth] = useState<number | undefined>(
    value?.day_of_month
  );

  const weekdays = [
    { id: 1, name: 'Mon', fullName: 'Monday' },
    { id: 2, name: 'Tue', fullName: 'Tuesday' },
    { id: 3, name: 'Wed', fullName: 'Wednesday' },
    { id: 4, name: 'Thu', fullName: 'Thursday' },
    { id: 5, name: 'Fri', fullName: 'Friday' },
    { id: 6, name: 'Sat', fullName: 'Saturday' },
    { id: 0, name: 'Sun', fullName: 'Sunday' },
  ];

  const handleFrequencyChange = (newFrequency: RecurrenceRule['frequency']) => {
    setFrequency(newFrequency);
    // Reset related fields when frequency changes
    if (newFrequency === 'daily') {
      setDaysOfWeek([]);
      setDayOfMonth(undefined);
    } else if (newFrequency === 'weekly') {
      setDayOfMonth(undefined);
    } else if (newFrequency === 'monthly') {
      setDaysOfWeek([]);
    }
  };

  const handleDayToggle = (dayId: number) => {
    setDaysOfWeek(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSave = () => {
    const rule: RecurrenceRule = {
      id: value?.id || '',
      frequency,
      interval,
      days_of_week: daysOfWeek,
      day_of_month: dayOfMonth,
      created_at: value?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onChange(rule);
    onClose();
  };

  const getPreviewText = () => {
    switch (frequency) {
      case 'daily':
        return interval === 1 ? 'Every day' : `Every ${interval} days`;
      case 'weekly':
        if (daysOfWeek.length === 0) {
          return interval === 1 ? 'Every week' : `Every ${interval} weeks`;
        }
        const dayNames = daysOfWeek.map(day => weekdays.find(w => w.id === day)?.fullName).join(', ');
        return `Every ${interval === 1 ? 'week' : `${interval} weeks`} on ${dayNames}`;
      case 'monthly':
        if (dayOfMonth) {
          return interval === 1 ? `Monthly on day ${dayOfMonth}` : `Every ${interval} months on day ${dayOfMonth}`;
        }
        return interval === 1 ? 'Every month' : `Every ${interval} months`;
      default:
        return 'Custom recurrence';
    }
  };

  return (
    <Modal animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Set Recurrence</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Frequency Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frequency</Text>
              {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.option, frequency === freq && styles.selectedOption]}
                  onPress={() => handleFrequencyChange(freq)}
                >
                  <Text style={[styles.optionText, frequency === freq && styles.selectedOptionText]}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interval Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Every</Text>
              <View style={styles.intervalContainer}>
                <TouchableOpacity
                  style={styles.intervalButton}
                  onPress={() => setInterval(Math.max(1, interval - 1))}
                >
                  <Text style={styles.intervalButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.intervalText}>{interval}</Text>
                <TouchableOpacity
                  style={styles.intervalButton}
                  onPress={() => setInterval(interval + 1)}
                >
                  <Text style={styles.intervalButtonText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.intervalLabel}>
                  {frequency === 'daily' ? 'day(s)' : frequency === 'weekly' ? 'week(s)' : 'month(s)'}
                </Text>
              </View>
            </View>

            {/* Weekly Options */}
            {frequency === 'weekly' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Days of Week</Text>
                <View style={styles.weekdaysContainer}>
                  {weekdays.map(day => (
                    <TouchableOpacity
                      key={day.id}
                      style={[styles.weekdayButton, daysOfWeek.includes(day.id) && styles.selectedWeekday]}
                      onPress={() => handleDayToggle(day.id)}
                    >
                      <Text style={[styles.weekdayText, daysOfWeek.includes(day.id) && styles.selectedWeekdayText]}>
                        {day.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Monthly Options */}
            {frequency === 'monthly' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Day of Month</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayButton, dayOfMonth === day && styles.selectedDay]}
                      onPress={() => setDayOfMonth(day)}
                    >
                      <Text style={[styles.dayText, dayOfMonth === day && styles.selectedDayText]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <Text style={styles.previewText}>{getPreviewText()}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  intervalText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    minWidth: 40,
    textAlign: 'center',
  },
  intervalLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedWeekday: {
    backgroundColor: '#007AFF',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedWeekdayText: {
    color: '#fff',
  },
  daysContainer: {
    maxHeight: 60,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
  },
  previewText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
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
    backgroundColor: '#007AFF',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default RecurrencePicker;