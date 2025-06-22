export interface Project {
    id: number;
    name: string;
    description?: string;
    authorized_users?: number[]; // Array of user IDs that have permission to edit this project
}
