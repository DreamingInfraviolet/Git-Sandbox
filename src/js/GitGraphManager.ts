"use strict";
import * as InputParsing from "./InputParsing";
import * as Util from "./Util";
import * as OSSimulator from "./OSSimulator";
declare var $ : any;
declare function GitGraph(json): void;
declare var swal : any;

/** This is a class to handle the git graph and semantics. */
export class GitGraphManager {

    gitgraph = null;
    branches = [];
    gitCommandHistory = [];
    redoStack = [];
    currentBranch = null;
    
    /** Default gitgraph.js template */
    gitGraphTemplate = {
        colors: ["#ff7a00", "#9786CF", "#34D1B4", "#E6578C", "#00ADDB"],
        branch: {
            lineWidth: 10,
            spacingX: 50,
            showLabel: true,
            labelFont: "normal 11pt Arial",
        },
        commit: {
            spacingY: -60,
            dot: {
                size: 14
            },
            message: {
                font: "normal 14pt Arial",
            },
        },
        message: {
            displayAuthor: true,
            displayBranch: false,
            displayHash: false,
            font: "normal 12pt Arial"
        },
    };

    /** Default gitgraph.js options */
    gitGraphOptions = {
        template: this.gitGraphTemplate,
        orientation: "vertical",
    };

    /** Default gitgraph.js commit template */
    commitTemplate = {
        author: "Chuck Norris <gmail@chucknorris.com>",
        message: "My Commit",
        onClick: (function(that : GitGraphManager) {
            /** If we click on a commit, do something. */
            return function(commit) {
                if(commit.branch.commits.length < 2 || (commit.branch.commits.slice(-1)[0] == commit)) {
                    // If this was a leaf (branch has <2 commits or commit == branch head), commit

                    // Prompt user input
                    swal.setDefaults({confirmButtonColor: commit.branch.color});
                    swal({
                        title: "Commit",
                        type: "input",
                        showCancelButton: true,
                        inputPlaceholder: "Message",
                    },
                    (function(branch, manager) { return function(text) {

                        // Process text
                        if(text !== false) {
                            var cmd = new InputParsing.Command();
                            cmd.type = InputParsing.CommandType.commit;
                            cmd.message = text;
                            cmd.branchA = branch;
                            that.execute(cmd);
                        }

                    }})(commit.branch.name, that));
                } else {
                    //Else, this is not a leaf.
                }
            }
        })(this),
    }

    /** Clear the graph and initialise anew. */
    constructor() {
        this.clear();
    }

    setOrientation(orientation : string) {
        if(orientation != this.gitGraphOptions.orientation) {
            this.gitGraphOptions.orientation = orientation;
            this.redraw();
        }
    }

    getOrientation() {
        return this.gitGraphOptions.orientation;
    }

    /** Execute an array of commands. */
    execute(command : InputParsing.Command) : {success: boolean, message: string} {

        var successMsg = "";

        try {
            switch(command.type) {
                case InputParsing.CommandType.destroy:
                    this.clear();
                    successMsg = "Graph was destroyed.";
                break;
                case InputParsing.CommandType.commit:
                    var commitBranch : string = command.branchA || this.currentBranch.name;
                    this.commit(commitBranch, command.message);
                break;
                case InputParsing.CommandType.mergeToSelf:
                    this.merge(command.branchA, this.currentBranch.name);
                break;
                case InputParsing.CommandType.mergeAB:
                    this.merge(command.branchA, command.branchB);
                break;
                case InputParsing.CommandType.checkoutExisting:
                    this.checkoutExisting(command.branchA);
                case InputParsing.CommandType.status:
                case InputParsing.CommandType.branchShowCurrent:
                    successMsg = "On branch '" + this.currentBranch.name + "'";
                break;
                case InputParsing.CommandType.branchNewAB:
                    this.checkoutNew(command.branchA || this.currentBranch.name, command.branchB);
                    this.checkoutExisting(command.branchB);
                    successMsg = "On branch '" + this.currentBranch.name + "'";
                break;
                default:
                    throw "Unknown git command + '" + command.str + "'.";
            }
        } catch(e) {
            return {success:false, message: e};
        }

        this.gitCommandHistory.push(command);
        this.redoStack = [];
        return {success:true, message: successMsg};
    }

    /** Undo the previous command */
    undo() {
        if(this.gitCommandHistory.length > 0) {
            var newRedoStack = this.redoStack;
            newRedoStack.push(this.gitCommandHistory.pop());
            this.redraw();
            this.redoStack = newRedoStack;
        }
    }

    /** Redo the previous command */
    redo() {
        if(this.redoStack.length > 0) {
            var newRedoStack = this.redoStack;
            this.gitCommandHistory.push(newRedoStack.pop());
            this.redraw();
            this.redoStack = newRedoStack;
        }
    }

    /** Returns the array index of a branch name. */
    private indexOfBranch(name : string) : number {
        for(var i = 0; i < this.branches.length; ++i)
            if(this.branches[i].name == name)
                return i;
        return -1;
    }

    /** Returns the branch object by name. */
    private getBranch(name : string) {
        var index = this.indexOfBranch(name);
        if(index < 0)
            throw "Branch '" + name + "' does not exist.";
        return this.branches[index];
    }

