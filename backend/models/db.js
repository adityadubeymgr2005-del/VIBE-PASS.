const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const useMongo = !!(process.env.MONGODB_URI || process.env.MONGO_URI);
let dbType = 'JSON_DB';

// --- MOCK DATABASE IMPLEMENTATION (fallback) ---
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JSONModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    let items = this.read();
    
    // Simple filter matching
    if (Object.keys(query).length > 0) {
      items = items.filter(item => {
        for (let key in query) {
          const queryVal = query[key];
          // Support simple $ne filter
          if (queryVal && typeof queryVal === 'object' && queryVal.$ne !== undefined) {
            if (item[key] === queryVal.$ne) return false;
          } else if (item[key] !== queryVal) {
            return false;
          }
        }
        return true;
      });
    }

    // Return a promise-like object that supports .populate()
    const chain = {
      data: items,
      populate: function(field) {
        const collectionMap = {
          'event': 'Event',
          'attendee': 'User',
          'organizer': 'User'
        };
        const refModelName = collectionMap[field];
        if (refModelName) {
          const refModel = new JSONModel(refModelName);
          const refItems = refModel.read();
          this.data = this.data.map(item => {
            const copy = { ...item };
            const refId = copy[field];
            copy[field] = refItems.find(r => r._id === refId) || refId;
            return copy;
          });
        }
        return this;
      },
      then: function(resolve, reject) {
        return Promise.resolve(this.data).then(resolve, reject);
      },
      catch: function(reject) {
        return Promise.resolve(this.data).catch(reject);
      }
    };
    
    // Bind the functions to the chain object
    chain.populate = chain.populate.bind(chain);
    
    // Support direct async await which resolves to the data array
    return Object.assign(Promise.resolve(items), chain);
  }

  async findOne(query = {}) {
    const items = this.read();
    const item = items.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (!item) return null;
    const modelName = this.name;
    return {
      ...item,
      save: async function() {
        const m = new JSONModel(modelName);
        await m.findByIdAndUpdate(this._id, this);
        return this;
      }
    };
  }

  async findById(id) {
    const items = this.read();
    const item = items.find(item => item._id === id);
    if (!item) return null;
    
    const modelName = this.name;
    return {
      ...item,
      save: async function() {
        const m = new JSONModel(modelName);
        await m.findByIdAndUpdate(this._id, this);
        return this;
      }
    };
  }

  async create(data) {
    const items = this.read();
    const newDoc = {
      _id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    items.push(newDoc);
    this.write(items);
    
    const modelName = this.name;
    return {
      ...newDoc,
      save: async function() {
        const m = new JSONModel(modelName);
        await m.findByIdAndUpdate(this._id, this);
        return this;
      }
    };
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this.read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    const updated = {
      ...items[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    items[index] = updated;
    this.write(items);
    return updated;
  }

  async findByIdAndDelete(id) {
    const items = this.read();
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    const deleted = items[index];
    items.splice(index, 1);
    this.write(items);
    return deleted;
  }
}

// --- MONGOOSE MODELS (Primary) ---
let User, Event, Ticket;

if (useMongo) {
  try {
    mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
      .then(() => {
        console.log('MongoDB connected successfully');
        dbType = 'MONGODB';
      })
      .catch((err) => {
        console.error('MongoDB connection error, falling back to Local JSON DB:', err.message);
        setupFallbackModels();
      });
      
    const UserSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
      createdAt: { type: Date, default: Date.now }
    });

    const EventSchema = new mongoose.Schema({
      title: { type: String, required: true },
      description: { type: String, required: true },
      date: { type: String, required: true },
      time: { type: String, required: true },
      venue: { type: String, required: true },
      ticketPrice: { type: Number, required: true },
      seatCapacity: { type: Number, required: true },
      seatsAvailable: { type: Number, required: true },
      bannerUrl: { type: String },
      organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, default: Date.now }
    });

    const TicketSchema = new mongoose.Schema({
      event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
      attendee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      ticketQuantity: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'paid' },
      paymentDetails: { type: Object },
      qrCodeDataUrl: { type: String },
      qrCodeVerifyCode: { type: String, required: true, unique: true },
      checkedIn: { type: Boolean, default: false },
      checkedInAt: { type: Date },
      createdAt: { type: Date, default: Date.now }
    });

    User = mongoose.model('User', UserSchema);
    Event = mongoose.model('Event', EventSchema);
    Ticket = mongoose.model('Ticket', TicketSchema);
    dbType = 'MONGODB';
  } catch (err) {
    console.error('Mongoose setup failed, falling back to Local JSON DB:', err.message);
    setupFallbackModels();
  }
} else {
  console.log('No MONGODB_URI detected, running with Local JSON DB');
  setupFallbackModels();
}

function setupFallbackModels() {
  dbType = 'JSON_DB';
  User = new JSONModel('User');
  Event = new JSONModel('Event');
  Ticket = new JSONModel('Ticket');
}

module.exports = {
  getDbStatus: () => dbType,
  User: () => User,
  Event: () => Event,
  Ticket: () => Ticket
};
