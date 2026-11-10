/*
 * Vision Archi site configuration.
 *
 * 1. Create a YouTube Data API v3 key at https://console.cloud.google.com/apis/credentials
 * 2. Restrict the key to "HTTP referrers" with: https://visionarchi.github.io/*
 * 3. Paste it below as apiKey.
 *
 * The key is visible to every visitor (it is a browser key), so the referrer
 * restriction above is what keeps it from being used elsewhere.
 */
window.VA_CONFIG = {
  channelId: "UCUj-VAmB-iDr7l9f2RsKDWA",
  apiKey: "AIzaSyAuLVXKuMEdhmkp7sJ7z0JNnT1UvCBd5o4",
  maxVideos: 12
};
