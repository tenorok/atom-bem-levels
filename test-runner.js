// copypaste: https://github.com/BinaryMuse/atom-mocha-test-runner/issues/5#issuecomment-242029380

const fs = require('fs-plus');
const path = require('path');
const createRunner = require('atom-mocha-test-runner').createRunner;
const extraOptions = {
    globalAtom: true
};

function optionalConfigurationFunction(mocha) {
    let packageName = require('./package.json').name;
    let packagesDir = atom.packages.getPackageDirPaths().find((path) => {
        return path.endsWith('/dev/packages');
    });
    fs.makeTreeSync(packagesDir);
    try {
        fs.symlinkSync(__dirname, path.join(packagesDir, packageName), 'junction');
    } catch (err) {
        console.log(err);
    }
}

module.exports = createRunner(extraOptions, optionalConfigurationFunction);
