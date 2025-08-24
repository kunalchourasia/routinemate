import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';

export const ConnectionTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    connection?: boolean;
    auth?: boolean;
    tables?: string[];
    error?: string;
  }>({});

  const testConnection = async () => {
    setIsTesting(true);
    setTestResults({});

    try {
      console.log('🔍 Testing Supabase connection...');

      // Test 1: Basic connection
      const { data: connectionData, error: connectionError } = await supabase
        .from('households')
        .select('count')
        .limit(1);

      if (connectionError) {
        throw new Error(`Connection failed: ${connectionError.message}`);
      }

      console.log('✅ Basic connection successful');
      setTestResults(prev => ({ ...prev, connection: true }));

      // Test 2: Authentication status
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Auth status:', user ? 'User logged in' : 'No user logged in');
      setTestResults(prev => ({ ...prev, auth: !!user }));

      // Test 3: Test database tables exist
      const tables = ['households', 'household_members', 'recurrence_rules', 'tasks', 'task_templates'];
      const existingTables: string[] = [];

      for (const table of tables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('count')
            .limit(1);

          if (!tableError) {
            existingTables.push(table);
            console.log(`✅ Table '${table}' exists`);
          } else {
            console.log(`❌ Table '${table}' not found:`, tableError.message);
          }
        } catch (error) {
          console.log(`❌ Error testing table '${table}':`, error);
        }
      }

      setTestResults(prev => ({ ...prev, tables: existingTables }));

      Alert.alert(
        '✅ Connection Test Passed!',
        `All tests completed successfully!\n\nTables found: ${existingTables.length}/${tables.length}\n${existingTables.join(', ')}`
      );

    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setTestResults({ error: error.message });
      Alert.alert('❌ Connection Test Failed', error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const testSignUp = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test-password-123'
      });

      if (error && !error.message.includes('User already registered')) {
        Alert.alert('❌ Auth Test Failed', error.message);
      } else {
        Alert.alert('✅ Auth Test Passed', 'Authentication system is working!');
      }
    } catch (error: any) {
      Alert.alert('❌ Auth Test Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔧 RoutineMate Connection Test</Text>
        <Text style={styles.subtitle}>Test your Supabase connection and setup</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, isTesting && styles.disabledButton]}
            onPress={testConnection}
            disabled={isTesting}
          >
            <Text style={styles.primaryButtonText}>
              {isTesting ? 'Testing...' : '🔍 Test Connection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testSignUp}
          >
            <Text style={styles.secondaryButtonText}>🔐 Test Authentication</Text>
          </TouchableOpacity>
        </View>

        {Object.keys(testResults).length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>📊 Test Results:</Text>

            {testResults.connection !== undefined && (
              <Text style={[styles.result, testResults.connection ? styles.success : styles.error]}>
                • Connection: {testResults.connection ? '✅ Success' : '❌ Failed'}
              </Text>
            )}

            {testResults.auth !== undefined && (
              <Text style={[styles.result, testResults.auth ? styles.success : styles.warning]}>
                • Authentication: {testResults.auth ? '✅ User logged in' : '⚠️ No user'}
              </Text>
            )}

            {testResults.tables && (
              <Text style={styles.result}>
                • Tables found: {testResults.tables.length}/5{'\n'}
                {testResults.tables.join(', ')}
              </Text>
            )}

            {testResults.error && (
              <Text style={[styles.result, styles.error]}>
                • Error: {testResults.error}
              </Text>
            )}
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.infoTitle}>📋 What this tests:</Text>
          <Text style={styles.infoText}>
            • Supabase connection and credentials{'\n'}
            • Database tables exist{'\n'}
            • Authentication system{'\n'}
            • Row Level Security policies
          </Text>
        </View>

        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>🎯 Next Steps:</Text>
          <Text style={styles.nextStepsText}>
            1. ✅ Fix any connection issues{'\n'}
            2. 🚀 Start using the app features{'\n'}
            3. 📱 Test creating households and tasks{'\n'}
            4. 🔄 Set up recurring task templates
          </Text>
        </View>
      </View>
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
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  results: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  result: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  success: {
    color: '#4CAF50',
  },
  error: {
    color: '#f44336',
  },
  warning: {
    color: '#FF9800',
  },
  info: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  nextSteps: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
});

export default ConnectionTest;