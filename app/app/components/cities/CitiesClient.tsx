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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import RtlButton from '@/app/components/ui/RtlButton';
import CityDeletionAlert from '@/app/components/alerts/CityDeletionAlert';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import BusinessIcon from '@mui/icons-material/Business';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CityModal, { CorporationFormData } from '@/app/components/modals/CityModal';
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
  areaManagerId?: string | null;
  areaManager?: {
    id: string;
    regionName: string;
    user: {
      fullName: string;
      email: string;
    } | null;
  } | null;
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
  currentUserAreaManager?: {
    id: string;
    regionName: string;
    fullName: string;
    email: string;
  } | null;
  superiorUser: { fullName: string; email: string } | null;
};

export default function CitiesClient({ cities: initialCorporations, userRole, currentUserAreaManager, superiorUser }: CitiesClientProps) {
  const t = useTranslations('citys');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'he';

  const [corporations, setCorporations] = useState(initialCorporations);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCorp, setSelectedCorp] = useState<Corporation | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [areaManagers, setAreaManagers] = useState<AreaManager[]>([]); // v1.4: Area Managers list
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [deletionAlert, setDeletionAlert] = useState<{
    open: boolean;
    cityId: string;
    cityName: string;
    neighborhoodCount: number;
    neighborhoods: Array<{ id: string; name: string; code: string }>;
  } | null>(null);

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

  // Refetch area managers (called after quick create)
  const refetchAreaManagers = async () => {
    const result = await getAreaManagers();
    if (result.success && result.areaManagers) {
      setAreaManagers(result.areaManagers);
    }
  };

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
    // Return result so modal can handle errors
    return {
      success: result.success,
      error: result.error,
    };
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteError(''); // Clear any previous errors
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCorp) return;

    try {
      setDeleteError(''); // Clear previous errors
      const result = await deleteCity(selectedCorp.id);

      if (result.success) {
        setCorporations((prev) => prev.filter((corp) => corp.id !== selectedCorp.id));
        setDeleteConfirmOpen(false);
        setSelectedCorp(null);
        router.refresh();
      } else {
        // Check if error is due to existing neighborhoods
        if (result.code === 'NEIGHBORHOODS_EXIST' && result.neighborhoodCount && result.neighborhoods) {
          // Close the delete confirmation modal
          setDeleteConfirmOpen(false);

          // Show the custom deletion alert
          setDeletionAlert({
            open: true,
            cityId: selectedCorp.id,
            cityName: result.cityName || selectedCorp.name,
            neighborhoodCount: result.neighborhoodCount,
            neighborhoods: result.neighborhoods,
          });
        } else {
          // Show other errors in dialog
          setDeleteError(result.error || 'שגיאה במחיקת העיר');
        }
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      setDeleteError('שגיאה לא צפויה במחיקת העיר. אנא נסה שוב.');
    }
  };

  const handleEditCorporation = async (data: CorporationFormData) => {
    if (!selectedCorp) return { success: false, error: 'No city selected' };

    const result = await updateCity(selectedCorp.id, data);
    if (result.success && result.city) {
      setCorporations((prev) =>
        prev.map((corp) => (corp.id === selectedCorp.id ? result.city! : corp))
      );
      setEditModalOpen(false);
      setSelectedCorp(null);
      router.refresh();
    }
    // Return result so modal can handle errors
    return {
      success: result.success,
      error: result.error,
    };
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

      {/* Permission Info Banner - Only show for Area Managers */}
      {userRole === 'AREA_MANAGER' && superiorUser && (
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            background: colors.pastel.blueLight,
            border: `1px solid ${colors.pastel.blue}`,
            borderRadius: borderRadius.lg,
            boxShadow: shadows.soft,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
          data-testid="permission-info-banner"
        >
          <InfoOutlinedIcon
            sx={{
              fontSize: 28,
              color: colors.pastel.blue,
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: colors.neutral[900],
                mb: 0.5,
              }}
            >
              רק מנהל המערכת יכול ליצור ערים חדשות
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="body2"
                sx={{
                  color: colors.neutral[700],
                }}
              >
                ליצירת עיר חדשה, פנה ל:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: colors.pastel.blue,
                  }}
                >
                  {superiorUser.fullName}
                </Typography>
                <EmailIcon sx={{ fontSize: 16, color: colors.neutral[500] }} />
                <Typography
                  variant="body2"
                  component="a"
                  href={`mailto:${superiorUser.email}`}
                  sx={{
                    color: colors.pastel.blue,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {superiorUser.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

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
          placeholder={isRTL ? 'חיפוש שכונות...' : 'Search corporations...'}
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
                      background: `linear-gradient(135deg, ${avatarColor?.bg || colors.primary.main} 0%, ${colors.neutral[50]} 100%)`,
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
                          backgroundColor: avatarColor?.bg || colors.primary.main,
                          color: avatarColor?.text || '#fff',
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
                        </Box>
                      </Box>
                    </Box>

                    {/* Area Manager Info Row */}
                    {corp.areaManager && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: borderRadius.md,
                          backgroundColor: colors.pastel.orangeLight,
                          border: `1px solid ${colors.pastel.orange}30`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.pastel.orange,
                            fontWeight: 700,
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          אזור: {corp.areaManager.regionName}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.neutral[700],
                            fontWeight: 600,
                            display: 'block',
                          }}
                        >
                          מנהל: {corp.areaManager.user?.fullName || 'לא משויך'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ p: 3, pt: 2 }}>
                    {/* Restore the description and stats that were accidentally removed */}
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

                    {/* Stats Row - KEEP THIS */}
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

                  {/* Card Footer - Status - KEEP THIS TOO */}
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

      {/* Context Menu - RESTORE THIS */}
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
        {/* Delete option - SuperAdmin ONLY */}
        {userRole === 'SUPERADMIN' && (
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
        )}
      </Menu>

      {/* Create Modal - KEEP */}
      <CityModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateCorporation}
        mode="create"
        areaManagers={areaManagers}
        userRole={userRole}
        currentUserAreaManager={currentUserAreaManager}
        onAreaManagerCreated={refetchAreaManagers}
      />

      {/* Edit Modal - KEEP */}
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
          currentUserAreaManager={currentUserAreaManager}
          onAreaManagerCreated={refetchAreaManagers}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteError('');
          setDeleteConfirmOpen(false);
        }}
        PaperProps={{
          sx: {
            borderRadius: borderRadius.xl,
            boxShadow: shadows.large,
            maxWidth: 450,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            pb: 2,
          }}
        >
          מחיקת עיר
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: colors.neutral[700] }}>
            האם אתה בטוח שברצונך למחוק את העיר{' '}
            <strong>{selectedCorp?.name}</strong>?
          </Typography>
          {/* Show error when deletion is blocked */}
          {deleteError && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                borderRadius: borderRadius.md,
                '& .MuiAlert-message': {
                  fontWeight: 600,
                },
              }}
            >
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 2 }}>
          <Button
            onClick={() => {
              setDeleteError('');
              setDeleteConfirmOpen(false);
            }}
            variant="outlined"
            sx={{
              borderRadius: borderRadius.lg,
              px: 3,
              fontWeight: 600,
              borderColor: colors.neutral[300],
              color: colors.neutral[700],
              '&:hover': {
                borderColor: colors.neutral[400],
                backgroundColor: colors.neutral[50],
              },
            }}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              borderRadius: borderRadius.lg,
              px: 3,
              fontWeight: 600,
              backgroundColor: colors.pastel.red,
              '&:hover': {
                backgroundColor: colors.status.error,
              },
            }}
          >
            מחק עיר
          </Button>
        </DialogActions>
      </Dialog>

      {/* City Deletion Alert - Shown when city has neighborhoods */}
      <Snackbar
        open={deletionAlert?.open ?? false}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          top: { xs: '16px !important', sm: '24px !important' },
          left: { xs: '8px !important', sm: 'auto !important' },
          right: { xs: '8px !important', sm: 'auto !important' },
          maxWidth: { xs: 'calc(100% - 16px)', sm: '700px' },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
        }}
      >
        <div>
          {deletionAlert && (
            <CityDeletionAlert
              cityId={deletionAlert.cityId}
              cityName={deletionAlert.cityName}
              neighborhoodCount={deletionAlert.neighborhoodCount}
              neighborhoods={deletionAlert.neighborhoods}
              onClose={() => setDeletionAlert(null)}
            />
          )}
        </div>
      </Snackbar>
    </Box>
  );
}
