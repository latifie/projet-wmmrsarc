const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist', 'assets');

if (!fs.existsSync(distDir)) {
    console.error('Dist directory not found!');
    process.exit(1);
}

const files = fs.readdirSync(distDir);

files.forEach(file => {
    if (file.endsWith('.js')) {
        const filePath = path.join(distDir, file);
        console.log(`Obfuscating ${file}...`);

        const code = fs.readFileSync(filePath, 'utf8');
        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
            compact: true,
            controlFlowFlattening: true,
            deadCodeInjection: true,
            debugProtection: false, // Avoid breaking app if console is open
            disableConsoleOutput: true,
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
            target: 'browser'
        });

        fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
    }
});

console.log('Frontend obfuscation complete.');
