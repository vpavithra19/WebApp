let fs = require('fs'),
    path = require('path'),
    archiver = require('archiver'),
    minimist = require('minimist');

let projectLocation = __dirname;

const COMMON_DIR = "Common";
const TEST_RESOURCES_DIR = "testresources";
const JASMINE_DIR = "Jasmine";

function __assertDir__(filePath) {
    let dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    __assertDir__(dirname);
    fs.mkdirSync(dirname);
}

function __readdirSync__(dirPath) {
    let entries = fs.readdirSync(dirPath);

    return entries.filter(f => !f.startsWith("."));
}

function __rmDirRecursively__(dirPath) {
    __assertDir__(dirPath);
    
    let entries = fs.readdirSync(dirPath);
    entries.map(function(f) {
        let p = path.resolve(dirPath, f),
            stat = fs.statSync(p);
        
        if (stat.isDirectory()) {
            __rmDirRecursively__(p);
        } else if(stat.isFile()) {
            fs.unlinkSync(p);
        }
    });

    fs.rmdirSync(dirPath);
}

function __copyFile__(fromFilePath, toFilePath, doNotCopyFileIfExists) {

    if(!(doNotCopyFileIfExists && fs.existsSync(toFilePath))) {
        __assertDir__(toFilePath);
        
        fs.writeFileSync(
            toFilePath,
            fs.readFileSync(fromFilePath, {encoding:null})
        );
    }
}

function __copyDir__(fromDirPath, toDirPath, doNotCopyFileIfExists) {
    __assertDir__(toDirPath);

    let entries = __readdirSync__(fromDirPath);
    entries.forEach(function (entry) {
        let stat = fs.statSync(path.resolve(fromDirPath, entry));

        if (stat.isFile()) {
            __copyFile__(
                path.resolve(fromDirPath, entry),
                path.resolve(toDirPath, entry),
                doNotCopyFileIfExists
            );
        } else if (stat.isDirectory()) {
            __copyDir__(
                path.resolve(fromDirPath, entry),
                path.resolve(toDirPath, entry),
                doNotCopyFileIfExists
            ); 
        }
    });
}

function __zipDirectory__(sourceDir, destDir, outputFileName, iszip, callback) {
    let writtenBytes = 0,
        output = fs.createWriteStream(path.join(destDir, outputFileName)),
        archive = iszip ? archiver('zip') : archiver('tar');

    output.on('close', function() {
        console.debug("Completed archiving :: " + path.join(destDir, outputFileName));

        writtenBytes = archive.pointer();
        console.debug('Bytes written :: ', writtenBytes);

        if(typeof callback === "function"){
            callback(null, writtenBytes);
        }
    });

    archive.on('error', function(err) {
        console.error("Archiver error ::", err);
        throw err;
    });

    archive.pipe(output);

    let done = function(err) {
        if (err) {
            console.error("Archiver error ::", err);
        } else{
            archive.finalize(function(err) {
                if (err) {
                    throw err;
                }
            });
        }
    };

    try {
        console.debug(`Starting archiving [${iszip ? '.zip' : '.tar'}] :: ${path.join(destDir, outputFileName)}`);
    
        archive.directory(sourceDir, '');
    } catch(e) {
        done(e);
    } finally {
        done();
    }
}

