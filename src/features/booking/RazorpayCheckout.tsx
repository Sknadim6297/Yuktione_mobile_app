import { useMemo, useRef } from 'react';
import { ActivityIndicator, Linking, Modal, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import {
  RAZORPAY_SCRIPT,
  checkoutOptions,
  failureFrom,
  type RazorpayCheckoutProps,
} from '@/features/booking/razorpay';
import { brand } from '@/theme';

function checkoutPage(options: ReturnType<typeof checkoutOptions>): string {
  const json = JSON.stringify(options).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;background:transparent}</style></head><body>
<script>
function send(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
var s=document.createElement('script');
s.src=${JSON.stringify(RAZORPAY_SCRIPT)};
s.onerror=function(){send({type:'unavailable'});};
s.onload=function(){
  var o=${json};
  o.handler=function(r){send({type:'success',payload:r});};
  o.modal={ondismiss:function(){send({type:'dismissed'});},confirm_close:true};
  var rzp=new Razorpay(o);
  rzp.on('payment.failed',function(r){send({type:'failed',payload:r&&r.error});});
  rzp.open();
};
document.head.appendChild(s);
</script></body></html>`;
}

/** Razorpay Standard Checkout inside a full-screen WebView (iOS / Android). */
export function RazorpayCheckout({ order, onSuccess, onFailure, onClose }: RazorpayCheckoutProps) {
  const settled = useRef(false);
  const html = useMemo(() => (order ? checkoutPage(checkoutOptions(order)) : ''), [order]);

  const onMessage = (event: WebViewMessageEvent) => {
    let message: { type?: string; payload?: unknown };
    try {
      message = JSON.parse(event.nativeEvent.data) as typeof message;
    } catch {
      return;
    }
    if (settled.current) return;
    if (message.type === 'success') {
      settled.current = true;
      onSuccess(message.payload as Parameters<typeof onSuccess>[0]);
      onClose('paid');
    } else if (message.type === 'failed') {
      onFailure(failureFrom(message.payload));
    } else if (message.type === 'dismissed' || message.type === 'unavailable') {
      settled.current = true;
      onClose(message.type);
    }
  };

  return (
    <Modal
      visible={Boolean(order)}
      animationType="fade"
      transparent
      statusBarTranslucent
      onShow={() => {
        settled.current = false;
      }}
      onRequestClose={() => {
        if (!settled.current) {
          settled.current = true;
          onClose('dismissed');
        }
      }}
    >
      <View style={styles.backdrop}>
        {order ? (
          <WebView
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={brand.white} size="large" />
              </View>
            )}
            onShouldStartLoadWithRequest={(request) => {
              // UPI and bank apps open through intent / custom-scheme links.
              if (/^(https?|about|data|blob):/i.test(request.url)) return true;
              void Linking.openURL(request.url).catch(() => undefined);
              return false;
            }}
            onError={() => {
              if (!settled.current) {
                settled.current = true;
                onClose('unavailable');
              }
            }}
            style={styles.web}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,16,0.55)' },
  web: { flex: 1, backgroundColor: 'transparent' },
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
