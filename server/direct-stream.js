const isCaption = (t) => !/thumbnail/i.test(`${t?.kind || ""} ${t?.label || ""}`) && (t?.file || t?.url);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// MegaPlay AES Key & IV (as used in Zenkai Android AnikotoResolver)
const MEGAPLAY_RAW_KEY = new TextEncoder().encode("i?LMTAx0Q6,:}50U");
const MEGAPLAY_FULL_KEY = new Uint8Array(32);
MEGAPLAY_FULL_KEY.set(MEGAPLAY_RAW_KEY);
const MEGAPLAY_IV = new TextEncoder().encode("W0;27ToaUpl_P%'c");

async function decryptMegaPlayWeb(encValue) {
  try {
    const bin = atob(encValue.replace(/-/g, "+").replace(/_/g, "/"));
    const encBuf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) encBuf[i] = bin.charCodeAt(i);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      MEGAPLAY_FULL_KEY,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );
    const dec = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: MEGAPLAY_IV },
      cryptoKey,
      encBuf
    );
    const text = new TextDecoder().decode(dec);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return text.startsWith("http") ? { url: text.trim() } : null;
    }
    if (Array.isArray(parsed)) {
      const url = parsed[0]?.file || parsed[0]?.url || null;
      return url ? { url } : null;
    }
    const url = parsed?.file || parsed?.url || (typeof parsed === "string" && parsed.startsWith("http") ? parsed : null);
    return url ? { url, tracks: parsed.tracks, intro: parsed.intro, outro: parsed.outro } : null;
  } catch (err) {
    console.warn("decryptMegaPlayWeb error:", err.message);
    return null;
  }
}

/** Captions as absolute urls (relative / protocol-relative ones resolve against the player origin). */
function captions(tracks, base) {
  return (tracks || []).filter(isCaption).map((t) => {
    const raw = t.file || t.url;
    let file = raw;
    try {
      file = new URL(raw, base).href;
    } catch {}
    return { file, label: t.label || "English", default: !!t.default };
  });
}

/**
 * MegaPlay serves captions (and intro/outro) from a newer getSources route than the one we decrypt.
 * Find both routes in the player script and merge whatever tracks they return.
 */
