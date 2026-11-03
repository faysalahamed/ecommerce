export type DeliveryChannelType = 'HOME_DELIVERY' | 'DELIVERY_HUB'

export interface DeliveryLocation {
  id: string
  name: string
  division: string
  homeDeliveryCharge: number
  hubDeliveryCharge: number
  estimatedDaysHome: string
  estimatedDaysHub: string
  inHouseDeliveryAvailable: boolean
  hubPickupAvailable: boolean
  codAvailable: boolean
  active: boolean
}

export interface DeliveryHub {
  id: string
  name: string
  code: string
  locationName: string
  division: string
  address: string
  phone: string
  managerName?: string
  operatingHours: string
  fee: number
  active: boolean
}

export interface DeliveryConfig {
  defaultAddress: string
  defaultHomeDeliveryFee: number
  defaultHubDeliveryFee: number
  freeDeliveryThreshold: number
  customerCareHotline: string
  inHouseFleetName: string
  standardFee: number
  estimatedDays: string
  codAvailable: boolean
  returnPolicyDefault: string
  changeOfMindApplicable: boolean
  authenticProductText: string
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  defaultAddress: 'Dhaka, Dhaka North, Banani Road No. 12 - 19',
  defaultHomeDeliveryFee: 90, // Customer home delivery default 90 BDT as requested
  defaultHubDeliveryFee: 40,
  freeDeliveryThreshold: 1500,
  customerCareHotline: '+880 9612-345678',
  inHouseFleetName: 'ShopZilla In-House Express Fleet',
  standardFee: 90,
  estimatedDays: 'Guaranteed within 1-2 days',
  codAvailable: true,
  returnPolicyDefault: '14 days easy return',
  changeOfMindApplicable: true,
  authenticProductText: '100% Authentic Product',
}

