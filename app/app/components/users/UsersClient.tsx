'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  TextField,
  Select,
  MenuItem as SelectMenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import LockResetIcon from '@mui/icons-material/LockReset';
import RtlButton from '@/app/components/ui/RtlButton';
import UserModal from './UserModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import ResetPasswordDialog from './ResetPasswordDialog';
import { deleteUser, getExistingRegions } from '@/app/actions/users';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR' | 'SUPERADMIN' | 'ACTIVIST';
  lastLoginAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  // Role-specific relations
  areaManager?: {
    regionName: string;
    regionCode: string | null;
  } | null;
  coordinatorOf?: {
    city: { id: string; name: string; code: string };
  }[];
  activistCoordinatorOf?: {
    city: { id: string; name: string; code: string };
  }[];
  activistCoordinatorNeighborhoods?: {
    neighborhood: {
      id: string;
      name: string;
      city: string | null;
    };
  }[];
};

type City = {
  id: string;
  name: string;
  code: string;
};

type Neighborhood = {
  id: string;
  name: string;
  cityId: string;
};

type UsersClientProps = {
  users: User[];
  cities: City[];
  neighborhoods: Neighborhood[];
  currentUserRole: 'SUPERADMIN' | 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR';
  currentUserCityId: string | null;
};

// ============================================
// HIERARCHY HELPER FUNCTIONS
// ============================================

/**
 * Get hierarchy level for a role
 * Lower number = higher in hierarchy
 */
function getHierarchyLevel(role: string): number {
  switch (role) {
    case 'SUPERADMIN':
      return 1;
    case 'AREA_MANAGER':
      return 2;
    case 'CITY_COORDINATOR':
      return 3;
    case 'ACTIVIST_COORDINATOR':
      return 4;
    case 'ACTIVIST':
      return 5;
    default:
      return 999;
  }
}

/**
 * Check if currentUser can manage targetUser based on hierarchy
 * Rule: You can only manage users BELOW you in the hierarchy
 */
function canManageUser(currentUserRole: string, targetUserRole: string): boolean {
  const currentLevel = getHierarchyLevel(currentUserRole);
  const targetLevel = getHierarchyLevel(targetUserRole);

  // Can only manage users at a LOWER level (higher number)
  return targetLevel > currentLevel;
}

