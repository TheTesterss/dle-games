export const REALTIME_DISABLED_KEY = 'dle_realtime_disabled';
const REALTIME_DISABLE_TTL_MS = 30_000;

export const isRealtimeDisabled = (): boolean => {
    try {
        const raw = sessionStorage.getItem(REALTIME_DISABLED_KEY);
        if (!raw) return false;
        const ts = Number(raw);
        if (!Number.isFinite(ts)) {
            sessionStorage.removeItem(REALTIME_DISABLED_KEY);
            return false;
        }
        if (Date.now() - ts > REALTIME_DISABLE_TTL_MS) {
            sessionStorage.removeItem(REALTIME_DISABLED_KEY);
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

export const disableRealtime = (): void => {
    try {
        sessionStorage.setItem(REALTIME_DISABLED_KEY, String(Date.now()));
    } catch {
    }
};

export const isSocketEndpointMissing = (err: any): boolean => {
    const status = err?.description || err?.context?.status;
    const responseText = String(err?.context?.responseText || '');
    return status === 404 || responseText.includes('Cannot GET /socket.io/');
};
