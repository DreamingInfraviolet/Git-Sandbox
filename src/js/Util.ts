"use strict";
declare var $ : any;

/** Shows a generic modal. The element must already exist in the html.
 * @param title The title of the modal.
 * @param body The body HTML of the modal.
 * @param onclose Javascript to run when the modal is closed.
 */
export function showGenericModal(title : string, body : string, onclose : string = undefined) {
    $("#genericModalTitle").html(title);
    $("#genericModalBody").html(body);
    $("#genericModal").on('hidden.bs.modal', (function(value) { return function () { eval(value || ""); } }) (onclose) );
    $("#genericModal").modal('show');
}

/** Shows the help modal.
 * @param onclose Javascript to run when the modal is closed.
 */
export function showHelpModal(onclose = undefined) {
    var helpText = `
        Welcome to Git Branching, a convenient tool for visualising git branches!
        <br><br>
        Supported commands:
        <dl>
            <dt>help</dt>
            <dd>Show this help message.</dd>
            <dt>clear</dt>
            <dd>Clears the output.</dd>
            <dt>(undo | u)</dt>
            <dd>Undoes the last action.</dd>
            <dt>(redo | r)</dt>
            <dd>Replays the last undone action.</dd>
            <dt>destroy</dt>
            <dd>Destroys the current graph.</dd>
            <dt>commit [[-m] "message"]</dt>
            <dd>Make a commit from the current branch with an optional message.</dd>
            <dt>commit &lt;branch&gt; [[-m] "message"]</dt>
            <dd>Make a commit from the specified branch with an optional message.</dd>
            <dt>(co | checkout) &lt;branch&gt;</dt>
            <dd>Switch to a particular branch.</dd>
            <dt>(co | checkout) -b &lt;branch&gt; [&lt;start_point&gt;]</dt>
            <dd>Create a new branch and switch to it.</dd>
            <dt>branch &lt;branch&gt;</dt>
            <dd>Same as <b>checkout -b &lt;branch&gt;</b></dd>
            <dt>branch &lt;source&gt; &lt;target&gt;</dt>
            <dd>Same as <b>checkout -b &lt;target&gt; &lt;source&gt;</b></dd>
            <dt>merge &lt;branch&gt;</dt>
            <dd>Merge the specified branch into the current branch.</dd>
            <dt>merge &lt;source&gt; &lt;target&gt;</dt>
            <dd>Merge the source branch into the target branch.</dd>
        </dl>
    `;
    showGenericModal("Help", helpText, onclose);
}

/** Gets a GET URL parameter by name.
 * Taken from http://stackoverflow.com/a/901144/6028770
 */

export function getParameterByName(name, url = undefined) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/** Returns true if the string is directly surrounded by matching single or double quotes. */
export function isStringQuoted(text : string) : boolean {
    return text.length > 1 && ((text[0] == "'" && text[text.length-1] == "'") || (text[0] == '"' && text[text.length-1] == '"') );
}
