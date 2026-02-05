/**
 * Float a number of things up on a page (hearts, flowers, 👌 ...)
 * <br>
 * You give the options in an object.
 *
 * @module floating
 * @param {string} [options.content='👌']
 *   the character or string to float
 * @param {number} [options.number=1]
 *   the number of items
 * @param {number} [options.duration=10]
 *   the amount of seconds it takes to float up
 * @param {number|string} [options.repeat='infinite']
 *   the number of times you want the animation to repeat
 * @param {string} [options.direction='normal']
 *   The <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/animation-direction">
 *   animation-direction</a> of the main animation
 * @param {number|array} [options.size=2]
 *   The size (in em) of each element. Giving two values in an array will
 *   give a random size between those values.
 */
interface FloatingOptions {
    content?: string;
    number?: number;
    duration?: number;
    repeat?: number | string;
    direction?: string;
    size?: number | [number, number];
}

const STYLE_ID = 'floating-style';
const ANIMATION_KEYFRAMES = 201;

export default function floating(
    {
        content = '👌',
        number = 1,
        duration = 10,
        repeat = 'infinite',
        direction = 'normal',
        size = 2,
    }: FloatingOptions = {}
): () => void {
    // Initialize styles if not already present
    initializeStyles();

    // Create container for floating elements
    const container = createContainer();

    // Create and append floating elements
    for (let i = 0; i < number; i++) {
        const floater = createFloater({
            content,
            size: getRandomSize(size),
            duration,
            delay: i * Math.random(),
            repeat,
            direction,
        });

        container.appendChild(floater);
    }

    document.body.appendChild(container);

    // Return cleanup function
    return () => {
        container.remove();
    };
}

/**
 * Initialize or update the global styles for floating animations
 */
function initializeStyles(): void {
    let styleElement = document.getElementById(STYLE_ID) as HTMLStyleElement;

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = STYLE_ID;
        document.head.appendChild(styleElement);
    }

    if (!styleElement.innerHTML) {
        styleElement.innerHTML = generateStyles();
    }
}

/**
 * Generate CSS styles for the floating animation
 */
function generateStyles(): string {
    const keyframes = generateKeyframes();

    return `
        .float-container {
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 9999;
        }

        .float-container div {
            width: 1em;
            height: 1em;
        }

        @keyframes float {
            ${keyframes}
        }
    `;
}

/**
 * Generate keyframe steps for the floating animation
 */
function generateKeyframes(): string {
    return Array.from({ length: ANIMATION_KEYFRAMES + 1 }, (_, index) => {
        const percent = (index * 100) / ANIMATION_KEYFRAMES;
        const verticalPosition = 110 + index * (-120 / ANIMATION_KEYFRAMES);

        return `${percent}% {
            transform: translate(2vw, ${verticalPosition}vh);
        }`;
    }).join('\n');
}

/**
 * Create the container element for floating items
 */
function createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'float-container';
    return container;
}

/**
 * Get a random size within the specified range
 */
function getRandomSize(size: number | [number, number]): number {
    if (Array.isArray(size)) {
        const [min, max] = size;
        return Math.random() * (max - min) + min;
    }
    return size;
}

interface FloaterConfig {
    content: string;
    size: number;
    duration: number;
    delay: number;
    repeat: number | string;
    direction: string;
}

/**
 * Create a single floating element
 */
function createFloater(config: FloaterConfig): HTMLDivElement {
    const { content, size, duration, delay, repeat, direction } = config;

    const floater = document.createElement('div');
    floater.innerHTML = content;

    const horizontalStart = Math.random() * 100;

    floater.style.cssText = `
        position: absolute;
        left: 0;
        font-size: ${size}em;
        transform: translateY(110vh);
        animation: 
            float
            ${duration}s
            linear
            ${delay}s
            ${repeat}
            ${direction};
            margin-left: ${Math.random() * 100}px;\`;
    `;

    // Clean up element after animation completes (if not infinite)
    if (repeat !== 'infinite') {
        floater.addEventListener('animationend', (e: AnimationEvent) => {
            if (e.animationName === 'float') {
                floater.remove();
            }
        });
    }

    return floater;
}