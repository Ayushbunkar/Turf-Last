import { useLocale } from '../context/LocaleContext';

export default function usePrice(originalAmountInINR) {
  const { convertPrice, formatPrice } = useLocale();
  const converted = convertPrice(originalAmountInINR);
  const formatted = formatPrice(converted);
  return { converted, formatted };
}
