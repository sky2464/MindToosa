import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSubTasksAction } from './actions';
import { projectService } from '@/server/services/projectService';
import { llmClient } from '@/server/llmClient';
import { auth } from '@auth';

vi.mock('@auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/server/services/projectService', () => ({
    projectService: {
        getProjectById: vi.fn(),
    }
}));

vi.mock('@/server/llmClient', () => ({
    llmClient: {
        breakdownProject: vi.fn(),
    }
}));

describe('generateSubTasksAction', () => {
    const mockUserId = 'testuser@example.com';
    const mockProjectId = 'test-project-id';

    beforeEach(() => {
        vi.resetAllMocks();
        (auth as any).mockResolvedValue({ user: { email: mockUserId } });
    });

    it('should generate subtasks successfully for an existing project', async () => {
        const mockProject = {
            id: mockProjectId,
            title: 'Test Project',
            description: 'A test project description',
            scope: 'Full test coverage',
        };

        const mockSubtasks = [
            { title: 'Task 1', estimated_minutes: 25 },
            { title: 'Task 2', estimated_minutes: 50 },
        ];

        (projectService.getProjectById as any).mockResolvedValue(mockProject);
        (llmClient.breakdownProject as any).mockResolvedValue(mockSubtasks);

        const result = await generateSubTasksAction(mockProjectId);

        expect(auth).toHaveBeenCalled();
        expect(projectService.getProjectById).toHaveBeenCalledWith(mockUserId, mockProjectId);
        expect(llmClient.breakdownProject).toHaveBeenCalledWith(
            'Test Project',
            'A test project description',
            'Full test coverage'
        );
        expect(result).toEqual(mockSubtasks);
    });

    it('should throw an error if the user is not authenticated', async () => {
        (auth as any).mockResolvedValue(null);
        await expect(generateSubTasksAction(mockProjectId)).rejects.toThrow('Unauthorized');
    });

    it('should throw an error if the project is not found', async () => {
        (projectService.getProjectById as any).mockResolvedValue(null);
        await expect(generateSubTasksAction(mockProjectId)).rejects.toThrow('Project not found');
    });

    it('should handle undefined description and scope defaults', async () => {
        const mockProject = {
            id: mockProjectId,
            title: 'Test Project',
            // description and scope are omitted
        };

        (projectService.getProjectById as any).mockResolvedValue(mockProject);
        (llmClient.breakdownProject as any).mockResolvedValue([]);

        await generateSubTasksAction(mockProjectId);

        expect(llmClient.breakdownProject).toHaveBeenCalledWith(
            'Test Project',
            '',
            ''
        );
    });
});
