//===========================================================================
// DKTools.ScenePreloader
//===========================================================================

/**
 * Scene preloader class
 *
 * @class DKTools.Scene.Preloader
 *
 * @since 6.1.0
 * @memberof DKTools.Scene
 */
DKTools.Scene.Preloader = class {

    constructor() {
        this.initialize.apply(this, arguments);
    }

    // initialize methods

    /**
     * Initializes the preloader
     */
    initialize() {

        /**
         * @private
         * @readonly
         * @type {Promise[]}
         */
        this._queue = [];

        /**
         * @private
         * @readonly
         * @type {Boolean}
         */
        this._finished = false;

        /**
         * @private
         * @readonly
         * @type {Number}
         */
        this._errors = 0;
    }

    // A methods

    /**
     * Adds the resource to preloading
     *
     * @param {Promise | Bitmap | WebAudio} resource - Resource
     */
    add(resource) {
        if (resource instanceof Bitmap) {
            resource = DKTools.Utils.Bitmap.reserveAsync(resource);
        } else if (resource instanceof WebAudio) {
            resource = DKTools.Utils.WebAudio.loadAsync(resource);
        }

        if (resource instanceof Promise) {
            this._queue.push(resource);
        }
    }

    /**
     * Adds many resources to preloading
     *
     * @param {Promise[] | Bitmap[] | WebAudio[]} resources - Resources
     */
    addMany(resources) {
        _.forEach(resources, resource => this.add(resource));
    }

    // F methods

    /**
     * Finishes the preloading
     */
    finish() {
        this._queue = [];
        this._finished = true;
    }

    // H methods

    /**
     * Returns true if the preloader has errors
     *
     * @returns {Boolean} Preloader has errors
     */
    hasErrors() {
        return this._errors > 0;
    }

    // I methods

    /**
     * Returns true if the preloader is ready
     *
     * @returns {Boolean} Preloader is ready
     */
    isReady() {
        return this._finished;
    }

    // O methods

    /**
     * Processes the loading error
     *
     * @private
     */
    _onError() {
        this._errors++;
    }

    // S methods

    /**
     * Starts the preloading
     */
    start() {
        const promises = _.map(this._queue, (promise) => {
            return promise.catch((result) => {
                this._onError();

                throw result;
            });
        });

        Promise.all(promises).then(() => this.finish());
    }

};




