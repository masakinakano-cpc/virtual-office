import { ref, computed } from 'vue'

// 絵文字データ型定義
export interface EmojiData {
    code: string
    name: string
    skin: string | null
}

export interface EmojiCategory {
    [key: string]: EmojiData[]
}

// スキントーン定義
export const SKIN_TONES = [
    { code: "1F3FB", name: "skin-tone-2" },
    { code: "1F3FC", name: "skin-tone-3" },
    { code: "1F3FD", name: "skin-tone-4" },
    { code: "1F3FE", name: "skin-tone-5" },
    { code: "1F3FF", name: "skin-tone-6" }
]

// 絵文字データ（主要カテゴリのみ）
const EMOJI_DATA: EmojiCategory = {
    "Smileys & Emotion": [
        { code: "1F600", name: "grinning", skin: null },
        { code: "1F601", name: "grin", skin: null },
        { code: "1F602", name: "joy", skin: null },
        { code: "1F603", name: "smiley", skin: null },
        { code: "1F604", name: "smile", skin: null },
        { code: "1F605", name: "sweat_smile", skin: null },
        { code: "1F606", name: "laughing", skin: null },
        { code: "1F607", name: "innocent", skin: null },
        { code: "1F608", name: "smiling_imp", skin: null },
        { code: "1F609", name: "wink", skin: null },
        { code: "1F60A", name: "blush", skin: null },
        { code: "1F60B", name: "yum", skin: null },
        { code: "1F60C", name: "relieved", skin: null },
        { code: "1F60D", name: "heart_eyes", skin: null },
        { code: "1F60E", name: "sunglasses", skin: null },
        { code: "1F60F", name: "smirk", skin: null },
        { code: "1F610", name: "neutral_face", skin: null },
        { code: "1F611", name: "expressionless", skin: null },
        { code: "1F612", name: "unamused", skin: null },
        { code: "1F613", name: "sweat", skin: null },
        { code: "1F614", name: "pensive", skin: null },
        { code: "1F615", name: "confused", skin: null },
        { code: "1F616", name: "confounded", skin: null },
        { code: "1F617", name: "kissing", skin: null },
        { code: "1F618", name: "kissing_heart", skin: null },
        { code: "1F619", name: "kissing_smiling_eyes", skin: null },
        { code: "1F61A", name: "kissing_closed_eyes", skin: null },
        { code: "1F61B", name: "stuck_out_tongue", skin: null },
        { code: "1F61C", name: "stuck_out_tongue_winking_eye", skin: null },
        { code: "1F61D", name: "stuck_out_tongue_closed_eyes", skin: null },
        { code: "1F61E", name: "disappointed", skin: null },
        { code: "1F61F", name: "worried", skin: null },
        { code: "1F620", name: "angry", skin: null },
        { code: "1F621", name: "rage", skin: null },
        { code: "1F622", name: "cry", skin: null },
        { code: "1F623", name: "persevere", skin: null },
        { code: "1F624", name: "triumph", skin: null },
        { code: "1F625", name: "disappointed_relieved", skin: null },
        { code: "1F626", name: "frowning", skin: null },
        { code: "1F627", name: "anguished", skin: null },
        { code: "1F628", name: "fearful", skin: null },
        { code: "1F629", name: "weary", skin: null },
        { code: "1F62A", name: "sleepy", skin: null },
        { code: "1F62B", name: "tired_face", skin: null },
        { code: "1F62C", name: "grimacing", skin: null },
        { code: "1F62D", name: "sob", skin: null },
        { code: "1F62E", name: "open_mouth", skin: null },
        { code: "1F62F", name: "hushed", skin: null },
        { code: "1F630", name: "cold_sweat", skin: null },
        { code: "1F631", name: "scream", skin: null },
        { code: "1F632", name: "astonished", skin: null },
        { code: "1F633", name: "flushed", skin: null },
        { code: "1F634", name: "sleeping", skin: null },
        { code: "1F635", name: "dizzy_face", skin: null },
        { code: "1F636", name: "no_mouth", skin: null },
        { code: "1F637", name: "mask", skin: null }
    ],
    "People & Body": [
        { code: "1F44D", name: "+1", skin: "1F44D-{{tone}}" },
        { code: "1F44E", name: "-1", skin: "1F44E-{{tone}}" },
        { code: "1F44F", name: "clap", skin: "1F44F-{{tone}}" },
        { code: "1F64F", name: "pray", skin: "1F64F-{{tone}}" },
        { code: "1F44B", name: "wave", skin: "1F44B-{{tone}}" },
        { code: "1F4AA", name: "muscle", skin: "1F4AA-{{tone}}" },
        { code: "1F64C", name: "raised_hands", skin: "1F64C-{{tone}}" },
        { code: "1F450", name: "open_hands", skin: "1F450-{{tone}}" },
        { code: "1F44C", name: "ok_hand", skin: "1F44C-{{tone}}" },
        { code: "1F91D", name: "handshake", skin: "1F91D-{{tone}}" },
        { code: "1F468", name: "man", skin: "1F468-{{tone}}" },
        { code: "1F469", name: "woman", skin: "1F469-{{tone}}" },
        { code: "1F466", name: "boy", skin: "1F466-{{tone}}" },
        { code: "1F467", name: "girl", skin: "1F467-{{tone}}" },
        { code: "1F476", name: "baby", skin: "1F476-{{tone}}" },
        { code: "1F474", name: "older_man", skin: "1F474-{{tone}}" },
        { code: "1F475", name: "older_woman", skin: "1F475-{{tone}}" }
    ],
    "Activities": [
        { code: "26BD", name: "soccer", skin: null },
        { code: "1F3C0", name: "basketball", skin: null },
        { code: "1F3C8", name: "football", skin: null },
        { code: "26BE", name: "baseball", skin: null },
        { code: "1F3BE", name: "tennis", skin: null },
        { code: "1F3D0", name: "volleyball", skin: null },
        { code: "1F3C9", name: "rugby_football", skin: null },
        { code: "1F3B1", name: "8ball", skin: null },
        { code: "1F3AF", name: "dart", skin: null },
        { code: "1F3B3", name: "bowling", skin: null },
        { code: "1F3AE", name: "video_game", skin: null },
        { code: "1F3B2", name: "game_die", skin: null },
        { code: "1F3A8", name: "art", skin: null },
        { code: "1F3AD", name: "performing_arts", skin: null },
        { code: "1F3A4", name: "microphone", skin: null },
        { code: "1F3A7", name: "headphones", skin: null },
        { code: "1F3B5", name: "musical_note", skin: null },
        { code: "1F3B6", name: "notes", skin: null },
        { code: "1F3B8", name: "guitar", skin: null },
        { code: "1F3B9", name: "musical_keyboard", skin: null }
    ],
    "Objects": [
        { code: "1F4BB", name: "computer", skin: null },
        { code: "1F4F1", name: "iphone", skin: null },
        { code: "1F4F7", name: "camera", skin: null },
        { code: "1F4FA", name: "tv", skin: null },
        { code: "1F4FB", name: "radio", skin: null },
        { code: "1F4A1", name: "bulb", skin: null },
        { code: "1F4D6", name: "book", skin: null },
        { code: "1F4DD", name: "memo", skin: null },
        { code: "1F4CE", name: "paperclip", skin: null },
        { code: "1F4CC", name: "pushpin", skin: null },
        { code: "1F511", name: "key", skin: null },
        { code: "1F512", name: "lock", skin: null },
        { code: "1F513", name: "unlock", skin: null },
        { code: "1F514", name: "bell", skin: null },
        { code: "1F50D", name: "mag", skin: null },
        { code: "1F4B0", name: "moneybag", skin: null },
        { code: "1F4B3", name: "credit_card", skin: null },
        { code: "1F48E", name: "gem", skin: null },
        { code: "1F451", name: "crown", skin: null },
        { code: "1F484", name: "lipstick", skin: null }
    ]
}

