// Database adapter that provides a Prisma-like API using Supabase
// This allows gradual migration from mock database to Supabase

import type { Context } from 'hono';
import { getSupabaseClient } from './supabase';

export const getDB = (c: Context) => {
  const supabase = getSupabaseClient(c);
  
  return {
    // Admin operations
    admins: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        let query = supabase.from('Admins').select('*');
        
        if (where.email) query = query.eq('email', where.email);
        if (where.id) query = query.eq('id', where.id);
        
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      count: async () => {
        const { count, error } = await supabase
          .from('Admins')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
      },
    },
    
    // Service Center operations
    serviceCenter: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        let query = supabase.from('ServiceCenter').select('*');
        
        if (where.email) query = query.eq('email', where.email);
        if (where.id) query = query.eq('id', where.id);
        
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      
      findMany: async ({ where, skip, take, orderBy, include }: any = {}) => {
        let query = supabase.from('ServiceCenter').select('*');
        
        // Apply filters
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.state) query = query.eq('state', where.state);
          if (where.lga) query = query.eq('lga', where.lga);
          if (where.OR && Array.isArray(where.OR)) {
            const searchTerm = where.OR[0]?.centerName?.contains;
            if (searchTerm) {
              query = query.or(`centerName.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
            }
          }
        }
        
        // Apply pagination
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Add empty arrays for includes
        return (data || []).map(center => ({
          ...center,
          services: [],
          staff: [],
        }));
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('ServiceCenter').select('*', { count: 'exact', head: true });
        
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.state) query = query.eq('state', where.state);
          if (where.lga) query = query.eq('lga', where.lga);
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
      
      create: async ({ data, include }: any) => {
        const { data: center, error } = await supabase
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
          
        if (error) throw error;
        
        // Link screening types if provided
        if (data.services?.connect && Array.isArray(data.services.connect)) {
          const serviceLinks = data.services.connect.map((s: any) => ({
            centerId: center.id,
            screeningTypeId: s.id,
            amount: 10000.0,
          }));
          
          await supabase.from('ServiceCenterScreeningType').insert(serviceLinks);
        }
        
        return center;
      },
    },
    
    // User operations
    user: {
      findUnique: async ({ where, include }: { where: { email?: string; id?: string }, include?: any }) => {
        // Build select query based on includes
        let selectQuery = '*';
        if (include?.patientProfile || include?.donorProfile) {
          selectQuery = `
            *,
            patientProfile:PatientProfile(*),
            donorProfile:DonorProfile(*)
          `;
        }
        
        let query = supabase.from('User').select(selectQuery);
        
        if (where.email) query = query.eq('email', where.email);
        if (where.id) query = query.eq('id', where.id);
        
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        
        // Handle the case where profiles are returned as arrays (Supabase behavior)
        if (data) {
          if (Array.isArray(data.patientProfile)) {
            data.patientProfile = data.patientProfile[0] || null;
          }
          if (Array.isArray(data.donorProfile)) {
            data.donorProfile = data.donorProfile[0] || null;
          }
        }
        
        return data;
      },
      
      count: async () => {
        const { count, error } = await supabase
          .from('User')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
      },
      
      create: async ({ data, include }: any) => {
        const { data: user, error: userError } = await supabase
          .from('User')
          .insert({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            passwordHash: data.passwordHash,
          })
          .select()
          .single();
          
        if (userError) throw userError;
        
        // Create patient profile if provided
        if (data.patientProfile?.create) {
          const dob = data.patientProfile.create.dateOfBirth;
          const dobString = dob instanceof Date ? dob.toISOString() : new Date(dob).toISOString();
          
          const { data: profile, error: profileError } = await supabase
            .from('PatientProfile')
            .insert({
              userId: user.id,
              gender: data.patientProfile.create.gender,
              dateOfBirth: dobString,
              city: data.patientProfile.create.city,
              state: data.patientProfile.create.state,
              associationId: data.patientProfile.create.associationId || null,
              groupId: data.patientProfile.create.groupId || null,
            })
            .select()
            .single();
            
          if (profileError) throw profileError;
          user.patientProfile = profile;
        }
        
        // Create donor profile if provided
        if (data.donorProfile?.create) {
          const { data: profile, error: profileError } = await supabase
            .from('DonorProfile')
            .insert({
              userId: user.id,
              organizationName: data.donorProfile.create.organizationName,
              country: data.donorProfile.create.country,
            })
            .select()
            .single();
            
          if (profileError) throw profileError;
          user.donorProfile = profile;
        }
        
        return user;
      },
      
      update: async ({ where, data, include }: any) => {
        // Update user basic fields
        const updates: any = {};
        if (data.fullName) updates.fullName = data.fullName;
        if (data.email) updates.email = data.email;
        if (data.passwordHash) updates.passwordHash = data.passwordHash;
        
        let query = supabase.from('User').update(updates);
        
        if (where.id) query = query.eq('id', where.id);
        if (where.email) query = query.eq('email', where.email);
        
        const { data: user, error } = await query.select().single();
        if (error) throw error;
        
        // Create patient profile if provided
        if (data.patientProfile?.create) {
          const dob = data.patientProfile.create.dateOfBirth;
          const dobString = dob instanceof Date ? dob.toISOString() : new Date(dob).toISOString();
          
          const { data: profile, error: profileError } = await supabase
            .from('PatientProfile')
            .insert({
              userId: user.id,
              gender: data.patientProfile.create.gender,
              dateOfBirth: dobString,
              city: data.patientProfile.create.city,
              state: data.patientProfile.create.state,
              associationId: data.patientProfile.create.associationId || null,
              groupId: data.patientProfile.create.groupId || null,
            })
            .select()
            .single();
            
          if (profileError) throw profileError;
          user.patientProfile = profile;
        }
        
        return user;
      },
    },
    
    // Email verification token operations
    emailVerificationToken: {
      create: async ({ data }: any) => {
        const { data: token, error } = await supabase
          .from('EmailVerificationToken')
          .insert({
            userId: data.userId,
            token: data.token,
            profileType: data.profileType,
            expiresAt: new Date(data.expiresAt).toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        return token;
      },
      
      findUnique: async ({ where }: any) => {
        const { data, error } = await supabase
          .from('EmailVerificationToken')
          .select('*')
          .eq('token', where.token)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      
      delete: async ({ where }: any) => {
        const { error } = await supabase
          .from('EmailVerificationToken')
          .delete()
          .eq('token', where.token);
          
        if (error) throw error;
        return { id: 'deleted' };
      },
    },
    
    // Patient profile operations
    patientProfile: {
      findUnique: async ({ where }: any) => {
        const { data, error } = await supabase
          .from('PatientProfile')
          .select('*')
          .eq('userId', where.userId)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    },
    
    // Donor profile operations
    donorProfile: {
      findUnique: async ({ where }: any) => {
        const { data, error } = await supabase
          .from('DonorProfile')
          .select('*')
          .eq('userId', where.userId)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    },
    
    // Screening type operations
    screeningType: {
      findMany: async ({ where, skip, take, orderBy, select }: any = {}) => {
        let query = supabase.from('ScreeningType').select('*');
        
        if (where) {
          if (where.active !== undefined) query = query.eq('active', where.active);
          if (where.screeningTypeCategoryId) query = query.eq('screeningTypeCategoryId', where.screeningTypeCategoryId);
          if (where.name?.contains) query = query.ilike('name', `%${where.name.contains}%`);
        }
        
        if (orderBy?.name === 'asc') query = query.order('name', { ascending: true });
        
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      
      findUnique: async ({ where }: { where: { id?: string } }) => {
        const { data, error } = await supabase
          .from('ScreeningType')
          .select('*')
          .eq('id', where.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      
      findFirst: async ({ where }: { where: { name?: string } }) => {
        const { data, error } = await supabase
          .from('ScreeningType')
          .select('*')
          .eq('name', where.name)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('ScreeningType').select('*', { count: 'exact', head: true });
        
        if (where) {
          if (where.active !== undefined) query = query.eq('active', where.active);
          if (where.screeningTypeCategoryId) query = query.eq('screeningTypeCategoryId', where.screeningTypeCategoryId);
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
    },
    
    // Screening type category operations
    screeningTypeCategory: {
      findMany: async ({ select, orderBy }: any = {}) => {
        let query = supabase.from('ScreeningTypeCategory').select('*');
        
        if (orderBy?.name === 'asc') query = query.order('name', { ascending: true });
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      
      findUnique: async ({ where }: { where: { id?: string } }) => {
        const { data, error } = await supabase
          .from('ScreeningTypeCategory')
          .select('*')
          .eq('id', where.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    },
    
    // Center staff operations
    centerStaff: {
      create: async ({ data }: any) => {
        const { data: staff, error } = await supabase
          .from('CenterStaff')
          .insert({
            centerId: data.centerId,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
          })
          .select()
          .single();
          
        if (error) throw error;
        return staff;
      },
      
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        let query = supabase.from('CenterStaff').select('*');
        
        if (where.email) query = query.eq('email', where.email);
        if (where.id) query = query.eq('id', where.id);
        
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    },
    
    // ServiceCenterScreeningType operations
    serviceCenterScreeningType: {
      findUnique: async ({ where }: any) => {
        const { data, error } = await supabase
          .from('ServiceCenterScreeningType')
          .select('*')
          .eq('centerId', where.centerId_screeningTypeId.centerId)
          .eq('screeningTypeId', where.centerId_screeningTypeId.screeningTypeId)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    },
    
    // Waitlist operations
    waitlist: {
      findMany: async ({ where, skip, take, include, orderBy }: any = {}) => {
        let query = supabase.from('Waitlist').select('*');
        
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.screeningTypeId) query = query.eq('screeningTypeId', where.screeningTypeId);
          if (where.patientId) query = query.eq('patientId', where.patientId);
        }
        
        if (orderBy) {
          if (orderBy.joinedAt) query = query.order('joinedAt', { ascending: orderBy.joinedAt === 'asc' });
        }
        
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Return empty arrays for includes (would need joins for real data)
        return (data || []).map(w => ({
          ...w,
          screening: include?.screening ? {} : undefined,
          patient: include?.patient ? {} : undefined,
        }));
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('Waitlist').select('*', { count: 'exact', head: true });
        
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.screeningTypeId) query = query.eq('screeningTypeId', where.screeningTypeId);
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
    },
    
    // Appointment operations
    appointment: {
      findMany: async ({ where, skip, take, include, orderBy }: any = {}) => {
        let query = supabase.from('Appointment').select('*');
        
        if (where) {
          if (where.centerId) query = query.eq('centerId', where.centerId);
          if (where.patientId) query = query.eq('patientId', where.patientId);
          if (where.status) query = query.eq('status', where.status);
          if (where.screeningTypeId) query = query.eq('screeningTypeId', where.screeningTypeId);
        }
        
        if (orderBy) {
          if (orderBy.createdAt) query = query.order('createdAt', { ascending: orderBy.createdAt === 'asc' });
          if (orderBy.appointmentDateTime) query = query.order('appointmentDateTime', { ascending: orderBy.appointmentDateTime === 'asc' });
        }
        
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Return empty objects for includes
        return (data || []).map(a => ({
          ...a,
          patient: include?.patient ? {} : undefined,
          center: include?.center ? {} : undefined,
          screeningType: include?.screeningType ? {} : undefined,
          transaction: include?.transaction ? {} : undefined,
        }));
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('Appointment').select('*', { count: 'exact', head: true });
        
        if (where) {
          if (where.centerId) query = query.eq('centerId', where.centerId);
          if (where.patientId) query = query.eq('patientId', where.patientId);
          if (where.status) query = query.eq('status', where.status);
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
      
      findUnique: async ({ where, include }: any) => {
        const { data, error } = await supabase
          .from('Appointment')
          .select('*')
          .eq('id', where.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    },
    
    // Notification operations
    notificationRecipient: {
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let query = supabase.from('NotificationRecipient').select('*');
        
        if (where?.userId) query = query.eq('userId', where.userId);
        
        if (orderBy) {
          // Handle orderBy if needed
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Return empty objects for includes
        return (data || []).map(nr => ({
          ...nr,
          notification: include?.notification ? {} : undefined,
        }));
      },
    },
  };
};

export type TDB = ReturnType<typeof getDB>;
