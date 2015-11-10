/*
 * The GeoTag-X tour helper.
 */
;(function(geotagx, $, undefined){
    "use strict";

    var api_ = {}; // The tour API.
    var questionnaireTour_ = null;

    /**
     * Returns true if the questionnaire tour ended, false otherwise.
     */
    api_.questionnaireTourEnded = function(){
        return localStorage.getItem("geotagx_questionnaire_tour_end") === "yes";
    };
    /**
     * Starts a questionnaire tour.
     */
    api_.startQuestionnaireTour = function(){
        if (!questionnaireTour_){
            questionnaireTour_ = new Tour({
                name:"geotagx_questionnaire_tour",
                orphan:true,
                steps:[
                    {
                        orphan:true,
                        title:"Welcome!",
                        content:"It seems as though you are new around here. How about we take a tour?<br><small>Note: You can navigate faster by using the <kbd>&#8592;</kbd> and <kbd>&#8594;</kbd> arrow keys.</small>"
                    },
                    {
                        element:"#questionnaire-status-panel",
                        placement:"bottom",
                        title:"The Status Panel",
                        content:"This section provides feedback as you progress through the questionnaire."
                    },
                    {
                        element:"#image-section",
                        placement:"top",
                        title:"The Image",
                        content:"You will be tasked with analysing an image. When you complete an analysis, a new image will be presented to you."
                    },
                    {
                        element:".answer button[value='NotClear']",
                        onShow:prefix,
                        placement:"bottom",
                        title:"Image not clear enough",
                        content:"Certain factors may limit how much information you can take away from an image. For instance, it is almost impossible to deduce the color of the sky from a black and white photo, or discern a person's facial features from a blurry photo. Select this if you can not answer a question based on what you see in the image."
                    },
                    {
                        element:".title",
                        onShow:prefix,
                        placement:"bottom",
                        title:"The Question",
                        content:"This is one of many questions asked about the image to the right. Try to answer it to the best of your capabilities ..."
                    },
                    {
                        element:".help-toggle",
                        onShow:prefix,
                        placement:"bottom",
                        title:"Help!",
                        content:"... but remember, if you are having trouble answering a question, take a look at the help ..."
                    },
                    {
                        element:"#image-source",
                        placement:"left",
                        title:"Image source",
                        content:"... and the image source. More often than not, the source will give you contextual information that may prove to be invaluable."
                    },
                    {
                        element:".answer button[value='Unknown']",
                        onShow:prefix,
                        placement:"bottom",
                        title:"You're only human",
                        content:"Sometimes a question may prove challenging. If you can not answer it, your best bet is to select this answer."
                    }
                ]
            });
            questionnaireTour_.init();
        }
        // Set the tour's initial step so that it always starts from the beginning.
        localStorage.setItem("geotagx_questionnaire_tour_current_step", 0);
        questionnaireTour_.start(true);
    };
    /**
     * Prefixes an element with the current question's selector so that the tour
     * modals can anchor correctly, which also allows the user to interact with
     * the questionnaire while the tour is being taken.
     */
    function prefix(){
        /*jshint validthis:true*/
        var getQuestionPrefix = function(key){ return ".question[data-key='" + key + "'] > "; };
        var selector = this.element;
        var oldKey = this.currentQuestionKey;
        var currentKey = geotagx.questionnaire.getCurrentQuestionKey();
        if (currentKey !== oldKey){
            // Remove the previous parent selector, if it exists.
            if (typeof(oldKey) === "string")
                selector = selector.substring(getQuestionPrefix(oldKey).length);

            // Prefix the element selector with the new parent selector.
            this.element = getQuestionPrefix(currentKey) + selector;
            this.currentQuestionKey = currentKey;
        }
    }

    // Expose the API.
    geotagx.tour = api_;
})(window.geotagx = window.geotagx || {}, jQuery);
