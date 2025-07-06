import { ref } from 'vue'

// Types
interface ResizeOptions {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
    maintainAspectRatio?: boolean
}

interface ImageInfo {
    width: number
    height: number
    size: number
    type: string
    aspectRatio: number
}

interface ProcessingResult {
    blob: Blob
    dataUrl: string
    info: ImageInfo
}

// Image processing function from original code
const resizeImageBitmap = async (file: File): Promise<ImageBitmap> => {
    // Calculate resize factor based on original algorithm
    const scaleFactor = Math.round(Math.sqrt(file.size) / Math.sqrt(28800) * 10) / 10

    const resizeOptions = scaleFactor > 0 ? {
        resizeHeight: file.size / scaleFactor,
        resizeWidth: file.size / scaleFactor
    } : undefined

    return createImageBitmap(file, resizeOptions)
}

// Main composable
export const useImageProcessor = () => {
    const isProcessing = ref(false)
    const error = ref<string | null>(null)

    // Methods
    const getImageInfo = (file: File): Promise<ImageInfo> => {
        return new Promise((resolve, reject) => {
            const img = new Image()

            img.onload = () => {
                resolve({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    size: file.size,
                    type: file.type,
                    aspectRatio: img.naturalWidth / img.naturalHeight
                })
            }

            img.onerror = () => {
                reject(new Error('Failed to load image'))
            }

            img.src = URL.createObjectURL(file)
        })
    }

    const calculateOptimalSize = (
        originalWidth: number,
        originalHeight: number,
        maxWidth: number = 1920,
        maxHeight: number = 1080
    ): { width: number; height: number; scale: number } => {
        const aspectRatio = originalWidth / originalHeight

        let newWidth = originalWidth
        let newHeight = originalHeight

        // Scale down if too large
        if (newWidth > maxWidth) {
            newWidth = maxWidth
            newHeight = newWidth / aspectRatio
        }

        if (newHeight > maxHeight) {
            newHeight = maxHeight
            newWidth = newHeight * aspectRatio
        }

        const scale = newWidth / originalWidth

        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
            scale
        }
    }

    const resizeImage = async (
        file: File,
        options: ResizeOptions = {}
    ): Promise<ProcessingResult> => {
        isProcessing.value = true
        error.value = null

        try {
            const {
                maxWidth = 1920,
                maxHeight = 1080,
                quality = 0.8,
                format = 'jpeg',
                // maintainAspectRatio = true
            } = options

            const originalInfo = await getImageInfo(file)

            // Calculate optimal size
            const { width, height } = calculateOptimalSize(
                originalInfo.width,
                originalInfo.height,
                maxWidth,
                maxHeight
            )

            // Create canvas for resizing
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                throw new Error('Failed to get canvas context')
            }

            canvas.width = width
            canvas.height = height

            // Create image bitmap using the original algorithm
            const imageBitmap = await resizeImageBitmap(file)

            // Draw resized image
            ctx.drawImage(imageBitmap, 0, 0, width, height)

            // Convert to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                    (result) => {
                        if (result) {
                            resolve(result)
                        } else {
                            reject(new Error('Failed to create blob'))
                        }
                    },
                    `image/${format}`,
                    quality
                )
            })

            // Create data URL
            const dataUrl = canvas.toDataURL(`image/${format}`, quality)

            // Create result info
            const info: ImageInfo = {
                width,
                height,
                size: blob.size,
                type: blob.type,
                aspectRatio: width / height
            }

            return {
                blob,
                dataUrl,
                info
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to process image'
            throw err
        } finally {
            isProcessing.value = false
        }
    }

    const compressImage = async (
        file: File,
        targetSizeKB: number = 500
    ): Promise<ProcessingResult> => {
        let quality = 0.9
        let result: ProcessingResult

        do {
            result = await resizeImage(file, { quality, format: 'jpeg' })
            quality -= 0.1
        } while (result.info.size > targetSizeKB * 1024 && quality > 0.1)

        return result
    }

    const cropImage = async (
        file: File,
        cropArea: { x: number; y: number; width: number; height: number }
    ): Promise<ProcessingResult> => {
        isProcessing.value = true
        error.value = null

        try {
            // const originalInfo = await getImageInfo(file)

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                throw new Error('Failed to get canvas context')
            }

            canvas.width = cropArea.width
            canvas.height = cropArea.height

            const img = new Image()

            return new Promise((resolve, reject) => {
                img.onload = async () => {
                    // Draw cropped area
                    ctx.drawImage(
                        img,
                        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                        0, 0, cropArea.width, cropArea.height
                    )

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
                                const info: ImageInfo = {
                                    width: cropArea.width,
                                    height: cropArea.height,
                                    size: blob.size,
                                    type: blob.type,
                                    aspectRatio: cropArea.width / cropArea.height
                                }

                                resolve({ blob, dataUrl, info })
                            } else {
                                reject(new Error('Failed to create cropped image'))
                            }
                        },
                        'image/jpeg',
                        0.8
                    )
                }

                img.onerror = () => {
                    reject(new Error('Failed to load image for cropping'))
                }

                img.src = URL.createObjectURL(file)
            })
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to crop image'
            throw err
        } finally {
            isProcessing.value = false
        }
    }

    const convertFormat = async (
        file: File,
        targetFormat: 'jpeg' | 'png' | 'webp',
        quality: number = 0.8
    ): Promise<ProcessingResult> => {
        return resizeImage(file, { format: targetFormat, quality })
    }

    const createThumbnail = async (
        file: File,
        size: number = 150
    ): Promise<ProcessingResult> => {
        return resizeImage(file, {
            maxWidth: size,
            maxHeight: size,
            quality: 0.7,
            format: 'jpeg'
        })
    }

    const validateImageFile = (file: File): boolean => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        const maxSize = 10 * 1024 * 1024 // 10MB

        if (!validTypes.includes(file.type)) {
            error.value = 'Unsupported file type'
            return false
        }

        if (file.size > maxSize) {
            error.value = 'File size too large'
            return false
        }

        return true
    }

    const batchProcess = async (
        files: File[],
        options: ResizeOptions = {}
    ): Promise<ProcessingResult[]> => {
        const results: ProcessingResult[] = []

        for (const file of files) {
            if (validateImageFile(file)) {
                try {
                    const result = await resizeImage(file, options)
                    results.push(result)
                } catch (err) {
                    console.error(`Failed to process ${file.name}:`, err)
                }
            }
        }

        return results
    }

    const downloadImage = (result: ProcessingResult, filename: string) => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(result.blob)
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
    }

    return {
        // State
        isProcessing,
        error,

        // Methods
        getImageInfo,
        calculateOptimalSize,
        resizeImage,
        compressImage,
        cropImage,
        convertFormat,
        createThumbnail,
        validateImageFile,
        batchProcess,
        downloadImage,

        // Original algorithm
        resizeImageBitmap
    }
}
