import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking, Platform, Image, Dimensions, Vibration, PermissionsAndroid } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar: string;
  isFirstClick?: boolean;
}

const { width } = Dimensions.get('window');
const COLUMN_NUM = 2;
const ITEM_MARGIN = 10;
const ITEM_WIDTH = (width - ITEM_MARGIN * (COLUMN_NUM + 1)) / COLUMN_NUM;
const CONTACTS_STORAGE_KEY = 'contacts_data';

const LONG_PRESS_DURATION = 800; // 更长的按压时间
const PRESS_DELAY = 8000; // 增加到8秒的有效时间
const FEEDBACK_DURATION = 200; // 增加振动反馈时长
const VOICE_RATE = 0.4; // 降低语音速度

// 创建一个单独的联系人卡片组件
const ContactCard = ({ 
  item, 
  onAvatarPress,
  onCallPress,
}: { 
  item: Contact; 
  onAvatarPress: (contact: Contact) => Promise<void>;
  onCallPress: (phoneNumber: string) => Promise<void>;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const handlePress = async () => {
    // 更慢的动画效果
    scale.value = withSpring(0.9, {
      damping: 10, // 降低弹性
      stiffness: 80, // 降低刚性
      duration: 500, // 增加动画时长
    });
    setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 10,
        stiffness: 80,
        duration: 500,
      });
    }, 500);
    await onAvatarPress(item);
  };

  return (
    <View style={styles.contactCard}>
      <AnimatedTouchableOpacity 
        onPress={handlePress}
        style={[animatedStyle, styles.avatarContainer]}
        delayPressIn={500} // 增加按压延迟
        activeOpacity={0.4} // 更明显的按压效果
      >
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar}
          defaultSource={require('@/assets/images/icon.png')}
        />
        {item.isFirstClick !== false && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>未读</Text>
          </View>
        )}
      </AnimatedTouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.phoneNumber} numberOfLines={1}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          onPress={() => onCallPress(item.phoneNumber)}
          style={styles.callButton}
        >
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push({
            pathname: '/edit-contact',
            params: {
              id: item.id,
              name: item.name,
              phoneNumber: item.phoneNumber,
              avatar: item.avatar
            }
          })}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lastPressTime, setLastPressTime] = useState<{[key: string]: number}>({});

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    try {
      const savedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error('加载联系人失败:', error);
    }
  };

  const saveContacts = async (newContacts: Contact[]) => {
    try {
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContacts));
      setContacts(newContacts);
    } catch (error) {
      console.error('保存联系人失败:', error);
    }
  };

  const addContact = async () => {
    router.push('/add-contact');
  };

  const playFeedbackSound = async () => {
    try {
      // 使用更长的振动时间，更容易感知
      Vibration.vibrate(FEEDBACK_DURATION);
    } catch (error) {
      console.error('反馈失败:', error);
    }
  };

  const handleAvatarPress = async (contact: Contact) => {
    const now = Date.now();
    const lastPress = lastPressTime[contact.id] || 0;

    // 增强触觉反馈
    Vibration.vibrate([0, 100, 50, 100]); // 双振动模式，更容易感知

    if (now - lastPress < PRESS_DELAY && lastPress !== 0) {
      // 如果在有效时间内再次点击，执行拨号操作
      Speech.speak(`拨打${contact.name}的电话`, {
        language: 'zh',
        rate: VOICE_RATE,
        pitch: 1.1,
        onDone: () => {
          // 再次振动提示即将拨号
          Vibration.vibrate(300);
          // 延迟一秒再拨号，给用户反应时间
          setTimeout(() => {
            makePhoneCall(contact.phoneNumber);
          }, 1000);
        }
      });
      return;
    }

    // 第一次点击，播报联系人信息
    Speech.speak(`这是${contact.name}的电话，再次点击可以拨打`, {
      language: 'zh',
      rate: VOICE_RATE,
      pitch: 1.1,
      onDone: () => {
        // 语音播报完成后才开始计时
        setLastPressTime(prev => ({
          ...prev,
          [contact.id]: Date.now() // 使用最新的时间
        }));
        
        // 播报完成后，更新状态
        const updatedContacts = contacts.map(c => 
          c.id === contact.id ? { ...c, isFirstClick: false } : c
        );
        saveContacts(updatedContacts);
      }
    });
  };

  const makePhoneCall = async (phoneNumber: string) => {
    if (Platform.OS === 'android') {
      try {
        // 请求拨号权限
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: '拨打电话权限',
            message: '需要拨打电话权限来直接拨号',
            buttonNeutral: '稍后询问',
            buttonNegative: '取消',
            buttonPositive: '确定'
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          // 直接拨打电话
          await Linking.openURL(`tel:${phoneNumber}`);
        } else {
          // 如果没有权限，使用默认的拨号盘
          await Linking.openURL(`telprompt:${phoneNumber}`);
        }
      } catch (error) {
        console.error('无法拨打电话:', error);
      }
    } else {
      // iOS 必须显示确认界面
      try {
        await Linking.openURL(`telprompt:${phoneNumber}`);
      } catch (error) {
        console.error('无法拨打电话:', error);
      }
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <ContactCard 
      item={item} 
      onAvatarPress={handleAvatarPress}
      onCallPress={makePhoneCall}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_NUM}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
      />
      <TouchableOpacity 
        style={[styles.addButton, { bottom: 90 }]}
        onPress={addContact}
      >
        <Ionicons name="add-circle" size={60} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: ITEM_MARGIN,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: ITEM_MARGIN,
  },
  contactCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  newBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 16,
    width: 32, // 更大的标记
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    width: ITEM_WIDTH - 40, // 更大的头像
    height: ITEM_WIDTH - 40,
    borderRadius: (ITEM_WIDTH - 40) / 2,
    borderWidth: 4, // 更明显的边框
    borderColor: '#e0e0e0',
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  name: {
    fontSize: 24, // 更大的字体
    fontWeight: 'bold',
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 20, // 更大的字体
    color: '#444', // 更深的颜色
    marginBottom: 12,
  },
  callButton: {
    width: 56, // 更大的按钮
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8, // 增加按钮间距
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  editButton: {
    width: 56, // 更大的按钮
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
}); 