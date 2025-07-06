import { ref, computed, reactive } from 'vue'

// Types
interface WorkspaceLockState {
    isLocked: boolean
    lockedUntil: Date | null
    lockedBy: string | null
    reason: string | null
    lockType: 'temporary' | 'permanent' | 'scheduled'
}

interface LockPermissions {
    canLock: boolean
    canUnlock: boolean
    canScheduleLock: boolean
    canViewLockHistory: boolean
}

interface LockHistoryEntry {
    id: string
    action: 'lock' | 'unlock' | 'schedule'
    timestamp: Date
    userId: string
    userName: string
    reason?: string
    duration?: number
    lockType?: 'temporary' | 'permanent' | 'scheduled'
}

interface ScheduledLock {
    id: string
    startDate: Date
    endDate: Date
    reason: string
    isActive: boolean
    createdBy: string
    createdAt: Date
}

// Utility functions from original code
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    if (isNaN(days)) {
        return new Date(NaN)
    }
    if (days) {
        result.setDate(result.getDate() + days)
    }
    return result
}

const addWeeks = (date: Date, weeks: number): Date => {
    const daysToAdd = weeks * 7
    return addDays(date, daysToAdd)
}

// Main composable
export const useWorkspaceLock = () => {
    // State
    const lockState = reactive<WorkspaceLockState>({
        isLocked: false,
        lockedUntil: null,
        lockedBy: null,
        reason: null,
        lockType: 'temporary'
    })

    const currentUser = ref({
        id: 'user_123',
        name: 'Current User',
        role: 'admin' // admin, moderator, member
    })

    const permissions = computed<LockPermissions>(() => {
        const role = currentUser.value.role
        return {
            canLock: ['admin', 'moderator'].includes(role),
            canUnlock: ['admin', 'moderator'].includes(role),
            canScheduleLock: ['admin'].includes(role),
            canViewLockHistory: ['admin', 'moderator'].includes(role)
        }
    })

    const lockHistory = ref<LockHistoryEntry[]>([
        {
            id: '1',
            action: 'lock',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            userId: 'user_456',
            userName: 'Admin User',
            reason: 'Maintenance work',
            duration: 120, // minutes
            lockType: 'temporary'
        },
        {
            id: '2',
            action: 'unlock',
            timestamp: new Date(Date.now() - 82800000), // 23 hours ago
            userId: 'user_456',
            userName: 'Admin User'
        }
    ])

    const scheduledLocks = ref<ScheduledLock[]>([
        {
            id: '1',
            startDate: new Date(Date.now() + 86400000), // tomorrow
            endDate: new Date(Date.now() + 90000000), // day after tomorrow
            reason: 'Scheduled maintenance',
            isActive: true,
            createdBy: 'user_456',
            createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        }
    ])

    // Computed properties
    const isCurrentlyLocked = computed(() => {
        if (!lockState.isLocked) return false

        if (lockState.lockType === 'permanent') return true

        if (lockState.lockedUntil && new Date() > lockState.lockedUntil) {
            // Auto-unlock expired locks
            unlockWorkspace('Auto-unlock: Lock expired')
            return false
        }

        return true
    })

    const lockTimeRemaining = computed(() => {
        if (!lockState.lockedUntil || lockState.lockType === 'permanent') return null

        const now = new Date()
        const timeLeft = lockState.lockedUntil.getTime() - now.getTime()

        if (timeLeft <= 0) return null

        const hours = Math.floor(timeLeft / (1000 * 60 * 60))
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

        return { hours, minutes, totalMinutes: Math.floor(timeLeft / (1000 * 60)) }
    })

    const activeScheduledLocks = computed(() => {
        const now = new Date()
        return scheduledLocks.value.filter(lock =>
            lock.isActive &&
            lock.startDate <= now &&
            lock.endDate > now
        )
    })

    const upcomingScheduledLocks = computed(() => {
        const now = new Date()
        return scheduledLocks.value.filter(lock =>
            lock.isActive &&
            lock.startDate > now
        ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    })

    // Methods
    const lockWorkspace = (
        reason: string,
        duration?: number, // minutes
        lockType: 'temporary' | 'permanent' = 'temporary'
    ): boolean => {
        if (!permissions.value.canLock) {
            console.error('Insufficient permissions to lock workspace')
            return false
        }

        const lockedUntil = lockType === 'permanent' ? null :
            duration ? addDays(new Date(), duration / (24 * 60)) : null

        lockState.isLocked = true
        lockState.lockedUntil = lockedUntil
        lockState.lockedBy = currentUser.value.id
        lockState.reason = reason
        lockState.lockType = lockType

        // Add to history
        addLockHistoryEntry({
            action: 'lock',
            reason,
            duration,
            lockType
        })

        return true
    }

    const unlockWorkspace = (reason?: string): boolean => {
        if (!permissions.value.canUnlock) {
            console.error('Insufficient permissions to unlock workspace')
            return false
        }

        lockState.isLocked = false
        lockState.lockedUntil = null
        lockState.lockedBy = null
        lockState.reason = null
        lockState.lockType = 'temporary'

        // Add to history
        addLockHistoryEntry({
            action: 'unlock',
            reason
        })

        return true
    }

    const scheduleLock = (
        startDate: Date,
        endDate: Date,
        reason: string
    ): boolean => {
        if (!permissions.value.canScheduleLock) {
            console.error('Insufficient permissions to schedule lock')
            return false
        }

        const newScheduledLock: ScheduledLock = {
            id: `scheduled_${Date.now()}`,
            startDate,
            endDate,
            reason,
            isActive: true,
            createdBy: currentUser.value.id,
            createdAt: new Date()
        }

        scheduledLocks.value.push(newScheduledLock)

        // Add to history
        addLockHistoryEntry({
            action: 'schedule',
            reason: `Scheduled lock: ${reason}`
        })

        return true
    }

    const cancelScheduledLock = (lockId: string): boolean => {
        if (!permissions.value.canScheduleLock) {
            console.error('Insufficient permissions to cancel scheduled lock')
            return false
        }

        const lockIndex = scheduledLocks.value.findIndex(lock => lock.id === lockId)
        if (lockIndex === -1) return false

        scheduledLocks.value[lockIndex].isActive = false
        return true
    }

    const lockForDuration = (minutes: number, reason: string): boolean => {
        return lockWorkspace(reason, minutes, 'temporary')
    }

    const lockForDays = (days: number, reason: string): boolean => {
        const minutes = days * 24 * 60
        return lockWorkspace(reason, minutes, 'temporary')
    }

    const lockForWeeks = (weeks: number, reason: string): boolean => {
        const days = weeks * 7
        return lockForDays(days, reason)
    }

    const lockPermanently = (reason: string): boolean => {
        return lockWorkspace(reason, undefined, 'permanent')
    }

    const extendLock = (additionalMinutes: number): boolean => {
        if (!lockState.isLocked || !permissions.value.canLock) return false

        if (lockState.lockType === 'permanent') return false

        const currentEnd = lockState.lockedUntil || new Date()
        lockState.lockedUntil = addDays(currentEnd, additionalMinutes / (24 * 60))

        addLockHistoryEntry({
            action: 'lock',
            reason: `Extended lock by ${additionalMinutes} minutes`,
            duration: additionalMinutes
        })

        return true
    }

    const addLockHistoryEntry = (entry: Partial<LockHistoryEntry>) => {
        const newEntry: LockHistoryEntry = {
            id: `history_${Date.now()}`,
            timestamp: new Date(),
            userId: currentUser.value.id,
            userName: currentUser.value.name,
            ...entry
        } as LockHistoryEntry

        lockHistory.value.unshift(newEntry)

        // Keep only last 100 entries
        if (lockHistory.value.length > 100) {
            lockHistory.value = lockHistory.value.slice(0, 100)
        }
    }

    const checkScheduledLocks = () => {
        const now = new Date()

        // Check for locks that should start
        scheduledLocks.value.forEach(scheduledLock => {
            if (
                scheduledLock.isActive &&
                scheduledLock.startDate <= now &&
                scheduledLock.endDate > now &&
                !lockState.isLocked
            ) {
                lockState.isLocked = true
                lockState.lockedUntil = scheduledLock.endDate
                lockState.lockedBy = scheduledLock.createdBy
                lockState.reason = scheduledLock.reason
                lockState.lockType = 'scheduled'

                addLockHistoryEntry({
                    action: 'lock',
                    reason: `Scheduled lock activated: ${scheduledLock.reason}`,
                    lockType: 'scheduled'
                })
            }
        })
    }

    const formatLockDuration = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes}分`
        } else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60)
            const remainingMinutes = minutes % 60
            return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`
        } else {
            const days = Math.floor(minutes / 1440)
            const remainingHours = Math.floor((minutes % 1440) / 60)
            return remainingHours > 0 ? `${days}日${remainingHours}時間` : `${days}日`
        }
    }

    const getLockStatusText = (): string => {
        if (!isCurrentlyLocked.value) return 'ワークスペースはアンロックされています'

        if (lockState.lockType === 'permanent') {
            return 'ワークスペースは永続的にロックされています'
        }

        const timeLeft = lockTimeRemaining.value
        if (!timeLeft) return 'ワークスペースはロックされています'

        const timeText = timeLeft.hours > 0
            ? `${timeLeft.hours}時間${timeLeft.minutes}分`
            : `${timeLeft.minutes}分`

        return `ワークスペースは${timeText}後にアンロックされます`
    }

    // Auto-check scheduled locks every minute
    setInterval(checkScheduledLocks, 60000)

    return {
        // State
        lockState,
        currentUser,
        permissions,
        lockHistory,
        scheduledLocks,

        // Computed
        isCurrentlyLocked,
        lockTimeRemaining,
        activeScheduledLocks,
        upcomingScheduledLocks,

        // Methods
        lockWorkspace,
        unlockWorkspace,
        scheduleLock,
        cancelScheduledLock,
        lockForDuration,
        lockForDays,
        lockForWeeks,
        lockPermanently,
        extendLock,
        checkScheduledLocks,
        formatLockDuration,
        getLockStatusText,

        // Utilities
        addDays,
        addWeeks
    }
}
