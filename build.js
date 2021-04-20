/*
    currentgaversion = "8.0.0";
*/
var propParser = require('properties-parser');
var fs = require('fs');
var path = require('path');
var AdmZip = require('adm-zip');
var headlessBuildProp = "HeadlessBuild.properties"
var headlessBuildPropPath = path.resolve(headlessBuildProp);
var buildProps = loadProperties(headlessBuildPropPath);
var spawn = require('child_process').spawn;
var os = require('os');

var projectName = readProp("project.name");

var projectLocation = __dirname;

var platforms = {
    "iphone": "iphone",
    "android": "android",
    "ipad": "ipad",
    "androidtablet": "androidtablet",
    "windowsphone81s": "windowsphone81s",
    "windowsphone10": "windowsphone10",
    spa: {
        "iphone": "iphone",
        "android": "android",
        "blackberry": "blackberry",
        "winphone": "winphone",
        "ipad": "ipad",
        "androidtablet": "androidtablet",
        "windowstablet": "windowstablet",
        hybrid: {
            "blackberry": "blackberry"
        }
    },
    "windows8.1": "windows8.1",
    "windows10": "windows10",
    "desktop_kiosk": "desktop_kiosk",
    "desktopweb": "desktopweb",
    "iphonewatch": "iphonewatch",
    "androidwearos": "androidwearos"
}

//list of plugin dependencies for build
const pluginList = function() {
    /**
     * Check whether a platform is selected for build.
     */
    function isBuildEnabled(platform) {
        return buildProps[platform] === 'true';
    }

    /**
     * find whether spa build is selected.
     */
    function isSpaBuildEnabled() {
        return Object.keys(platforms.spa).find(key => {
            if(key == 'hybrid') key += '.blackberry';
            return (buildProps['spa.'+key] === 'true');
        });
    }

    var plugins = {
        'com.pat.tool.keditor': 'Kony_Studio',
        'com.kony.mobile.fabric.client.sdk': 'MobileFabric_Client_SDK',
        'com.kony.referencearchitecture': 'Kony_Reference_Architecture'

    };

    if(os.platform() === 'darwin') {
        plugins['com.kony.studio.viz.core.mac64'] = 'Mac64_StudioViz_Core';
    } else {
        plugins['com.kony.studio.viz.core.win64'] = 'Win64_StudioViz_Core';
    }

    if(isBuildEnabled('iphone') || isBuildEnabled('ipad')) {
        plugins['com.kony.ios'] = 'iOS_Plugin';
    }

    if(isBuildEnabled('android') || isBuildEnabled('androidwearos')) {
        plugins['com.pat.android'] = 'Android';
    }

    if(isBuildEnabled('androidtablet')) {
        plugins['com.pat.tabrcandroid'] = 'Tablet_Android';
    }

    if(isBuildEnabled('universal.android')) {
        plugins['com.pat.android'] = 'Android';
        plugins['com.pat.tabrcandroid'] = 'Tablet_Android';
    }

    if(isBuildEnabled('universal.iphone')) {
        plugins['com.kony.ios'] = 'iOS_Plugin';
    }

    if(isBuildEnabled('desktopweb') || isSpaBuildEnabled()) {
        plugins['com.kony.cloudmiddleware'] = 'CloudMiddlewarePlugin';
        plugins['com.kony.cloudthirdparty'] = 'CloudThirdPartyPlugin';
        plugins['com.kony.thirdparty.jars'] = 'Third_Party_Jars_Plug-in';
        plugins['com.kony.spa'] = 'SPA';
        plugins['com.kony.desktopweb'] = 'Kony_Desktop_Web';
        plugins['com.kony.webcommons'] = 'Kony_Web_Commons';
    }

    if (os.platform() != 'darwin') {
        if (isBuildEnabled('windowsphone81s')) {
            plugins['com.kony.windowsphone8'] = 'Windows_Phone_8_Plug-in';
        }

        if (isBuildEnabled('windowsphone10') || isBuildEnabled('windows10')) {
            plugins['com.kony.windows10'] = 'Windows_10_Plug-in';
        }

        if (isBuildEnabled('windows8.1')) {
            plugins['com.kony.windows8'] = 'Windows_8.1_Plug-in';
        }

        if (isBuildEnabled('desktop_kiosk')) {
            plugins['com.kony.windows'] = 'Windows_Desktop_Plug-in';
        }
    }
    return plugins;
}();

