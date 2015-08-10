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

    getCachedModules(fileChecksum, foundCallback, notFoundCallback);

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
        console.log('Not found the dir, run npm install');
        //Run npm install
        var npm_install = spawn('powershell', ['npm install']);
        npm_install.stdout.on('data', function(text) {console.log(text.toString())});
        npm_install.stdout.on('end', function() {
            console.log('Done installing NPM modules');

            console.log('Moving to ' +  searchDir);
            var move = spawn('powershell', ['mv node_modules', searchDir]);
            move.stdout.on('end', function() {
                console.log('done moving');
                
                
            });
        });

    }
    
    function foundCallback(searchDir, folderContent) {
        console.log('Found the dir, copy make link to current folder instead of run npm install: ' + folderContent);
        
        var create_symlink = spawn('cmd', ['/C "mklink /D /J node_modules ' + searchDir + '"']);
        create_symlink.stdout.on('data', function(text) {console.log(text.toString())});
        create_symlink.stdout.on('end', function() {
            console.log('done creating symbolic link to ' + searchDir);
        });
    }
});
