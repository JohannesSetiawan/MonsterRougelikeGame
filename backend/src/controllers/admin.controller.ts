import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { JsonFileService, JsonFileInfo } from '../services/json-file.service';

export interface CreateEntryDto {
  key: string;
  value: any;
}

export interface UpdateEntryDto {
  value: any;
}

export interface AuthDto {
  username: string;
  password: string;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly jsonFileService: JsonFileService) {}

  /**
   * Admin login endpoint - validates credentials
   */
  @Post('login')
  login(@Body() authDto: AuthDto) {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      throw new HttpException('Admin credentials not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (authDto.username !== adminUsername || authDto.password !== adminPassword) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Return success with basic auth token
    const token = Buffer.from(`${authDto.username}:${authDto.password}`).toString('base64');
    return {
      success: true,
      token,
      message: 'Login successful'
    };
  }

  /**
   * Get all JSON files and their data
   */
  @Get('files')
  getAllFiles(): JsonFileInfo[] {
    try {
      return this.jsonFileService.getAllJsonFiles();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get available file names
   */
  @Get('files/list')
  getFilesList(): string[] {
    try {
      return this.jsonFileService.getAvailableFiles();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get specific JSON file
   */
  @Get('files/:filename')
  getFile(@Param('filename') filename: string): JsonFileInfo {
    try {
      return this.jsonFileService.getJsonFile(filename);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Update entire JSON file
   */
  @Put('files/:filename')
  updateFile(
    @Param('filename') filename: string,
    @Body() data: Record<string, any>
  ): { success: boolean; message: string; file: JsonFileInfo } {
    try {
      this.jsonFileService.updateJsonFile(filename, data);
      const updatedFile = this.jsonFileService.getJsonFile(filename);
      return {
        success: true,
        message: `File ${filename}.json updated successfully`,
        file: updatedFile
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Create new entry in JSON file
   */
  @Post('files/:filename/entries')
  createEntry(
    @Param('filename') filename: string,
    @Body() createEntryDto: CreateEntryDto
  ): { success: boolean; message: string; file: JsonFileInfo } {
    try {
      const fileInfo = this.jsonFileService.getJsonFile(filename);
      
      // Check if key already exists
      if (createEntryDto.key in fileInfo.data) {
        throw new HttpException(`Key '${createEntryDto.key}' already exists`, HttpStatus.CONFLICT);
      }

      // Validate entry against schema if possible
      if (fileInfo.schema && Object.keys(fileInfo.schema).length > 0) {
        const validation = this.jsonFileService.validateEntry(fileInfo.schema, createEntryDto.value);
        if (!validation.valid) {
          throw new HttpException(`Validation failed: ${validation.errors.join(', ')}`, HttpStatus.BAD_REQUEST);
        }
      }

      const updatedFile = this.jsonFileService.updateJsonEntry(filename, createEntryDto.key, createEntryDto.value);
      return {
        success: true,
        message: `Entry '${createEntryDto.key}' created successfully`,
        file: updatedFile
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Update existing entry in JSON file
   */
  @Put('files/:filename/entries/:key')
  updateEntry(
    @Param('filename') filename: string,
    @Param('key') key: string,
    @Body() updateEntryDto: UpdateEntryDto
  ): { success: boolean; message: string; file: JsonFileInfo } {
    try {
      const fileInfo = this.jsonFileService.getJsonFile(filename);
      
      // Check if key exists
      if (!(key in fileInfo.data)) {
        throw new HttpException(`Key '${key}' not found`, HttpStatus.NOT_FOUND);
      }

      // Validate entry against schema if possible
      if (fileInfo.schema && Object.keys(fileInfo.schema).length > 0) {
        const validation = this.jsonFileService.validateEntry(fileInfo.schema, updateEntryDto.value);
        if (!validation.valid) {
          throw new HttpException(`Validation failed: ${validation.errors.join(', ')}`, HttpStatus.BAD_REQUEST);
        }
      }

      const updatedFile = this.jsonFileService.updateJsonEntry(filename, key, updateEntryDto.value);
      return {
        success: true,
        message: `Entry '${key}' updated successfully`,
        file: updatedFile
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Delete entry from JSON file
   */
  @Delete('files/:filename/entries/:key')
  deleteEntry(
    @Param('filename') filename: string,
    @Param('key') key: string
  ): { success: boolean; message: string; file: JsonFileInfo } {
    try {
      const updatedFile = this.jsonFileService.deleteJsonEntry(filename, key);
      return {
        success: true,
        message: `Entry '${key}' deleted successfully`,
        file: updatedFile
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get entry schema for a file
   */
  @Get('files/:filename/schema')
  getFileSchema(@Param('filename') filename: string): { schema: Record<string, any>; sample?: any } {
    try {
      const fileInfo = this.jsonFileService.getJsonFile(filename);
      const firstKey = Object.keys(fileInfo.data)[0];
      const sampleEntry = firstKey ? fileInfo.data[firstKey] : null;
      
      return {
        schema: fileInfo.schema || {},
        sample: sampleEntry
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}