export interface User {
    id: number;
    username: string;
    is_admin: boolean;
    created_at: string;
    last_login: string | null;
}
