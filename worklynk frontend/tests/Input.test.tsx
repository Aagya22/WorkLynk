import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../src/components/Input';

describe('Input', () => {
  it('renders a label wired to the field', () => {
    render(<Input id="email" label="Email Address" type="email" />);
    // getByLabelText only succeeds if the <label htmlFor> is correctly linked.
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('masks a password field by default and toggles visibility on click', async () => {
    const user = userEvent.setup();
    render(<Input id="pw" label="Password" type="password" defaultValue="s3cret" />);

    const field = screen.getByLabelText('Password');
    expect(field).toHaveAttribute('type', 'password');

    // The eye button is the only button the component renders for a password field.
    await user.click(screen.getByRole('button'));
    expect(field).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button'));
    expect(field).toHaveAttribute('type', 'password');
  });

  it('renders no visibility toggle for a non-password field', () => {
    render(<Input id="email" label="Email" type="email" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows an error message and hides the helper text when errored', () => {
    render(<Input id="pw" label="Password" error="Too weak" helperText="Use 12+ chars" />);
    expect(screen.getByText('Too weak')).toBeInTheDocument();
    expect(screen.queryByText('Use 12+ chars')).not.toBeInTheDocument();
  });
});