var config = {
    projectLocation: projectLocation,
    workspace:path.dirname(projectLocation),
    projectName:projectName,
    selectedPlatforms:readProp("selectedPlatforms"),
    pluginLocation:readProp("plugin.dir")
};

function BuildException(message, exitcode) {
    this.message = message;
    this.name = 'BuildException';
    this.exitcode = exitcode;
    console.log(message);
}

function loadProperties(PropPath){
    var result = fs.readFileSync(PropPath);
    let props = propParser.parse(result);
    for(var key in props){
        if(typeof props[key] === 'string'){
            props[key] = props[key].trim();
        }
    }
    return props;
}

function readProp(propertyName){
    if(propertyName==="selectedPlatforms"){
        var platforms = getSelectedPlatforms(buildProps);
        return platforms;
    }
    else {
        var res = buildProps[propertyName];
        return res;
    }
}

function getSelectedPlatforms(props) {
    if (platforms && props) {
        var arrayOfSelectedPlatforms = filterSelectedPlats(platforms, props, '');
        if(props["universal.iphone"] !== undefined  && props["universal.iphone"] == 'true'){
            if(!(arrayOfSelectedPlatforms.indexOf("iphone") >= 0))
                arrayOfSelectedPlatforms.push("iphone");
            if(!(arrayOfSelectedPlatforms.indexOf("ipad") >= 0))
                arrayOfSelectedPlatforms.push("ipad");
        }
        if(props["universal.android"] == 'true'){
            if(!(arrayOfSelectedPlatforms.indexOf("android") >= 0))
                arrayOfSelectedPlatforms.push("android");
            if(!(arrayOfSelectedPlatforms.indexOf("androidtablet") >= 0))
                arrayOfSelectedPlatforms.push("androidtablet");
        }
        if (os.platform() == 'darwin') {
            var windowsPlatforms = ["windowsphone81s",
                "windowsphone10", "windows8.1", "windows10", "desktop_kiosk"
            ];
            windowsPlatforms.forEach(function(winplatform) {
                var index = arrayOfSelectedPlatforms.indexOf(winplatform);
                if (index > -1) {
                    console.log(`Building of platform '${winplatform}' is not supported in mac`);
                    arrayOfSelectedPlatforms.splice(index, 1);
                }
            });
        }
        if(arrayOfSelectedPlatforms.includes("iphonewatch") && !arrayOfSelectedPlatforms.includes("iphone")) {
            throw new BuildException("Platform \"iphone\" should also be selected for building iphonewatch");
        }
        return arrayOfSelectedPlatforms;
    }
}

function filterSelectedPlats(platforms, properties, parent) {
    var selectedPlatforms = [];
    if (platforms && properties) {
        let platSel;
        let platName;
        for (let plat in platforms) {
            platName = platforms[plat];
            if (typeof platName === 'string') {
                platSel = properties[parent + platName];
                if (platSel && platSel.trim() == 'true') {
                    selectedPlatforms.push(parent + platName);
                }
            } else if (typeof platName === 'object') {
                let prefix = (parent ? (parent + ".") : '') + plat +
                    ".";
                selectedPlatforms = selectedPlatforms.concat(
                    filterSelectedPlats(platName,
                        properties, prefix));
            }
        }
    }
    return selectedPlatforms;
}

