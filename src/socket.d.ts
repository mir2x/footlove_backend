import { DecodedUser } from "@schemas/decodedUser";

declare module "socket.io" {
    interface Socket {
        user?: DecodedUser;
    }
}
