import { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * `cover` crop that keeps a chosen focal point (0–1 on each axis) in view,
 * so website photographs stay composed around their subject on any card shape.
 * `aspectRatio` is the source image's width / height.
 */
export function FocalImage({
  source,
  aspectRatio,
  focalX = 0.5,
  focalY = 0.5,
  style,
  accessibilityLabel,
}: {
  source: ImageSourcePropType;
  aspectRatio: number;
  focalX?: number;
  focalY?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const [box, setBox] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) =>
      current.width === width && current.height === height ? current : { width, height },
    );
  };

  let imageStyle: { width: number; height: number; left: number; top: number } | null = null;
  if (box.width > 0 && box.height > 0) {
    const width = Math.max(box.width, box.height * aspectRatio);
    const height = width / aspectRatio;
    imageStyle = {
      width,
      height,
      left: -Math.max(0, width - box.width) * focalX,
      top: -Math.max(0, height - box.height) * focalY,
    };
  }

  return (
    <View style={[styles.box, style]} onLayout={onLayout}>
      {imageStyle ? (
        <Image
          source={source}
          style={[styles.image, imageStyle]}
          resizeMode="cover"
          accessibilityLabel={accessibilityLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  image: { position: 'absolute' },
});
