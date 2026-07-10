// Database adapter that provides a Prisma-like API using Supabase
// This allows gradual migration from mock database to Supabase

import type { Context } from 'hono';
import {
  matchesServiceTypeFilter,
  type ServiceTypeKey,
} from './service-type-utils';
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

async function getCenterIdsForServiceType(
  supabase: SupabaseClient,
  serviceTypeKey: ServiceTypeKey,
): Promise<string[]> {
  const [{ data: screeningTypes, error: screeningTypesError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase.from('ScreeningType').select('id,name,screeningTypeCategoryId'),
      supabase.from('ScreeningTypeCategory').select('id,name'),
    ]);

  if (screeningTypesError) throw screeningTypesError;
  if (categoriesError) throw categoriesError;

  const categoryNameById = new Map(
    (categories || []).map((category: { id: string; name: string }) => [
      category.id,
      category.name,
    ]),
  );

  const matchingScreeningTypeIds = (screeningTypes || [])
    .filter((screeningType: { id: string; name?: string; screeningTypeCategoryId?: string }) =>
      matchesServiceTypeFilter(
        {
          name: screeningType.name,
          screeningTypeCategoryId: screeningType.screeningTypeCategoryId,
          categoryName: categoryNameById.get(screeningType.screeningTypeCategoryId || ''),
        },
        serviceTypeKey,
      ),
    )
    .map((screeningType: { id: string }) => screeningType.id);

  if (matchingScreeningTypeIds.length === 0) return [];

  const { data: links, error: linksError } = await supabase
    .from('ServiceCenterScreeningType')
    .select('centerId')
    .in('screeningTypeId', matchingScreeningTypeIds);

  if (linksError) throw linksError;
  return [...new Set((links || []).map((link: { centerId: string }) => link.centerId))];
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
        
        if (where.email) query = query.ilike('email', String(where.email).trim());
        if (where.id) query = query.eq('id', where.id);
        
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      
      findMany: async ({ where, skip, take, orderBy, include }: any = {}) => {
        let query = supabase.from('ServiceCenter').select('*');
        let matchingCenterIds: string[] | undefined;

        if (where?._serviceTypeKey) {
          matchingCenterIds = await getCenterIdsForServiceType(
            supabase,
            where._serviceTypeKey as ServiceTypeKey,
          );
        }

        if (matchingCenterIds !== undefined && matchingCenterIds.length === 0) {
          return [];
        }
        
        // Apply filters
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.state) query = query.eq('state', where.state);
          if (where.lga) query = query.eq('lga', where.lga);
          if (matchingCenterIds !== undefined && matchingCenterIds.length > 0) {
            query = query.in('id', matchingCenterIds);
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
        let matchingCenterIds: string[] | undefined;

        if (where?._serviceTypeKey) {
          matchingCenterIds = await getCenterIdsForServiceType(
            supabase,
            where._serviceTypeKey as ServiceTypeKey,
          );
        }

        if (matchingCenterIds !== undefined && matchingCenterIds.length === 0) {
          return 0;
        }
        
        if (where) {
          if (where.status) query = query.eq('status', where.status);
          if (where.state) query = query.eq('state', where.state);
          if (where.lga) query = query.eq('lga', where.lga);
          if (matchingCenterIds !== undefined && matchingCenterIds.length > 0) {
            query = query.in('id', matchingCenterIds);
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
        
        if (where.email) {
          query = query.ilike('email', where.email.trim());
        }
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
        if (where?.email) query = query.ilike("email", String(where.email).trim());
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
            email: typeof data.email === "string" ? data.email.trim().toLowerCase() : data.email,
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
              photoUrl: data.patientProfile.create.photoUrl || null,
              assignedCenterId: data.patientProfile.create.assignedCenterId || null,
              mustChangePassword:
                data.patientProfile.create.mustChangePassword === true,
              emailVerified: data.patientProfile.create.emailVerified
                ? data.patientProfile.create.emailVerified instanceof Date
                  ? data.patientProfile.create.emailVerified.toISOString()
                  : data.patientProfile.create.emailVerified
                : new Date().toISOString(),
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
              emailVerified: new Date().toISOString(),
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
              photoUrl: data.patientProfile.create.photoUrl || null,
              assignedCenterId: data.patientProfile.create.assignedCenterId || null,
              mustChangePassword:
                data.patientProfile.create.mustChangePassword === true,
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
        if (updates.mustChangePassword !== undefined) {
          updates.mustChangePassword = Boolean(updates.mustChangePassword);
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
          appointmentId: data.appointmentId ?? null,
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
      findMany: async ({ where, include }: any = {}) => {
        let query = supabase.from('ServiceCenterScreeningType').select('*');
        if (where?.centerId) query = query.eq('centerId', where.centerId);

        const { data, error } = await query;
        if (error) throw error;

        if (!include?.screeningType) return data || [];

        const screeningTypeIds = [
          ...new Set((data || []).map((link: { screeningTypeId: string }) => link.screeningTypeId)),
        ];
        if (screeningTypeIds.length === 0) return data || [];

        const { data: screeningTypes, error: screeningTypesError } = await supabase
          .from('ScreeningType')
          .select(include.screeningType.select ? Object.keys(include.screeningType.select).join(',') : '*')
          .in('id', screeningTypeIds);

        if (screeningTypesError) throw screeningTypesError;

        const screeningTypesById = new Map(
          (screeningTypes || []).map((screeningType: Record<string, unknown>) => [
            screeningType.id,
            screeningType,
          ]),
        );

        return (data || []).map((link: Record<string, unknown>) => ({
          ...link,
          screeningType: screeningTypesById.get(link.screeningTypeId as string) || null,
        }));
      },

      findUnique: async ({ where, include }: any) => {
        let query = supabase.from('ServiceCenterScreeningType').select('*');

        if (where.id) {
          query = query.eq('id', where.id);
        } else if (where.centerId_screeningTypeId) {
          query = query
            .eq('centerId', where.centerId_screeningTypeId.centerId)
            .eq('screeningTypeId', where.centerId_screeningTypeId.screeningTypeId);
        } else {
          return null;
        }

        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        if (!data) return null;

        if (include?.screeningType) {
          const { data: screeningType, error: screeningTypeError } = await supabase
            .from('ScreeningType')
            .select('*')
            .eq('id', data.screeningTypeId)
            .single();

          if (screeningTypeError && screeningTypeError.code !== 'PGRST116') {
            throw screeningTypeError;
          }

          return {
            ...data,
            screeningType: screeningType
              ? {
                  ...screeningType,
                  basePrice: screeningType.agreedPrice,
                }
              : null,
          };
        }

        return data;
      },

      create: async ({ data, include }: any) => {
        const { data: link, error } = await supabase
          .from('ServiceCenterScreeningType')
          .insert({
            id: data.id || crypto.randomUUID(),
            centerId: data.centerId,
            screeningTypeId: data.screeningTypeId,
            amount: data.amount ?? 10000,
          })
          .select()
          .single();

        if (error) throw error;

        if (include?.screeningType) {
          const { data: screeningType } = await supabase
            .from('ScreeningType')
            .select(include.screeningType.select ? Object.keys(include.screeningType.select).join(',') : '*')
            .eq('id', link.screeningTypeId)
            .single();

          return { ...link, screeningType };
        }

        return link;
      },

      delete: async ({ where }: any) => {
        let query = supabase.from('ServiceCenterScreeningType').delete();

        if (where.centerId_screeningTypeId) {
          query = query
            .eq('centerId', where.centerId_screeningTypeId.centerId)
            .eq('screeningTypeId', where.centerId_screeningTypeId.screeningTypeId);
        } else if (where.id) {
          query = query.eq('id', where.id);
        }

        const { error } = await query;
        if (error) throw error;
        return { id: where.id || where.centerId_screeningTypeId?.screeningTypeId };
      },
    },
    
    // Waitlist operations
    waitlist: {
      findFirst: async ({ where, include }: any = {}) => {
        let query = supabase.from("Waitlist").select("*");

        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.screeningTypeId)
          query = query.eq("screeningTypeId", where.screeningTypeId);
        if (where?.status) {
          if (where.status.in) query = query.in("status", where.status.in);
          else query = query.eq("status", where.status);
        }
        if (where?.id) query = query.eq("id", where.id);
        if (where?.enrolledByCenterId) {
          query = query.eq("enrolledByCenterId", where.enrolledByCenterId);
        }

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!data) return null;

        const result: Record<string, unknown> = { ...data };

        if (include?.screening) {
          const { data: screening } = await supabase
            .from("ScreeningType")
            .select(
              include.screening.select
                ? Object.keys(include.screening.select).join(",")
                : "id,name,description"
            )
            .eq("id", data.screeningTypeId)
            .maybeSingle();
          result.screening = screening;
        }

        if (include?.allocation) {
          const { data: allocation } = await supabase
            .from("DonationAllocation")
            .select("id, claimedAt, campaignId")
            .eq("waitlistId", data.id)
            .maybeSingle();

          if (allocation && include.allocation.select?.campaign) {
            const { data: campaign } = await supabase
              .from("DonationCampaign")
              .select("title, purpose")
              .eq("id", allocation.campaignId)
              .maybeSingle();
            result.allocation = { ...allocation, campaign };
          } else {
            result.allocation = allocation;
          }
        }

        return result;
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

      update: async ({ where, data }: any = {}) => {
        const updates: Record<string, unknown> = { ...data };
        if (updates.claimedAt instanceof Date) {
          updates.claimedAt = updates.claimedAt.toISOString();
        }
        if (updates.expiredAt instanceof Date) {
          updates.expiredAt = updates.expiredAt.toISOString();
        }

        const { data: updated, error } = await supabase
          .from("Waitlist")
          .update(updates)
          .eq("id", where.id)
          .select("*")
          .single();

        if (error) throw error;
        return updated;
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
          if (where.status) {
            if (where.status.in) query = query.in("status", where.status.in);
            else query = query.eq("status", where.status);
          }
          if (where.screeningTypeId) query = query.eq("screeningTypeId", where.screeningTypeId);
          if (where.patientId) query = query.eq("patientId", where.patientId);
          if (where.enrolledByCenterId) {
            query = query.eq("enrolledByCenterId", where.enrolledByCenterId);
          }
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

        const rows = data || [];

        let resultsByAppointmentId = new Map<string, Record<string, unknown>>();
        if (include?.result && rows.length > 0) {
          const appointmentIds = rows.map((row) => row.id);
          const { data: screeningResults } = await supabase
            .from("ScreeningResult")
            .select("*")
            .in("appointmentId", appointmentIds);

          const resultIds = (screeningResults || []).map((row) => row.id);
          let filesByResultId = new Map<string, Record<string, unknown>[]>();

          if (resultIds.length > 0) {
            const { data: files } = await supabase
              .from("ScreeningResultFile")
              .select("*")
              .in("resultId", resultIds)
              .eq("isDeleted", false);

            for (const file of files || []) {
              const list = filesByResultId.get(file.resultId) || [];
              list.push({
                ...file,
                uploadedAt: new Date(String(file.uploadedAt)),
              });
              filesByResultId.set(file.resultId, list);
            }
          }

          for (const screeningResult of screeningResults || []) {
            resultsByAppointmentId.set(screeningResult.appointmentId, {
              ...screeningResult,
              uploadedAt: new Date(String(screeningResult.uploadedAt)),
              files: filesByResultId.get(screeningResult.id) || [],
            });
          }
        }

        if (
          !include?.patient &&
          !include?.screeningType &&
          !include?.center &&
          !include?.result &&
          !include?.transaction
        ) {
          return rows.map((appointment) => ({
            ...appointment,
            appointmentDateTime: new Date(String(appointment.appointmentDateTime)),
            createdAt: new Date(String(appointment.createdAt)),
            cancellationDate: appointment.cancellationDate
              ? new Date(String(appointment.cancellationDate))
              : null,
            checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
              ? new Date(String(appointment.checkInCodeExpiresAt))
              : null,
          }));
        }

        const patientIds = [...new Set(rows.map((row) => row.patientId))];
        const screeningTypeIds = [...new Set(rows.map((row) => row.screeningTypeId))];
        const centerIds = [...new Set(rows.map((row) => row.centerId))];

        const [{ data: patients }, { data: screeningTypes }, { data: centers }] =
          await Promise.all([
            include?.patient && patientIds.length
              ? supabase
                  .from("User")
                  .select(
                    include.patient.select
                      ? Object.keys(include.patient.select).join(",")
                      : "id,fullName,email,phone"
                  )
                  .in("id", patientIds)
              : Promise.resolve({ data: [] }),
            include?.screeningType && screeningTypeIds.length
              ? supabase
                  .from("ScreeningType")
                  .select(
                    include.screeningType.select
                      ? Object.keys(include.screeningType.select).join(",")
                      : "id,name"
                  )
                  .in("id", screeningTypeIds)
              : Promise.resolve({ data: [] }),
            include?.center && centerIds.length
              ? supabase
                  .from("ServiceCenter")
                  .select(
                    include.center.select
                      ? Object.keys(include.center.select).join(",")
                      : "id,centerName"
                  )
                  .in("id", centerIds)
              : Promise.resolve({ data: [] }),
          ]);

        const patientsById = new Map((patients || []).map((row) => [row.id, row]));
        const screeningById = new Map(
          (screeningTypes || []).map((row) => [row.id, row])
        );
        const centersById = new Map((centers || []).map((row) => [row.id, row]));

        return rows.map((appointment) => ({
          ...appointment,
          appointmentDateTime: new Date(String(appointment.appointmentDateTime)),
          createdAt: new Date(String(appointment.createdAt)),
          cancellationDate: appointment.cancellationDate
            ? new Date(String(appointment.cancellationDate))
            : null,
          checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
            ? new Date(String(appointment.checkInCodeExpiresAt))
            : null,
          patient: include?.patient
            ? patientsById.get(appointment.patientId) || null
            : undefined,
          screeningType: include?.screeningType
            ? screeningById.get(appointment.screeningTypeId) || null
            : undefined,
          center: include?.center
            ? centersById.get(appointment.centerId) || null
            : undefined,
          result: include?.result
            ? resultsByAppointmentId.get(appointment.id) || null
            : undefined,
          transaction: include?.transaction ? null : undefined,
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
        let query = supabase.from("Appointment").select("*");
        if (where.id) query = query.eq("id", where.id);
        else if (where.checkInCode) query = query.eq("checkInCode", where.checkInCode);
        else return null;

        const { data, error } = await query.maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!data) return null;

        const appointment = {
          ...data,
          appointmentDateTime: new Date(String(data.appointmentDateTime)),
          createdAt: new Date(String(data.createdAt)),
          cancellationDate: data.cancellationDate
            ? new Date(String(data.cancellationDate))
            : null,
          checkInCodeExpiresAt: data.checkInCodeExpiresAt
            ? new Date(String(data.checkInCodeExpiresAt))
            : null,
        };

        const result: Record<string, unknown> = { ...appointment };

        if (include?.patient) {
          const { data: patient } = await supabase
            .from("User")
            .select(
              include.patient.select
                ? Object.keys(include.patient.select).join(",")
                : "id,fullName,email,phone"
            )
            .eq("id", data.patientId)
            .maybeSingle();
          result.patient = patient;
        }

        if (include?.screeningType) {
          const { data: screeningType } = await supabase
            .from("ScreeningType")
            .select(
              include.screeningType.select
                ? Object.keys(include.screeningType.select).join(",")
                : "id,name"
            )
            .eq("id", data.screeningTypeId)
            .maybeSingle();
          result.screeningType = screeningType;
        }

        if (include?.center) {
          const { data: center } = await supabase
            .from("ServiceCenter")
            .select(
              include.center.select
                ? Object.keys(include.center.select).join(",")
                : "id,centerName"
            )
            .eq("id", data.centerId)
            .maybeSingle();
          result.center = center;
        }

        if (include?.verification) {
          const { data: verification } = await supabase
            .from("AppointmentVerification")
            .select(
              include.verification.select
                ? Object.keys(include.verification.select).join(",")
                : "id,verifiedAt,verifiedBy"
            )
            .eq("appointmentId", data.id)
            .maybeSingle();
          result.verification = verification;
        }

        if (include?.transaction && data.transactionId) {
          const { data: transaction } = await supabase
            .from("Transaction")
            .select("*")
            .eq("id", data.transactionId)
            .maybeSingle();
          result.transaction = transaction
            ? {
                ...transaction,
                createdAt: new Date(String(transaction.createdAt)),
              }
            : null;
        } else if (include?.transaction) {
          result.transaction = null;
        }

        if (include?.result) {
          const { data: screeningResult } = await supabase
            .from("ScreeningResult")
            .select("*")
            .eq("appointmentId", data.id)
            .maybeSingle();

          if (!screeningResult) {
            result.result = null;
          } else {
            const fileInclude = include.result.include?.files;
            let files: Record<string, unknown>[] = [];

            if (fileInclude) {
              let fileQuery = supabase
                .from("ScreeningResultFile")
                .select(
                  fileInclude.select
                    ? Object.keys(fileInclude.select).join(",")
                    : "*"
                )
                .eq("resultId", screeningResult.id);

              const fileWhere = fileInclude.where;
              if (fileWhere?.isDeleted === false || fileWhere?.deletedAt === null) {
                fileQuery = fileQuery.eq("isDeleted", false);
              }

              const { data: fileRows } = await fileQuery;
              files = (fileRows || []).map((file) => ({
                ...file,
                uploadedAt: new Date(String(file.uploadedAt)),
              }));

              if (fileInclude.orderBy?.filePath === "asc") {
                files.sort((a, b) =>
                  String(a.filePath).localeCompare(String(b.filePath))
                );
              }
            }

            result.result = {
              ...screeningResult,
              uploadedAt: new Date(String(screeningResult.uploadedAt)),
              files,
            };
          }
        }

        return result;
      },

      findFirst: async ({ where, select }: any = {}) => {
        if (!where?.id) return null;

        const { data, error } = await supabase
          .from("Appointment")
          .select(select ? Object.keys(select).join(",") : "*")
          .eq("id", where.id)
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;
        return data || null;
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
        if (data.appointmentDateTime !== undefined) {
          updates.appointmentDateTime =
            data.appointmentDateTime instanceof Date
              ? data.appointmentDateTime.toISOString()
              : data.appointmentDateTime;
        }
        if (data.kitId !== undefined) updates.kitId = data.kitId;
        if (data.checkInCode !== undefined) updates.checkInCode = data.checkInCode;
        if (data.checkInCodeExpiresAt !== undefined) {
          updates.checkInCodeExpiresAt =
            data.checkInCodeExpiresAt instanceof Date
              ? data.checkInCodeExpiresAt.toISOString()
              : data.checkInCodeExpiresAt;
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

      create: async ({ data, include }: any) => {
        const appointmentId = data.id || crypto.randomUUID();
        const { data: appointment, error } = await supabase
          .from('Appointment')
          .insert({
            id: appointmentId,
            patientId: data.patientId,
            centerId: data.centerId,
            screeningTypeId: data.screeningTypeId,
            donationId: data.donationId ?? null,
            isDonation: data.isDonation ?? false,
            appointmentDateTime:
              data.appointmentDateTime instanceof Date
                ? data.appointmentDateTime.toISOString()
                : data.appointmentDateTime,
            transactionId: data.transactionId ?? null,
            status: data.status,
            basePriceSnapshot: data.basePriceSnapshot ?? null,
            retailPriceSnapshot: data.retailPriceSnapshot ?? null,
            checkInCode: data.checkInCode ?? null,
            checkInCodeExpiresAt: data.checkInCodeExpiresAt
              ? data.checkInCodeExpiresAt instanceof Date
                ? data.checkInCodeExpiresAt.toISOString()
                : data.checkInCodeExpiresAt
              : null,
          })
          .select()
          .single();

        if (error) throw error;

        const result: Record<string, unknown> = {
          ...appointment,
          appointmentDateTime: new Date(String(appointment.appointmentDateTime)),
          createdAt: new Date(String(appointment.createdAt)),
          checkInCodeExpiresAt: appointment.checkInCodeExpiresAt
            ? new Date(String(appointment.checkInCodeExpiresAt))
            : null,
        };

        if (include?.transaction && data.transactionId) {
          const { data: transaction } = await supabase
            .from('Transaction')
            .select('*')
            .eq('id', data.transactionId)
            .single();
          result.transaction = transaction || null;
        }

        if (include?.center) {
          const { data: center } = await supabase
            .from('ServiceCenter')
            .select('*')
            .eq('id', data.centerId)
            .single();
          result.center = center || null;
        }

        if (include?.screeningType) {
          const { data: screeningType } = await supabase
            .from('ScreeningType')
            .select('*')
            .eq('id', data.screeningTypeId)
            .single();
          result.screeningType = screeningType || null;
        }

        result.result = include?.result ? null : undefined;
        return result;
      },
    },

    appointmentVerification: {
      create: async ({ data }: any = {}) => {
        const verificationId = crypto.randomUUID();

        const { data: verification, error } = await supabase
          .from("AppointmentVerification")
          .insert({
            id: verificationId,
            appointmentId: data.appointmentId,
            verifiedBy: data.verifiedBy ?? null,
            verifiedAt: data.verifiedAt
              ? data.verifiedAt instanceof Date
                ? data.verifiedAt.toISOString()
                : data.verifiedAt
              : new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        return {
          ...verification,
          verifiedAt: new Date(String(verification.verifiedAt)),
        };
      },
      findFirst: async ({ where }: any = {}) => {
        let query = supabase.from("AppointmentVerification").select("*");
        if (where?.appointmentId) query = query.eq("appointmentId", where.appointmentId);
        const { data, error } = await query.limit(1).maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return {
          ...data,
          verifiedAt: new Date(String(data.verifiedAt)),
        };
      },
    },
    
    // Notification operations
    notification: {
      create: async ({ data }: any = {}) => {
        const notificationId = crypto.randomUUID();
        const now = new Date().toISOString();

        const { data: notification, error } = await supabase
          .from("Notification")
          .insert({
            id: notificationId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data
              ? typeof data.data === "string"
                ? data.data
                : JSON.stringify(data.data)
              : null,
            createdAt: now,
          })
          .select("*")
          .single();

        if (error) throw error;

        if (data.recipients?.create?.length) {
          const recipients = data.recipients.create.map(
            (recipient: { userId: string }) => ({
              id: crypto.randomUUID(),
              notificationId,
              userId: recipient.userId,
              read: false,
            })
          );

          const { error: recipientError } = await supabase
            .from("NotificationRecipient")
            .insert(recipients);

          if (recipientError) throw recipientError;
        }

        return notification;
      },
    },

    notificationRecipient: {
      findMany: async ({ where, include, orderBy }: any = {}) => {
        let query = supabase.from('NotificationRecipient').select('*');
        
        if (where?.userId) query = query.eq('userId', where.userId);
        
        if (orderBy) {
          // Handle orderBy if needed
        }
        
        const { data, error } = await query;
        if (error) throw error;

        if (!include?.notification) {
          return data || [];
        }

        const notificationIds = [
          ...new Set((data || []).map((row) => row.notificationId as string)),
        ];
        const { data: notifications } = notificationIds.length
          ? await supabase.from("Notification").select("*").in("id", notificationIds)
          : { data: [] };

        const notificationsById = new Map(
          (notifications || []).map((notification) => {
            let parsedData: unknown = notification.data;
            if (typeof notification.data === "string") {
              try {
                parsedData = JSON.parse(notification.data);
              } catch {
                parsedData = null;
              }
            }
            return [
              notification.id as string,
              {
                ...notification,
                data: parsedData,
                createdAt: new Date(String(notification.createdAt)),
              },
            ];
          })
        );

        return (data || []).map((recipient) => ({
          ...recipient,
          readAt: recipient.readAt ? new Date(String(recipient.readAt)) : null,
          notification: notificationsById.get(recipient.notificationId as string) || null,
        }));
      },

      updateMany: async ({ where, data }: any = {}) => {
        let query = supabase.from("NotificationRecipient").update(data);
        if (where?.userId) query = query.eq("userId", where.userId);
        if (where?.id?.in?.length) query = query.in("id", where.id.in);
        if (where?.read === false) query = query.eq("read", false);
        const { error } = await query;
        if (error) throw error;
        return { count: where?.id?.in?.length ?? 0 };
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
      findUnique: async ({ where, include }: any = {}) => {
        let query = supabase.from("DonationAllocation").select("*");

        if (where?.waitlistId) query = query.eq("waitlistId", where.waitlistId);
        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.campaignId) query = query.eq("campaignId", where.campaignId);
        if (where?.id) query = query.eq("id", where.id);
        if (where?.claimedAt === null) query = query.is("claimedAt", null);

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      findFirst: async ({ where, include }: any = {}) => {
        let query = supabase.from("DonationAllocation").select("*");

        if (where?.waitlistId) query = query.eq("waitlistId", where.waitlistId);
        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.campaignId) query = query.eq("campaignId", where.campaignId);
        if (where?.id) query = query.eq("id", where.id);
        if (where?.claimedAt === null) query = query.is("claimedAt", null);

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        return data;
      },

      count: async ({ where }: any = {}) => {
        let query = supabase
          .from("DonationAllocation")
          .select("*", { count: "exact", head: true });

        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.campaignId) query = query.eq("campaignId", where.campaignId);
        if (where?.claimedAt === null) query = query.is("claimedAt", null);

        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },

      create: async ({ data }: any = {}) => {
        const row = {
          id: data.id || crypto.randomUUID(),
          waitlistId: data.waitlistId,
          patientId: data.patientId,
          campaignId: data.campaignId,
          appointmentId: data.appointmentId ?? null,
          claimedAt: data.claimedAt ?? null,
          matchingExecutionId: data.matchingExecutionId ?? null,
          amountAllocated: data.amountAllocated ?? null,
          createdViaMatching: data.createdViaMatching ?? false,
        };

        const { data: created, error } = await supabase
          .from("DonationAllocation")
          .insert(row)
          .select("*")
          .single();

        if (error) throw error;
        return created;
      },

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

      create: async ({ data }: any) => {
        const { data: transaction, error } = await supabase
          .from("Transaction")
          .insert({
            id: data.id || crypto.randomUUID(),
            type: data.type,
            status: data.status,
            amount: data.amount,
            paymentReference: data.paymentReference ?? null,
            paymentChannel: data.paymentChannel ?? null,
            relatedDonationId: data.relatedDonationId ?? null,
          })
          .select()
          .single();

        if (error) throw error;
        return {
          ...transaction,
          createdAt: new Date(String(transaction.createdAt)),
        };
      },

      findFirst: async ({ where }: any = {}) => {
        let query = supabase.from("Transaction").select("*");
        if (where?.paymentReference) {
          query = query.eq("paymentReference", where.paymentReference);
        }
        if (where?.type) {
          query = query.eq("type", where.type);
        }
        if (where?.status) {
          query = query.eq("status", where.status);
        }

        const { data, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!data) return null;

        return {
          ...data,
          createdAt: new Date(String(data.createdAt)),
        };
      },

      updateMany: async ({ where, data }: any) => {
        const updates: Record<string, unknown> = {};
        if (data.status !== undefined) updates.status = data.status;
        if (data.paymentChannel !== undefined) {
          updates.paymentChannel = data.paymentChannel;
        }

        if (Object.keys(updates).length === 0) {
          return { count: 0 };
        }

        let query = supabase.from("Transaction").update(updates);
        if (where?.paymentReference) {
          query = query.eq("paymentReference", where.paymentReference);
        }
        if (where?.id?.in?.length) {
          query = query.in("id", where.id.in);
        }

        const { data: updatedRows, error } = await query.select("id");
        if (error) throw error;
        return { count: updatedRows?.length ?? 0 };
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

    screeningResult: {
      upsert: async ({ where, create, update }: any) => {
        const appointmentId = where.appointmentId;
        const { data: existing, error: existingError } = await supabase
          .from("ScreeningResult")
          .select("*")
          .eq("appointmentId", appointmentId)
          .maybeSingle();

        if (existingError && existingError.code !== "PGRST116") {
          throw existingError;
        }

        if (existing) {
          const updatePayload: Record<string, unknown> = {};
          if (update.notes !== undefined) updatePayload.notes = update.notes;
          if (update.uploadedBy !== undefined) {
            updatePayload.uploadedBy = update.uploadedBy;
          }
          if (update.uploadedAt !== undefined) {
            updatePayload.uploadedAt =
              update.uploadedAt instanceof Date
                ? update.uploadedAt.toISOString()
                : update.uploadedAt;
          }

          const { data: updated, error } = await supabase
            .from("ScreeningResult")
            .update(updatePayload)
            .eq("id", existing.id)
            .select()
            .single();

          if (error) throw error;
          return {
            ...updated,
            uploadedAt: new Date(String(updated.uploadedAt)),
          };
        }

        const { data: created, error } = await supabase
          .from("ScreeningResult")
          .insert({
            id: crypto.randomUUID(),
            appointmentId: create.appointmentId,
            notes: create.notes ?? null,
            uploadedBy: create.uploadedBy ?? null,
          })
          .select()
          .single();

        if (error) throw error;
        return {
          ...created,
          uploadedAt: new Date(String(created.uploadedAt)),
        };
      },

      findFirst: async ({ where, include }: any = {}) => {
        let appointmentIds: string[] | null = null;

        if (where?.appointmentId) {
          appointmentIds = [where.appointmentId];
        } else if (where?.id) {
          const { data: row } = await supabase
            .from("ScreeningResult")
            .select("appointmentId")
            .eq("id", where.id)
            .maybeSingle();
          if (!row) return null;
          appointmentIds = [row.appointmentId];
        } else if (where?.appointment?.patientId) {
          const { data: appointments } = await supabase
            .from("Appointment")
            .select("id")
            .eq("patientId", where.appointment.patientId);
          appointmentIds = (appointments || []).map((row) => row.id);
          if (appointmentIds.length === 0) return null;
        }

        let query = supabase.from("ScreeningResult").select("*");
        if (where?.id) query = query.eq("id", where.id);
        else if (where?.appointmentId) {
          query = query.eq("appointmentId", where.appointmentId);
        } else if (appointmentIds) {
          query = query.in("appointmentId", appointmentIds);
        }

        const { data: screeningResult, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!screeningResult) return null;

        if (where?.appointment?.patientId) {
          const { data: appointment } = await supabase
            .from("Appointment")
            .select("patientId")
            .eq("id", screeningResult.appointmentId)
            .maybeSingle();
          if (appointment?.patientId !== where.appointment.patientId) {
            return null;
          }
        }

        const enriched: Record<string, unknown> = {
          ...screeningResult,
          uploadedAt: new Date(String(screeningResult.uploadedAt)),
        };

        if (include?.files) {
          let fileQuery = supabase
            .from("ScreeningResultFile")
            .select("*")
            .eq("resultId", screeningResult.id);

          const fileWhere = include.files.where;
          if (fileWhere?.isDeleted === false || fileWhere?.deletedAt === null) {
            fileQuery = fileQuery.eq("isDeleted", false);
          }

          const { data: files } = await fileQuery;
          let fileRows = (files || []).map((file) => ({
            ...file,
            uploadedAt: new Date(String(file.uploadedAt)),
          }));

          if (include.files.orderBy?.filePath === "asc") {
            fileRows = fileRows.sort((a, b) =>
              String(a.filePath).localeCompare(String(b.filePath))
            );
          }

          enriched.files = fileRows;
        }

        if (include?.appointment) {
          const { data: appointment } = await supabase
            .from("Appointment")
            .select(
              include.appointment.select
                ? Object.keys(include.appointment.select).join(",")
                : "*"
            )
            .eq("id", screeningResult.appointmentId)
            .maybeSingle();

          const appointmentResult: Record<string, unknown> = appointment
            ? {
                ...appointment,
                appointmentDateTime: new Date(
                  String(appointment.appointmentDateTime)
                ),
              }
            : null;

          if (appointment && include.appointment.select?.screeningType) {
            const { data: screeningType } = await supabase
              .from("ScreeningType")
              .select(
                Object.keys(
                  include.appointment.select.screeningType.select || {
                    id: true,
                    name: true,
                  }
                ).join(",")
              )
              .eq("id", appointment.screeningTypeId)
              .maybeSingle();
            appointmentResult!.screeningType = screeningType;
          }

          if (appointment && include.appointment.select?.center) {
            const { data: center } = await supabase
              .from("ServiceCenter")
              .select(
                Object.keys(
                  include.appointment.select.center.select || {
                    id: true,
                    centerName: true,
                  }
                ).join(",")
              )
              .eq("id", appointment.centerId)
              .maybeSingle();
            appointmentResult!.center = center;
          }

          enriched.appointment = appointmentResult;
        }

        return enriched;
      },

      findMany: async ({ where, skip, take, orderBy, include }: any = {}) => {
        let appointmentIds: string[] | null = null;

        if (where?.appointment?.patientId) {
          const { data: appointments } = await supabase
            .from("Appointment")
            .select("id")
            .eq("patientId", where.appointment.patientId);
          appointmentIds = (appointments || []).map((row) => row.id);
          if (appointmentIds.length === 0) return [];
        }

        let query = supabase.from("ScreeningResult").select("*");
        if (appointmentIds) query = query.in("appointmentId", appointmentIds);

        if (orderBy?.uploadedAt === "desc") {
          query = query.order("uploadedAt", { ascending: false });
        } else if (orderBy?.uploadedAt === "asc") {
          query = query.order("uploadedAt", { ascending: true });
        }

        if (skip !== undefined && take !== undefined) {
          query = query.range(skip, skip + take - 1);
        } else if (take !== undefined) {
          query = query.limit(take);
        }

        const { data: results, error } = await query;
        if (error) throw error;

        return Promise.all(
          (results || []).map(async (screeningResult) => {
            const enriched: Record<string, unknown> = {
              ...screeningResult,
              uploadedAt: new Date(String(screeningResult.uploadedAt)),
            };

            if (include?.files) {
              const { data: files } = await supabase
                .from("ScreeningResultFile")
                .select("*")
                .eq("resultId", screeningResult.id)
                .eq("isDeleted", false);

              enriched.files = (files || []).map((file) => ({
                ...file,
                uploadedAt: new Date(String(file.uploadedAt)),
              }));
            }

            if (include?.appointment) {
              const { data: appointment } = await supabase
                .from("Appointment")
                .select("*")
                .eq("id", screeningResult.appointmentId)
                .maybeSingle();

              const appointmentResult: Record<string, unknown> | null = appointment
                ? {
                    ...appointment,
                    appointmentDateTime: new Date(
                      String(appointment.appointmentDateTime)
                    ),
                  }
                : null;

              if (appointment && include.appointment.select?.screeningType) {
                const { data: screeningType } = await supabase
                  .from("ScreeningType")
                  .select("id,name")
                  .eq("id", appointment.screeningTypeId)
                  .maybeSingle();
                appointmentResult!.screeningType = screeningType;
              }

              if (appointment && include.appointment.select?.center) {
                const { data: center } = await supabase
                  .from("ServiceCenter")
                  .select("id,centerName")
                  .eq("id", appointment.centerId)
                  .maybeSingle();
                appointmentResult!.center = center;
              }

              enriched.appointment = appointmentResult;
            }

            return enriched;
          })
        );
      },

      count: async ({ where }: any = {}) => {
        if (where?.appointment?.patientId) {
          const { data: appointments } = await supabase
            .from("Appointment")
            .select("id")
            .eq("patientId", where.appointment.patientId);
          const appointmentIds = (appointments || []).map((row) => row.id);
          if (appointmentIds.length === 0) return 0;

          const { count, error } = await supabase
            .from("ScreeningResult")
            .select("*", { count: "exact", head: true })
            .in("appointmentId", appointmentIds);
          if (error) throw error;
          return count || 0;
        }

        const { count, error } = await supabase
          .from("ScreeningResult")
          .select("*", { count: "exact", head: true });
        if (error) throw error;
        return count || 0;
      },
    },

    screeningResultFile: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        if (!data.length) return { count: 0 };

        const rows = data.map((file) => ({
          id: crypto.randomUUID(),
          resultId: file.resultId,
          fileName: file.fileName,
          filePath: file.filePath,
          fileType: file.fileType,
          fileSize: file.fileSize,
          cloudinaryUrl: file.cloudinaryUrl,
          cloudinaryId: file.cloudinaryId,
        }));

        const { data: created, error } = await supabase
          .from("ScreeningResultFile")
          .insert(rows)
          .select("id");

        if (error) throw error;
        return { count: created?.length ?? 0 };
      },
    },

    centerEnrollmentRequest: {
      create: async ({ data, include }: any = {}) => {
        const { data: request, error } = await supabase
          .from("CenterEnrollmentRequest")
          .insert({
            id: crypto.randomUUID(),
            patientId: data.patientId,
            centerId: data.centerId,
            screeningTypeId: data.screeningTypeId,
            status: data.status ?? "PENDING",
            message: data.message ?? null,
          })
          .select()
          .single();

        if (error) throw error;

        const enriched: Record<string, unknown> = {
          ...request,
          requestedAt: new Date(String(request.requestedAt)),
          respondedAt: request.respondedAt
            ? new Date(String(request.respondedAt))
            : null,
        };

        if (include?.center) {
          const { data: center } = await supabase
            .from("ServiceCenter")
            .select(
              include.center.select
                ? Object.keys(include.center.select).join(",")
                : "id,centerName"
            )
            .eq("id", request.centerId)
            .maybeSingle();
          enriched.center = center;
        }

        if (include?.screeningType) {
          const { data: screeningType } = await supabase
            .from("ScreeningType")
            .select(
              include.screeningType.select
                ? Object.keys(include.screeningType.select).join(",")
                : "id,name"
            )
            .eq("id", request.screeningTypeId)
            .maybeSingle();
          enriched.screeningType = screeningType;
        }

        return enriched;
      },

      findFirst: async ({ where, include }: any = {}) => {
        let query = supabase.from("CenterEnrollmentRequest").select("*");
        if (where?.id) query = query.eq("id", where.id);
        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.screeningTypeId) {
          query = query.eq("screeningTypeId", where.screeningTypeId);
        }
        if (where?.status) query = query.eq("status", where.status);

        const { data: request, error } = await query.limit(1).maybeSingle();
        if (error && error.code !== "PGRST116") throw error;
        if (!request) return null;

        const enriched: Record<string, unknown> = {
          ...request,
          requestedAt: new Date(String(request.requestedAt)),
          respondedAt: request.respondedAt
            ? new Date(String(request.respondedAt))
            : null,
        };

        if (include?.center) {
          const { data: center } = await supabase
            .from("ServiceCenter")
            .select(
              include.center.select
                ? Object.keys(include.center.select).join(",")
                : "id,centerName,address,state,lga"
            )
            .eq("id", request.centerId)
            .maybeSingle();
          enriched.center = center;
        }

        if (include?.screeningType) {
          const { data: screeningType } = await supabase
            .from("ScreeningType")
            .select(
              include.screeningType.select
                ? Object.keys(include.screeningType.select).join(",")
                : "id,name"
            )
            .eq("id", request.screeningTypeId)
            .maybeSingle();
          enriched.screeningType = screeningType;
        }

        return enriched;
      },

      findMany: async ({ where, orderBy, include }: any = {}) => {
        let query = supabase.from("CenterEnrollmentRequest").select("*");
        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.status) query = query.eq("status", where.status);

        if (orderBy?.requestedAt === "desc") {
          query = query.order("requestedAt", { ascending: false });
        } else if (orderBy?.requestedAt === "asc") {
          query = query.order("requestedAt", { ascending: true });
        }

        const { data: requests, error } = await query;
        if (error) throw error;

        return Promise.all(
          (requests || []).map(async (request) => {
            const enriched: Record<string, unknown> = {
              ...request,
              requestedAt: new Date(String(request.requestedAt)),
              respondedAt: request.respondedAt
                ? new Date(String(request.respondedAt))
                : null,
            };

            if (include?.center) {
              const { data: center } = await supabase
                .from("ServiceCenter")
                .select(
                  include.center.select
                    ? Object.keys(include.center.select).join(",")
                    : "id,centerName,address,state,lga"
                )
                .eq("id", request.centerId)
                .maybeSingle();
              enriched.center = center;
            }

            if (include?.screeningType) {
              const { data: screeningType } = await supabase
                .from("ScreeningType")
                .select(
                  include.screeningType.select
                    ? Object.keys(include.screeningType.select).join(",")
                    : "id,name"
                )
                .eq("id", request.screeningTypeId)
                .maybeSingle();
              enriched.screeningType = screeningType;
            }

            if (include?.patient) {
              const { data: patient } = await supabase
                .from("User")
                .select(
                  include.patient.select
                    ? Object.keys(include.patient.select).join(",")
                    : "id,fullName,email,phone"
                )
                .eq("id", request.patientId)
                .maybeSingle();
              enriched.patient = patient;
            }

            return enriched;
          })
        );
      },

      count: async ({ where }: any = {}) => {
        let query = supabase
          .from("CenterEnrollmentRequest")
          .select("*", { count: "exact", head: true });
        if (where?.patientId) query = query.eq("patientId", where.patientId);
        if (where?.centerId) query = query.eq("centerId", where.centerId);
        if (where?.status) query = query.eq("status", where.status);
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
      },

      update: async ({ where, data }: any) => {
        const updates: Record<string, unknown> = {};
        if (data.status !== undefined) updates.status = data.status;
        if (data.respondedAt !== undefined) {
          updates.respondedAt =
            data.respondedAt instanceof Date
              ? data.respondedAt.toISOString()
              : data.respondedAt;
        }

        let updateQuery = supabase
          .from("CenterEnrollmentRequest")
          .update(updates)
          .eq("id", where.id);
        if (where.status) {
          updateQuery = updateQuery.eq("status", where.status);
        }

        const { data: request, error } = await updateQuery.select().maybeSingle();

        if (error) throw error;
        if (!request) return null;
        return {
          ...request,
          requestedAt: new Date(String(request.requestedAt)),
          respondedAt: request.respondedAt
            ? new Date(String(request.respondedAt))
            : null,
        };
      },
    },

    $transaction: async (fn: (tx: ReturnType<typeof getDB>) => Promise<unknown>) => {
      return fn(getDB(c));
    },
  };
};

export type TDB = ReturnType<typeof getDB>;
