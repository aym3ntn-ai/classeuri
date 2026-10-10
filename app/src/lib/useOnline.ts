import { useNetworkState } from 'expo-network';

/** False only when the device reports no connection; unknown counts as online. */
export function useOnline(): boolean {
  const state = useNetworkState();
  return state.isConnected !== false && state.isInternetReachable !== false;
}
