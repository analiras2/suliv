import {Pressable, View} from 'react-native';
import {StyleProp, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import React from 'react';

interface AnimatedPressableViewProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  isFlex?: boolean;
}

const AnimatedPressableView = ({
  onPress,
  style,
  children,
  isFlex,
}: AnimatedPressableViewProps) => {
  const position = useSharedValue(1);

  const onPressIn = () => {
    position.value = withTiming(1.08);
  };
  const onPressOut = () => {
    position.value = withTiming(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    flex: isFlex ? 1 : 0,
    transform: [{scale: position.value}],
  }));

  return onPress ? (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={style}>
        {children}
      </Pressable>
    </Animated.View>
  ) : (
    <View style={style}>{children}</View>
  );
};

export default AnimatedPressableView;