function __generateJasmineArtifacts__(outputDirPath) {
    console.info('Starting generation of Jasmine Test Artifacts');

    let pathToJasmineScriptsInProject = path.resolve(projectLocation, TEST_RESOURCES_DIR, JASMINE_DIR);

    try {
        //clearing the folder if already present
        __rmDirRecursively__(outputDirPath);
    } catch(e) {
        //do nothing since the only error here could be missing folder
    }

    __assertDir__(outputDirPath);

    __copyDir__(pathToJasmineScriptsInProject, outputDirPath);

    let dirEntries = __readdirSync__(outputDirPath),
        pathToCommonDir = path.resolve(outputDirPath, COMMON_DIR),
        promisesForZipping = [],
        archiveName = "automationScripts",
        zipext = ".zip",
        tarext = ".tar";

    dirEntries.forEach(function(dirName) {
        if(dirName !== COMMON_DIR) { //channel dir
            promisesForZipping.push(new Promise(function(resolve, reject) {

                let dirPath = path.resolve(outputDirPath, dirName);

                //merge "Common" contents into each channel dir
                __copyDir__(pathToCommonDir, dirPath, true);

                let promisesForZippingInChannel = [];

                promisesForZippingInChannel.push(new Promise(function(resolve, reject) {
                    //zip each channel contents
                    __zipDirectory__(dirPath, outputDirPath, dirName + zipext, true, function(errmsg, writtenbytes) {
                        if(writtenbytes > 0) {
                            console.info(`Archiving [.zip] of scripts under '${dirName}' channel completed successfully.`);
                            resolve();
                        } else if(errmsg) {
                            reject(errmsg);
                        } else {
                            reject('Unknown error occured during compression of ' + dirPath);
                        }
                    });
                }));

                promisesForZippingInChannel.push(new Promise(function(resolve, reject) {
                    //zip (as tar) each channel contents
                    __zipDirectory__(dirPath, outputDirPath, dirName + tarext, false, function(errmsg, writtenbytes) {
                        if(writtenbytes > 0) {
                            console.info(`Archiving [.tar] of scripts under '${dirName}' channel completed successfully.`);
                            resolve();
                        } else if(errmsg) {
                            reject(errmsg);
                        } else {
                            reject('Unknown error occured during compression of ' + dirPath);
                        }
                    });
                }));

                Promise
                    .all(promisesForZippingInChannel)
                    .then(function() {
                        //moving files
                        fs.renameSync(path.resolve(outputDirPath, dirName + zipext), path.resolve(dirPath, archiveName + zipext));
                        fs.renameSync(path.resolve(outputDirPath, dirName + tarext), path.resolve(dirPath, archiveName + tarext));

                        resolve();
                    })
                    .catch(function(err) {
                        //cleanup
                        let pathToZipFile = path.resolve(outputDirPath, dirName + zipext),
                            pathToTarFile = path.resolve(outputDirPath, dirName + tarext);

                        if(fs.existsSync(pathToZipFile)) {
                            fs.unlinkSync(pathToZipFile);
                        }

                        if(fs.existsSync(pathToTarFile)) {
                            fs.unlinkSync(pathToTarFile);
                        }

                        reject(err);
                    });
            }));
        }
    });

    Promise
    .all(promisesForZipping)
    .then(function() {
        //remove Common directory
        __rmDirRecursively__(pathToCommonDir);

        //create metainfo.json in each channel dir
        let FILE_NAME = "metaInfo.json",
            FILE_CONTENT = {
                automationWindowOpened: false
            };

        __readdirSync__(outputDirPath).forEach(function(channel) {
            fs.writeFileSync(path.resolve(outputDirPath, channel, FILE_NAME), JSON.stringify(FILE_CONTENT, null, 4));
        });

        console.info(`Successfully generated Jasmine test artifacts within ${outputDirPath}`);
        process.exit(0);
    })
    .catch(function(err) {
        console.error('Error during archiving ::', err);
        process.exit(-1);
    });
}

function __printHelpContent__() {
    let helpContent = '\nUsage: node generateJasmineScripts.js [<args>]\n\n' +  
        'arguments: \n' +
        '    --help, -h                 help for generateJasmineScripts.js arguments\n' +
        '    --output-dir, -o           Directory to generate scripts.\n' +
        '                               Usage: node generateJasmineScripts.js --output-dir D:\\testScripts\n';
                
    console.log(helpContent);
}

function __validateInput__(args) {
    if(args.help) {
        return {
            isValid: true,
            showHelp: true
        };
    } else if(args["output-dir"]) {
        try {
            __assertDir__(args["output-dir"]);

            return {
                isValid: true
            };
        } catch(e) {
            return {
                isValid: false,
                showHelp: false,
                message: `Please enter a valid output directory path :: ${e}`
            };
        }
    } else {
        return {
            isValid: false,
            showHelp: true,
            message: "Invalid arguments"
        };
    }
}

try {
    let args = minimist(process.argv.slice(2), {alias: {
        'h': 'help',
        'o': 'output-dir'
    }});

    let validationObj = __validateInput__(args);

    if(!validationObj.isValid) {
        console.error(validationObj.message);
    }

    if(validationObj.showHelp) {
        __printHelpContent__();
    }

    if(validationObj.isValid) {
        if(args["output-dir"]) {
            __generateJasmineArtifacts__(args["output-dir"]);    
        }
    } else {
        process.exit(-1);
    }
} catch (e) {
    console.error('Error during generation ::', e);
    process.exit(-1);
}