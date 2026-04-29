let sessionExpiredHandler = null;

export function setSessionExpiredHandler(fn) {
    sessionExpiredHandler = fn;
}

export function notifySessionExpired() {
    if (typeof sessionExpiredHandler === 'function') {
        sessionExpiredHandler();
    }
}
