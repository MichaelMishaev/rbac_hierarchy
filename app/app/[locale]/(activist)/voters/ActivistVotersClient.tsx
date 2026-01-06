/**
 * Activist Voters Client Component - Hebrew RTL
 *
 * Features:
 * - List of voters inserted by the activist
 * - Add voter button
 * - Excel import functionality
 * - Stats display
 */

'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  SortByAlpha as SortByAlphaIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { ActivistVoterCard } from '@/app/components/activists/ActivistVoterCard';
import type { Voter } from '@prisma/client';

// ⚡ Performance: Lazy load ExcelUpload (22MB ExcelJS library)
const ExcelUpload = dynamic(
  () => import('./components/ExcelUpload').then((mod) => ({ default: mod.ExcelUpload })),
  {
    loading: () => (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    ),
    ssr: false,
  }
);

type ActivistVotersClientProps = {
  user: {
    fullName: string;
    activistProfile: {
      neighborhood: {
        name: string;
      };
      city: {
        name: string;
      };
    };
  };
  voters: Voter[];
};

export default function ActivistVotersClient({ user, voters: initialVoters }: ActivistVotersClientProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [showDistinctOnly, setShowDistinctOnly] = useState(false);

  // Detect duplicates (same fullName + phone)
  const { duplicateVoterIds, duplicateCountMap } = useMemo(() => {
    const map = new Map<string, string[]>();

    initialVoters.forEach((voter) => {
      const key = `${voter.fullName.trim().toLowerCase()}|${voter.phone?.trim() || ''}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(voter.id);
    });

    // Filter to only entries with > 1 voter
    const duplicates = new Map<string, string[]>();
    const countMap = new Map<string, number>();

    map.forEach((ids) => {
      if (ids.length > 1) {
        duplicates.set(ids[0], ids);
        // Map each voter ID to its duplicate count
        ids.forEach((id) => countMap.set(id, ids.length));
      }
    });

    const ids = new Set<string>();
    duplicates.forEach((voterIds) => {
      voterIds.forEach((id) => ids.add(id));
    });

    return {
      duplicateVoterIds: ids,
      duplicateCountMap: countMap,
    };
  }, [initialVoters]);

  // Filter and sort voters
  const filteredAndSortedVoters = useMemo(() => {
    let result = [...initialVoters];

    // Filter by duplicates if enabled
    if (showDuplicatesOnly) {
      result = result.filter((voter) => duplicateVoterIds.has(voter.id));
    }

    // Show distinct only (one per duplicate group)
    if (showDistinctOnly) {
      const seen = new Set<string>();
      result = result.filter((voter) => {
        const key = `${voter.fullName.trim().toLowerCase()}|${voter.phone?.trim() || ''}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // Filter by search query (name or phone)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (voter) =>
          voter.fullName.toLowerCase().includes(query) ||
          (voter.phone && voter.phone.includes(query))
      );
    }

    // Sort by Hebrew alphabetical order
    result.sort((a, b) => {
      const comparison = a.fullName.localeCompare(b.fullName, 'he');
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [initialVoters, searchQuery, sortOrder, showDuplicatesOnly, showDistinctOnly, duplicateVoterIds]);

  // Calculate distinct count
  const distinctCount = useMemo(() => {
    const seen = new Set<string>();
    initialVoters.forEach((voter) => {
      const key = `${voter.fullName.trim().toLowerCase()}|${voter.phone?.trim() || ''}`;
      seen.add(key);
    });
    return seen.size;
  }, [initialVoters]);

  // Calculate stats (use filtered voters for accurate counts)
  const stats = {
    total: filteredAndSortedVoters.length,
    totalAll: initialVoters.length,
    distinct: distinctCount,
    duplicates: duplicateVoterIds.size,
    supporter: filteredAndSortedVoters.filter((v) => v.supportLevel === 'תומך').length,
    hesitant: filteredAndSortedVoters.filter((v) => v.supportLevel === 'מהסס').length,
    opposed: filteredAndSortedVoters.filter((v) => v.supportLevel === 'מתנגד').length,
    noAnswer: filteredAndSortedVoters.filter((v) => v.supportLevel === 'לא ענה').length,
  };

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
    // Refresh the page to show new voters
    window.location.reload();
  };

  const handleExportToExcel = async () => {
    try {
      // ⚡ Performance: Lazy load ExcelJS (22MB) only when exporting
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('בוחרים');

      // Set RTL
      worksheet.views = [{ rightToLeft: true }];

      // Define columns
      worksheet.columns = [
        { header: 'שם מלא', key: 'fullName', width: 20 },
        { header: 'טלפון', key: 'phone', width: 15 },
        { header: 'כתובת', key: 'voterAddress', width: 30 },
        { header: 'רמת תמיכה', key: 'supportLevel', width: 15 },
        { header: 'סטטוס יצירת קשר', key: 'contactStatus', width: 20 },
        { header: 'הערות', key: 'notes', width: 30 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add data (use current filtered view)
      filteredAndSortedVoters.forEach((voter) => {
        worksheet.addRow({
          fullName: voter.fullName,
          phone: voter.phone || '',
          voterAddress: voter.voterAddress || '',
          supportLevel: voter.supportLevel || '',
          contactStatus: voter.contactStatus || '',
          notes: voter.notes || '',
        });
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `בוחרים_${user.fullName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();

      // Clean up after download starts
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('שגיאה בייצוא קובץ האקסל. אנא נסה שוב.');
    }
  };

  return (
    <Box key={refreshKey}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          שלום, {user.fullName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          📍 {user.activistProfile.neighborhood.name}, {user.activistProfile.city.name}
        </Typography>
      </Box>

      {/* Stats Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📊 הבוחרים שלי ({searchQuery || showDuplicatesOnly || showDistinctOnly ? `${stats.total} מתוך ${stats.totalAll}` : stats.totalAll})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            <Chip
              label={`🟢 תומך: ${stats.supporter}`}
              color="success"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`🟡 מהסס: ${stats.hesitant}`}
              color="warning"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`🔴 מתנגד: ${stats.opposed}`}
              color="error"
              variant="outlined"
              size="small"
            />
            <Chip
              label={`⚪ לא ענה: ${stats.noAnswer}`}
              color="default"
              variant="outlined"
              size="small"
            />
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            <Chip
              label={`📋 סה"כ ייחודיים: ${stats.distinct}`}
              color="info"
              variant="outlined"
              size="small"
            />
            {stats.duplicates > 0 && (
              <Chip
                label={`⚠️ כפילויות: ${stats.duplicates}`}
                color="error"
                variant={showDuplicatesOnly ? 'filled' : 'outlined'}
                size="small"
                onClick={() => {
                  setShowDuplicatesOnly(!showDuplicatesOnly);
                  if (!showDuplicatesOnly) setShowDistinctOnly(false);
                }}
                sx={{ cursor: 'pointer' }}
                data-testid="duplicates-chip"
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Filter and Sort Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Search Filter */}
            <TextField
              fullWidth
              placeholder="חיפוש לפי שם או טלפון"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '50px',
                },
              }}
              data-testid="voter-search-input"
            />

            {/* Sort Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                <SortByAlphaIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                מיון:
              </Typography>
              <ToggleButtonGroup
                value={sortOrder}
                exclusive
                onChange={(_, value) => value && setSortOrder(value)}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: '50px',
                    px: 3,
                  },
                }}
              >
                <ToggleButton value="asc" data-testid="sort-asc-button">
                  א-ת
                </ToggleButton>
                <ToggleButton value="desc" data-testid="sort-desc-button">
                  ת-א
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Distinct Checkbox */}
            {stats.duplicates > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showDistinctOnly}
                    onChange={(e) => {
                      setShowDistinctOnly(e.target.checked);
                      if (e.target.checked) setShowDuplicatesOnly(false);
                    }}
                    data-testid="show-distinct-checkbox"
                  />
                }
                label="הצג רק ייחודיים (1 לכל כפילות)"
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              flex: 1,
              borderRadius: '50px',
              py: 1.5,
              fontWeight: 600,
            }}
            data-testid="import-excel-button"
          >
            ייבוא מאקסל
          </Button>
          <Button
            component={Link}
            href="/voters/new"
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              flex: 1,
              borderRadius: '50px',
              py: 1.5,
              fontWeight: 600,
            }}
            data-testid="add-voter-button"
          >
            הוסף בוחר חדש
          </Button>
        </Box>
        <Button
          variant="outlined"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={handleExportToExcel}
          disabled={filteredAndSortedVoters.length === 0}
          sx={{
            borderRadius: '50px',
            py: 1.5,
            fontWeight: 600,
          }}
          data-testid="export-excel-button"
        >
          ייצוא לאקסל ({filteredAndSortedVoters.length} בוחרים)
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Voters List */}
      {initialVoters.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              עדיין לא הוספת בוחרים.
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              לחץ על אחד הכפתורים למעלה כדי להוסיף את הבוחר הראשון שלך.
            </Typography>
          </CardContent>
        </Card>
      ) : filteredAndSortedVoters.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              לא נמצאו בוחרים התואמים לחיפוש &quot;{searchQuery}&quot;
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
              נסה לחפש במונח אחר או נקה את החיפוש.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredAndSortedVoters.map((voter) => (
            <ActivistVoterCard
              key={voter.id}
              voter={voter}
              isDuplicate={duplicateVoterIds.has(voter.id)}
              duplicateCount={showDistinctOnly ? duplicateCountMap.get(voter.id) : undefined}
            />
          ))}
        </Stack>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: '32px',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            py: 2,
          }}
        >
          ייבוא בוחרים מאקסל
          <IconButton onClick={() => setUploadDialogOpen(false)} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ExcelUpload onSuccess={handleUploadSuccess} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