export const DEFAULT_DELIVERY_LOCATIONS: DeliveryLocation[] = [
  {
    id: 'loc_dhaka_city',
    name: 'Dhaka City (Inside Dhaka)',
    division: 'Dhaka',
    homeDeliveryCharge: 90, // Explicitly 90 BDT as requested
    hubDeliveryCharge: 40,
    estimatedDaysHome: '1-2 Days (In-House Fleet)',
    estimatedDaysHub: '1-2 Days (Pickup Hub)',
    inHouseDeliveryAvailable: true,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_dhaka_suburbs',
    name: 'Dhaka Suburbs (Gazipur, Savar, Narayanganj, Keraniganj)',
    division: 'Dhaka',
    homeDeliveryCharge: 110,
    hubDeliveryCharge: 50,
    estimatedDaysHome: '2-3 Days (In-House Fleet)',
    estimatedDaysHub: '1-2 Days',
    inHouseDeliveryAvailable: true,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_chittagong',
    name: 'Chittagong City',
    division: 'Chittagong',
    homeDeliveryCharge: 120,
    hubDeliveryCharge: 50,
    estimatedDaysHome: '2-3 Days (In-House Fleet)',
    estimatedDaysHub: '2 Days',
    inHouseDeliveryAvailable: true,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_sylhet',
    name: 'Sylhet City',
    division: 'Sylhet',
    homeDeliveryCharge: 130,
    hubDeliveryCharge: 60,
    estimatedDaysHome: '2-4 Days (In-House Fleet)',
    estimatedDaysHub: '2-3 Days',
    inHouseDeliveryAvailable: true,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_rajshahi',
    name: 'Rajshahi City',
    division: 'Rajshahi',
    homeDeliveryCharge: 130,
    hubDeliveryCharge: 60,
    estimatedDaysHome: '3-4 Days (Partner Courier)',
    estimatedDaysHub: '2-3 Days',
    inHouseDeliveryAvailable: false,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_khulna',
    name: 'Khulna City',
    division: 'Khulna',
    homeDeliveryCharge: 130,
    hubDeliveryCharge: 60,
    estimatedDaysHome: '3-4 Days (Partner Courier)',
    estimatedDaysHub: '2-3 Days',
    inHouseDeliveryAvailable: false,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_barisal',
    name: 'Barisal City',
    division: 'Barisal',
    homeDeliveryCharge: 140,
    hubDeliveryCharge: 70,
    estimatedDaysHome: '3-5 Days (Partner Courier)',
    estimatedDaysHub: '2-4 Days',
    inHouseDeliveryAvailable: false,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_rangpur',
    name: 'Rangpur City',
    division: 'Rangpur',
    homeDeliveryCharge: 140,
    hubDeliveryCharge: 70,
    estimatedDaysHome: '3-5 Days (Partner Courier)',
    estimatedDaysHub: '2-4 Days',
    inHouseDeliveryAvailable: false,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_mymensingh',
    name: 'Mymensingh City',
    division: 'Mymensingh',
    homeDeliveryCharge: 120,
    hubDeliveryCharge: 50,
    estimatedDaysHome: '2-3 Days (In-House Fleet)',
    estimatedDaysHub: '2 Days',
    inHouseDeliveryAvailable: true,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
  {
    id: 'loc_nationwide',
    name: 'Other Districts / Nationwide',
    division: 'Nationwide',
    homeDeliveryCharge: 150,
    hubDeliveryCharge: 80,
    estimatedDaysHome: '3-6 Days (Partner Courier)',
    estimatedDaysHub: '3-5 Days',
    inHouseDeliveryAvailable: false,
    hubPickupAvailable: true,
    codAvailable: true,
    active: true,
  },
]

export const DEFAULT_DELIVERY_HUBS: DeliveryHub[] = [
  {
    id: 'hub_banani',
    name: 'Banani Central Delivery Hub',
    code: 'HUB-DHK-BANANI',
    locationName: 'Dhaka City (Inside Dhaka)',
    division: 'Dhaka',
    address: 'House 45, Road 11, Block D, Banani, Dhaka-1213',
    phone: '+880 1711-000001',
    managerName: 'Arif Hossain',
    operatingHours: '9:00 AM - 8:30 PM (Sat - Thu)',
    fee: 40,
    active: true,
  },
  {
    id: 'hub_dhanmondi',
    name: 'Dhanmondi Express Hub',
    code: 'HUB-DHK-DHANMONDI',
    locationName: 'Dhaka City (Inside Dhaka)',
    division: 'Dhaka',
    address: 'House 28, Road 27 (Old) / 16 (New), Dhanmondi, Dhaka-1209',
    phone: '+880 1711-000002',
    managerName: 'Sabbir Ahmed',
    operatingHours: '9:00 AM - 8:30 PM (Sat - Thu)',
    fee: 40,
    active: true,
  },
  {
    id: 'hub_uttara',
    name: 'Uttara North Hub',
    code: 'HUB-DHK-UTTARA',
    locationName: 'Dhaka City (Inside Dhaka)',
    division: 'Dhaka',
    address: 'Plot 14, Sector 7, Sonargaon Janapath, Uttara, Dhaka-1230',
    phone: '+880 1711-000003',
    managerName: 'Tanvir Hasan',
    operatingHours: '9:00 AM - 8:30 PM (Sat - Thu)',
    fee: 40,
    active: true,
  },
  {
    id: 'hub_mirpur',
    name: 'Mirpur City Hub',
    code: 'HUB-DHK-MIRPUR',
    locationName: 'Dhaka City (Inside Dhaka)',
    division: 'Dhaka',
    address: 'Section 10, Mirpur Roundabout, Commercial Complex, Dhaka-1216',
    phone: '+880 1711-000004',
    managerName: 'Kamrul Islam',
    operatingHours: '9:00 AM - 8:30 PM (Sat - Thu)',
    fee: 40,
    active: true,
  },
  {
    id: 'hub_agrabad',
    name: 'Chittagong Agrabad Hub',
    code: 'HUB-CTG-AGRABAD',
    locationName: 'Chittagong City',
    division: 'Chittagong',
    address: '12 Commercial Area, Agrabad C/A, Chittagong-4100',
    phone: '+880 1711-000005',
    managerName: 'Nasir Uddin',
    operatingHours: '9:00 AM - 8:00 PM (Sat - Thu)',
    fee: 50,
    active: true,
  },
  {
    id: 'hub_sylhet',
    name: 'Sylhet City Center Hub',
    code: 'HUB-SYL-ZINDABAZAR',
    locationName: 'Sylhet City',
    division: 'Sylhet',
    address: 'Al-Hamra Shopping City, 2nd Floor, Zindabazar, Sylhet-3100',
    phone: '+880 1711-000006',
    managerName: 'Mofizur Rahman',
    operatingHours: '9:00 AM - 8:00 PM (Sat - Thu)',
    fee: 60,
    active: true,
  },
]

export function calculateDeliveryFee({
  location,
  channel,
  subtotal,
  config,
}: {
  location?: DeliveryLocation | null
  channel: DeliveryChannelType
  subtotal: number
  config?: Partial<DeliveryConfig> | null
}): {
  fee: number
  isFree: boolean
  channelLabel: string
  estimatedDays: string
} {
  const freeThreshold = config?.freeDeliveryThreshold ?? DEFAULT_DELIVERY_CONFIG.freeDeliveryThreshold
  if (freeThreshold > 0 && subtotal >= freeThreshold) {
    return {
      fee: 0,
      isFree: true,
      channelLabel: channel === 'HOME_DELIVERY' ? 'Home Delivery (Free Shipping Promo)' : 'Delivery Hub Pickup (Free)',
      estimatedDays: location
        ? (channel === 'HOME_DELIVERY' ? location.estimatedDaysHome : location.estimatedDaysHub)
        : '1-2 Days',
    }
  }

  if (channel === 'DELIVERY_HUB') {
    const fee = location?.hubDeliveryCharge ?? config?.defaultHubDeliveryFee ?? DEFAULT_DELIVERY_CONFIG.defaultHubDeliveryFee
    return {
      fee,
      isFree: false,
      channelLabel: 'Delivery Hub Pickup',
      estimatedDays: location?.estimatedDaysHub || '1-2 Days',
    }
  }

  // Home Delivery
  const fee = location?.homeDeliveryCharge ?? config?.defaultHomeDeliveryFee ?? DEFAULT_DELIVERY_CONFIG.defaultHomeDeliveryFee
  return {
    fee,
    isFree: false,
    channelLabel: location?.inHouseDeliveryAvailable ? 'In-House Home Delivery' : 'Home Delivery (Partner Courier)',
    estimatedDays: location?.estimatedDaysHome || '1-2 Days',
  }
}

