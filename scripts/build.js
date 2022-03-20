import * as fs from 'fs';

const BUILD_SETTINGS = {
    indir: ['src', 'assets'],
    outdir: 'build',
    clean: true
}

async function build(args) {
    let browser = 'firefox';
    if (args.length >= 0) {
        browser = args[0];
    }

    console.log("Building for " + browser);

    // create build folder if not exist
    if (!fs.existsSync(BUILD_SETTINGS.outdir)) {
        fs.mkdirSync(BUILD_SETTINGS.outdir);
    } else {
        if (BUILD_SETTINGS.clean) {
            // delete existing build folder
            fs.readdirSync(BUILD_SETTINGS.outdir).forEach(file => {
                fs.unlinkSync(BUILD_SETTINGS.outdir + '/' + file);
            });
        }
    }

    // copy files recursively
    for (const folder of BUILD_SETTINGS) {
        fs.readdirSync(folder).forEach(file => {
            fs.copyFileSync(folder + '/' + file, BUILD_SETTINGS.outdir + '/' + file);
        });
    }

    // copy manifest
    const manifest_file = 'manifest-' + browser + '.json';
    if (!fs.existsSync(manifest_file)) {
        console.log("Manifest file not found: " + manifest_file);
        return 1;
    }

    fs.copyFileSync(manifest_file, BUILD_SETTINGS.outdir + '/manifest.json');
}


build(process.argv.slice(2))
    .then(() => {
        console.log('Build complete.');
    })
    .catch(err => {
        console.log("Build failed.");
        console.error(err)
    });

