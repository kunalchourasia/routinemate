import React from 'react';
import { View, StyleSheet } from 'react-native';
import ConnectionTest from '../components/ConnectionTest';

export const TestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ConnectionTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TestScreen;