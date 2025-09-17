import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface JsonFileInfo {
  name: string;
  path: string;
  data: Record<string, any>;
  schema?: Record<string, any>; // Inferred schema from existing data
}

@Injectable()
export class JsonFileService {
  private readonly dataPath = path.join(process.cwd(), 'src', 'data');
  private readonly jsonFiles = ['abilities.json', 'items.json', 'monsters.json', 'moves.json'];

  /**
   * Get all JSON files and their data
   */
  getAllJsonFiles(): JsonFileInfo[] {
    return this.jsonFiles.map(filename => {
      const filePath = path.join(this.dataPath, filename);
      const data = this.readJsonFile(filePath);
      const schema = this.inferSchema(data);
      
      return {
        name: filename.replace('.json', ''),
        path: filePath,
        data,
        schema
      };
    });
  }

  /**
   * Get specific JSON file data
   */
  getJsonFile(filename: string): JsonFileInfo {
    if (!this.jsonFiles.includes(`${filename}.json`)) {
      throw new Error(`File ${filename}.json not found in allowed files`);
    }

    const filePath = path.join(this.dataPath, `${filename}.json`);
    const data = this.readJsonFile(filePath);
    const schema = this.inferSchema(data);

    return {
      name: filename,
      path: filePath,
      data,
      schema
    };
  }

  /**
   * Update entire JSON file
   */
  updateJsonFile(filename: string, data: Record<string, any>): void {
    if (!this.jsonFiles.includes(`${filename}.json`)) {
      throw new Error(`File ${filename}.json not found in allowed files`);
    }

    const filePath = path.join(this.dataPath, `${filename}.json`);
    this.writeJsonFile(filePath, data);
  }

  /**
   * Add or update a single entry in JSON file
   */
  updateJsonEntry(filename: string, key: string, value: any): JsonFileInfo {
    const fileInfo = this.getJsonFile(filename);
    fileInfo.data[key] = value;
    this.updateJsonFile(filename, fileInfo.data);
    return this.getJsonFile(filename); // Return updated data
  }

  /**
   * Delete an entry from JSON file
   */
  deleteJsonEntry(filename: string, key: string): JsonFileInfo {
    const fileInfo = this.getJsonFile(filename);
    if (!(key in fileInfo.data)) {
      throw new Error(`Key '${key}' not found in ${filename}.json`);
    }
    delete fileInfo.data[key];
    this.updateJsonFile(filename, fileInfo.data);
    return this.getJsonFile(filename); // Return updated data
  }

  /**
   * Read JSON file safely
   */
  private readJsonFile(filePath: string): Record<string, any> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read JSON file: ${error.message}`);
    }
  }

  /**
   * Write JSON file safely with formatting
   */
  private writeJsonFile(filePath: string, data: Record<string, any>): void {
    try {
      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write JSON file: ${error.message}`);
    }
  }

  /**
   * Infer schema from existing JSON data
   */
  private inferSchema(data: Record<string, any>): Record<string, any> {
    if (Object.keys(data).length === 0) {
      return {};
    }

    // Get the first entry to infer the schema
    const firstKey = Object.keys(data)[0];
    const firstEntry = data[firstKey];
    
    if (typeof firstEntry !== 'object' || firstEntry === null) {
      return { type: typeof firstEntry };
    }

    // Create schema based on first entry structure
    const schema: Record<string, any> = {};
    for (const [key, value] of Object.entries(firstEntry)) {
      if (Array.isArray(value)) {
        // Check if it's an array of tuples (like learnableMoves)
        if (value.length > 0 && Array.isArray(value[0])) {
          schema[key] = {
            type: 'array',
            itemType: 'tuple'
          };
        } else {
          schema[key] = {
            type: 'array',
            itemType: value.length > 0 ? typeof value[0] : 'string'
          };
        }
      } else if (typeof value === 'object' && value !== null) {
        schema[key] = {
          type: 'object',
          required: value !== null && value !== undefined
        };
      } else {
        schema[key] = {
          type: typeof value,
          required: value !== null && value !== undefined
        };
      }
    }

    return schema;
  }

  /**
   * Validate entry against inferred schema
   */
  validateEntry(schema: Record<string, any>, entry: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof entry !== 'object' || entry === null) {
      return { valid: false, errors: ['Entry must be an object'] };
    }

    // Check for required fields and types
    for (const [key, fieldSchema] of Object.entries(schema)) {
      if (fieldSchema.required && !(key in entry)) {
        errors.push(`Missing required field: ${key}`);
        continue;
      }

      if (key in entry) {
        const value = entry[key];
        const expectedType = fieldSchema.type;

        if (expectedType === 'array') {
          if (!Array.isArray(value)) {
            errors.push(`Field '${key}' should be an array`);
          }
        } else if (typeof value !== expectedType) {
          errors.push(`Field '${key}' should be of type ${expectedType}, got ${typeof value}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get all available JSON file names
   */
  getAvailableFiles(): string[] {
    return this.jsonFiles.map(filename => filename.replace('.json', ''));
  }
}