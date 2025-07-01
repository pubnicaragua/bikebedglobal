import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [searchText, setSearchText] = useState('');

  const tabs = [
    { name: 'Home', icon: '🏠' },
    { name: 'Search', icon: '🔍' },
    { name: 'Profile', icon: '👤' },
    { name: 'Settings', icon: '⚙️' },
  ];

  const categories = [
    { name: 'Food', icon: '🍔', color: 'bg-red-500' },
    { name: 'Shopping', icon: '🛍️', color: 'bg-blue-500' },
    { name: 'Travel', icon: '✈️', color: 'bg-green-500' },
    { name: 'Entertainment', icon: '🎬', color: 'bg-purple-500' },
    { name: 'Health', icon: '💊', color: 'bg-pink-500' },
  ];

  const featuredItems = [
    {
      id: 1,
      title: 'Summer Collection',
      description: 'Check out our latest summer collection with amazing discounts',
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      title: 'New Arrivals',
      description: 'Discover our newest products just for you',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      title: 'Flash Sale',
      description: 'Limited time offers with up to 70% discount',
      image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
  ];

  const popularItems = [
    {
      id: 1,
      title: 'Wireless Headphones',
      price: '$129.99',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      title: 'Smart Watch',
      price: '$199.99',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      title: 'Sneakers',
      price: '$89.99',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 4,
      title: 'Sunglasses',
      price: '$59.99',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="auto" />
      
      {/* Header */}
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

      {/* Main Content */}
      <ScrollView className="flex-1">
        {/* Search Bar */}
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

        {/* Categories */}
        <View className="mt-4">
          <Text className="px-4 text-lg font-bold text-gray-800 mb-3">Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                className={`mr-4 items-center justify-center w-20 h-20 rounded-lg ${category.color}`}
              >
                <Text className="text-2xl mb-1">{category.icon}</Text>
                <Text className="text-white font-medium text-xs">{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        <View className="mt-6">
          <Text className="px-4 text-lg font-bold text-gray-800 mb-3">Featured</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {featuredItems.map((item) => (
              <TouchableOpacity key={item.id} className="mr-4 w-64 rounded-lg overflow-hidden">
                <Image source={{ uri: item.image }} className="w-full h-32 rounded-lg" />
                <View className="p-3 bg-white">
                  <Text className="font-bold text-gray-800">{item.title}</Text>
                  <Text className="text-gray-600 text-xs mt-1">{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular */}
        <View className="mt-6 pb-20">
          <Text className="px-4 text-lg font-bold text-gray-800 mb-3">Popular</Text>
          <View className="px-4 flex-row flex-wrap justify-between">
            {popularItems.map((item) => (
              <TouchableOpacity key={item.id} className="w-[48%] mb-4 rounded-lg overflow-hidden bg-white shadow-sm">
                <Image source={{ uri: item.image }} className="w-full h-32 rounded-t-lg" />
                <View className="p-3">
                  <Text className="font-bold text-gray-800">{item.title}</Text>
                  <Text className="text-blue-600 font-bold mt-1">{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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
    </SafeAreaView>
  );
}