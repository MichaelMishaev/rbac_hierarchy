/**
 * Voter Details Component with Edit History - Hebrew RTL
 *
 * Features:
 * - Full voter information display
 * - Complete edit history timeline
 * - Hebrew RTL layout
 * - Mobile-responsive
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { getVoterWithHistory } from '@/lib/voters/actions/voter-actions';
import type { VoterWithHistory } from '@/lib/voters';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface VoterDetailsProps {
  voterId: string;
  onEdit?: () => void;
}

export function VoterDetails({ voterId, onEdit }: VoterDetailsProps) {
  const [voter, setVoter] = useState<VoterWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVoter();
  }, [voterId]);

  const loadVoter = async () => {
    setLoading(true);
    setError(null);

    const result = await getVoterWithHistory(voterId);

    if (result.success) {
      setVoter(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const getRoleInHebrew = (role: string) => {
    const roleMap: Record<string, string> = {
      'SUPERADMIN': 'מנהל מערכת',
      'AREA_MANAGER': 'מנהל אזור',
      'CITY_COORDINATOR': 'רכז עיר',
      'ACTIVIST_COORDINATOR': 'רכז פעילים',
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!voter) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        בוחר לא נמצא
      </Alert>
    );
  }

  const getSupportLevelColor = (level: string | null) => {
    switch (level) {
      case 'תומך':
        return 'success';
      case 'מהסס':
        return 'warning';
      case 'מתנגד':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box dir="rtl" sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{voter.fullName}</Typography>
        {onEdit && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={onEdit}
          >
            עריכה
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Personal Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6">מידע אישי</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      טלפון:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {voter.phone}
                    </Typography>
                  </Box>
                </Grid>

                {voter.email && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        אימייל:
                      </Typography>
                      <Typography variant="body1">{voter.email}</Typography>
                    </Box>
                  </Grid>
                )}

                {voter.idNumber && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      תעודת זהות:
                    </Typography>
                    <Typography variant="body1">{voter.idNumber}</Typography>
                  </Grid>
                )}

                {voter.dateOfBirth && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      תאריך לידה:
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(voter.dateOfBirth), 'dd/MM/yyyy', {
                        locale: he,
                      })}
                    </Typography>
                  </Grid>
                )}

                {voter.gender && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      מגדר:
                    </Typography>
                    <Typography variant="body1">{voter.gender}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Geographic Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationIcon color="primary" />
                <Typography variant="h6">מידע גאוגרפי</Typography>
              </Box>

              <Grid container spacing={2}>
                {voter.voterAddress && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      כתובת:
                    </Typography>
                    <Typography variant="body1">{voter.voterAddress}</Typography>
                  </Grid>
                )}

                {voter.voterCity && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      עיר:
                    </Typography>
                    <Typography variant="body1">{voter.voterCity}</Typography>
                  </Grid>
                )}

                {voter.voterNeighborhood && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      שכונה:
                    </Typography>
                    <Typography variant="body1">{voter.voterNeighborhood}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Campaign Status Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                סטטוס שטח
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    רמת תמיכה:
                  </Typography>
                  {voter.supportLevel && (
                    <Chip
                      label={voter.supportLevel}
                      color={getSupportLevelColor(voter.supportLevel) as any}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    סטטוס קשר:
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {voter.contactStatus || '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    עדיפות:
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {voter.priority || '-'}
                  </Typography>
                </Grid>

                {voter.notes && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      הערות:
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                      {voter.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Metadata Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                מידע מערכת
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    הוכנס על ידי:
                  </Typography>
                  <Typography variant="body1">
                    {voter.insertedByUserName} ({getRoleInHebrew(voter.insertedByUserRole)})
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    תאריך הכנסה:
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(voter.insertedAt), 'dd/MM/yyyy HH:mm', {
                      locale: he,
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit History */}
        {voter.editHistory && voter.editHistory.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <HistoryIcon color="primary" />
                  <Typography variant="h6">היסטוריית עריכה</Typography>
                </Box>

                <List sx={{ width: '100%' }}>
                  {voter.editHistory.map((edit, index) => (
                    <Box key={`edit-history-${voterId}-${index}`}>
                      <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {edit.editedByUserName} ({getRoleInHebrew(edit.editedByUserRole)})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(edit.editedAt), 'dd/MM/yyyy HH:mm', {
                              locale: he,
                            })}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          שינה את <strong>{edit.fieldName}</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {edit.oldValue && (
                            <Chip
                              label={`ישן: ${edit.oldValue}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {edit.newValue && (
                            <Chip
                              label={`חדש: ${edit.newValue}`}
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      </ListItem>
                      {index < voter.editHistory.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