export default function UsersClient({ users, cities, neighborhoods, currentUserRole, currentUserCityId }: UsersClientProps) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Local users state for optimistic updates
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [existingRegions, setExistingRegions] = useState<string[]>([]);

  // User details dialog state
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);

  // Filter state
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Sync local users with server users when props change
  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Fetch existing regions on mount
  useEffect(() => {
    async function fetchRegions() {
      const result = await getExistingRegions();
      if (result.success) {
        setExistingRegions(result.regions);
      }
    }
    fetchRegions();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    // Extract role-specific data from relations
    let cityId: string | null = null;
    let regionName: string | null = null;
    let neighborhoodIds: string[] = [];

    // Area Manager: Extract regionName
    if (selectedUser.role === 'AREA_MANAGER' && selectedUser.areaManager) {
      regionName = selectedUser.areaManager.regionName;
    }
    // City Coordinator: Extract cityId
    else if (selectedUser.role === 'CITY_COORDINATOR' && selectedUser.coordinatorOf && selectedUser.coordinatorOf.length > 0) {
      cityId = selectedUser.coordinatorOf[0].city.id;
    }
    // Activist Coordinator: Extract cityId and neighborhoodIds
    else if (selectedUser.role === 'ACTIVIST_COORDINATOR' && selectedUser.activistCoordinatorOf && selectedUser.activistCoordinatorOf.length > 0) {
      cityId = selectedUser.activistCoordinatorOf[0].city.id;

      // Extract neighborhood IDs from activistCoordinatorNeighborhoods
      if (selectedUser.activistCoordinatorNeighborhoods && selectedUser.activistCoordinatorNeighborhoods.length > 0) {
        neighborhoodIds = selectedUser.activistCoordinatorNeighborhoods.map(acn => acn.neighborhood.id);
      }
    }

    // Pass user with extracted role-specific data to modal
    // TODO Week 3: Create proper type for user with role-specific data
    setEditingUser({
      ...selectedUser,
      cityId,
      regionName,
      neighborhoodIds,
    } as any);
    setUserModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleResetPasswordClick = () => {
    setResetPasswordDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    const userIdToDelete = selectedUser.id;

    // OPTIMISTIC UPDATE: Remove user from local state immediately
    setDeletingUserId(userIdToDelete);
    setLocalUsers(prev => prev.filter(u => u.id !== userIdToDelete));

    try {
      // Call server action
      const result = await deleteUser(userIdToDelete);

      if (result.success) {
        // Success - close modal and force router refresh to sync with server
        setDeleteModalOpen(false);
        setSelectedUser(null);
        router.refresh();
      } else {
        // Failure - restore user to local state and close modal
        setLocalUsers(users);
        setDeleteModalOpen(false);
        setSelectedUser(null);
        console.error('Failed to delete user:', result.message);
      }
    } catch (error) {
      // Error - restore user to local state and close modal
      setLocalUsers(users);
      setDeleteModalOpen(false);
      setSelectedUser(null);
      console.error('Error deleting user:', error);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUserModalSuccess = () => {
    setUserModalOpen(false);
    setEditingUser(null);
    router.refresh();
  };

  const handleResetPasswordSuccess = () => {
    router.refresh();
  };

  const handleRowClick = (user: User) => {
    setDetailsUser(user);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setDetailsUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return colors.status.purple;
      case 'AREA_MANAGER':
        return colors.status.purple;
      case 'CITY_COORDINATOR':
        return colors.status.blue;
      case 'ACTIVIST_COORDINATOR':
        return colors.status.green;
      default:
        return colors.neutral[500];
    }
  };

  const getRoleLabel = (role: string) => {
    return t(role.toLowerCase() as any);
  };

  // Get corporation display for user
  const getCorporationDisplay = (user: User) => {
    if (user.role === 'SUPERADMIN') {
      return 'כל התאגידים';
    }

    if (user.role === 'AREA_MANAGER' && user.areaManager) {
      return user.areaManager.regionName || 'כל התאגידים';
    }

    if (user.role === 'CITY_COORDINATOR' && user.coordinatorOf && user.coordinatorOf.length > 0) {
      return user.coordinatorOf.map(m => m.city.name).join(', ');
    }

    if (user.role === 'ACTIVIST_COORDINATOR') {
      // Show neighborhoods for Activist Coordinators
      if (user.activistCoordinatorNeighborhoods && user.activistCoordinatorNeighborhoods.length > 0) {
        return user.activistCoordinatorNeighborhoods.map(n => n.neighborhood.name).join(', ');
      }
      // Fallback to city if no neighborhoods assigned yet
      if (user.activistCoordinatorOf && user.activistCoordinatorOf.length > 0) {
        return user.activistCoordinatorOf.map(s => s.city.name).join(', ');
      }
    }

    return '-';
  };

  // Get area (region) for user
  const getUserArea = (user: User): string => {
    if (user.role === 'AREA_MANAGER' && user.areaManager) {
      return user.areaManager.regionName || '';
    }
    return '';
  };

  // Get cities for user
  const getUserCities = (user: User): string[] => {
    if (user.role === 'CITY_COORDINATOR' && user.coordinatorOf) {
      return user.coordinatorOf.map(c => c.city.name);
    }
    if (user.role === 'ACTIVIST_COORDINATOR' && user.activistCoordinatorOf) {
      return user.activistCoordinatorOf.map(c => c.city.name);
    }
    return [];
  };

  // Get unique areas from users
  const uniqueAreas = useMemo(() => {
    const areas = new Set<string>();
    localUsers.forEach(user => {
      const area = getUserArea(user);
      if (area) areas.add(area);
    });
    return Array.from(areas).sort();
  }, [localUsers]);

  // Get unique cities from users
  const uniqueCities = useMemo(() => {
    const citiesSet = new Set<string>();
    localUsers.forEach(user => {
      const userCities = getUserCities(user);
      userCities.forEach(city => citiesSet.add(city));
    });
    return Array.from(citiesSet).sort();
  }, [localUsers]);

  // Filter users based on search criteria
  const filteredUsers = useMemo(() => {
    return localUsers.filter(user => {
      // Name filter
      if (nameFilter && !user.fullName.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }

      // Email filter
      if (emailFilter && !user.email.toLowerCase().includes(emailFilter.toLowerCase())) {
        return false;
      }

      // Area filter
      if (areaFilter) {
        const userArea = getUserArea(user);
        if (userArea !== areaFilter) {
          return false;
        }
      }

      // City filter
      if (cityFilter) {
        const userCities = getUserCities(user);
        if (!userCities.includes(cityFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [localUsers, nameFilter, emailFilter, areaFilter, cityFilter]);

  // Determine dynamic column header based on filtered users roles
  const getScopeColumnHeader = () => {
    const hasAreaManagers = filteredUsers.some(u => u.role === 'AREA_MANAGER');
    const hasCoordinators = filteredUsers.some(u =>
      u.role === 'CITY_COORDINATOR' || u.role === 'ACTIVIST_COORDINATOR'
    );
    const hasSuperAdmin = filteredUsers.some(u => u.role === 'SUPERADMIN');

    if (hasSuperAdmin && filteredUsers.length === 1) return t('scope');
    if (hasAreaManagers && !hasCoordinators) return t('region');
    if (hasCoordinators && !hasAreaManagers) return t('city');
    return t('scopeOfResponsibility');
  };

  // Clear all filters
  const handleClearFilters = () => {
    setNameFilter('');
    setEmailFilter('');
    setAreaFilter('');
    setCityFilter('');
  };

  // Check if any filters are active
  const hasActiveFilters = nameFilter || emailFilter || areaFilter || cityFilter;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box
        sx={{
          mb: { xs: 3, md: 4 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.neutral[800],
              mb: 0.5,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            {t('title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[500],
              fontSize: { xs: '0.875rem', md: '1rem' },
            }}
          >
            {t('description')}
          </Typography>
        </Box>

        {/* Add User Button */}
        {currentUserRole !== 'ACTIVIST_COORDINATOR' && (
          <RtlButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
            data-testid="users-create"
            sx={{
              background: colors.primary.main,
              color: colors.secondary.white,
              px: { xs: 2, md: 3 },
              py: { xs: 1.25, md: 1.5 },
              borderRadius: borderRadius.md,
              boxShadow: shadows.soft,
              alignSelf: { xs: 'stretch', sm: 'center' },
              '&:hover': {
                background: colors.primary.dark,
                boxShadow: shadows.glowBlue,
              },
            }}
          >
            {t('newUser')}
          </RtlButton>
        )}
      </Box>

      {/* Filters Section */}
      <Paper
        sx={{
          mb: 3,
          p: 3,
          borderRadius: borderRadius.lg,
          boxShadow: shadows.soft,
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <FilterListIcon sx={{ color: colors.neutral[600] }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: colors.neutral[700],
            }}
          >
            {t('filters')}
          </Typography>
          <Chip
            label={`${filteredUsers.length} מתוך ${localUsers.length}`}
            size="small"
            sx={{
              backgroundColor: colors.primary.ultraLight,
              color: colors.primary.main,
              fontWeight: 600,
            }}
          />
          {hasActiveFilters && (
            <Chip
              label={t('clearFilters')}
              icon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
              sx={{
                marginInlineStart: 'auto',
                backgroundColor: colors.error + '20',
                color: colors.error,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: colors.error + '30',
                },
              }}
            />
          )}
        </Box>

        <Grid container spacing={2} dir="rtl">
          {/* Name Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t('searchByName')}
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: colors.neutral[400], marginInlineEnd: 1 }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.secondary.white,
                  '&:hover fieldset': {
                    borderColor: colors.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary.main,
                  },
                },
              }}
            />
          </Grid>

          {/* Email Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t('searchByEmail')}
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: colors.neutral[400], marginInlineEnd: 1 }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.secondary.white,
                  '&:hover fieldset': {
                    borderColor: colors.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.primary.main,
                  },
                },
              }}
            />
          </Grid>

          {/* Area Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('filterByArea')}</InputLabel>
              <Select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                label={t('filterByArea')}
                sx={{
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.secondary.white,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.primary.main,
                  },
                }}
              >
                <SelectMenuItem value="">
                  <em>{t('allAreas')}</em>
                </SelectMenuItem>
                {uniqueAreas.map((area) => (
                  <SelectMenuItem key={area} value={area}>
                    {area}
                  </SelectMenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* City Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('filterByCity')}</InputLabel>
              <Select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                label={t('filterByCity')}
                sx={{
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.secondary.white,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.primary.main,
                  },
                }}
              >
                <SelectMenuItem value="">
                  <em>{t('allCities')}</em>
                </SelectMenuItem>
                {uniqueCities.map((city) => (
                  <SelectMenuItem key={city} value={city}>
                    {city}
                  </SelectMenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users List - Mobile Card View / Desktop Table */}
      {isMobile ? (
        // Mobile Card View
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredUsers.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: borderRadius.lg,
                boxShadow: shadows.soft,
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <PersonIcon sx={{ fontSize: 64, color: colors.neutral[300], mb: 2 }} />
              <Typography variant="h6" sx={{ color: colors.neutral[600], mb: 1 }}>
                {hasActiveFilters ? 'לא נמצאו משתמשים' : t('noUsers')}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.neutral[400] }}>
                {hasActiveFilters ? 'נסה לשנות את הסינונים' : t('createFirst')}
              </Typography>
            </Paper>
          ) : (
            filteredUsers.map((user) => (
              <Card
                key={user.id}
                sx={{
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.soft,
                  border: `1px solid ${colors.neutral[200]}`,
                  '&:hover': {
                    boxShadow: shadows.large,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header: Avatar, Name, Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Avatar
                        src={user.avatarUrl || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: colors.primary.ultraLight,
                          color: colors.primary.main,
                        }}
                      >
                        {user.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: colors.neutral[800],
                            fontSize: '16px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {user.fullName}
                        </Typography>
                        <Chip
                          label={getRoleLabel(user.role)}
                          size="small"
                          sx={{
                            backgroundColor: `${getRoleColor(user.role)}20`,
                            color: getRoleColor(user.role),
                            fontWeight: 600,
                            fontSize: '11px',
                            height: '20px',
                            mt: 0.5,
                            borderRadius: borderRadius.full,
                          }}
                        />
                      </Box>
                    </Box>
                    {canManageUser(currentUserRole, user.role) && (
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                        size="small"
                        sx={{ marginInlineStart: 1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </Box>

                  {/* Details Grid */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mt: 2 }}>
                    {/* Email */}
                    <Box>
                      <Typography sx={{ fontSize: '12px', color: colors.neutral[500], mb: 0.5 }}>
                        {t('email')}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: colors.neutral[700],
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.email}
                      </Typography>
                    </Box>

                    {/* Phone */}
                    {user.phone && (
                      <Box>
                        <Typography sx={{ fontSize: '12px', color: colors.neutral[500], mb: 0.5 }}>
                          {t('phone')}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: colors.neutral[700] }}>
                          {user.phone}
                        </Typography>
                      </Box>
                    )}

                    {/* Corporation */}
                    <Box>
                      <Typography sx={{ fontSize: '12px', color: colors.neutral[500], mb: 0.5 }}>
                        {t('corporation')}
                      </Typography>
                      <Typography sx={{ fontSize: '14px', color: colors.neutral[700] }}>
                        {getCorporationDisplay(user)}
                      </Typography>
                    </Box>

                    {/* Last Login */}
                    {user.lastLoginAt && (
                      <Box>
                        <Typography sx={{ fontSize: '12px', color: colors.neutral[500], mb: 0.5 }}>
                          {t('lastLogin')}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: colors.neutral[700] }}>
                          {new Date(user.lastLoginAt).toLocaleDateString('he-IL')}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        // Desktop Table View
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: borderRadius.lg,
            boxShadow: shadows.soft,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: colors.neutral[50],
                }}
              >
                <TableCell sx={{ fontWeight: 600, color: colors.neutral[700], paddingInlineStart: '48px' }}>
                  {t('name')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                  {t('email')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                  {t('phone')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                  {t('role')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                  {getScopeColumnHeader()}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                  {t('lastLogin')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                  {tCommon('actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <PersonIcon sx={{ fontSize: 64, color: colors.neutral[300], mb: 2 }} />
                    <Typography variant="h6" sx={{ color: colors.neutral[600], mb: 1 }}>
                      {hasActiveFilters ? 'לא נמצאו משתמשים' : t('noUsers')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.neutral[400] }}>
                      {hasActiveFilters ? 'נסה לשנות את הסינונים' : t('createFirst')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: colors.neutral[50],
                      },
                    }}
                  >
                    {/* Name with Avatar */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={user.avatarUrl || undefined}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: colors.primary.ultraLight,
                            color: colors.primary.main,
                          }}
                        >
                          {user.fullName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500, color: colors.neutral[800] }}>
                          {user.fullName}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <Typography sx={{ color: colors.neutral[600], fontSize: '14px' }}>
                        {user.email}
                      </Typography>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <Typography sx={{ color: colors.neutral[600], fontSize: '14px' }}>
                        {user.phone || '-'}
                      </Typography>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        size="small"
                        sx={{
                          backgroundColor: `${getRoleColor(user.role)}20`,
                          color: getRoleColor(user.role),
                          fontWeight: 600,
                          fontSize: '12px',
                          borderRadius: borderRadius.full,
                        }}
                      />
                    </TableCell>

                    {/* Corporation */}
                    <TableCell>
                      <Typography sx={{ color: colors.neutral[600], fontSize: '14px' }}>
                        {getCorporationDisplay(user)}
                      </Typography>
                    </TableCell>

                    {/* Last Login */}
                    <TableCell>
                      <Typography sx={{ color: colors.neutral[500], fontSize: '13px' }}>
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('he-IL')
                          : '-'}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      {canManageUser(currentUserRole, user.role) && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleMenuOpen(e, user);
                          }}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: borderRadius.md,
            boxShadow: shadows.large,
          },
        }}
      >
        <MenuItem
          onClick={handleEditUser}
          disabled={selectedUser ? !canManageUser(currentUserRole, selectedUser.role) : true}
        >
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          {tCommon('edit')}
        </MenuItem>
        <MenuItem
          onClick={handleResetPasswordClick}
          disabled={selectedUser ? !canManageUser(currentUserRole, selectedUser.role) : true}
        >
          <LockResetIcon sx={{ mr: 1, fontSize: 20, color: colors.status.orange }} />
          <Typography sx={{ color: colors.status.orange }}>אפס סיסמה</Typography>
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{ color: colors.error }}
          disabled={selectedUser ? !canManageUser(currentUserRole, selectedUser.role) : true}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          {tCommon('delete')}
        </MenuItem>
      </Menu>

      {/* User Modal (Create/Edit) */}
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSuccess={handleUserModalSuccess}
        user={editingUser}
        cities={cities}
        neighborhoods={neighborhoods}
        currentUserRole={currentUserRole}
        currentUserCityId={currentUserCityId}
        existingRegions={existingRegions}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('deleteUser')}
        message={t('deleteConfirm')}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        onClose={() => {
          setResetPasswordDialogOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.id || null}
        userFullName={selectedUser?.fullName || null}
        userEmail={selectedUser?.email || null}
        onSuccess={handleResetPasswordSuccess}
      />

      {/* User Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            borderRadius: borderRadius.lg,
            boxShadow: shadows.large,
          },
        }}
      >
        {detailsUser && (
          <>
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={detailsUser.avatarUrl || undefined}
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: colors.primary.ultraLight,
                    color: colors.primary.main,
                    fontSize: '28px',
                    fontWeight: 600,
                  }}
                >
                  {detailsUser.fullName.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: colors.neutral[900], mb: 0.5 }}>
                    {detailsUser.fullName}
                  </Typography>
                  <Chip
                    label={getRoleLabel(detailsUser.role)}
                    size="small"
                    sx={{
                      backgroundColor: `${getRoleColor(detailsUser.role)}20`,
                      color: getRoleColor(detailsUser.role),
                      fontWeight: 600,
                      fontSize: '12px',
                      borderRadius: borderRadius.full,
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ py: 3 }}>
              {/* Section 1: Basic Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.neutral[900], mb: 2 }}>
                  {t('basicInfo')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: colors.neutral[500], mb: 0.5 }}>
                      {t('email')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.neutral[800], fontWeight: 500 }}>
                      {detailsUser.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: colors.neutral[500], mb: 0.5 }}>
                      {t('phone')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.neutral[800], fontWeight: 500 }}>
                      {detailsUser.phone || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: colors.neutral[500], mb: 0.5 }}>
                      {t('joinDate')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.neutral[800], fontWeight: 500 }}>
                      {new Date(detailsUser.createdAt).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: colors.neutral[500], mb: 0.5 }}>
                      {t('status')}
                    </Typography>
                    <Chip
                      label={detailsUser.isActive ? t('active') : t('inactive')}
                      color={detailsUser.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Section 2: Assigned Locations */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.neutral[900], mb: 2 }}>
                  {detailsUser.role === 'AREA_MANAGER' && t('assignedRegion')}
                  {detailsUser.role === 'CITY_COORDINATOR' && t('assignedCities')}
                  {detailsUser.role === 'ACTIVIST_COORDINATOR' && t('assignedNeighborhoods')}
                  {detailsUser.role === 'SUPERADMIN' && t('fullAccess')}
                </Typography>

                {detailsUser.role === 'AREA_MANAGER' && detailsUser.areaManager && (
                  <Chip
                    label={detailsUser.areaManager.regionName}
                    sx={{
                      backgroundColor: colors.status.purple + '20',
                      color: colors.status.purple,
                      fontWeight: 600,
                    }}
                  />
                )}

                {detailsUser.role === 'CITY_COORDINATOR' && detailsUser.coordinatorOf && detailsUser.coordinatorOf.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {detailsUser.coordinatorOf.map((c) => (
                      <Chip
                        key={c.city.id}
                        label={c.city.name}
                        sx={{
                          backgroundColor: colors.status.blue + '20',
                          color: colors.status.blue,
                          fontWeight: 600,
                        }}
                      />
                    ))}
                  </Box>
                )}

                {detailsUser.role === 'ACTIVIST_COORDINATOR' && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {detailsUser.activistCoordinatorOf && detailsUser.activistCoordinatorOf.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {detailsUser.activistCoordinatorOf.map((c) => (
                          <Chip
                            key={c.city.id}
                            label={c.city.name}
                            sx={{
                              backgroundColor: colors.status.blue + '20',
                              color: colors.status.blue,
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    {detailsUser.activistCoordinatorNeighborhoods && detailsUser.activistCoordinatorNeighborhoods.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {detailsUser.activistCoordinatorNeighborhoods.map((n) => (
                          <Chip
                            key={n.neighborhood.id}
                            label={n.neighborhood.name}
                            size="small"
                            sx={{
                              backgroundColor: colors.status.green + '20',
                              color: colors.status.green,
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {detailsUser.role === 'SUPERADMIN' && (
                  <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
                    {t('allRegionsAndCities')}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Section 3: Login History */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.neutral[900], mb: 2 }}>
                  {t('loginHistory')}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
                  {t('lastLogin')}:{' '}
                  {detailsUser.lastLoginAt
                    ? new Date(detailsUser.lastLoginAt).toLocaleString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : t('noLoginHistory')}
                </Typography>
              </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
              <RtlButton
                onClick={handleCloseDetailsDialog}
                variant="contained"
                sx={{
                  backgroundColor: colors.primary.main,
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: colors.primary.dark,
                  },
                }}
              >
                {t('close')}
              </RtlButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
