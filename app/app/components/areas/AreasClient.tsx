'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import RtlButton from '@/app/components/ui/RtlButton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import PublicIcon from '@mui/icons-material/Public';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AreaModal, { AreaFormData } from '@/app/components/modals/AreaModal';
import DeleteConfirmationModal from '@/app/components/modals/DeleteConfirmationModal';
import {
  createArea,
  updateArea,
  deleteArea,
  getAvailableAreaManagerUsers,
} from '@/app/actions/areas';

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
};

type Area = {
  id: string;
  regionName: string;
  regionCode: string;
  isActive: boolean;
  metadata: any;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
  cities?: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  }[];
  citiesCount: number;
};

type AreasClientProps = {
  areas: Area[];
};

export default function AreasClient({ areas: initialAreas }: AreasClientProps) {
  const t = useTranslations('areas');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'he';

  const [areas, setAreas] = useState(initialAreas);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Fetch available users when opening create modal
  useEffect(() => {
    if (createModalOpen) {
      fetchAvailableUsers();
    }
  }, [createModalOpen]);

  const fetchAvailableUsers = async () => {
    const result = await getAvailableAreaManagerUsers();
    if (result.success && result.users) {
      setAvailableUsers(result.users);
    }
  };

  // Filtered areas based on search
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    const query = searchQuery.toLowerCase();
    return areas.filter(
      (area) =>
        area.regionName.toLowerCase().includes(query) ||
        area.regionCode.toLowerCase().includes(query) ||
        area.user.fullName.toLowerCase().includes(query) ||
        area.user.email.toLowerCase().includes(query)
    );
  }, [areas, searchQuery]);

  // Stats
  const stats = useMemo(
    () => ({
      total: areas.length,
      active: areas.filter((a) => a.isActive).length,
      totalCities: areas.reduce((acc, a) => acc + a.citiesCount, 0),
    }),
    [areas]
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, area: Area) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedArea(area);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateArea = async (data: AreaFormData) => {
    const result = await createArea(data);
    if (result.success && result.area) {
      setAreas((prev) => [result.area!, ...prev]);
      setCreateModalOpen(false);
      router.refresh();
    }
    return result;
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleEditArea = async (data: AreaFormData) => {
    if (!selectedArea) return { success: false, error: 'No area selected' };

    const result = await updateArea(selectedArea.id, data);
    if (result.success && result.area) {
      setAreas((prev) => prev.map((area) => (area.id === selectedArea.id ? result.area! : area)));
      setEditModalOpen(false);
      setSelectedArea(null);
      router.refresh();
    }
    return result;
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteArea = async () => {
    if (!selectedArea) return;

    const result = await deleteArea(selectedArea.id);
    if (result.success) {
      setAreas((prev) => prev.filter((area) => area.id !== selectedArea.id));
      setDeleteModalOpen(false);
      setSelectedArea(null);
      router.refresh();
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color
  const getAvatarColor = (name: string) => {
    const pastelColors = [
      { bg: colors.pastel.blueLight, text: colors.pastel.blue },
      { bg: colors.pastel.purpleLight, text: colors.pastel.purple },
      { bg: colors.pastel.greenLight, text: colors.pastel.green },
      { bg: colors.pastel.pinkLight, text: colors.pastel.pink },
      { bg: colors.pastel.orangeLight, text: colors.pastel.orange },
    ];
    const index = name.charCodeAt(0) % pastelColors.length;
    return pastelColors[index];
  };

  return (
    <Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: borderRadius.xl,
              boxShadow: shadows.soft,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.total}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('title')}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: borderRadius.xl,
              boxShadow: shadows.soft,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.active}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              אזורים פעילים
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: borderRadius.xl,
              boxShadow: shadows.soft,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {stats.totalCities}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('cities')}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Actions Bar */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <TextField
          placeholder="חיפוש לפי שם אזור, קוד או מנהל..."
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
            flex: 1,
            maxWidth: { sm: 400 },
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.md,
              background: 'white',
            },
          }}
        />

        <RtlButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{
            borderRadius: borderRadius.md,
            px: 3,
            py: 1.25,
            background: colors.gradients.primary,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: shadows.medium,
            '&:hover': {
              background: colors.primary.dark,
              boxShadow: shadows.glowBlue,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {t('newArea')}
        </RtlButton>
      </Box>

      {/* Empty State */}
      {filteredAreas.length === 0 && !searchQuery && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            background: colors.neutral[0],
            borderRadius: borderRadius['2xl'],
            boxShadow: shadows.soft,
            border: `2px dashed ${colors.neutral[300]}`,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: colors.pastel.blueLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <PublicIcon sx={{ fontSize: 48, color: colors.pastel.blue }} />
          </Box>
          <Typography variant="h6" sx={{ color: colors.neutral[600], mb: 1 }}>
            {t('noAreasYet')}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.neutral[500], mb: 3 }}>
            צור את האזור הראשון כדי להתחיל לנהל ערים ופעילויות
          </Typography>
          <RtlButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              background: colors.gradients.primary,
              px: 4,
              py: 1.5,
              borderRadius: borderRadius.lg,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {t('newArea')}
          </RtlButton>
        </Box>
      )}

      {/* No Search Results */}
      {filteredAreas.length === 0 && searchQuery && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: colors.neutral[600] }}>
            לא נמצאו תוצאות עבור &quot;{searchQuery}&quot;
          </Typography>
        </Box>
      )}

      {/* Areas Grid */}
      <Grid container spacing={3}>
        {filteredAreas.map((area) => {
          const avatarColor = getAvatarColor(area.regionName);
          return (
            <Grid item xs={12} sm={6} lg={4} key={area.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: borderRadius.xl,
                  boxShadow: shadows.soft,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: shadows.medium,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: avatarColor.bg,
                        color: avatarColor.text,
                        fontSize: '1.25rem',
                        fontWeight: 700,
                      }}
                    >
                      <PublicIcon />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: colors.neutral[900],
                          mb: 0.5,
                          lineHeight: 1.3,
                        }}
                      >
                        {area.regionName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.neutral[500],
                          display: 'block',
                          fontFamily: 'monospace',
                        }}
                      >
                        {area.regionCode}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={area.isActive ? 'פעיל' : 'לא פעיל'}
                        size="small"
                        icon={area.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        sx={{
                          bgcolor: area.isActive
                            ? colors.pastel.greenLight
                            : colors.pastel.redLight,
                          color: area.isActive ? colors.status.green : colors.status.red,
                          fontWeight: 600,
                          '& .MuiChip-icon': {
                            color: 'inherit',
                          },
                        }}
                      />

                      <IconButton
                        onClick={(e) => handleMenuOpen(e, area)}
                        size="small"
                        sx={{
                          '&:hover': {
                            backgroundColor: colors.neutral[100],
                          },
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Manager Info */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: borderRadius.md,
                      bgcolor: colors.neutral[50],
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon sx={{ fontSize: 18, color: colors.neutral[600] }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                        מנהל אזור
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: colors.neutral[900], mb: 0.5 }}>
                      {area.user.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                      {area.user.email}
                    </Typography>
                  </Box>

                  {/* Stats */}
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      pt: 2,
                      borderTop: `1px solid ${colors.neutral[200]}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 18, color: colors.neutral[500] }} />
                      <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                        <strong>{area.citiesCount}</strong> ערים
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: isRTL ? 'left' : 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: isRTL ? 'left' : 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: borderRadius.lg,
            boxShadow: shadows.large,
            minWidth: 160,
          },
        }}
      >
        <MenuItem
          onClick={handleEditClick}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              backgroundColor: colors.pastel.blueLight,
            },
          }}
        >
          <EditIcon sx={{ fontSize: 20, color: colors.pastel.blue }} />
          <Typography sx={{ fontWeight: 500 }}>{tCommon('edit')}</Typography>
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
            '&:hover': {
              backgroundColor: colors.pastel.redLight,
            },
          }}
        >
          <DeleteIcon sx={{ fontSize: 20, color: colors.pastel.red }} />
          <Typography sx={{ fontWeight: 500, color: colors.pastel.red }}>
            {tCommon('delete')}
          </Typography>
        </MenuItem>
      </Menu>

      {/* Create Modal */}
      <AreaModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateArea}
        mode="create"
        availableUsers={availableUsers}
      />

      {/* Edit Modal */}
      {selectedArea && (
        <AreaModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedArea(null);
          }}
          onSubmit={handleEditArea}
          initialData={{
            regionName: selectedArea.regionName,
            regionCode: selectedArea.regionCode,
            userId: selectedArea.user.id,
            description: selectedArea.metadata?.description || '',
            isActive: selectedArea.isActive,
          }}
          mode="edit"
          availableUsers={availableUsers}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedArea && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedArea(null);
          }}
          onConfirm={handleDeleteArea}
          title="מחיקת אזור"
          message={t('deleteConfirm')}
          itemName={selectedArea.regionName}
        />
      )}
    </Box>
  );
}
