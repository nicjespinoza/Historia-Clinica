import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { InputWithIcon } from '../../src/components/ui/InputWithIcon';
import { FloatingLabelInput } from '../../src/components/premium-ui/FloatingLabelInput';
import { DatePicker } from '../../src/components/premium-ui/DatePicker';
import { User } from 'lucide-react';

describe('UI Components', () => {
    describe('InputWithIcon', () => {
        it('associates label with input correctly', () => {
            render(
                <InputWithIcon label="Test Label" icon={User}>
                    <input type="text" />
                </InputWithIcon>
            );

            // Should find input by label text thanks to useId
            const input = screen.getByLabelText('Test Label');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('type', 'text');
        });

        it('shows error message when provided', () => {
            render(
                <InputWithIcon label="Test Label" icon={User} error="Required field">
                    <input type="text" />
                </InputWithIcon>
            );

            expect(screen.getByText('Required field')).toBeInTheDocument();
        });
    });

    describe('FloatingLabelInput', () => {
        it('renders with label and value', () => {
            const handleChange = vi.fn();
            render(
                <FloatingLabelInput
                    label="Floating Label"
                    value="Test Value"
                    onChange={handleChange}
                />
            );

            const input = screen.getByDisplayValue('Test Value');
            expect(input).toBeInTheDocument();

            fireEvent.change(input, { target: { value: 'New Value' } });
            expect(handleChange).toHaveBeenCalled();
        });

        it('renders as textarea when specified', () => {
            render(
                <FloatingLabelInput
                    label="Description"
                    as="textarea"
                    value=""
                    onChange={() => { }}
                />
            );

            // Check for textarea tag
            // getByLabelText might work if id is generated? 
            // FloatingLabelInput implementation might not use useId yet? 
            // Let's check implementation if test fails.
            // Assuming it renders a textarea.
            const textarea = screen.getByRole('textbox');
            expect(textarea.tagName).toBe('TEXTAREA');
        });
    });

    describe('DatePicker', () => {
        it('associates label with date input', () => {
            const handleChange = vi.fn();
            render(
                <DatePicker
                    label="Birth Date"
                    value={null}
                    onChange={handleChange}
                />
            );

            // Should find by label
            // Note: We mock react-datepicker to be a simple input in some setups?
            // But we didn't mock it in this file. 
            // However, DatePicker component wraps it with a label and useId.
            // Even if ReactDatePicker renders a complex structure, it should pass id to input?
            // In our previous edit, we updated DatePicker to pass id to ReactDatePicker.
            // ReactDatePicker uses that id for the input.

            const input = screen.getByLabelText('Birth Date');
            expect(input).toBeInTheDocument();
        });

        it('displays error message', () => {
            render(
                <DatePicker
                    label="Birth Date"
                    value={null}
                    onChange={() => { }}
                    error="Invalid Date"
                />
            );
            expect(screen.getByText('Invalid Date')).toBeInTheDocument();
        });
    });
});
