import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface UserAvatarProps {
  size?: number;
  showMenu?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 40,
  showMenu = true
}) => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Get user initials from name or email
  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || '';
    const parts = name.split(' ');

    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  };

  const handleMenuPress = () => {
    if (showMenu) {
      setShowMenuModal(true);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setShowMenuModal(false);
            await signOut();
          },
        },
      ]
    );
  };

  const menuOptions = [
    {
      title: 'Connection Test',
      onPress: () => {
        setShowMenuModal(false);
        navigation.navigate('Test' as never);
      },
    },
    {
      title: 'Sign Out',
      onPress: handleSignOut,
      destructive: true,
    },
  ];

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { width: size, height: size }]}
        onPress={handleMenuPress}
        disabled={!showMenu}
      >
        <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
          {getInitials()}
        </Text>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={showMenuModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
            </View>

            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, option.destructive && styles.destructiveMenuItem]}
                onPress={option.onPress}
              >
                <Text style={[styles.menuItemText, option.destructive && styles.destructiveMenuText]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    backgroundColor: '#10B981', // Changed to green for better visibility against blue header
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  destructiveMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
  destructiveMenuText: {
    color: '#ef4444',
    fontWeight: '500',
  },
});

export default UserAvatar;