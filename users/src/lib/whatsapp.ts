/** wa.me link for a phone number in any format ("+234 814 083 3872" → 2348140833872). */
export function whatsappLink(number: string, message?: string): string | null {
  const digits = (number || '').replace(/\D/g, '');
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
