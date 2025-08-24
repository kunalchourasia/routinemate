import { supabase } from '../services/supabase';

/**
 * Test Supabase connection and basic functionality
 */
export class ConnectionTester {
  static async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔍 Testing Supabase connection...');

      // Test 1: Basic connection
      const { data, error } = await supabase.from('households').select('count').limit(1);
      if (error) {
        return {
          success: false,
          message: 'Connection failed',
          details: error.message
        };
      }

      console.log('✅ Basic connection successful');

      // Test 2: Authentication status
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Auth status:', user ? 'User logged in' : 'No user logged in');

      // Test 3: Test database tables exist
      const tables = ['households', 'household_members', 'recurrence_rules', 'tasks', 'task_templates'];
      for (const table of tables) {
        const { error: tableError } = await supabase.from(table).select('count').limit(1);
        if (tableError) {
          console.log(`❌ Table '${table}' not found:`, tableError.message);
          return {
            success: false,
            message: `Table '${table}' not found`,
            details: tableError.message
          };
        }
        console.log(`✅ Table '${table}' exists`);
      }

      return {
        success: true,
        message: 'All tests passed! Supabase connection is working correctly.',
        details: {
          user: user?.email || 'No user',
          tables: tables
        }
      };

    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        message: 'Unexpected error during connection test',
        details: error.message
      };
    }
  }

  static async testAuthentication(): Promise<{ success: boolean; message: string }> {
    try {
      // Test sign up (will fail if user exists, but that's ok for testing)
      const testEmail = `test-${Date.now()}@example.com`;
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test-password-123'
      });

      if (error && !error.message.includes('User already registered')) {
        return {
          success: false,
          message: `Authentication test failed: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Authentication system is working'
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Authentication test error: ${error.message}`
      };
    }
  }

  static async runFullTest(): Promise<void> {
    console.log('🚀 Starting RoutineMate Connection Test Suite\n');

    const connectionTest = await this.testConnection();
    console.log('📊 Connection Test:', connectionTest.message);
    if (!connectionTest.success) {
      console.log('Details:', connectionTest.details);
      return;
    }

    console.log('\n' + '='.repeat(50));

    const authTest = await this.testAuthentication();
    console.log('🔐 Authentication Test:', authTest.message);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests completed!');

    if (connectionTest.success && authTest.success) {
      console.log('\n✅ Your RoutineMate app is ready to use!');
      console.log('📱 You can now:');
      console.log('   - Create user accounts');
      console.log('   - Set up households');
      console.log('   - Create recurring task templates');
      console.log('   - Assign tasks with smart rotation');
      console.log('   - Track task completion');
    }
  }
}

// Auto-run test if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment (for testing)
  ConnectionTester.runFullTest().catch(console.error);
}

export default ConnectionTester;