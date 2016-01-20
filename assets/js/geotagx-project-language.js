/*
 * A script that adds multi-language support to GeoTag-X projects.
 * Copyright (c) 2016, UNITAR.
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

    project.language = {};

    var database_ = {};
    var defaultLanguage_ = $("html").attr("lang") || "en";
    var initialized_ = false;

    /**
     * Adds a new language.
     */
    project.language.add = function(languageName, isoCode, languageTranslations, isLanguageRightToLeft){
        database_[isoCode] = {
            name:languageName,
            isRightToLeft:isLanguageRightToLeft || false,
            translation:languageTranslations
        };
    };
    /**
     * Extends a pre-existing language.
     */
    project.language.extend = function(isoCode, translations){
        if (!$.isEmptyObject(translations) && isoCode in database_){
            var db = database_[isoCode];
            for (var key in translations)
                db.translation[key] = translations[key];
        }
    };
    /**
     * Returns the ISO 639-1 code of the project's current language.
     * If the internationalization library has not been initialized,
     * the ISO code for the default language ("en") is returned.
     */
    project.language.get = function(){
        return i18n.lng() || defaultLanguage_;
    };
    /**
     * Sets the project's language to the language assigned to the specified ISO 639-1 code.
     * If no such language is found, then the default language is set.
     */
    project.language.set = function(isoCode){
        if (initialized_ === false){
            initialize();
            initialized_ = true;
        }
        if (i18n.lng() !== isoCode){
            if (isoCode in database_){
                i18n.setLng(isoCode, function(){
                    $("[data-i18n]").i18n();

                    var $taskPresenter_ = $("#project-task-presenter-header, #project-task-presenter");
                    if (database_[isoCode].isRightToLeft)
                        $taskPresenter_.addClass("rtl");
                    else
                        $taskPresenter_.removeClass("rtl");
                });
            }
            else
                console.warn("Could not find a language assigned to '" + isoCode + "'. Setting language to '" + defaultLanguage_ + "' (default).");
        }
    };
    /**
     * Returns true if a language is written with a right-to-left script, false otherwise.
     * If the language is not found, false is returned.
     */
    project.language.isRightToLeft = function(isoCode){
        return isoCode in database_ && database_[isoCode].isRightToLeft;
    };
    /**
     * Initializes the internationalization library.
     */
    function initialize(){
        i18n.init({
            lng:defaultLanguage_,
            fallbackLng:defaultLanguage_,
            resStore:database_
        });
    }
})(window.geotagx.project, jQuery);
