import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { semanticColors } from '@/design-system/tokens';
import { authStyles as styles } from '@/module/auth/styles/auth.styles';
import { useCompleteProfileViewModel } from '@/module/auth/view-models/use-complete-profile-view-model';

export default function CompleteProfileScreen() {
  const viewModel = useCompleteProfileViewModel();
  const isSubmitting = viewModel.status === 'submitting';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Só falta um detalhe</Text>
        <Text style={styles.title}>Como você quer ser chamada?</Text>
        <Text style={styles.description}>Seu nome deixa a experiência mais pessoal e pode ser alterado depois.</Text>
        <TextInput
          accessibilityLabel="Nome"
          autoCapitalize="words"
          editable={!isSubmitting}
          onChangeText={viewModel.setName}
          onSubmitEditing={viewModel.submitName}
          placeholder="Seu nome"
          placeholderTextColor={semanticColors.fgTertiary}
          style={styles.field}
          testID="complete-profile-name-input"
          value={viewModel.name}
        />
        {viewModel.error && <Text style={[styles.feedback, styles.error]}>{viewModel.error}</Text>}
        <Pressable
          accessibilityLabel="Salvar nome"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={viewModel.submitName}
          style={[styles.button, isSubmitting && styles.disabled]}
          testID="complete-profile-submit-button">
          {isSubmitting ? <ActivityIndicator color={semanticColors.brandOn} /> : <Text style={styles.buttonText}>Continuar</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
