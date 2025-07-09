import { create } from 'zustand';
import { produce } from 'immer';
import { CURRENT_VERSION } from '@/lib/constants';

const initialState = {
  current: CURRENT_VERSION,
  latest: null,
  hasUpdate: false,
  checked: false,
  releaseUrl: null,
};

const store = create(() => ({ ...initialState }));

export async function checkVersion() {
  // Disable update check for self-hosted Superlytics
  const { current } = store.getState();

  store.setState(
    produce(state => {
      state.current = current;
      state.latest = current;
      state.hasUpdate = false;
      state.checked = true;
      state.releaseUrl = null;

      return state;
    }),
  );
}

export default store;