    /** Creates a new commit. */
    private commit(branch : string, message : string) {
        var template = $.extend({}, this.commitTemplate);
        template.message = message || template.message;
        var b = this.getBranch(branch);
        
        if(b.parentBranch && b.parentBranch.commits.length == 0) {
        swal.setDefaults({confirmButtonColor: "#FF7A00"});
            swal({
                title: "Warning",
                text: "Due to a bug in gitgraph, a commit on a branch whose parent does not have a commit will result"
                    + " in incorrect drawing. Please commit on the parent branch first.",
                type: "error",
            });
        }
        else
            b.commit(template);

        if(this.gitgraph.orientation == "vertical")
            $("#mainView").mCustomScrollbar("scrollTo", "bottom");
        else if(this.gitgraph.orientation == "horizontal")
            $("#mainView").mCustomScrollbar("scrollTo", "right");
        $("#mainView").mCustomScrollbar("update");
    }

    /** Checks out an existing branch */
    private checkoutExisting(branch : string) {
        this.currentBranch = this.getBranch(branch);
        $("#current-branch").text("On branch " + this.currentBranch.name);
    }

    /** Creates a new branch */
    private checkoutNew(source : string, branch : string) {
        if(this.indexOfBranch(branch) > 1)
            throw "A branch with the name '" + branch + "' already exists.";
        var newBranch = this.getBranch(source).branch(branch);
        this.branches.push(newBranch);
    }

    /** Merges the source branch into the destination branch. */
    private merge(source : string, target : string) {
        var bSource = this.getBranch(source);
        var bTarget = this.getBranch(target);

        var template = $.extend({}, this.commitTemplate);
        template.message = "Merged branch '" + bSource.name + "' into '" + bTarget.name + "'";
        bSource.merge(bTarget, template);
    }

    /** Destroys the graph. */
    clear() : void {
        if(this.gitgraph)
            delete this.gitgraph;

        // Remove event listeners
        $(".gitgraph-tooltip").remove();
        var el = document.getElementById("gitGraph");
        var elClone = el.cloneNode(true);
        el.parentNode.replaceChild(elClone, el);

        this.gitgraph = new GitGraph(this.gitGraphOptions);
        this.gitgraph.template.branch.labelRotation = 0;
        this.branches = [];
        this.gitCommandHistory = [];
        this.redoStack = [];
        this.currentBranch = this.gitgraph.branch("master");
        this.branches.push(this.currentBranch);
        this.commit(this.currentBranch.name, "Initial commit.");
    }

    /** Redraws the graph from history. */
    redraw() : void {
        var history = this.gitCommandHistory;
        this.clear();
        for(var i = 0; i < history.length; ++i)
            this.execute(history[i]);
    }

    /** Returns an optimised list of git commands that can be repeated to recreate the graph. */
    getGitCommands() : string {
        // Convert command objects into real git
        var realGitCommands : string[] = [];
        var errorMessage = "";
        var currentBranchName = "master";

        // Generate git commands
        this.gitCommandHistory.forEach(function(command : InputParsing.Command) {

            // Helper functions 
            function escapeString(str : string) {
                return str.replace(/\"/g,'\"');
            }

            function co(branch : string) {
                if(branch && branch != currentBranchName) {
                    currentBranchName = branch;
                    realGitCommands.push("git checkout " + branch);
                }
            }

            // Generate git command
            try {
                switch(command.type) {
                    case InputParsing.CommandType.destroy:
                        realGitCommands = [];
                    break;
                    case InputParsing.CommandType.commit:
                        var lastBranch = currentBranchName;
                        co(command.branchA);
                        realGitCommands.push("git commit -m \"" + (command.message.length > 0 ? escapeString(command.message) : "My Commit") + "\"");
                        co(lastBranch);
                    break;
                    case InputParsing.CommandType.mergeToSelf:
                        realGitCommands.push("git merge " + command.branchA);
                    break;
                    case InputParsing.CommandType.mergeAB:
                        var lastBranch = currentBranchName;
                        
                        co(command.branchB);
                        realGitCommands.push("git merge " + command.branchA);
                        co(lastBranch);
                    break;
                    case InputParsing.CommandType.checkoutExisting:
                        co(command.branchA);
                    case InputParsing.CommandType.status:
                    case InputParsing.CommandType.branchShowCurrent:
                    break;
                    case InputParsing.CommandType.branchNewAB:
                        if(command.branchA && command.branchA != currentBranchName)
                            realGitCommands.push("git checkout -b " + command.branchB + " " + command.branchA);
                        else
                            realGitCommands.push("git checkout -b " + command.branchB);
                        currentBranchName = command.branchB;
                    break;
                    default:
                        throw "Unknown git command + '" + command.str + "'.";
                }
            } catch(e) {
                return {success:false, message: e};
            }
        });

        //Collapse multiple checkout commands
        var realGitCommandsOptimised : string[] = [];
        var previousCommandWasCheckout = false;
        realGitCommands.forEach(function(command : string) {
            var words = command.split(" ");
            // if this is a normal checkout command
            if(words.length > 2 && words[1].trim() == "checkout" && words[2] != "-b") {
                if(previousCommandWasCheckout) {
                    realGitCommandsOptimised.pop();
                }
                previousCommandWasCheckout = true;
            } else {
                previousCommandWasCheckout = false;
            }
            realGitCommandsOptimised.push(command);
        });

        realGitCommands = realGitCommandsOptimised;

        return realGitCommands.join("\n");
    }
}