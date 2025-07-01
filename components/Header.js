import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const Header = () => {
  return (
    <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-200">
      <View className="flex-row items-center">
        <Text className="text-2xl font-bold text-gray-800">Discover</Text>
      </View>
      <View className="flex-row space-x-4">
        <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <Text className="text-lg">🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <Text className="text-lg">👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;