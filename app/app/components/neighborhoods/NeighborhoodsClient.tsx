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
  Autocomplete,
} from '@mui/material';
import RtlButton from '@/app/components/ui/RtlButton';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PlaceIcon from '@mui/icons-material/Place';
import NeighborhoodModal, { SiteFormData } from '@/app/components/modals/NeighborhoodModal';
import DeleteConfirmationModal from '@/app/components/modals/DeleteConfirmationModal';
import {
  createNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
  listActivistCoordinatorsByCity,
} from '@/app/actions/neighborhoods';

type City = {
  id: string;
  name: string;
  code: string;
};

type Supervisor = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  siteCount: number;
  workerCount: number;
};

type Site = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  cityId: string;
  cityRelation?: City;
  _count?: {
    activistCoordinatorAssignments: number;
    activists: number;
  };
};

type Area = {
  id: string;
  regionName: string;
  regionCode: string;
};

type NeighborhoodsClientProps = {
  neighborhoods: Site[];
  cities: City[];
  areas: Area[];
  userRole: string;
  userCityId?: string;
};

export default function NeighborhoodsClient({ neighborhoods: initialSites, cities, areas, userRole, userCityId }: NeighborhoodsClientProps) {
  const t = useTranslations('sites');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'he';

  const [sites, setSites] = useState(initialSites);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCorporation] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);

  // Filtered sites based on search and corporation filter
  const filteredSites = useMemo(() => {
    let filtered = sites;
    
    if (filterCity !== 'all') {
      filtered = filtered.filter((site) => site.cityId === filterCity);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(query) ||
          site.city?.toLowerCase().includes(query) ||
          site.address?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [sites, searchQuery, filterCity]);

  // Stats
  const stats = useMemo(() => {
    if (!sites || !Array.isArray(sites)) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalActivists: 0,
        totalCoordinators: 0,
      };
    }
    
    return {
      total: sites.length,
      active: sites.filter((s) => s.isActive).length,
      inactive: sites.filter((s) => !s.isActive).length,
      totalActivists: sites.reduce((acc, s) => acc + (s._count?.activists || 0), 0),
      totalCoordinators: sites.reduce((acc, s) => acc + (s._count?.activistCoordinatorAssignments || 0), 0),
    };
  }, [sites]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, neighborhood: Site) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSite(neighborhood);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Fetch supervisors for a specific corporation
  const fetchSupervisors = async (cityId: string) => {
    setLoadingSupervisors(true);
    try {
      const result = await listActivistCoordinatorsByCity(cityId);
      if (result.success) {
        setSupervisors(result.activistCoordinators);
      } else {
        console.error('Failed to fetch activistCoordinators:', result.error);
        setSupervisors([]);
      }
    } catch (error) {
      console.error('Error fetching activistCoordinators:', error);
      setSupervisors([]);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  // Open create modal and fetch supervisors for first corporation
  const handleOpenCreateModal = async () => {
    // For City Coordinators, use their city; otherwise use filter or first city
    const corpId = userCityId || (filterCity !== 'all' ? filterCity : cities[0]?.id);
    if (corpId) {
      await fetchSupervisors(corpId);
    }
    setCreateModalOpen(true);
  };

  const handleCreateSite = async (data: SiteFormData): Promise<{ success: boolean; error?: string }> => {
    const result = await createNeighborhood(data);
    if (result.success && result.neighborhood) {
      setSites((prev) => [result.neighborhood!, ...prev]);
      setCreateModalOpen(false);
      router.refresh();
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to create neighborhood' };
    }
  };

  const handleEditClick = async () => {
    if (selectedSite) {
      await fetchSupervisors(selectedSite.cityId);
    }
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleEditSite = async (data: SiteFormData): Promise<{ success: boolean; error?: string }> => {
    if (!selectedSite) return { success: false, error: 'No site selected' };

    const result = await updateNeighborhood(selectedSite.id, data);
    if (result.success && result.neighborhood) {
      setSites((prev) =>
        prev.map((site) => (site.id === selectedSite.id ? result.neighborhood! : site))
      );
      setEditModalOpen(false);
      setSelectedSite(null);
      router.refresh();
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to update neighborhood' };
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteSite = async () => {
    if (!selectedSite) return;

    const result = await deleteNeighborhood(selectedSite.id);
    if (result.success) {
      setSites((prev) => prev.filter((site) => site.id !== selectedSite.id));
      setDeleteModalOpen(false);
      setSelectedSite(null);
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
      {/* Stats Overview - Neo-Morphic KPI Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        {[
          { label: isRTL ? 'סה"כ שכונות' : 'Total Neighborhoods', value: stats.total, color: colors.pastel.blue, bgColor: colors.pastel.blueLight, glow: shadows.glowBlue },
          { label: isRTL ? 'פעילות' : 'Active', value: stats.active, color: colors.pastel.green, bgColor: colors.pastel.greenLight, glow: shadows.glowGreen },
          { label: isRTL ? 'לא פעילות' : 'Inactive', value: stats.inactive, color: colors.pastel.red, bgColor: colors.pastel.redLight, glow: '0 0 20px rgba(228, 66, 88, 0.3)' },
          { label: isRTL ? 'פעילים' : 'Activists', value: stats.totalActivists, color: colors.pastel.purple, bgColor: colors.pastel.purpleLight, glow: shadows.glowPurple },
        ].map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Box
              sx={{
                p: 4, // Extra thick padding per style guide
                borderRadius: borderRadius['2xl'], // 20px - style guide standard
                backgroundColor: stat.bgColor,
                background: `linear-gradient(135deg, ${stat.bgColor} 0%, ${stat.bgColor}DD 100%)`, // Subtle gradient
                border: `2px solid ${stat.color}30`,
                boxShadow: shadows.neomorph, // Neo-morphic shadow
                textAlign: 'center',
                transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: stat.glow, // Color-specific glow
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: '2rem', // 32px - style guide KPI number
                  fontWeight: 600,
                  color: stat.color,
                  lineHeight: 1,
                  mb: 1,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem', // 14px - style guide subtitle
                  fontWeight: 400,
                  color: colors.neutral[500],
                  letterSpacing: '0.3px',
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
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 4,
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flex: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
          {/* Search Bar - Pill Shape per Style Guide */}
          <TextField
            placeholder={isRTL ? 'חיפוש אתרים...' : 'Search sites...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              maxWidth: { sm: 350 },
              '& .MuiOutlinedInput-root': {
                height: '44px', // Style guide height
                borderRadius: '22px', // Perfect pill (height / 2)
                backgroundColor: colors.neutral[0],
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)', // Inner shadow
                '& fieldset': {
                  borderColor: 'transparent', // No visible border
                },
                '&:hover fieldset': {
                  borderColor: colors.neutral[300],
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary.main,
                  borderWidth: 2,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#A1A7B3', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          
          {/* City Filter - Autocomplete with clean pill style */}
          <Autocomplete
            value={selectedCity}
            onChange={(event, newValue) => {
              setSelectedCity(newValue);
              setFilterCorporation(newValue ? newValue.id : 'all');
            }}
            options={cities}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={isRTL ? 'לא נמצאו ערים' : 'No cities found'}
            size="small"
            sx={{
              minWidth: 250,
              '& .MuiOutlinedInput-root': {
                height: '44px',
                borderRadius: borderRadius['2xl'], // 20px pill shape
                backgroundColor: colors.neutral[0],
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)', // Inner shadow like search
                paddingTop: '0 !important',
                paddingBottom: '0 !important',
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: colors.neutral[300],
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary.main,
                  borderWidth: 2,
                },
                '& .MuiAutocomplete-input': {
                  fontWeight: 500,
                  color: selectedCity ? colors.neutral[900] : colors.neutral[500],
                  padding: '0 !important',
                },
              },
            }}
            ListboxProps={{
              sx: {
                '& .MuiAutocomplete-option': {
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: colors.pastel.blueLight,
                  },
                  '&.Mui-focused': {
                    backgroundColor: colors.pastel.blueLight,
                  },
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={isRTL ? 'כל הערים' : 'All Cities'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: colors.neutral[400], fontSize: 20 }} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            PaperComponent={({ children }) => (
              <Box
                sx={{
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.large,
                  mt: 1,
                  overflow: 'hidden',
                }}
              >
                {children}
              </Box>
            )}
          />
        </Box>

        <RtlButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
          sx={{
            background: colors.gradients.primary,
            color: colors.neutral[0],
            px: 3,
            py: 1.75, // 14px vertical padding per style guide
            fontSize: '17px', // Slightly larger per style guide
            borderRadius: borderRadius['2xl'], // 20px - style guide standard
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: shadows.soft,
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: colors.primary.dark,
              boxShadow: shadows.glowBlue, // Colored glow on hover
              transform: 'translateY(-2px)', // Lift 2px per style guide
            },
            '&:active': {
              transform: 'translateY(0)', // Reset on click
            },
          }}
        >
          {t('newSite')}
        </RtlButton>
      </Box>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
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
            <LocationOnIcon sx={{ fontSize: 48, color: colors.pastel.blue }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              color: colors.neutral[700],
              fontWeight: 600,
              mb: 1,
            }}
          >
            {searchQuery || filterCity !== 'all' 
              ? (isRTL ? 'לא נמצאו תוצאות' : 'No results found') 
              : (isRTL ? 'אין אתרים עדיין' : 'No sites yet')}
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
            {searchQuery || filterCity !== 'all'
              ? isRTL
                ? 'נסה לחפש עם מילות מפתח אחרות או שנה את הסינון'
                : 'Try searching with different keywords or change the filter'
              : isRTL
                ? 'צור את האתר הראשון שלך כדי להתחיל'
                : 'Create your first site to get started'}
          </Typography>
          {!searchQuery && filterCity === 'all' && (
            <RtlButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateModal}
              sx={{
                background: colors.gradients.primary,
                px: 4,
                py: 1.5,
                borderRadius: borderRadius.lg,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              {t('newSite')}
            </RtlButton>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredSites.map((site) => {
            const avatarColor = getAvatarColor(site.name);
            return (
              <Grid item xs={12} sm={6} lg={4} key={site.id}>
                <Box
                  sx={{
                    p: 0,
                    background: colors.neutral[0],
                    borderRadius: borderRadius['2xl'], // 20px - style guide standard
                    boxShadow: shadows.neomorph, // Neo-morphic shadow
                    border: `1px solid ${colors.neutral[200]}`,
                    overflow: 'hidden',
                    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)', // -2px per style guide
                      boxShadow: shadows.glowBlue, // Colored glow on hover
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
                      onClick={(e) => handleMenuOpen(e, site)}
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
                        {getInitials(site.name)}
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
                          {site.name}
                        </Typography>
                        {site.cityRelation && (
                          <Chip
                            icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                            label={site.cityRelation.name}
                            size="small"
                            sx={{
                              backgroundColor: colors.neutral[0],
                              color: colors.neutral[600],
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              height: 24,
                              '& .MuiChip-icon': {
                                color: colors.neutral[500],
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Card Body */}
                  <Box sx={{ p: 3, pt: 2 }}>
                    {/* Location Info */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      {(site.city || site.country) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <PlaceIcon sx={{ fontSize: 18, color: colors.neutral[400] }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.neutral[600],
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {[site.city, site.country].filter(Boolean).join(', ')}
                          </Typography>
                        </Box>
                      )}
                      {site.address && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LocationOnIcon sx={{ fontSize: 18, color: colors.neutral[400] }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.neutral[600],
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {site.address}
                          </Typography>
                        </Box>
                      )}
                      {site.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <EmailIcon sx={{ fontSize: 18, color: colors.neutral[400] }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.neutral[600],
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {site.email}
                          </Typography>
                        </Box>
                      )}
                      {site.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <PhoneIcon sx={{ fontSize: 18, color: colors.neutral[400] }} />
                          <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
                            {site.phone}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Stats Row */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        pt: 2,
                        borderTop: `1px solid ${colors.neutral[200]}`,
                      }}
                    >
                      <Tooltip title={isRTL ? 'רכזי פעילים' : 'Activist Coordinators'}>
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
                            {site._count?.activistCoordinatorAssignments || 0}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title={isRTL ? 'פעילים' : 'Activists'}>
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
                          <PeopleIcon sx={{ fontSize: 18, color: colors.pastel.blue }} />
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: colors.pastel.blue }}
                          >
                            {site._count?.activists || 0}
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
                      backgroundColor: site.isActive ? colors.pastel.greenLight : colors.pastel.redLight,
                      borderTop: `1px solid ${site.isActive ? colors.pastel.green : colors.pastel.red}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    {site.isActive ? (
                      <CheckCircleIcon sx={{ fontSize: 18, color: colors.pastel.green }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 18, color: colors.pastel.red }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: site.isActive ? colors.pastel.green : colors.pastel.red,
                      }}
                    >
                      {site.isActive ? tCommon('active') : tCommon('inactive')}
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
      <NeighborhoodModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSite}
        mode="create"
        areas={areas}
        cities={cities}
        activistCoordinators={supervisors}
        onCityChange={fetchSupervisors}
        userCityId={userCityId}
      />

      {/* Edit Modal */}
      {selectedSite && (
        <NeighborhoodModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSite(null);
          }}
          onSubmit={handleEditSite}
          initialData={{
            name: selectedSite.name,
            cityId: selectedSite.cityId,
            activistCoordinatorId: '', // TODO: Fetch current supervisor assignment
            isActive: selectedSite.isActive,
          }}
          mode="edit"
          areas={areas}
          cities={cities}
          activistCoordinators={supervisors}
          onCityChange={fetchSupervisors}
          userCityId={userCityId}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedSite && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedSite(null);
          }}
          onConfirm={handleDeleteSite}
          title={isRTL ? 'מחיקת אתר' : 'Delete Site'}
          message={isRTL 
            ? 'האם אתה בטוח שברצונך למחוק את האתר הזה? פעולה זו תמחק גם את כל העובדים המשוייכים.'
            : 'Are you sure you want to delete this site? This will also delete all associated workers.'}
          itemName={selectedSite.name}
        />
      )}
    </Box>
  );
}

