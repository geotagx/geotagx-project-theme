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
    /**
     * The project's current locale.
     */
    var currentLocale_ = null;


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
        initializeLocale();
        setProjectName("Project Interface Mockup");
        setProjectDescription("This is a short reminder of why your contribution matters.");
        initializeUserProgress();


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
    /**
     * Sets the project's (full) name.
     * @param name the project's name.
     */
    function setProjectName(name){
        name = $.trim(name);
        if (name.length > 0)
            document.querySelector("#project-name > .value").innerHTML = name;
    }
    /**
     * Sets the project's short description.
     * @param description the project's description.
     */
    function setProjectDescription(description){
        description = $.trim(description);
        if (description.length > 0)
            document.getElementById("project-description").innerHTML = description;
    }
    /**
     * Initializes the project's locale.
     */
    function initializeLocale(){
        var configuration = configurations["task-presenter"]["locale"];

        // If there is more than one locale available, enable the locale selector.
        var availableLocales = Object.keys(configuration.available);
        if (availableLocales.length > 1){
            document.getElementById("project-locale").style.display = "inline";

            var selector = document.getElementById("project-locale-selector");
            for (var i = 0; i < availableLocales.length; ++i){
                var localeId = availableLocales[i];
                var localeName = configuration.available[localeId];
                var option = document.createElement("option");
                option.text = localeName;
                option.value = localeId;
                selector.add(option);
            }
            $(selector).change(onLocaleChanged);
        }
        currentLocale_ = configuration["default"];
    }
    /**
     * A handler that is called when a new locale is selected.
     */
    function onLocaleChanged(event){
        currentLocale_ = event.currentTarget.value; // The current target is the <select> element.

        geotagx.project.questionnaire.setLocale(currentLocale_);

        // TODO Complete me.
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
     * Sets the user's progress.
     * @param completed the current number of completed tasks.
     * @param total the total number of project tasks.
     */
    function setUserProgress(completed, total){
        document.querySelector("#project-analyses-completed > .count > .completed").innerHTML = completed;
        if (total)
            document.querySelector("#project-analyses-completed > .count > .total").innerHTML = total;
    }


})(window.geotagx = window.geotagx || {}, jQuery);
