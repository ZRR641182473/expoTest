import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

const contacts: Contact[] = [
  { id: '1', name: '张三', phoneNumber: '13800138000' },
  { id: '2', name: '李四', phoneNumber: '13900139000' },
  { id: '3', name: '王五', phoneNumber: '13700137000' },
];

export default function ContactsScreen() {
  const makePhoneCall = async (phoneNumber: string) => {
    let phoneUrl = '';
    if (Platform.OS === 'android') {
      phoneUrl = `tel:${phoneNumber}`;
    } else {
      phoneUrl = `telprompt:${phoneNumber}`;
    }
    
    try {
      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('无法拨打电话:', error);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <View style={styles.contactRow}>
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => makePhoneCall(item.phoneNumber)}
        style={styles.callButton}
      >
        <Ionicons name="call" size={24} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
}); 