async function megaMeta(pageUrl, html, fileId) {
  const out = { tracks: [], intro: null, outro: null };
  try {
    const page = new URL(pageUrl);
    const srcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => new URL(m[1], page).href);
    const scripts = await Promise.all(srcs.map((u) => fetch(u, { headers: { "User-Agent": UA, Referer: page.href } }).then((r) => (r.ok ? r.text() : "")).catch(() => "")));
    const script = scripts.find((s) => /getSources/i.test(s)) || "";
    const routes = [...new Set([...script.matchAll(/stream\/getSources[\w/-]*/g)].map((m) => m[0]))].sort((a, b) => a.length - b.length);
    const modern = routes.find((r) => r !== routes[0] && r.startsWith(routes[0]));
    for (const route of [modern, routes[0]].filter(Boolean)) {
      const u = new URL(route, page.origin);
      u.searchParams.append("id", fileId);
      u.searchParams.append("id", fileId);
      const d = await fetch(u, { headers: { "User-Agent": UA, Referer: page.href, "X-Requested-With": "XMLHttpRequest", Accept: "application/json,*/*" } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (!d) continue;
      if (!out.tracks.length && Array.isArray(d.tracks)) out.tracks = d.tracks;
      out.intro ??= d.intro || null;
      out.outro ??= d.outro || null;
    }
  } catch (e) {
    console.warn("megaMeta error:", e.message);
  }
  return out;
}

// Anikoto Site Scraping Fallback (Tier 2 in Zenkai Android AnikotoResolver.kt)
export async function resolveFromAnikotoSite(animeTitle, episode = 1, audio = "sub", server = "bcdn") {
  if (!animeTitle) return null;
  const isDub = audio.toLowerCase() === "dub";
  const isVidstream = server.toLowerCase().includes("vidstream");

  try {
    const searchUrl = "https://anikototv.to/filter?keyword=" + encodeURIComponent(animeTitle);
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": UA, "Referer": "https://anikototv.to/" }
    });
    if (!searchRes.ok) return null;
    const searchHtml = await searchRes.text();

    const slugMatch = searchHtml.match(/<a\s+class="name d-title"\s+href="https?:\/\/anikototv\.to\/watch\/([^"\/]+)/)
                   || searchHtml.match(/<a\s+href="https?:\/\/anikototv\.to\/watch\/([^"\/]+)/);
    if (!slugMatch) return null;
    const slug = slugMatch[1];

    const watchUrl = `https://anikototv.to/watch/${slug}`;
    const watchRes = await fetch(watchUrl, {
      headers: { "User-Agent": UA, "Referer": "https://anikototv.to/" }
    });
    if (!watchRes.ok) return null;
    const watchHtml = await watchRes.text();

    const showIdMatch = watchHtml.match(/data-id="(\d+)"/);
    if (!showIdMatch) return null;
    const showId = showIdMatch[1];

    const listRes = await fetch(`https://anikototv.to/ajax/episode/list/${showId}`, {
      headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest", "Referer": watchUrl }
    });
    if (!listRes.ok) return null;
    const listJson = await listRes.json();
    const listHtml = listJson.result;

    const epRegex = new RegExp(`<a\\s+[^>]*data-ids="([^"]+)"[^>]*data-num="${episode}"|<a\\s+[^>]*data-num="${episode}"[^>]*data-ids="([^"]+)"`, "i");
    const epMatch = listHtml.match(epRegex);
    if (!epMatch) return null;
    const serverIds = epMatch[1] || epMatch[2];

    const serverRes = await fetch(`https://anikototv.to/ajax/server/list?servers=${encodeURIComponent(serverIds)}`, {
      headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest", "Referer": watchUrl }
    });
    if (!serverRes.ok) return null;
    const serverJson = await serverRes.json();
    const serverHtml = serverJson.result;

    // Filter section strictly for sub / dub
    const sectionMatch = isDub
      ? serverHtml.match(/data-type=["']dub["'][\s\S]*?<\/ul>/i)
      : serverHtml.match(/data-type=["']sub["'][\s\S]*?<\/ul>/i);
    const secHtml = sectionMatch ? sectionMatch[0] : serverHtml;

    let linkId = null;
    if (isVidstream) {
      const vm = secHtml.match(/<li\s+[^>]*data-link-id=["']([^"']+)["'][^>]*>(?:[^<]*Vidstream[^<]*)<\/li>/i)
              || secHtml.match(/data-link-id=["']([^"']+)["'][^>]*>[^<]*vidstream/i);
      linkId = vm ? vm[1] : null;
    }
    if (!linkId) {
      const hm = secHtml.match(/<li\s+[^>]*data-link-id=["']([^"']+)["'][^>]*>(?:[^<]*HD-1[^<]*)<\/li>/i)
              || secHtml.match(/data-link-id=["']([^"']+)["'][^>]*>[^<]*hd-1/i)
              || secHtml.match(/data-link-id=["']([^"']+)["']/);
      linkId = hm ? hm[1] : null;
    }
    if (!linkId) return null;

    const embedRes = await fetch(`https://anikototv.to/ajax/server?get=${encodeURIComponent(linkId)}`, {
      headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest", "Referer": watchUrl }
    });
    if (!embedRes.ok) return null;
    const embedJson = await embedRes.json();
    const embedUrl = embedJson?.result?.url;
    if (!embedUrl || !embedUrl.includes("megaplay")) return null;

    const mRes = await fetch(embedUrl, {
      headers: { "User-Agent": UA, "Referer": "https://anikototv.to/" }
    });
    if (!mRes.ok) return null;
    const mHtml = await mRes.text();
    const mIdMatch = mHtml.match(/data-id=["']([^"']+)["']/);
    if (!mIdMatch) return null;
    const mId = mIdMatch[1];

    let srvParam = isVidstream ? "vidstream" : "bcdn";
    try {
      const parsedEmbed = new URL(embedUrl);
      const sVal = parsedEmbed.searchParams.get("s");
      if (sVal) srvParam = sVal;
    } catch {}

    const srcRes = await fetch(`https://megaplay.buzz/stream/getSources?id=${mId}&s=${srvParam}`, {
      headers: { "User-Agent": UA, "Referer": embedUrl, "X-Requested-With": "XMLHttpRequest" }
    });
    if (!srcRes.ok) return null;
    const data = await srcRes.json();

    let streamUrl = null;
    let enc = null;
    if (data.enc) {
      enc = await decryptMegaPlayWeb(data.enc);
      streamUrl = enc?.url ?? null;
    }
    if (!streamUrl && data.sources) {
      streamUrl = Array.isArray(data.sources) ? data.sources[0]?.file : (data.sources.file || data.sources);
    }

    if (streamUrl) {
      let subtitles = captions(data.tracks?.length ? data.tracks : enc?.tracks, embedUrl);
      let meta = null;
      if (!subtitles.length) {
        meta = await megaMeta(embedUrl, mHtml, mId);
        subtitles = captions(meta.tracks, embedUrl);
      }
      return {
        server: isVidstream ? "Vidstream" : "MegaPlay",
        serverId: isVidstream ? `vidstream-direct-${audio}` : `megaplay-direct-${audio}`,
        streamUrl,
        audio,
        subtitles,
        intro: data.intro || enc?.intro || meta?.intro || null,
        outro: data.outro || enc?.outro || meta?.outro || null,
        referer: "https://megaplay.buzz/"
      };
    }
  } catch (err) {
    console.warn("resolveFromAnikotoSite error:", err.message);
  }
  return null;
}

// Resolve MegaPlay / Vidstream with 2-Tier Strategy
export async function resolveMegaPlay(anilistId, episode = 1, audio = "sub", serverParam = "bcdn", title = "") {
  const targetAudio = audio.toLowerCase() === "dub" ? "dub" : "sub";
  const srv = (serverParam || "bcdn").toLowerCase();

  // Tier 1: Client-Side Direct MegaPlay Extraction via AniList ID
  if (anilistId) {
    const srvList = [srv];
    if (srv === "vidstream") srvList.push("bcdn", "tcdn");
    else srvList.push("vidstream", "tcdn");

    for (const testSrv of srvList) {
      try {
        const pageUrl = `https://megaplay.buzz/stream/ani/${anilistId}/${episode}/${targetAudio}?s=${testSrv}`;
        const pageRes = await fetch(pageUrl, {
          headers: { "User-Agent": UA, "Referer": "https://megaplay.buzz/" }
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          const m = html.match(/data-id=["']([^"']+)["']/);
          if (m && m[1]) {
            const fileId = m[1];
            const srcRes = await fetch(`https://megaplay.buzz/stream/getSources?id=${fileId}&s=${testSrv}`, {
              headers: {
                "User-Agent": UA,
                "Referer": pageUrl,
                "X-Requested-With": "XMLHttpRequest"
              }
            });

            if (srcRes.ok) {
              const json = await srcRes.json();
              let streamUrl = null;
              let enc = null;

              if (json.enc) {
                enc = await decryptMegaPlayWeb(json.enc);
                streamUrl = enc?.url ?? null;
              }
              if (!streamUrl && json.sources) {
                streamUrl = Array.isArray(json.sources) ? json.sources[0]?.file : json.sources;
              }

              if (streamUrl) {
                const isVid = testSrv.includes("vidstream");
                let subtitles = captions(json.tracks?.length ? json.tracks : enc?.tracks, pageUrl);
                let meta = null;
                if (!subtitles.length) {
                  meta = await megaMeta(pageUrl, html, fileId);
                  subtitles = captions(meta.tracks, pageUrl);
                }
                return {
                  server: isVid ? "Vidstream" : "MegaPlay",
                  serverId: isVid ? `vidstream-direct-${targetAudio}` : `megaplay-direct-${targetAudio}`,
                  streamUrl,
                  audio: targetAudio,
                  subtitles,
                  intro: json.intro || enc?.intro || meta?.intro || null,
                  outro: json.outro || enc?.outro || meta?.outro || null,
                  referer: "https://megaplay.buzz/"
                };
              }
            }
          }
        }
      } catch (e) {
        console.warn("resolveMegaPlay Tier 1 error:", e.message);
      }
    }
  }

  // Tier 2: Anikoto TV Site Scraping Fallback using anime title
  if (title) {
    const siteRes = await resolveFromAnikotoSite(title, episode, targetAudio, srv);
    if (siteRes) return siteRes;
  }

  return null;
}

// Main Direct Resolver strictly supporting the 2 working Zenkai direct servers (MegaPlay & Vidstream)
export async function resolveDirectStreamWorker({ anilistId, episode = 1, audio = "sub", server = "megaplay", title = "" }) {
  const norm = (server || "megaplay").toLowerCase();
  const targetAudio = audio.toLowerCase() === "dub" ? "dub" : "sub";
  const isVidstream = norm.includes("vidstream") || norm === "hd2" || norm === "hd3";

  if (isVidstream) {
    const res = await resolveMegaPlay(anilistId, episode, targetAudio, "vidstream", title);
    if (res) return res;
    return await resolveMegaPlay(anilistId, episode, targetAudio, "bcdn", title);
  }

  // MegaPlay default
  const res = await resolveMegaPlay(anilistId, episode, targetAudio, "bcdn", title);
  if (res) return res;
  return await resolveMegaPlay(anilistId, episode, targetAudio, "vidstream", title);
}
