/**
 * Voters Page Client Component - Hebrew RTL
 *
 * Features:
 * - Tabbed interface (List, Statistics, Duplicates)
 * - Create/Edit/View voter modals
 * - RBAC-aware (SuperAdmin sees duplicates tab)
 * - Mobile-responsive
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { VotersList } from './components/VotersList';
import { VoterForm } from './components/VoterForm';
import { VoterDetails } from './components/VoterDetails';
import { VoterStatistics } from './components/VoterStatistics';
import { DuplicatesDashboard } from './components/DuplicatesDashboard';
import { ExcelUpload } from './components/ExcelUpload';
import type { Voter } from '@/lib/voters';

type VotersPageClientProps = {
  isSuperAdmin: boolean;
};

export default function VotersPageClient({ isSuperAdmin }: VotersPageClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewVoter = (voter: Voter) => {
    setSelectedVoter(voter);
    setViewDialogOpen(true);
  };

  const handleEditVoter = (voter: Voter) => {
    setSelectedVoter(voter);
    setEditDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    setRefreshKey((prev) => prev + 1); // Trigger VotersList refresh
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedVoter(null);
    setRefreshKey((prev) => prev + 1); // Trigger VotersList refresh
  };

  const handleUploadSuccess = () => {
    setUploadDialogOpen(false);
    setRefreshKey((prev) => prev + 1); // Trigger VotersList refresh
  };

  return (
    <Box dir="rtl" sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 2, sm: 0 },
          mb: 3,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: { xs: 40, sm: 48 },
            '& .MuiTab-root': {
              minHeight: { xs: 40, sm: 48 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        >
          <Tab label="רשימת בוחרים" />
          <Tab label="סטטיסטיקות" />
          {isSuperAdmin && <Tab label="כפילויות" />}
        </Tabs>

        {activeTab === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 2 },
              mt: { xs: 0, sm: 0 },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              fullWidth={true}
              sx={{
                borderRadius: '9999px',
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1, sm: 1.25 },
                fontWeight: 600,
                minHeight: 44, // WCAG 2.1 touch target
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              ייבוא מאקסל
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              fullWidth={true}
              sx={{
                borderRadius: '9999px', // Pill-shaped (2025 UI/UX standard)
                px: { xs: 2.5, sm: 3 },
                py: { xs: 1, sm: 1.25 },
                fontWeight: 600,
                minHeight: 44, // WCAG 2.1 touch target
                fontSize: { xs: '0.875rem', sm: '1rem' },
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              הוסף בוחר
            </Button>
          </Box>
        )}
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <VotersList
          onViewVoter={handleViewVoter}
          onEditVoter={handleEditVoter}
          refreshKey={refreshKey}
        />
      )}

      {activeTab === 1 && <VoterStatistics />}

      {activeTab === 2 && isSuperAdmin && <DuplicatesDashboard />}

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            maxHeight: { xs: '95vh', sm: '90vh' },
            height: { xs: '95vh', sm: 'auto' },
            borderRadius: { xs: '32px', sm: '32px' }, // 2025 UI/UX: Significantly rounded
            m: { xs: 1, sm: 2 },
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
          הוספת בוחר חדש
          <IconButton onClick={() => setCreateDialogOpen(false)} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <VoterForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            maxHeight: { xs: '95vh', sm: '90vh' },
            height: { xs: '95vh', sm: 'auto' },
            borderRadius: { xs: '32px', sm: '32px' }, // 2025 UI/UX: Significantly rounded
            m: { xs: 1, sm: 2 },
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
          עריכת בוחר
          <IconButton onClick={() => setEditDialogOpen(false)} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {selectedVoter && (
            <VoterForm
              voter={selectedVoter}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: '32px', // 2025 UI/UX: Significantly rounded
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          פרטי בוחר
          <IconButton onClick={() => setViewDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedVoter && (
            <VoterDetails
              voterId={selectedVoter.id}
              onEdit={() => {
                setViewDialogOpen(false);
                handleEditVoter(selectedVoter);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: '32px', // 2025 UI/UX: Significantly rounded
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
