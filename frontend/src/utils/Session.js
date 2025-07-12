/* eslint-disable no-unused-vars */
export class SessionManager {
    _SESSION_KEY = 'userSession';
    _DURATION = 30 * 24 * 60 * 60 * 1000;
  
    create(userData) {
        const sessionData = {
            user: userData,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.DURATION
        };
    
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        return sessionData;
    }
  
    get() {
        try {
            const sessionStr = localStorage.getItem(this.SESSION_KEY);
            if (!sessionStr) return null;
      
            const session = JSON.parse(sessionStr);
      
            if (Date.now() > session.expiresAt) {
                this.destroy();
                return null;
            }
      
            return session;
        } catch (error) {
            this.destroy();
            return null;
        }
    }
  
    isValid() {
        return this.get() !== null;
    }
  
    renew() {
        const session = this.get();
        if (session) {
          session.expiresAt = Date.now() + this.DURATION;
          localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
          return session;
        }
        return null;
    }
  
    destroy() {
        localStorage.removeItem(this.SESSION_KEY);
    }
  
    getDaysRemaining() {
        const session = this.get();
        if (!session) return 0;
    
        const remaining = session.expiresAt - Date.now();
        return Math.ceil(remaining / (24 * 60 * 60 * 1000));
    }
}
