/*
 * A script that adds multi-language support to GeoTag-X projects.
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

    var EVENT_QUESTIONNAIRE_STARTED = "questionnaire-started";
    var EVENT_QUESTIONNAIRE_COMPLETED = "questionnaire-completed";
    var EVENT_QUESTIONNAIRE_REWOUND = "questionnaire-rewound";
    var EVENT_QUESTION_CHANGED = "question-changed";
    var EVENT_QUESTION_ANSWERED = "question-answered";
    var EVENT_LOCALE_CHANGED = "locale-changed";

    //TODO Document variables.
    var api_ = {};
    var index_ = null;
    var questions_ = null;
    var answers_ = null;
    var initialQuestion_ = null;
    var progressStack_ = null;
    var currentLocaleId_ = null;
    var locales_ = null;
    var $questionnaire_ = null;
    var $answerButtons_ = null;
    var $rewindButton_ = null;
    var $progressBar_ = null;
    var $percentageComplete_ = null;

    /**
     * Initializes the questionnaire from the specified configuration.
     * @param configuration a project's task presenter configuration.
     * @param onInitialized a function that is called when the questionnaire has been successfully initialized.
     * @param onError a function that is called when the questionnaire failed to initialize correctly.
     */
    api_.initialize = function(configuration){
        index_ = configuration.questionnaire.index;
        questions_ = configuration.questionnaire.questions;
        initialQuestion_ = questions_[0];
        currentLocaleId_ = configuration.locale["default"];
        locales_ = configuration.locale.available;
        $questionnaire_ = $("#questionnaire");
        $answerButtons_ = $("#question-answer-buttons > .btn");
        $rewindButton_ = $("#questionnaire-rewind");
        $progressBar_ = $("#questionnaire-progress-bar");
        $percentageComplete_ = $("#questionnaire-percentage-complete");

        // Initialize the set of questionnaire answers.
        answers_ = {};
        for (var i = 0; i < questions_.length; ++i){
            var key = questions_[i].key;
            answers_[key] = null;
        }

        // Set up various event handlers.
        $rewindButton_.click(function(){ api_.showPreviousQuestion(); });
        $answerButtons_.click(onQuestionAnswered);
        $questionnaire_.on(EVENT_QUESTION_ANSWERED, function(_, key, answer){ api_.showNextQuestion(answer); });
        $("#dropdown-list-field").change(function(){ document.getElementById("dropdown-list-field-reset").disabled = false; });
        $("#dropdown-list-field-reset").click(function(){ document.getElementById("dropdown-list-field").selectedIndex = 0; this.disabled = true; });


        api_.on(EVENT_QUESTIONNAIRE_COMPLETED, function(){ console.log(answers_); }); // For debug purposes.

        return true;
    };
    /**
     * Starts the questionnaire from the question with the specified key.
     * If no key is given, the questionnaire begins at the first question
     * defined in the project configuration.
     * @param key a question key.
     */
    api_.start = function(key){
        // Reset the progress stack and answer set.
        progressStack_ = [];
        for (var k in answers_){
            if (answers_.hasOwnProperty(k))
                answers_[k] = null;
        }

        if (key && api_.keyExists(key))
            initialQuestion_ = api_.getQuestion(key);

        showQuestion(initialQuestion_);

        trigger(EVENT_QUESTIONNAIRE_STARTED);
    };
    /**
     * Ends the questionnaire.
     */
    api_.finish = function(){
        $progressBar_.css("width", "100%");
        $percentageComplete_.data("value", 100);
        $percentageComplete_.html("100%");

        trigger(EVENT_QUESTIONNAIRE_COMPLETED);
    };
    /**
     * Returns the number of questions in the questionnaire.
     */
    api_.getLength = function(){
        return questions_.length;
    };
    /**
     * Returns the answer to the question with the specified key.
     * @param key a question key.
     */
    api_.getAnswer = function(key){
        return key in answers_ ? answers_[key] : null;
    };
    /**
     * Returns the current set of questionnaire answers.
     */
    api_.getAnswers = function(){
        return answers_;
    };
    /**
     * Returns true if the specified key exists in the questionnaire's index, false otherwise.
     * @param key a question key.
     */
    api_.keyExists = function(key){
        return key && typeof(key) === "string" && key in index_;
    };
    /**
     * Returns the question with the specified key or null if none is assigned to the key.
     * @param key the question key.
     */
    api_.getQuestion = function(key){
        return api_.keyExists(key) ? questions_[index_[key]] : null;
    };
    /**
     * Returns the current question or null if none has been set yet.
     */
    api_.getCurrentQuestion = function(){
        var index = progressStack_.length > 0 ? progressStack_[progressStack_.length - 1] : null;
        return index !== null ? questions_[index] : null;
    };
    /**
     * Returns the previous question or null if none exists.
     */
    api_.getPreviousQuestion = function(){
        var index = progressStack_.length > 1 ? progressStack_[progressStack_.length - 2] : null;
        return index !== null ? questions_[index] : null;
    };
    /**
     * Returns the next question based on the answer to the specified one.
     * If no question is specified, then the current question is used.
     * @param answer the answer to the specified question.
     */
    api_.getNextQuestion = function(answer, question){
        question = question || api_.getCurrentQuestion();

        var nextQuestionIndex = -1;
        var branch = question.branch || null;
        if (branch !== null){
            var STRICT = 0;
            var CONDITIONAL = 1;

            var branchType = typeof(branch) === "object" ? CONDITIONAL : typeof(branch) === "string" ? STRICT : undefined;
            if (branchType === STRICT)
                nextQuestionIndex = index_[branch];
            else if (branchType === CONDITIONAL && answer !== null){
                answer = $.trim(answer).toLowerCase(); // toLowerCase for case-insensitive string comparisons.

                // Binary questions are a bit special: if the user clicks "I Don't Know" or "Subject Not Clear"
                // and neither of these answers has been explicitly specified as a branching condition, the
                // answer is assumed to be "No".
                if (question.type === "binary" && !(answer in branch) && answer !== "yes")
                    answer = "no";

                if (answer in branch){
                    var nextQuestionKey = branch[answer];
                    nextQuestionIndex = index_[nextQuestionKey];
                }
            }
        }
        // If the next question's index is still -1, then no branching directive was set.
        // In such a case, the next question is the successor to the current question.
        if (nextQuestionIndex === -1)
            nextQuestionIndex = index_[question.key] + 1;

        return nextQuestionIndex < questions_.length ? questions_[nextQuestionIndex] : null;
    };
    /**
     * Displays the question with the specified key.
     * @param key a question key.
     */
    api_.showQuestion = function(key){
        var question = api_.getQuestion(key);
        if (question !== null)
            showQuestion(question);
    };
    /**
     * Displays the previous question.
     */
    api_.showPreviousQuestion = function(){
        // We can only show the previous question if at least one question has been answered.
        if (progressStack_.length > 1){
            // Before showing the previous question, the answer to the current question should be deleted
            // since the questionnaire's flow may change based on the answer to the previous question.
            // Keeping the answer to the current question will create an invalid answer set.
            // However, if the previous question was the last (the questionnaire is 100% complete), there's
            // no need to delete anything.
            if ($percentageComplete_.data("value") !== 100){
                answers_[api_.getCurrentQuestion().key] = null;
                progressStack_.pop();
            }
            // At this point, the index at the top of the progress stack belongs to the previous question,
            // however said question is not yet shown. Before it can be shown, its index needs to be popped from the
            // progress stack because the 'showQuestion' function will push the same index onto the stack again,
            // creating a duplicate.
            var previousQuestion = api_.getCurrentQuestion();
            progressStack_.pop();
            showQuestion(previousQuestion);

            trigger(EVENT_QUESTIONNAIRE_REWOUND);
        }
    };
    /**
     * Displays the next question based on the answer to the current question.
     * @param answer the answer to the current question.
     */
    api_.showNextQuestion = function(answer){
        var nextQuestion = api_.getNextQuestion(answer);
        if (nextQuestion !== null)
            showQuestion(nextQuestion);
        else
            api_.finish();
    };
    /**
     * Returns true if the questionnaire is available in the specified locale, false otherwise.
     * @param localeId a locale identifier.
     */
    api_.isLocaleAvailable = function(localeId){
        return localeId in locales_;
    };
    /**
     * Returns the current locale's identifier.
     */
    api_.getLocaleIdentifier = function(){
        return currentLocaleId_;
    };
    /**
     * Returns the human-readable name of the locale with the specified identifier.
     * @param localeId a locale identifier.
     */
    api_.getLocaleName = function(localeId){
        return api_.isLocaleAvailable(localeId) ? locales_[localeId] : null;
    };
    /**
     * Sets the questionnaire's locale.
     * @param locale the locale identifier.
     */
    api_.setLocale = function(localeId){
        if (api_.isLocaleAvailable(localeId)){
            currentLocaleId_ = localeId;
            updateQuestionContent(api_.getCurrentQuestion(), localeId);

            trigger(EVENT_LOCALE_CHANGED, currentLocaleId_);
        }
    };
    /**
     * Attaches an event handler for one or more events to the questionnaire.
     */
    api_.on = function(events, handler){
        $questionnaire_.on(events, handler);
    };
    /**
     * Removes an event handler.
     */
    api_.off = function(events, handler){
        $questionnaire_.off(events, handler);
    };
    /**
     * Displays the specified question.
     * @param question the question to display.
     */
    function showQuestion(question){
        if (question){
            var key = question.key;
            var type = question.type;

            $("#question")
            .data("key", key)
            .attr("data-type", type); // Why .attr() instead of .data()? See https://stackoverflow.com/q/7458649

            var hasHint = "hint" in question;
            var hasHelp = "help" in question;
            $("#question-assistance").toggleClass("hide", !hasHint && !hasHelp);
            $("#question-hint").toggleClass("hide", !hasHint);
            $("#question-more-help").toggleClass("hide", !hasHelp);

            var questionIndex = index_[key];
            progressStack_.push(questionIndex);

            // Update the progress bar (and rewind button state).
            var percentage = Math.max(0, Math.min(100, ((questionIndex / questions_.length) * 100).toFixed(0)));
            $progressBar_.css("width", percentage + "%");
            $percentageComplete_.data("value", percentage);
            $percentageComplete_.html(percentage + "%");
            $rewindButton_.attr("disabled", progressStack_.length < 2);

            // Build the input fields, if need be.
            var parameters = question.parameters;
            switch (type){
                case "dropdown-list":
                    buildDropdownListField(key, parameters);
                    break;
                case "select":
                    buildSelectField(key, parameters);
                    break;
                case "checklist":
                    buildChecklistField(key, parameters);
                    break;
                case "illustrative-checklist":
                    buildIllustrativeChecklistField(key, parameters);
                    break;
                case "geolocation":
                    buildGeolocationField(key, parameters);
                    break;
                default:
                    break;
            }

            // When all required HTML elements have been built, content is added to them.
            updateQuestionContent(question, currentLocaleId_);

            trigger(EVENT_QUESTION_CHANGED);
        }
    }
    /**
     * Builds the question's 'dropdown-list' input field.
     * @param key a question key.
     * @param parameters a set of question parameters.
     */
    function buildDropdownListField(key, parameters){
        var element = document.getElementById("dropdown-list-field");
        var storageKey = "dropdown-list-field-for-" + key;
        var html = sessionStorage.getItem(storageKey); // Has the HTML been cached?
        if (html === null){
            html = '<option name="' + key + '" role="prompt" selected disabled></option>';
            for (var i = 0; i < parameters.options.length; ++i){
                var option = parameters.options[i];
                html += '<option name="' + key + '" value="' + option.value + '"></option>';
            }
            sessionStorage.setItem(storageKey, html);
        }
        element.innerHTML = html;
    }
    /**
     * Builds the question's 'select' input field.
     * @param key a question key.
     * @param parameters a set of question parameters.
     */
    function buildSelectField(key, parameters){
        var storageKey = "select-field-for-" + key;
        var html = sessionStorage.getItem(storageKey);
        if (html === null){
            html = "";
            for (var i = 0; i < parameters.options.length; ++i){
                var option = parameters.options[i];
                html += '<label><input type="radio" name="' + key + '" value="' + option.value + '"><span role="label-name"></span></label><br>';
            }
            sessionStorage.setItem(storageKey, html);
        }
        document.querySelector("#select-field > section.custom-labels").innerHTML = html;
        document.querySelector('#select-field > label[role="other-option"] > input[type="radio"]').setAttribute("name", key);
    }
    /**
     * Builds the question's 'checklist' input field.
     * @param question a question instance.
     */
    function buildChecklistField(key, parameters){
        var storageKey = "checklist-field-for-" + key;
        var html = sessionStorage.getItem(storageKey);
        if (html === null){
            html = "";
            for (var i = 0; i < parameters.options.length; ++i){
                var option = parameters.options[i];
                html += '<label><input type="checkbox" name="' + key + '" value="' + option.value + '"><span role="label-name"></span></label><br>';
            }
            sessionStorage.setItem(storageKey, html);
        }
        document.querySelector("#checklist-field > section.custom-labels").innerHTML = html;
        document.querySelector('#checklist-field > label[role="other-option"] > input[type="checkbox"]').setAttribute("name", key);
    }











    /**
     * Updates the textual content of the HTML node that contains the question.
     * Note that no HTML elements are added, removed or hidden; only modified.
     */
    function updateQuestionContent(question, locale){
        var title = question.title[locale];
        $("#question-title").html(title);

        var hint = question.hint ? question.hint[locale] : null;
        if (hint !== null)
            document.getElementById("question-hint").innerHTML = hint;

        var help = question.help ? question.help[locale] : null;
        if (help !== null){
            document.getElementById("question-help-modal-title").innerHTML = title;
            document.getElementById("question-help-modal-content").innerHTML = help;
        }

        switch (question.type){
            case "dropdown-list":
                updateDropdownListField(question.key, question.parameters, currentLocaleId_);
                return;
            case "select":
            case "checklist":
                updateMultipleChoiceField(question.type, question.key, question.parameters, currentLocaleId_);
                return;
            default:
                return;
        }
    }
    /**
     * Updates a dropdown list field.
     * @param key a question key.
     * @param parameters the input's parameters.
     * @param locale a locale identifier.
     */
    function updateDropdownListField(key, parameters, locale){
        var prompt = "Please select an item"; // FIXME parameters.prompt
        var options = parameters.options;
        var nodes = document.getElementById("dropdown-list-field").children;

        // Note: the first node is reserved for the prompt.
        nodes[0].innerHTML = prompt;
        for (var i = 0; i < options.length; ++i)
            nodes[i + 1].innerHTML = options[i].label[locale];
    }
    /**
     * Updates a multiple choice field, i.e. select (multiple choice, single response) or checklist (multiple choice, multiple response).
     * @param type a question type.
     * @param key a question key.
     * @param parameters the input's parameters.
     * @param locale a locale identifier.
     */
    function updateMultipleChoiceField(type, key, parameters, locale){
        for (var i = 0; i < parameters.options.length; ++i){
            var option = parameters.options[i];
            var selector = '#' + type + '-field > section.custom-labels > label > input[value="' + option.value + '"] + span[role="label-name"]';
            document.querySelector(selector).innerHTML = option.label[locale];
        }
    }
    /**
     *
     */
    function onQuestionAnswered(event){
        var question = api_.getCurrentQuestion();
        var type = question.type;
        var answer = event.currentTarget.value;
        if (answer === "OK"){
            // In cases where the answer is "OK", the answer will depend on the question type
            // which could be a dropdown list, checklist, or illustrative checklist input, etc.
            switch (type){
                case "url":
                case "text":
                case "longtext":
                    answer = $.trim(document.getElementById(type + "-field").value);
                    answer = answer.length > 0 ? answer : null;
                    break;
                case "number":
                    answer = parseFloat($.trim(document.getElementById("number-field").value));
                    answer = !isNaN(answer) && isFinite(answer) ? answer : null;
                    break;
                case "dropdown-list":
                    var selectedItem = document.querySelector("#dropdown-list-field > option:checked:not(:disabled)");
                    answer = selectedItem !== null ? $.trim(selectedItem.value) : "None";
                    break;
                case "select":
                case "checklist":
                    answer = "";
                    var inputs = document.querySelectorAll('#' + type + '-field input[name="' + question.key + '"]:checked');
                    if (inputs && inputs.length > 0){
                        for (var i = 0; i < inputs.length; ++i){
                            var input = inputs[i];
                            var value = $.trim(input.value);
                            if (value.length > 0){
                                answer += ", " + value;
                                if (value === "Other"){
                                    var otherText = $.trim($(input).siblings('input[type="text"]').val());
                                    if (otherText.length > 0)
                                        answer += "[" + otherText + "]";
                                }
                            }
                        }
                        answer = answer.substring(2); // Remove the leading comma and whitespace.
                    }
                    answer = answer.length > 0 ? answer : "None";
                    break;
                default:
                    break;
            }
        }
        var errors = validateAnswer(answer, type);
        if (errors === null){
            answers_[question.key] = answer;
            trigger(EVENT_QUESTION_ANSWERED, [question.key, answer]);
        }
    }
    /**
     * Validates the specified answer.
     * If no errors are found, null is returned, otherwise a string containing an error message is returned.
     * @param answer an answer to validate.
     * @param type a type of question used to determine the validator.
     */
    function validateAnswer(answer, type){
        //TODO Implement me.
        return null;
    }
    /**
     * Triggers the event with the specified name, and with the given parameters.
     */
    function trigger(name, parameters){
        $questionnaire_.trigger(name, parameters);
    }

    // Expose the API.
    project.questionnaire = api_;
})(window.geotagx.project, jQuery);
