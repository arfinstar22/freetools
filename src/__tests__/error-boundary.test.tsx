import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const BadComponent: React.FC = () => {
  throw new Error('Test rendering crash');
};

describe('ErrorBoundary Runtime Resilience', () => {
  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Component Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Component Content')).toBeDefined();
  });

  it('catches component rendering errors gracefully and shows user-friendly recovery UI', () => {
    // Suppress console.error in test for expected error boundary test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BadComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Terjadi kendala pada tampilan')).toBeDefined();
    expect(screen.getByRole('button', { name: /kembali ke beranda/i })).toBeDefined();

    consoleSpy.mockRestore();
  });
});
