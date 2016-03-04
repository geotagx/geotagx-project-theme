/*
 * A script that manages a GeoTag-X project's locale.
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
    /**
     * The API container.
     */
    var api_ = {};
    /**
     * The project's current locale.
     */
    var currentLocale_ = null;
    /**
     * The element used to select locales.
     */
    var localeSelector_ = null;
    /**
     * Events.
     */
    api_.EVENT_LOCALE_CHANGED = "locale-changed";
    /**
     * Initializes the project's locale.
     * @param configuration the project's locale configuration.
     */
    api_.initialize = function(){
        var configuration = __configuration__.project.locale;

        currentLocale_ = configuration["default"];
        localeSelector_ = document.getElementById("project-locale-selector");

        // If there is more than one locale available, enable the locale selector.
        var availableLocaleIds = Object.keys(configuration.available);
        if (availableLocaleIds.length > 1){
            $(localeSelector_).change(function(e){
                currentLocale_ = e.currentTarget.value; // The current target is the <select> element.
                trigger(api_.EVENT_LOCALE_CHANGED, currentLocale_);
            });

            for (var i = 0; i < availableLocaleIds.length; ++i){
                var localeId = availableLocaleIds[i];
                var localeName = api_.getName(localeId);
                var option = document.createElement("option");
                if (option){
                    option.text = localeName;
                    option.value = localeId;
                    localeSelector_.add(option);
                }
            }
            localeSelector_.value = currentLocale_;

            // The element that contains the selector is hidden by default. Since the selector
            // is functional, display the container (and therefore the selector).
            document.getElementById("project-locale").style.display = "inline";
        }
    };
    /**
     * Attaches an event handler for one or more events.
     */
    api_.on = function(events, handler){
        $(localeSelector_).on(events, handler);
    };
    /**
     * Removes an event handler.
     */
    api_.off = function(events, handler){
        $(localeSelector_).off(events, handler);
    };
    /**
     * Returns the current locale's identifier.
     */
    api_.getCurrentLocale = function(){
        return currentLocale_;
    };
    /**
     * Returns true if a locale with the specified identifier is available, false otherwise.
     * @param localeId a locale identifier.
     */
    api_.isAvailable = function(localeId){
        return localeId in __configuration__.project.locale.available;
    };
    /**
     * Returns the human-readable name of the locale with the specified identifier.
     * @param localeId a locale identifier.
     */
    api_.getName = function(localeId){
        return api_.isAvailable(localeId) ? __configuration__.project.locale.available[localeId] : null;
    };
    /**
     * Returns a translation in the current locale, from a set of translations.
     * @param input an object containing translations, i.e. strings mapped to locales.
     */
    api_.inCurrentLocale = function(input){
        var type = typeof(input);
        if (type === "string")
            return input;
        else if (type === "object" && currentLocale_ in input)
            return input[currentLocale_];
        else
            return null;
    };
    /**
     * Triggers the event with the specified name, and with the given parameters.
     */
    function trigger(name, parameters){
        $(localeSelector_).trigger(name, parameters);
    }

    // Expose the frozen (immutable) API.
    project.locale = Object.freeze(api_);
})(window.geotagx.project, jQuery);
