'use client';

import { useState, useMemo } from 'react';
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
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ActivistModal, { WorkerFormData } from '@/app/components/modals/ActivistModal';
import DeleteConfirmationModal from '@/app/components/modals/DeleteConfirmationModal';
import ActivistCardSwipeable from './ActivistCardSwipeable';
import SmartAssignmentDialog from '@/app/components/tasks/SmartAssignmentDialog';
import RtlButton from '@/app/components/ui/RtlButton';
import { EditableTextCell, StatusToggleCell } from './InlineEditableCells';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import toast from 'react-hot-toast';
import {
  createWorker,
  updateWorker,
  deleteWorker,
} from '@/app/actions/activists';

type Site = {
  id: string;
  name: string;
  cityId: string;
  cityRelation?: {
    id: string;
    name: string;
  };
};

type Supervisor = {
  id: string;
  user: {
    fullName: string;
    email: string;
  };
};

type Worker = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  avatarUrl: string | null;
  notes: string | null;
  tags: string[];
  isActive: boolean;
  startDate: string | null; // ISO string from Server Action serialization
  neighborhoodId: string;
  activistCoordinatorId: string | null;
  site?: Site;
  supervisor?: Supervisor | null;
};

type Area = {
  id: string;
  regionName: string;
  regionCode: string;
};

type City = {
  id: string;
  name: string;
  code: string;
  areaManagerId: string;
};

type ActivistsClientProps = {
  activists: Worker[];
  neighborhoods: Site[];
  activistCoordinators: Supervisor[];
  areas: Area[];
  cities: City[];
  currentUserId: string;
  defaultActivistCoordinatorId?: string;
};

