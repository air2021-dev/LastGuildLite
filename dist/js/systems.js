"use strict";
function checkUpdateNotice() {
    const lastSeenVersion = localStorage.getItem(LAST_UPDATE_SEEN_VERSION_KEY);
    if (lastSeenVersion !== UPDATE_NOTES[0].version) {
        showUpdatePopup(UPDATE_NOTES[0]);
    }
}
