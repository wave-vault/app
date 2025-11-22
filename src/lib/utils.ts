import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Address } from "viem"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: Address | string | undefined): string {
  if (!address) return ''
  // Show first 5 and last 4 characters
  return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`
}
