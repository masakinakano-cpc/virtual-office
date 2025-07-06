import { ref, computed } from 'vue'

// Types
interface TimezoneInfo {
    name: string
    offset: number
    displayName: string
    abbreviation: string
}

interface DateTimeOptions {
    locale?: string
    timeZone?: string
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
    year?: 'numeric' | '2-digit'
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
    day?: 'numeric' | '2-digit'
    hour?: 'numeric' | '2-digit'
    minute?: 'numeric' | '2-digit'
    second?: 'numeric' | '2-digit'
    hour12?: boolean
}

// Timezone detection function from original code
const getTimezone = async (): Promise<string> => {
    try {
        // Try to get timezone from Intl API first
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (timezone) {
            return timezone
        }
    } catch (error) {
        console.warn('Failed to get timezone from Intl API:', error)
    }

    try {
        // Fallback to dynamic import (simulating the original luxon import)
        // In a real app, you would actually import luxon here
        const fallbackTimezone = await getFallbackTimezone()
        return fallbackTimezone
    } catch (error) {
        console.warn('Failed to get timezone from fallback:', error)
        return 'UTC'
    }
}

// Simulated fallback timezone detection
const getFallbackTimezone = async (): Promise<string> => {
    // In the original code, this would use luxon's DateTime
    // For now, we'll simulate it with a simple offset-based detection
    const offset = new Date().getTimezoneOffset()
    const offsetHours = Math.abs(offset / 60)

    // Common timezone mappings based on offset
    const timezoneMap: Record<number, string> = {
        0: 'UTC',
        1: 'Europe/London',
        2: 'Europe/Berlin',
        3: 'Europe/Moscow',
        4: 'Asia/Dubai',
        5: 'Asia/Karachi',
        5.5: 'Asia/Kolkata',
        6: 'Asia/Dhaka',
        7: 'Asia/Bangkok',
        8: 'Asia/Shanghai',
        9: 'Asia/Tokyo',
        10: 'Australia/Sydney',
        11: 'Pacific/Auckland',
        12: 'Pacific/Fiji',
        '-5': 'America/New_York',
        '-6': 'America/Chicago',
        '-7': 'America/Denver',
        '-8': 'America/Los_Angeles',
        '-9': 'America/Anchorage',
        '-10': 'Pacific/Honolulu'
    }

    return timezoneMap[offset < 0 ? offsetHours : -offsetHours] || 'UTC'
}

