'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Link from 'next/link';
import ArchitectureCard, { ArchitectureConcept } from './ArchitectureCard';

interface SetupStep {
  order: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link: string;
  linkText: string;
  steps: string[];
  tip?: string;
}

interface SystemRulesClientProps {
  setupSteps: SetupStep[];
  architectureConcepts?: ArchitectureConcept[];
  isRTL: boolean;
}

export default function SystemRulesClient({ setupSteps, architectureConcepts = [], isRTL }: SystemRulesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'architecture' | 'setup'>(
    architectureConcepts.length > 0 ? 'architecture' : 'setup'
  );

  // Filter setup steps based on search query
  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) {
      return setupSteps;
    }

    const query = searchQuery.toLowerCase();
    return setupSteps.filter((step) => {
      // Search in title
      if (step.title.toLowerCase().includes(query)) return true;

      // Search in description
      if (step.description.toLowerCase().includes(query)) return true;

      // Search in link text
      if (step.linkText.toLowerCase().includes(query)) return true;

      // Search in steps
      if (step.steps.some((s) => s.toLowerCase().includes(query))) return true;

      // Search in tip
      if (step.tip && step.tip.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [setupSteps, searchQuery]);

  // Filter architecture concepts based on search query
  const filteredConcepts = useMemo(() => {
    if (!searchQuery.trim()) {
      return architectureConcepts;
    }

    const query = searchQuery.toLowerCase();
    return architectureConcepts.filter((concept) => {
      // Search in title
      if (concept.title.toLowerCase().includes(query)) return true;

      // Search in keywords
      if (concept.keywords.some((kw) => kw.toLowerCase().includes(query))) return true;

      // Search in real-world example
      if (concept.realWorldExample.toLowerCase().includes(query)) return true;

      // Search in why SuperAdmin cares
      if (concept.whySuperAdminCares.some((reason) => reason.toLowerCase().includes(query))) return true;

      // Search in technical translation
      if (concept.technicalTranslation.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [architectureConcepts, searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'architecture' | 'setup') => {
    setActiveTab(newValue);
  };

  // Determine what to show based on search results
  const hasConceptResults = filteredConcepts.length > 0;
  const hasStepResults = filteredSteps.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  // Show both tabs if search has results in both, otherwise respect active tab
  const showBothTabs = isSearching && hasConceptResults && hasStepResults;

  // Get counts for display
  const totalResults = filteredConcepts.length + filteredSteps.length;
  const totalItems = architectureConcepts.length + setupSteps.length;

  return (
    <Box>
      {/* Tabs (only show if we have architecture concepts) */}
      {architectureConcepts.length > 0 && (
        <Box sx={{ mb: 3, borderBottom: `2px solid ${colors.neutral[200]}` }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 56,
                px: 3,
              },
              '& .Mui-selected': {
                color: colors.primary.main,
              },
            }}
          >
            <Tab
              label="🏗️ קונספטים ארכיטקטוניים"
              value="architecture"
              data-testid="tab-architecture"
            />
            <Tab
              label="🚀 מדריך התקנה"
              value="setup"
              data-testid="tab-setup"
            />
          </Tabs>
        </Box>
      )}

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder={
            activeTab === 'architecture'
              ? 'חפש קונספטים, מושגים או מילות מפתח...'
              : 'חפש שלבים, תפקידים או הדרכות...'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colors.neutral[500] }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <Box
                  onClick={handleClearSearch}
                  sx={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      opacity: 0.7,
                    },
                  }}
                >
                  <ClearIcon sx={{ color: colors.neutral[500], fontSize: 20 }} />
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: borderRadius.lg,
              background: colors.neutral[0],
              fontSize: '15px',
              fontWeight: 500,
              boxShadow: shadows.soft,
              '&:hover': {
                boxShadow: shadows.medium,
              },
              '&.Mui-focused': {
                boxShadow: shadows.medium,
              },
            },
          }}
        />

        {/* Search Results Counter */}
        {searchQuery && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '14px', color: colors.neutral[600], fontWeight: 500 }}>
              {totalResults === 0 ? (
                <>לא נמצאו תוצאות עבור &quot;<strong>{searchQuery}</strong>&quot;</>
              ) : showBothTabs ? (
                <>
                  נמצאו {totalResults} תוצאות: {filteredConcepts.length} קונספטים + {filteredSteps.length} שלבים
                </>
              ) : hasConceptResults && !hasStepResults ? (
                <>נמצאו {filteredConcepts.length} קונספטים מתוך {architectureConcepts.length}</>
              ) : hasStepResults && !hasConceptResults ? (
                <>נמצאו {filteredSteps.length} שלבים מתוך {setupSteps.length}</>
              ) : totalResults === totalItems ? (
                <>מציג את כל התוצאות ({totalResults})</>
              ) : (
                <>נמצאו {totalResults} תוצאות מתוך {totalItems}</>
              )}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Architecture Concepts */}
      {(activeTab === 'architecture' || (showBothTabs && hasConceptResults) || (isSearching && !hasStepResults && hasConceptResults)) && (
        <>
          {showBothTabs && hasConceptResults && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: colors.neutral[900],
                mb: 3,
                mt: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              🏗️ קונספטים ארכיטקטוניים ({filteredConcepts.length})
            </Typography>
          )}
          {filteredConcepts.length === 0 && !showBothTabs ? (
            <Alert severity="info" sx={{ borderRadius: borderRadius.lg, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <InfoIcon />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 0.5 }}>
                    לא נמצאו תוצאות
                  </Typography>
                  <Typography sx={{ fontSize: '14px' }}>
                    נסה לחפש במילים אחרות או נקה את החיפוש כדי לראות את כל הקונספטים
                  </Typography>
                </Box>
              </Box>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredConcepts.map((concept) => (
                <Grid item xs={12} md={6} lg={4} key={concept.id}>
                  <ArchitectureCard
                    concept={concept}
                    isRTL={isRTL}
                    searchTerm={searchQuery}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Setup Steps */}
      {(activeTab === 'setup' || (showBothTabs && hasStepResults) || (isSearching && !hasConceptResults && hasStepResults)) && (
        <>
          {showBothTabs && hasStepResults && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: colors.neutral[900],
                mb: 3,
                mt: showBothTabs && hasConceptResults ? 4 : 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              🚀 מדריך התקנה ({filteredSteps.length})
            </Typography>
          )}
          {filteredSteps.length === 0 && !showBothTabs ? (
            <Alert severity="info" sx={{ borderRadius: borderRadius.lg, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <InfoIcon />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 0.5 }}>
                    לא נמצאו תוצאות
                  </Typography>
                  <Typography sx={{ fontSize: '14px' }}>
                    נסה לחפש במילים אחרות או נקה את החיפוש כדי לראות את כל השלבים
                  </Typography>
                </Box>
              </Box>
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredSteps.map((step) => (
                <Grid item xs={12} key={step.order}>
                  <Card
                    sx={{
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.medium,
                      border: `2px solid ${step.color}`,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: shadows.large,
                        transform: 'translateY(-4px)',
                      },
                    }}
                  >
                    {/* Step Header */}
                    <Box
                      sx={{
                        background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}CC 100%)`,
                        p: 3,
                        color: colors.neutral[0],
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: colors.neutral[0],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: step.color,
                            fontWeight: 700,
                            fontSize: '20px',
                          }}
                        >
                          {step.order}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {step.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.95 }}>
                            {step.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      {/* Action Link */}
                      <Link href={step.link} passHref style={{ textDecoration: 'none' }}>
                        <Box
                          sx={{
                            mb: 3,
                            p: 2.5,
                            background: `${step.color}15`,
                            borderRadius: borderRadius.lg,
                            border: `2px solid ${step.color}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              background: `${step.color}25`,
                              transform: 'translateX(-4px)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: step.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.neutral[0],
                              }}
                            >
                              {step.icon}
                            </Box>
                            <Typography
                              sx={{
                                fontWeight: 700,
                                fontSize: '16px',
                                color: colors.neutral[900],
                                flex: 1,
                              }}
                            >
                              {step.linkText}
                            </Typography>
                            <Box
                              sx={{
                                px: 2,
                                py: 1,
                                background: step.color,
                                color: colors.neutral[0],
                                borderRadius: borderRadius.md,
                                fontWeight: 700,
                                fontSize: '14px',
                              }}
                            >
                              לחץ כאן
                            </Box>
                          </Box>
                        </Box>
                      </Link>

                      {/* Step Instructions */}
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, mb: 2, color: colors.neutral[800] }}
                      >
                        איך לעשות את זה:
                      </Typography>
                      <List dense>
                        {step.steps.map((instruction, idx) => (
                          <ListItem key={idx} sx={{ alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                              <CheckCircleIcon sx={{ fontSize: 20, color: step.color }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={instruction}
                              primaryTypographyProps={{
                                fontSize: '14px',
                                color: colors.neutral[700],
                                lineHeight: 1.6,
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>

                      {/* Tip */}
                      {step.tip && (
                        <Alert severity="info" sx={{ mt: 2, borderRadius: borderRadius.md }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <InfoIcon sx={{ fontSize: 20, mt: 0.2 }} />
                            <Typography sx={{ fontSize: '13px', lineHeight: 1.5 }}>
                              <strong>טיפ:</strong> {step.tip}
                            </Typography>
                          </Box>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
