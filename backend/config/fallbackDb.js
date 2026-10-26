const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Simple query matcher for basic MongoDB-style queries
function matchQuery(item, query) {
  if (!query || Object.keys(query).length === 0) return true;
  
  for (const key in query) {
    const val = query[key];
    
    // Support nested query/operators like $or
    if (key === '$or' && Array.isArray(val)) {
      return val.some(subQuery => matchQuery(item, subQuery));
    }
    
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const op = Object.keys(val)[0];
      const opVal = val[op];
      if (op === '$regex') {
        const regex = new RegExp(opVal, val['$options'] || 'i');
        if (!regex.test(item[key] || '')) return false;
        continue;
      }
      if (op === '$in' && Array.isArray(opVal)) {
        if (!opVal.includes(item[key])) return false;
        continue;
      }
      if (op === '$ne') {
        if (item[key] === opVal) return false;
        continue;
      }
      if (op === '$gte') {
        if (!(item[key] >= opVal)) return false;
        continue;
      }
      if (op === '$lte') {
        if (!(item[key] <= opVal)) return false;
        continue;
      }
    } else {
      // Direct matching (handles string, boolean, numbers, or array matching)
      if (Array.isArray(item[key])) {
        if (!item[key].includes(val)) return false;
      } else if (item[key] !== val) {
        return false;
      }
    }
  }
  return true;
}

class FallbackDocument {
  constructor(data, model) {
    Object.assign(this, JSON.parse(JSON.stringify(data)));
    Object.defineProperty(this, '_model', { value: model, enumerable: false });
  }

  async save() {
    const updated = await this._model.findByIdAndUpdate(this._id, this, { new: true });
    Object.assign(this, JSON.parse(JSON.stringify(updated)));
    return this;
  }

  toObject() {
    return JSON.parse(JSON.stringify(this));
  }

  toJSON() {
    return this.toObject();
  }
}

class FallbackModel {
  constructor(modelName) {
    this.modelName = modelName;
    this.filePath = path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  _read() {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error(`Error reading fallback DB file: ${this.filePath}`, e);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error writing fallback DB file: ${this.filePath}`, e);
    }
  }

  async find(query = {}) {
    const items = this._read();
    const results = items.filter(item => matchQuery(item, query));
    
    // Mock population support if query contains populate patterns (handled manually or simplified)
    const docs = results.map(item => new FallbackDocument(item, this));
    
    // Add simple mock population methods to return value
    docs.populate = function(path) {
      // Mock populate: in custom models, we will manually populate referenced IDs if needed,
      // but to prevent controller crashes, we will add dummy chained functions.
      return Promise.resolve(docs);
    };
    
    return docs;
  }

  async findOne(query = {}) {
    const items = this._read();
    const item = items.find(item => matchQuery(item, query));
    return item ? new FallbackDocument(item, this) : null;
  }

  async findById(id) {
    if (!id) return null;
    const cleanId = id.toString();
    return this.findOne({ _id: cleanId });
  }

  async create(data) {
    const items = this._read();
    const newItem = {
      _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      ...JSON.parse(JSON.stringify(data)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    this._write(items);
    return new FallbackDocument(newItem, this);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    if (!id) return null;
    const cleanId = id.toString();
    const items = this._read();
    const index = items.findIndex(item => item._id === cleanId);
    
    if (index === -1) return null;
    
    const currentItem = items[index];
    // Support update operators like $set, $push, $pull or simple overrides
    let updatedItem = { ...currentItem };
    
    if (update.$set) {
      updatedItem = { ...updatedItem, ...update.$set };
    } else if (update.$push) {
      for (const key in update.$push) {
        if (!Array.isArray(updatedItem[key])) {
          updatedItem[key] = [];
        }
        updatedItem[key].push(update.$push[key]);
      }
    } else if (update.$pull) {
      for (const key in update.$pull) {
        if (Array.isArray(updatedItem[key])) {
          const pullVal = update.$pull[key];
          if (pullVal && typeof pullVal === 'object') {
            const pullKey = Object.keys(pullVal)[0];
            updatedItem[key] = updatedItem[key].filter(subItem => subItem[pullKey] !== pullVal[pullKey]);
          } else {
            updatedItem[key] = updatedItem[key].filter(subItem => subItem !== pullVal);
          }
        }
      }
    } else {
      // Normal replacement update, excluding immutable fields
      const { _id, createdAt, ...updateFields } = update;
      updatedItem = { ...updatedItem, ...updateFields };
    }
    
    updatedItem.updatedAt = new Date().toISOString();
    items[index] = updatedItem;
    this._write(items);
    
    return new FallbackDocument(updatedItem, this);
  }

  async findByIdAndDelete(id) {
    if (!id) return null;
    const cleanId = id.toString();
    const items = this._read();
    const index = items.findIndex(item => item._id === cleanId);
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    this._write(items);
    return new FallbackDocument(deleted, this);
  }

  async deleteOne(query = {}) {
    const items = this._read();
    const index = items.findIndex(item => matchQuery(item, query));
    if (index === -1) return { deletedCount: 0 };
    items.splice(index, 1);
    this._write(items);
    return { deletedCount: 1 };
  }

  async deleteMany(query = {}) {
    const items = this._read();
    const remaining = items.filter(item => !matchQuery(item, query));
    const deletedCount = items.length - remaining.length;
    this._write(remaining);
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const items = this._read();
    return items.filter(item => matchQuery(item, query)).length;
  }
}

module.exports = {
  FallbackModel,
  FallbackDocument
};
