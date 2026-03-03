import { test, expect } from '@playwright/test';
import path from 'path';

const VALID_FIXTURE = path.resolve(__dirname, '../docs/test-fixtures/test-import-valid.json');
const INVALID_FIXTURE = path.resolve(__dirname, '../docs/test-fixtures/test-import-invalid.json');

// i18n values from src/locales/en.json
const i18n = {
  dataManagement: 'Data',
  exportJSON: 'Export JSON',
  exportMarkdown: 'Export Markdown',
  importJSON: 'Import JSON',
  exportSuccess: 'Export downloaded',
  importConfirmTitle: 'Import entries',
  importUnsupportedVersion: 'Unsupported format version',
};

// First test may be slow (cold-start: Firebase SDK init + emulator connection + anonymous auth)
test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/test-auth');
  await page.waitForURL('/');
  await page.getByRole('button', { name: i18n.dataManagement }).waitFor();
});

test('Data button is visible in sidebar header', async ({ page }) => {
  const dataButton = page.getByRole('button', { name: i18n.dataManagement });
  await expect(dataButton).toBeVisible();
});

test('dropdown shows correct menu items', async ({ page }) => {
  await page.getByRole('button', { name: i18n.dataManagement }).click();

  await expect(page.getByRole('menuitem', { name: i18n.exportJSON })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: i18n.exportMarkdown })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: i18n.importJSON })).toBeVisible();
});

test('Export JSON shows success toast', async ({ page }) => {
  await page.getByRole('button', { name: i18n.dataManagement }).click();
  await page.getByRole('menuitem', { name: i18n.exportJSON }).click();

  await expect(page.getByText(i18n.exportSuccess).first()).toBeVisible();
});

test('Export Markdown shows success toast', async ({ page }) => {
  await page.getByRole('button', { name: i18n.dataManagement }).click();
  await page.getByRole('menuitem', { name: i18n.exportMarkdown }).click();

  await expect(page.getByText(i18n.exportSuccess).first()).toBeVisible();
});

test('Import JSON — confirmation dialog shows entry counts', async ({ page }) => {
  await page.getByRole('button', { name: i18n.dataManagement }).click();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: i18n.importJSON }).click(),
  ]);
  await fileChooser.setFiles(VALID_FIXTURE);

  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('2');
});

test('Import JSON — confirm imports and shows success toast', async ({ page }) => {
  await page.getByRole('button', { name: i18n.dataManagement }).click();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: i18n.importJSON }).click(),
  ]);
  await fileChooser.setFiles(VALID_FIXTURE);

  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Import' }).click();

  await expect(page.getByText(/\d+ entries imported/).first()).toBeVisible({ timeout: 5000 });
});

test('Import invalid version — shows error toast', async ({ page }) => {
  await page.getByRole('button', { name: i18n.dataManagement }).click();

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('menuitem', { name: i18n.importJSON }).click(),
  ]);
  await fileChooser.setFiles(INVALID_FIXTURE);

  await expect(page.getByRole('alertdialog')).not.toBeVisible();
  await expect(page.getByText(i18n.importUnsupportedVersion).first()).toBeVisible();
});
