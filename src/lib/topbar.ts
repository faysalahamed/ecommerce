import { BRAND } from '@/lib/brand'

export interface TopbarConfig {
  enabled: boolean
  promoText: string
  promoTextMobile: string
  contactPhone: string
  trackOrderText: string
  helpText: string
  subBarFlashText: string
  subBarFreeDeliveryText: string
  showTrackOrder: boolean
  showHelp: boolean
  showContactPhone: boolean
  showFlashSaleBadge: boolean
  showFreeDeliveryBadge: boolean
}

export const DEFAULT_TOPBAR_CONFIG: TopbarConfig = {
  enabled: true,
  promoText: BRAND.promoBarText,
  promoTextMobile: `🎉 Welcome to ${BRAND.name}`,
  contactPhone: BRAND.contactPhone,
  trackOrderText: 'Track My Order',
  helpText: 'Help & Customer Care',
  subBarFlashText: '🔥 Flash Sale',
  subBarFreeDeliveryText: '🚚 Free Delivery Over ৳1,000',
  showTrackOrder: true,
  showHelp: true,
  showContactPhone: true,
  showFlashSaleBadge: true,
  showFreeDeliveryBadge: true,
}
