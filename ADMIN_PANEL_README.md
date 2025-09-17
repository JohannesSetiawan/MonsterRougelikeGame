# Admin Panel - JSON Data Editor

The admin panel provides a web-based interface for managing all JSON data files used in the Pokemon Roguelike game. It allows developers to create, read, update, and delete entries in the game's data files without manually editing JSON files.

## Features

### 🔐 **Secure Authentication**
- Protected by username/password credentials stored in `.env` file
- Uses basic authentication with encrypted transmission
- Session management with automatic logout

### 📁 **File Management**
- Supports all game data files:
  - `abilities.json` - Monster abilities
  - `items.json` - Game items and their effects  
  - `monsters.json` - Monster stats and information
  - `moves.json` - Combat moves and their properties

### 🛠️ **Dynamic Form Generation**
- Automatically adapts to JSON structure
- Infers field types and validation rules
- Supports all data types: strings, numbers, booleans, arrays
- Add custom fields that aren't in the original schema

### ⚡ **Real-time Updates**
- Changes are immediately written to JSON files
- No need to restart the server
- Files are automatically formatted with proper indentation

### 🔍 **Advanced Features**
- Search and filter entries
- Schema validation based on existing data
- Entry preview with type indicators
- Bulk operations support

## Setup Instructions

### 1. Environment Configuration

Make sure your backend `.env` file contains admin credentials:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

> ⚠️ **Security Note**: Use strong credentials in production!

### 2. Backend Setup

The admin panel is automatically included when you start the backend server:

```bash
cd backend
npm run start:dev
```

The admin API will be available at `http://localhost:3001/admin`

### 3. Frontend Access

#### Option A: Direct URL
Navigate to `http://localhost:5173/admin` in your browser

#### Option B: Game Interface (Development Mode)
In development mode, there's an "Admin" button in the game header that opens the admin panel in a new tab.

## Using the Admin Panel

### Login
1. Enter your admin credentials (from `.env` file)
2. Click "Login to Admin Panel"

### Managing Files
1. **Overview**: See all JSON files and entry counts
2. **Edit File**: Click "Edit File" to manage entries in a specific file
3. **Search**: Use the search bar to find specific entries
4. **Add Entry**: Click "Add New Entry" to create new data

### Creating/Editing Entries

#### Automatic Form Generation
The panel automatically creates forms based on the existing data structure:
- **String fields**: Text inputs
- **Number fields**: Number inputs  
- **Boolean fields**: Checkboxes
- **Array fields**: Dynamic list with add/remove buttons

#### Custom Fields
You can add fields not present in the original schema:
1. Click "Add Custom Field"
2. Enter field name and type
3. The field will be added to the form

#### Validation
- Required fields are marked with red asterisks
- Type validation ensures data consistency
- Duplicate key prevention

### Data Operations

#### Create Entry
1. Navigate to a file
2. Click "Add New Entry" 
3. Fill in the form
4. Enter a unique key when prompted
5. Click "Create"

#### Edit Entry  
1. Find the entry you want to modify
2. Click "Edit" next to the entry
3. Modify the form fields
4. Click "Update"

#### Delete Entry
1. Find the entry to delete
2. Click "Delete" next to the entry  
3. Confirm the deletion

## API Endpoints

All admin endpoints require basic authentication:

### Authentication
- `POST /admin/login` - Validate credentials and get token

### File Operations  
- `GET /admin/files` - Get all JSON files and data
- `GET /admin/files/list` - Get available file names
- `GET /admin/files/:filename` - Get specific file data
- `PUT /admin/files/:filename` - Update entire file
- `GET /admin/files/:filename/schema` - Get inferred schema

### Entry Operations
- `POST /admin/files/:filename/entries` - Create new entry
- `PUT /admin/files/:filename/entries/:key` - Update entry
- `DELETE /admin/files/:filename/entries/:key` - Delete entry

## File Structure

The admin panel manages these game data files:

```
backend/src/data/
├── abilities.json      # Monster abilities
├── items.json         # Items and their effects  
├── monsters.json      # Monster stats and data
└── moves.json         # Combat moves
```

## Schema Inference

The system automatically infers schemas from existing data:

```javascript
// Example inferred schema for items.json
{
  "id": { "type": "string", "required": true },
  "name": { "type": "string", "required": true },
  "description": { "type": "string", "required": true },
  "type": { "type": "string", "required": true },
  "effect": { "type": "string", "required": true },
  "rarity": { "type": "string", "required": false },
  "value": { "type": "number", "required": false }
}
```

## Security Considerations

### Production Deployment
- Change default admin credentials
- Use HTTPS in production
- Consider IP whitelisting for admin access
- Implement rate limiting
- Regular backup of data files

### Access Control
- Only development mode shows admin button in game UI
- Admin panel should be accessible only to authorized personnel
- Consider implementing role-based access if multiple admins

## Troubleshooting

### Common Issues

**"Admin credentials not configured"**
- Check that `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set in `.env`
- Restart the backend server after changing `.env`

**"File not found" errors**
- Ensure all JSON files exist in `backend/src/data/`
- Check file permissions

**Schema validation failures**
- Review the existing data structure
- Ensure new entries match expected format
- Check for required fields

**Cannot save changes**
- Verify file write permissions
- Check disk space
- Ensure JSON syntax is valid

### Development Tips

1. **Backup Strategy**: Always backup JSON files before major changes
2. **Testing**: Test changes in development before production
3. **Validation**: Use the schema preview to understand expected formats
4. **Monitoring**: Check server logs for any errors during file operations

## Extending the Admin Panel

### Adding New JSON Files
1. Add filename to `jsonFiles` array in `JsonFileService`
2. Place the JSON file in `backend/src/data/`
3. Restart the backend server

### Custom Validation Rules
Modify the `validateEntry` method in `JsonFileService` to add custom validation logic.

### Additional Field Types
Extend the `DynamicForm` component to support new field types like date pickers, file uploads, etc.

---

## Contributing

When contributing to the admin panel:

1. Test all CRUD operations thoroughly
2. Ensure schema inference works with your data format
3. Add appropriate error handling
4. Update this documentation for new features
5. Consider security implications of changes

---

*This admin panel was created as part of the Pokemon Roguelike game's development tools to enable easy content management without manual JSON editing.*