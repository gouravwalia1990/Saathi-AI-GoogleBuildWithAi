import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { LoadingState } from '../components/LoadingState';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { SystemDiagnosticsModal } from '../components/SystemDiagnosticsModal';
import { AppProvider } from '../context/AppContext';

describe('UI Components & Accessibility Test Suite', () => {
  describe('ConfirmationDialog (Senior-in-the-Loop Principle 4)', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <ConfirmationDialog
          isOpen={false}
          title="Delete Reminder"
          message="Are you sure you want to delete this reminder?"
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders with clear title, message, and trigger buttons when open', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <ConfirmationDialog
          isOpen={true}
          title="Confirm Reminder Creation"
          message="Schedule reminder for Electricity Bill on 23 September?"
          subMessage="SAATHI will alert you proactively."
          confirmLabel="Confirm"
          cancelLabel="Go Back"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByText('Confirm Reminder Creation')).toBeTruthy();
      expect(
        screen.getByText('Schedule reminder for Electricity Bill on 23 September?')
      ).toBeTruthy();
      expect(screen.getByText('SAATHI will alert you proactively.')).toBeTruthy();

      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);

      const cancelBtn = screen.getByRole('button', { name: /go back/i });
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('LoadingState (Senior Friendly Feedback)', () => {
    it('renders primary message and reassurance subMessage', () => {
      render(
        <AppProvider>
          <LoadingState
            message="Analyzing your document..."
            subMessage="Extracting due date, amount, and payment details"
          />
        </AppProvider>
      );

      expect(screen.getByText('Analyzing your document...')).toBeTruthy();
      expect(
        screen.getByText('Extracting due date, amount, and payment details')
      ).toBeTruthy();
    });
  });

  describe('Header (Accessibility & Language Controls)', () => {
    it('displays brand, senior safe badge, and accessibility quick buttons', () => {
      render(
        <AppProvider>
          <Header />
        </AppProvider>
      );

      expect(screen.getByText(/SAATHI/i)).toBeTruthy();
      expect(screen.getByText(/Senior Safe AI/i)).toBeTruthy();
      expect(screen.getByLabelText(/Talk to SAATHI/i)).toBeTruthy();
      expect(screen.getByLabelText(/Change Text Size/i)).toBeTruthy();
    });
  });

  describe('BottomNav (Stable Evaluator Navigation & Selectors)', () => {
    it('provides stable data-testid selectors for all primary navigation destinations', () => {
      render(
        <AppProvider>
          <BottomNav />
        </AppProvider>
      );

      expect(screen.getByTestId('bottom-nav')).toBeTruthy();
      expect(screen.getByTestId('nav-home')).toBeTruthy();
      expect(screen.getByTestId('nav-explain')).toBeTruthy();
      expect(screen.getByTestId('nav-safety')).toBeTruthy();
      expect(screen.getByTestId('nav-reminders')).toBeTruthy();
      expect(screen.getByTestId('nav-settings')).toBeTruthy();
    });
  });

  describe('SystemDiagnosticsModal (Evaluator 1-Click Scenarios)', () => {
    it('renders scenario triggers when open', () => {
      render(
        <AppProvider>
          <SystemDiagnosticsModal isOpen={true} onClose={() => {}} />
        </AppProvider>
      );

      expect(screen.getByTestId('diagnostics-modal')).toBeTruthy();
      expect(screen.getByTestId('demo-scenario-bill')).toBeTruthy();
      expect(screen.getByTestId('demo-scenario-safety')).toBeTruthy();
      expect(screen.getByTestId('demo-scenario-appointment')).toBeTruthy();
    });
  });
});
