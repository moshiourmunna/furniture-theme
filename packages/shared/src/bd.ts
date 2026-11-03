/** Bangladesh administrative divisions → districts (64). */
export const BD_DIVISIONS: { en: string; bn: string; districts: string[] }[] = [
  { en: 'Dhaka', bn: 'ঢাকা', districts: ['Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Munshiganj', 'Manikganj', 'Tangail', 'Kishoreganj', 'Faridpur', 'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur'] },
  { en: 'Chattogram', bn: 'চট্টগ্রাম', districts: ['Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Noakhali', 'Lakshmipur', 'Chandpur', 'Brahmanbaria', 'Rangamati', 'Khagrachhari', 'Bandarban'] },
  { en: 'Sylhet', bn: 'সিলেট', districts: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'] },
  { en: 'Rajshahi', bn: 'রাজশাহী', districts: ['Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Natore', 'Naogaon', 'Chapainawabganj', 'Joypurhat'] },
  { en: 'Khulna', bn: 'খুলনা', districts: ['Khulna', 'Jashore', 'Satkhira', 'Bagerhat', 'Kushtia', 'Jhenaidah', 'Magura', 'Narail', 'Chuadanga', 'Meherpur'] },
  { en: 'Barishal', bn: 'বরিশাল', districts: ['Barishal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Barguna', 'Jhalokati'] },
  { en: 'Rangpur', bn: 'রংপুর', districts: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 'Lalmonirhat', 'Thakurgaon', 'Panchagarh'] },
  { en: 'Mymensingh', bn: 'ময়মনসিংহ', districts: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'] },
];
export const ALL_DISTRICTS = BD_DIVISIONS.flatMap((d) => d.districts);
export const BD_PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;
/** Normalise a BD mobile number to 01XXXXXXXXX (strips +88, spaces, dashes). */
export function normalizePhone(p: string): string {
  const digits = p.replace(/[^\d]/g, '');
  return digits.startsWith('88') && digits.length === 13 ? digits.slice(2) : digits;
}
