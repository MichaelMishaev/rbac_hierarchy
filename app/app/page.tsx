import Link from 'next/link';
import { Box, Typography, Button, Container, Card, CardContent, Grid } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          🚀 Corporations MVP
        </Typography>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Premium UI Hierarchical Organization Management System
        </Typography>

        <Box sx={{ mt: 4, mb: 6 }}>
          <Link href="/login" passHref>
            <Button variant="contained" size="large" sx={{ px: 4, py: 1.5 }}>
              Get Started
            </Button>
          </Link>
        </Box>

        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>✅ Next.js 15</Typography>
                <Typography variant="body2" color="text.secondary">
                  App Router + RSC
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>🎨 Material-UI</Typography>
                <Typography variant="body2" color="text.secondary">
                  Premium Components
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>🗄️ PostgreSQL</Typography>
                <Typography variant="body2" color="text.secondary">
                  Prisma ORM + Docker
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>🔐 NextAuth</Typography>
                <Typography variant="body2" color="text.secondary">
                  Role-Based Access
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  🎉 Foundation Complete!
                </Typography>
                <Typography variant="body1">
                  All core infrastructure is ready. Database seeded with test users.
                </Typography>
                <Box sx={{ mt: 2, textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
                  <Typography variant="body2">
                    <strong>Test Credentials:</strong><br />
                    SuperAdmin: superadmin@hierarchy.test / admin123<br />
                    Manager: manager@acme.com / manager123<br />
                    Supervisor: supervisor@acme.com / supervisor123
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
