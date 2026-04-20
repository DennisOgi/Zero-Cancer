// import * as t from '@zerocancer/shared/types'
import axios from 'axios'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency = 'NGN',
  notation: 'standard' | 'compact' = 'standard'
) {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  if (notation === 'compact' && amount >= 1000) {
    options.notation = 'compact';
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 1;
  }
  
  return new Intl.NumberFormat('en-NG', options).format(amount);
}

// export async function paginate<T>(
//   prismaQuery: () => Promise<T[]>,
//   prismaCount: () => Promise<number>,
//   { page = 1, limit = 20 }: t.TPaginationParams,
// ): Promise<t.TPaginatedResponse<T>> {
//   const skip = (page - 1) * limit

//   const [data, total] = await Promise.all([prismaQuery(), prismaCount()])

//   return {
//     data,
//     page,
//     limit,
//     total,
//     totalPages: Math.ceil(total / limit),
//   }
// }

export function setAcceptLanguageHeader(value: string): void {
  axios.defaults.headers.common['Accept-Language'] = value
}

export function setTokenHeader(token: string) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token
}
