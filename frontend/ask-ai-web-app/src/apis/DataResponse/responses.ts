export type loginUserResponse = {
    id: string;
    nickName: string;
    fullName: string;
    email: string;
    status: 'ONLINE' | 'OFFLINE';
}