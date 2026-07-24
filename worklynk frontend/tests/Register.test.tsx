import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Register } from '../src/pages/Register';
import api from '../src/utils/api';

vi.mock('../src/utils/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { image: 'data:image/svg+xml;base64,PHN2Zy8+', captchaKey: 'ABCDE.1.sig' },
    }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Register page', () => {
  it('renders the registration fields', async () => {
    renderRegister();
    expect(await screen.findByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register Account' })).toBeInTheDocument();
  });

  it('blocks submission and shows an error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Email Address'), 'new@worklynk.local');
    await user.type(screen.getByLabelText('Password'), 'Str0ng!Passw0rd12');
    await user.type(screen.getByLabelText('Confirm Password'), 'Different!123');
    await user.type(screen.getByLabelText('Verification Code'), 'ABCDE');

    await user.click(screen.getByRole('button', { name: 'Register Account' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(vi.mocked(api.post)).not.toHaveBeenCalled();
  });

  it('submits to the self-registration endpoint and shows the pending-approval screen', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Email Address'), 'new@worklynk.local');
    await user.type(screen.getByLabelText('Password'), 'Str0ng!Passw0rd12');
    await user.type(screen.getByLabelText('Confirm Password'), 'Str0ng!Passw0rd12');
    await user.type(screen.getByLabelText('Verification Code'), 'ABCDE');

    await user.click(screen.getByRole('button', { name: 'Register Account' }));

    expect(await screen.findByText('Request Submitted')).toBeInTheDocument();
    expect(vi.mocked(api.post)).toHaveBeenCalledWith(
      '/api/auth/register-self',
      expect.objectContaining({ email: 'new@worklynk.local', password: 'Str0ng!Passw0rd12' })
    );
  });
});
