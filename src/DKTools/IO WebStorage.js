//===========================================================================
// DKTools.IO.WebStorage
//===========================================================================

/**
 * Web storage class
 *
 * @class DKTools.IO.WebStorage
 * @memberof DKTools.IO
 */
DKTools.IO.WebStorage = class {

    // E methods

    /**
     * Returns true if the key exists
     *
     * @static
     * @param {String} key - Key
     * @returns {Boolean} Key exists
     */
    static exists(key) {
        return localStorage.hasOwnProperty(key);
    }

    // L methods

    /**
     * Loads a data
     *
     * Returns an object with 3 properties:
     * status - Result of an operation
     * data - Loaded data
     * error - Error
     * if the status is not equal to DKTools.IO.OK then data will be null
     *
     * Possible statuses:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_DECOMPRESSING_DATA
     * DKTools.IO.ERROR_PARSING_DATA
     *
     * @version 7.0.0
     * @static
     *
     * @param {String} key - Key
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {Boolean} [object.decompress] - Use LZString.decompressFromBase64 for a data
     * @param {Boolean | Object} [object.parse] - Use JSON.parse for a data
     *
     * @param {Function} [object.parse.reviver] - A function that transforms the results
     *
     * @returns {{ data: String | Object | null, status: Number, error: Error | undefined }} Loaded data
     */
    static load(key, object = {}) {
        if (!this.exists(key)) {
            return { data: null, status: DKTools.IO.ERROR_PATH_DOES_NOT_EXIST };
        }

        let data = localStorage.getItem(key);

        if (data) {
            if (object.decompress) {
                try {
                    data = LZString.decompressFromBase64(data);
                } catch (error) {
                    return { data: null, status: DKTools.IO.ERROR_DECOMPRESSING_DATA, error };
                }
            }

            if (object.parse) {
                try {
                    data = JSON.parse(data, object.parse.reviver);
                } catch (error) {
                    return { data: null, status: DKTools.IO.ERROR_PARSING_DATA, error };
                }
            }
        }

        return { data, status: DKTools.IO.OK };
    }

    // R methods

    /**
     * Removes a data
     * Returns a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     *
     * @static
     * @param {String} key - Key
     * @returns {Number} Code of the result of an operation
     */
    static remove(key) {
        if (!this.exists(key)) {
            return DKTools.IO.ERROR_PATH_DOES_NOT_EXIST;
        }

        localStorage.removeItem(key);

        return DKTools.IO.OK;
    }

    /**
     * Renames a data
     * Returns a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_PATH_DOES_NOT_EXIST
     * DKTools.IO.ERROR_OVERWRITING_IS_NOT_AVAILABLE
     *
     * @version 7.0.0
     * @static
     *
     * @param {String} oldKey - Old key
     * @param {String} newKey - New key
     * @param {Boolean} [overwrite=false] - Overwrite the data
     *
     * @see DKTools.IO.WebStorage.exists
     *
     * @returns {Number} Code of the result of an operation
     */
    static rename(oldKey, newKey, overwrite = false) {
        if (!this.exists(oldKey)) {
            return DKTools.IO.ERROR_PATH_DOES_NOT_EXIST;
        }

        if (!overwrite && this.exists(newKey)) {
            return DKTools.IO.ERROR_OVERWRITING_IS_NOT_AVAILABLE;
        }

        const data = localStorage.getItem(oldKey);

        localStorage.setItem(newKey, data);
        localStorage.removeItem(oldKey);

        return DKTools.IO.OK;
    }

    // S methods

    /**
     * Saves the data
     * Returns a code of the result of an operation
     *
     * Possible results:
     * DKTools.IO.OK
     * DKTools.IO.ERROR_OVERWRITING_IS_NOT_AVAILABLE
     *
     * @version 7.0.0
     * @static
     *
     * @param {String} key - Key
     * @param {*} data - Data to save
     * @param {Object} [object={}] - Options of an operation
     *
     * @param {Boolean} [object.overwrite=true] - Overwrite the data
     * @param {Boolean} [object.stringify] - Use JSON.stringify for the data
     * @param {Boolean} [object.compress] - Use LZString.compressToBase64 for the data
     *
     * @returns {Number} Code of the result of an operation
     */
    static save(key, data, object = {}) {
        object = object || {};

        const overwrite = _.defaultTo(object.overwrite, true);

        if (!overwrite && this.exists(key)) {
            return DKTools.IO.ERROR_OVERWRITING_IS_NOT_AVAILABLE;
        }

        if (object.stringify) {
            data = JSON.stringify(data, object.stringify.replacer, object.stringify.space);
        }

        if (object.compress) {
            data = LZString.compressToBase64(data);
        }

        localStorage.setItem(key, data);

        return DKTools.IO.OK;
    }

};





