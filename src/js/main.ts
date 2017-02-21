"use strict";

// TypeScript declarations
declare var $ : any;

// Import main modules

import * as OSSimulator from "./OSSimulator";
import * as Util from "./Util";

/** The content of this file is execute when the document is ready.
 *  It primarily binds event listeners, configures some page elements,
 *  and performs whatever actions are required on load.
 */

// On submit callback
$(document).ready(function() {

    // Global variables
    var desiredBackgroundColour = "#ffffff";
    var desiredBackgroundAlpha  = 1;

    // Configuration
    var consoleScrollbarConfig = {
        scrollButtons:{enable:false},
        theme:"minimal-dark",
        scrollbarPosition:"outside",
        keyboard: {enable:false},
        scrollInertia: 100,
        axis: "y", 
        advanced: { autoExpandHorizontalScroll: true }, 
    };

    var mainScrollbarConfig = $.extend({}, consoleScrollbarConfig);
    mainScrollbarConfig.axis = "yx"; 

    var colourPickerConfig = {
        color: '#ffffff',
        container: true,
        inline: true
    };


    // Bind all events
    (function() {

        // What happens when we click a key
        $(document).keydown(function (e) {

            // If keyboard capture is enabled, focus on input box
            var textEntryElement = document.getElementById("console-input");
            if(OSSimulator.osSimulator.inputCapture() && !e.ctrlKey && !e.altKey && !e.shiftKey && textEntryElement) {
                textEntryElement.focus();
            }
            
            if (e.keyCode == 13) {
                // enter
                OSSimulator.osSimulator.submitInputCallback();
            } else if(e.keyCode == 38) {
                // up arrow
                OSSimulator.osSimulator.upArrow();
                e.preventDefault();
            } else if(e.keyCode == 40) {
                // down arrow
                OSSimulator.osSimulator.downArrow();
                e.preventDefault();
            } else if (e.keyCode == 90 && e.ctrlKey && !e.shiftKey) {
                // ctrl z
                OSSimulator.osSimulator.undo();
                e.preventDefault();
            } else if ((e.keyCode == 90 && e.ctrlKey && e.shiftKey) || (e.keyCode == 89 && e.ctrlKey)) {
                // ctrl y | ctrl shift z
                OSSimulator.osSimulator.redo();
                e.preventDefault();
            }
        });

        function clamp(x, min, max) {
            return Math.min(Math.max(x, min), max);
        }

        // Download canvas button
        document.getElementById('downloadButton').addEventListener('click', function() {
            OSSimulator.osSimulator.downloadCanvasCallback(this, desiredBackgroundColour, desiredBackgroundAlpha);
        }, false);

        // Save commands button
        document.getElementById('saveButton').addEventListener('click', function() {
            OSSimulator.osSimulator.saveCallback(this);
        }, false);

        // Load commands button
        document.getElementById('loadButton').addEventListener('change', function(event : any) {
            OSSimulator.osSimulator.loadCallback(event);
        }, false);

        // Change orientation button
        document.getElementById('orientationButton').addEventListener('click', function() {
            var orientation = OSSimulator.osSimulator.getOrientation() == "vertical" ? "horizontal" : "vertical";
            OSSimulator.osSimulator.setOrientation(orientation);
            $("#orientation-stylesheet").attr("href", "css/" + orientation + ".css");
            $("#console-output").mCustomScrollbar("scrollTo", "bottom");
        });

        function hslString(hsl) {
            return "hsl(" +Math.floor(hsl.h*360) +  "," + Math.floor(hsl.s*100) + "%," + Math.floor(hsl.l*100) + "%)";
        }

        function updateForegroundColour(colour) {
            var rgb = colour.toRGB();
            var hsl = colour.toHSL();
            var ctSecondary = {h: hsl.h, s: hsl.s * 0.8, l: hsl.l * 0.8};
            var luminance =  1 - ( 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b)/255;

            var brightnessOffset = 0.8;
            if(hsl.l > 1 - 0.5)
                brightnessOffset = - brightnessOffset;
            var textBrightness = (hsl.l + brightnessOffset);

            var ctNormal = {h: hsl.h, s: hsl.s, l: textBrightness};
            var ctMuted = {h: ctNormal.h, s: ctNormal.s * 0.8, l: ctNormal.l * 0.9};
            var ctError = {h: 0, s: ctNormal.s, l: ctNormal.l};

            var stylesheetText = `
                body, html {
                    color: ` + hslString(ctNormal) + `
                }
                #console {
                    background-color: ` + hslString(hsl) + `;
                    border-color: ` + hslString(ctSecondary) + `
                }
                .text-info {
                    color: ` + hslString(ctNormal) + `
                }
                .text-muted {
                    color: ` + hslString(ctMuted) + `
                }
                .text-danger {
                    color: ` + hslString(ctError) + `
                }
                .btn-primary, .btn-primary:hover, .btn-primary:active, .btn-primary:visited, .btn-primary:link, .btn-primary:focus, .btn-primary.active {\n
                    background-color: ` + hslString(hsl) + ` !important
                }
                #console-input {
                    background-color: ` + hslString(ctSecondary) + ` !important
                }
                #mainView {
                    border-color: ` + hslString(ctSecondary) + `
                }
            `;

            // Set colours using a custom stylesheet.
            var jStyle = $('#_colour_stylesheet_');
            if(!jStyle.length) {
                var stylesheet : any  = document.createElement('style');
                stylesheet.type = 'text/css';
                stylesheet.id   = '_colour_stylesheet_';
                if(stylesheet.styleSheet){
                    stylesheet.styleSheet.cssText=stylesheetText;
                }else{
                    stylesheet.appendChild(document.createTextNode(stylesheetText));
                }
                document.getElementsByTagName('head')[0].appendChild(stylesheet);
            } else {
                jStyle.html(stylesheetText);
            }
        }

        // When the background colour changes
        $('#bgColourPicker').colorpicker(colourPickerConfig).on('changeColor', function(e) {
            desiredBackgroundColour = e.color.toHex();
            desiredBackgroundAlpha = e.color.toRGB().a;

            // This accounts for transparency
            var hsl = e.color.toHSL();
            hsl.l = hsl.l * desiredBackgroundAlpha + (1-desiredBackgroundAlpha);
            var newLightness = hsl.l;
            var realBackgroundColour = hslString(hsl);

            // Set background to perceptual colour
            $('body')[0].style.backgroundColor = realBackgroundColour;
            $('#mainView')[0].style.backgroundColor = realBackgroundColour;
        });

        // When the foreground colour changes
        $('#fgColourPicker').colorpicker(colourPickerConfig).on('changeColor', function(e) {
            updateForegroundColour(e.color);
        });

        $("#fgColourPicker").colorpicker('setValue', $("#console").css("background-color"));

        // Set console scrollbar
        $("#console-output").mCustomScrollbar(consoleScrollbarConfig);

        // Set main view scrollbar
        $("#mainView").mCustomScrollbar(mainScrollbarConfig);
        
    })();

    // Show help modal
    if(!Util.getParameterByName("hide-help") || Util.getParameterByName("hide-help") != "true") {
        if(window.location.href.indexOf("?") == -1) {
            Util.showHelpModal('window.location.href += "?hide-help=true"');
        } else {
            Util.showHelpModal('window.location.href += "&hide-help=true"');
        }
    }

    // Execute demo commands
    if(Util.getParameterByName("simulate-example") == "true") {
        OSSimulator.osSimulator.simulateCommands([
            "commit 'masterhi'",
            "branch meep",
            "commit -m 'meephii'",
            "commit master 'masterhiii'",
            "branch meep a1",
            "commit 'a1hi'",
            "checkout meep",
            "checkout -b a2",
            "commit -m 'a2hi'",
            "branch meep a3",
            "commit -m 'a3hi'",
            "co meep",
            "branch a4",
            "commit 'a4hi'",
            "commit a3 'a3hi'",
            "commit a2 'a3hi'",
            "co a3",
            "merge a2"
        ]);
    }
});
