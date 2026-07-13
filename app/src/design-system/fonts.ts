import {
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
} from '@expo-google-fonts/fraunces';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
} from '@expo-google-fonts/inter-tight';
import { useFonts } from 'expo-font';

export function useSulivFonts() {
  return useFonts({
    Fraunces_500Medium,
    Fraunces_400Regular_Italic,
    InstrumentSerif_400Regular_Italic,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
  });
}
