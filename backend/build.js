const esbuild = require('esbuild');
const fs = require('fs-extra');
const JavaScriptObfuscator = require('javascript-obfuscator');
const path = require('path');

async function build() {
    console.log('🧹 Cleaning dist...');
    await fs.remove('dist');

    console.log('📦 Bundling with esbuild...');
    await esbuild.build({
        entryPoints: ['src/server.js'],
        bundle: true,
        platform: 'node',
        target: 'node16',
        outfile: 'dist/server.js',
        external: [
            // Exclude dependencies (node_modules)
            'express', 'sequelize', 'sqlite3', 'pg', 'pg-hstore', 'cors', 'helmet',
            'morgan', 'jsonwebtoken', 'bcrypt', 'axios', 'dotenv', 'swagger-ui-express',
            'dockerode', 'rotating-file-stream', 'express-custom-error', 'mandatoryenv',
            'cookie-parser', 'http-proxy-middleware', 'jws', 'cheerio', 'has-keys',
            'module-alias', 'mariadb', 'swagger-autogen'
            // Add other dependencies here if needed, or use a regex/glob
        ],
        // Ideally, we just mark all dependencies as external
        packages: 'external',
    });

    console.log('🔒 Obfuscating...');
    const distPath = path.join(__dirname, 'dist', 'server.js');
    const code = await fs.readFile(distPath, 'utf8');

    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        debugProtection: true, // Be careful with this in production if you need logs
        disableConsoleOutput: false, // Keep logs for now to debug
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['rc4'],
        target: 'node'
    });

    await fs.writeFile(distPath, obfuscationResult.getObfuscatedCode());

    // Copy necessary files
    console.log('📂 Copying assets...');
    // Copy swagger output if it exists
    if (await fs.pathExists('swagger_output.json')) {
        await fs.copy('swagger_output.json', 'dist/swagger_output.json');
    }
    // Copy .env example or similar if needed. We assume .env is on the server.

    console.log('✅ Build complete!');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
