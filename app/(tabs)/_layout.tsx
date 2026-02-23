import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors, shadows } from '@/src/core/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabBarIcon({ name, color, size }: { name: IconName; color: string; size: number }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

const iconMap: Record<string, { inactive: IconName; active: IconName }> = {
  dashboard: { inactive: 'view-dashboard-outline', active: 'view-dashboard' },
  addExpense: { inactive: 'plus-circle-outline', active: 'plus-circle' },
  askCritic: { inactive: 'robot-outline', active: 'robot' },
  commitments: { inactive: 'calendar-sync-outline', active: 'calendar-sync' },
  settings: { inactive: 'cog-outline', active: 'cog' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDisabled,
        tabBarStyle: {
          height: 64,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingBottom: 4,
          paddingTop: 4,
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          ...shadows.sm,
        },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? iconMap.dashboard.active : iconMap.dashboard.inactive}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-expense"
        options={{
          title: 'Add',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? iconMap.addExpense.active : iconMap.addExpense.inactive}
              color={colors.success}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ask-critic"
        options={{
          title: 'Ask Critic',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? iconMap.askCritic.active : iconMap.askCritic.inactive}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="commitments"
        options={{
          title: 'Commitments',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? iconMap.commitments.active : iconMap.commitments.inactive}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? iconMap.settings.active : iconMap.settings.inactive}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
