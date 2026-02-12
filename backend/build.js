const esbuild = require('esbuild');
const fs = require('fs-extra');
const JavaScriptObfuscator = require('javascript-obfuscator');
const path = require('path');

async function build() {
    console.log('📄 Generating Swagger documentation...');
    const { execSync } = require('child_process');
    try {
        execSync('npm run doc', { stdio: 'inherit' });
    } catch (e) {
        console.warn('Warning: Failed to generate documentation', e.message);
    }

    console.log('🏗️  Building Frontend...');
    try {
        const frontendPath = path.join(__dirname, '../frontend');
        if (fs.existsSync(frontendPath)) {
            console.log('   Installing frontend dependencies...');
            execSync('npm install', { cwd: frontendPath, stdio: 'inherit' });
            console.log('   Running frontend build...');
            execSync('npm run build', { cwd: frontendPath, stdio: 'inherit' });
        } else {
            console.warn('⚠️  Frontend directory not found at ../frontend');
        }
    } catch (e) {
        console.error('❌ Frontend build failed:', e.message);
        process.exit(1);
    }
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

    // Copy frontend build to dist/frontend
    const frontendDist = path.join(__dirname, '../frontend/dist');
    if (await fs.pathExists(frontendDist)) {
        console.log('📂 Copying frontend assets to dist/frontend...');
        await fs.copy(frontendDist, 'dist/frontend');
    } else {
        console.warn('⚠️  Frontend build not found to copy.');
    }
    // Copy .env example or similar if needed. We assume .env is on the server.

    console.log('✅ Build complete!');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
