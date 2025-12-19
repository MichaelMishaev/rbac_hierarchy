/**
 * Duplicates Dashboard - SuperAdmin Only (Hebrew RTL)
 *
 * Features:
 * - Read-only duplicate voters report
 * - Groups duplicates by phone number
 * - Shows who inserted each duplicate
 * - Hebrew RTL layout
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { getDuplicatesReport } from '@/lib/voters/actions/voter-actions';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export function DuplicatesDashboard() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError(null);

    const result = await getDuplicatesReport();

    if (result.success) {
      setReport(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
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

  if (!report) {
    return null;
  }

  return (
    <Box dir="rtl" sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <WarningIcon color="warning" fontSize="large" />
        <Typography variant="h4">דוח כפילויות</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        דוח זה מציג בוחרים עם מספר טלפון זהה. הכפילויות מותרות במערכת אך נדרש מעקב.
      </Alert>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            סיכום
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="h3" color="warning.main">
                {report.duplicateGroups.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                מספרי טלפון כפולים
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3" color="error.main">
                {report.totalDuplicates}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                סה&quot;כ רשומות כפולות
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Duplicates List */}
      {report.duplicateGroups.length === 0 ? (
        <Alert severity="success">
          מצוין! אין כפילויות במערכת
        </Alert>
      ) : (
        <Box>
          {report.duplicateGroups.map((group: any, index: number) => (
            <Accordion key={group.phone} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <PhoneIcon color="action" />
                  <Typography variant="h6">{group.phone}</Typography>
                  <Chip
                    label={`${group.count} רשומות`}
                    color="warning"
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {group.voters.map((voter: any, vIndex: number) => (
                    <Box key={voter.voterId}>
                      <ListItem
                        sx={{
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          py: 2,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {voter.fullName}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                הוכנס על ידי: <strong>{voter.insertedByUserName}</strong> (
                                {voter.insertedByUserRole})
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                תאריך:{' '}
                                {format(new Date(voter.insertedAt), 'dd/MM/yyyy HH:mm', {
                                  locale: he,
                                })}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {vIndex < group.voters.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
}
