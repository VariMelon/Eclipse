# System Architecture Refactoring

## Overview
Systems are now independent, rule-defining entities that campaigns reference. This allows game designers to create comprehensive TTRPG systems with guided wizards for character creation, NPCs, monsters, and environments.

## Changes Made

### 1. Database Schema (Prisma)
- **New Model**: `System` with comprehensive JSON fields for game rules
- **Campaign Update**: Changed from `system: String?` to `systemId: String?` with relation to System model
- **User Relation**: Added `systems` relation for created systems

#### System Model Fields:
- **Core Mechanics**: `diceSystem`, `statBlocks`, `levelUpCriteria`, `levelUpEffects`
- **Creation Wizards**: `characterCreationRules`, `npcCreationRules`, `monsterCreationRules`, `environmentCreationRules`
- **Game Content**: `races`, `classes`, `spells`, `weapons`, `armor`, `items`
- **Metadata**: `isPublic` (share with all users), `createdBy`, timestamps

### 2. Database Migration
- **File**: `prisma/migrations/20260219235000_create_system_table/migration.sql`
- Creates System table with all JSON fields
- Adds systemId column to Campaign
- Adds foreign key relationships
- Drops old `system` TEXT column
- **Status**: ✅ Applied successfully

### 3. API Endpoints

#### `/api/systems` (GET, POST)
- **GET**: Fetch all systems (user's own + public systems)
- **POST**: Create new system with validation

#### `/api/systems/[id]` (GET, PATCH, DELETE)
- **GET**: Fetch single system (accessible if public or owned)
- **PATCH**: Update system (creator only)
- **DELETE**: Delete system (creator only, prevents deletion if used by campaigns)

### 4. UI Pages

#### `/systems` - Systems List Page
- Displays owned systems and public systems separately
- Create new system modal (name, description, public flag)
- Campaign count for each system
- Edit/Delete actions for owned systems
- View action for public systems

#### `/systems/[id]` - System Detail Page
- Basic information editor (name, description, visibility)
- Game rules overview showing configured status
- Placeholder for future wizard interfaces
- Read-only for public systems (non-owners)

### 5. Campaign Integration Updates

#### Campaign Creation
- Changed from free-text system input to dropdown of available systems
- Shows system name with (Public) or (Your system) label
- Links to Systems page for creating new systems
- Validates system access (public or owned)

#### Campaign Display
- Shows system name from relation (instead of raw string)
- Displays system badge on campaign cards

#### Export/Import
- Export now includes `systemId` and `systemName`
- Import attempts to match system by ID first, then by name
- Only matches public systems or user's own systems
- Campaign imported without system if match fails

### 6. Notifications
- Updated campaign invite notifications to show system name from relation

### 7. Tests
- Updated campaign creation test to expect `systemId` instead of `system`
- All 53 tests passing ✅

### 8. TypeScript
- Added NextAuth type definitions (`types/next-auth.d.ts`)
- Extends Session and User interfaces with `id` property

## Migration Instructions

### For Development:
```bash
# Generate Prisma client
npx prisma generate

# Run migration
node scripts/run-migration.mjs prisma/migrations/20260219235000_create_system_table/migration.sql

# Run tests
npm test

# Build
npm run build
```

### For Production (Vercel):
Migration runs automatically during build via the updated migration script.

## Breaking Changes

⚠️ **Campaign Creation**: API now expects `systemId` (UUID) instead of `system` (string)

**Migration Path for Existing Campaigns**:
- Old campaigns with TEXT `system` values will have `systemId: null` after migration
- The old `system` column is dropped - data is NOT preserved
- Users should create System records and update campaigns if needed

## Future Enhancements (Placeholders Created)

The System model is designed to support comprehensive game rule wizards:

1. **Dice System Configurator**: Define available dice types, default rolls
2. **Stat Block Builder**: Create custom character stats (STR, DEX, etc.)
3. **Character Creator Wizard**: Step-by-step character creation with validations
4. **NPC Generator**: Templates and rules for NPC creation
5. **Monster Builder**: Monster stat blocks, abilities, CR calculations
6. **Environment Designer**: Location types, properties, encounters
7. **Content Libraries**: Race/class/spell/item definitions with search/filter

Each JSON field is flexible enough to support complex nested data structures as these wizards are built out.

## Benefits

✅ **Reusability**: Systems can be shared across multiple campaigns  
✅ **Consistency**: All campaigns using a system follow the same rules  
✅ **Collaboration**: Public systems allow community sharing  
✅ **Extensibility**: JSON fields support any game system's unique mechanics  
✅ **Protection**: Systems in use cannot be deleted, preserving campaign integrity  
