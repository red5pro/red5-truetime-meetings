const { override } = require('customize-cra');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = override((config) => {
    if (process.env.NODE_ENV === 'production') {
        config.plugins.push(
            new WebpackObfuscator(
                {
                    rotateStringArray: true,
                    stringArray: true,
                    stringArrayEncoding: [],
                    stringArrayThreshold: 0.5,
                    deadCodeInjection: false,
                    deadCodeInjectionThreshold: 0.4,
                    unicodeEscapeSequence: false,
                    renameGlobals: false,
                    compact: true,
                    controlFlowFlattening: false,
                    controlFlowFlatteningThreshold: 0.75,
                    debugProtection: true,
                    debugProtectionInterval: 0,
                    disableConsoleOutput: true,
                    identifierNamesGenerator: 'mangled',
                    log: false,
                    numbersToExpressions: false,
                    selfDefending: true,
                    simplify: true,
                    splitStrings: false,
                    splitStringsChunkLength: 10,
                    transformObjectKeys: false,
                },
                ['**/node_modules/**/*']
            )
        );
    }

    return config;
});