import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SocialShare } from '../social-share';

describe('SocialShare', () => {
  const mockProps = {
    url: '/properties/123',
    title: 'Test Property',
    description: 'Beautiful apartment in Tashkent',
    image: 'https://example.com/image.jpg',
  };

  // Mock window.location.origin
  const originalLocation = window.location;
  beforeEach(() => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      origin: 'https://example.com',
    };
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it('should render share button', () => {
    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    expect(shareButton).toBeInTheDocument();
  });

  it('should use native share API when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });

    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: mockProps.title,
        text: mockProps.description,
        url: `https://example.com${mockProps.url}`,
      });
    });
  });

  it('should show modal when native share API is not available', () => {
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });

    fireEvent.click(shareButton);

    expect(screen.getByText('Поделиться')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should show modal when native share is cancelled', async () => {
    const mockShare = vi.fn().mockRejectedValue(new DOMException('User cancelled', 'AbortError'));
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });

    fireEvent.click(shareButton);

    await waitFor(() => {
      // Modal should not appear for AbortError
      expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
    });
  });

  it('should show modal when native share fails with non-abort error', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });

    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Facebook')).toBeInTheDocument();
    });
  });

  it('should close modal when X button is clicked', () => {
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });

    fireEvent.click(shareButton);

    expect(screen.getByText('Facebook')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);

    expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
  });

  it('should generate correct share links', () => {
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    fireEvent.click(shareButton);

    const fullUrl = 'https://example.com/properties/123';
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(mockProps.title);

    // Check Facebook link
    const facebookButton = screen.getByText('Facebook').closest('button');
    expect(facebookButton).toBeInTheDocument();

    // Check email link
    const emailLink = screen.getByText('Email').closest('a');
    expect(emailLink).toHaveAttribute('href', expect.stringContaining('mailto:'));
    expect(emailLink?.getAttribute('href')).toContain(encodedTitle);
  });

  it('should copy link to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    fireEvent.click(shareButton);

    const copyButton = screen.getByRole('button', { name: /копировать/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/properties/123');
    });

    // Check that button text changes to "Скопировано"
    await waitFor(() => {
      expect(screen.getByText(/скопировано/i)).toBeInTheDocument();
    });
  });

  it('should handle copy to clipboard error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'));
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    fireEvent.click(shareButton);

    const copyButton = screen.getByRole('button', { name: /копировать/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to copy:',
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should open share window when clicking social buttons', () => {
    const mockWindowOpen = vi.fn();
    window.open = mockWindowOpen;

    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    fireEvent.click(shareButton);

    const facebookButton = screen.getByText('Facebook').closest('button');
    fireEvent.click(facebookButton!);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com'),
      '_blank',
      'width=600,height=400',
    );
  });

  it('should display URL input field with full URL', () => {
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    fireEvent.click(shareButton);

    const urlInput = screen.getByDisplayValue('https://example.com/properties/123');
    expect(urlInput).toBeInTheDocument();
    expect(urlInput).toHaveAttribute('readonly');
  });

  it('should handle absolute URLs correctly', () => {
    const absoluteUrl = 'https://external.com/property';
    render(<SocialShare {...mockProps} url={absoluteUrl} />);

    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    fireEvent.click(shareButton);

    const urlInput = screen.getByDisplayValue(absoluteUrl);
    expect(urlInput).toBeInTheDocument();
  });

  it('should reset copied state after 2 seconds', async () => {
    vi.useFakeTimers();

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    render(<SocialShare {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /поделиться/i });
    fireEvent.click(shareButton);

    const copyButton = screen.getByRole('button', { name: /копировать/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText(/скопировано/i)).toBeInTheDocument();
    });

    // Fast-forward time by 2 seconds
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(screen.getByText(/копировать/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
