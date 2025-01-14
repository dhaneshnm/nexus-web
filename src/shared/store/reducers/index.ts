import { StaticRouterProps } from 'react-router';
import { UserState } from 'redux-oidc';
import auth, { AuthState } from './auth';
import config, { ConfigState } from './config';
import nexus, { NexusState } from './nexus';
import rawQuery, {
  RawQueryState,
  rawElasticSearchQueryReducer,
  RawElasticSearchQueryState,
} from './rawQuery';
import lists, { ListsByProjectState } from './lists';
import uiSettingsReducer, { UISettingsState } from './ui-settings';

export interface RootState {
  auth: AuthState;
  config: ConfigState;
  nexus?: NexusState;
  lists?: ListsByProjectState;
  router?: StaticRouterProps;
  rawQuery?: RawQueryState;
  rawElasticSearchQuery?: RawElasticSearchQueryState;
  uiSettings: UISettingsState;
  oidc: UserState;
}

export default {
  auth,
  config,
  nexus,
  rawQuery,
  lists,
  rawElasticSearchQuery: rawElasticSearchQueryReducer,
  uiSettings: uiSettingsReducer,
};
