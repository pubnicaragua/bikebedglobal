import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

const ProductCard = ({ item }) => {
  return (
    <TouchableOpacity className="w-[48%] mb-4 rounded-lg overflow-hidden bg-white shadow-sm">
      <Image source={{ uri: item.image }} className="w-full h-32 rounded-t-lg" />
      <View className="p-3">
        <Text className="font-bold text-gray-800">{item.title}</Text>
        <Text className="text-blue-600 font-bold mt-1">{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;