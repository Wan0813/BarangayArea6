/**
 * Expo config plugin: allow cleartext HTTP traffic in the standalone APK.
 *
 * The dev API runs over plain HTTP on the local network
 * (http://192.168.100.48:5080). Android 9+ blocks cleartext traffic by
 * default, which makes every fetch() fail with "Network request failed"
 * even when the server is reachable (a phone browser still loads it fine).
 * This plugin sets android:usesCleartextTraffic="true" on <application>.
 *
 * Safe for this project: the app only talks to the barangay's own server.
 * If the API ever moves to HTTPS, delete this plugin.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error('withCleartextTraffic: <application> tag not found in AndroidManifest.xml');
    }
    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
