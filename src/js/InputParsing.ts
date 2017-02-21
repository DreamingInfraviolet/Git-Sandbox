"use strict";
import * as Util from "./Util";

/** A lexer token type */
enum TokenType { unknown, word, str, option }

/** A lexer token object */
class Token {
    tokenType = TokenType.unknown;
    value = "";
}

/** To simplify parsing the text, we should first convert the character stream into a stream
 *  of lexer tokens. These tokens respect quoted input and categorise it.
 */
function tokenise(input : string) : { success: boolean, message: string } | { success: boolean, tokens: Token[] } {
    // Surround quotes with spaces for easier parsing
    input = input.replace(/\"/g, " \" ");
    input = input.replace(/\'/g, " ' ");

    // Collapse all spaces and trim
    input = input.replace(/\s+/g, " ");
    
    // Split into string tokens
    var strTokens = input.split(" ");

    // Start parsing
    var tokens : Token[] = [];
    var waitingForQuote = "";
    var startQuoteIndex = -1;
    
    strTokens.forEach(function(strtoken: string, index: number) {
       
        strtoken = strtoken.trim();

        if(strtoken.length == 0)
            return;

        // If we are waiting for the end of a quote
        if(waitingForQuote != "") {
            // If this is the right quote
            if(waitingForQuote == strtoken) {
                var token = new Token();
                token.tokenType = TokenType.str;
                token.value = strTokens.slice(startQuoteIndex+1, index).join(" ");
                tokens.push(token);
                startQuoteIndex = -1;
                waitingForQuote = "";
                return;
            }
        }
        // If we are not waiting for the end of a quote
        else {
            // If we are starting a quote
            if(strtoken == "\"" || strtoken == "'") {
                // If we are not waiting for a quite, start a quote
                if(waitingForQuote == "") {
                    startQuoteIndex = index;
                    waitingForQuote = strtoken;
                    return;
                }
            }
            //If we are not starting a quote
            else {
                // We have handled quotes. Now only atomic words make sense.
                var token = new Token();

                // If this is an option.
                if(strtoken[0] == "-")
                    token.tokenType = TokenType.option;
                else
                    token.tokenType = TokenType.word;

                // Ignore case for options and commands
                token.value = strtoken.toLowerCase();
                tokens.push(token);
            }
        }
    });

    // If we are still waiting for a quote,
    if(waitingForQuote != "") {
        return { success: false, message: "Terminating `" + waitingForQuote + "` not found.`"};
    } else {
        return { success: true, tokens: tokens };
    }
}

/** All possible command types */
export enum CommandType {
    none, //os
    help, //os
    clear, //os
    undo, //os
    redo, //os
    destroy, //git
    commit, //git
    mergeToSelf, //git
    mergeAB, //git
    checkoutExisting, //git
    status, //git
    branchShowCurrent, //git
    branchNewAB, //git
}

/** A command object. The member attributes are used if needed (depends on the command type).
 *  This is used by the git manager and is much easier to use than a stream of lexer tokens. */
export class Command {
    type = CommandType.none;
    str     : string = null;
    branchA : string = null;
    branchB : string = null;
    message : string = null;
}

/** Parses an input string and returns an array of command objects */
export function parseInput(command : string) : { success: boolean, message: string } | { success: boolean, command: Command } {

    // If empty or comment, ignore.
    if(command.length == 0 || command[0] == "#")
        return { success: true, command: new Command() };

    // Get logical tokens
    var tokenRes : any = tokenise(command);

    // If failure, report.
    if(!tokenRes.success) {
        return { success: false, message: tokenRes.message };
    }

    // Extract tokens for type checking
    var tokens : Token[] = tokenRes.tokens;

    // If the first word is 'git', ignore it.
    if(tokens.length > 0 && tokens[0].value == "git") {
        tokens.splice(0, 1);
    }

    // If empty
    if(tokens.length == 0)
        return { success: true, command: new Command() };

    // Helper variables
    var subcommand     = tokens[0];
    var subcommandArgs = tokens.slice(1);
    var result         = new Command();
    result.str         = command;

    // Try no-options commands:
    var singleCommandResultTypes = {
        help: CommandType.help,
        "-h": CommandType.help,
        "--help": CommandType.help,
        h: CommandType.help,
        u: CommandType.undo,
        undo: CommandType.undo,
        r: CommandType.redo,
        redo: CommandType.redo,
        status: CommandType.status,
        clear: CommandType.clear,
        destroy: CommandType.destroy,
    }

    var resultType = singleCommandResultTypes[subcommand.value];
    if(resultType !== undefined) {
        // If this is a no-options command
        if(subcommandArgs.length != 0) {
            return {success: false, message: "Too many arguments."};
        } else {
            result.type = resultType;
        }
    } else {
        // Try multiple options commands
        switch(subcommand.value) {
        case "co":
        case "checkout":
        {
            if(subcommandArgs.length == 1) {
                // git checkout branch
                if(subcommandArgs[0].tokenType != TokenType.word) {
                    return {success: false, message: "Expected a branch name."};
                }
                result.type = CommandType.checkoutExisting;
                result.branchA = subcommandArgs[0].value;
            } else if(subcommandArgs.length == 2) {
                // git checkout -b branch
                if(subcommandArgs[0].value != "-b") {
                    return {success: false, message: "Invalid syntax."};
                }
                result.type = CommandType.branchNewAB;
                result.branchB = subcommandArgs[1].value;
            } else if(subcommandArgs.length == 3) {
                // git checkout -b branch source
                if(subcommandArgs[0].value != "-b") {
                    return {success: false, message: "Invalid syntax."};
                }
                result.type = CommandType.branchNewAB;
                result.branchA = subcommandArgs[2].value;
                result.branchB = subcommandArgs[1].value;
            } else {
                // git checkout wadwd wad wad adw
                return {success: false, message: "Invalid number of arguments."};
            }
        }
        break;
        case "merge":
        {
            if(subcommandArgs.length == 1) {
                // git merge branch
                if(subcommandArgs[0].tokenType != TokenType.word) {
                    return {success: false, message: "Expected a branch name."};
                }
                result.type = CommandType.mergeToSelf;
                result.branchA = subcommandArgs[0].value;
            } else if(subcommandArgs.length == 2) {
                // git merge source target
                if(subcommandArgs[0].tokenType != TokenType.word || subcommandArgs[1].tokenType != TokenType.word) {
                    return {success: false, message: "Expected a branch name."};
                }
                result.type = CommandType.mergeAB;
                result.branchA = subcommandArgs[0].value;
                result.branchB = subcommandArgs[1].value;
            } else {
                // git merge random random nonsese
                return {success: false, message: "Invalid number of arguments."};
            }
        }
        break;
        case "branch":
        {
            if(subcommandArgs.length == 0) {
                // git branch
                result.type = CommandType.branchShowCurrent;
            } else if(subcommandArgs.length == 1) {
                // git branch newbranch
                if(subcommandArgs[0].tokenType != TokenType.word) {
                    return {success: false, message: "Expected a branch name."};
                }
                result.type = CommandType.branchNewAB;
                result.branchB = subcommandArgs[0].value;
            } else if(subcommandArgs.length == 2) {
                // git branch startbranch newbranch
                if(subcommandArgs[0].tokenType != TokenType.word || subcommandArgs[1].tokenType != TokenType.word) {
                    return {success: false, message: "Expected a branch name."};
                }
                result.type = CommandType.branchNewAB;
                result.branchA = subcommandArgs[0].value;
                result.branchB = subcommandArgs[1].value;
            } else {
                // git branch random random nonsense
                return {success: false, message: "Invalid number of arguments."};
            }
        }
        break;
        case "commit":
        {
            var message = "My Commit.";
            result.type = CommandType.commit;
            result.message = message;

            // If the -m option is passed, whatever comes after is a string. Remove -m for simplicity.
            if(subcommandArgs.length && subcommandArgs[0].value == "-m") {
                if(subcommandArgs.length >= 2) {
                    subcommandArgs[1].tokenType = TokenType.str;
                }
                subcommandArgs.splice(0, 1);
            }

            if(subcommandArgs.length == 0) {
                // git commit
                result.type = CommandType.commit;
            } else if(subcommandArgs.length == 1) {
                // git commit branch
                if(subcommandArgs[0].tokenType == TokenType.word) {
                    result.branchA = subcommandArgs[0].value;
                } else if(subcommandArgs[0].tokenType == TokenType.str) {
                    // git commit "message"
                    result.message = subcommandArgs[0].value;
                } else {
                    // git commit -mad
                    return {success: false, message: "Expected branch name or commit message."};
                }
            } else if(subcommandArgs.length == 2) {
                if (subcommandArgs[0].tokenType == TokenType.word) {
                    // git commit branch "message"
                    result.branchA = subcommandArgs[0].value;
                    result.message = subcommandArgs[1].value;
                } else {
                    return {success: false, message: "Invalid syntax."};
                }
            } else {
                // git commit just a lot of nonsense
                return {success: false, message: "Invalid syntax."};
            }
        }
        break;
        default:
            return {success:false, message:"Unknown git command '" + subcommand.value + "'"};
        }
    }

    return {success: true, command: result};
}