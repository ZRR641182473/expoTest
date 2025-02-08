import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CONTACTS_STORAGE_KEY = 'contacts_data';

export default function EditContactScreen() {
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (params.name) setName(params.name as string);
    if (params.phoneNumber) setPhoneNumber(params.phoneNumber as string);
    if (params.avatar) setAvatar(params.avatar as string);
  }, [params]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相册以选择照片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const updateContact = async () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('提示', '请填写姓名和电话号码');
      return;
    }

    try {
      const savedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      const currentContacts = savedContacts ? JSON.parse(savedContacts) : [];
      
      const updatedContacts = currentContacts.map((contact: any) => 
        contact.id === params.id 
          ? {
              ...contact,
              name: name.trim(),
              phoneNumber: phoneNumber.trim(),
              avatar: avatar,
            }
          : contact
      );

      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
      
      Alert.alert('成功', '联系人更新成功', [
        {
          text: '确定',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      Alert.alert('错误', '更新联系人失败');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="camera" size={40} color="#666" />
            <Text style={styles.avatarText}>修改照片</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="姓名"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="电话号码"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={updateContact}>
        <Text style={styles.saveButtonText}>更新联系人</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    marginTop: 10,
    color: '#666',
  },
  inputContainer: {
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 