import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

const CategoryCard = ({ category }) => {
  return (
    <TouchableOpacity
      className={`mr-4 items-center justify-center w-20 h-20 rounded-lg ${category.color}`}
    >
      <Text className="text-2xl mb-1">{category.icon}</Text>
      <Text className="text-white font-medium text-xs">{category.name}</Text>
    </TouchableOpacity>
  );
};

export default CategoryCard;