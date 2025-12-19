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
import RtlButton from '@/app/components/ui/RtlButton';
import UserModal from './UserModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
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

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [existingRegions, setExistingRegions] = useState<string[]>([]);

  // Filter state
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

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

    // Area Manager: Extract regionName
    if (selectedUser.role === 'AREA_MANAGER' && selectedUser.areaManager) {
      regionName = selectedUser.areaManager.regionName;
    }
    // City Coordinator: Extract cityId
    else if (selectedUser.role === 'CITY_COORDINATOR' && selectedUser.coordinatorOf && selectedUser.coordinatorOf.length > 0) {
      cityId = selectedUser.coordinatorOf[0].city.id;
    }
    // Activist Coordinator: Extract cityId
    else if (selectedUser.role === 'ACTIVIST_COORDINATOR' && selectedUser.activistCoordinatorOf && selectedUser.activistCoordinatorOf.length > 0) {
      cityId = selectedUser.activistCoordinatorOf[0].city.id;
    }

    // Pass user with extracted role-specific data to modal
    // TODO Week 3: Create proper type for user with role-specific data
    setEditingUser({
      ...selectedUser,
      cityId,
      regionName,
    } as any);
    setUserModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    const result = await deleteUser(selectedUser.id);

    if (result.success) {
      setDeleteModalOpen(false);
      setSelectedUser(null);
      router.refresh();
    }
  };

  const handleUserModalSuccess = () => {
    setUserModalOpen(false);
    setEditingUser(null);
    router.refresh();
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

    if (user.role === 'ACTIVIST_COORDINATOR' && user.activistCoordinatorOf && user.activistCoordinatorOf.length > 0) {
      return user.activistCoordinatorOf.map(s => s.city.name).join(', ');
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
    users.forEach(user => {
      const area = getUserArea(user);
      if (area) areas.add(area);
    });
    return Array.from(areas).sort();
  }, [users]);

  // Get unique cities from users
  const uniqueCities = useMemo(() => {
    const citiesSet = new Set<string>();
    users.forEach(user => {
      const userCities = getUserCities(user);
      userCities.forEach(city => citiesSet.add(city));
    });
    return Array.from(citiesSet).sort();
  }, [users]);

  // Filter users based on search criteria
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
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
  }, [users, nameFilter, emailFilter, areaFilter, cityFilter]);

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
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.neutral[800],
              mb: 0.5,
            }}
          >
            {t('title')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[500],
            }}
          >
            {t('description')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                px: 3,
                py: 1.5,
                borderRadius: borderRadius.md,
                boxShadow: shadows.soft,
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
            label={`${filteredUsers.length} מתוך ${users.length}`}
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

      {/* Users Table */}
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
              <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
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
                {t('corporation')}
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
                  sx={{
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
                      <IconButton onClick={(e) => handleMenuOpen(e, user)} size="small">
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
    </Box>
  );
}