// Main composable
export const useTimezone = () => {
    const currentTimezone = ref<string>('UTC')
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Common timezones list
    const commonTimezones = ref<TimezoneInfo[]>([
        { name: 'UTC', offset: 0, displayName: 'UTC (協定世界時)', abbreviation: 'UTC' },
        { name: 'Asia/Tokyo', offset: 9, displayName: 'Tokyo (東京)', abbreviation: 'JST' },
        { name: 'Asia/Shanghai', offset: 8, displayName: 'Shanghai (上海)', abbreviation: 'CST' },
        { name: 'Asia/Seoul', offset: 9, displayName: 'Seoul (서울)', abbreviation: 'KST' },
        { name: 'America/New_York', offset: -5, displayName: 'New York', abbreviation: 'EST' },
        { name: 'America/Los_Angeles', offset: -8, displayName: 'Los Angeles', abbreviation: 'PST' },
        { name: 'Europe/London', offset: 0, displayName: 'London', abbreviation: 'GMT' },
        { name: 'Europe/Berlin', offset: 1, displayName: 'Berlin', abbreviation: 'CET' },
        { name: 'Australia/Sydney', offset: 10, displayName: 'Sydney', abbreviation: 'AEST' }
    ])

    // Computed properties
    const currentTimezoneInfo = computed(() => {
        return commonTimezones.value.find(tz => tz.name === currentTimezone.value) || {
            name: currentTimezone.value,
            offset: 0,
            displayName: currentTimezone.value,
            abbreviation: 'UTC'
        }
    })

    const currentOffset = computed(() => {
        const now = new Date()
        const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
        const target = new Date(utc.toLocaleString('en-US', { timeZone: currentTimezone.value }))
        return Math.round((target.getTime() - utc.getTime()) / 3600000)
    })

    // Methods
    const initializeTimezone = async () => {
        isLoading.value = true
        error.value = null

        try {
            const detectedTimezone = await getTimezone()
            currentTimezone.value = detectedTimezone
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to detect timezone'
            currentTimezone.value = 'UTC'
        } finally {
            isLoading.value = false
        }
    }

    const setTimezone = (timezone: string) => {
        currentTimezone.value = timezone
    }

    const formatDateTime = (
        date: Date | string | number,
        options: DateTimeOptions = {}
    ): string => {
        const dateObj = new Date(date)

        const defaultOptions: DateTimeOptions = {
            timeZone: currentTimezone.value,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }

        const formatOptions = { ...defaultOptions, ...options }

        try {
            return new Intl.DateTimeFormat(options.locale || 'ja-JP', formatOptions).format(dateObj)
        } catch (err) {
            console.error('Failed to format date:', err)
            return dateObj.toISOString()
        }
    }

    const formatDate = (date: Date | string | number, options: DateTimeOptions = {}): string => {
        return formatDateTime(date, {
            ...options,
            hour: undefined,
            minute: undefined,
            second: undefined
        })
    }

    const formatTime = (date: Date | string | number, options: DateTimeOptions = {}): string => {
        return formatDateTime(date, {
            ...options,
            year: undefined,
            month: undefined,
            day: undefined
        })
    }

    const convertTimezone = (date: Date | string | number, targetTimezone: string): Date => {
        const dateObj = new Date(date)
        const utc = new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000))
        return new Date(utc.toLocaleString('en-US', { timeZone: targetTimezone }))
    }

    const getTimezoneOffset = (timezone: string): number => {
        const now = new Date()
        const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
        const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
        return Math.round((target.getTime() - utc.getTime()) / 3600000)
    }

    const isValidTimezone = (timezone: string): boolean => {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone })
            return true
        } catch {
            return false
        }
    }

    const getRelativeTime = (date: Date | string | number, locale: string = 'ja-JP'): string => {
        const dateObj = new Date(date)
        const now = new Date()
        const diffMs = now.getTime() - dateObj.getTime()
        const diffMinutes = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMinutes < 1) {
            return 'たった今'
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分前`
        } else if (diffHours < 24) {
            return `${diffHours}時間前`
        } else if (diffDays < 7) {
            return `${diffDays}日前`
        } else {
            return formatDate(dateObj, { locale })
        }
    }

    const getTimezoneName = (timezone: string, locale: string = 'ja-JP'): string => {
        try {
            const formatter = new Intl.DateTimeFormat(locale, {
                timeZone: timezone,
                timeZoneName: 'long'
            })
            const parts = formatter.formatToParts(new Date())
            const timezonePart = parts.find(part => part.type === 'timeZoneName')
            return timezonePart?.value || timezone
        } catch {
            return timezone
        }
    }

    const getAllTimezones = (): string[] => {
        try {
            // Try to use the modern API if available
            if ('supportedValuesOf' in Intl) {
                return (Intl as any).supportedValuesOf('timeZone')
            }
        } catch (error) {
            console.warn('supportedValuesOf not available, using fallback')
        }

        // Fallback to a predefined list of common timezones
        return [
            'UTC',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'America/Anchorage',
            'Pacific/Honolulu',
            'Europe/London',
            'Europe/Berlin',
            'Europe/Paris',
            'Europe/Rome',
            'Europe/Moscow',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Asia/Seoul',
            'Asia/Kolkata',
            'Asia/Dubai',
            'Asia/Bangkok',
            'Australia/Sydney',
            'Australia/Melbourne',
            'Pacific/Auckland'
        ]
    }

    const groupTimezonesByRegion = (): Record<string, string[]> => {
        const timezones = getAllTimezones()
        const grouped: Record<string, string[]> = {}

        timezones.forEach(timezone => {
            const [region] = timezone.split('/')
            if (!grouped[region]) {
                grouped[region] = []
            }
            grouped[region].push(timezone)
        })

        return grouped
    }

    // Initialize timezone on first use
    initializeTimezone()

    return {
        // State
        currentTimezone,
        isLoading,
        error,
        commonTimezones,

        // Computed
        currentTimezoneInfo,
        currentOffset,

        // Methods
        initializeTimezone,
        setTimezone,
        formatDateTime,
        formatDate,
        formatTime,
        convertTimezone,
        getTimezoneOffset,
        isValidTimezone,
        getRelativeTime,
        getTimezoneName,
        getAllTimezones,
        groupTimezonesByRegion
    }
}
