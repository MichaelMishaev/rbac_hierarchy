'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import RtlButton from '@/app/components/ui/RtlButton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import BusinessIcon from '@mui/icons-material/Business';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CityModal, { CorporationFormData } from '@/app/components/modals/CityModal';
import DeleteConfirmationModal from '@/app/components/modals/DeleteConfirmationModal';
import {
  createCity,
  updateCity,
  deleteCity,
  getAreaManagers,
} from '@/app/actions/cities';

type Corporation = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  areaManager?: {
    id: string;
    regionName: string;
    user: {
      fullName: string;
    };
  };
  _count?: {
    coordinators: number;
    activistCoordinators: number;
    neighborhoods: number;
    invitations: number;
  };
};

type AreaManager = {
  id: string;
  regionName: string;
  fullName: string;
  email: string;
};

type CitiesClientProps = {
  cities: Corporation[];
  userRole: string;
};

export default function CitiesClient({ cities: initialCorporations, userRole }: CitiesClientProps) {
  const t = useTranslations('citys');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'he';

  const [corporations, setCorporations] = useState(initialCorporations);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCorp, setSelectedCorp] = useState<Corporation | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [areaManagers, setAreaManagers] = useState<AreaManager[]>([]); // v1.4: Area Managers list

  // v1.4: Fetch area managers on mount
  useEffect(() => {
    const fetchAreaManagers = async () => {
      const result = await getAreaManagers();
      if (result.success && result.areaManagers) {
        setAreaManagers(result.areaManagers);
      }
    };
    fetchAreaManagers();
  }, []);

  // Filtered corporations based on search
  const filteredCorporations = useMemo(() => {
    if (!searchQuery.trim()) return corporations;
    const query = searchQuery.toLowerCase();
    return corporations.filter(
      (corp) =>
        corp.name.toLowerCase().includes(query) ||
        corp.code.toLowerCase().includes(query)
    );
  }, [corporations, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: corporations.length,
    active: corporations.filter((c) => c.isActive).length,
    inactive: corporations.filter((c) => !c.isActive).length,
    others: 0, // Could be used for different categorization in future
  }), [corporations]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, corp: Corporation) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCorp(corp);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateCorporation = async (data: CorporationFormData) => {
    const result = await createCity(data);
    if (result.success && result.city) {
      setCorporations((prev) => [result.city!, ...prev]);
      setCreateModalOpen(false);
      router.refresh();
    }
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleEditCorporation = async (data: CorporationFormData) => {
    if (!selectedCorp) return;

    const result = await updateCity(selectedCorp.id, data);
    if (result.success && result.city) {
      setCorporations((prev) =>
        prev.map((corp) => (corp.id === selectedCorp.id ? result.city! : corp))
      );
      setEditModalOpen(false);
      setSelectedCorp(null);
      router.refresh();
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteCorporation = async () => {
    if (!selectedCorp) return;

    const result = await deleteCity(selectedCorp.id);
    if (result.success) {
      setCorporations((prev) => prev.filter((corp) => corp.id !== selectedCorp.id));
      setDeleteModalOpen(false);
      setSelectedCorp(null);
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

  // Get random pastel color based on name
  const getAvatarColor = (name: string) => {
    const pastelColors = [
      { bg: colors.pastel.blueLight, text: colors.pastel.blue },
      { bg: colors.pastel.purpleLight, text: colors.pastel.purple },
      { bg: colors.pastel.greenLight, text: colors.pastel.green },
      { bg: colors.pastel.pinkLight, text: colors.pastel.pink },
      { bg: colors.pastel.orangeLight, text: colors.pastel.orange },
      { bg: colors.pastel.yellowLight, text: colors.status.orange },
    ];
    const index = name.charCodeAt(0) % pastelColors.length;
    return pastelColors[index];
  };

  return (
    <Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: t('total'), value: stats.total, color: colors.pastel.blue, bgColor: colors.pastel.blueLight },
          { label: t('active'), value: stats.active, color: colors.pastel.green, bgColor: colors.pastel.greenLight },
          { label: t('inactive'), value: stats.inactive, color: colors.pastel.red, bgColor: colors.pastel.redLight },
          { label: t('others'), value: stats.others, color: colors.pastel.purple, bgColor: colors.pastel.purpleLight },
        ].map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: borderRadius.xl,
                backgroundColor: stat.bgColor,
                border: `2px solid ${stat.color}30`,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: stat.color,
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.neutral[600],
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Search and Actions Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <TextField
          placeholder={isRTL ? 'חיפוש תאגידים...' : 'Search corporations...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{
            flex: 1,
            maxWidth: { sm: 400 },
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.lg,
              backgroundColor: colors.neutral[0],
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary.main,
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary.main,
                  borderWidth: 2,
                },
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.neutral[400] }} />
              </InputAdornment>
            ),
          }}
        />
        {/* SUPERADMIN and AREA_MANAGER can create new cities */}
        {(userRole === 'SUPERADMIN' || userRole === 'AREA_MANAGER') && (
          <RtlButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              background: colors.gradients.primary,
              color: colors.neutral[0],
              px: 3,
              py: 1.25,
              borderRadius: borderRadius.lg,
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
            {t('newCorporation')}
          </RtlButton>
        )}
      </Box>

      {/* Corporations Grid */}
      {filteredCorporations.length === 0 ? (
        <Box
          sx={{
            p: 8,
            background: colors.neutral[0],
            borderRadius: borderRadius['2xl'],
            boxShadow: shadows.soft,
            border: `2px dashed ${colors.neutral[300]}`,
            textAlign: 'center',
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
            <BusinessIcon sx={{ fontSize: 48, color: colors.pastel.blue }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              color: colors.neutral[700],
              fontWeight: 600,
              mb: 1,
            }}
          >
            {searchQuery ? (isRTL ? 'לא נמצאו תוצאות' : 'No results found') : t('noCorpsYet')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[500],
              mb: 3,
              maxWidth: 400,
              mx: 'auto',
            }}
          >
            {searchQuery
              ? isRTL
                ? 'נסה לחפש עם מילות מפתח אחרות'
                : 'Try searching with different keywords'
              : (userRole === 'SUPERADMIN' || userRole === 'AREA_MANAGER')
                ? t('createFirst')
                : 'לא הוקצו לך ערים עדיין'}
          </Typography>
          {!searchQuery && (userRole === 'SUPERADMIN' || userRole === 'AREA_MANAGER') && (
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
              {t('newCorporation')}
            </RtlButton>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCorporations.map((corp) => {
            const avatarColor = getAvatarColor(corp.name);
            return (
              <Grid item xs={12} sm={6} lg={4} key={corp.id}>
                <Box
                  sx={{
                    p: 0,
                    background: colors.neutral[0],
                    borderRadius: borderRadius['2xl'],
                    boxShadow: shadows.soft,
                    border: `1px solid ${colors.neutral[200]}`,
                    overflow: 'hidden',
                    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: shadows.large,
                      borderColor: colors.primary.main,
                    },
                  }}
                >
                  {/* Card Header with gradient */}
                  <Box
                    sx={{
                      p: 3,
                      pb: 4,
                      background: `linear-gradient(135deg, ${avatarColor.bg} 0%, ${colors.neutral[50]} 100%)`,
                      position: 'relative',
                    }}
                  >
                    {/* Menu Button */}
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, corp)}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        [isRTL ? 'left' : 'right']: 12,
                        backgroundColor: colors.neutral[0],
                        boxShadow: shadows.soft,
                        '&:hover': {
                          backgroundColor: colors.neutral[100],
                        },
                      }}
                      size="small"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>

                    {/* Avatar and Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          backgroundColor: avatarColor.bg,
                          color: avatarColor.text,
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          border: `3px solid ${colors.neutral[0]}`,
                          boxShadow: shadows.medium,
                        }}
                      >
                        {getInitials(corp.name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0, pr: isRTL ? 0 : 5, pl: isRTL ? 5 : 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: colors.neutral[800],
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {corp.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={corp.code}
                            size="small"
                            sx={{
                              backgroundColor: colors.neutral[0],
                              color: colors.neutral[600],
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              fontFamily: 'monospace',
                              height: 24,
                            }}
                          />
                          {/* v1.4: Area Manager Badge */}
                          {corp.areaManager && (
                            <Chip
                              label={`אזור: ${corp.areaManager.regionName}`}
                              size="small"
                              sx={{
                                backgroundColor: colors.pastel.orangeLight,
                                color: colors.pastel.orange,
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ p: 3, pt: 2 }}>
                    {/* Description */}
                    {corp.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.neutral[600],
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.6,
                        }}
                      >
                        {corp.description}
                      </Typography>
                    )}

                    {/* Stats Row */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        pt: 2,
                        borderTop: `1px solid ${colors.neutral[200]}`,
                      }}
                    >
                      <Tooltip title={isRTL ? 'מספר רכזי עיר בעיר זו' : 'Number of City Coordinators in this city'}>
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            py: 1,
                            px: 2,
                            borderRadius: borderRadius.md,
                            backgroundColor: colors.pastel.purpleLight,
                          }}
                        >
                          <PeopleIcon sx={{ fontSize: 18, color: colors.pastel.purple }} />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: colors.pastel.purple }}
                          >
                            {corp._count?.coordinators || 0}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title={isRTL ? 'מספר שכונות בעיר זו' : 'Number of neighborhoods in this city'}>
                        <Box
                          sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            py: 1,
                            px: 2,
                            borderRadius: borderRadius.md,
                            backgroundColor: colors.pastel.blueLight,
                          }}
                        >
                          <LocationOnIcon sx={{ fontSize: 18, color: colors.pastel.blue }} />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: colors.pastel.blue }}
                          >
                            {corp._count?.neighborhoods || 0}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Card Footer - Status */}
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      backgroundColor: corp.isActive ? colors.pastel.greenLight : colors.pastel.redLight,
                      borderTop: `1px solid ${corp.isActive ? colors.pastel.green : colors.pastel.red}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    {corp.isActive ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: colors.pastel.green }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 18, color: colors.pastel.red }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: corp.isActive ? colors.pastel.green : colors.pastel.red,
                      }}
                    >
                      {corp.isActive ? tCommon('active') : tCommon('inactive')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

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
          <Typography sx={{ fontWeight: 500, color: colors.pastel.red }}>{tCommon('delete')}</Typography>
        </MenuItem>
      </Menu>

      {/* Create Modal */}
      <CityModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCorporation}
        mode="create"
        areaManagers={areaManagers}
        userRole={userRole}
      />

      {/* Edit Modal */}
      {selectedCorp && (
        <CityModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedCorp(null);
          }}
          onSubmit={handleEditCorporation}
          initialData={{
            name: selectedCorp.name,
            code: selectedCorp.code,
            description: selectedCorp.description || '',
            isActive: selectedCorp.isActive,
            areaManagerId: selectedCorp.areaManager?.id || '', // v1.4: Pass current Area Manager ID
          }}
          mode="edit"
          areaManagers={areaManagers}
          userRole={userRole}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedCorp && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedCorp(null);
          }}
          onConfirm={handleDeleteCorporation}
          title={t('deleteTitle')}
          message={t('deleteConfirm')}
          itemName={selectedCorp.name}
        />
      )}
    </Box>
  );
}
