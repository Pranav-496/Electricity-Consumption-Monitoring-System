/**
 * Centralized Database Service Layer
 * Supports both Live Supabase PostgREST execution and Demonstration Repository
 */

const { supabase, supabaseAdmin, isLiveSupabase } = require('../config/supabase');
const crypto = require('crypto');

// Initial Demonstration Store (mirrors database/seed.sql)
const memoryStore = {
  profiles: [
    { id: 'a0000000-0000-0000-0000-000000000001', username: 'admin', full_name: 'Chief Grid Administrator', role: 'admin', created_at: new Date('2024-01-01').toISOString() },
    { id: 'c0000000-0000-0000-0000-000000000001', username: 'johndoe', full_name: 'Johnathan Doe', role: 'consumer', created_at: new Date('2024-01-05').toISOString() },
    { id: 'c0000000-0000-0000-0000-000000000002', username: 'rajesh_sharma', full_name: 'Rajesh Sharma', role: 'consumer', created_at: new Date('2024-01-10').toISOString() },
    { id: 'c0000000-0000-0000-0000-000000000003', username: 'techcorp', full_name: 'TechCorp Logistics', role: 'consumer', created_at: new Date('2024-01-12').toISOString() }
  ],
  tariffs: [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Residential Standard', description: 'Standard domestic slab rate with low fixed charges', rate_per_unit: 5.50, fixed_charge: 85.00, tax_percentage: 5.00, is_active: true, created_at: new Date('2024-01-01').toISOString() },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Commercial General', description: 'Commercial small business and retail rate', rate_per_unit: 9.20, fixed_charge: 220.00, tax_percentage: 12.00, is_active: true, created_at: new Date('2024-01-01').toISOString() },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Industrial High-Tension', description: 'Industrial manufacturing and heavy equipment tariff', rate_per_unit: 12.80, fixed_charge: 650.00, tax_percentage: 18.00, is_active: true, created_at: new Date('2024-01-01').toISOString() }
  ],
  consumers: [
    { id: 'c1111111-0000-0000-0000-000000000001', name: 'Johnathan Doe', address: '42 Park Avenue, Metro City', contact: '+1-555-0192', email: 'john.doe@example.com', user_id: 'a0000000-0000-0000-0000-000000000001', consumer_user_id: 'c0000000-0000-0000-0000-000000000001', is_active: true, created_at: new Date('2024-01-05').toISOString() },
    { id: 'c2222222-0000-0000-0000-000000000002', name: 'Rajesh Sharma Retail', address: 'Shop #12, Commercial Central Plaza', contact: '+91-98765-43210', email: 'rajesh.sharma@example.com', user_id: 'a0000000-0000-0000-0000-000000000001', consumer_user_id: 'c0000000-0000-0000-0000-000000000002', is_active: true, created_at: new Date('2024-01-10').toISOString() },
    { id: 'c3333333-0000-0000-0000-000000000003', name: 'TechCorp Logistics Inc.', address: 'Plot 88, Industrial Export Zone', contact: '+1-800-555-TECH', email: 'techcorp@example.com', user_id: 'a0000000-0000-0000-0000-000000000001', consumer_user_id: 'c0000000-0000-0000-0000-000000000003', is_active: true, created_at: new Date('2024-01-12').toISOString() },
    { id: 'c4444444-0000-0000-0000-000000000004', name: 'Priya Patel', address: 'Apt 5B, Skyline Residency', contact: '+91-98111-22334', email: 'priya.patel@example.com', user_id: 'a0000000-0000-0000-0000-000000000001', consumer_user_id: null, is_active: true, created_at: new Date('2024-01-15').toISOString() },
    { id: 'c5555555-0000-0000-0000-000000000005', name: 'GreenValley Supermarket', address: '77 Greenway Boulevard', contact: '+1-555-0144', email: 'greenvalley@example.com', user_id: 'a0000000-0000-0000-0000-000000000001', consumer_user_id: null, is_active: true, created_at: new Date('2024-01-18').toISOString() }
  ],
  meters: [
    { id: 'm1111111-0000-0000-0000-000000000001', meter_number: 'MTR-2024-001', consumer_id: 'c1111111-0000-0000-0000-000000000001', installation_date: '2023-01-15', meter_type: 'Smart Meter', meter_status: 'active', tariff_id: '11111111-1111-1111-1111-111111111111', created_at: new Date('2023-01-15').toISOString() },
    { id: 'm2222222-0000-0000-0000-000000000002', meter_number: 'MTR-2024-002', consumer_id: 'c2222222-0000-0000-0000-000000000002', installation_date: '2023-03-20', meter_type: 'Three Phase', meter_status: 'active', tariff_id: '22222222-2222-2222-2222-222222222222', created_at: new Date('2023-03-20').toISOString() },
    { id: 'm3333333-0000-0000-0000-000000000003', meter_number: 'MTR-2024-003', consumer_id: 'c3333333-0000-0000-0000-000000000003', installation_date: '2023-06-10', meter_type: 'Three Phase', meter_status: 'active', tariff_id: '33333333-3333-3333-3333-333333333333', created_at: new Date('2023-06-10').toISOString() },
    { id: 'm4444444-0000-0000-0000-000000000004', meter_number: 'MTR-2024-004', consumer_id: 'c4444444-0000-0000-0000-000000000004', installation_date: '2023-08-05', meter_type: 'Single Phase', meter_status: 'active', tariff_id: '11111111-1111-1111-1111-111111111111', created_at: new Date('2023-08-05').toISOString() },
    { id: 'm5555555-0000-0000-0000-000000000005', meter_number: 'MTR-2024-005', consumer_id: 'c5555555-0000-0000-0000-000000000005', installation_date: '2023-10-12', meter_type: 'Digital', meter_status: 'active', tariff_id: '22222222-2222-2222-2222-222222222222', created_at: new Date('2023-10-12').toISOString() }
  ],
  consumption_readings: [
    { meter_id: 'm1111111-0000-0000-0000-000000000001', reading_date: '2024-01-31', previous_reading: 1000.00, current_reading: 1220.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm1111111-0000-0000-0000-000000000001', reading_date: '2024-02-29', previous_reading: 1220.00, current_reading: 1465.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm1111111-0000-0000-0000-000000000001', reading_date: '2024-03-31', previous_reading: 1465.00, current_reading: 1780.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm1111111-0000-0000-0000-000000000001', reading_date: '2024-04-30', previous_reading: 1780.00, current_reading: 2390.00, created_by: 'a0000000-0000-0000-0000-000000000001' }, // 610 units spike

    { meter_id: 'm2222222-0000-0000-0000-000000000002', reading_date: '2024-01-31', previous_reading: 2500.00, current_reading: 3120.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm2222222-0000-0000-0000-000000000002', reading_date: '2024-02-29', previous_reading: 3120.00, current_reading: 3780.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm2222222-0000-0000-0000-000000000002', reading_date: '2024-03-31', previous_reading: 3780.00, current_reading: 4490.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm2222222-0000-0000-0000-000000000002', reading_date: '2024-04-30', previous_reading: 4490.00, current_reading: 5210.00, created_by: 'a0000000-0000-0000-0000-000000000001' },

    { meter_id: 'm3333333-0000-0000-0000-000000000003', reading_date: '2024-02-29', previous_reading: 10000.00, current_reading: 13400.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm3333333-0000-0000-0000-000000000003', reading_date: '2024-03-31', previous_reading: 13400.00, current_reading: 17100.00, created_by: 'a0000000-0000-0000-0000-000000000001' },
    { meter_id: 'm3333333-0000-0000-0000-000000000003', reading_date: '2024-04-30', previous_reading: 17100.00, current_reading: 20950.00, created_by: 'a0000000-0000-0000-0000-000000000001' }
  ],
  bills: [
    {
      id: 'b1111111-0000-0000-0000-000000000001',
      meter_id: 'm1111111-0000-0000-0000-000000000001',
      reading_date: '2024-01-31',
      bill_date: '2024-02-01',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      units_consumed: 220.00,
      rate_per_unit: 5.50,
      fixed_charge: 85.00,
      tax_amount: 64.75,
      amount: 1359.75,
      due_date: '2024-02-20',
      payment_status: 'paid',
      created_at: new Date('2024-02-01').toISOString()
    },
    {
      id: 'b1111111-0000-0000-0000-000000000002',
      meter_id: 'm1111111-0000-0000-0000-000000000001',
      reading_date: '2024-02-29',
      bill_date: '2024-03-01',
      billing_period_start: '2024-02-01',
      billing_period_end: '2024-02-29',
      units_consumed: 245.00,
      rate_per_unit: 5.50,
      fixed_charge: 85.00,
      tax_amount: 71.63,
      amount: 1504.13,
      due_date: '2024-03-20',
      payment_status: 'paid',
      created_at: new Date('2024-03-01').toISOString()
    },
    {
      id: 'b1111111-0000-0000-0000-000000000003',
      meter_id: 'm1111111-0000-0000-0000-000000000001',
      reading_date: '2024-03-31',
      bill_date: '2024-04-01',
      billing_period_start: '2024-03-01',
      billing_period_end: '2024-03-31',
      units_consumed: 315.00,
      rate_per_unit: 5.50,
      fixed_charge: 85.00,
      tax_amount: 90.88,
      amount: 1908.38,
      due_date: '2024-04-20',
      payment_status: 'partially_paid',
      created_at: new Date('2024-04-01').toISOString()
    },
    {
      id: 'b1111111-0000-0000-0000-000000000004',
      meter_id: 'm1111111-0000-0000-0000-000000000001',
      reading_date: '2024-04-30',
      bill_date: '2024-05-01',
      billing_period_start: '2024-04-01',
      billing_period_end: '2024-04-30',
      units_consumed: 610.00,
      rate_per_unit: 5.50,
      fixed_charge: 85.00,
      tax_amount: 172.00,
      amount: 3612.00,
      due_date: '2024-05-20',
      payment_status: 'unpaid',
      created_at: new Date('2024-05-01').toISOString()
    },
    {
      id: 'b2222222-0000-0000-0000-000000000001',
      meter_id: 'm2222222-0000-0000-0000-000000000002',
      reading_date: '2024-01-31',
      bill_date: '2024-02-01',
      billing_period_start: '2024-01-01',
      billing_period_end: '2024-01-31',
      units_consumed: 620.00,
      rate_per_unit: 9.20,
      fixed_charge: 220.00,
      tax_amount: 710.88,
      amount: 6634.88,
      due_date: '2024-02-20',
      payment_status: 'paid',
      created_at: new Date('2024-02-01').toISOString()
    },
    {
      id: 'b2222222-0000-0000-0000-000000000002',
      meter_id: 'm2222222-0000-0000-0000-000000000002',
      reading_date: '2024-02-29',
      bill_date: '2024-03-01',
      billing_period_start: '2024-02-01',
      billing_period_end: '2024-02-29',
      units_consumed: 660.00,
      rate_per_unit: 9.20,
      fixed_charge: 220.00,
      tax_amount: 755.04,
      amount: 7047.04,
      due_date: '2024-03-20',
      payment_status: 'overdue',
      created_at: new Date('2024-03-01').toISOString()
    }
  ],
  payments: [
    {
      id: 'p1111111-0000-0000-0000-000000000001',
      bill_id: 'b1111111-0000-0000-0000-000000000001',
      payment_date: '2024-02-10T14:30:00.000Z',
      amount: 1359.75,
      payment_mode: 'upi',
      reference_number: 'UPI/20240210/987123',
      recorded_by: 'a0000000-0000-0000-0000-000000000001',
      created_at: '2024-02-10T14:30:00.000Z'
    },
    {
      id: 'p1111111-0000-0000-0000-000000000002',
      bill_id: 'b1111111-0000-0000-0000-000000000002',
      payment_date: '2024-03-12T11:15:00.000Z',
      amount: 1504.13,
      payment_mode: 'card',
      reference_number: 'CARD/TXN-5432-8899',
      recorded_by: 'a0000000-0000-0000-0000-000000000001',
      created_at: '2024-03-12T11:15:00.000Z'
    },
    {
      id: 'p1111111-0000-0000-0000-000000000003',
      bill_id: 'b1111111-0000-0000-0000-000000000003',
      payment_date: '2024-04-15T16:45:00.000Z',
      amount: 1000.00,
      payment_mode: 'bank_transfer',
      reference_number: 'NEFT/20240415/77621',
      recorded_by: 'a0000000-0000-0000-0000-000000000001',
      created_at: '2024-04-15T16:45:00.000Z'
    },
    {
      id: 'p2222222-0000-0000-0000-000000000001',
      bill_id: 'b2222222-0000-0000-0000-000000000001',
      payment_date: '2024-02-18T10:00:00.000Z',
      amount: 6634.88,
      payment_mode: 'bank_transfer',
      reference_number: 'RTGS/20240218/99812',
      recorded_by: 'a0000000-0000-0000-0000-000000000001',
      created_at: '2024-02-18T10:00:00.000Z'
    }
  ],
  alerts: [
    {
      id: 'a1111111-0000-0000-0000-000000000001',
      meter_id: 'm1111111-0000-0000-0000-000000000001',
      reading_date: '2024-04-30',
      bill_id: null,
      alert_date: '2024-05-01T08:00:00.000Z',
      alert_type: 'High Consumption',
      message: 'Monthly consumption of 610.00 kWh exceeded threshold (500 kWh). 93.6% surge compared to previous cycle.',
      severity: 'critical',
      is_read: false,
      created_at: '2024-05-01T08:00:00.000Z'
    },
    {
      id: 'a2222222-0000-0000-0000-000000000002',
      meter_id: 'm2222222-0000-0000-0000-000000000002',
      reading_date: '2024-02-29',
      bill_id: 'b2222222-0000-0000-0000-000000000002',
      alert_date: '2024-03-21T00:05:00.000Z',
      alert_type: 'Overdue Bill',
      message: 'Bill for Rs. 7,047.04 is past its due date (2024-03-20) with Rs. 7,047.04 outstanding balance.',
      severity: 'warning',
      is_read: false,
      created_at: '2024-03-21T00:05:00.000Z'
    }
  ],
  alert_settings: [
    {
      id: 's0000000-0000-0000-0000-000000000001',
      high_consumption_threshold: 500.00,
      percentage_increase_threshold: 50.00,
      overdue_days_threshold: 1,
      is_active: true
    }
  ],
  reports: []
};

// Database Query & Mutation Operations
const db = {
  // Profiles
  async getProfileById(id) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    }
    return memoryStore.profiles.find(p => p.id === id) || null;
  },

  async getProfileByUsername(username) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('username', username).single();
      if (error) return null;
      return data;
    }
    return memoryStore.profiles.find(p => p.username.toLowerCase() === username.toLowerCase()) || null;
  },

  async updateProfile(id, updates) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('profiles').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.profiles.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Profile not found');
    memoryStore.profiles[idx] = { ...memoryStore.profiles[idx], ...updates, updated_at: new Date().toISOString() };
    return memoryStore.profiles[idx];
  },

  // Consumers
  async getConsumers(filters = {}) {
    if (isLiveSupabase) {
      let query = supabaseAdmin.from('consumers').select('*, meters(*)');
      if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
      if (filters.consumer_user_id) query = query.eq('consumer_user_id', filters.consumer_user_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    let list = [...memoryStore.consumers];
    if (filters.is_active !== undefined) list = list.filter(c => c.is_active === filters.is_active);
    if (filters.consumer_user_id) list = list.filter(c => c.consumer_user_id === filters.consumer_user_id);
    return list.map(c => ({
      ...c,
      meters: memoryStore.meters.filter(m => m.consumer_id === c.id)
    }));
  },

  async getConsumerById(id) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('consumers').select('*, meters(*)').eq('id', id).single();
      if (error) return null;
      return data;
    }
    const consumer = memoryStore.consumers.find(c => c.id === id);
    if (!consumer) return null;
    return {
      ...consumer,
      meters: memoryStore.meters.filter(m => m.consumer_id === consumer.id)
    };
  },

  async createConsumer(data) {
    const id = crypto.randomUUID();
    const newConsumer = {
      id,
      name: data.name,
      address: data.address,
      contact: data.contact,
      email: data.email || null,
      user_id: data.user_id,
      consumer_user_id: data.consumer_user_id || null,
      is_active: true,
      created_at: new Date().toISOString()
    };
    if (isLiveSupabase) {
      const { data: created, error } = await supabaseAdmin.from('consumers').insert([newConsumer]).select().single();
      if (error) throw error;
      return created;
    }
    memoryStore.consumers.push(newConsumer);
    return newConsumer;
  },

  async updateConsumer(id, updates) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('consumers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.consumers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Consumer not found');
    memoryStore.consumers[idx] = { ...memoryStore.consumers[idx], ...updates, updated_at: new Date().toISOString() };
    return memoryStore.consumers[idx];
  },

  // Meters
  async getMeters(filters = {}) {
    if (isLiveSupabase) {
      let query = supabaseAdmin.from('meters').select('*, consumers(*), tariffs(*)');
      if (filters.consumer_id) query = query.eq('consumer_id', filters.consumer_id);
      if (filters.meter_status) query = query.eq('meter_status', filters.meter_status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
    let list = [...memoryStore.meters];
    if (filters.consumer_id) list = list.filter(m => m.consumer_id === filters.consumer_id);
    if (filters.meter_status) list = list.filter(m => m.meter_status === filters.meter_status);
    return list.map(m => ({
      ...m,
      consumers: memoryStore.consumers.find(c => c.id === m.consumer_id) || null,
      tariffs: memoryStore.tariffs.find(t => t.id === m.tariff_id) || null
    }));
  },

  async getMeterById(id) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('meters').select('*, consumers(*), tariffs(*)').eq('id', id).single();
      if (error) return null;
      return data;
    }
    const meter = memoryStore.meters.find(m => m.id === id);
    if (!meter) return null;
    return {
      ...meter,
      consumers: memoryStore.consumers.find(c => c.id === meter.consumer_id) || null,
      tariffs: memoryStore.tariffs.find(t => t.id === meter.tariff_id) || null
    };
  },

  async createMeter(data) {
    // Enforce 1:1 rule - Check if consumer already has a meter
    const existingForConsumer = await this.getMeters({ consumer_id: data.consumer_id });
    if (existingForConsumer && existingForConsumer.length > 0) {
      const err = new Error('Constraint Violation: Consumer already has an assigned meter. 1:1 relationship enforced.');
      err.statusCode = 400;
      throw err;
    }

    const id = crypto.randomUUID();
    const newMeter = {
      id,
      meter_number: data.meter_number,
      consumer_id: data.consumer_id,
      installation_date: data.installation_date || new Date().toISOString().split('T')[0],
      meter_type: data.meter_type || 'Smart Meter',
      meter_status: data.meter_status || 'active',
      tariff_id: data.tariff_id,
      created_at: new Date().toISOString()
    };

    if (isLiveSupabase) {
      const { data: created, error } = await supabaseAdmin.from('meters').insert([newMeter]).select().single();
      if (error) throw error;
      return created;
    }
    memoryStore.meters.push(newMeter);
    return newMeter;
  },

  async updateMeter(id, updates) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('meters').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.meters.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Meter not found');
    memoryStore.meters[idx] = { ...memoryStore.meters[idx], ...updates, updated_at: new Date().toISOString() };
    return memoryStore.meters[idx];
  },

  // Tariffs
  async getTariffs() {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('tariffs').select('*').order('name');
      if (error) throw error;
      return data;
    }
    return [...memoryStore.tariffs];
  },

  async getTariffById(id) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('tariffs').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    }
    return memoryStore.tariffs.find(t => t.id === id) || null;
  },

  async createTariff(data) {
    const id = crypto.randomUUID();
    const newTariff = {
      id,
      name: data.name,
      description: data.description || '',
      rate_per_unit: Number(data.rate_per_unit),
      fixed_charge: Number(data.fixed_charge || 0),
      tax_percentage: Number(data.tax_percentage || 5),
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString()
    };
    if (isLiveSupabase) {
      const { data: created, error } = await supabaseAdmin.from('tariffs').insert([newTariff]).select().single();
      if (error) throw error;
      return created;
    }
    memoryStore.tariffs.push(newTariff);
    return newTariff;
  },

  async updateTariff(id, updates) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('tariffs').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.tariffs.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tariff not found');
    memoryStore.tariffs[idx] = { ...memoryStore.tariffs[idx], ...updates, updated_at: new Date().toISOString() };
    return memoryStore.tariffs[idx];
  },

  // Consumption Readings
  async getConsumptionReadings(filters = {}) {
    if (isLiveSupabase) {
      let query = supabaseAdmin.from('v_consumption_readings').select('*').order('reading_date', { ascending: false });
      if (filters.meter_id) query = query.eq('meter_id', filters.meter_id);
      if (filters.consumer_id) query = query.eq('consumer_id', filters.consumer_id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let list = [...memoryStore.consumption_readings];
    if (filters.meter_id) list = list.filter(r => r.meter_id === filters.meter_id);
    
    // Sort descending by reading_date
    list.sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));

    return list.map(r => {
      const meter = memoryStore.meters.find(m => m.id === r.meter_id);
      const consumer = meter ? memoryStore.consumers.find(c => c.id === meter.consumer_id) : null;
      const tariff = meter ? memoryStore.tariffs.find(t => t.id === meter.tariff_id) : null;
      return {
        ...r,
        meter_number: meter ? meter.meter_number : '',
        consumer_id: consumer ? consumer.id : '',
        consumer_name: consumer ? consumer.name : '',
        tariff_id: tariff ? tariff.id : '',
        tariff_name: tariff ? tariff.name : '',
        rate_per_unit: tariff ? tariff.rate_per_unit : 0,
        units_consumed: Number((r.current_reading - r.previous_reading).toFixed(2))
      };
    }).filter(r => !filters.consumer_id || r.consumer_id === filters.consumer_id);
  },

  async getReadingByKey(meter_id, reading_date) {
    const list = await this.getConsumptionReadings({ meter_id });
    return list.find(r => r.reading_date === reading_date) || null;
  },

  async createConsumptionReading(data) {
    const { meter_id, reading_date, previous_reading, current_reading, created_by } = data;

    // Numerical validation
    if (current_reading < previous_reading) {
      const err = new Error('Validation Error: Current reading cannot be lower than previous reading');
      err.statusCode = 400;
      throw err;
    }

    // Chronological validation against existing readings for this meter
    const existing = await this.getConsumptionReadings({ meter_id });
    
    // Check if duplicate for same date exists
    if (existing.some(r => r.reading_date === reading_date)) {
      const err = new Error(`Constraint Violation: A reading already exists for meter on date ${reading_date}`);
      err.statusCode = 400;
      throw err;
    }

    // Predecessor check: latest reading before this date
    const predecessors = existing.filter(r => r.reading_date < reading_date).sort((a, b) => new Date(b.reading_date) - new Date(a.reading_date));
    if (predecessors.length > 0) {
      const lastPrior = predecessors[0];
      if (previous_reading < lastPrior.current_reading) {
        const err = new Error(`Chronological Inconsistency: Previous reading (${previous_reading}) is less than prior recorded reading (${lastPrior.current_reading})`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Successor check: earliest reading after this date
    const successors = existing.filter(r => r.reading_date > reading_date).sort((a, b) => new Date(a.reading_date) - new Date(b.reading_date));
    if (successors.length > 0) {
      const firstNext = successors[0];
      if (current_reading > firstNext.previous_reading) {
        const err = new Error(`Chronological Inconsistency: Current reading (${current_reading}) exceeds subsequent reading start (${firstNext.previous_reading})`);
        err.statusCode = 400;
        throw err;
      }
    }

    const newReading = {
      meter_id,
      reading_date,
      previous_reading: Number(previous_reading),
      current_reading: Number(current_reading),
      created_by: created_by || null,
      created_at: new Date().toISOString()
    };

    if (isLiveSupabase) {
      const { data: created, error } = await supabaseAdmin.from('consumption_readings').insert([newReading]).select().single();
      if (error) throw error;
      return { ...created, units_consumed: Number((created.current_reading - created.previous_reading).toFixed(2)) };
    }

    memoryStore.consumption_readings.push(newReading);
    return {
      ...newReading,
      units_consumed: Number((newReading.current_reading - newReading.previous_reading).toFixed(2))
    };
  },

  // Bills
  async getBills(filters = {}) {
    let list = [];
    if (isLiveSupabase) {
      let query = supabaseAdmin.from('bills').select('*, meters(*, consumers(*)), payments(*)').order('bill_date', { ascending: false });
      if (filters.payment_status) query = query.eq('payment_status', filters.payment_status);
      if (filters.meter_id) query = query.eq('meter_id', filters.meter_id);
      const { data, error } = await query;
      if (error) throw error;
      list = data;
    } else {
      list = memoryStore.bills.map(b => {
        const meter = memoryStore.meters.find(m => m.id === b.meter_id);
        const consumer = meter ? memoryStore.consumers.find(c => c.id === meter.consumer_id) : null;
        const payments = memoryStore.payments.filter(p => p.bill_id === b.id);
        return {
          ...b,
          meters: meter ? { ...meter, consumers: consumer } : null,
          payments
        };
      });

      if (filters.payment_status) list = list.filter(b => b.payment_status === filters.payment_status);
      if (filters.meter_id) list = list.filter(b => b.meter_id === filters.meter_id);
      list.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));
    }

    // Attach total paid & outstanding balance
    return list.map(b => {
      const payments = b.payments || [];
      const total_paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const outstanding_balance = Math.max(0, Number((Number(b.amount) - total_paid).toFixed(2)));
      return {
        ...b,
        total_paid: Number(total_paid.toFixed(2)),
        outstanding_balance
      };
    }).filter(b => {
      if (!filters.consumer_id) return true;
      return b.meters?.consumer_id === filters.consumer_id || b.meters?.consumers?.id === filters.consumer_id;
    });
  },

  async getBillById(id) {
    const bills = await this.getBills();
    return bills.find(b => b.id === id) || null;
  },

  async createBill(billData) {
    // Check if bill for this (meter_id, reading_date) already exists
    const existing = await this.getBills({ meter_id: billData.meter_id });
    if (existing.some(b => b.reading_date === billData.reading_date)) {
      const err = new Error(`Billing Error: A bill has already been generated for this meter on reading date ${billData.reading_date}`);
      err.statusCode = 400;
      throw err;
    }

    const id = crypto.randomUUID();
    const newBill = {
      id,
      meter_id: billData.meter_id,
      reading_date: billData.reading_date,
      bill_date: billData.bill_date || new Date().toISOString().split('T')[0],
      billing_period_start: billData.billing_period_start,
      billing_period_end: billData.billing_period_end,
      units_consumed: Number(billData.units_consumed),
      rate_per_unit: Number(billData.rate_per_unit),
      fixed_charge: Number(billData.fixed_charge),
      tax_amount: Number(billData.tax_amount),
      amount: Number(billData.amount),
      due_date: billData.due_date,
      payment_status: 'unpaid',
      created_at: new Date().toISOString()
    };

    if (isLiveSupabase) {
      const { data: created, error } = await supabaseAdmin.from('bills').insert([newBill]).select().single();
      if (error) throw error;
      return created;
    }

    memoryStore.bills.push(newBill);
    return newBill;
  },

  // Payments & Transaction
  async recordPayment(paymentData) {
    const { bill_id, amount, payment_mode, reference_number, recorded_by } = paymentData;
    const numAmount = Number(amount);

    if (numAmount <= 0) {
      const err = new Error('Validation Error: Payment amount must be strictly greater than zero');
      err.statusCode = 400;
      throw err;
    }

    const bill = await this.getBillById(bill_id);
    if (!bill) {
      const err = new Error(`Bill not found with ID ${bill_id}`);
      err.statusCode = 404;
      throw err;
    }

    if (numAmount > bill.outstanding_balance) {
      const err = new Error(`Validation Error: Payment amount (₹${numAmount}) exceeds outstanding balance (₹${bill.outstanding_balance})`);
      err.statusCode = 400;
      throw err;
    }

    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.rpc('record_payment_transaction', {
        p_bill_id: bill_id,
        p_amount: numAmount,
        p_payment_mode: payment_mode,
        p_reference_number: reference_number || `REF-${Date.now()}`,
        p_recorded_by: recorded_by || null
      });
      if (error) throw error;
      return data;
    }

    // In-memory atomic transaction simulation
    const paymentId = crypto.randomUUID();
    const newPayment = {
      id: paymentId,
      bill_id,
      payment_date: new Date().toISOString(),
      amount: numAmount,
      payment_mode,
      reference_number: reference_number || `TXN-${Date.now()}`,
      recorded_by: recorded_by || null,
      created_at: new Date().toISOString()
    };
    memoryStore.payments.push(newPayment);

    const newTotal = bill.total_paid + numAmount;
    const newStatus = newTotal >= bill.amount ? 'paid' : 'partially_paid';

    const bIdx = memoryStore.bills.findIndex(b => b.id === bill_id);
    if (bIdx !== -1) {
      memoryStore.bills[bIdx].payment_status = newStatus;
    }

    return {
      payment_id: paymentId,
      bill_id,
      amount_paid: numAmount,
      total_paid: newTotal,
      remaining_balance: Number((bill.amount - newTotal).toFixed(2)),
      payment_status: newStatus
    };
  },

  async getPayments(filters = {}) {
    if (isLiveSupabase) {
      let query = supabaseAdmin.from('payments').select('*, bills(*, meters(*, consumers(*)))').order('payment_date', { ascending: false });
      if (filters.bill_id) query = query.eq('bill_id', filters.bill_id);
      if (filters.payment_mode) query = query.eq('payment_mode', filters.payment_mode);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let list = memoryStore.payments.map(p => {
      const bill = memoryStore.bills.find(b => b.id === p.bill_id);
      const meter = bill ? memoryStore.meters.find(m => m.id === bill.meter_id) : null;
      const consumer = meter ? memoryStore.consumers.find(c => c.id === meter.consumer_id) : null;
      return {
        ...p,
        bills: bill ? { ...bill, meters: meter ? { ...meter, consumers: consumer } : null } : null
      };
    });

    if (filters.bill_id) list = list.filter(p => p.bill_id === filters.bill_id);
    if (filters.payment_mode) list = list.filter(p => p.payment_mode === filters.payment_mode);
    list.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    return list;
  },

  // Alerts
  async getAlerts(filters = {}) {
    if (isLiveSupabase) {
      let query = supabaseAdmin.from('alerts').select('*, meters(*, consumers(*))').order('alert_date', { ascending: false });
      if (filters.is_read !== undefined) query = query.eq('is_read', filters.is_read);
      if (filters.severity) query = query.eq('severity', filters.severity);
      if (filters.alert_type) query = query.eq('alert_type', filters.alert_type);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    let list = memoryStore.alerts.map(a => {
      const meter = memoryStore.meters.find(m => m.id === a.meter_id);
      const consumer = meter ? memoryStore.consumers.find(c => c.id === meter.consumer_id) : null;
      return {
        ...a,
        meters: meter ? { ...meter, consumers: consumer } : null
      };
    });

    if (filters.is_read !== undefined) list = list.filter(a => a.is_read === filters.is_read);
    if (filters.severity) list = list.filter(a => a.severity === filters.severity);
    if (filters.alert_type) list = list.filter(a => a.alert_type === filters.alert_type);
    list.sort((a, b) => new Date(b.alert_date) - new Date(a.alert_date));
    return list;
  },

  async markAlertAsRead(id) {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('alerts').update({ is_read: true }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.alerts.findIndex(a => a.id === id);
    if (idx !== -1) {
      memoryStore.alerts[idx].is_read = true;
      return memoryStore.alerts[idx];
    }
    return null;
  },

  async markAllAlertsRead() {
    if (isLiveSupabase) {
      const { error } = await supabaseAdmin.from('alerts').update({ is_read: true }).eq('is_read', false);
      if (error) throw error;
      return true;
    }
    memoryStore.alerts.forEach(a => { a.is_read = true; });
    return true;
  },

  async createAlert(alertData) {
    // Avoid duplicate alerts for same (meter_id, reading_date, alert_type)
    const existing = memoryStore.alerts.find(
      a => a.meter_id === alertData.meter_id && a.reading_date === alertData.reading_date && a.alert_type === alertData.alert_type
    );
    if (existing) return existing;

    const id = crypto.randomUUID();
    const newAlert = {
      id,
      meter_id: alertData.meter_id,
      reading_date: alertData.reading_date || null,
      bill_id: alertData.bill_id || null,
      alert_date: new Date().toISOString(),
      alert_type: alertData.alert_type,
      message: alertData.message,
      severity: alertData.severity || 'warning',
      is_read: false,
      created_at: new Date().toISOString()
    };

    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('alerts').insert([newAlert]).select().single();
      if (error) throw error;
      return data;
    }

    memoryStore.alerts.push(newAlert);
    return newAlert;
  },

  // Alert Settings
  async getAlertSettings() {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('alert_settings').select('*').limit(1).single();
      if (error) return memoryStore.alert_settings[0];
      return data;
    }
    return memoryStore.alert_settings[0];
  },

  async updateAlertSettings(updates) {
    if (isLiveSupabase) {
      const current = await this.getAlertSettings();
      const { data, error } = await supabaseAdmin.from('alert_settings').update(updates).eq('id', current.id).select().single();
      if (error) throw error;
      return data;
    }
    memoryStore.alert_settings[0] = { ...memoryStore.alert_settings[0], ...updates, updated_at: new Date().toISOString() };
    return memoryStore.alert_settings[0];
  },

  // Reports
  async saveReport(reportData) {
    const id = crypto.randomUUID();
    const newReport = {
      id,
      report_date: new Date().toISOString(),
      report_type: reportData.report_type,
      generated_by: reportData.generated_by || null,
      filters: reportData.filters || {},
      summary_data: reportData.summary_data || {},
      created_at: new Date().toISOString()
    };
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('reports').insert([newReport]).select().single();
      if (error) throw error;
      return data;
    }
    memoryStore.reports.unshift(newReport);
    return newReport;
  },

  async getReports() {
    if (isLiveSupabase) {
      const { data, error } = await supabaseAdmin.from('reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
    return [...memoryStore.reports];
  }
};

module.exports = db;
