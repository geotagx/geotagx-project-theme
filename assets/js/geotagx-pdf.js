/*
 * The GeoTag-X PDF helper.
 *
 * Author: S.P. Mohanty.
 */
;(function(geotagx, $, undefined){
    "use strict";
    /**
     * Instantiate a PDF object on the HTML element with the specified id.
     */
    var PDF = function(id, options){
        this.frame = document.getElementById(id);
        this.frame.style.overflow = "hidden";

        this.busyIcon = this.frame.appendChild(document.createElement("i"));
        this.busyIcon.className = "fa fa-3x fa-cog fa-spin";
        this.busyIcon.style.color = "#FFF";
        this.busyIcon.style.position = "absolute";
        this.busyIcon.style.display = "none";

        //Configure the PDF iframe object here
        this.pdf = this.frame.appendChild(document.createElement("iframe"));
        this.pdf.width="100%";
        this.pdf.height="600px";
        this.pdf.viewer_url = "http://mozilla.github.io/pdf.js/web/viewer.html";
        this.pdf.default_zoom = "page-width";
    };
    /**
     * Returns the URL to the image.
     */
    PDF.prototype.getSource = function(){
        return this.pdf.file_url;
    };
    /**
     * Sets the image source, i.e. the URL to the image.
     */
    PDF.prototype.setSource = function(source){
        if ($.type(source) !== "string")
            return;

        this.pdf.file_url = source;
        this.pdf.src = this.pdf.viewer_url+"?"+"file="+encodeURIComponent(this.pdf.file_url)+"#"+"zoom="+this.pdf.default_zoom;
    };
    geotagx.PDF = PDF;
})(window.geotagx = window.geotagx || {}, jQuery);
