import React from 'react';
import { View, TextInput, Text } from 'react-native';

const SearchBar = ({ searchText, setSearchText }) => {
  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
        <Text className="text-gray-400 mr-2">🔍</Text>
        <TextInput
          className="flex-1 text-gray-800"
          placeholder="Search products..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
    </View>
  );
};

export default SearchBar;