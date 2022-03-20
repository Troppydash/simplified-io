import * as fs from 'fs';
import fse from 'fs-extra';

const BUILD_SETTINGS = {
    indir: ['src', 'assets'],
    outdir: 'build',
    clean: true,
    extensions: ['.js', '.css', '.png']
}

async function build(args) {
    let browser = 'firefox';
    if (args.length > 0) {
        browser = args[0];
    }

    console.log("Building for " + browser);

    // create build folder if not exist
    if (!fs.existsSync(BUILD_SETTINGS.outdir)) {
        fs.mkdirSync(BUILD_SETTINGS.outdir);
    } else {
        if (BUILD_SETTINGS.clean) {
            // delete existing build folder
            fs.rmSync(BUILD_SETTINGS.outdir, { recursive: true, force: true });
            fs.mkdirSync(BUILD_SETTINGS.outdir);
        }
    }

    // copy files recursively, only include files with extensions in BUILD_SETTINGS.extensions or folders
    for (const folder of BUILD_SETTINGS.indir) {
        // copy with prefix

        await fse.copy(folder, BUILD_SETTINGS.outdir + '/' + folder, {
            filter: (src, dest) => {
                if (fs.lstatSync(src).isDirectory()) {
                    return true;
                }
                let ext = src.substr(src.lastIndexOf('.'));
                return BUILD_SETTINGS.extensions.indexOf(ext) > -1;
            }
        });
    }

    // copy manifest
    const
        manifest_file = 'manifest-' + browser + '.json';
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

