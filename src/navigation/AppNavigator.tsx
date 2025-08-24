import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Import screens (we'll create these next)
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import HouseholdScreen from '../screens/HouseholdScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import HouseholdMembersScreen from '../screens/HouseholdMembersScreen';
import TestScreen from '../screens/TestScreen';
import LoadingScreen from '../components/LoadingScreen';
import UserAvatar from '../components/UserAvatar';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigatorContent() {
  const { user, loading } = useAuth();

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? "Home" : "Auth"}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3B82F6',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!user ? (
        // Not authenticated - show auth screen
        <>
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ title: 'Welcome to RoutineMate', headerShown: false }}
          />
          <Stack.Screen
            name="Test"
            component={TestScreen}
            options={{ title: 'Connection Test' }}
          />
        </>
      ) : (
        // Authenticated - show main app screens
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'My Households',
              headerRight: () => (
                <View style={{
                  marginRight: 0,
                  paddingRight: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <UserAvatar size={32} />
                </View>
              ),
            }}
          />
          <Stack.Screen
            name="Household"
            component={HouseholdScreen}
            options={{ title: 'Household Tasks' }}
          />
          <Stack.Screen
            name="TaskDetails"
            component={TaskDetailsScreen}
            options={{ title: 'Task Details' }}
          />
          <Stack.Screen
            name="CreateTask"
            component={CreateTaskScreen}
            options={{ title: 'Create Task' }}
          />
          <Stack.Screen
            name="HouseholdMembers"
            component={HouseholdMembersScreen}
            options={{ title: 'Household Members' }}
          />
          <Stack.Screen
            name="Test"
            component={TestScreen}
            options={{ title: 'Connection Test' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigatorContent />
      </NavigationContainer>
    </AuthProvider>
  );
}