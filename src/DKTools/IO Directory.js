//===========================================================================
// DKTools.IO.Directory
//===========================================================================

/**
 * Directory class
 *
 * @class DKTools.IO.Directory
 * @extends DKTools.IO.Entity
 *
 * @override
 *
 * @memberof DKTools.IO
 */
DKTools.IO.Directory = class extends DKTools.IO.Entity {

    // C methods

    /**
     * Creates the directory
     * Returns a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_DIRECTORY_ALREADY_EXISTS
     *
     * @example
     * var directory = new DKTools.IO.Directory('saves/');
     * directory.create();
     *
     * @see FileSystem.mkdirSync
     *
     * @returns {Number} Code of the result of an operation
     */
    create() {
        if (!DKTools.IO.isLocalMode()) {
            return DKTools.IO.ERROR_NOT_LOCAL_MODE;
        }

        if (this.exists()) {
            return DKTools.IO.ERROR_DIRECTORY_ALREADY_EXISTS;
        }

        DKTools.IO.fs.mkdirSync(this.getAbsolutePath());

        return DKTools.IO.OK;
    }

    /**
     * Creates the directory
     * Asynchronous version of DKTools.IO.Directory.prototype.create
     * Promise resolves a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_DIRECTORY_ALREADY_EXISTS
     *
     * @since 4.0.0
     * @async
     *
     * @see DKTools.IO.Directory.prototype.create
     * @see FileSystem.mkdir
     *
     * @returns {Promise} Code of the result of an operation
     */
    async createAsync() {
        return new Promise((resolve, reject) => {
            if (!DKTools.IO.isLocalMode()) {
                resolve(DKTools.IO.ERROR_NOT_LOCAL_MODE);
            }

            if (this.exists()) {
                resolve(DKTools.IO.ERROR_DIRECTORY_ALREADY_EXISTS);
            }

            DKTools.IO.fs.mkdir(this.getAbsolutePath(), (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(DKTools.IO.OK);
                }
            });
        });
    }

    /**
     * Creates the new directory
     * Returns a code of the result of an operation
     *
     * @since 6.3.0
     *
     * @param {String} name - Name of the directory
     *
     * @see DKTools.IO.Directory.prototype.create
     *
     * @returns {Number} Code of the result of an operation
     */
    createDirectory(name) {
        const fullPath = DKTools.IO.normalizePath(this.getFullPath() + '/' + name);
        const directory = new DKTools.IO.Directory(fullPath);

        return directory.create();
    }

    /**
     * Creates the new directory
     * Asynchronous version of DKTools.IO.Directory.prototype.createDirectory
     * Promise resolves a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_DIRECTORY_ALREADY_EXISTS
     *
     * @since 6.3.0
     * @async
     *
     * @param {String} name - Name of the directory
     *
     * @see DKTools.IO.Directory.prototype.createAsync
     *
     * @returns {Promise}
     */
    async createDirectoryAsync(name) {
        const fullPath = DKTools.IO.normalizePath(this.getFullPath() + '/' + name);
        const directory = new DKTools.IO.Directory(fullPath);

        return directory.createAsync();
    }

    // F methods

    /**
     * Finds the files
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 6.1.0
     * @since 4.0.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {RegExp | String} [object.template] - Template for filtering
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     * @param {Number} [object.searchLimit] - Search limit
     *
     * @example
     * var directory = new DKTools.IO.Directory('img/');
     * var directories = directory.findFiles({ sync: true, template: 'Window.png' });
     *
     * @see DKTools.IO.Directory.prototype.getAll
     *
     * @returns {{ data: Object, status: Number }} All files
     */
    findFiles(object) {
        if (!object) {
            return { data: null, status: DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE };
        }

        if (!DKTools.IO.isLocalMode()) {
            return { data: null, status: DKTools.IO.ERROR_NOT_LOCAL_MODE };
        }

        if (!object.sync && !DKTools.Utils.isFunction(object.onSuccess)) {
            return { data: null, status: DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE };
        }

        if (!this.exists()) {
            return { data: null, status: DKTools.IO.ERROR_PATH_DOES_NOT_EXIST };
        }

        const searchLimit = object.searchLimit || 1;
        const files = [];
        let total = 1, processed = 0;

        const processData = (data) => {
            _.forEach(data, (entity) => {
                if (entity.isFile()) {
                    const fullName = entity.getFullName();

                    if (object.template instanceof RegExp && object.template.test(fullName)) {
                        files.push(entity);
                    } else if (!object.template || fullName === object.template) {
                        files.push(entity);
                    }
                } else if (total < searchLimit && entity.isDirectory()) {
                    total++;

                    processDirectory(entity);
                }
            });
        };

        const processDirectory = (directory) => {
            if (object.sync) {
                const data = directory.getAll({
                    sync: true,
                    options: object.options
                }).data;

                processData(data);
            } else {
                directory.getAll({
                    sync: false,
                    options: object.options,
                    onError: object.onError,
                    onSuccess: (result) => {
                        processed++;

                        processData(result.data);

                        if (total === processed) {
                            object.onSuccess({ data: files, status: DKTools.IO.OK });
                        }
                    }
                });
            }
        };

        processDirectory(this);

        if (object.sync) {
            return { data: files, status: DKTools.IO.OK };
        } else {
            return { data: null, status: DKTools.IO.WAIT_FOR_ASYNC_OPERATION };
        }
    }

    /**
     * Finds the files
     * Asynchronous version of DKTools.IO.Directory.prototype.findFiles
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @version 6.1.0
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     * @param {RegExp | String} [object.template] - Template for filtering
     * @param {Number} [object.searchLimit] - Search limit
     *
     * @see DKTools.IO.Directory.prototype.findFiles
     *
     * @returns {Promise} All files
     */
    async findFilesAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.findFiles({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    /**
     * Finds the directories
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with directories (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @since 4.0.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {RegExp | String} [object.template] - Template for filtering
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     * @param {Number} [object.searchLimit] - Search limit
     *
     * @example
     * var directory = new DKTools.IO.Directory('img/');
     * var directories = directory.findDirectories({ sync: true, template: 'system' });
     *
     * @see DKTools.IO.Directory.prototype.getDirectories
     *
     * @returns {{ data: Object, status: Number }} All directories
     */
    findDirectories(object) {
        if (!object) {
            return { data: null, status: DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE };
        }

        if (!DKTools.IO.isLocalMode()) {
            return { data: null, status: DKTools.IO.ERROR_NOT_LOCAL_MODE };
        }

        if (!object.sync && !DKTools.Utils.isFunction(object.onSuccess)) {
            return { data: null, status: DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE };
        }

        if (!this.exists()) {
            return { data: null, status: DKTools.IO.ERROR_PATH_DOES_NOT_EXIST };
        }

        const searchLimit = object.searchLimit || 1;
        const directories = [];
        let total = 1, processed = 0;

        const processData = (data) => {
            _.forEach(data, (directory) => {
                const fullName = directory.getFullName();

                if (object.template instanceof RegExp && object.template.test(fullName)) {
                    directories.push(directory);
                } else if (!object.template || fullName === object.template) {
                    directories.push(directory);
                }

                if (total < searchLimit) {
                    total++;

                    processDirectory(directory);
                }
            });
        };

        const processDirectory = (directory) => {
            if (object.sync) {
                const data = directory.getDirectories({
                    sync: true,
                    options: object.options
                }).data;

                processData(data);
            } else {
                directory.getDirectories({
                    sync: false,
                    options: object.options,
                    onError: object.onError,
                    onSuccess: (result) => {
                        processed++;

                        processData(result.data);

                        if (total === processed) {
                            object.onSuccess({ data: directories, status: DKTools.IO.OK });
                        }
                    }
                });
            }
        };

        processDirectory(this);

        if (object.sync) {
            return { data: directories, status: DKTools.IO.OK };
        } else {
            return { data: null, status: DKTools.IO.WAIT_FOR_ASYNC_OPERATION };
        }
    }

    /**
     * Finds the directories
     * Asynchronous version of DKTools.IO.Directory.prototype.findDirectories
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with directories (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @version 6.1.0
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     * @param {RegExp | String} [object.template] - Template for filtering
     * @param {Number} [object.searchLimit] - Search limit
     *
     * @see DKTools.IO.Directory.prototype.findDirectories
     *
     * @returns {Promise} All directories
     */
    async findDirectoriesAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.findDirectories({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    // G methods

    /**
     * Returns all files and directories
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files and directories (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 6.1.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {RegExp | String} [object.template] - Template for filtering
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see FileSystem.readdir
     * @see FileSystem.readdirSync
     *
     * @returns {{ data: Object, status: Number }} All files and directories
     */
    getAll(object) {
        if (!object) {
            return { data: null, status: DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE };
        }

        if (!DKTools.IO.isLocalMode()) {
            return { data: null, status: DKTools.IO.ERROR_NOT_LOCAL_MODE };
        }

        if (!this.exists()) {
            return { data: null, status: DKTools.IO.ERROR_PATH_DOES_NOT_EXIST };
        }

        const fs = DKTools.IO.fs;
        const path = this.getFullPath();
        const absolutePath = this.getAbsolutePath();
        const processData = (names) => {
            if (object.template instanceof RegExp) {
                names = _.filter(names, name => object.template.test(name));
            } else if (DKTools.Utils.isString(object.template)) {
                names = _.filter(names, name => name === object.template);
            }

            const data = _.reduce(names, (acc, name) => {
                const fullPath = DKTools.IO.normalizePath(path + '/' + name);

                if (DKTools.IO.isFile(fullPath)) {
                    acc.push(new DKTools.IO.File(fullPath));
                } else if (DKTools.IO.isDirectory(fullPath)) {
                    acc.push(new DKTools.IO.Directory(fullPath));
                }

                return acc;
            }, []);

            return { data, status: DKTools.IO.OK };
        };

        if (object.sync) {
            const names = fs.readdirSync(absolutePath, object.options);

            return processData(names);
        } else {
            if (!DKTools.Utils.isFunction(object.onSuccess)) {
                return { data: null, status: DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE };
            }

            fs.readdir(absolutePath, object.options, (error, names) => {
                if (error) {
                    this.__processError(error, object.onError);
                } else {
                    object.onSuccess(processData(names), this);
                }
            });

            return { data: null, status: DKTools.IO.WAIT_FOR_ASYNC_OPERATION };
        }
    }

    /**
     * Returns all files and directories
     * Asynchronous version of DKTools.IO.Directory.prototype.getAll
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files and directories (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @version 6.1.0
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     * @param {RegExp | String} [object.template] - Template for filtering
     *
     * @see DKTools.IO.Directory.prototype.getAll
     *
     * @returns {Promise} All files and directories
     */
    async getAllAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.getAll({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    /**
     * Returns all files
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 6.1.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {RegExp} [object.template] - Template for filtering
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see DKTools.IO.Directory.prototype.getAll
     * @see FileSystem.readdir
     * @see FileSystem.readdirSync
     *
     * @returns {{ data: Object, status: Number }} All files
     */
    getFiles(object) {
        object = object || {};

        const processData = (entities) => _.filter(entities, entity => entity.isFile());

        if (object.sync) {
            const result = this.getAll(object);

            if (result.status === DKTools.IO.OK) {
                return { ...result, data: processData(result.data) };
            }

            return result;
        } else {
            if (!DKTools.Utils.isFunction(object.onSuccess)) {
                return { data: null, status: DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE };
            }

            const onSuccess = object.onSuccess;

            object.onSuccess = (result, directory) => {
                onSuccess({ ...result, data: processData(result.data) }, directory);
            };

            return this.getAll(object);
        }
    }

    /**
     * Returns all files
     * Asynchronous version of DKTools.IO.Directory.prototype.getFiles
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @version 6.1.0
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     * @param {RegExp | String} [object.template] - Template for filtering
     *
     * @see DKTools.IO.Directory.prototype.getAllAsync
     *
     * @returns {Promise} All files
     */
    async getFilesAsync(object = {}) {
        return this.getAllAsync(object).then(result => {
            if (result.status === DKTools.IO.OK) {
                const data = _.filter(result.data, entity => entity.isFile());

                return { ...result, data };
            }

            return result;
        });
    }

    /**
     * Returns all directories
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with directories (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 6.1.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {RegExp} [object.template] - Template for filtering
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see DKTools.IO.Directory.prototype.getAll
     * @see FileSystem.readdir
     * @see FileSystem.readdirSync
     *
     * @returns {{ data: Object, status: Number }} All directories
     */
    getDirectories(object) {
        const processData = (entities) => _.filter(entities, entity => entity.isDirectory());

        if (object.sync) {
            const result = this.getAll(object);

            if (result.status === DKTools.IO.OK) {
                return { ...result, data: processData(result.data) };
            }

            return result;
        } else {
            if (!DKTools.Utils.isFunction(object.onSuccess)) {
                return { data: null, status: DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE };
            }

            const onSuccess = object.onSuccess;

            object.onSuccess = (result, directory) => {
                onSuccess({ ...result, data: processData(result.data) }, directory);
            };

            return this.getAll(object);
        }
    }

    /**
     * Returns all directories
     * Asynchronous version of DKTools.IO.Directory.prototype.getDirectories
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with directories (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @version 6.1.0
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     * @param {RegExp | String} [object.template] - Template for filtering
     *
     * @see DKTools.IO.Directory.prototype.getAllAsync
     *
     * @returns {Promise} All directories
     */
    async getDirectoriesAsync(object = {}) {
        return this.getAllAsync(object).then(result => {
            if (result.status === DKTools.IO.OK) {
                const data = _.filter(result.data, entity => entity.isDirectory());

                return { ...result, data };
            }

            return result;
        });
    }

    /**
     * Returns all audio files
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 5.0.0
     * @since 3.0.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see DKTools.IO.Directory.prototype.getFiles
     *
     * @returns {{ data: Object, status: Number }} All audio files
     */
    getAudioFiles(object) {
        return this.getFiles({ ...object, template: /(.ogg|.rpgmvo)/ });
    }

    /**
     * Returns all audio files
     * Asynchronous version of DKTools.IO.Directory.prototype.getAudioFiles
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @version 6.1.0
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     *
     * @see DKTools.IO.Directory.prototype.getAudioFiles
     *
     * @returns {Promise} All audio files
     */
    async getAudioFilesAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.getAudioFiles({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    /**
     * Returns all JSON files
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 4.0.0
     * @since 3.0.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see DKTools.IO.Directory.prototype.getFiles
     *
     * @returns {{ data: Object, status: Number }} All JSON files
     */
    getJsonFiles(object) {
        return this.getFiles({ ...object, template: /(.json)/ });
    }

    /**
     * Returns all JSON files
     * Asynchronous version of DKTools.IO.Directory.prototype.getJsonFiles
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     *
     * @see DKTools.IO.Directory.prototype.getJsonFiles
     *
     * @returns {Promise} All JSON files
     */
    async getJsonFilesAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.getJsonFiles({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    /**
     * Returns all txt files
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @since 5.0.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see DKTools.IO.Directory.prototype.getFiles
     *
     * @returns {{ data: Object, status: Number }} All txt files
     */
    getTxtFiles(object) {
        return this.getFiles({ ...object, template: /(.txt)/ });
    }

    /**
     * Returns all txt files
     * Asynchronous version of DKTools.IO.Directory.prototype.getTxtFiles
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @since 5.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     *
     * @see DKTools.IO.Directory.prototype.getTxtFiles
     *
     * @returns {Promise} All txt files
     */
    async getTxtFilesAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.getTxtFiles({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    /**
     * Returns all image files
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 5.0.0
     * @since 3.0.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see DKTools.IO.Directory.prototype.getFiles
     *
     * @returns {{ data: Object, status: Number }} All image files
     */
    getImageFiles(object) {
        return this.getFiles({ ...object, template: /(.png|.rpgmvp)/ });
    }

    /**
     * Returns all image files
     * Asynchronous version of DKTools.IO.Directory.prototype.getImageFiles
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     *
     * @see DKTools.IO.Directory.prototype.getImageFiles
     *
     * @returns {Promise} All image files
     */
    async getImageFilesAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.getImageFiles({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    /**
     * Returns all video files
     *
     * Returns an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_CALLBACK_IS_NOT_AVAILABLE
     * DKTools.IO.ERROR_OPTIONS_IS_NOT_AVAILABLE
     *
     * @version 5.0.0
     * @since 3.0.0
     *
     * @param {Object} object - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.readdir
     * @param {String | Object} [object.options] - Options for FileSystem.readdir or FileSystem.readdirSync
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see DKTools.IO.Directory.prototype.getFiles
     *
     * @returns {{ data: Object, status: Number }} All video files
     */
    getVideoFiles(object) {
        return this.getFiles({ ...object, template: /(.webm)/ });
    }

    /**
     * Returns all video files
     * Asynchronous version of DKTools.IO.Directory.prototype.getVideoFiles
     *
     * Promise resolves an object with 2 properties:
     * status - Result of an operation
     * data - Array with files (only if the status is equal to DKTools.IO.OK)
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @since 4.0.0
     * @async
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {String | Object} [object.options] - Options for FileSystem.readdir
     *
     * @see DKTools.IO.Directory.prototype.getVideoFiles
     *
     * @returns {Promise} All video files
     */
    async getVideoFilesAsync(object = {}) {
        return new Promise((resolve, reject) => {
            const result = this.getVideoFiles({
                ...object,
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (result.status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(result);
            }
        });
    }

    /**
     * Returns the root directory
     *
     * @since 6.3.0
     *
     * @see DKTools.IO.Directory.prototype.getPath
     *
     * @returns {DKTools.IO.Directory} Root directory
     */
    getRootDirectory() {
        return new DKTools.IO.Directory(this.getPath());
    }

    // I methods

    /**
     * Returns true if the directory does not contain files and other directories
     *
     * @returns {Boolean} Directory does not contain files and other directories
     */
    isEmpty() {
        const data = this.getAll({ sync: true }).data;

        return !data || data.length === 0;
    }

    // L methods

    /**
     * Loads and returns an audio files
     *
     * @since 3.0.0
     *
     * @see DKTools.IO.Directory.prototype.getAudioFiles
     *
     * @returns {WebAudio[]} Loaded audio files
     */
    loadAudioFiles() {
        const result = this.getAudioFiles({ sync: true });

        if (result.status !== DKTools.IO.OK) {
            return [];
        }

        return _.map(result.data, file => file.loadAudio());
    }

    /**
     * Loads and returns an audio files
     * Asynchronous version of DKTools.IO.Directory.prototype.loadAudioFiles
     * Promise resolves a loaded audio files
     *
     * @version 5.0.0
     * @since 4.0.0
     * @async
     *
     * @see DKTools.IO.Directory.prototype.loadAudioFiles
     *
     * @returns {Promise} Loaded audio files
     */
    async loadAudioFilesAsync() {
        const result = await this.getAudioFilesAsync();

        if (result.status !== DKTools.IO.OK) {
            return [];
        }

        const promises = _.map(result.data, file => file.loadAudioAsync());

        return Promise.all(promises);
    }

    /**
     * Loads and returns a bitmaps
     *
     * @since 3.0.0
     *
     * @param {Function | Object} [object] - Function of processing after loading a bitmap or object with parameter
     * @param {Number} [hue] - Hue of bitmap (if object is Object)
     * @param {Boolean} [smooth] - Smooth of bitmap (if object is Object)
     *
     * @param {Function} [object.listener] - Function of processing after loading a bitmap
     * @param {Number} [object.hue] - Hue of bitmap
     * @param {Boolean} [object.smooth] - Smooth of bitmap
     *
     * @see DKTools.IO.Directory.prototype.getImageFiles
     * @see DKTools.Utils.Bitmap.load
     *
     * @returns {Bitmap[]} Loaded bitmaps
     */
    loadBitmaps(object, hue, smooth) {
        const result = this.getImageFiles({ sync: true });

        if (result.status !== DKTools.IO.OK) {
            return [];
        }

        return _.map(result.data, file => file.loadBitmap(object, hue, smooth));
    }

    /**
     * Loads and returns a bitmaps
     * Asynchronous version of DKTools.IO.Directory.prototype.loadBitmaps
     * Promise resolves a loaded bitmaps
     *
     * @since 4.0.0
     * @async
     *
     * @param {Function | Object} [object] - Function of processing after loading a bitmap or object with parameter
     * @param {Number} [hue] - Hue of bitmap (if object is Object)
     * @param {Boolean} [smooth] - Smooth of bitmap (if object is Object)
     *
     * @param {Function} [object.listener] - Function of processing after loading a bitmap
     * @param {Number} [object.hue] - Hue of bitmap
     * @param {Boolean} [object.smooth] - Smooth of bitmap
     *
     * @see DKTools.IO.Directory.prototype.getImageFilesAsync
     * @see DKTools.IO.Directory.prototype.loadBitmaps
     *
     * @returns {Promise} Loaded bitmaps
     */
    async loadBitmapsAsync(object, hue, smooth) {
         const result = await this.getImageFilesAsync();

        if (result.status !== DKTools.IO.OK) {
            return [];
        }

        const promises = _.map(result.data, file => file.loadBitmapAsync(object, hue, smooth));

        return Promise.all(promises);
    }

    // R methods

    /**
     * Removes the directory
     * Returns a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.WAIT_FOR_ASYNC_OPERATION
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_DIRECTORY_IS_NOT_EMPTY
     *
     * @version 6.1.0
     *
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {Boolean} [object.sync] - Use synchronous version of FileSystem.rmdir
     * @param {Function} [object.onSuccess] - Callback function upon completion of an operation (only for object.sync == false)
     * @param {Function} [object.onError] - Callback function upon completion of an operation with error (only for object.sync == false)
     *
     * @see FileSystem.rmdir
     * @see FileSystem.rmdirSync
     *
     * @returns {Number} Code of the result of an operation
     */
    remove(object = {}) {
        if (!DKTools.IO.isLocalMode()) {
            return DKTools.IO.ERROR_NOT_LOCAL_MODE;
        }

        if (!this.exists()) {
            return DKTools.IO.ERROR_PATH_DOES_NOT_EXIST;
        }

        if (!this.isEmpty()) {
            return DKTools.IO.ERROR_DIRECTORY_IS_NOT_EMPTY;
        }

        const fs = DKTools.IO.fs;
        const absolutePath = this.getAbsolutePath();

        if (object.sync) {
            fs.rmdirSync(absolutePath);

            return DKTools.IO.OK;
        } else {
            fs.rmdir(absolutePath, (error) => {
                if (error) {
                    this.__processError(error, object.onError);
                } else if (DKTools.Utils.isFunction(object.onSuccess)) {
                    object.onSuccess(DKTools.IO.OK, this);
                }
            });

            return DKTools.IO.WAIT_FOR_ASYNC_OPERATION;
        }
    }

    /**
     * Removes the directory
     * Asynchronous version of DKTools.IO.Directory.prototype.remove
     * Promise resolves a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_NOT_LOCAL_MODE
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_DIRECTORY_IS_NOT_EMPTY
     *
     * @since 4.0.0
     * @async
     *
     * @see DKTools.IO.Directory.prototype.remove
     *
     * @returns {Promise} Code of the result of an operation
     */
    async removeAync() {
        return new Promise((resolve, reject) => {
            const status = this.remove({
                sync: false,
                onSuccess: resolve,
                onError: reject
            });

            if (status !== DKTools.IO.WAIT_FOR_ASYNC_OPERATION) {
                resolve(status);
            }
        });
    }

    /**
     * Loads, reserves and returns a bitmaps
     *
     * @since 3.0.0
     *
     * @param {Function | Object} [object] - Function of processing after loading a bitmap or object with parameter
     * @param {Number} [hue] - Hue of bitmap (if object is Object)
     * @param {Boolean} [smooth] - Smooth of bitmap (if object is Object)
     * @param {Number} [reservationId] - Reservation ID (if object is Object)
     *
     * @param {Function} [object.listener] - Function of processing after loading a bitmap
     * @param {Number} [object.hue] - Hue of bitmap
     * @param {Boolean} [object.smooth] - Smooth of bitmap
     * @param {Number} [object.reservationId] - Reservation ID
     *
     * @see DKTools.IO.Directory.prototype.getImageFiles
     * @see DKTools.Utils.Bitmap.reserve
     *
     * @returns {Bitmap[]} Loaded bitmaps
     */
    reserveBitmaps(object, hue, smooth, reservationId) {
        const result = this.getImageFiles({ sync: true });

        if (result.status !== DKTools.IO.OK) {
            return [];
        }

        return _.map(result.data, file => file.reserveBitmap(object, hue, smooth, reservationId));
    }

    /**
     * Loads, reserves and returns a bitmaps
     * Asynchronous version of DKTools.IO.Directory.prototype.reserveBitmaps
     * Promise resolves a loaded bitmaps
     *
     * @since 4.0.0
     * @async
     *
     * @param {Function | Object} [object] - Function of processing after loading a bitmap or object with parameter
     * @param {Number} [hue] - Hue of bitmap (if object is Object)
     * @param {Boolean} [smooth] - Smooth of bitmap (if object is Object)
     * @param {Number} [reservationId] - Reservation ID (if object is Object)
     *
     * @param {Function} [object.listener] - Function of processing after loading a bitmap
     * @param {Number} [object.hue] - Hue of bitmap
     * @param {Boolean} [object.smooth] - Smooth of bitmap
     * @param {Number} [object.reservationId] - Reservation ID
     *
     * @see DKTools.IO.Directory.prototype.getImageFilesAsync
     * @see DKTools.IO.Directory.prototype.reserveBitmaps
     *
     * @returns {Promise} Loaded bitmaps
     */
    async reserveBitmapsAsync(object, hue, smooth, reservationId) {
        const result = await this.getImageFilesAsync();

        if (result.status !== DKTools.IO.OK) {
            return [];
        }

        const promises = _.map(result.data, file => file.reserveBitmapAsync(object, hue, smooth, reservationId));

        return Promise.all(promises);
    }

};




