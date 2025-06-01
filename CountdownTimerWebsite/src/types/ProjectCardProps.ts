import type { Project } from './Project';

export interface ProjectCardProps {
    project: Project;
    onProjectDeleted?: (projectId: number) => void;
    onProjectUpdated?: (updatedProject: Project) => void;
}
