import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const TabBar = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <View className="flex-row justify-around items-center py-3 bg-white border-t border-gray-200">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          className={`items-center ${activeTab === tab.name ? 'opacity-100' : 'opacity-50'}`}
          onPress={() => setActiveTab(tab.name)}
        >
          <Text className="text-2xl">{tab.icon}</Text>
          <Text className={`text-xs mt-1 ${activeTab === tab.name ? 'font-bold text-blue-500' : 'text-gray-600'}`}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TabBar;