import React, { useEffect, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export const AlertType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export default function CustomAlert({
  visible = false,
  type = AlertType.INFO,
  title = '',
  message = '',
  onDismiss = () => {},
  duration = 4000,
  showButton = true,
  buttonText = 'OK',
}) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissAlert();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const dismissAlert = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getAlertStyles = () => {
    switch (type) {
      case AlertType.SUCCESS:
        return {
          backgroundColor: '#d1fae5',
          borderColor: '#10b981',
          iconBg: '#10b981',
          icon: '✓',
          titleColor: '#065f46',
          messageColor: '#047857',
        };
      case AlertType.ERROR:
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#ef4444',
          iconBg: '#ef4444',
          icon: '✕',
          titleColor: '#7f1d1d',
          messageColor: '#dc2626',
        };
      case AlertType.WARNING:
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          iconBg: '#f59e0b',
          icon: '!',
          titleColor: '#92400e',
          messageColor: '#d97706',
        };
      case AlertType.INFO:
      default:
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#1085a8ff',
          iconBg: '#1085a8ff',
          icon: 'ℹ',
          titleColor: '#0c2d4a',
          messageColor: '#0369a1',
        };
    }
  };

  const alertStyles = getAlertStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.alert,
          {
            backgroundColor: alertStyles.backgroundColor,
            borderLeftColor: alertStyles.borderColor,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: alertStyles.iconBg,
            },
          ]}
        >
          <Text style={styles.icon}>{alertStyles.icon}</Text>
        </View>

        <View style={styles.content}>
          {title ? (
            <Text
              style={[
                styles.title,
                {
                  color: alertStyles.titleColor,
                },
              ]}
            >
              {title}
            </Text>
          ) : null}
          <Text
            style={[
              styles.message,
              {
                color: alertStyles.messageColor,
              },
            ]}
          >
            {message}
          </Text>
        </View>

        {showButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={dismissAlert}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
});