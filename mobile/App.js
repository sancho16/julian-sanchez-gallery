import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GalleryScreen from './screens/GalleryScreen';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <GalleryScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
});
