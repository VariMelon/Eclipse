# Campaign Data Export/Import Format

## Overview

Eclipse supports exporting and importing campaign data in JSON format. This allows GMs to:
- **Backup** campaign data offline
- **Edit** campaign information in any text editor
- **Transfer** campaigns between instances
- **Version control** campaigns using git or other tools

## Export Format (v1.0)

### Structure

```json
{
  "version": "1.0",
  "exportedAt": "2026-02-19T20:00:00.000Z",
  "exportedBy": "username",
  "campaign": {
    "name": "Campaign Name",
    "subtitle": "Optional subtitle",
    "system": "D&D 5e",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "members": [
    {
      "username": "player1",
      "email": "player1@example.com",
      "role": "PLAYER"
    }
  ],
  "characters": [
    {
      "name": "Character Name",
      "level": 5,
      "stats": { "str": 16, "dex": 14 },
      "ownerUsername": "player1",
      "createdAt": "2026-01-15T00:00:00.000Z",
      "levelSheets": [
        {
          "level": 1,
          "stats": { "str": 14, "dex": 12 },
          "createdAt": "2026-01-15T00:00:00.000Z"
        }
      ]
    }
  ],
  "notes": [
    {
      "content": "Session notes here...",
      "aliases": ["tag1", "tag2"],
      "authorUsername": "gm_username",
      "createdAt": "2026-01-20T00:00:00.000Z"
    }
  ]
}
```

## Field Descriptions

### Campaign
- **name** (required): Campaign name
- **subtitle** (optional): Campaign subtitle or tagline
- **system** (optional): TTRPG system (e.g., "D&D 5e", "Pathfinder 2e")
- **createdAt** (optional): Original creation timestamp

### Members
- **username** (required): User's username in the system
- **email** (required): User's email address
- **role** (required): One of: "GM", "MODERATOR", "PLAYER"

**Note**: Members are only added if they exist in the target system.

### Characters
- **name** (required): Character name
- **level** (required): Character level (number)
- **stats** (required): Character stats (any JSON object)
- **ownerUsername** (required): Username of character owner
- **createdAt** (optional): Character creation timestamp
- **levelSheets** (optional): Array of level progression data
  - **level** (required): Level number
  - **stats** (required): Stats at this level (any JSON object)
  - **createdAt** (optional): When level was reached

**Note**: If the owner username doesn't exist, character is assigned to the importing user.

### Notes
- **content** (required): Note content text
- **aliases** (optional): Array of tags/aliases for the note
- **authorUsername** (optional): Username of note author
- **createdAt** (optional): Note creation timestamp

**Note**: If author username doesn't exist, note is assigned to the importing user.

## How to Export

1. Navigate to your campaign page
2. Click the **"Export Data"** button (GM only)
3. A JSON file will be downloaded automatically
4. Filename format: `CampaignName_export_YYYY-MM-DD.json`

## How to Import

1. Go to the **Campaigns** page
2. Click **"New Campaign"**
3. Switch to the **"Import from File"** tab
4. Select your exported JSON file
5. Click **"Import"**

## Editing Export Files

You can edit the exported JSON file in any text editor before importing:

### Safe to Edit:
- Campaign name, subtitle, system
- Character stats and level data
- Note content and aliases
- Member roles (if users exist in target system)

### Do NOT Edit:
- `version` field (must remain "1.0")
- JSON structure (must remain valid JSON)
- Field types (strings stay strings, numbers stay numbers)

### Tips:
- Use a JSON validator before importing
- Keep backups of original exports
- Test imports in a development environment first
- Remove sensitive data before sharing exports

## Import Behavior

### User Matching
The import system matches users by username first, then email:
- Members: Only added if user exists
- Characters: Assigned to importing user if owner not found
- Notes: Assigned to importing user if author not found

### Data Creation
- A new campaign ID is generated
- All timestamps can be preserved or updated
- Character stats are imported as-is (no validation)
- Notes maintain their original content and structure

### Error Handling
- Import continues even if individual items fail
- Failed items are logged but don't stop the import
- You'll see a success message if campaign is created
- Check campaign data after import to verify everything transferred

## Version Compatibility

Current version: **1.0**

Future versions will maintain backward compatibility when possible. If the format changes, the version number will be incremented.

## Examples

### Minimal Campaign Export
```json
{
  "version": "1.0",
  "exportedAt": "2026-02-19T20:00:00.000Z",
  "exportedBy": "gm_user",
  "campaign": {
    "name": "My Campaign"
  }
}
```

### Full Campaign Export
See the Structure section above for a complete example.

## Security Notes

- Export files may contain sensitive campaign information
- Do not share exports publicly without reviewing content
- Usernames and emails are included in exports
- Consider removing personal information before sharing
- Stats fields can contain any data structure

## Troubleshooting

### Import fails with "Invalid format"
- Verify JSON is valid using a JSON validator
- Check that `version` field exists and is "1.0"
- Ensure `campaign.name` is present

### Members not imported
- Verify users exist in the target system with matching usernames/emails
- Check that role values are "GM", "MODERATOR", or "PLAYER"

### Characters assigned to wrong user
- Verify `ownerUsername` matches exactly (case-sensitive)
- If user doesn't exist, characters default to importing user

### Stats not displaying correctly
- Check that stats are valid JSON objects
- Verify character level is a number
- Stats structure should match your game system's requirements
