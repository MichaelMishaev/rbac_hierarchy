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
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  SortByAlpha as SortByAlphaIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { ActivistVoterCard } from '@/app/components/activists/ActivistVoterCard';
import { ExcelUpload } from './components/ExcelUpload';
import type { Voter } from '@prisma/client';

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

  // Detect duplicates (same fullName + phone)
  const duplicateMap = useMemo(() => {
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
    map.forEach((ids, key) => {
      if (ids.length > 1) {
        duplicates.set(key, ids);
      }
    });

    return duplicates;
  }, [initialVoters]);

  // Get set of duplicate voter IDs for quick lookup
  const duplicateVoterIds = useMemo(() => {
    const ids = new Set<string>();
    duplicateMap.forEach((voterIds) => {
      voterIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [duplicateMap]);

  // Filter and sort voters
  const filteredAndSortedVoters = useMemo(() => {
    let result = [...initialVoters];

    // Filter by duplicates if enabled
    if (showDuplicatesOnly) {
      result = result.filter((voter) => duplicateVoterIds.has(voter.id));
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
  }, [initialVoters, searchQuery, sortOrder, showDuplicatesOnly, duplicateVoterIds]);

  // Calculate stats (use filtered voters for accurate counts)
  const stats = {
    total: filteredAndSortedVoters.length,
    totalAll: initialVoters.length,
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
            📊 הבוחרים שלי ({searchQuery || showDuplicatesOnly ? `${stats.total} מתוך ${stats.totalAll}` : stats.totalAll})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
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
            {stats.duplicates > 0 && (
              <Chip
                label={`⚠️ כפילויות: ${stats.duplicates}`}
                color="error"
                variant={showDuplicatesOnly ? 'filled' : 'outlined'}
                size="small"
                onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
