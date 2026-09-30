import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import MainTabs from './MainTabs';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import SubmitComplaintScreen from '../screens/SubmitComplaintScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import AnnouncementsDetailScreen from '../screens/AnnouncementsDetailScreen';
import OperationsScreen from '../screens/OperationsScreen';
import AboutScreen from '../screens/AboutScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import Loading from '../components/Loading';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: styles.header,
        headerTintColor: colors.text,
        contentStyle: styles.content,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Sign up' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Forgot password' }} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: styles.header,
        headerTintColor: colors.text,
        contentStyle: styles.content,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SubmitComplaint" component={SubmitComplaintScreen} options={{ title: 'File a complaint' }} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ title: 'Complaint' }} />
      <Stack.Screen
        name="AnnouncementsDetail"
        component={AnnouncementsDetailScreen}
        options={{ title: 'Announcement' }}
      />
      <Stack.Screen name="Operations" component={OperationsScreen} options={{ title: 'Daily operations' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Activity' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.splash}>
        <Loading text="Starting Barangay Mobile…" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.surface },
  content: { backgroundColor: colors.background },
});
