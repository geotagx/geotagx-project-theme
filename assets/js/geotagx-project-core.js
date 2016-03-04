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
        geotagx.project = Object.freeze(geotagx.project); // Prevent further modifications to the object.
        geotagx.project.initialize();
    });
    /**
     * Initializes the project.
     */
    geotagx.project.initialize = function(){
        //try {
            initializeLocale();
            setName(__configuration__.project.name);
            setDescription(__configuration__.project.description);
            setRepository(__configuration__.project.repository.url, __configuration__.project.repository.type);
            initializeUserProgress();
            initializeQuestionnaire();
            initializeSubject();
            initializeEventHandlers();

            geotagx.project.questionnaire.start();
        //} catch (e){
             // TODO Implement me.
             //throw e;
        //}
    };
    /**
     * Initializes the project's locale.
     */
    function initializeLocale(){
        //try {
            geotagx.project.locale.initialize();
        //} catch (e){
             // TODO Implement me.
            //throw e;
        //}
    }
    /**
     * Initializes the project's questionnaire.
     */
    function initializeQuestionnaire(){
        //try {
            geotagx.project.questionnaire.initialize();
        //} catch (e){
            //TODO Implement me.
            //throw e;
        //}
    }
    /**
     * Initializes the project's subject.
     */
    function initializeSubject(){
        //TODO Implement me.
    }
    /**
     * Initializes the project's user progress counters.
     */
    function initializeUserProgress(){
        //TODO Implement me.
        var completed = 200;
        var total = 1289;

        setTimeout(function(){
            setUserProgress(completed, total);
            $("#project-analyses-completed").fadeIn(300);
        }, 500);
    }
    /**
     * Initializes the project's event handlers.
     */
    function initializeEventHandlers(){
        geotagx.project.questionnaire.on(geotagx.project.questionnaire.EVENT_SUBMIT, onQuestionnaireSubmitted);
        geotagx.project.locale.on(geotagx.project.locale.EVENT_LOCALE_CHANGED, onLocaleChanged);
    }
    /**
     * Sets the project's (full) name.
     * @param name the project's name.
     */
    function setName(name){
        name = $.trim(name);
        if (name.length > 0)
            document.querySelector("#project-name > .value").innerHTML = name;
    }
    /**
     * Sets the project's short description.
     * @param description the project's description.
     */
    function setDescription(description){
        var element = document.getElementById("project-description");
        if (element){
            description = $.trim(geotagx.project.locale.inCurrentLocale(description));
            element.innerHTML = description;
            element.style.display = description.length > 0 ? "block" : "none";
        }
    }
    /**
     * Sets the URL to the project's version control system repository.
     * @param url a URL to the repository.
     * @param type the type of version control system used by the project.
     */
    function setRepository(url, type){
        //TODO Implement me.
    }
    /**
     * Sets the user's progress.
     * @param completed the current number of completed tasks.
     * @param total the total number of project tasks.
     */
    function setUserProgress(completed, total){
        document.querySelector("#project-analyses-completed > .count > .completed").innerHTML = completed;
        if (total)
            document.querySelector("#project-analyses-completed > .count > .total").innerHTML = total;
    }
    /**
     * A handler that is called when the questionnaire is submitted.
     */
    function onQuestionnaireSubmitted(_, results, onSubmissionSuccess, onSubmissionError){
        //TODO Complete me.
        // Emulate a submission for debug purposes.
        setTimeout(function(){
            onSubmissionSuccess();
            setTimeout(function(){
                geotagx.project.questionnaire.start();
            }, 1500);
        }, 1000);
    }
    /**
     * A handler that is called when a new locale is selected.
     */
    function onLocaleChanged(){
        setDescription(__configuration__.project.description);
    }
})(window.geotagx = window.geotagx || {}, jQuery);
