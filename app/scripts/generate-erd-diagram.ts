import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Table {
  name: string;
  columns: Column[];
  relations: Relation[];
}

interface Column {
  name: string;
  type: string;
  isPrimary: boolean;
  isUnique: boolean;
  isRequired: boolean;
}

interface Relation {
  from: string;
  to: string;
  type: string;
}

async function generateERD() {
  console.log('🎨 Generating ERD Diagram from Prisma Schema...\n');

  // Read Prisma schema
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // Parse models from schema
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  const tables: Table[] = [];
  let match;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    const tableName = match[1];
    const modelContent = match[2];

    // Parse columns
    const columns: Column[] = [];
    const columnLines = modelContent.split('\n').filter((line) => line.trim() && !line.trim().startsWith('//'));

    columnLines.forEach((line) => {
      const columnMatch = line.match(/(\w+)\s+(\w+)(\?)?.*?(@id|@unique)?/);
      if (columnMatch && !line.includes('@@')) {
        const [, name, type, optional, decorator] = columnMatch;
        columns.push({
          name,
          type,
          isPrimary: decorator === '@id',
          isUnique: decorator === '@unique',
          isRequired: !optional,
        });
      }
    });

    tables.push({ name: tableName, columns, relations: [] });
  }

  // Generate Mermaid ERD
  let mermaidERD = '```mermaid\nerDiagram\n';

  // Add table definitions
  tables.forEach((table) => {
    mermaidERD += `    ${table.name} {\n`;
    table.columns.slice(0, 10).forEach((col) => {
      // Limit to 10 columns for readability
      const indicators = [];
      if (col.isPrimary) indicators.push('PK');
      if (col.isUnique) indicators.push('UK');
      const indicator = indicators.length > 0 ? ` "${indicators.join(', ')}"` : '';
      mermaidERD += `        ${col.type} ${col.name}${indicator}\n`;
    });
    mermaidERD += `    }\n`;
  });

  // Parse and add relationships
  const relationshipPatterns = [
    { regex: /(\w+)\s+(\w+)\s+@relation/, type: 'one-to-many' },
    { regex: /(\w+)\[\]\s+(\w+)/, type: 'one-to-many' },
  ];

  tables.forEach((table) => {
    const modelContent = schemaContent.match(new RegExp(`model\\s+${table.name}\\s*\\{([^}]+)\\}`))?.[1] || '';

    // User -> AreaManager
    if (table.name === 'User') {
      mermaidERD += `    User ||--o{ AreaManager : "manages"\n`;
      mermaidERD += `    User ||--o{ CityCoordinator : "coordinates"\n`;
      mermaidERD += `    User ||--o{ ActivistCoordinator : "supervises"\n`;
    }

    // AreaManager -> City
    if (table.name === 'AreaManager') {
      mermaidERD += `    AreaManager ||--o{ City : "oversees"\n`;
    }

    // City -> relationships
    if (table.name === 'City') {
      mermaidERD += `    City ||--o{ CityCoordinator : "has"\n`;
      mermaidERD += `    City ||--o{ ActivistCoordinator : "has"\n`;
      mermaidERD += `    City ||--o{ Neighborhood : "contains"\n`;
    }

    // Neighborhood relationships
    if (table.name === 'Neighborhood') {
      mermaidERD += `    Neighborhood ||--o{ Activist : "contains"\n`;
      mermaidERD += `    Neighborhood ||--o{ ActivistCoordinatorNeighborhood : "assigned_to"\n`;
    }

    // ActivistCoordinator M2M
    if (table.name === 'ActivistCoordinator') {
      mermaidERD += `    ActivistCoordinator ||--o{ ActivistCoordinatorNeighborhood : "manages"\n`;
    }

    // Activist relationships
    if (table.name === 'Activist') {
      mermaidERD += `    ActivistCoordinator ||--o{ Activist : "supervises"\n`;
      mermaidERD += `    Activist ||--o{ AttendanceRecord : "has"\n`;
      mermaidERD += `    Activist ||--o{ TaskAssignment : "assigned"\n`;
    }

    // Task relationships
    if (table.name === 'Task') {
      mermaidERD += `    Task ||--o{ TaskAssignment : "has"\n`;
    }
  });

  mermaidERD += '```\n';

  // Save to file
  const outputPath = path.join(__dirname, '../../docs/schema-exports/erd-diagram.md');
  fs.writeFileSync(outputPath, mermaidERD);

  console.log('✅ ERD Diagram generated!\n');
  console.log('📄 File: docs/schema-exports/erd-diagram.md\n');
  console.log('📊 Tables found:', tables.length);
  console.log('📋 Preview:\n');
  console.log(mermaidERD.split('\n').slice(0, 30).join('\n'));
  console.log('\n...(see full file for complete diagram)\n');
  console.log('💡 View online: https://mermaid.live/');
  console.log('   Copy the content and paste it there to see the visual diagram!\n');

  await prisma.$disconnect();
}

generateERD();
