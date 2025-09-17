import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DynamicFormProps {
  data?: any;
  schema?: Record<string, any>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  title?: string;
}

interface FormField {
  key: string;
  type: string;
  value: any;
  required: boolean;
  isArray?: boolean;
  itemType?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  data = {},
  schema = {},
  onSubmit,
  onCancel,
  isEdit = false,
  title
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    // Initialize form fields based on schema and existing data
    const initialFields: FormField[] = [];
    const initialData: Record<string, any> = { ...data };

    // Process schema fields
    Object.entries(schema).forEach(([key, fieldSchema]: [string, any]) => {
      let defaultValue = data[key];
      if (!defaultValue) {
        if (key === 'baseStats') {
          defaultValue = {
            hp: 50,
            attack: 50,
            defense: 50,
            specialAttack: 50,
            specialDefense: 50,
            speed: 50
          };
        } else {
          defaultValue = getDefaultValue(fieldSchema.type, fieldSchema.itemType);
        }
      }
      
      const field: FormField = {
        key,
        type: fieldSchema.type || 'string',
        value: defaultValue,
        required: fieldSchema.required || false,
        isArray: fieldSchema.type === 'array',
        itemType: fieldSchema.itemType
      };
      initialFields.push(field);
      if (!(key in initialData)) {
        initialData[key] = field.value;
      }
    });

    // Add any existing data fields not in schema
    Object.entries(data).forEach(([key, value]) => {
      if (!schema[key]) {
        let itemType = 'string';
        let fieldType: string;
        
        if (Array.isArray(value)) {
          fieldType = 'array';
          if (value.length > 0) {
            if (Array.isArray(value[0])) {
              itemType = 'tuple';
            } else {
              itemType = typeof value[0];
            }
          }
        } else {
          fieldType = typeof value;
        }
        
        const field: FormField = {
          key,
          type: fieldType,
          value,
          required: false,
          isArray: Array.isArray(value),
          itemType
        };
        initialFields.push(field);
      }
    });

    setFields(initialFields);
    setFormData(initialData);
  }, [data, schema]);

  const getDefaultValue = (type: string, _itemType?: string) => {
    switch (type) {
      case 'array':
        return [];
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'object':
        return {};
      case 'string':
      default:
        return '';
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayChange = (key: string, index: number, value: any) => {
    setFormData(prev => {
      const newArray = [...(prev[key] || [])];
      newArray[index] = value;
      return {
        ...prev,
        [key]: newArray
      };
    });
  };

  const addArrayItem = (key: string, itemType: string) => {
    let defaultValue;
    
    if (key === 'learnableMoves' || itemType === 'tuple') {
      defaultValue = ['', 1]; // [moveId, level]
    } else {
      defaultValue = getDefaultValue(itemType);
    }
    
    setFormData(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), defaultValue]
    }));
  };

  const removeArrayItem = (key: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_: any, i: number) => i !== index)
    }));
  };

  const addNewField = () => {
    const key = prompt('Enter field name:');
    if (!key || key.trim() === '') return;

    const type = prompt('Enter field type:\n- string\n- number\n- boolean\n- array\n- object') || 'string';
    let itemType: string | undefined;
    
    if (type === 'array') {
      itemType = prompt('Enter array item type (string, number, tuple):') || 'string';
    }
    
    let defaultValue;
    if (key.trim() === 'baseStats') {
      defaultValue = {
        hp: 50,
        attack: 50,
        defense: 50,
        specialAttack: 50,
        specialDefense: 50,
        speed: 50
      };
    } else {
      defaultValue = getDefaultValue(type);
    }
    
    const newField: FormField = {
      key: key.trim(),
      type,
      value: defaultValue,
      required: false,
      isArray: type === 'array',
      itemType
    };

    setFields(prev => [...prev, newField]);
    setFormData(prev => ({
      ...prev,
      [key.trim()]: newField.value
    }));
  };

  const removeField = (key: string) => {
    if (schema[key]) {
      alert('Cannot remove schema-defined fields');
      return;
    }

    setFields(prev => prev.filter(field => field.key !== key));
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    for (const field of fields) {
      if (field.required && (formData[field.key] === '' || formData[field.key] === null || formData[field.key] === undefined)) {
        alert(`Field '${field.key}' is required`);
        return;
      }
    }

    onSubmit(formData);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key];

    // Handle special object fields like baseStats
    if (field.type === 'object' && field.key === 'baseStats') {
      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium">
            {field.key} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-blue-50 border-blue-200">
            {['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'].map(stat => (
              <div key={stat} className="space-y-1">
                <label className="block text-xs font-medium capitalize text-blue-800">
                  {stat.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="number"
                  value={value?.[stat] || 0}
                  onChange={(e) => handleFieldChange(field.key, {
                    ...value,
                    [stat]: Number(e.target.value)
                  })}
                  className="w-full p-2 border border-blue-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  min="1"
                  max="255"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Handle learnableMoves array (array of tuples)
    if (field.isArray && field.key === 'learnableMoves') {
      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium">
            {field.key} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {(value || []).map((item: any, index: number) => (
              <div key={index} className="flex gap-2 items-center p-2 border rounded-md bg-green-50 border-green-200">
                <div className="flex-1">
                  <label className="block text-xs text-green-700 font-medium">Move ID</label>
                  <input
                    type="text"
                    value={Array.isArray(item) ? item[0] || '' : item}
                    onChange={(e) => {
                      const newItem = Array.isArray(item) ? [e.target.value, item[1] || 1] : [e.target.value, 1];
                      handleArrayChange(field.key, index, newItem);
                    }}
                    className="w-full p-1 border border-green-300 rounded text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    placeholder="e.g., scratch, ember"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-green-700 font-medium">Level</label>
                  <input
                    type="number"
                    value={Array.isArray(item) ? item[1] || 1 : 1}
                    onChange={(e) => {
                      const moveId = Array.isArray(item) ? item[0] || '' : item;
                      const newItem = [moveId, Number(e.target.value)];
                      handleArrayChange(field.key, index, newItem);
                    }}
                    className="w-full p-1 border border-green-300 rounded text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    min="1"
                    max="100"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem(field.key, index)}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(field.key, 'tuple')}
            >
              Add Move
            </Button>
          </div>
        </div>
      );
    }

    // Handle regular arrays (like type, abilities)
    if (field.isArray) {
      return (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium">
            {field.key} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {(value || []).map((item: any, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type={field.itemType === 'number' ? 'number' : 'text'}
                  value={item}
                  onChange={(e) => handleArrayChange(
                    field.key, 
                    index, 
                    field.itemType === 'number' ? Number(e.target.value) : e.target.value
                  )}
                  className="flex-1 p-2 border rounded-md"
                  placeholder={`${field.key} entry`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem(field.key, index)}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(field.key, field.itemType || 'string')}
            >
              Add {field.key.slice(0, -1)}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-2">
        <label className="block text-sm font-medium">
          {field.key} {field.required && <span className="text-red-500">*</span>}
          {!schema[field.key] && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeField(field.key)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              Remove
            </Button>
          )}
        </label>
        {field.type === 'boolean' ? (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            className="p-2 border rounded-md"
          />
        ) : field.type === 'number' ? (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
            required={field.required}
            className="w-full p-2 border rounded-md"
          />
        ) : (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            required={field.required}
            rows={field.key === 'description' ? 3 : 1}
            className="w-full p-2 border rounded-md resize-vertical"
          />
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {title || (isEdit ? 'Edit Entry' : 'Create New Entry')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(renderField)}
          
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={addNewField}
              className="mb-4"
            >
              Add Custom Field
            </Button>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {isEdit ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};