import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

const FeaturedCard = ({ item }) => {
  return (
    <TouchableOpacity className="mr-4 w-64 rounded-lg overflow-hidden">
      <Image source={{ uri: item.image }} className="w-full h-32 rounded-lg" />
      <View className="p-3 bg-white">
        <Text className="font-bold text-gray-800">{item.title}</Text>
        <Text className="text-gray-600 text-xs mt-1">{item.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default FeaturedCard;