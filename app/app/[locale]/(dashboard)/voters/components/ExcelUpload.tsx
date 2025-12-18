/**
 * Excel Upload Component - Hebrew RTL
 *
 * Allows bulk import of voters from Excel file
 * Expected columns: שם, שם משפחה, טלפון, עיר, מייל
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { read, utils } from 'xlsx';
import { bulkImportVoters } from '@/app/actions/voters';

type ExcelRow = {
  שם: string;
  'שם משפחה': string;
  טלפון: string;
  עיר: string;
  מייל: string;
};

type ImportResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
};

type ExcelUploadProps = {
  onSuccess: () => void;
};

export function ExcelUpload({ onSuccess }: ExcelUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setPreview([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<ExcelRow>(worksheet);

      // Validate columns
      if (jsonData.length === 0) {
        setError('הקובץ ריק');
        setFile(null);
        return;
      }

      const requiredColumns = ['שם', 'שם משפחה', 'טלפון', 'עיר', 'מייל'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));

      if (missingColumns.length > 0) {
        setError(`חסרות עמודות: ${missingColumns.join(', ')}`);
        setFile(null);
        return;
      }

      // Show preview (first 5 rows)
      setPreview(jsonData.slice(0, 5));
    } catch (err) {
      console.error('[ExcelUpload] Parse error:', err);
      setError('שגיאה בקריאת הקובץ. אנא ודא שהקובץ הוא Excel תקין');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<ExcelRow>(worksheet);

      // Transform to server format
      const voters = jsonData.map((row) => ({
        firstName: row['שם']?.toString().trim() || '',
        lastName: row['שם משפחה']?.toString().trim() || '',
        phone: row['טלפון']?.toString().trim() || '',
        city: row['עיר']?.toString().trim() || '',
        email: row['מייל']?.toString().trim() || '',
      }));

      console.log('[ExcelUpload] Importing', voters.length, 'voters');

      const importResult = await bulkImportVoters(voters);
      setResult(importResult);

      if (importResult.success > 0) {
        onSuccess();
      }
    } catch (err) {
      console.error('[ExcelUpload] Upload error:', err);
      setError('שגיאה בהעלאת הקובץ. אנא נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setError(null);
  };

  return (
    <Box dir="rtl" sx={{ p: 3 }}>
      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
          הוראות העלאה:
        </Typography>
        <Typography variant="body2" component="ul" sx={{ m: 0, pr: 2 }}>
          <li>פורמטים נתמכים: Excel (.xlsx, .xls) או Numbers (.numbers)</li>
          <li>משתמשי Mac: מומלץ לייצא מ-Numbers לפורמט Excel לתוצאות מיטביות</li>
          <li>השורה הראשונה חייבת להכיל כותרות עמודות</li>
          <li>עמודות נדרשות: שם, שם משפחה, טלפון, עיר, מייל</li>
          <li>טלפון חייב להיות ייחודי לכל בוחר</li>
        </Typography>
      </Alert>

      {/* File Input */}
      {!file && (
        <Box
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.numbers"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="excel-upload-input"
          />
          <label htmlFor="excel-upload-input" style={{ cursor: 'pointer' }}>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              לחץ לבחירת קובץ Excel או Numbers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              או גרור קובץ לכאן
            </Typography>
          </label>
        </Box>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            תצוגה מקדימה ({preview.length} שורות ראשונות):
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>שם</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>שם משפחה</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>טלפון</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>עיר</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>מייל</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.map((row, index) => (
                  <TableRow key={`preview-${index}-${row['טלפון']}`}>
                    <TableCell>{row['שם']}</TableCell>
                    <TableCell>{row['שם משפחה']}</TableCell>
                    <TableCell>{row['טלפון']}</TableCell>
                    <TableCell>{row['עיר']}</TableCell>
                    <TableCell>{row['מייל']}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={loading}
              startIcon={<UploadIcon />}
              sx={{
                borderRadius: '50px',
                px: 3,
                py: 1.25,
                fontWeight: 600,
              }}
            >
              העלה והוסף בוחרים
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={loading}
              sx={{
                borderRadius: '50px',
                px: 3,
                py: 1.25,
              }}
            >
              בטל
            </Button>
          </Box>
        </>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ mt: 3 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            מעלה ומייבא בוחרים...
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Result */}
      {result && (
        <Box sx={{ mt: 3 }}>
          <Alert
            severity={result.failed === 0 ? 'success' : 'warning'}
            icon={result.failed === 0 ? <CheckIcon /> : <ErrorIcon />}
          >
            <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
              התהליך הושלם
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: result.errors.length > 0 ? 2 : 0 }}>
              <Chip
                label={`הצליחו: ${result.success}`}
                color="success"
                size="small"
                icon={<CheckIcon />}
              />
              {result.failed > 0 && (
                <Chip
                  label={`נכשלו: ${result.failed}`}
                  color="error"
                  size="small"
                  icon={<ErrorIcon />}
                />
              )}
            </Box>

            {/* Error Details */}
            {result.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  שגיאות:
                </Typography>
                {result.errors.slice(0, 10).map((err, index) => (
                  <Typography key={`error-${err.row}-${index}`} variant="caption" component="div" sx={{ mb: 0.5 }}>
                    • שורה {err.row}: {err.error}
                  </Typography>
                ))}
                {result.errors.length > 10 && (
                  <Typography variant="caption" color="text.secondary" key="more-errors">
                    ועוד {result.errors.length - 10} שגיאות...
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        </Box>
      )}
    </Box>
  );
}
