import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { semanticColors } from '@/design-system/tokens';
import { authStyles as styles } from '@/module/auth/styles/auth.styles';
import { useLoginViewModel } from '@/module/auth/view-models/use-login-view-model';

export default function LoginScreen() {
  const viewModel = useLoginViewModel();
  const isBusy = viewModel.status === 'submitting' || viewModel.status === 'authenticating';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Suliv</Text>
        <Text style={styles.title}>Cozinhar começa com um convite.</Text>
        <Text style={styles.description}>Entre para guardar receitas e construir seu ritmo na cozinha.</Text>
        <TextInput
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isBusy}
          keyboardType="email-address"
          onChangeText={viewModel.setEmail}
          onSubmitEditing={viewModel.submitEmail}
          placeholder="voce@exemplo.com"
          placeholderTextColor={semanticColors.fgTertiary}
          style={styles.field}
          testID="login-email-input"
          value={viewModel.email}
        />
        <Pressable
          accessibilityLabel="Enviar link mágico"
          accessibilityRole="button"
          disabled={isBusy}
          onPress={viewModel.submitEmail}
          style={[styles.button, isBusy && styles.disabled]}
          testID="login-magic-link-button">
          {isBusy ? <ActivityIndicator color={semanticColors.brandOn} /> : <Text style={styles.buttonText}>Enviar link mágico</Text>}
        </Pressable>
        {viewModel.status === 'sent' && <Text style={styles.feedback}>Confira seu e-mail para continuar.</Text>}
        {viewModel.error && <Text style={[styles.feedback, styles.error]}>{viewModel.error}</Text>}
        <View style={styles.divider} />
        <View style={styles.socialGroup}>
          {(['google', 'apple'] as const).map((provider) => (
            <Pressable
              accessibilityLabel={`Continuar com ${provider === 'google' ? 'Google' : 'Apple'}`}
              accessibilityRole="button"
              disabled={isBusy}
              key={provider}
              onPress={() => viewModel.signInWithOAuth(provider)}
              style={[styles.button, styles.buttonSecondary, isBusy && styles.disabled]}
              testID={`login-${provider}-button`}>
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Continuar com {provider === 'google' ? 'Google' : 'Apple'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