export function useEmojiSystem() {
    const searchQuery = ref('')
    const selectedCategory = ref('Smileys & Emotion')
    const selectedSkinTone = ref('')

    // 絵文字をUnicodeに変換
    const convertToUnicode = (code: string): string => {
        return code.split('-').map(part =>
            String.fromCodePoint(parseInt(part, 16))
        ).join('')
    }

    // スキントーンを適用
    const applySkintone = (emoji: EmojiData, tone: string): string => {
        if (!emoji.skin || !tone) {
            return convertToUnicode(emoji.code)
        }

        const codeWithTone = emoji.skin.replace('{{tone}}', tone)
        return convertToUnicode(codeWithTone)
    }

    // 絵文字検索
    const searchEmojis = computed(() => {
        if (!searchQuery.value) {
            return EMOJI_DATA[selectedCategory.value] || []
        }

        const query = searchQuery.value.toLowerCase()
        const allEmojis = Object.values(EMOJI_DATA).flat()

        return allEmojis.filter(emoji =>
            emoji.name.toLowerCase().includes(query)
        )
    })

    // カテゴリ一覧
    const categories = computed(() => Object.keys(EMOJI_DATA))

    // 絵文字をテキストに変換
    const emojiToText = (emoji: EmojiData): string => {
        return applySkintone(emoji, selectedSkinTone.value)
    }

    // 絵文字データを取得
    const getEmojiData = () => EMOJI_DATA

    // 絵文字名から絵文字を取得
    const getEmojiByName = (name: string): EmojiData | null => {
        const allEmojis = Object.values(EMOJI_DATA).flat()
        return allEmojis.find(emoji => emoji.name === name) || null
    }

    return {
        searchQuery,
        selectedCategory,
        selectedSkinTone,
        searchEmojis,
        categories,
        skinTones: SKIN_TONES,
        convertToUnicode,
        applySkintone,
        emojiToText,
        getEmojiData,
        getEmojiByName
    }
}
