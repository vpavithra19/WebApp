var fs = require('fs');
var path = require('path');
var AdmZip = require('adm-zip');
var spawn = require('child_process').spawn;
var os = require('os');
var projectLocation = __dirname;

//list of plugin dependencies for preview package
var pluginList = function() {
    var plugins = {
        'com.pat.tool.keditor': 'Kony_Studio',
        'com.kony.mobile.fabric.client.sdk': 'MobileFabric_Client_SDK'
    };

    if(os.platform() === 'darwin') {
        plugins['com.kony.studio.viz.core.mac64'] = 'Mac64_StudioViz_Core';
    } else {
        plugins['com.kony.studio.viz.core.win64'] = 'Win64_StudioViz_Core';
    }

    return plugins;
}();

var config = {
    projectLocation     :   projectLocation,
    workspace           :   path.dirname(projectLocation),
    projectName         :   path.basename(projectLocation)
};

function PackageException(message, exitcode) {
    this.message = message;
    this.name = 'PackageException';
    this.exitcode = exitcode;
    console.log(message);
}

function prePackage() {
    var bundlesLocation = path.resolve(config.workspace, "bundles"),
        nodeExecutablePath = process.argv[0],
        args = {
            'bundlesLocation' : bundlesLocation,
            'nodeExecutablePath' : nodeExecutablePath
        },
        cmdArguments = process.argv.slice(2);

    if(cmdArguments.length >= 3) {
       args['childAppZipPath'] = cmdArguments[0];
       args['pluginsLocation'] = cmdArguments[1];
       args['selectedPlatforms'] = cmdArguments[2];
    } else {
        throw new PackageException(`Invalid arguments`, 60);
    }

    __prePackageValidation__(args);
    __patchAppViewerShellApp__(args);
}

function __prePackageValidation__(args) {

    if(!fs.existsSync(path.resolve(args.childAppZipPath))) {
        throw new PackageException(`${args.childAppZipPath} file not found.`, 50);
    }

    if(!fs.existsSync(path.resolve(args.pluginsLocation))) {
        throw new PackageException(`${args.pluginsLocation} folder not found.`, 50);
    }

    if(!args.selectedPlatforms) {
        throw new PackageException(`${args.selectedPlatforms} is empty.`, 50);   
    }
}

function extract(sourcePath, destinationPath) {
    if (!(fs.existsSync(destinationPath))) {
        fs.mkdirSync(destinationPath);
        console.log(`---- Extracting, ${path.basename(sourcePath)}, \n\tto, ${destinationPath}`);

        try {
            var unzipper = new AdmZip(sourcePath);
            unzipper.extractAllTo(destinationPath, true);
            console.log("Done.");
        } catch (e) {
            console.log(e);
            throw new PackageException(
                "Failed to extract the plugins. This can happen if the machine is running low on memory. \n" + e,
                64);
        }
    } else {
        console.log(`Skiping plugin extract to ${destinationPath}`);
    }
}

function extractPlugin(sourcePath, destinationPath) {
    console.log("Extracting plugins...");

    return new Promise((resolve, reject) => {
        if(!fs.existsSync(destinationPath)) {
            console.log("bundles folder doesn't exist in workspace. extracting plugins in clean mode");
            fs.mkdirSync(destinationPath);
        }

        var pluginVersionInfo = "";
        var pluginVersionsFile = "pluginversions.properties",
            pluginVersionsFilePath = path.resolve(destinationPath, pluginVersionsFile);

        var files = fs.readdirSync(sourcePath);

        files.forEach((file) => {
            var fromPath = path.join(sourcePath, file);
            if(path.extname(fromPath) === ".jar") {
                var fileName = path.basename(fromPath, ".jar");
                var pluginId = fileName.substring(0, fileName.indexOf('_'));
                var pluginVersion = fileName.substring(fileName.indexOf('_')+1);

                if(pluginList[pluginId]) {
                    pluginVersionInfo = pluginVersionInfo.concat("\n",
                        pluginList[pluginId], "=", pluginVersion);
                    var toPath = path.join(destinationPath, pluginId);
                    extract(fromPath, toPath);
                }
            }
        });

        fs.writeFile(pluginVersionsFilePath, pluginVersionInfo, (err) => {
            if(err) {
                return reject(err);
            }

            console.log(pluginVersionsFilePath + ' saved to bundles folder.');
            resolve();
        });
    });
}

/**
 * Merge child app artifacts to shell app to generate combined App Viewer App.
 * @args {object} args Additional information
 *      args = {
 *          childAppZipPath     : {string}
 *          pluginsLocation     : {string}
 *          selectedPlatforms   : {string} //comma separated selected platform names. 
 *      }
 * @private
 */

async function __patchAppViewerShellApp__(args) {
    try {
        // Extract required plugin to run app viewer package script.
        await extractPlugin(args.pluginsLocation, args.bundlesLocation); // most probably we don't need this.
        
        var installedPlugins = fs.readdirSync(args.bundlesLocation);
        var missingPlugins = Object.keys(pluginList).filter(plugin => {
                return !installedPlugins.includes(plugin);
            });

        if(missingPlugins.length){
            throw new PackageException("missing mandatory plugins: " + missingPlugins.join(', '), 52);
        }

        config['childAppZipPath'] = args.childAppZipPath;
        config['selectedPlatforms'] = args.selectedPlatforms
            .split(",")
            .map((item) => {
                return item.trim();
            });

        var ci_platform = os.platform() === 'darwin' ? 'mac64' : 'win64',
            studioViz_plugin = "com.kony.studio.viz.core.".concat(ci_platform),
            konywebstudio = path.resolve(args.bundlesLocation, studioViz_plugin, "konywebstudio"),
            appViewerPackageScriptPath = path.resolve(konywebstudio, "kbuild", "appviewerpackage", "appViewerPackageManager.js"),
            configString = JSON.stringify(config);

        var packageProcess = spawn(args.nodeExecutablePath, [appViewerPackageScriptPath, "console", config.workspace, "",
            "--NODE_APP_INSTANCE=ci", configString], {cwd:konywebstudio});

        packageProcess.stdout.on('data' , (data) => {
            console.log('Process on' + data.toString());
        });

        packageProcess.stderr.on('data' , (data) => {
            console.error(data.toString());
        });

        packageProcess.on('exit', (code) => {
            process.exit(code);
        });
    } catch(e) {
        console.error(e);
    }
}

try {
    prePackage();
} catch (e) {
    if (e instanceof PackageException) {
        process.exitCode = e.exitcode;
    } else {
        console.error(e);
        process.exitCode = 1;
    }
}