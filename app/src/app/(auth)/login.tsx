import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { semanticColors } from '@/design-system/tokens';
import { useNetworkStatus } from '@/lib/network-status';
import { authStyles as styles } from '@/module/auth/styles/auth.styles';
import { useLoginViewModel } from '@/module/auth/view-models/use-login-view-model';

export default function LoginScreen() {
  const viewModel = useLoginViewModel();
  const { isConnected } = useNetworkStatus();
  const isBusy = viewModel.status === 'submitting' || viewModel.status === 'authenticating';
  const isSubmitDisabled = isBusy || !isConnected;

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
          editable={!isSubmitDisabled}
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
          disabled={isSubmitDisabled}
          onPress={viewModel.submitEmail}
          style={[styles.button, isSubmitDisabled && styles.disabled]}
          testID="login-magic-link-button">
          {isBusy ? <ActivityIndicator color={semanticColors.brandOn} /> : <Text style={styles.buttonText}>Enviar link mágico</Text>}
        </Pressable>
        {!isConnected && (
          <Text style={[styles.feedback, styles.error]} testID="login-offline-message">
            Sem conexão. O login fica disponível assim que a internet voltar.
          </Text>
        )}
        {isConnected && viewModel.status === 'sent' && <Text style={styles.feedback}>Confira seu e-mail para continuar.</Text>}
        {isConnected && viewModel.error && <Text style={[styles.feedback, styles.error]}>{viewModel.error}</Text>}
        <View style={styles.divider} />
        <View style={styles.socialGroup}>
          {(['google', 'apple'] as const).map((provider) => (
            <Pressable
              accessibilityLabel={`Continuar com ${provider === 'google' ? 'Google' : 'Apple'}`}
              accessibilityRole="button"
              disabled={isSubmitDisabled}
              key={provider}
              onPress={() => viewModel.signInWithOAuth(provider)}
              style={[styles.button, styles.buttonSecondary, isSubmitDisabled && styles.disabled]}
              testID={`login-${provider}-button`}>
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Continuar com {provider === 'google' ? 'Google' : 'Apple'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
