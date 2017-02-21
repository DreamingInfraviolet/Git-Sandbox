"use strict";
import * as InputParsing from "./InputParsing";
import * as InputConsole from "./InputConsole";
import * as GitGraphManager from "./GitGraphManager";
import * as Util from "./Util";
declare var $ : any;

/** A helper class to simulate some basic OS and management tasks. */
export class OSSimulator {

    private console = new InputConsole.InputConsole();
    private gitManager = new GitGraphManager.GitGraphManager();

    /** Destroys the git graph. */
    destroyGraph() {
        this.gitManager.clear();
    }

    /** Attempts to execute a non-git command.
     * @param command The command object to execute.
     * @return null if this is not an OS command. Otherwise returns the command output.
     */
    tryExecuteOsCommand(command : InputParsing.Command) {
        switch(command.type) {
            case InputParsing.CommandType.none:
                return "";
            case InputParsing.CommandType.help:
                Util.showHelpModal();
                return "";
            case InputParsing.CommandType.clear:
                this.console.clearOutput();
                return "";
            case InputParsing.CommandType.undo:
                this.gitManager.undo();
                return "";
            case InputParsing.CommandType.redo:
                this.gitManager.redo();
                return "";
            default:
                // We could not handle this command
                return null;
        }
    }

    /** A callback to be executed when the user presses Enter to submit their input. */
    submitInputCallback() {
        let output = null;

        try {
            // Get and clean input
            var input = this.console.inputText().trim();
            if(input == "")
                return;

            // Replace user input with cleaned version and submit in console
            this.console.setInput(input);
            this.console.submitText();

            // Parse command syntax
            var parsedInputRes : any = InputParsing.parseInput(input);
            if(!parsedInputRes.success)
                throw parsedInputRes.message;
            
            // Extract the command for type checking
            var command : InputParsing.Command = parsedInputRes.command;

            // parse command semantics
            output = this.tryExecuteOsCommand(command);
            if(output !== null) {
                // If this is an OS command, don't bother git manager
            } else {
                // This is a git command. Bother git manager :)
                var gitExeResult = this.gitManager.execute(command);
                
                if(gitExeResult.success) {
                    output = gitExeResult.message;
                } else {
                    throw gitExeResult.message;
                }
            } 
        } catch(e) {
            output = "<span class='text-danger'>Error: " + e + "</span>";
        }

        output = output || "";
        if(output.length > 0)
            this.console.print("<span class='text-info'>" + output + "</span>");
    }

    /** A callback to be executed when the user wishes to capture the graph image. */
    downloadCanvasCallback(that, desiredBackgroundColour, desiredBackgroundAlpha) {
        // Get variables
        var canvas = <HTMLCanvasElement>document.getElementById('gitGraph');

        // Create temporary canvas
        var destinationCanvas = <HTMLCanvasElement>document.createElement("canvas");
        destinationCanvas.width = canvas.width;
        destinationCanvas.height = canvas.height;
        var destinationContext = destinationCanvas.getContext("2d");

        // create a rectangle with the desired color
        var backgroundColour = desiredBackgroundColour;
        destinationContext.fillStyle = backgroundColour;
        destinationContext.globalAlpha = desiredBackgroundAlpha;
        destinationContext.fillRect(0,0,canvas.width,canvas.height);
        destinationContext.globalAlpha = 1;
        
        // draw the original canvas onto the destination canvas
        destinationContext.drawImage(canvas, 0, 0);

        that.href = destinationCanvas.toDataURL("image/png");
        that.download = "GitGraph.png";
    }

    /** A callback to save the git command text. */
    saveCallback(that) {
        that.href = 'data:text/html,' + encodeURIComponent(this.gitManager.getGitCommands());
        that.download = "commands.txt";
    }

    /** A callback to load git commands. */
    loadCallback(event) {
        if(!FileReader) {
            Util.showGenericModal("Error", "Your browser does not support HTML5 file reading.");
            return;
        }
        var file = event.target.files[0];
        if (!file) {
            return;
        }

        var reader = new FileReader();
        reader.onload = (function(that : OSSimulator) {
                return function(e : any) {
                var contents : string = e.target.result;
                var lines = contents.split("\n");
                that.destroyGraph();
                that.simulateCommands(lines);
            };
        })(this);
        reader.readAsText(file);
    }

    /** Simulates a number of commands by inserting them into the console and submitting. */
    simulateCommands(commandList) {
        commandList.forEach((function(that : OSSimulator) { return function(value) {
            that.console.setInput(value);
            that.submitInputCallback();
        }})(this));
    }

    /** Interface methods */
    inputCapture() {
        var modalIsShown = $("#genericModal").css("display") != "none";
        var sweetAlertIsShown = $(".sweet-alert").length > 0 && $(".sweet-alert").css("display") != "none";
        return !(modalIsShown || sweetAlertIsShown);
    }

    upArrow() {
        return this.console.upArrow();
    }

    downArrow() {
        return this.console.downArrow();
    }

    undo() {
        return this.gitManager.undo();
    }

    redo() {
        return this.gitManager.redo();
    }

    setOrientation(orientation : string) {
        return this.gitManager.setOrientation(orientation);
    }

    getOrientation() {
        return this.gitManager.getOrientation();
    }
}

export var osSimulator = new OSSimulator();