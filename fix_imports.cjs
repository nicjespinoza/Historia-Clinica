const fs = require('fs');
const path = require('path');

const dirs = [
    'src/screens/doctor',
    'src/screens/patient',
    'src/screens/auth',
    'src/screens/landing',
    'src/screens/shared',
    'src/screens/cenlae'
];

// Directories that reside in src/ and need double dot access from src/screens/subdir/
const commonDirs = [
    'lib', 'components', 'context', 'schemas', 'layouts', 'hooks', 'utils', 'constants'
];

// Specific files in src/
const commonFiles = [
    'types', 'theme', 'index.css'
];

dirs.forEach(dir => {
    const fullPath = path.resolve(dir);
    if (fs.existsSync(fullPath)) {
        fs.readdirSync(fullPath).forEach(file => {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                const filePath = path.join(fullPath, file);
                let content = fs.readFileSync(filePath, 'utf8');
                let original = content;

                // Fix directories: from '../lib' -> from '../../lib'
                commonDirs.forEach(common => {
                    const regex = new RegExp(`from (['"])\\.\\.\\/${common}`, 'g');
                    content = content.replace(regex, `from $1../../${common}`);
                });

                // Fix files: from '../types' -> from '../../types'
                commonFiles.forEach(common => {
                    const regex = new RegExp(`from (['"])\\.\\.\\/${common}`, 'g');
                    content = content.replace(regex, `from $1../../${common}`);
                });

                // Fix types.ts specifically (often imported without extension)
                content = content.replace(/from (['"])\.\.\/types(['"])/g, "from $1../../types$2");


                if (content !== original) {
                    fs.writeFileSync(filePath, content);
                    console.log(`Updated ${dir}/${file}`);
                }
            }
        });
    }
});
