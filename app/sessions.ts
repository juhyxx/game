import { Socket } from 'net';

type session = {
    socket: any;
    username: string;
}

class Sessions {
    sessions: session[] = [];

    add(session: session) {
        console.log("add")
        this.sessions.push(session);
    }
    isAuthentized(socket: Socket): boolean {
        return !!this.sessions.find(item => item.socket === socket)
    }

    getUsers(): string[] {
        return this.sessions.map((item, index) => `(${index}) ${item.username}`);
    }

    getSessionBySocket(socket: Socket): session | undefined {
        return this.sessions.find(item => item.socket == socket)
    }
    getSessionByIndex(index: number): session {
        return this.sessions[index]
    }

    removeUser(socket: Socket) {
        let index: number = this.sessions.findIndex(item => item.socket == socket);
        if (index > -1) {
            this.sessions.splice(index, 1);
        }
    }
}

export { session, Sessions }