function extract(sourcePath, destinationPath) {
    if (!(fs.existsSync(destinationPath))) {
        fs.mkdirSync(destinationPath);
        console.log("---- Extracting ", path.basename(sourcePath),
            "\n\tto", destinationPath);
        try {
            var unzipper = new AdmZip(sourcePath);
            unzipper.extractAllTo(destinationPath, true);
            console.log("Done.");
        } catch (e) {
            console.log(e);
            throw new BuildException(
                "Failed to extract the plugins. This can happen if the machine is running low on memory. \n" + e,
                64);
        }
        
    }
}

function copyFolders(sourcePath,destinationPath){
    var files = [];

    var targetFolder = path.join( destinationPath, path.basename( sourcePath ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }
    //copy
    if ( fs.lstatSync( sourcePath ).isDirectory() ) {
        files = fs.readdirSync( sourcePath );
        files.forEach( function ( file ) {
            var curSource = path.join( sourcePath, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolders( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

function copyFileSync( source, target ) {
    var targetFile = target;
    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function deleteFolder(folderpath){
    var deleteFolderRecursive = function(folderpath) {
        if( fs.existsSync(folderpath) ) {
            fs.readdirSync(folderpath).forEach(function(file,index){
                var curPath = path.resolve(folderpath ,file);
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                }
                else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            try{
                fs.rmdirSync(folderpath);
            }
            catch(err){
                if(err.code == 'ENOTEMPTY')
                    deleteFolderRecursive(folderpath);
            }
        }
    };
    deleteFolderRecursive(folderpath);
}

function extractPlugin(sourcePath, projectLocation){
    console.log("Extracting plugins...");
    var destinationPath = path.resolve(config.workspace, "bundles");
    if(!fs.existsSync(destinationPath)){
        console.log("bundles folder doesn't exist in workspace. extracting plugins in clean mode");
        fs.mkdirSync(destinationPath);
    }

    var versionMap = "";
        pluginVersionProps = "";
    var pluginVersionFile = "pluginversions.properties",
        pluginVersionPath = path.resolve(destinationPath, pluginVersionFile);
        if(fs.existsSync(pluginVersionPath)) {
            pluginVersionProps = loadProperties(pluginVersionPath);
        }

    var files = fs.readdirSync(sourcePath);
    files.forEach(function(file, index){
        var fromPath = path.join(sourcePath, file);
        if(path.extname(fromPath)===(".jar")){
            var fileName = path.basename(fromPath,".jar");
            var pluginId = fileName.substring(0,fileName.indexOf('_'));
            var pluginVersion = fileName.substring(fileName.indexOf('_')+1);

            if(pluginList[pluginId]) {
                versionMap = versionMap.concat("\n",
                    pluginList[pluginId], "=", pluginVersion);
                var toPath = path.join(destinationPath, pluginId);
                var pluginPath = path.resolve(config.workspace, "bundles", pluginId);
					if(pluginVersionProps[pluginList[pluginId]] !== pluginVersion) {						
						deleteFolder(pluginPath);                        
					}
				extract(fromPath, toPath);

            }
        }
    });
    fs.writeFile(pluginVersionPath, versionMap, (err) => {
        if(err) throw err;
        console.log(pluginVersionFile + ' saved to bundles folder.');
    });
}

function prebuild(){
    var pluginsToDownloadList = Object.keys(pluginList);
    var bundlesLocation = path.resolve(config.workspace,"bundles"),
        nodeExecutablePath = process.argv[0],
        args = {
            'bundlesLocation' : bundlesLocation,
            'nodeExecutablePath' : nodeExecutablePath,
            'pluginsLocation' : config.pluginLocation,
            'cleanPluginsFolder' : false,
            'pluginsToDownloadList' : pluginsToDownloadList
        },
        cmdArguments = process.argv.slice(2),
        isDownloadRequired = false,
        showHelpContent = false,
        isBuildRequired = false;

    if(cmdArguments.length) {
        var downloadIndex = getOptionIndex(cmdArguments, 'download');

        if(downloadIndex >= 0) {
            if(cmdArguments[downloadIndex + 1]) {
                args['versionNumber'] = cmdArguments[downloadIndex + 1];
                isDownloadRequired = true;
            } else {
                showHelpContent = true;
                isDownloadRequired = false;
            }
        }

        var proxyIndex = getOptionIndex(cmdArguments, 'proxy');

        if(proxyIndex >= 0) {
            if(cmdArguments[proxyIndex + 1]) {
                args['proxyParam'] = cmdArguments[proxyIndex + 1];
            } else {
                showHelpContent = true;
                isDownloadRequired = false;
            }
        }

        var downloadUrlIndex = getOptionIndex(cmdArguments, 'downloadurl');

        if(downloadUrlIndex >= 0) {
            if(cmdArguments[downloadUrlIndex + 1]) {
                args['downloadUrl'] = cmdArguments[downloadUrlIndex + 1];
            } else {
                showHelpContent = true;
                isDownloadRequired = false;
            }
        }

        var helpIndex = getOptionIndex(cmdArguments, 'help'),
            junkIndex = getOptionIndex(cmdArguments, 'misc');

        if(helpIndex >= 0 || junkIndex >= 0) {
            showHelpContent = true;
            isDownloadRequired = false;
        }
       
        var cleanIndex = getOptionIndex(cmdArguments, 'clean');

        if(cleanIndex >= 0) {
            args['cleanPluginsFolder'] = true;
            isBuildRequired = true;
            cleanBundlesFolder(bundlesLocation);
        }
    } else {
        isBuildRequired = true;
        isDownloadRequired = false;
    }

    var projectLocation = config.projectLocation;
    var projectDirectory = path.basename(projectLocation);

    if(showHelpContent) {
        printHelpContent();
    } else if(isDownloadRequired) {
        __preBuildValidation__({projectDir : projectDirectory});
        downloadPluginsandBuild(args);
    } else if(isBuildRequired) {
        __preBuildValidation__({projectDir : projectDirectory});
        extractPluginsAndBuildProject(args);
    }
}

function getOptionIndex(cmdArguments, flag) {
    var index = -1;

    switch (flag) {
        case 'clean':
            if(cmdArguments.indexOf('-c') >= 0 || 
                    cmdArguments.indexOf('-clean') >= 0 || 
                    cmdArguments.indexOf('--clean') >= 0) {
                index = 1;
            }
            break;

        case 'download':
            if(cmdArguments.indexOf('-kvv') >= 0) {
                index = cmdArguments.indexOf('-kvv'); 
            } else if(cmdArguments.indexOf('--konyvizversion') >= 0) {
                index = cmdArguments.indexOf('--konyvizversion'); 
            }
            break;

        case 'downloadurl':
            if(cmdArguments.indexOf('-u') >= 0) {
                index = cmdArguments.indexOf('-u'); 
            } else if(cmdArguments.indexOf('--downloadurl') >= 0) {
                index = cmdArguments.indexOf('--downloadurl'); 
            }
            break;

        case 'proxy':
            if(cmdArguments.indexOf('--proxy') >= 0) {
                index = cmdArguments.indexOf('--proxy'); 
            } 
            break;

        case 'help':
            if(cmdArguments.indexOf('-h') >= 0 || 
                    cmdArguments.indexOf('--help') >= 0) {
                index = 1;
            }
            break;

        case 'misc':
            // this is to print help about usage of this script.
            if(cmdArguments.indexOf('-h') < 0 && cmdArguments.indexOf('--help') < 0 && 
                cmdArguments.indexOf('-kvv') < 0 && cmdArguments.indexOf('--konyvizversion') < 0 && 
                cmdArguments.indexOf('-c') < 0 && cmdArguments.indexOf('-clean') < 0 && 
                cmdArguments.indexOf('--clean') < 0) {
                index = 1;
            }
            break;

       default:
            index = -1;
     }
     return index;
}
 
function printHelpContent() {
    var helpContent = '\nUsage: node build.js [arguments]\n\n' +  
        'arguments: \n' +
        '--help, -h                 help for build.js arguments\n' +
        '--clean, -c, -clean        cleans extracted bundles folder and extracts plugins again.\n' +
        '--konyvizversion, -kvv     To download plugins of specified Visualizer version.\n' +
        '--proxy                    Forwards request through HTTP(s) proxy server if running the \n' +
        '                           script on a restricted network. provide proxy server details \n' +
        '                           along with credentials if required.\n\n' +
        'Usage:                     node build.js --clean --konyvizversion 8.4.0 --proxy \n' +
        '                           http://user_name:password@proxy.server.com:proxy_port \n';
                
    console.log(helpContent);
}

function cleanBundlesFolder(bundlesLocation) {
    console.log("Cleaning the bundles folder...");
    deleteFolder(bundlesLocation);
    __assertDir__(bundlesLocation);
    fs.mkdirSync(bundlesLocation);
}

function __assertDir__(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    __assertDir__(dirname);
    fs.mkdirSync(dirname);
}

function __preBuildValidation__(params) {
    
    if(projectName === null || projectName === "") {
        throw new BuildException(`Set the project name in HeadlessBuild.properties`, 50);
    }

    if(projectName !== params.projectDir) {
        throw new BuildException(`ProjectName '${projectName}' 
                is not matching with project directory name '${params.projectDir}'`, 50);               
    }

    var propertyNames = ['selectedPlatforms', 'pluginLocation'];

    propertyNames.forEach(function(propertyName) {
        if (propertyName === 'selectedPlatforms' && (config[propertyName]).length <= 0) {
            throw new BuildException(
                `At least one platform needs to be selected for build, in HeadlessBuild.properties`,
                51);
        } else {
            if (config[propertyName] === null || config[propertyName] === '') {
                throw new BuildException(`Set the '${propertyName}' in HeadlessBuild.properties`, 50);
            }
        }
    });
}

function downloadPluginsandBuild(args) {
    var params = {
        'version' : args.versionNumber,
        'pluginsLocation' : args.pluginsLocation,
        'cleanPluginsFolder' : args.cleanPluginsFolder,
        'proxyParam' : args.proxyParam,
        'pluginsToDownloadList' : args.pluginsToDownloadList,
        'baseUrl' : args.downloadUrl
    };

    require('./pluginDownload').downloadKonyPlugins(params, function(result) {
         try {
            deleteFolder(path.resolve(args.pluginsLocation, '__temp'));
            
            if(result.error) {
                console.error(result.error);
            } else {
                extractPluginsAndBuildProject(args);
            }
        } catch(e) {
            console.error(e);
        }
    });
}

function extractPluginsAndBuildProject(args) {
    extractPlugin(config.pluginLocation,projectLocation);

    var installedPlugins = fs.readdirSync(args.bundlesLocation);
    var missingPlugins = Object.keys(pluginList).filter(plugin => {
        return installedPlugins.indexOf(plugin) === -1;
    });

    if(missingPlugins.length){
        throw new BuildException("missing mandatory plugins: " + missingPlugins.join(', '), 52);
    }

    var ci_platform = os.platform() === 'darwin' ? 'mac64' : 'win64',
        studioViz_plugin = "com.kony.studio.viz.core.".concat(ci_platform),
        konywebstudio = path.resolve(args.bundlesLocation, studioViz_plugin, "konywebstudio"),
        buildLocation = path.resolve(konywebstudio, "kbuild", "BuildManager.js");
    
    config['ciBuildSource'] = 'CI';

    var configString = JSON.stringify(config);

    var buildproc = spawn(args.nodeExecutablePath, [buildLocation, "console", config.workspace, "",
        "--NODE_APP_INSTANCE=ci", configString], {cwd:konywebstudio});

    buildproc.stdout.on('data' , function(data){
        console.log(data.toString());
    });
    buildproc.stderr.on('data' , function(data){
        console.log(data.toString());
    });
    buildproc.on('exit', (code) => {
        process.exit(code);
    });
}

try {
    prebuild();
} catch (e) {
    if (e instanceof BuildException) {
        process.exitCode = e.exitcode;
    } else {
        console.error(e);
        process.exitCode = 1;
    }
}
