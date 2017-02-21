"use strict";
declare var $ : any;

/** Helps managing the input/output console view. */
export class InputConsole {

    private inputElement;
    private outputElement;
    private outputElementContainer;
    private history = [];
    private historyScrollIndex = 0;


    /** Sets major jquery selectors. */
    constructor() {
        this.inputElement = $("#console-input");
        this.outputElementContainer = $("#console-output");
        this.outputElement = $("#console-output-start");
        this.clearOutput();
    }

    /** Outputs some text to the console */
    print(text : string) : void {
        text = text.trim();
        if(text.length == 0)
            return;
        this.outputElement.append("<div class='console-output-entry'>" + text + "</div>");
        this.outputElementContainer.mCustomScrollbar("scrollTo", "bottom");
    }
    
    /** Clears the entered user input */
    clearInput() : void {
        this.inputElement.val("");
    }

    /** Clears all existing output */
    clearOutput() : void {
        $(".console-output-entry").remove();
    }

    /** Sets the user input */
    setInput(str : string) : void {
        this.inputElement.val(str);
    }

    /** Returns the user input text */
    inputText() : string {
        return this.inputElement.val();
    }

    /** Submits the currently entered user input */
    submitText() : void {
        var input = this.inputText().replace(/<(?:.|\n)*?>/gm, '');
        this.clearInput();

        // If we are using the up arrow to browse history, don't add a duplicate history entry. Move instead.
        if(this.historyScrollIndex < this.history.length) {
            this.history.splice(this.historyScrollIndex, 1);
        }

        this.history.push(input);
        this.historyScrollIndex = this.history.length;

        if(input != "clear")
            this.print("<span class='text-muted'>" + input + "</span>");
    }

    /** Scrolls to the previously entered command */
    upArrow() : void {
        this.historyScrollIndex = Math.max(0,  this.historyScrollIndex - 1);
        this.inputElement.val(this.history[this.historyScrollIndex]);
    }

    /** Scrolls to the more recently entered command */
    downArrow() : void {
        this.historyScrollIndex = Math.min(this.history.length, this.historyScrollIndex + 1);
        if(this.historyScrollIndex == this.history.length) {
            this.clearInput();
        } else {
            this.setInput(this.history[this.historyScrollIndex]);
        }
    }
}