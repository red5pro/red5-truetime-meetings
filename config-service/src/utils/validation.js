export const validThemes = ['blue', 'black'];
export const validBooleans = ['true', 'false'];

export const validateConfig = (config) => {
    const errors = [];

    // Validate URLs
    if (config.VITE_TURN_SERVER_URL !== undefined && config.VITE_TURN_SERVER_URL !== '') {
        if (!config.VITE_TURN_SERVER_URL.match(/^(turn:|turns:|stun:)/)) {
            errors.push('VITE_TURN_SERVER_URL must start with turn:, turns: or stun:');
        }
    }

    // Validate boolean fields
    if (
        config.VITE_ENABLE_RECORDING !== undefined &&
        !validBooleans.includes(config.VITE_ENABLE_RECORDING)
    ) {
        errors.push('VITE_ENABLE_RECORDING must be "true" or "false"');
    }

    if (
        config.VITE_ENABLE_CLOSED_CAPTION !== undefined &&
        !validBooleans.includes(config.VITE_ENABLE_CLOSED_CAPTION)
    ) {
        errors.push('VITE_ENABLE_CLOSED_CAPTION must be "true" or "false"');
    }

    if (
        config.VITE_ENABLE_EXTERNAL_STREAMS !== undefined &&
        !validBooleans.includes(config.VITE_ENABLE_EXTERNAL_STREAMS)
    ) {
        errors.push('VITE_ENABLE_EXTERNAL_STREAMS must be "true" or "false"');
    }

    // Validate theme
    if (config.VITE_DEFAULT_THEME !== undefined && !validThemes.includes(config.VITE_DEFAULT_THEME)) {
        errors.push(`VITE_DEFAULT_THEME must be one of: ${validThemes.join(', ')}`);
    }

    return errors;
};
