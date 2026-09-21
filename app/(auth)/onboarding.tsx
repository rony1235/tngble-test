import { Redirect } from 'expo-router';

/** Legacy path; auth entry is `(auth)/index`. */
export default function OnboardingRedirect() {
  return <Redirect href="/(auth)" />;
}
