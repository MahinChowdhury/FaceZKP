import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

export default function App() {
  return null; // expo-router handles the app rendering
} 