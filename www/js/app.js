/**
 * Wait before the DOM has been loaded before initializing the Ubuntu UI layer
 */

var UI = new UbuntuUI();

$(document).ready(function() {
    UI.init();

    // Add an event listener that is pending on the initialization
    //  of the platform layer API, if it is being used.
    document.addEventListener("deviceready", function() {
        if (console && console.log)
            console.log('Platform layer API ready');
    }, false);
});


function displayDate() {
    UI.dialog('dateDialog').show();
};

function hideDate() {
    UI.dialog('dateDialog').hide();
};


function displayNotes() {
    UI.dialog('notesDialog').show();
};

function hideNotes() {
    UI.dialog('notesDialog').hide();
};


function displayPriority() {
    UI.dialog('priorityDialog').show();
};

function hidePriority() {
    UI.dialog('priorityDialog').hide();
};

