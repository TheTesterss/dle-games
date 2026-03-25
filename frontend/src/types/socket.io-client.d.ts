declare module 'socket.io-client' {
    export interface Socket {
        id: string;
        on: (...args: any[]) => this;
        off: (...args: any[]) => this;
        emit: (...args: any[]) => this;
        disconnect: () => void;
    }

    export function io(uri?: string, opts?: any): Socket;
}
