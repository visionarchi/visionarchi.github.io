# Vision Archi website

Static site for the Vision Archi YouTube channel, hosted on GitHub Pages at `https://visionarchi.github.io`.

It shows live channel stats (subscribers, total views, video count) and the latest videos, pulled from the YouTube Data API in the browser.

## Setup

1. Create a YouTube Data API v3 key in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Under the key's **Application restrictions**, choose **HTTP referrers** and add `https://visionarchi.github.io/*`.
3. Paste the key into `assets/js/config.js` as `apiKey`.

Browser keys are visible to visitors, so the referrer restriction is what keeps the key from being reused elsewhere.

## Files

- `index.html` - page structure
- `assets/css/style.css` - styling
- `assets/js/config.js` - channel ID, API key, number of videos to show
- `assets/js/main.js` - fetches stats and videos and renders them
- `assets/img/logo.png` - logo

## Local preview

Open `index.html` in a browser, or run `python -m http.server` in this folder and visit `http://localhost:8000`. Add your key to `config.js` first, and remember to allow `localhost` in the key's referrer list while testing.
