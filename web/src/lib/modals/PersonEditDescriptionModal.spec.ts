import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PersonEditDescriptionModal from './PersonEditDescriptionModal.svelte';

describe('PersonEditDescriptionModal', () => {
  it('submits trimmed description', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(PersonEditDescriptionModal, { props: { description: '  Cousin  ', onSave, onClose } });

    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, '  Old friend from school  ');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('Old friend from school');
    expect(onClose).toHaveBeenCalled();
  });

  it('clears description', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(PersonEditDescriptionModal, { props: { description: 'Note', onSave, onClose } });

    await userEvent.click(screen.getByRole('button', { name: 'clear' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('');
    expect(onClose).toHaveBeenCalled();
  });
});
