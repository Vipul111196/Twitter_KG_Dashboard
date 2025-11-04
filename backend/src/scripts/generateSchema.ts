#!/usr/bin/env ts-node
/**
 * Generate GraphQL schema SDL file
 * Exports schema to dist/schema.graphql for documentation and client generation
 */

import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';

async function generateSchema() {
  console.log('🔧 Generating GraphQL schema...');

  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  await app.init();

  const { schema } = app.get(GraphQLSchemaHost);

  if (!schema) {
    console.error('❌ Schema not found');
    process.exit(1);
  }

  const schemaString = printSchema(schema);
  const distPath = path.join(process.cwd(), 'dist');
  const schemaPath = path.join(distPath, 'schema.graphql');

  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }

  fs.writeFileSync(schemaPath, schemaString);

  console.log(`✅ Schema generated: ${schemaPath}`);
  console.log(`📊 Types: ${Object.keys(schema.getTypeMap()).length}`);

  await app.close();
  process.exit(0);
}

generateSchema().catch((error) => {
  console.error('❌ Schema generation failed:', error);
  process.exit(1);
});