export default function ActivistsClient({
  activists: initialWorkers,
  neighborhoods: sites,
  activistCoordinators: supervisors,
  areas,
  cities,
  currentUserId,
  defaultActivistCoordinatorId: defaultSupervisorId,
}: ActivistsClientProps) {
  const t = useTranslations('workers');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'he';

  const [workers, setWorkers] = useState(initialWorkers);
  const [neighborhoods, setNeighborhoods] = useState(sites);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSite, setFilterSite] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [smartAssignmentOpen, setSmartAssignmentOpen] = useState(false);

  // Transform supervisors to match ActivistModal expected format
  const transformedSupervisors = useMemo(() => {
    if (!supervisors || supervisors.length === 0) {
      return [];
    }
    return supervisors.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.user.fullName,
      email: supervisor.user.email,
    }));
  }, [supervisors]);

  // Filtered workers based on search and filters
  const filteredWorkers = useMemo(() => {
    let filtered = workers;

    if (filterSite !== 'all') {
      filtered = filtered.filter((worker) => worker.neighborhoodId === filterSite);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((worker) =>
        filterStatus === 'active' ? worker.isActive : !worker.isActive
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (worker) =>
          worker.fullName.toLowerCase().includes(query) ||
          worker.phone?.toLowerCase().includes(query) ||
          worker.email?.toLowerCase().includes(query) ||
          worker.position?.toLowerCase().includes(query) ||
          worker.site?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [workers, searchQuery, filterSite, filterStatus]);

  // Stats
  const stats = useMemo(() => ({
    total: workers.length,
    active: workers.filter((w) => w.isActive).length,
    inactive: workers.filter((w) => !w.isActive).length,
    sitesCount: new Set(workers.map(w => w.neighborhoodId)).size,
  }), [workers]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, activist: Worker) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedWorker(activist);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateWorker = async (data: WorkerFormData): Promise<{ success: boolean; error?: string }> => {
    const result = await createWorker({
      fullName: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      position: data.position || undefined,
      notes: data.notes || undefined,
      tags: data.tags,
      neighborhoodId: data.siteId,
      activistCoordinatorId: data.supervisorId,
      isActive: data.isActive,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
    });
    if (result.success && result.activist) {
      const worker = {
        ...result.activist,
        startDate: result.activist.startDate ? result.activist.startDate.toISOString() : null,
        site: result.activist.neighborhood ? {
          id: result.activist.neighborhood.id,
          name: result.activist.neighborhood.name,
          cityId: result.activist.neighborhood.cityRelation?.id || '',
          cityRelation: result.activist.neighborhood.cityRelation,
        } : undefined,
        supervisor: result.activist.activistCoordinator ? {
          id: result.activist.activistCoordinator.id,
          user: result.activist.activistCoordinator.user,
        } : undefined,
      };

      // Add neighborhood to neighborhoods state if not already there
      if (result.activist.neighborhood) {
        setNeighborhoods((prev) => {
          const exists = prev.find(n => n.id === result.activist.neighborhood!.id);
          if (!exists) {
            return [...prev, {
              id: result.activist.neighborhood!.id,
              name: result.activist.neighborhood!.name,
              cityId: result.activist.neighborhood!.cityRelation?.id || '',
              cityRelation: result.activist.neighborhood!.cityRelation,
            }];
          }
          return prev;
        });
      }

      setWorkers((prev) => [worker, ...prev]);
      setCreateModalOpen(false);
      router.refresh();
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to create activist' };
    }
  };

  const handleEditClick = () => {
    setEditModalOpen(true);
    handleMenuClose();
  };

  const handleQuickCheckIn = async (activistId: string) => {
    try {
      // TODO: Implement check-in functionality
      // This would call an API endpoint to create an attendance record
      console.log('Quick check-in for activist:', activistId);
      // For now, just show a toast
      // toast.success(isRTL ? 'נוכחות נרשמה בהצלחה' : 'Attendance recorded successfully');
    } catch (error) {
      console.error('Failed to check in:', error);
      // toast.error(isRTL ? 'שגיאה בעדכון נוכחות' : 'Failed to record attendance');
    }
  };

  const handleQuickEdit = (activistId: string) => {
    const activist = workers.find(w => w.id === activistId);
    if (activist) {
      setSelectedWorker(activist);
      setEditModalOpen(true);
    }
  };

  const handleEditWorker = async (data: WorkerFormData): Promise<{ success: boolean; error?: string }> => {
    if (!selectedWorker) return { success: false, error: 'No worker selected' };

    const result = await updateWorker(selectedWorker.id, {
      fullName: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      position: data.position || undefined,
      notes: data.notes || undefined,
      tags: data.tags,
      neighborhoodId: data.siteId,
      activistCoordinatorId: data.supervisorId,
      isActive: data.isActive,
    });
    if (result.success && result.activist) {
      const updatedWorker = {
        ...result.activist,
        startDate: result.activist.startDate ? result.activist.startDate.toISOString() : null,
        site: result.activist.neighborhood ? {
          id: result.activist.neighborhood.id,
          name: result.activist.neighborhood.name,
          cityId: result.activist.neighborhood.cityRelation?.id || '',
          cityRelation: result.activist.neighborhood.cityRelation,
        } : undefined,
        supervisor: result.activist.activistCoordinator ? {
          id: result.activist.activistCoordinator.id,
          user: result.activist.activistCoordinator.user,
        } : undefined,
      };
      setWorkers((prev) =>
        prev.map((worker) => (worker.id === selectedWorker.id ? updatedWorker : worker))
      );
      setEditModalOpen(false);
      setSelectedWorker(null);
      router.refresh();
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to update activist' };
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker) return;

    const result = await deleteWorker(selectedWorker.id);
    if (result.success) {
      setWorkers((prev) => prev.filter((worker) => worker.id !== selectedWorker.id));
      setDeleteModalOpen(false);
      setSelectedWorker(null);
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

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Stats Overview - Neo-Morphic KPI Cards */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 4 }}>
        {[
          { label: isRTL ? 'סה"כ עובדים' : 'Total Workers', value: stats.total, color: colors.pastel.blue, bgColor: colors.pastel.blueLight, glow: shadows.glowBlue },
          { label: isRTL ? 'פעילים' : 'Active', value: stats.active, color: colors.pastel.green, bgColor: colors.pastel.greenLight, glow: shadows.glowGreen },
          { label: isRTL ? 'לא פעילים' : 'Inactive', value: stats.inactive, color: colors.pastel.red, bgColor: colors.pastel.redLight, glow: '0 0 20px rgba(228, 66, 88, 0.3)' },
          { label: isRTL ? 'אתרים' : 'Sites', value: stats.sitesCount, color: colors.pastel.purple, bgColor: colors.pastel.purpleLight, glow: shadows.glowPurple },
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

      {/* Keyboard Shortcuts Help - 2025 Accessibility Best Practice */}
      <KeyboardShortcutsHelp isRTL={isRTL} />

      {/* Search, Filters and Actions Bar */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 2,
          mb: 4,
          alignItems: { xs: 'stretch', lg: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flex: 1, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
          {/* Search Bar - Pill Shape per Style Guide */}
          <TextField
            placeholder={isRTL ? 'חיפוש עובדים...' : 'Search workers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              minWidth: 200,
              maxWidth: { sm: 300 },
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
          
          {/* Filter by Site - Clean style without floating label */}
          <Select
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            displayEmpty
            size="small"
            sx={{
              minWidth: 180,
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
                color: filterSite === 'all' ? colors.neutral[500] : colors.neutral[900],
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
            <MenuItem value="all">{isRTL ? 'כל האתרים' : 'All Sites'}</MenuItem>
            {neighborhoods.map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.name}
              </MenuItem>
            ))}
          </Select>

          {/* Status Filter - Clean style without floating label */}
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            displayEmpty
            size="small"
            sx={{
              minWidth: 130,
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
                color: filterStatus === 'all' ? colors.neutral[500] : colors.neutral[900],
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
            <MenuItem value="all">{isRTL ? 'הכל' : 'All'}</MenuItem>
            <MenuItem value="active">{isRTL ? 'פעילים' : 'Active'}</MenuItem>
            <MenuItem value="inactive">{isRTL ? 'לא פעילים' : 'Inactive'}</MenuItem>
          </Select>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <Box
            sx={{
              display: 'flex',
              backgroundColor: colors.neutral[100],
              borderRadius: borderRadius.lg,
              p: 0.5,
            }}
          >
            <IconButton
              onClick={() => setViewMode('grid')}
              sx={{
                borderRadius: borderRadius.md,
                backgroundColor: viewMode === 'grid' ? colors.neutral[0] : 'transparent',
                boxShadow: viewMode === 'grid' ? shadows.soft : 'none',
              }}
            >
              <GridViewIcon sx={{ color: viewMode === 'grid' ? colors.primary.main : colors.neutral[500] }} />
            </IconButton>
            <IconButton
              onClick={() => setViewMode('table')}
              sx={{
                borderRadius: borderRadius.md,
                backgroundColor: viewMode === 'table' ? colors.neutral[0] : 'transparent',
                boxShadow: viewMode === 'table' ? shadows.soft : 'none',
              }}
            >
              <TableRowsIcon sx={{ color: viewMode === 'table' ? colors.primary.main : colors.neutral[500] }} />
            </IconButton>
          </Box>

          {/* Smart Assignment Button (Phase 3 UI/UX Update) */}
          <Tooltip
            title={t('smartAssignmentTooltip')}
            arrow
            placement={isRTL ? 'bottom-end' : 'bottom-start'}
            sx={{
              '& .MuiTooltip-tooltip': {
                backgroundColor: colors.neutral[800],
                color: colors.neutral[0],
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '12px 16px',
                borderRadius: borderRadius.lg,
                boxShadow: shadows.large,
                maxWidth: 300,
              },
              '& .MuiTooltip-arrow': {
                color: colors.neutral[800],
              },
            }}
          >
            <span>
              <RtlButton
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={() => setSmartAssignmentOpen(true)}
                disabled={neighborhoods.length === 0}
                sx={{
                  borderColor: colors.status.orange,
                  color: colors.status.orange,
                  px: 2.5,
                  py: 1.75,
                  fontSize: '16px',
                  borderRadius: borderRadius['2xl'],
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: colors.status.orange,
                    backgroundColor: `${colors.status.orange}15`,
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    borderColor: colors.neutral[300],
                    color: colors.neutral[400],
                  },
                }}
              >
                {isRTL ? 'שיבוץ חכם' : 'Smart Assignment'}
              </RtlButton>
            </span>
          </Tooltip>

          <RtlButton
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
            {t('newWorker')}
          </RtlButton>
        </Box>
      </Box>

      {/* Workers List */}
      {filteredWorkers.length === 0 ? (
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
            <PersonIcon sx={{ fontSize: 48, color: colors.pastel.blue }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              color: colors.neutral[700],
              fontWeight: 600,
              mb: 1,
            }}
          >
            {searchQuery || filterSite !== 'all' || filterStatus !== 'all'
              ? (isRTL ? 'לא נמצאו תוצאות' : 'No results found') 
              : (isRTL ? 'אין עובדים עדיין' : 'No workers yet')}
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
            {searchQuery || filterSite !== 'all' || filterStatus !== 'all'
              ? isRTL
                ? 'נסה לחפש עם מילות מפתח אחרות או שנה את הסינון'
                : 'Try searching with different keywords or change the filter'
              : isRTL
                ? 'הוסף את העובד הראשון שלך כדי להתחיל'
                : 'Add your first worker to get started'}
          </Typography>
          {!searchQuery && filterSite === 'all' && filterStatus === 'all' && (
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
              {t('newWorker')}
            </RtlButton>
          )}
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredWorkers.map((worker) => {
            // Transform worker data for swipeable card component
            const activistData = {
              id: worker.id,
              fullName: worker.fullName,
              phone: worker.phone,
              neighborhood: worker.site ? { name: worker.site.name } : undefined,
              position: worker.position,
              tags: worker.tags,
              isActive: worker.isActive,
            };

            return (
              <Grid item xs={12} sm={6} lg={4} key={worker.id}>
                <ActivistCardSwipeable
                  activist={activistData}
                  onCheckIn={handleQuickCheckIn}
                  onEdit={handleQuickEdit}
                  isRTL={isRTL}
                />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Table View */
        <Box>
          {/* Inline Editing Info Banner - 2025 UX Best Practice */}
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: borderRadius.lg,
              background: `linear-gradient(135deg, ${colors.pastel.blueLight} 0%, ${colors.pastel.purpleLight} 100%)`,
              border: `1px solid ${colors.primary.light}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: colors.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.neutral[0],
                fontSize: 20,
              }}
            >
              ✨
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, color: colors.neutral[800], mb: 0.5 }}>
                {isRTL ? 'עריכה מהירה זמינה!' : 'Quick Editing Available!'}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
                {isRTL
                  ? 'לחץ פעמיים על תפקיד, טלפון או שנה את הסטטוס ישירות בטבלה'
                  : 'Double-click position or phone to edit, or toggle status directly in the table'}
              </Typography>
            </Box>
          </Box>

          <Paper sx={{ borderRadius: borderRadius.xl, overflow: 'hidden', boxShadow: shadows.soft }}>
            <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: colors.neutral[50] }}>
                  <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                    {t('name')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                    {t('position')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                    {t('site')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                    {isRTL ? 'טלפון' : 'Phone'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                    {isRTL ? 'סטטוס' : 'Status'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: colors.neutral[700] }} align="center">
                    {tCommon('actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredWorkers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((worker) => {
                    const avatarColor = getAvatarColor(worker.fullName);
                    return (
                      <TableRow 
                        key={worker.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: colors.neutral[50],
                          },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={worker.avatarUrl || undefined}
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: avatarColor.bg,
                                color: avatarColor.text,
                                fontWeight: 600,
                                fontSize: '0.9rem',
                              }}
                            >
                              {!worker.avatarUrl && getInitials(worker.fullName)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                                {worker.fullName}
                              </Typography>
                              {worker.email && (
                                <Typography variant="body2" sx={{ color: colors.neutral[500] }}>
                                  {worker.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <EditableTextCell
                            value={worker.position}
                            activistId={worker.id}
                            field="position"
                            onUpdate={() => router.refresh()}
                            isRTL={isRTL}
                            placeholder={isRTL ? 'ללא תפקיד' : 'No position'}
                            icon={<WorkIcon fontSize="inherit" />}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: colors.neutral[700] }}>
                            {worker.site?.name || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <EditableTextCell
                            value={worker.phone}
                            activistId={worker.id}
                            field="phone"
                            onUpdate={() => router.refresh()}
                            isRTL={isRTL}
                            type="tel"
                            placeholder={isRTL ? 'ללא טלפון' : 'No phone'}
                            icon={<PhoneIcon fontSize="inherit" />}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusToggleCell
                            isActive={worker.isActive}
                            activistId={worker.id}
                            onUpdate={() => router.refresh()}
                            isRTL={isRTL}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, worker)}
                            size="small"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredWorkers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={isRTL ? 'שורות לעמוד:' : 'Rows per page:'}
            sx={{
              direction: 'ltr',
              '& .MuiTablePagination-actions': {
                direction: 'ltr',
              },
            }}
          />
        </Paper>
        </Box>
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
      <ActivistModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateWorker}
        mode="create"
        areas={areas}
        cities={cities}
        neighborhoods={neighborhoods}
        activistCoordinators={transformedSupervisors}
        defaultSupervisorId={defaultSupervisorId}
      />

      {/* Edit Modal */}
      {selectedWorker && (
        <ActivistModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedWorker(null);
          }}
          onSubmit={handleEditWorker}
          initialData={{
            name: selectedWorker.fullName,
            phone: selectedWorker.phone || '',
            email: selectedWorker.email || '',
            position: selectedWorker.position || '',
            notes: selectedWorker.notes || '',
            tags: selectedWorker.tags || [],
            siteId: selectedWorker.neighborhoodId,
            supervisorId: selectedWorker.activistCoordinatorId || '',
            isActive: selectedWorker.isActive,
            startDate: selectedWorker.startDate
              ? new Date(selectedWorker.startDate).toISOString().split('T')[0]
              : undefined,
          }}
          mode="edit"
          areas={areas}
          cities={cities}
          neighborhoods={neighborhoods}
          activistCoordinators={transformedSupervisors}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedWorker && (
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedWorker(null);
          }}
          onConfirm={handleDeleteWorker}
          title={isRTL ? 'מחיקת עובד' : 'Delete Worker'}
          message={isRTL
            ? 'האם אתה בטוח שברצונך למחוק את העובד הזה?'
            : 'Are you sure you want to delete this worker?'}
          itemName={selectedWorker.fullName}
        />
      )}

      {/* Smart Assignment Dialog (Phase 3 UI/UX Update) */}
      {neighborhoods.length > 0 && (
        <SmartAssignmentDialog
          open={smartAssignmentOpen}
          onClose={() => setSmartAssignmentOpen(false)}
          onSelect={(activistId: string) => {
            // Find the selected activist
            const activist = workers.find(w => w.id === activistId);
            toast.success(
              isRTL
                ? `נבחר: ${activist?.fullName || 'פעיל'} - התכונה המלאה תושק בקרוב!`
                : `Selected: ${activist?.fullName || 'Activist'} - Full feature coming soon!`,
              {
                duration: 4000,
                icon: '🎯',
              }
            );
          }}
          location={{
            lat: 32.0853, // Tel Aviv center (mock location)
            lng: 34.7818,
          }}
          neighborhoodId={neighborhoods[0]?.id || ''}
          isRTL={isRTL}
        />
      )}
    </Box>
  );
}

