import {LayoutDimensions} from "./types.ts";

/**
 * Calculate optimal layout dimensions for tiled video grid
 * @param containerWidth - Available container width
 * @param containerHeight - Available container height
 * @param videoCount - Number of videos to display
 * @param aspectRatio - Video aspect ratio (width/height)
 * @returns Layout configuration with dimensions and grid info
 */
export const calculateOptimalLayout = (
    containerWidth: number,
    containerHeight: number,
    videoCount: number,
    aspectRatio: number
): LayoutDimensions => {
    let bestLayout: LayoutDimensions = {
        area: 0,
        cols: 0,
        rows: 0,
        width: 0,
        height: 0
    }

    // Try different column configurations to find optimal layout
    for (let cols = 1; cols <= videoCount; cols++) {
        const rows = Math.ceil(videoCount / cols)
        const hScale = containerWidth / (cols * aspectRatio)
        const vScale = containerHeight / rows

        let width: number, height: number

        // Choose scaling based on container constraints
        if (hScale <= vScale) {
            width = Math.floor(containerWidth / cols)
            height = Math.floor(width / aspectRatio)
        } else {
            height = Math.floor(containerHeight / rows)
            width = Math.floor(height * aspectRatio)
        }

        const area = width * height
        if (area > bestLayout.area) {
            bestLayout = { area, width, height, rows, cols }
        }
    }

    return bestLayout
}