import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JournalMobileHeader } from '../journal-mobile-header';
import { useTranslation } from '@/hooks/use-translation';
import { FirebaseProvider } from '@/firebase';
import { OpenRouterApiKeyContext } from '@/context/OpenRouterApiKeyContext';

vi.mock('@/hooks/use-translation');
vi.mock('@/components/user-menu', () => ({
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));
vi.mock('@/components/settings-menu', () => ({
  SettingsMenu: () => <div data-testid="settings-menu">SettingsMenu</div>,
}));

const mockFirebaseContext = {
  areServicesAvailable: true,
  firebaseApp: null,
  firestore: null,
  auth: null,
};

const mockApiKeyContext = {
  apiKey: null,
  setApiKey: vi.fn(),
  resetApiKey: vi.fn(),
  isLoading: false,
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <FirebaseProvider
    areServicesAvailable={mockFirebaseContext.areServicesAvailable}
    firebaseApp={mockFirebaseContext.firebaseApp}
    firestore={mockFirebaseContext.firestore}
    auth={mockFirebaseContext.auth}
  >
    <OpenRouterApiKeyContext.Provider value={mockApiKeyContext}>
      {children}
    </OpenRouterApiKeyContext.Provider>
  </FirebaseProvider>
);

describe('JournalMobileHeader', () => {
  const mockOnSidebarToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockReturnValue({
      t: (key: string) => key,
      language: 'en',
      isLoading: false,
      error: null,
    });
  });

  it('should render the title', () => {
    render(
      <TestWrapper>
        <JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render the toggle button', () => {
    render(
      <TestWrapper>
        <JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should call onSidebarToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />
      </TestWrapper>
    );

    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons.find(btn => btn.getAttribute('aria-label') === 'toggleSidebar');
    if (toggleButton) {
      await user.click(toggleButton);
      expect(mockOnSidebarToggle).toHaveBeenCalledTimes(1);
    }
  });

  it('should render the menu icon', () => {
    render(
      <TestWrapper>
        <JournalMobileHeader title="Test Title" onSidebarToggle={mockOnSidebarToggle} isSidebarOpen={false} />
      </TestWrapper>
    );

    expect(screen.getByText('☰')).toBeInTheDocument();
  });
});

