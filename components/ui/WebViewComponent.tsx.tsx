
import React from 'react';
import { WebView } from 'react-native-webview';

const DailyWebViewComponent = ({ roomUrl }: { roomUrl: string }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://unpkg.com/@daily-co/daily-js"></script>
      <style>
        body { margin: 0; overflow: hidden; }
        #call-frame { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="call-frame"></div>
      <script>
        const callFrame = window.DailyIframe.createFrame(
          document.getElementById('call-frame'),
          {
            url: '${roomUrl}',
            showLeaveButton: true,
            iframeStyle: {
              position: 'fixed',
              width: '100%',
              height: '100%',
            }
          }
        );
        callFrame.join();
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      style={{ flex: 1 }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsInlineMediaPlayback={true}
    />
  );
};

export default DailyWebViewComponent;