/*
 * A script to manage GeoTag-X projects.
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
;(function(geotagx, $, undefined){
    "use strict";

    // Create the project object that all modules will be attached to.
    geotagx.project = geotagx.project || {};

    $(document).ready(function(){
        if (geotagx.project.initialize())
            onProjectInitialized();
        else
            onProjectError();
    });
    /**
     * Initializes the project.
     */
    geotagx.project.initialize = function(){
        var initialized = geotagx.project.questionnaire.initialize(configurations["task-presenter"]);
        if (initialized)
            onQuestionnaireInitialized();
        else
            onQuestionnaireError();
/*
        initialized = geotagx.project.subject.initialize();
        if (initialized)
            onQuestionnaireInitialized();
        else
            onQuestionnaireError();
*/
        return initialized;
    };

    function onProjectInitialized(){
        geotagx.project.questionnaire.start();
        //TODO Complete me.
    }

    function onProjectError(message){
        //TODO Complete me.
    }

    function onQuestionnaireInitialized(){
        var q = geotagx.project.questionnaire;
        if (q){
            q.on(q.EVENT_SUBMIT, onQuestionnaireSubmit);
        }
        //TODO Complete me.
    }

    function onQuestionnaireError(){
        //TODO Complete me.
    }

    function onQuestionnaireSubmit(_, results, onSubmissionSuccess, onSubmissionError){
        //TODO Complete me.
        // Emulate a submission for debug purposes.
        setTimeout(function(){
            onSubmissionSuccess();
            setTimeout(function(){
                geotagx.project.questionnaire.start();
            }, 1500);
        }, 1000);
    }
})(window.geotagx = window.geotagx || {}, jQuery);
