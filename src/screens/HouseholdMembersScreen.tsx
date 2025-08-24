import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'HouseholdMembers'>;

export default function HouseholdMembersScreen({ route }: Props) {
  const { householdId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Household Members</Text>
      <Text>Household ID: {householdId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
});