'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RtlButton from '@/app/components/ui/RtlButton';
import UserModal from './UserModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { deleteUser } from '@/app/actions/users';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR' | 'SUPERADMIN';
  lastLoginAt: Date | null;
  createdAt: Date;
  isActive: boolean;
  // Role-specific relations
  areaManager?: {
    regionName: string;
    regionCode: string | null;
  } | null;
  cityCoordinatorOf?: {
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
};

export default function UsersClient({ users, cities, neighborhoods, currentUserRole }: UsersClientProps) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
    setEditingUser(selectedUser);
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

  // Get current user corporation ID for filtering
  // TODO: Derive from role tables (cityCoordinatorOf, activistCoordinatorOf, etc.)
  const currentUserCityId: string | null = null;

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

    if (user.role === 'CITY_COORDINATOR' && user.cityCoordinatorOf && user.cityCoordinatorOf.length > 0) {
      return user.cityCoordinatorOf.map(m => m.city.name).join(', ');
    }

    if (user.role === 'ACTIVIST_COORDINATOR' && user.activistCoordinatorOf && user.activistCoordinatorOf.length > 0) {
      return user.activistCoordinatorOf.map(s => s.city.name).join(', ');
    }

    return '-';
  };

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

        {/* Add User Button */}
        {currentUserRole !== 'ACTIVIST_COORDINATOR' && (
          <RtlButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
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
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <PersonIcon sx={{ fontSize: 64, color: colors.neutral[300], mb: 2 }} />
                  <Typography variant="h6" sx={{ color: colors.neutral[600], mb: 1 }}>
                    {t('noUsers')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.neutral[400] }}>
                    {t('createFirst')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
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
                    <IconButton onClick={(e) => handleMenuOpen(e, user)} size="small">
                      <MoreVertIcon />
                    </IconButton>
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
        <MenuItem onClick={handleEditUser}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          {tCommon('edit')}
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{ color: colors.error }}
          disabled={selectedUser?.role === 'SUPERADMIN'}
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
