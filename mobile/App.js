import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import HomeScreen        from './screens/HomeScreen';
import GalleryScreen     from './screens/GalleryScreen';
import DroneHelperScreen from './screens/DroneHelperScreen';
import SettingsScreen    from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { theme } = useSettings();
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: theme === 'dark' ? '#000' : '#f0f4f8' },
          }}
        >
          <Stack.Screen name="Home"        component={HomeScreen} />
          <Stack.Screen name="Gallery"     component={GalleryScreen} />
          <Stack.Screen name="DroneHelper" component={DroneHelperScreen} />
          <Stack.Screen name="Settings"    component={SettingsScreen} options={{ animation: 'slide_from_bottom' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppNavigator />
    </SettingsProvider>
  );
}
