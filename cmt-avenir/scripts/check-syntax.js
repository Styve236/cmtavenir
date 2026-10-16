'use strict';

/**
 * Vérification de la syntaxe de tous les fichiers JavaScript du projet.
 *   npm run lint
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const IGNORED_DIRS = ['node_modules', '.git', '.firebase', 'public\\images', 'public/images'];

function walk(dir, files) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const relative = path.relative(ROOT, full);

        if (entry.isDirectory()) {
            if (IGNORED_DIRS.some(ignored => relative.split(path.sep).includes(ignored) || relative === ignored)) continue;
            walk(full, files);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(full);
        }
    }
    return files;
}

const files = walk(ROOT, []).filter(file => !file.includes('node_modules'));
let errors = 0;

for (const file of files) {
    try {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
        errors++;
        console.error('✗ ' + path.relative(ROOT, file));
        console.error(String(err.stderr || err.message).trim());
    }
}

console.log('');
if (errors === 0) {
    console.log('✓ Syntaxe vérifiée : ' + files.length + ' fichiers JavaScript, aucune erreur.');
} else {
    console.error('✗ ' + errors + ' fichier(s) en erreur sur ' + files.length + '.');
    process.exit(1);
}
