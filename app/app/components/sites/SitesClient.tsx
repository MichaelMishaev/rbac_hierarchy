'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Tooltip,
  Select,
} from '@mui/material';
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
import SiteModal, { SiteFormData } from '@/app/components/modals/SiteModal';
import DeleteConfirmationModal from '@/app/components/modals/DeleteConfirmationModal';
import {
  createSite,
  updateSite,
  deleteSite,
} from '@/app/actions/sites';

type Corporation = {
  id: string;
  name: string;
  code: string;
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
  corporationId: string;
  corporation?: Corporation;
  _count?: {
    supervisorAssignments: number;
    workers: number;
  };
};

type SitesClientProps = {
  sites: Site[];
  corporations: Corporation[];
};

export default function SitesClient({ sites: initialSites, corporations }: SitesClientProps) {
  const t = useTranslations('sites');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'he';

  const [sites, setSites] = useState(initialSites);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCorporation, setFilterCorporation] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Filtered sites based on search and corporation filter
  const filteredSites = useMemo(() => {
    let filtered = sites;
    
    if (filterCorporation !== 'all') {
      filtered = filtered.filter((site) => site.corporationId === filterCorporation);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (site) =>
          site.name.toLowerCase().includes(query) ||
          site.city?.toLowerCase().includes(query) ||
          site.address?.toLowerCase().includes(query) ||
          site.corporation?.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [sites, searchQuery, filterCorporation]);

  // Stats
  const stats = useMemo(() => ({
    total: sites.length,
    active: sites.filter((s) => s.isActive).length,
    inactive: sites.filter((s) => !s.isActive).length,
    totalWorkers: sites.reduce((acc, s) => acc + (s._count?.workers || 0), 0),
    totalSupervisors: sites.reduce((acc, s) => acc + (s._count?.supervisorAssignments || 0), 0),
  }), [sites]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, site: Site) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedSite(site);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateSite = async (data: SiteFormData) => {
    const result = await createSite(data);
    if (result.success && result.site) {
      setSites((prev) => [result.site!, ...prev]);
      setCreateModalOpen(false);
      router.refresh();
    }
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleEditSite = async (data: SiteFormData) => {
    if (!selectedSite) return;

    const result = await updateSite(selectedSite.id, data);
    if (result.success && result.site) {
      setSites((prev) =>
        prev.map((site) => (site.id === selectedSite.id ? result.site! : site))
      );
      setEditModalOpen(false);
      setSelectedSite(null);
      router.refresh();
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteSite = async () => {
    if (!selectedSite) return;

    const result = await deleteSite(selectedSite.id);
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
          { label: isRTL ? 'סה"כ אתרים' : 'Total Sites', value: stats.total, color: colors.pastel.blue, bgColor: colors.pastel.blueLight, glow: shadows.glowBlue },
          { label: isRTL ? 'פעילים' : 'Active', value: stats.active, color: colors.pastel.green, bgColor: colors.pastel.greenLight, glow: shadows.glowGreen },
          { label: isRTL ? 'לא פעילים' : 'Inactive', value: stats.inactive, color: colors.pastel.red, bgColor: colors.pastel.redLight, glow: '0 0 20px rgba(228, 66, 88, 0.3)' },
          { label: isRTL ? 'עובדים' : 'Workers', value: stats.totalWorkers, color: colors.pastel.purple, bgColor: colors.pastel.purpleLight, glow: shadows.glowPurple },
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
          
          {/* Filter Dropdown - Clean style without floating label */}
          <Select
            value={filterCorporation}
            onChange={(e) => setFilterCorporation(e.target.value)}
            displayEmpty
            size="small"
            sx={{
              minWidth: 200,
              height: '44px',
              borderRadius: borderRadius['2xl'], // 20px pill shape
              backgroundColor: colors.neutral[0],
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)', // Inner shadow like search
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.neutral[300],
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary.main,
                borderWidth: 2,
              },
              '& .MuiSelect-select': {
                fontWeight: 500,
                color: filterCorporation === 'all' ? colors.neutral[500] : colors.neutral[900],
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.large,
                  mt: 1,
                },
              },
            }}
          >
            <MenuItem value="all">{isRTL ? 'כל התאגידים' : 'All Corporations'}</MenuItem>
            {corporations.map((corp) => (
              <MenuItem key={corp.id} value={corp.id}>
                {corp.name}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
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
        </Button>
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
            {searchQuery || filterCorporation !== 'all' 
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
            {searchQuery || filterCorporation !== 'all'
              ? isRTL
                ? 'נסה לחפש עם מילות מפתח אחרות או שנה את הסינון'
                : 'Try searching with different keywords or change the filter'
              : isRTL
                ? 'צור את האתר הראשון שלך כדי להתחיל'
                : 'Create your first site to get started'}
          </Typography>
          {!searchQuery && filterCorporation === 'all' && (
            <Button
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
              {t('newSite')}
            </Button>
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
                        {site.corporation && (
                          <Chip
                            icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                            label={site.corporation.name}
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
                      <Tooltip title={isRTL ? 'מפקחים' : 'Supervisors'}>
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
                            {site._count?.supervisorAssignments || 0}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title={isRTL ? 'עובדים' : 'Workers'}>
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
                            {site._count?.workers || 0}
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
      <SiteModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSite}
        mode="create"
        corporations={corporations}
      />

      {/* Edit Modal */}
      {selectedSite && (
        <SiteModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSite(null);
          }}
          onSubmit={handleEditSite}
          initialData={{
            name: selectedSite.name,
            address: selectedSite.address || '',
            city: selectedSite.city || '',
            country: selectedSite.country || 'ישראל',
            phone: selectedSite.phone || '',
            email: selectedSite.email || '',
            corporationId: selectedSite.corporationId,
            isActive: selectedSite.isActive,
          }}
          mode="edit"
          corporations={corporations}
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

