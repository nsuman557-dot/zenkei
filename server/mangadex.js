// MangaDex through its public API (https://api.mangadex.org). Returns the same shapes as server/manga.js,
// so the UI treats it like every other server. English chapters only, external-only chapters are skipped.
const API = "https://api.mangadex.org";
const COVERS = "https://uploads.mangadex.org/covers";
const UA = "Zenkai/1.0 (+https://github.com/Nyyrox/Zenkai)";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATINGS = ["safe", "suggestive"];
const TYPE_BY_LANG = { ja: "Manga", ko: "Manhwa", zh: "Manhua", "zh-hk": "Manhua" };

// MangaDex wants arrays as key[]=a&key[]=b and sorting as order[field]=dir
function qs(params) {
  const u = new URLSearchParams();
  const add = (k, v) => {
    if (v == null) return;
    if (Array.isArray(v)) v.forEach((x) => u.append(`${k}[]`, String(x)));
    else if (typeof v === "object") for (const [kk, vv] of Object.entries(v)) add(`${k}[${kk}]`, vv);
    else u.append(k, String(v));
  };
  for (const [k, v] of Object.entries(params)) add(k, v);
  return u.toString();
}

async function md(path, params = {}) {
  const r = await fetch(`${API}${path}?${qs(params)}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (r.status === 429) throw new Error("MangaDex is rate limiting requests, try again in a moment");
  if (!r.ok) throw new Error(`MangaDex ${r.status}`);
  return r.json();
}

function titleOf(a) {
  const t = a.title || {};
  return t.en || (a.altTitles || []).map((x) => x.en).find(Boolean) || Object.values(t)[0] || "Untitled";
}

function card(m) {
  const a = m.attributes || {};
  const file = (m.relationships || []).find((r) => r.type === "cover_art")?.attributes?.fileName;
  return {
    id: m.id,
    title: titleOf(a),
    poster: file ? `${COVERS}/${m.id}/${file}.512.jpg` : "",
    type: TYPE_BY_LANG[a.originalLanguage] || "Manga",
    status: a.status || null,
    latest: a.lastChapter ? `Ch. ${a.lastChapter}` : null,
    score: null,
    chapters: a.lastChapter && /^\d+$/.test(a.lastChapter) ? Number(a.lastChapter) : null,
    source: "mangadex",
  };
}

const listing = (order, extra = {}) =>
  md("/manga", {
    limit: 24,
    order,
    includes: ["cover_art"],
    contentRating: RATINGS,
    hasAvailableChapters: "true",
    availableTranslatedLanguage: ["en"],
    ...extra,
  }).then((d) => (d.data || []).map(card));

export async function getHome() {
  const [trending, latest, newRelease] = await Promise.all([
    listing({ followedCount: "desc" }),
    listing({ latestUploadedChapter: "desc" }),
    listing({ createdAt: "desc" }),
  ]);
  return { trending, latest, newRelease };
}

export async function search(term) {
  return { results: await listing({ relevance: "desc" }, { title: term }) };
}

export async function getChapters(id) {
  if (!UUID.test(id)) throw new Error("Invalid MangaDex id");
  const byNumber = new Map();
  for (let page = 0, offset = 0; page < 8; page++, offset += 500) {
    const d = await md(`/manga/${id}/feed`, {
      limit: 500,
      offset,
      translatedLanguage: ["en"],
      order: { volume: "asc", chapter: "asc" },
      includes: ["scanlation_group"],
      includeExternalUrl: 0,
    });
    for (const c of d.data || []) {
      const a = c.attributes || {};
      if (!(a.pages > 0) || a.externalUrl) continue; // nothing to read here
      // several scanlation groups often release the same chapter: keep the longest copy
      const key = a.chapter != null ? a.chapter : c.id;
      const held = byNumber.get(key);
      if (held && held.pages >= a.pages) continue;
      byNumber.set(key, {
        pages: a.pages,
        chapter: {
          chapterId: c.id,
          number: a.chapter != null ? String(a.chapter) : "0",
          title: a.title || null,
          date: a.publishAt || null,
          group: (c.relationships || []).find((r) => r.type === "scanlation_group")?.attributes?.name || null,
          volume: a.volume != null ? String(a.volume) : null,
        },
      });
    }
    if (offset + 500 >= (d.total ?? 0)) break;
  }
  const chapters = [...byNumber.values()].map((v) => v.chapter).sort((a, b) => parseFloat(a.number) - parseFloat(b.number));
  return { id, chapters };
}

export async function getPages(chapterId) {
  if (!UUID.test(chapterId)) throw new Error("Invalid MangaDex chapter id");
  const d = await md(`/at-home/server/${chapterId}`);
  if (d.result === "error" || !d.baseUrl) throw new Error("MangaDex has no pages for this chapter");
  const { hash, data } = d.chapter || {};
  return { chapterId, pages: (data || []).map((f) => `${d.baseUrl}/data/${hash}/${f}`) };
}
