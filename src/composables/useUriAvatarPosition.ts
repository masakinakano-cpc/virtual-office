import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Types
interface Position {
    x: number
    y: number
}

interface SpawnConfig {
    x: number | string
    y: number | string
    range?: number
}

interface WorkspaceData {
    width: number
    height: number
    spawn?: SpawnConfig
}

interface SpaceSettings {
    homeLocationUrl?: string
}

interface UserData {
    space_settings?: SpaceSettings
}

interface NavigateOptions {
    roomId?: number
    x?: number
    y?: number
    objectId?: string
}

// Constants
const PIXEL_SCALE = 64 // Equivalent to 'l' constant from original code
const MIN_DISTANCE = 100

// Utility functions
const pixelsToGridUnits = (pixels: number): number => {
    return pixels * (PIXEL_SCALE - 1)
}

const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max)
}

const randomBetween = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min)) + min
}

const generateRandomPosition = (
    centerX: number,
    centerY: number,
    range: number,
    maxWidth: number,
    maxHeight: number
): Position => {
    const angle = Math.random() * 2 * Math.PI
    const radius = Math.random() * range
    const offsetX = Math.round(radius * Math.cos(angle))
    const offsetY = Math.round(radius * Math.sin(angle))

    return {
        x: clamp(centerX + offsetX, 0, maxWidth),
        y: clamp(centerY + offsetY, 0, maxHeight)
    }
}

const parsePositionValue = (value: string | number | undefined): number | undefined => {
    if (value == null) return undefined

    if (typeof value === 'number') return value

    if (typeof value === 'string') {
        if (value.startsWith('@')) {
            return Number(value.substring(1))
        }
        return Number(value)
    }

    return undefined
}

// Main composable
export const useUriAvatarPosition = () => {
    const route = useRoute()
    const router = useRouter()

    // Mock data - in real app, these would come from your data store/API
    const workspaceData = ref<WorkspaceData>({
        width: 20,
        height: 15,
        spawn: {
            x: 10,
            y: 7,
            range: 3
        }
    })

    const userData = ref<UserData>({
        space_settings: {
            homeLocationUrl: '/@10,7'
        }
    })

    const onlineUsers = ref([
        { id: 1, status: 'online' },
        { id: 2, status: 'online' },
        { id: 3, status: 'away' }
    ])

    // Generate fallback position based on online users
    const generateFallbackPosition = (): Position => {
        const onlineCount = onlineUsers.value.filter(user => user.status === 'online').length
        const buffer = MIN_DISTANCE
        const spacing = (buffer + onlineCount) * 2

        const maxX = Math.min(
            (workspaceData.value.width || 1) * PIXEL_SCALE - buffer,
            spacing
        )
        const maxY = Math.min(
            (workspaceData.value.height || 1) * PIXEL_SCALE - buffer,
            spacing
        )

        return {
            x: randomBetween(buffer, maxX),
            y: randomBetween(buffer, maxY)
        }
    }

    // Parse spawn position from workspace configuration
    const parseSpawnPosition = (workspace: WorkspaceData | null): Position | undefined => {
        if (!workspace?.spawn) return undefined

        const x = parsePositionValue(workspace.spawn.x)
        const y = parsePositionValue(workspace.spawn.y)

        if (x != null && y != null && !Number.isNaN(x) && !Number.isNaN(y)) {
            if (workspace.spawn.range) {
                const maxWidth = pixelsToGridUnits(workspace.width)
                const maxHeight = pixelsToGridUnits(workspace.height)

                return generateRandomPosition(x, y, workspace.spawn.range, maxWidth, maxHeight)
            }

            return { x, y }
        }

        return undefined
    }

    // Parse position from URL
    const parseUrlPosition = computed((): Position | undefined => {
        if (!workspaceData.value) return undefined

        const location = route.path
        const homeUrl = userData.value.space_settings?.homeLocationUrl

        let coords = location?.replace('@', '').split(',')

        // If no valid coords in current URL, try home location
        if (coords?.length !== 2 && homeUrl) {
            const homeLocation = homeUrl.substring(homeUrl.lastIndexOf('/') + 1)
            coords = homeLocation.replace('@', '').split(',')
        }

        if (coords?.length !== 2) return undefined

        const x = parseInt(coords[0], 10)
        const y = parseInt(coords[1], 10)

        if (Number.isNaN(x) || Number.isNaN(y)) return undefined

        return {
            x: clamp(x, 0, pixelsToGridUnits(workspaceData.value.width)),
            y: clamp(y, 0, pixelsToGridUnits(workspaceData.value.height))
        }
    })

    // Parse room ID from URL
    const parseRoomId = computed((): number | undefined => {
        const location = route.path
        const parts = location?.split('-')

        if (parts?.length !== 2 || parts[0] !== '@room_id') return undefined

        const roomId = parseInt(parts[1], 10)
        return Number.isNaN(roomId) ? undefined : roomId
    })

    // Parse object connection parameter
    const parseObjectConnectTo = computed((): string | undefined => {
        return route.query.object_connect_to as string
    })

    // Parse close_to parameter
    const parseCloseTo = computed((): string | undefined => {
        return route.query.close_to as string
    })

    // Get position resolver function
    const getPositionResolver = () => {
        const urlPosition = parseUrlPosition.value
        const fallbackPosition = generateFallbackPosition()
        const spawnPosition = parseSpawnPosition(workspaceData.value)

        return (preferredPosition?: Position): Position => {
            return preferredPosition ??
                urlPosition ??
                spawnPosition ??
                fallbackPosition
        }
    }

    // Navigate to position
    const navigateToPosition = (options: NavigateOptions) => {
        const basePath = route.matched[0]?.path || ''

        if (options.roomId != null) {
            // Navigate to room
            router.replace(`${basePath}@room_id-${options.roomId}`)
        } else if (options.x != null && options.y != null) {
            // Navigate to coordinates
            const query = options.objectId
                ? { object_connect_to: encodeURIComponent(options.objectId) }
                : undefined

            router.replace({
                path: `${basePath}@${options.x},${options.y}`,
                query
            })
        }
    }

    // Update workspace data (for demo purposes)
    const updateWorkspaceData = (data: Partial<WorkspaceData>) => {
        workspaceData.value = { ...workspaceData.value, ...data }
    }

    // Update user data (for demo purposes)
    const updateUserData = (data: Partial<UserData>) => {
        userData.value = { ...userData.value, ...data }
    }

    return {
        // Computed properties
        parseUrlPosition,
        parseRoomId,
        parseObjectConnectTo,
        parseCloseTo,

        // Methods
        getPositionResolver,
        navigateToPosition,
        generateFallbackPosition,
        parseSpawnPosition,
        pixelsToGridUnits,

        // Data management (for demo)
        workspaceData,
        userData,
        onlineUsers,
        updateWorkspaceData,
        updateUserData,

        // Utilities
        clamp,
        randomBetween,
        generateRandomPosition
    }
}
