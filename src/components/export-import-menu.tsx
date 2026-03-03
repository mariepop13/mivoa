'use client';

import { useRef, useState } from 'react';
import { MoreHorizontal, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { useExport } from '@/hooks/use-export';
import { useImport, type ImportPreview } from '@/hooks/use-import';

export function ExportImportMenu(): React.JSX.Element {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { exportJSON, exportMarkdown, isExporting } = useExport();
  const { parseFile, importEntries, isImporting } = useImport();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExportJSON = async () => {
    try {
      await exportJSON();
      toast({ title: t('exportSuccess') });
    } catch {
      toast({ title: t('exportError'), variant: 'destructive' });
    }
  };

  const handleExportMarkdown = async () => {
    try {
      await exportMarkdown();
      toast({ title: t('exportSuccess') });
    } catch {
      toast({ title: t('exportError'), variant: 'destructive' });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const result = await parseFile(file);
      if (!result) return;
      setPreview(result);
      setIsDialogOpen(true);
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'unsupported_version'
          ? t('importUnsupportedVersion')
          : t('importInvalidFile');
      toast({ title: message, variant: 'destructive' });
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    try {
      const count = await importEntries(preview);
      setIsDialogOpen(false);
      setPreview(null);
      toast({ title: t('importSuccess').replace('{{count}}', String(count)) });
    } catch {
      toast({ title: t('exportError'), variant: 'destructive' });
    }
  };

  const confirmDescription = preview
    ? t('importConfirmDescription')
        .replace('{{total}}', String(preview.total))
        .replace('{{new}}', String(preview.newCount))
        .replace('{{skipped}}', String(preview.skippedCount))
    : '';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('dataManagement')}>
            <MoreHorizontal className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleExportJSON} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {t('exportJSON')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportMarkdown} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {t('exportMarkdown')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('importJSON')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('importConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport} disabled={isImporting}>
              {t('importJSON')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
