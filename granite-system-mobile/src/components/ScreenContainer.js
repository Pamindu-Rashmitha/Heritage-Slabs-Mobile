import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

export default function ScreenContainer({ children, style }) {
    const insets = useSafeAreaInsets();
    const tabBarHeight = React.useContext(BottomTabBarHeightContext) ?? 0;
    const paddingBottom = tabBarHeight > 0 ? 0 : insets.bottom;

    return <View style={[styles.root, { paddingBottom }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});
