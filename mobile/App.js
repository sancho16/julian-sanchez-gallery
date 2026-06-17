import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen       from './screens/HomeScreen';
import GalleryScreen    from './screens/GalleryScreen';
import DroneHelperScreen from './screens/DroneHelperScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: '#000' },
          }}
        >
          <Stack.Screen name="Home"        component={HomeScreen} />
          <Stack.Screen name="Gallery"     component={GalleryScreen} />
          <Stack.Screen name="DroneHelper" component={DroneHelperScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
