import { render, screen } from '@testing-library/react';
import { PasswordStrength } from '../src/components/PasswordStrength';

describe('PasswordStrength', () => {
  it('renders nothing for an empty password', () => {
    const { container } = render(<PasswordStrength password="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('always lists the five policy requirements', () => {
    render(<PasswordStrength password="abc" />);
    expect(screen.getByText('At least 12 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One special character')).toBeInTheDocument();
  });

  it('rates a partial password below full strength', () => {
    // Upper + lower only (2 of 5 rules) => "Fair".
    render(<PasswordStrength password="Abcdef" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
    expect(screen.queryByText('Very Strong')).not.toBeInTheDocument();
  });

  it('rates a password meeting every rule as Very Strong', () => {
    render(<PasswordStrength password="Str0ng!Passw0rd12" />);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });
});
