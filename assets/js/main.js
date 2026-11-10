(function () {
  "use strict";

  var cfg = window.VA_CONFIG || {};
  var API = "https://www.googleapis.com/youtube/v3/";
  var compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
  var full = new Intl.NumberFormat("en");

  function $(sel) { return document.querySelector(sel); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function hasKey() {
    return typeof cfg.apiKey === "string" && cfg.apiKey.length > 0 && cfg.apiKey.indexOf("PASTE_") !== 0;
  }

  function api(path, params) {
    var q = new URLSearchParams(Object.assign({}, params, { key: cfg.apiKey }));
    return fetch(API + path + "?" + q.toString()).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw new Error((data.error && data.error.message) || ("HTTP " + r.status));
        return data;
      });
    });
  }

  function setStat(key, value) {
    var node = document.querySelector('[data-stat="' + key + '"]');
    if (node) node.textContent = value;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatDuration(iso) {
    var m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
    if (!m) return "";
    var total = (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
    var h = Math.floor(total / 3600);
    var mi = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var p = function (n) { return String(n).padStart(2, "0"); };
    return h ? h + ":" + p(mi) + ":" + p(s) : mi + ":" + p(s);
  }

  function viewsLine(v) {
    var views = +((v.statistics && v.statistics.viewCount) || 0);
    return full.format(views) + " views · " + formatDate(v.snippet.publishedAt);
  }

  function loadStats() {
    return api("channels", { part: "snippet,statistics", id: cfg.channelId }).then(function (d) {
      var ch = d.items && d.items[0];
      if (!ch) throw new Error("Channel not found");
      var s = ch.statistics;
      setStat("subs", s.hiddenSubscriberCount ? "Hidden" : compact.format(+s.subscriberCount));
      setStat("views", compact.format(+s.viewCount));
      setStat("videos", full.format(+s.videoCount));
      setStat("since", new Date(ch.snippet.publishedAt).getFullYear());
    });
  }

  function loadVideos() {
    // Every channel's uploads playlist is "UU" + channel id without the leading "UC".
    var uploads = "UU" + cfg.channelId.slice(2);
    return api("playlistItems", {
      part: "contentDetails",
      playlistId: uploads,
      maxResults: cfg.maxVideos || 12
    }).then(function (pl) {
      var ids = pl.items.map(function (i) { return i.contentDetails.videoId; });
      if (!ids.length) return [];
      return api("videos", { part: "snippet,statistics,contentDetails", id: ids.join(",") }).then(function (vd) {
        var byId = {};
        vd.items.forEach(function (v) { byId[v.id] = v; });
        return ids.map(function (id) { return byId[id]; }).filter(Boolean);
      });
    });
  }

  function renderFeatured(v) {
    var wrap = $("#featured");
    wrap.innerHTML = "";

    var frame = el("div", "embed");
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + v.id;
    iframe.title = v.snippet.title;
    iframe.loading = "lazy";
    iframe.allowFullscreen = true;
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    frame.appendChild(iframe);

    wrap.appendChild(frame);
    wrap.appendChild(el("h3", "featured-title", v.snippet.title));
    wrap.appendChild(el("p", "meta", viewsLine(v)));
  }

  function card(v) {
    var a = el("a", "card");
    a.href = "https://www.youtube.com/watch?v=" + v.id;
    a.target = "_blank";
    a.rel = "noopener";

    var thumb = el("div", "thumb");
    var t = v.snippet.thumbnails || {};
    var img = document.createElement("img");
    img.loading = "lazy";
    img.alt = v.snippet.title;
    img.src = ((t.high || t.medium || t.default || {}).url) || ("https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg");
    thumb.appendChild(img);

    var dur = formatDuration(v.contentDetails && v.contentDetails.duration);
    if (dur) thumb.appendChild(el("span", "dur", dur));
    a.appendChild(thumb);

    a.appendChild(el("h3", "card-title", v.snippet.title));
    a.appendChild(el("p", "meta", viewsLine(v)));
    return a;
  }

  function renderGrid(videos) {
    var grid = $("#grid");
    grid.innerHTML = "";
    if (!videos.length) {
      grid.appendChild(el("p", "status", "No videos yet. Check back soon."));
      return;
    }
    videos.forEach(function (v) { grid.appendChild(card(v)); });
  }

  function showMessage(target, text, withLink) {
    var node = $(target);
    node.innerHTML = "";
    var p = el("p", "status", text);
    if (withLink) {
      p.appendChild(document.createTextNode(" "));
      var a = el("a", null, "Watch on YouTube →");
      a.href = "https://www.youtube.com/@visionarchitecture";
      a.target = "_blank";
      a.rel = "noopener";
      p.appendChild(a);
    }
    node.appendChild(p);
  }

  function init() {
    $("#year").textContent = new Date().getFullYear();

    if (!hasKey()) {
      ["subs", "views", "videos", "since"].forEach(function (k) { setStat(k, "—"); });
      showMessage("#featured", "Live videos and stats load here once a YouTube API key is added in assets/js/config.js.", true);
      showMessage("#grid", "Live videos load here once a YouTube API key is added in assets/js/config.js.", true);
      return;
    }

    loadStats().catch(function (err) {
      console.warn("Stats unavailable:", err);
      ["subs", "views", "videos", "since"].forEach(function (k) { setStat(k, "—"); });
    });

    loadVideos().then(function (videos) {
      if (!videos.length) {
        showMessage("#featured", "No videos yet. Check back soon.", true);
        renderGrid([]);
        return;
      }
      renderFeatured(videos[0]);
      renderGrid(videos.slice(1));
    }).catch(function (err) {
      console.warn("Videos unavailable:", err);
      showMessage("#featured", "We couldn't load the latest video right now.", true);
      showMessage("#grid", "We couldn't load the video list right now.", true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
