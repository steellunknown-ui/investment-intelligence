const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(__dirname, '..', 'app'),
    path.join(__dirname, '..', 'components')
];

const replacements = [
    { from: /bg-white dark:bg-slate-800/g, to: 'bg-card' },
    { from: /bg-slate-50 dark:bg-slate-900/g, to: 'bg-background' },
    { from: /border-slate-200 dark:border-slate-700/g, to: 'border-border' },
    { from: /border-slate-200 dark:border-slate-800/g, to: 'border-border' },
    { from: /border-slate-100 dark:border-slate-800/g, to: 'border-border' },
    { from: /border-slate-100 dark:border-slate-700/g, to: 'border-border' },
    { from: /text-slate-900 dark:text-white/g, to: 'text-foreground' },
    { from: /text-slate-600 dark:text-slate-400/g, to: 'text-muted-foreground' },
    { from: /text-slate-500 dark:text-slate-400/g, to: 'text-muted-foreground' }
];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

async function run() {
    let touchedCount = 0;
    let replacementCount = 0;

    targetDirs.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        const files = getAllFiles(dir);

        files.forEach(filePath => {
            let content = fs.readFileSync(filePath, 'utf8');
            let original = content;

            replacements.forEach(rep => {
                const matches = content.match(rep.from);
                if (matches) {
                    replacementCount += matches.length;
                    content = content.replace(rep.from, rep.to);
                }
            });

            if (content !== original) {
                fs.writeFileSync(filePath, content, 'utf8');
                touchedCount++;
                console.log(`Updated: ${path.relative(path.join(__dirname, '..'), filePath)}`);
            }
        });
    });

    console.log(`Total files updated: ${touchedCount}`);
    console.log(`Total replacements made: ${replacementCount}`);
}

run();
