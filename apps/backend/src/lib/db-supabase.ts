// Supabase database operations
// This file provides Supabase-based database operations for write operations
// while the mock database handles read operations temporarily

import type { Context } from 'hono';
import { getSupabaseClient } from './supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const createUser = async (c: Context, data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  patientProfile?: {
    gender: string;
    dateOfBirth: Date;
    city: string;
    state: string;
    associationId?: string;
    groupId?: string;
  };
  donorProfile?: {
    organizationName?: string;
    country?: string;
  };
}) => {
  const supabase = getSupabaseClient(c);
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  // Insert user
  const { data: user, error: userError } = await supabase
    .from('User')
    .insert({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      passwordHash: hashedPassword,
    })
    .select()
    .single();
    
  if (userError) throw userError;
  
  // Insert patient profile if provided
  if (data.patientProfile) {
    const { error: profileError } = await supabase
      .from('PatientProfile')
      .insert({
        userId: user.id,
        gender: data.patientProfile.gender,
        dateOfBirth: data.patientProfile.dateOfBirth.toISOString(),
        city: data.patientProfile.city,
        state: data.patientProfile.state,
        associationId: data.patientProfile.associationId || null,
        groupId: data.patientProfile.groupId || null,
      });
      
    if (profileError) throw profileError;
  }
  
  // Insert donor profile if provided
  if (data.donorProfile) {
    const { error: profileError } = await supabase
      .from('DonorProfile')
      .insert({
        userId: user.id,
        organizationName: data.donorProfile.organizationName,
        country: data.donorProfile.country,
      });
      
    if (profileError) throw profileError;
  }
  
  return user;
};

export const createEmailVerificationToken = async (c: Context, data: {
  userId: string;
  profileType: string;
}) => {
  const supabase = getSupabaseClient(c);
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  
  const { error } = await supabase
    .from('EmailVerificationToken')
    .insert({
      userId: data.userId,
      token,
      profileType: data.profileType,
      expiresAt: expiresAt.toISOString(),
    });
    
  if (error) throw error;
  
  return token;
};

export const findUserByEmail = async (c: Context, email: string) => {
  const supabase = getSupabaseClient(c);
  
  const { data: user, error } = await supabase
    .from('User')
    .select(`
      *,
      patientProfile:PatientProfile(*),
      donorProfile:DonorProfile(*)
    `)
    .eq('email', email)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  
  return user;
};

export const findCenterByEmail = async (c: Context, email: string) => {
  const supabase = getSupabaseClient(c);
  
  const { data: center, error } = await supabase
    .from('ServiceCenter')
    .select('*')
    .eq('email', email)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  
  return center;
};

export const createCenter = async (c: Context, data: {
  email: string;
  passwordHash: string;
  centerName: string;
  address: string;
  state: string;
  lga: string;
  phone?: string;
  services: string[]; // Array of screening type IDs
}) => {
  const supabase = getSupabaseClient(c);
  
  // Insert center
  const { data: center, error: centerError } = await supabase
    .from('ServiceCenter')
    .insert({
      email: data.email,
      passwordHash: data.passwordHash,
      centerName: data.centerName,
      address: data.address,
      state: data.state,
      lga: data.lga,
      phone: data.phone,
      status: 'PENDING',
    })
    .select()
    .single();
    
  if (centerError) throw centerError;
  
  // Link screening types
  if (data.services && data.services.length > 0) {
    const serviceCenterScreeningTypes = data.services.map(screeningTypeId => ({
      centerId: center.id,
      screeningTypeId,
      amount: 10000.0, // Default amount
    }));
    
    const { error: servicesError } = await supabase
      .from('ServiceCenterScreeningType')
      .insert(serviceCenterScreeningTypes);
      
    if (servicesError) throw servicesError;
  }
  
  return center;
};
