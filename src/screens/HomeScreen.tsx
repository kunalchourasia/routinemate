import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Household } from '../types';
import { apiService } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    try {
      const { data, error } = await apiService.getUserHouseholds();
      if (error) {
        Alert.alert('Error', 'Failed to load households');
        console.error('Error loading households:', error);
      } else {
        setHouseholds(data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load households');
      console.error('Error loading households:', error);
    } finally {
      setLoading(false);
    }
  };


  const renderHousehold = ({ item }: { item: Household }) => (
    <TouchableOpacity
      style={styles.householdCard}
      onPress={() => navigation.navigate('Household', { householdId: item.id })}
    >
      <Text style={styles.householdName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.householdDescription}>{item.description}</Text>
      )}
      <Text style={styles.householdMeta}>
        Created {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Create Household Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateHousehold')}
      >
        <Text style={styles.createButtonText}>+ Create Household</Text>
      </TouchableOpacity>

      {/* Households List */}
      <Text style={styles.sectionTitle}>Your Households</Text>
      {households.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No households yet. Create your first household to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={households}
          renderItem={renderHousehold}
          keyExtractor={(item) => item.id}
          style={styles.householdsList}
          showsVerticalScrollIndicator={false}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  householdsList: {
    flex: 1,
  },
  householdCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  householdName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  householdDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  householdMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});