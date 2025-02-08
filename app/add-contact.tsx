import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CONTACTS_STORAGE_KEY = 'contacts_data';

// 添加电话号码校验函数
const validatePhoneNumber = (number: string) => {
  // 移动电话正则表达式
  const mobilePattern = /^1[3-9]\d{9}$/;
  // 座机号码正则表达式（支持区号-号码 格式，如 010-12345678 或 0755-12345678）
  const telPattern = /^0\d{2,3}-?\d{7,8}$/;
  
  return {
    isValid: mobilePattern.test(number) || telPattern.test(number),
    type: mobilePattern.test(number) ? '手机' : telPattern.test(number) ? '座机' : '无效'
  };
};

export default function AddContactScreen() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [avatar, setAvatar] = useState('');

  // 处理电话号码输入
  const handlePhoneNumberChange = (text: string) => {
    // 移除所有空格
    const cleanedText = text.replace(/\s/g, '');
    setPhoneNumber(cleanedText);
    
    if (cleanedText) {
      const validation = validatePhoneNumber(cleanedText);
      if (!validation.isValid) {
        setPhoneError('请输入有效的手机号或座机号（如：13812345678 或 010-12345678）');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

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

  const saveContact = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请填写姓名');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('提示', '请填写电话号码');
      return;
    }

    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      Alert.alert('提示', '请输入有效的电话号码');
      return;
    }

    try {
      const savedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      const currentContacts = savedContacts ? JSON.parse(savedContacts) : [];
      
      const newContact = {
        id: Date.now().toString(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        avatar: avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
        phoneType: validation.type // 保存电话类型
      };

      const updatedContacts = [...currentContacts, newContact];
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
      
      Alert.alert('成功', '联系人添加成功', [
        {
          text: '确定',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      Alert.alert('错误', '保存联系人失败');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={pickImage}
        activeOpacity={0.7}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="camera" size={50} color="#666" />
            <Text style={styles.avatarText}>点击添加照片</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>姓名</Text>
        <TextInput
          style={styles.input}
          placeholder="请输入联系人姓名"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
          fontSize={20}
        />
        
        <Text style={styles.label}>电话号码</Text>
        <View>
          <TextInput
            style={[
              styles.input,
              phoneError ? styles.inputError : null
            ]}
            placeholder="请输入手机号或座机号"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
            fontSize={20}
          />
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : (
            <Text style={styles.tipText}>
              支持手机号（13812345678）或座机号（010-12345678）
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.saveButton}
        onPress={saveContact}
        activeOpacity={0.7}
      >
        <Text style={styles.saveButtonText}>保存联系人</Text>
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
  },
  avatarText: {
    marginTop: 12,
    color: '#666',
    fontSize: 18,
  },
  inputContainer: {
    marginVertical: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    fontSize: 20,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginTop: 5,
    marginLeft: 5,
  },
  tipText: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
}); 