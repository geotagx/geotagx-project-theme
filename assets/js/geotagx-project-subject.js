/*
 * A script that manages a GeoTag-X project's subject.
 * Copyright (c) 2016, UNITAR-UNOSAT.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
;(function(project, $, undefined){
    "use strict";

    var __module__ = {};
    /**
     * The subject instance.
     */
    var subject_ = null;
    /**
     * Event types.
     */
    __module__.EVENT_URL_CHANGE = "project-subject-url-change";
    __module__.EVENT_SOURCE_CHANGE = "project-subject-source-change";
    __module__.EVENT_IMAGE_ROTATE = "project-subject-image-rotate";
    __module__.EVENT_IMAGE_ZOOM = "project-subject-image-zoom";
    /**
     * Subject types.
     */
    __module__.TYPE_IMAGE = "image";
    __module__.TYPE_PDF = "pdf";
    /**
     * Initializes the subject module.
     */
    __module__.initialize = function(){
        var type = $.trim(__configuration__.taskPresenter.subject.type);
        var node = document.getElementById("project-subject");
        if (node)
            node.dataset.type = type;

        // Instantiate the subject.
        var Subject = geotagx.Image; // Image is used by default.
        switch (type){
            case __module__.TYPE_PDF:
                Subject = geotagx.PDF;
                break;
            case __module__.TYPE_IMAGE:
                /* falls through */
            default:
                // Remember the Image class has already been referenced.
                break;
        }
        subject_ = new Subject("project-subject-body");

        initializeEventHandlers();
    };
    /**
     * Attaches an event handler for one or more events to the subject.
     */
    __module__.on = function(events, handler){
        $("#project-subject").on(events, handler);
    };
    /**
     * Removes an event handler.
     */
    __module__.off = function(events, handler){
        $("#project-subject").off(events, handler);
    };
    /**
     * Executes all handlers attached to the event.
     */
    __module__.trigger = function(type, parameters){
        $("#project-subject").trigger(type, parameters);
    };
    /**
     * Returns the subject's type.
     */
    __module__.getType = function(){
        if (subject_ instanceof geotagx.Image)
            return __module__.TYPE_IMAGE;
        else if (subject_ instanceof geotagx.PDF)
            return __module__.TYPE_PDF;
        else
            return null;
    };
    /**
     * Sets the subject's type.
     * @param type a string denoting a subject type.
     */
    //__module__.setType = function(type){
        //TODO Complete me.
    //};
    /**
     * Returns the URL to the subject.
     */
    __module__.getUrl = function(){
        return subject_.getSource();
    };
    /**
     * Sets the URL to the subject.
     * @param url a URL to the subject.
     */
    __module__.setUrl = function(url){
        url = $.trim(url);
        if (url.length > 0 && subject_ && subject_.setSource && typeof(subject_.setSource) === "function"){
            subject_.setSource(url);
            __module__.trigger(__module__.EVENT_URL_CHANGE, url);
        }
    };
    /**
     * Returns the URL to the subject's source.
     */
    __module__.getSource = function(){
        return document.getElementById("project-subject-source").href;
    };
    /**
     * Sets the URL to the subject's source.
     * @param url a URL to the subject's source.
     */
    __module__.setSource = function(url){
        url = $.trim(url);
        if (url.length > 0){
            document.getElementById("project-subject-source").href = url;
            __module__.trigger(__module__.EVENT_SOURCE_CHANGE, url);
        }
    };
    /**
     * Initializes the subject's event handlers.
     */
    function initializeEventHandlers(){
        if (subject_ instanceof geotagx.Image){
            $("#project-subject-zoom-in").click(function(){
                subject_.zoomIn();
                __module__.trigger(__module__.EVENT_IMAGE_ZOOM, 1);
            });
            $("#project-subject-zoom-out").click(function(){
                subject_.zoomOut();
                __module__.trigger(__module__.EVENT_IMAGE_ZOOM, -1);
            });
            $("#project-subject-zoom-reset").click(function(){
                subject_.zoomReset();
                __module__.trigger(__module__.EVENT_IMAGE_ZOOM, 0);
            });
            $("#project-subject-rotate-left").click(function(){
                subject_.rotateLeft();
                __module__.trigger(__module__.EVENT_IMAGE_ROTATE, subject_.image.rotation);
            });
            $("#project-subject-rotate-right").click(function(){
                subject_.rotateRight();
                __module__.trigger(__module__.EVENT_IMAGE_ROTATE, subject_.image.rotation);
            });
        }
    }

    // Expose the frozen (immutable) module.
    project.subject = Object.freeze(__module__);
})(window.geotagx.project, jQuery);
