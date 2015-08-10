var crypto = require('crypto'), 
    fs = require('fs'),
    spawn = require('child_process').spawn;
    
var options = {
    cacheDir: 'C:\\temp\\npm-cache\\'
};

function checksum (str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex')
}

fs.readFile('package.json', function (err, data) {
    var fileChecksum = checksum(data);
    console.log('Calculated file checksum ' + fileChecksum);

    getCachedModules(fileChecksum, createSymbolicLinkToNodeModules, notFoundCallback);

    function getCachedModules(checksum, found, notFound) {
        searchForCachedVersion(checksum, function(searchFoundSomething, searchDir, folderContent) {
            if(searchFoundSomething) {
                found(searchDir, folderContent);
            } else {
                notFound(searchDir);
            }
        });
    }
      
    function searchForCachedVersion(checksum, cb) {
        var searchDir = options.cacheDir + checksum;
        fs.readdir(searchDir, function(err, folderContent) {
            if(err) {
                console.log("Directory " + searchDir + " was not found");
                cb(false, searchDir);
                return;
            }

            cb(true, searchDir, folderContent);
            return;
        });
    }
    
    function notFoundCallback(searchDir) {
        console.log('Running npm install');
        //Run npm install
        var npm_install = spawn('powershell', ['npm install']);
        npm_install.stdout.on('data', function(text) {console.log(text.toString())});
        npm_install.stdout.on('end', function() {
            console.log('Done installing NPM modules');

            console.log('Moving to ' +  searchDir);
            var move = spawn('powershell', ['mv node_modules', searchDir]);
            move.stdout.on('end', function() {
                console.log('Done moving');
                
                createSymbolicLinkToNodeModules(searchDir);
            });
        });

    }
    
    function createSymbolicLinkToNodeModules(searchDir, folderContent) {
        console.log('Creating symbolic link to node modules: ' + searchDir);
        
        var destPath = __dirname + '\\node_modules';
        console.log('Destination path: '+destPath);
        fs.symlink(searchDir, destPath, 'dir', function() {
            console.log('Symlink created');
        });
    }
});
