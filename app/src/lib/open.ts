import type { CatalogDocument } from '@classeuri/shared';
import * as Network from 'expo-network';
import { router } from 'expo-router';
import { t } from '@/i18n';
import { useDownloads } from '@/store/downloads';
import { toast } from '@/store/toast';
import { variantRef, type Variant } from './catalog';

/** Opens the viewer, unless the file is neither on the phone nor reachable. */
export async function openDocument(doc: CatalogDocument, variant: Variant = 'sheet') {
  const onPhone = variantRef(doc, variant).path in useDownloads.getState().files;
  if (!onPhone) {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected === false) {
      toast(t.errors.offlineNotDownloaded);
      return;
    }
  }
  router.push({ pathname: '/viewer', params: { id: doc.id, variant } });
}
