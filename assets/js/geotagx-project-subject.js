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
    var subject_ = null;
    var buttons_ = null;
    /**
     * Initializes the subject module.
     */
    __module__.initialize = function(){
        subject_ = document.getElementById("project-subject");
        subject_.dataset.type = __module__.getType();
        buttons_ = {
            "zoomIn":document.getElementById("project-subject-zoom-in"),
            "zoomOut":document.getElementById("project-subject-zoom-out"),
            "rotateLeft":document.getElementById("project-subject-rotate-left"),
            "rotateRight":document.getElementById("project-subject-rotate-right"),
            "source":document.getElementById("project-subject-source"),
            "help":document.getElementById("project-subject-help")
        };
    };
    /**
     * Returns the subject's type.
     */
    __module__.getType = function(){
        //TODO Return 'image' if no subject type is found.
        return __configuration__.taskPresenter.subject.type;
    };

    // Expose the frozen (immutable) module.
    project.subject = Object.freeze(__module__);
})(window.geotagx.project, jQuery);
