// Database adapter that provides a Prisma-like API using Supabase
// This allows gradual migration from mock database to Supabase

import type { Context } from 'hono';
import { getSupabaseClient } from './supabase';

type SupabaseClient = ReturnType<typeof getSupabaseClient>;

const parseJsonArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

async function enrichDonationCampaign(
  supabase: SupabaseClient,
  campaign: Record<string, unknown>,
  include?: Record<string, unknown>,
) {
  const result: Record<string, unknown> = {
    ...campaign,
    targetStates: parseJsonArray(campaign.targetStates),
    targetLgas: parseJsonArray(campaign.targetLgas),
    createdAt: new Date(String(campaign.createdAt)),
    updatedAt: new Date(String(campaign.updatedAt || campaign.createdAt)),
  };

  if (include?.donor) {
    const { data: donor } = await supabase
      .from('User')
      .select('id, fullName, email')
      .eq('id', campaign.donorId as string)
      .single();
    if (donor) {
      const donorInclude = include.donor as { select?: { donorProfile?: unknown } };
      if (donorInclude.select?.donorProfile) {
        const { data: donorProfile } = await supabase
          .from('DonorProfile')
          .select('*')
          .eq('userId', donor.id)
          .maybeSingle();
        (donor as Record<string, unknown>).donorProfile = donorProfile;
      }
      result.donor = donor;
    }
  }

  if (include?.screeningTypes) {
    const { data: links } = await supabase
      .from('_DonationCampaignScreeningTypes')
      .select('B')
      .eq('A', campaign.id as string);
    const ids = (links || []).map((l: { B: string }) => l.B);
    if (ids.length) {
      const screeningInclude = include.screeningTypes as { select?: Record<string, boolean> };
      const columns = screeningInclude.select
        ? Object.keys(screeningInclude.select).join(',')
        : '*';
      const { data: types } = await supabase
        .from('ScreeningType')
        .select(columns)
        .in('id', ids);
      result.screeningTypes = types || [];
    } else {
      result.screeningTypes = [];
    }
  }

  if (include?.allocations) {
    const { data: allocations } = await supabase
      .from('DonationAllocation')
      .select('*')
      .eq('campaignId', campaign.id as string);
    const allocInclude = include.allocations as {
      include?: {
        patient?: { select?: Record<string, boolean> };
        appointment?: { where?: { status?: { notIn?: string[] } } };
      };
    };

    result.allocations = await Promise.all(
      (allocations || []).map(async (alloc: Record<string, unknown>) => {
        const enriched: Record<string, unknown> = { ...alloc };
        if (allocInclude.include?.patient) {
          const { data: patient } = await supabase
            .from('User')
            .select('id, fullName')
            .eq('id', alloc.patientId as string)
            .maybeSingle();
          enriched.patient = patient;
        }
        if (allocInclude.include?.appointment) {
          if (alloc.appointmentId) {
            const { data: appointment } = await supabase
              .from('Appointment')
              .select('*')
              .eq('id', alloc.appointmentId as string)
              .maybeSingle();
            const notIn = allocInclude.include.appointment.where?.status?.notIn;
            if (
              appointment &&
              notIn?.length &&
              notIn.includes(appointment.status as string)
            ) {
              enriched.appointment = null;
            } else {
              enriched.appointment = appointment;
            }
          } else {
            enriched.appointment = null;
          }
        }
        return enriched;
      }),
    );
  }

  return result;
}

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
        const serviceTypeFilter = where?.screeningTypes?.some?.screeningType?.OR;
        let matchingCenterIds: string[] | undefined;

        if (Array.isArray(serviceTypeFilter)) {
          const categoryIds = serviceTypeFilter
            .map((filter: any) => filter.screeningTypeCategoryId?.in)
            .flat()
            .filter(Boolean);
          const terms = serviceTypeFilter
            .map((filter: any) => filter.name?.contains || filter.category?.name?.contains)
            .filter(Boolean)
            .map((term: string) => term.toLowerCase());

          const { data: screeningTypes, error: screeningTypesError } = await supabase
            .from('ScreeningType')
            .select('id,name,screeningTypeCategoryId');

          if (screeningTypesError) throw screeningTypesError;

          const matchingScreeningTypeIds = (screeningTypes || [])
            .filter((screeningType: any) => {
              const name = String(screeningType.name || '').toLowerCase();
              return (
                categoryIds.includes(screeningType.screeningTypeCategoryId) ||
                terms.some((term: string) => name.includes(term))
              );
            })
            .map((screeningType: any) => screeningType.id);

          if (matchingScreeningTypeIds.length === 0) {
            matchingCenterIds = [];
          } else {
            const { data: links, error: linksError } = await supabase
              .from('ServiceCenterScreeningType')
              .select('centerId')
              .in('screeningTypeId', matchingScreeningTypeIds);

            if (linksError) throw linksError;
            matchingCenterIds = [...new Set((links || []).map((link: any) => link.centerId))];
          }
        }
        
        // Apply filters
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.state) query = query.eq('state', where.state);
          if (where.lga) query = query.eq('lga', where.lga);
          if (matchingCenterIds) {
            query = matchingCenterIds.length > 0
              ? query.in('id', matchingCenterIds)
              : query.eq('id', '__no_matching_centers__');
          }
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

        const centerIds = (data || []).map((center: any) => center.id);
        let servicesByCenter = new Map<string, any[]>();

        if (centerIds.length > 0) {
          const { data: serviceLinks, error: serviceLinksError } = await supabase
            .from('ServiceCenterScreeningType')
            .select('*')
            .in('centerId', centerIds);

          if (serviceLinksError) throw serviceLinksError;

          const screeningTypeIds = [
            ...new Set((serviceLinks || []).map((link: any) => link.screeningTypeId)),
          ];

          const { data: screeningTypes, error: screeningTypesError } = screeningTypeIds.length > 0
            ? await supabase.from('ScreeningType').select('id,name').in('id', screeningTypeIds)
            : { data: [], error: null };

          if (screeningTypesError) throw screeningTypesError;

          const screeningTypesById = new Map(
            (screeningTypes || []).map((screeningType: any) => [screeningType.id, screeningType])
          );

          servicesByCenter = (serviceLinks || []).reduce((acc: Map<string, any[]>, link: any) => {
            const screeningType = screeningTypesById.get(link.screeningTypeId);
            if (!screeningType) return acc;

            const centerServices = acc.get(link.centerId) || [];
            centerServices.push({
              id: screeningType.id,
              name: screeningType.name,
              price: link.amount || 0,
              amount: link.amount || 0,
              screeningType,
            });
            acc.set(link.centerId, centerServices);
            return acc;
          }, new Map<string, any[]>());
        }
        
        return (data || []).map(center => ({
          ...center,
          services: servicesByCenter.get(center.id) || [],
          screeningTypes: (servicesByCenter.get(center.id) || []).map((service: any) => ({
            amount: service.amount,
            screeningType: {
              id: service.id,
              name: service.name,
            },
          })),
          staff: [],
        }));
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('ServiceCenter').select('*', { count: 'exact', head: true });
        const serviceTypeFilter = where?.screeningTypes?.some?.screeningType?.OR;
        let matchingCenterIds: string[] | undefined;

        if (Array.isArray(serviceTypeFilter)) {
          const categoryIds = serviceTypeFilter
            .map((filter: any) => filter.screeningTypeCategoryId?.in)
            .flat()
            .filter(Boolean);
          const terms = serviceTypeFilter
            .map((filter: any) => filter.name?.contains || filter.category?.name?.contains)
            .filter(Boolean)
            .map((term: string) => term.toLowerCase());

          const { data: screeningTypes, error: screeningTypesError } = await supabase
            .from('ScreeningType')
            .select('id,name,screeningTypeCategoryId');

          if (screeningTypesError) throw screeningTypesError;

          const matchingScreeningTypeIds = (screeningTypes || [])
            .filter((screeningType: any) => {
              const name = String(screeningType.name || '').toLowerCase();
              return (
                categoryIds.includes(screeningType.screeningTypeCategoryId) ||
                terms.some((term: string) => name.includes(term))
              );
            })
            .map((screeningType: any) => screeningType.id);

          if (matchingScreeningTypeIds.length === 0) {
            matchingCenterIds = [];
          } else {
            const { data: links, error: linksError } = await supabase
              .from('ServiceCenterScreeningType')
              .select('centerId')
              .in('screeningTypeId', matchingScreeningTypeIds);

            if (linksError) throw linksError;
            matchingCenterIds = [...new Set((links || []).map((link: any) => link.centerId))];
          }
        }
        
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.state) query = query.eq('state', where.state);
          if (where.lga) query = query.eq('lga', where.lga);
          if (matchingCenterIds) {
            query = matchingCenterIds.length > 0
              ? query.in('id', matchingCenterIds)
              : query.eq('id', '__no_matching_centers__');
          }
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
            whatsappNumber: data.whatsappNumber || data.phone,
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

      findFirst: async ({ where, select }: any = {}) => {
        let query = supabase.from("User").select("*");

        if (where?.phone) query = query.eq("phone", where.phone);
        if (where?.email) query = query.eq("email", where.email);
        if (where?.id) query = query.eq("id", where.id);

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;

        if (!data || !select) return data;

        const selected: Record<string, unknown> = {};
        for (const key of Object.keys(select)) {
          if (select[key]) selected[key] = (data as Record<string, unknown>)[key];
        }
        return selected;
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
              emailVerified: data.patientProfile.create.emailVerified
                ? data.patientProfile.create.emailVerified instanceof Date
                  ? data.patientProfile.create.emailVerified.toISOString()
                  : data.patientProfile.create.emailVerified
                : null,
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
        if (data.phone !== undefined) updates.phone = data.phone;
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
              emailVerified: data.patientProfile.create.emailVerified
                ? data.patientProfile.create.emailVerified instanceof Date
                  ? data.patientProfile.create.emailVerified.toISOString()
                  : data.patientProfile.create.emailVerified
                : null,
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

      update: async ({ where, data }: any) => {
        const updates = { ...data };
        if (updates.emailVerified instanceof Date) {
          updates.emailVerified = updates.emailVerified.toISOString();
        }
        const { data: updated, error } = await supabase
          .from('PatientProfile')
          .update(updates)
          .eq('userId', where.userId)
          .select('*')
          .single();
        if (error) throw error;
        return updated;
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
          if (where.id?.in) {
            if (where.id.in.length === 0) return [];
            query = query.in('id', where.id.in);
          }
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

    // Group operations
    group: {
      findMany: async ({ where, skip, take, orderBy }: any = {}) => {
        let query = supabase.from('Group').select('*');

        if (where?.OR && Array.isArray(where.OR)) {
          const filters = where.OR.map((clause: any) => {
            if (clause.name?.contains)
              return `name.ilike.%${clause.name.contains}%`;
            if (clause.description?.contains)
              return `description.ilike.%${clause.description.contains}%`;
            return null;
          }).filter(Boolean);
          if (filters.length) query = query.or(filters.join(','));
        }

        if (orderBy?.name === 'asc') query = query.order('name', { ascending: true });
        else if (orderBy?.name === 'desc') query = query.order('name', { ascending: false });

        if (skip) query = query.range(skip, skip + (take || 20) - 1);
        else if (take) query = query.limit(take);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },

      findUnique: async ({ where }: { where: { id?: string } }) => {
        const { data, error } = await supabase
          .from('Group')
          .select('*')
          .eq('id', where.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },

      count: async ({ where }: any = {}) => {
        let query = supabase.from('Group').select('*', { count: 'exact', head: true });

        if (where?.OR && Array.isArray(where.OR)) {
          const filters = where.OR.map((clause: any) => {
            if (clause.name?.contains)
              return `name.ilike.%${clause.name.contains}%`;
            if (clause.description?.contains)
              return `description.ilike.%${clause.description.contains}%`;
            return null;
          }).filter(Boolean);
          if (filters.length) query = query.or(filters.join(','));
        }

        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },

      create: async ({ data }: any) => {
        const { data: group, error } = await supabase
          .from('Group')
          .insert({
            name: data.name,
            description: data.description || null,
          })
          .select()
          .single();

        if (error) throw error;
        return group;
      },
    },

    // Center staff operations
    centerStaff: {
      findMany: async ({ where }: any = {}) => {
        let query = supabase.from("CenterStaff").select("*");
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.status) query = query.eq("status", where.status);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },

      create: async ({ data }: any) => {
        const { data: staff, error } = await supabase
          .from("CenterStaff")
          .insert({
            centerId: data.centerId,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
            status: data.status || "ACTIVE",
          })
          .select()
          .single();

        if (error) throw error;
        return staff;
      },

      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        let query = supabase.from("CenterStaff").select("*");

        if (where.email) query = query.eq("email", where.email);
        if (where.id) query = query.eq("id", where.id);

        const { data, error } = await query.single();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      findFirst: async ({ where }: { where: { centerId?: string; email?: string } }) => {
        let query = supabase.from("CenterStaff").select("*");
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.email) query = query.eq("email", where.email);
        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      update: async ({ where, data }: any) => {
        const updates: Record<string, unknown> = { ...data };
        const { data: updated, error } = await supabase
          .from("CenterStaff")
          .update(updates)
          .eq("id", where.id)
          .select("*")
          .single();
        if (error) throw error;
        return updated;
      },
    },

    centerStaffResetToken: {
      create: async ({ data }: any) => {
        const row = {
          id: data.id || crypto.randomUUID(),
          staffId: data.staffId,
          token: data.token,
          expiresAt:
            data.expiresAt instanceof Date
              ? data.expiresAt.toISOString()
              : data.expiresAt,
        };
        const { data: created, error } = await supabase
          .from("CenterStaffResetToken")
          .insert(row)
          .select("*")
          .single();
        if (error) throw error;
        return created;
      },

      findUnique: async ({ where }: { where: { token: string } }) => {
        const { data, error } = await supabase
          .from("CenterStaffResetToken")
          .select("*")
          .eq("token", where.token)
          .maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      delete: async ({ where }: { where: { token: string } }) => {
        const { error } = await supabase
          .from("CenterStaffResetToken")
          .delete()
          .eq("token", where.token);
        if (error) throw error;
        return { token: where.token };
      },
    },

    centerStaffInvite: {
      findMany: async ({ where, select }: any = {}) => {
        let query = supabase.from("CenterStaffInvite").select(select ? Object.keys(select).join(",") : "*");
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.acceptedAt === null) query = query.is("acceptedAt", null);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },

      findUnique: async ({ where }: { where: { token: string } }) => {
        const { data, error } = await supabase
          .from("CenterStaffInvite")
          .select("*")
          .eq("token", where.token)
          .maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      create: async ({ data }: any) => {
        const row = {
          id: data.id || crypto.randomUUID(),
          centerId: data.centerId,
          email: data.email,
          token: data.token,
          expiresAt: data.expiresAt instanceof Date ? data.expiresAt.toISOString() : data.expiresAt,
          acceptedAt: data.acceptedAt || null,
        };
        const { data: created, error } = await supabase
          .from("CenterStaffInvite")
          .insert(row)
          .select("*")
          .single();
        if (error) throw error;
        return created;
      },

      update: async ({ where, data }: any) => {
        const updates: Record<string, unknown> = { ...data };
        if (updates.acceptedAt instanceof Date) {
          updates.acceptedAt = updates.acceptedAt.toISOString();
        }
        if (updates.expiresAt instanceof Date) {
          updates.expiresAt = updates.expiresAt.toISOString();
        }
        const { data: updated, error } = await supabase
          .from("CenterStaffInvite")
          .update(updates)
          .eq("token", where.token)
          .select("*")
          .single();
        if (error) throw error;
        return updated;
      },
    },

    screeningReport: {
      findUnique: async ({ where }: any) => {
        let query = supabase.from("ScreeningReport").select("*");
        if (where.appointmentId) query = query.eq("appointmentId", where.appointmentId);
        if (where.accessToken) query = query.eq("accessToken", where.accessToken);
        if (where.id) query = query.eq("id", where.id);
        const { data, error } = await query.maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      findMany: async ({ where, orderBy, take, skip }: any = {}) => {
        let query = supabase.from("ScreeningReport").select("*");
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (orderBy?.createdAt === "desc")
          query = query.order("createdAt", { ascending: false });
        if (skip) query = query.range(skip, skip + (take || 20) - 1);
        else if (take) query = query.limit(take);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },

      create: async ({ data }: any) => {
        const now = new Date().toISOString();
        const row = {
          id: data.id || crypto.randomUUID(),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        const { data: created, error } = await supabase
          .from("ScreeningReport")
          .insert(row)
          .select("*")
          .single();
        if (error) throw error;
        return created;
      },

      update: async ({ where, data }: any) => {
        const updates = { ...data, updatedAt: new Date().toISOString() };
        const { data: updated, error } = await supabase
          .from("ScreeningReport")
          .update(updates)
          .eq("id", where.id)
          .select("*")
          .single();
        if (error) throw error;
        return updated;
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
      findFirst: async ({ where }: any = {}) => {
        let query = supabase.from("Waitlist").select("*");

        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.screeningTypeId)
          query = query.eq("screeningTypeId", where.screeningTypeId);
        if (where?.status) {
          if (where.status.in) query = query.in("status", where.status.in);
          else query = query.eq("status", where.status);
        }
        if (where?.id) query = query.eq("id", where.id);

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      create: async ({ data, include }: any = {}) => {
        const row = {
          id: data.id || crypto.randomUUID(),
          patientId: data.patientId,
          screeningTypeId: data.screeningTypeId,
          status: data.status || "PENDING",
          joinedAt: new Date().toISOString(),
          enrolledByCenterId: data.enrolledByCenterId || null,
        };

        const { data: created, error } = await supabase
          .from("Waitlist")
          .insert(row)
          .select("*")
          .single();

        if (error) throw error;

        if (include?.screening && created) {
          const { data: screening } = await supabase
            .from("ScreeningType")
            .select("id, name, description")
            .eq("id", created.screeningTypeId)
            .single();
          return { ...created, screening };
        }

        return created;
      },

      groupBy: async ({ where, orderBy }: any = {}) => {
        let query = supabase.from('Waitlist').select('id, screeningTypeId');

        if (where?.status) query = query.eq('status', where.status);
        if (where?.screeningTypeId) query = query.eq('screeningTypeId', where.screeningTypeId);
        if (where?.patientId) query = query.eq('patientId', where.patientId);

        const { data, error } = await query;
        if (error) throw error;

        const counts = (data || []).reduce((acc: Map<string, number>, waitlist: any) => {
          const currentCount = acc.get(waitlist.screeningTypeId) || 0;
          acc.set(waitlist.screeningTypeId, currentCount + 1);
          return acc;
        }, new Map<string, number>());

        const sortDirection = orderBy?._count?.id === 'asc' ? 1 : -1;
        return [...counts.entries()]
          .map(([screeningTypeId, count]) => ({
            screeningTypeId,
            _count: { id: count },
          }))
          .sort((a, b) => (a._count.id - b._count.id) * sortDirection);
      },

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
      
      update: async ({ where, data }: any) => {
        const updates: any = {};
        if (data.basePriceSnapshot !== undefined) updates.basePriceSnapshot = data.basePriceSnapshot;
        if (data.retailPriceSnapshot !== undefined) updates.retailPriceSnapshot = data.retailPriceSnapshot;
        if (data.paymentStatus) updates.paymentStatus = data.paymentStatus;
        if (data.status) updates.status = data.status;
        if (data.cancellationReason !== undefined) {
          updates.cancellationReason = data.cancellationReason;
        }
        if (data.cancellationDate !== undefined) {
          updates.cancellationDate =
            data.cancellationDate instanceof Date
              ? data.cancellationDate.toISOString()
              : data.cancellationDate;
        }
        
        const { data: appointment, error } = await supabase
          .from('Appointment')
          .update(updates)
          .eq('id', where.id)
          .select()
          .single();
        
        if (error) throw error;
        return appointment;
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
    
    // ============================================
    // WALLET OPERATIONS
    // ============================================
    
    // Platform Wallet operations
    platformWallet: {
      findFirst: async ({ select }: any = {}) => {
        const { data, error } = await supabase
          .from('PlatformWallet')
          .select('*')
          .limit(1)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
    },
    
    // Platform Wallet Transaction operations
    platformWalletTransaction: {
      findMany: async ({ where, orderBy, take, skip }: any = {}) => {
        let query = supabase.from('PlatformWalletTransaction').select('*');
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        if (where?.createdAt?.gte) query = query.gte('createdAt', where.createdAt.gte.toISOString());
        if (where?.createdAt?.lte) query = query.lte('createdAt', where.createdAt.lte.toISOString());
        
        if (orderBy?.createdAt) query = query.order('createdAt', { ascending: orderBy.createdAt === 'asc' });
        
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('PlatformWalletTransaction').select('*', { count: 'exact', head: true });
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        if (where?.createdAt?.gte) query = query.gte('createdAt', where.createdAt.gte.toISOString());
        if (where?.createdAt?.lte) query = query.lte('createdAt', where.createdAt.lte.toISOString());
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
      
      aggregate: async ({ where, _sum }: any = {}) => {
        let query = supabase.from('PlatformWalletTransaction').select('amount');
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        if (where?.type) query = query.eq('type', where.type);
        if (where?.createdAt?.gte) query = query.gte('createdAt', where.createdAt.gte.toISOString());
        if (where?.createdAt?.lte) query = query.lte('createdAt', where.createdAt.lte.toISOString());
        
        const { data, error } = await query;
        if (error) throw error;
        
        const sum = (data || []).reduce((acc, row) => acc + (row.amount || 0), 0);
        return { _sum: { amount: sum } };
      },
    },
    
    // Center Wallet operations
    centerWallet: {
      findUnique: async ({ where, select, include }: any = {}) => {
        let query = supabase.from('CenterWallet').select('*');
        
        if (where.id) query = query.eq('id', where.id);
        if (where.centerId) query = query.eq('centerId', where.centerId);
        
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        
        // If include.center, fetch center data
        if (data && include?.center) {
          const { data: center } = await supabase
            .from('ServiceCenter')
            .select('*')
            .eq('id', data.centerId)
            .single();
          data.center = center;
        }
        
        return data;
      },
      
      findMany: async ({ include, orderBy, take, skip }: any = {}) => {
        let query = supabase.from('CenterWallet').select('*');
        
        if (orderBy?.balance) query = query.order('balance', { ascending: orderBy.balance === 'asc' });
        
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        
        // If include.center, fetch center data for each wallet
        if (data && include?.center) {
          const centerIds = data.map(w => w.centerId);
          const { data: centers } = await supabase
            .from('ServiceCenter')
            .select('id, centerName')
            .in('id', centerIds);
          
          return data.map(wallet => ({
            ...wallet,
            center: centers?.find(c => c.id === wallet.centerId) || null,
          }));
        }
        
        return data || [];
      },
      
      count: async () => {
        const { count, error } = await supabase
          .from('CenterWallet')
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count || 0;
      },
    },
    
    // Center Wallet Transaction operations
    centerWalletTransaction: {
      findMany: async ({ where, orderBy, take, skip }: any = {}) => {
        let query = supabase.from('CenterWalletTransaction').select('*');
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        if (where?.createdAt?.gte) query = query.gte('createdAt', where.createdAt.gte.toISOString());
        if (where?.createdAt?.lte) query = query.lte('createdAt', where.createdAt.lte.toISOString());
        
        if (orderBy?.createdAt) query = query.order('createdAt', { ascending: orderBy.createdAt === 'asc' });
        
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('CenterWalletTransaction').select('*', { count: 'exact', head: true });
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        if (where?.createdAt?.gte) query = query.gte('createdAt', where.createdAt.gte.toISOString());
        if (where?.createdAt?.lte) query = query.lte('createdAt', where.createdAt.lte.toISOString());
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
      
      aggregate: async ({ where, _sum }: any = {}) => {
        let query = supabase.from('CenterWalletTransaction').select('amount');
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        if (where?.type) query = query.eq('type', where.type);
        if (where?.createdAt?.gte) query = query.gte('createdAt', where.createdAt.gte.toISOString());
        if (where?.createdAt?.lte) query = query.lte('createdAt', where.createdAt.lte.toISOString());
        
        const { data, error } = await query;
        if (error) throw error;
        
        const sum = (data || []).reduce((acc, row) => acc + (row.amount || 0), 0);
        return { _sum: { amount: sum } };
      },
    },
    
    donationCampaign: {
      findMany: async ({ where, skip, take, orderBy, include }: any = {}) => {
        let query = supabase.from("DonationCampaign").select("*");

        if (where?.donorId) query = query.eq("donorId", where.donorId);
        if (where?.status) query = query.eq("status", where.status);
        if (where?.id) query = query.eq("id", where.id);
        if (where?.availableAmount?.gt !== undefined) {
          query = query.gt("availableAmount", where.availableAmount.gt);
        }
        if (where?.OR?.length) {
          const searchTerm = where.OR.find(
            (c: any) => c.purpose?.contains || c.title?.contains,
          );
          const term =
            searchTerm?.purpose?.contains || searchTerm?.title?.contains;
          if (term) {
            query = query.or(
              `purpose.ilike.%${term}%,title.ilike.%${term}%`,
            );
          }
        }

        if (orderBy?.createdAt === "desc") {
          query = query.order("createdAt", { ascending: false });
        } else if (orderBy?.createdAt === "asc") {
          query = query.order("createdAt", { ascending: true });
        }

        if (skip != null) query = query.range(skip, skip + (take || 20) - 1);
        else if (take) query = query.limit(take);

        const { data, error } = await query;
        if (error) throw error;

        return Promise.all(
          (data || []).map((row) => enrichDonationCampaign(supabase, row, include)),
        );
      },

      findFirst: async ({ where, include, orderBy, select }: any = {}) => {
        let query = supabase.from("DonationCampaign").select("*");

        if (where?.donorId) query = query.eq("donorId", where.donorId);
        if (where?.status) query = query.eq("status", where.status);
        if (where?.id) query = query.eq("id", where.id);
        if (where?.availableAmount?.gt !== undefined) {
          query = query.gt("availableAmount", where.availableAmount.gt);
        }

        if (orderBy?.createdAt === "desc") {
          query = query.order("createdAt", { ascending: false });
        }

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!data) return null;

        if (select) {
          const picked: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            if (select[key]) picked[key] = data[key];
          }
          return picked;
        }

        return enrichDonationCampaign(supabase, data, include);
      },

      findUnique: async ({ where, include, select }: any) => {
        const { data, error } = await supabase
          .from("DonationCampaign")
          .select("*")
          .eq("id", where.id)
          .maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!data) return null;

        if (select) {
          const picked: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            if (select[key]) picked[key] = data[key];
          }
          return picked;
        }

        return enrichDonationCampaign(supabase, data, include);
      },

      count: async ({ where }: any = {}) => {
        let query = supabase
          .from("DonationCampaign")
          .select("*", { count: "exact", head: true });

        if (where?.donorId) query = query.eq("donorId", where.donorId);
        if (where?.status) query = query.eq("status", where.status);
        if (where?.OR?.length) {
          const searchTerm = where.OR.find(
            (c: any) => c.purpose?.contains || c.title?.contains,
          );
          const term =
            searchTerm?.purpose?.contains || searchTerm?.title?.contains;
          if (term) {
            query = query.or(
              `purpose.ilike.%${term}%,title.ilike.%${term}%`,
            );
          }
        }

        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },

      create: async ({ data, include }: any) => {
        const id = data.id || crypto.randomUUID();
        const now = new Date().toISOString();
        const row = {
          id,
          donorId: data.donorId,
          totalAmount: data.totalAmount ?? 0,
          availableAmount: data.availableAmount ?? 0,
          title: data.title,
          purpose: data.purpose ?? null,
          targetGender: data.targetGender ?? null,
          targetAgeRange: data.targetAgeRange ?? null,
          targetStates:
            typeof data.targetStates === "string"
              ? data.targetStates
              : JSON.stringify(data.targetStates ?? []),
          targetLgas:
            typeof data.targetLgas === "string"
              ? data.targetLgas
              : JSON.stringify(data.targetLgas ?? []),
          status: data.status,
          expiryDate: data.expiryDate
            ? data.expiryDate instanceof Date
              ? data.expiryDate.toISOString()
              : data.expiryDate
            : null,
          targetAssociationId: data.targetAssociationId ?? null,
          targetGroupId: data.targetGroupId ?? null,
          targetIndividualId: data.targetIndividualId ?? null,
          targetPhone: data.targetPhone ?? null,
          createdAt: now,
          updatedAt: now,
        };

        const { data: created, error } = await supabase
          .from("DonationCampaign")
          .insert(row)
          .select("*")
          .single();
        if (error) throw error;

        if (data.screeningTypes?.connect?.length) {
          const links = data.screeningTypes.connect.map((c: { id: string }) => ({
            A: id,
            B: c.id,
          }));
          const { error: linkError } = await supabase
            .from("_DonationCampaignScreeningTypes")
            .insert(links);
          if (linkError) throw linkError;
        }

        return enrichDonationCampaign(supabase, created, include);
      },

      update: async ({ where, data, include }: any) => {
        const { data: current, error: fetchError } = await supabase
          .from("DonationCampaign")
          .select("*")
          .eq("id", where.id)
          .single();
        if (fetchError) throw fetchError;

        const updates: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(data)) {
          if (key === "screeningTypes") continue;
          if (val && typeof val === "object" && "increment" in (val as object)) {
            updates[key] =
              (Number(current[key]) || 0) + Number((val as { increment: number }).increment);
          } else if (
            val &&
            typeof val === "object" &&
            "decrement" in (val as object)
          ) {
            updates[key] =
              (Number(current[key]) || 0) - Number((val as { decrement: number }).decrement);
          } else if (key === "targetStates" || key === "targetLgas") {
            updates[key] =
              typeof val === "string" ? val : JSON.stringify(val ?? []);
          } else if (key === "expiryDate" && val instanceof Date) {
            updates[key] = val.toISOString();
          } else {
            updates[key] = val;
          }
        }
        updates.updatedAt = new Date().toISOString();

        const { data: updated, error } = await supabase
          .from("DonationCampaign")
          .update(updates)
          .eq("id", where.id)
          .select("*")
          .single();
        if (error) throw error;

        if (data.screeningTypes?.connect) {
          await supabase
            .from("_DonationCampaignScreeningTypes")
            .delete()
            .eq("A", where.id);
          const links = data.screeningTypes.connect.map((c: { id: string }) => ({
            A: where.id,
            B: c.id,
          }));
          if (links.length) {
            const { error: linkError } = await supabase
              .from("_DonationCampaignScreeningTypes")
              .insert(links);
            if (linkError) throw linkError;
          }
        }

        return enrichDonationCampaign(supabase, updated, include);
      },
    },

    donationAllocation: {
      updateMany: async ({ where, data }: any) => {
        let query = supabase.from("DonationAllocation").update(data);
        if (where?.id?.in?.length) query = query.in("id", where.id.in);
        if (where?.campaignId) query = query.eq("campaignId", where.campaignId);
        const { error } = await query;
        if (error) throw error;
        return { count: where?.id?.in?.length ?? 0 };
      },
    },

    transaction: {
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let transactionIds: string[] | null = null;
        const centerId = where?.appointments?.some?.centerId;

        if (centerId) {
          const { data: appointments, error: apptError } = await supabase
            .from("Appointment")
            .select("id, transactionId, centerId, patientId, screeningTypeId, appointmentDateTime")
            .eq("centerId", centerId);
          if (apptError) throw apptError;

          transactionIds = [
            ...new Set(
              (appointments || [])
                .map((appt: { transactionId?: string | null }) => appt.transactionId)
                .filter(Boolean) as string[],
            ),
          ];
          if (transactionIds.length === 0) return [];
        }

        let query = supabase.from("Transaction").select("*");
        if (where?.status) query = query.eq("status", where.status);
        if (where?.id?.in?.length) query = query.in("id", where.id.in);
        if (transactionIds) query = query.in("id", transactionIds);

        if (orderBy?.createdAt === "desc") {
          query = query.order("createdAt", { ascending: false });
        }

        const { data: transactions, error } = await query;
        if (error) throw error;

        let results = transactions || [];

        if (where?.payoutItem === null) {
          const { data: payoutItems, error: payoutItemError } = await supabase
            .from("payout_items")
            .select("transactionId");
          if (payoutItemError) throw payoutItemError;
          const paidIds = new Set(
            (payoutItems || []).map(
              (item: { transactionId: string }) => item.transactionId,
            ),
          );
          results = results.filter((tx: { id: string }) => !paidIds.has(tx.id));
        }

        if (!include?.appointments) {
          return results.map((tx: Record<string, unknown>) => ({
            ...tx,
            createdAt: new Date(String(tx.createdAt)),
          }));
        }

        return Promise.all(
          results.map(async (tx: Record<string, unknown>) => {
            const { data: appointments } = await supabase
              .from("Appointment")
              .select("*")
              .eq("transactionId", tx.id as string);

            const enrichedAppointments = await Promise.all(
              (appointments || []).map(async (appt: Record<string, unknown>) => {
                const enriched: Record<string, unknown> = { ...appt };
                const apptInclude = include.appointments.include || {};

                if (apptInclude.patient) {
                  const { data: patient } = await supabase
                    .from("User")
                    .select("id, fullName, email")
                    .eq("id", appt.patientId as string)
                    .maybeSingle();
                  enriched.patient = patient;
                }
                if (apptInclude.center) {
                  const { data: center } = await supabase
                    .from("ServiceCenter")
                    .select("centerName")
                    .eq("id", appt.centerId as string)
                    .maybeSingle();
                  enriched.center = center;
                }
                if (apptInclude.screeningType) {
                  const { data: screeningType } = await supabase
                    .from("ScreeningType")
                    .select("name")
                    .eq("id", appt.screeningTypeId as string)
                    .maybeSingle();
                  enriched.screeningType = screeningType;
                }

                return enriched;
              }),
            );

            return {
              ...tx,
              createdAt: new Date(String(tx.createdAt)),
              appointments: enrichedAppointments,
            };
          }),
        );
      },

      count: async ({ where }: any = {}) => {
        let query = supabase
          .from("Transaction")
          .select("*", { count: "exact", head: true });
        if (where?.status) query = query.eq("status", where.status);
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
    },

    payout: {
      findMany: async ({ where, skip, take, orderBy, include }: any = {}) => {
        let query = supabase.from("payouts").select("*");
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.status) query = query.eq("status", where.status);
        if (orderBy?.createdAt === "desc") {
          query = query.order("createdAt", { ascending: false });
        }
        if (skip != null) query = query.range(skip, skip + (take || 20) - 1);
        else if (take) query = query.limit(take);

        const { data, error } = await query;
        if (error) throw error;

        return Promise.all(
          (data || []).map(async (payout: Record<string, unknown>) => {
            const result: Record<string, unknown> = {
              ...payout,
              createdAt: new Date(String(payout.createdAt)),
              completedAt: payout.completedAt
                ? new Date(String(payout.completedAt))
                : null,
            };

            if (include?.center) {
              const { data: center } = await supabase
                .from("ServiceCenter")
                .select("centerName, email")
                .eq("id", payout.centerId as string)
                .maybeSingle();
              result.center = center;
            }

            return result;
          }),
        );
      },

      findFirst: async ({ where, orderBy, select }: any = {}) => {
        let query = supabase.from("payouts").select("*");
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.status) query = query.eq("status", where.status);
        if (orderBy?.completedAt === "desc") {
          query = query.order("completedAt", { ascending: false });
        }

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!data) return null;

        if (select) {
          const picked: Record<string, unknown> = {};
          for (const key of Object.keys(select)) {
            if (select[key]) {
              picked[key] =
                key === "completedAt" && data.completedAt
                  ? new Date(String(data.completedAt))
                  : data[key];
            }
          }
          return picked;
        }

        return {
          ...data,
          completedAt: data.completedAt
            ? new Date(String(data.completedAt))
            : null,
        };
      },

      count: async ({ where }: any = {}) => {
        let query = supabase
          .from("payouts")
          .select("*", { count: "exact", head: true });
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.status) query = query.eq("status", where.status);
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },

      aggregate: async ({ where, _sum }: any = {}) => {
        let query = supabase.from("payouts").select("amount, status, centerId");
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.status?.in?.length) {
          query = query.in("status", where.status.in);
        } else if (where?.status) {
          query = query.eq("status", where.status);
        }

        const { data, error } = await query;
        if (error) throw error;

        const sum = (data || []).reduce(
          (acc: number, row: { amount?: number }) => acc + Number(row.amount || 0),
          0,
        );

        return {
          _sum: {
            amount: _sum?.amount !== undefined ? sum : undefined,
          },
          _count: (data || []).length,
        };
      },
    },

    // Center Cashout operations
    centerCashout: {
      create: async ({ data }: any) => {
        const { data: cashout, error } = await supabase
          .from('CenterCashout')
          .insert({
            walletId: data.walletId,
            amount: data.amount,
            fee: data.fee,
            netAmount: data.netAmount,
            status: data.status,
            initiatedBy: data.initiatedBy,
          })
          .select()
          .single();
        
        if (error) throw error;
        return cashout;
      },
      
      findUnique: async ({ where, include }: any) => {
        const { data, error } = await supabase
          .from('CenterCashout')
          .select('*')
          .eq('id', where.id)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        // If include.wallet, fetch wallet and center data
        if (data && include?.wallet) {
          const { data: wallet } = await supabase
            .from('CenterWallet')
            .select('*')
            .eq('id', data.walletId)
            .single();
          
          if (wallet && include.wallet.include?.center) {
            const { data: center } = await supabase
              .from('ServiceCenter')
              .select('*')
              .eq('id', wallet.centerId)
              .single();
            wallet.center = center;
          }
          
          data.wallet = wallet;
        }
        
        return data;
      },
      
      update: async ({ where, data }: any) => {
        const updates: any = {};
        if (data.status) updates.status = data.status;
        if (data.paystackReference) updates.paystackReference = data.paystackReference;
        if (data.failureReason) updates.failureReason = data.failureReason;
        if (data.processedAt) updates.processedAt = data.processedAt.toISOString();
        if (data.completedAt) updates.completedAt = data.completedAt.toISOString();
        
        const { data: cashout, error } = await supabase
          .from('CenterCashout')
          .update(updates)
          .eq('id', where.id)
          .select()
          .single();
        
        if (error) throw error;
        return cashout;
      },
      
      findMany: async ({ where, orderBy, take, skip }: any = {}) => {
        let query = supabase.from('CenterCashout').select('*');
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        
        if (orderBy?.createdAt) query = query.order('createdAt', { ascending: orderBy.createdAt === 'asc' });
        
        if (skip) query = query.range(skip, skip + (take || 10) - 1);
        else if (take) query = query.limit(take);
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      
      count: async ({ where }: any = {}) => {
        let query = supabase.from('CenterCashout').select('*', { count: 'exact', head: true });
        
        if (where?.walletId) query = query.eq('walletId', where.walletId);
        
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },
    },

    $transaction: async (fn: (tx: ReturnType<typeof getDB>) => Promise<unknown>) => {
      return fn(getDB(c));
    },
  };
};

export type TDB = ReturnType<typeof getDB>;
