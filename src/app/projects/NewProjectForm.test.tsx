import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import NewProjectForm from './NewProjectForm';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as actions from './actions';

// Mock the server action
vi.mock('./actions', () => ({
    createProjectAction: vi.fn(),
}));

describe('NewProjectForm', () => {
    const spaceId = 'test-space-id';

    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('initially renders as a create button', () => {
        render(<NewProjectForm spaceId={spaceId} />);
        expect(screen.getByText('Create New Project')).toBeDefined();
        expect(screen.queryByText('New Project')).toBeNull(); // Modal title should not be there
    });

    it('opens the form when the create button is clicked', () => {
        render(<NewProjectForm spaceId={spaceId} />);

        fireEvent.click(screen.getByText('Create New Project'));

        expect(screen.getByText('New Project')).toBeDefined(); // Modal title
        expect(screen.getByLabelText('Title')).toBeDefined();
        expect(screen.getByLabelText('Description')).toBeDefined();
        expect(screen.getByLabelText('Scope (Context for AI Breakdown)')).toBeDefined();
    });

    it('calls createProjectAction with form data on submit', async () => {
        const mockCreateAction = vi.spyOn(actions, 'createProjectAction').mockResolvedValue(undefined);

        render(<NewProjectForm spaceId={spaceId} />);

        // Open form
        fireEvent.click(screen.getByText('Create New Project'));

        // Fill out form
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Test Project' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Description' } });
        fireEvent.change(screen.getByLabelText('Scope (Context for AI Breakdown)'), { target: { value: 'Test Scope' } });

        // Submit
        fireEvent.click(screen.getByText('Create Project'));

        await waitFor(() => {
            // Extract the FormData that was passed to the mock
            expect(mockCreateAction).toHaveBeenCalled();
            const submittedFormData = mockCreateAction.mock.calls[0][0] as FormData;
            expect(submittedFormData.get('title')).toBe('Test Project');
            expect(submittedFormData.get('description')).toBe('Test Description');
            expect(submittedFormData.get('scope')).toBe('Test Scope');
            expect(submittedFormData.get('spaceId')).toBe(spaceId);
        });

        // It should close after successful submission
        await waitFor(() => {
            expect(screen.queryByText('New Project')).toBeNull();
            expect(screen.getByText('Create New Project')).toBeDefined();
        });
    });

    it('cancels the form when Cancel is clicked', () => {
        render(<NewProjectForm spaceId={spaceId} />);

        // Open form
        fireEvent.click(screen.getByText('Create New Project'));
        expect(screen.getByText('New Project')).toBeDefined();

        // Click Cancel
        fireEvent.click(screen.getByText('Cancel'));

        // Form should be closed
        expect(screen.queryByText('New Project')).toBeNull();
        expect(screen.getByText('Create New Project')).toBeDefined();
    });
});
