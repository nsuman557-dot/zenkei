/**
 * Animated avatar frames: 288px APNGs from https://github.com/Nyyrox/SillyTavern-AvatarDecorations-CSS (no license listed there).
 * The animated file is loaded from jsDelivr (pinned commit) and drawn as a plain <img> so it keeps animating;
 * /frames/<id>.webp is a static first-frame thumbnail so the picker doesn't download ~57 MB.
 * ponytail: hotlinked, not vendored. Upgrade path: copy the PNGs into public/ if that repo ever disappears.
 */
export interface Frame {
  id: string
  name: string
  file: string
}

const CDN = 'https://cdn.jsdelivr.net/gh/Nyyrox/SillyTavern-AvatarDecorations-CSS@c63faa39f5c863da5bfaa9a642720b50283de090/dc-decorations/'

export const FRAMES: Frame[] = [
  { id: "1-angry", name: "Angry", file: "1_Angry" },
  { id: "1-cat-ears", name: "Cat Ears", file: "1_cat-ears" },
  { id: "1-dismay", name: "Dismay", file: "1_dismay" },
  { id: "1-heartbloom", name: "Heartbloom", file: "1_heartbloom" },
  { id: "1-in-love", name: "In Love", file: "1_In-Love" },
  { id: "1-in-tears", name: "In Tears", file: "1_in-tears" },
  { id: "1-ki-energy", name: "Ki Energy", file: "1_ki-energy" },
  { id: "1-radiating-energy", name: "Radiating Energy", file: "1_Radiating-Energy" },
  { id: "1-rage", name: "Rage", file: "1_rage" },
  { id: "1-shocked", name: "Shocked", file: "1_Shocked" },
  { id: "1-soul-leaving-body", name: "Soul Leaving Body", file: "1_Soul-Leaving-Body" },
  { id: "1-starry-eyed", name: "Starry Eyed", file: "1_Starry-Eyed" },
  { id: "1-sweat-drops", name: "Sweat Drops", file: "1_Sweat-Drops" },
  { id: "2-cybernetic", name: "Cybernetic", file: "2_Cybernetic" },
  { id: "2-digital-sunrise", name: "Digital Sunrise", file: "2_Digital Sunrise" },
  { id: "2-glitch", name: "Glitch", file: "2_Glitch" },
  { id: "2-implant", name: "Implant", file: "2_Implant" },
  { id: "3-disxcore-headset", name: "DISXCORE Headset", file: "3_DISXCORE Headset" },
  { id: "3-futuristic-ui", name: "Futuristic UI", file: "3_Futuristic UI" },
  { id: "3-smoke", name: "Smoke", file: "3_Smoke" },
  { id: "4-defensive-shield", name: "Defensive Shield", file: "4_Defensive Shield" },
  { id: "4-fairy-sprites", name: "Fairy Sprites", file: "4_Fairy Sprites" },
  { id: "4-flaming-sword", name: "Flaming Sword", file: "4_Flaming Sword" },
  { id: "4-glowing-runes", name: "GLowing Runes", file: "4_GLowing Runes" },
  { id: "4-magical-potion", name: "Magical Potion", file: "4_Magical Potion" },
  { id: "4-skull-medallion", name: "Skull Medallion", file: "4_Skull Medallion" },
  { id: "4-treasure-and-key", name: "Treasure And Key", file: "4_Treasure and Key" },
  { id: "4-wizard-s-staff", name: "Wizard's Staff", file: "4_Wizard's Staff" },
  { id: "5-dragon-s-smile", name: "Dragon's Smile", file: "5_Dragon's Smile" },
  { id: "5-fan-fluorish", name: "Fan Fluorish", file: "5_Fan Fluorish" },
  { id: "5-firecrackers", name: "Firecrackers", file: "5_Firecrackers" },
  { id: "5-koi-pond", name: "Koi Pond", file: "5_Koi Pond" },
  { id: "5-lucky-envelopes", name: "Lucky Envelopes", file: "5_Lucky Envelopes" },
  { id: "5-lunar-lanterns", name: "Lunar Lanterns", file: "5_Lunar Lanterns" },
  { id: "6-air", name: "Air", file: "6_Air" },
  { id: "6-balance", name: "Balance", file: "6_Balance" },
  { id: "6-earth", name: "Earth", file: "6_Earth" },
  { id: "6-fire", name: "Fire", file: "6_Fire" },
  { id: "6-lightning", name: "Lightning", file: "6_Lightning" },
  { id: "6-water", name: "Water", file: "6_Water" },
  { id: "7-chromawave", name: "Chromawave", file: "7_Chromawave" },
  { id: "7-cozy-cat", name: "Cozy Cat", file: "7_Cozy-Cat" },
  { id: "7-cozy-headphones", name: "Cozy Headphones", file: "7_Cozy-Headphones" },
  { id: "7-doodling", name: "Doodling", file: "7_Doodling" },
  { id: "7-oasis", name: "Oasis", file: "7_Oasis" },
  { id: "7-rainy-mood", name: "Rainy Mood", file: "7_Rainy-Mood" },
  { id: "8-a-hint-of-clove", name: "A Hint Of Clove", file: "8_a-hint-of-clove" },
  { id: "8-blade-storm", name: "Blade Storm", file: "8_blade-storm" },
  { id: "8-frag-out", name: "Frag Out", file: "8_frag-out" },
  { id: "8-omens-cowl", name: "Omens Cowl", file: "8_omens-cowl" },
  { id: "8-reynas-leer", name: "Reynas Leer", file: "8_reynas-leer" },
  { id: "9-butterflies", name: "Butterflies", file: "9_butterflies" },
  { id: "9-dandelion-duo", name: "Dandelion Duo", file: "9_dandelion-duo" },
  { id: "9-honeyblossom", name: "Honeyblossom", file: "9_honeyblossom" },
  { id: "9-hug-the-rainbow", name: "Hug The Rainbow", file: "9_hug-the-rainbow" },
  { id: "9-strawberry-vine", name: "Strawberry Vine", file: "9_strawberry-vine" },
  { id: "9-the-petal-pack", name: "The Petal Pack", file: "9_the-petal-pack" },
  { id: "10-astronaut-helmet", name: "Astronaut Helmet", file: "10_Astronaut-Helmet" },
  { id: "10-black-hole", name: "Black Hole", file: "10_Black-Hole" },
  { id: "10-constellations", name: "Constellations", file: "10_Constellations" },
  { id: "10-solar-orbit", name: "Solar Orbit", file: "10_Solar-Orbit" },
  { id: "10-stardust", name: "Stardust", file: "10_Stardust" },
  { id: "10-ufo", name: "UFO", file: "10_UFO" },
  { id: "11-gyoko-green", name: "Gyoko Green", file: "11_Gyoko-Green" },
  { id: "11-gyoko-pink", name: "Gyoko Pink", file: "11_Gyoko-Pink" },
]

export const frameById = (id: string | null | undefined) => FRAMES.find((f) => f.id === id)
export const frameUrl = (f: Frame) => `${CDN}${encodeURIComponent(f.file)}.png`
export const frameThumb = (f: Frame) => `/frames/${f.id}.webp`

/** Overlay categories, from the number prefix of each frame id (shown as a dropdown in the picker). */
export const FRAME_GROUPS: Record<string, string> = {
  '1': 'Reactions',
  '2': 'Cyber',
  '3': 'Digital',
  '4': 'Fantasy',
  '5': 'Lunar festival',
  '6': 'Elements',
  '7': 'Cozy',
  '8': 'Agents',
  '9': 'Nature',
  '10': 'Space',
  '11': 'Gyoko',
}
export const frameGroup = (f: Frame) => FRAME_GROUPS[f.id.split('-')[0]] ?? 'Other'
