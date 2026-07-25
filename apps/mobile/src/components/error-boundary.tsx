import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

// Class components can't use hooks, and this screen renders above
// ThemeModeProvider (it exists specifically to catch errors from
// everything below it, including the theme provider itself) — so it
// always uses the dark palette directly rather than reacting to the
// user's theme preference. Acceptable since this is a rare crash-only
// fallback, not a normal navigable screen.
const theme = Colors.dark;

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app hit an unexpected error. Restarting the current screen may fix it.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: theme.background,
  },
  title: {
    fontFamily: Fonts.semiBold,
    fontSize: 20,
    color: theme.text,
  },
  message: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00FF87',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#000000',
  },
});
