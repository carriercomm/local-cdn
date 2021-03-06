var fs = require('fs');
var glob = require('glob');

/**
 * Contains all the information for generating js and css bundles from a
 * directory containing all the static assets for a project.
 *
 * @class BuildConfig
 */
function BuildConfig(options) {
    this.staticDir = options.staticDir;
    this.deployDir = options.deployDir;
    this.options = options;
    this.compress = true;
    this.extras = [];
    
    // expand out bundle file paths to handle glob style wildcards
    var bundleName, files, file, i;
    
    for (bundleName in this.options['js']) {
        this.options['js'][bundleName] = expand(this.staticDir, this.options['js'][bundleName]);
    }
    
    for (bundleName in this.options['css']) {
        this.options['css'][bundleName] = expand(this.staticDir, this.options['css'][bundleName]);
    }
    
    // build the total resourceList for isBundleFile
    this.resourceList = function() {
        var list = [];
        
        for (key in options['js']) {
            list = list.concat(options['js'][key]);
        }
        
        for (key in options['css']) {
            list = list.concat(options['css'][key]);
        }
        
        return list;
    }();
}

BuildConfig.prototype = {
    getBundles: function(type) {
        return this.options[type];
    },
    
    getFiles: function(type, bundleName) {
        var staticDir = this.staticDir,
            options = this.options,
            files = [],
            bundles,
            bundle,
            file,
            i;
        
        bundles = options[type];
        
        if (! bundles) { return false; }
        
        bundle = bundles[bundleName];
        
        if (! bundle) { return false; }
        
        for (i = 0; i < bundle.length; i++) {
            file = bundle[i];
            
            files.push(staticDir + file);
        }
        
        return files;
    },
    
    isBundleFile: function(relPath) {
        if (this.resourceList.indexOf(relPath) > -1) {
            return true;
        }
        
        return false;
    }
};

/**
 * Creates a BuildConfig instance from a JSON string.
 *
 * @method fromString
 * @param {String} jsonStr  the config file's json data
 * @param {String} filepath  the path to the config file, only required 
 *  if the paths in the config file are relative
 *
 * @return {Object} the constructed BuildConfig instance
 */
function fromString(jsonStr, filepath) {
    var jsonData,
        config;
    
    try {
        jsonData = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error('Error parsing json in config file: ' + e);
    }
    
    if (filepath) {
        jsonData.staticDir = absolutizeDir(filepath, jsonData.staticDir);
        jsonData.deployDir = absolutizeDir(filepath, jsonData.deployDir);
    }
    
    return new BuildConfig(jsonData);
}

/**
 * Synchronous version of fromFile.
 *
 * @method fromFileSync
 * @param {String} filepath  the path to the config file
 *
 * @return {Object} the constructed BuildConfig instance
 */
function fromFileSync(filepath) {
    var data = fs.readFileSync(filepath, 'utf-8');
    
    return fromString(data, filepath);
}

/**
 * Creates a BuildConfig instance from a config file.
 *
 * @method fromFile
 * @param {String} filepath  the path to the config file
 * @param {Function} callback  the function to execute on success, 
 *  only arg is the BuildConfig instance.
 */
function fromFile(filepath, callback) {
    fs.readFile(filepath, 'utf-8', function(err, data) {
        if (err) {
            throw err;
        }
        
        callback(fromString(data, filepath));
    });
}

/**
 * @method absolutizeDir
 * @private
 */
function absolutizeDir(root, path) {
    // append on the trailing slash if it isn't there already
    if (path.substr(-1) !== '/') {
        path = path + '/';
    }
    
    if (path.charAt(0) === '/') {
        return path;
    }
    
    var absPath = fs.realpathSync(root);
    absPath = absPath.substring(0, absPath.lastIndexOf('/')); // chop off config filename
    
    return absPath + '/' + path;
}

/**
 * @method expand
 * @private
 */
function expand(root, fileList) {
    var expandedList = [],
        expanded,
        file,
        i,
        j;
        
    for (i = 0; i < fileList.length; i++) {
        file = fileList[i];
        expanded = glob.globSync(root + file, glob.GLOB_NO_DOTDIRS|glob.GLOB_STAR);
        
        for (j = 0; j < expanded.length; j++) {
            expanded[j] = expanded[j].slice(root.length);
        }
        
        expandedList = expandedList.concat(expanded);
    }
    
    return expandedList;
}

exports.fromString = fromString;
exports.fromFile = fromFile;
exports.fromFileSync = fromFileSync;
exports.BuildConfig = BuildConfig;
