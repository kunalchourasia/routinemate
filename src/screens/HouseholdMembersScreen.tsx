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
import { RootStackParamList, HouseholdMember } from '../types';
import { apiService } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'HouseholdMembers'>;

export default function HouseholdMembersScreen({ route, navigation }: Props) {
  const { householdId } = route.params;
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [householdId]);

  const loadMembers = async () => {
    try {
      const { data, error } = await apiService.getHouseholdMembers(householdId);
      if (error) {
        Alert.alert('Error', 'Failed to load household members');
        console.error('Error loading members:', error);
      } else {
        setMembers(data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load household members');
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = () => {
    navigation.navigate('InviteUser', { householdId });
  };

  const renderMember = ({ item }: { item: HouseholdMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {item.user?.full_name || item.user?.email || 'Unknown User'}
        </Text>
        <Text style={styles.memberEmail}>{item.user?.email}</Text>
      </View>
      <View style={styles.memberRole}>
        <Text style={[styles.roleText, item.role === 'admin' && styles.adminRole]}>
          {item.role}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Household Members</Text>
        <TouchableOpacity style={styles.inviteButton} onPress={handleInviteUser}>
          <Text style={styles.inviteButtonText}>+ Invite User</Text>
        </TouchableOpacity>
      </View>

      {members.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No members yet. Invite someone to join your household!
          </Text>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          style={styles.membersList}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  inviteButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  membersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  memberRole: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textTransform: 'capitalize',
  },
  adminRole: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginTop: 40,
  },
});