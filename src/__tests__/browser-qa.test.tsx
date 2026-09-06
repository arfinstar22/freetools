import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { ToolRunner } from '../components/tool/ToolRunner';
import { WorkflowRunnerModal } from '../components/workflow/WorkflowRunnerModal';
import { getToolById } from '../engine/registry';
import { PDFDocument } from 'pdf-lib';
import { WorkflowPlan } from '../types/workflow';

// Mock canvas confetti and window.scrollTo
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

beforeEach(() => {
  window.scrollTo = vi.fn();
  localStorage.clear();
});

describe('End-to-End UI & Functional User Journeys (Task 6)', () => {
  // ==========================================
  // 1. TOOL DISCOVERY & NAVIGATION
  // ==========================================
  describe('1. Tool Discovery & Navigation Flow', () => {
    it('Homepage: renders header, search bar, dropzone, and popular tools', () => {
      render(<App />);
      expect(screen.getByRole('heading', { level: 1, name: /mau ngapain\?/i })).toBeDefined();
      expect(screen.getByPlaceholderText(/kecilin pdf ini/i)).toBeDefined();
      expect(screen.getByText(/📁 Drop file di sini/i)).toBeDefined();
      expect(screen.getByText(/Tool Populer/i)).toBeDefined();
    });

    it('Navigation: switches between Home, Tools Catalog, and Privacy Page', () => {
      render(<App />);

      // Navigate to Tools Catalog
      const toolsBtn = screen.getByRole('button', { name: /semua tools/i });
      fireEvent.click(toolsBtn);
      expect(screen.getByRole('heading', { name: /semua tools/i })).toBeDefined();

      // Navigate to Privacy Page
      const privacyBtn = screen.getByRole('button', { name: /privasi & keamanan/i });
      fireEvent.click(privacyBtn);
      expect(screen.getByRole('heading', { name: /privasi & keamanan/i })).toBeDefined();

      // Back to Home
      const homeBtn = screen.getByRole('button', { name: /mau ngapain\?/i });
      fireEvent.click(homeBtn);
      expect(screen.getByRole('heading', { level: 1, name: /mau ngapain\?/i })).toBeDefined();
    });

    it('Catalog: filters tools by category tabs and search query', () => {
      render(<App />);

      // Go to catalog
      fireEvent.click(screen.getByRole('button', { name: /semua tools/i }));

      // Filter by PDF
      const pdfTabs = screen.getAllByRole('button', { name: /pdf/i });
      fireEvent.click(pdfTabs[0]);
      expect(screen.getAllByText(/Gabungkan PDF/i).length).toBeGreaterThan(0);

      // Reset to Semua
      fireEvent.click(screen.getByRole('button', { name: /semua \(/i }));

      // Search in catalog
      const searchInput = screen.getByPlaceholderText(/cari tool/i);
      fireEvent.change(searchInput, { target: { value: 'invoice' } });
      expect(screen.getAllByText(/Pembuat Invoice PDF/i).length).toBeGreaterThan(0);
    });

    it('Quick Search Modal (Ctrl+K): opens search, filters tools, and navigates to selected tool', async () => {
      render(<App />);

      // Open quick search modal
      const quickSearchBtn = screen.getByLabelText(/cari tool/i);
      fireEvent.click(quickSearchBtn);

      const modalInput = screen.getByPlaceholderText(/cari nama tool/i);
      expect(modalInput).toBeDefined();

      // Type search query
      fireEvent.change(modalInput, { target: { value: 'diff' } });

      // Click the search result
      const resultBtn = screen.getByRole('button', { name: /diff checker/i });
      fireEvent.click(resultBtn);

      // Verify navigated to ToolRunner for Diff Checker
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /diff checker/i })).toBeDefined();
      });
    });
  });

  // ==========================================
  // 2. FILE UPLOAD & PROCESSING FLOW
  // ==========================================
  describe('2. File Upload & Processing Flow', () => {
    it('Tool Runner: processes PDF compression with file upload and download button', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([200, 200]);
      const bytes = await doc.save();
      const pdfFile = new File([bytes.buffer as ArrayBuffer], 'dokumen_kerja.pdf', { type: 'application/pdf' });

      const tool = getToolById('compress-pdf')!;
      render(
        <ToolRunner
          tool={tool}
          initialFiles={[pdfFile]}
          onBack={vi.fn()}
        />
      );

      // Verify file is listed
      expect(screen.getByText('dokumen_kerja.pdf')).toBeDefined();

      // Run compression
      const runBtn = screen.getByRole('button', { name: /proses sekarang/i });
      fireEvent.click(runBtn);

      // Verify success state & download button
      await waitFor(() => {
        expect(screen.getByText(/berhasil!/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /download hasil/i })).toBeDefined();
      });
    });

    it('File Removal: allows removing a selected file from the queue before processing', () => {
      const f1 = new File(['content 1'], 'file_1.txt', { type: 'text/plain' });
      const f2 = new File(['content 2'], 'file_2.txt', { type: 'text/plain' });

      const tool = getToolById('zip-pack')!;
      render(
        <ToolRunner
          tool={tool}
          initialFiles={[f1, f2]}
          onBack={vi.fn()}
        />
      );

      expect(screen.getByText('file_1.txt')).toBeDefined();
      expect(screen.getByText('file_2.txt')).toBeDefined();

      // Remove file_1
      const removeBtn = screen.getByLabelText('Hapus file_1.txt');
      fireEvent.click(removeBtn);

      expect(screen.queryByText('file_1.txt')).toBeNull();
      expect(screen.getByText('file_2.txt')).toBeDefined();
    });
  });

  // ==========================================
  // 3. TEXT & FORM TOOLS FLOW
  // ==========================================
  describe('3. Text & Form Tools UI Flow', () => {
    it('Word Counter: updates analysis and allows clipboard copy', async () => {
      // Mock clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockImplementation(() => Promise.resolve())
        }
      });

      const tool = getToolById('word-counter')!;
      render(
        <ToolRunner
          tool={tool}
          onBack={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText(/ketik atau tempel/i);
      fireEvent.change(textarea, { target: { value: 'Satu dua tiga empat lima enam tujuh delapan.' } });

      const runBtn = screen.getByRole('button', { name: /proses sekarang/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByText(/kata: 8/i)).toBeDefined();
      });

      // Click copy button
      const copyBtn = screen.getByRole('button', { name: /salin ke clipboard/i });
      fireEvent.click(copyBtn);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it('Invoice Generator: creates PDF invoice from form inputs', async () => {
      const tool = getToolById('invoice-generator')!;
      render(
        <ToolRunner
          tool={tool}
          onBack={vi.fn()}
        />
      );

      expect(screen.getByText(/nomor invoice/i)).toBeDefined();

      const runBtn = screen.getByRole('button', { name: /proses sekarang/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByText(/berhasil!/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /download hasil/i })).toBeDefined();
      });
    });

    it('Expense Splitter: calculates bill distribution from form options', async () => {
      const tool = getToolById('expense-splitter')!;
      render(
        <ToolRunner
          tool={tool}
          onBack={vi.fn()}
        />
      );

      const runBtn = screen.getByRole('button', { name: /proses sekarang/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByText(/berhasil!/i)).toBeDefined();
        expect(screen.getByText(/RINCIAN HITUNG PATUNGAN/i)).toBeDefined();
      });
    });

    it('Diff Checker: compares multiline inputs and renders diff view', async () => {
      const tool = getToolById('diff-checker')!;
      render(
        <ToolRunner
          tool={tool}
          onBack={vi.fn()}
        />
      );

      const runBtn = screen.getByRole('button', { name: /proses sekarang/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByText(/berhasil!/i)).toBeDefined();
        expect(screen.getByText(/HASIL PERBANDINGAN TEKS/i)).toBeDefined();
      });
    });
  });

  // ==========================================
  // 4. ERROR RECOVERY & RETRY FLOW
  // ==========================================
  describe('4. Error Handling & Recovery Flow', () => {
    it('Error handling: shows friendly error message and recovers via Coba Lagi / reset without page refresh', async () => {
      const tool = getToolById('json-formatter')!;
      render(
        <ToolRunner
          tool={tool}
          onBack={vi.fn()}
        />
      );

      const textarea = screen.getByPlaceholderText(/ketik atau tempel/i);
      fireEvent.change(textarea, { target: { value: '{ invalid: json without quotes }' } });

      const runBtn = screen.getByRole('button', { name: /proses sekarang/i });
      fireEvent.click(runBtn);

      // Verify error notification
      await waitFor(() => {
        expect(screen.getByText(/terjadi masalah saat memproses file/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /coba lagi/i })).toBeDefined();
      });

      // Click Coba Lagi / Reset
      const retryBtn = screen.getByRole('button', { name: /coba lagi/i });
      fireEvent.click(retryBtn);

      // Verify error is cleared and input is reset
      expect(screen.queryByText(/terjadi masalah saat memproses file/i)).toBeNull();
    });
  });

  // ==========================================
  // 5. WORKFLOW RUNNER MODAL
  // ==========================================
  describe('5. Workflow Runner Modal Flow', () => {
    it('executes multi-step workflow cleanly and offers itemized and ZIP downloads', async () => {
      const plan: WorkflowPlan = {
        id: 'wf-test',
        title: 'Pembersihan Teks Otomatis',
        goal: 'Rapikan spasi',
        description: 'Membersihkan spasi ganda',
        outputStrategy: 'single-file',
        steps: [
          {
            id: 'step_1',
            toolId: 'text-cleaner',
            name: 'Pembersih Teks',
            options: { removeExtraSpaces: true },
            enabled: true
          }
        ]
      };

      const f = new File(['  Halo   FreeTools  '], 'input.txt', { type: 'text/plain' });
      render(
        <WorkflowRunnerModal
          plan={plan}
          initialFiles={[f]}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Pembersihan Teks Otomatis/i)).toBeDefined();

      const runBtn = screen.getByRole('button', { name: /jalankan semua langkah/i });
      fireEvent.click(runBtn);

      await waitFor(() => {
        expect(screen.getByText(/download hasil/i)).toBeDefined();
      });
    });
  });

  // ==========================================
  // 6. PRIVATE MODE & OFFLINE INDICATOR
  // ==========================================
  describe('6. Private Mode & Offline Banner', () => {
    it('Private Mode: toggles on/off and persists state', () => {
      render(<App />);

      const toggle = screen.getByTitle(/mengaktifkan mode privat/i);
      fireEvent.click(toggle);

      expect(localStorage.getItem('freetools_private_mode')).toBe('true');
      expect(screen.getByText(/privat aktif/i)).toBeDefined();
    });

    it('Offline event: displays offline alert banner when browser goes offline', () => {
      render(<App />);

      // Dispatch offline event
      fireEvent(window, new Event('offline'));

      expect(screen.getByText(/kamu sedang offline/i)).toBeDefined();

      // Dispatch online event
      fireEvent(window, new Event('online'));
      expect(screen.queryByText(/kamu sedang offline/i)).toBeNull();
    });
  });
});
