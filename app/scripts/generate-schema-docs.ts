import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function generateDocs() {
  console.log('📚 Generating Schema Documentation...\n');

  // Read Prisma schema
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  let documentation = '# Database Schema Documentation\n\n';
  documentation += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;
  documentation += `**Database:** PostgreSQL 15\n\n`;
  documentation += `**Total Models:** ${(schemaContent.match(/model\s+\w+/g) || []).length}\n\n`;

  documentation += '---\n\n';
  documentation += '## Table of Contents\n\n';

  // Parse models
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  const models: any[] = [];
  let match;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    models.push({ name: modelName });
    documentation += `- [${modelName}](#${modelName.toLowerCase()})\n`;
  }

  documentation += '\n---\n\n';

  // Generate detailed model documentation
  modelRegex.lastIndex = 0; // Reset regex
  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const modelName = match[1];
    const modelContent = match[2];

    documentation += `## ${modelName}\n\n`;

    // Add description based on model name
    const descriptions: Record<string, string> = {
      User: '**User accounts** - System users with different roles (SuperAdmin, Area Manager, City Coordinator, Activist Coordinator)',
      AreaManager: '**Area Managers** - Regional campaign directors overseeing multiple cities',
      City: '**Cities** - Israeli cities within the campaign system',
      CityCoordinator: '**City Coordinators** - City-level campaign managers',
      ActivistCoordinator: '**Activist Coordinators** - Neighborhood-level campaign organizers',
      Neighborhood: '**Neighborhoods** - Geographic campaign districts/precincts (שכונות)',
      Activist: '**Activists** - Field volunteers and campaign workers',
      Task: '**Tasks** - Campaign tasks (canvassing, phone banking, events)',
      TaskAssignment: '**Task Assignments** - M2M junction table for task assignments',
      AttendanceRecord: '**Attendance Records** - Check-in/out tracking with GPS',
      PushSubscription: '**Push Subscriptions** - Web push notification subscriptions',
      Invitation: '**Invitations** - User invitation system with tokens',
      UserToken: '**User Tokens** - Password reset and email confirmation tokens',
      ActivistCoordinatorNeighborhood: '**Activist Coordinator Neighborhoods** - M2M junction for coordinator assignments',
    };

    documentation += `${descriptions[modelName] || 'Data model'}\n\n`;

    // Parse fields
    documentation += '### Fields\n\n';
    documentation += '| Field | Type | Required | Description |\n';
    documentation += '|-------|------|----------|-------------|\n';

    const lines = modelContent.split('\n').filter((line) => line.trim() && !line.trim().startsWith('//'));

    lines.forEach((line) => {
      const fieldMatch = line.match(/(\w+)\s+(\w+(\[\])?(\?)?)\s*(.*)/);
      if (fieldMatch && !line.includes('@@')) {
        const [, name, type, , optional, rest] = fieldMatch;
        const required = !optional ? '✅' : '❌';

        let description = '';
        if (rest.includes('@id')) description += 'Primary Key. ';
        if (rest.includes('@unique')) description += 'Unique. ';
        if (rest.includes('@default')) {
          const defaultMatch = rest.match(/@default\(([^)]+)\)/);
          if (defaultMatch) {
            description += `Default: \`${defaultMatch[1]}\`. `;
          }
        }
        if (rest.includes('@relation')) description += 'Foreign Key. ';

        // Add field-specific descriptions
        if (name === 'createdAt') description = 'Record creation timestamp';
        if (name === 'updatedAt') description = 'Last update timestamp';
        if (name === 'isActive') description = 'Active/inactive status';
        if (name === 'email') description = 'Email address';
        if (name === 'phone') description = 'Phone number';

        documentation += `| \`${name}\` | \`${type}\` | ${required} | ${description} |\n`;
      }
    });

    documentation += '\n';

    // Add indexes
    const indexes = modelContent.match(/@@index\([^)]+\)/g);
    if (indexes && indexes.length > 0) {
      documentation += '### Indexes\n\n';
      indexes.forEach((index) => {
        documentation += `- ${index}\n`;
      });
      documentation += '\n';
    }

    // Add unique constraints
    const uniques = modelContent.match(/@@unique\([^)]+\)/g);
    if (uniques && uniques.length > 0) {
      documentation += '### Unique Constraints\n\n';
      uniques.forEach((unique) => {
        documentation += `- ${unique}\n`;
      });
      documentation += '\n';
    }

    documentation += '---\n\n';
  }

  // Add relationships section
  documentation += '## Relationships\n\n';
  documentation += '### Hierarchy Structure\n\n';
  documentation += '```\n';
  documentation += 'SuperAdmin (User)\n';
  documentation += '└── AreaManager (Regional Director)\n';
  documentation += '    └── City\n';
  documentation += '        ├── CityCoordinator (City Campaign Manager)\n';
  documentation += '        ├── ActivistCoordinator (Neighborhood Organizer)\n';
  documentation += '        └── Neighborhood (Campaign District)\n';
  documentation += '            └── Activist (Field Volunteer)\n';
  documentation += '```\n\n';

  documentation += '### Key Relationships\n\n';
  documentation += '- **User → AreaManager** (1:N) - One user manages one area\n';
  documentation += '- **User → CityCoordinator** (1:N) - One user coordinates cities\n';
  documentation += '- **User → ActivistCoordinator** (1:N) - One user supervises neighborhoods\n';
  documentation += '- **AreaManager → City** (1:N) - One area manager oversees multiple cities\n';
  documentation += '- **City → Neighborhood** (1:N) - One city contains multiple neighborhoods\n';
  documentation += '- **ActivistCoordinator ↔ Neighborhood** (M:N) - Many-to-many via junction table\n';
  documentation += '- **Neighborhood → Activist** (1:N) - One neighborhood has many activists\n';
  documentation += '- **Task ↔ Activist** (M:N) - Many-to-many task assignments\n\n';

  // Save documentation
  const outputPath = path.join(__dirname, '../../docs/schema-exports/schema-documentation.md');
  fs.writeFileSync(outputPath, documentation);

  console.log('✅ Schema Documentation generated!\n');
  console.log('📄 File: docs/schema-exports/schema-documentation.md');
  console.log('📊 Total Models:', models.length);
  console.log('📝 Lines:', documentation.split('\n').length);
  console.log('\n💡 Open the file to view complete documentation with:\n');
  console.log('   - All table definitions\n');
  console.log('   - Field descriptions\n');
  console.log('   - Relationships\n');
  console.log('   - Indexes and constraints\n');

  await prisma.$disconnect();
}

generateDocs();
