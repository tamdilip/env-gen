#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const optionalArgs = process.argv.slice(2);
const isSilentModeEnabled = optionalArgs.includes('--silent');
isSilentModeEnabled && (console.log = () => { });

const PWD = process.cwd();
let _config = { exclude: ['/node_modules', '/coverage'] };

if (fs.existsSync(PWD + '/env-gen-config.js')) {
    const { exclude = [] } = require(PWD + '/env-gen-config.js');
    _config.exclude.push(...exclude);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let envGenPath = PWD + '/';
let envScanPath = PWD + '/';
let envFound = [];

rl.on('close', function () {
    !!envFound.length && console.log(`\n.env created under ${envGenPath} !!`);
    process.exit(0);
});

const ask = (ques, def = '') => new Promise(res => {
    if (isSilentModeEnabled)
        res(def);
    else
        rl.question(def ? `${ques} (Y to set default: ${def}):` : ques, ans => {
            res(def && (ans === '' || ans.toLowerCase() == 'y') ? def : ans);
        });
});

let totalScannedFiles = 0;
const getAllEnvProps = function (dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (!_config?.exclude?.map(e => path.normalize(PWD + e)).includes(path.normalize(dirPath))) {
            if (fs.statSync(dirPath + '/' + file).isDirectory()) {
                arrayOfFiles = getAllEnvProps(dirPath + '/' + file, arrayOfFiles);
            } else {
                if (path.extname(file) == '.js') {
                    const fileContent = fs.readFileSync(path.join(dirPath, '/', file), { encoding: 'utf8', flag: 'r' });
                    const envsExtracted = fileContent.match(/process.env.\w*/g)?.map(e => e.replace('process.env.', '')).filter(Boolean);
                    envsExtracted?.length && arrayOfFiles.push(envsExtracted);
                    totalScannedFiles++;
                }
            }
        }
    })
    return [...new Set(arrayOfFiles.flat())];
};

(async () => {
    envScanPath = await ask(`Path to scan files for process.env.* properties references `, envScanPath);
    console.log(`Excluded file paths - ${_config?.exclude} !!`);
    envFound = getAllEnvProps(envScanPath);
    console.log(`Total ${envFound.length} env properties references on scanning ${totalScannedFiles} .js files found under ${envScanPath} path !!`);

    if (envFound.length > 0) {
        const isManualPopulate = await ask(`Do you want to continue assigning values for env props(Y / N) ? `);
        let envs = [];
        for (const envKey of envFound) {
            const envValue = isManualPopulate.toLowerCase() === 'y' ? await ask(`${envKey}=`) : '';
            envs.push(`${envKey}=${envValue}\n`);
        }

        envGenPath = await ask(`Path to place .env ?`, envGenPath);

        fs.mkdirSync(envGenPath, { recursive: true });
        fs.writeFileSync(`${envGenPath}/.env`, envs.join(''));
    }
    rl.close();
})()