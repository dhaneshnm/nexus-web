import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ConnectedRouter } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { createNexusClient } from '@bbp/nexus-sdk';
import { NexusProvider } from '@bbp/react-nexus';
import { Link, Operation, Observable } from '@bbp/nexus-link';
import {
  loadUser,
  userExpired,
  silentRenewError,
  sessionTerminated,
  userExpiring,
  userSignedOut,
} from 'redux-oidc';
import Nexus from '@bbp/nexus-sdk-legacy';
import getUserManager from './userManager';
import App from '../shared/App';
import configureStore from '../shared/store';
import { RootState } from '../shared/store/reducers';
import { UserManager } from 'oidc-client';
import { Store } from 'redux';
import { fetchIdentities, fetchRealms } from '../shared/store/actions/auth';

// The app base URL
const rawBase: string = (window as any)['__BASE__'] || '/';
// remove trailing slash
const base: string = rawBase.replace(/\/$/, '');
// setup browser history
const history = createBrowserHistory({ basename: base });
// Grab preloaded state (that comes from the server)
const preloadedState: RootState = (window as any).__PRELOADED_STATE__;
// grab client stuff to be put in the initial state
let preferredRealm;
try {
  const realmData = JSON.parse(localStorage.getItem('nexus__realm') || '');
  realmData && (preferredRealm = realmData.label);
} catch (e) {
  preferredRealm = undefined;
}
const initialState = {
  ...preloadedState,
  config: {
    ...preloadedState.config,
    preferredRealm,
  },
};

// nexus client middleware for setting token before request
const setToken: Link = (operation: Operation, forward?: Link) => {
  const token = localStorage.getItem('nexus__token');
  const nextOperation = token
    ? {
        ...operation,
        headers: {
          ...operation.headers,
          Authorization: `Bearer ${token}`,
        },
      }
    : operation;
  return forward ? forward(nextOperation) : Observable.of();
};

// create Nexus instance
const nexus = createNexusClient({
  fetch,
  uri: preloadedState.config.apiEndpoint,
  links: [setToken],
});
const nexusLegacy = new Nexus({
  environment: preloadedState.config.apiEndpoint,
});
Nexus.setEnvironment(preloadedState.config.apiEndpoint);
// create redux store
const store = configureStore(history, { nexusLegacy, nexus }, initialState);

/**
 * Sets up user token management events and
 * checks if we have a valid user token or not
 * If we do I have, the token can be valid, or invalid.
 * if invalid, we can try to do a silent refresh
 *
 * Outcome in all cases is, we have an authenticated user or we don't
 */
const setupUserSession = async (userManager: UserManager, store: Store) => {
  // Raised when a user session has been established (or re-established).
  userManager.events.addUserLoaded(user => {
    loadUser(store, userManager);
    Nexus.setToken(user.access_token);
    nexusLegacy.setToken(user.access_token);
    localStorage.setItem('nexus__token', user.access_token);
  });

  // Raised prior to the access token expiring.
  userManager.events.addAccessTokenExpiring(() => {
    store.dispatch(userExpiring());
    userManager
      .signinSilent()
      .then(user => {
        loadUser(store, userManager);
        Nexus.setToken(user.access_token);
        nexusLegacy.setToken(user.access_token);
        localStorage.setItem('nexus__token', user.access_token);
      })
      .catch(err => {
        // TODO: sentry that stuff
      });
  });

  // Raised after the access token has expired.
  userManager.events.addAccessTokenExpired(() => {
    store.dispatch(userExpired());
    userManager
      .signinSilent()
      .then(user => {
        loadUser(store, userManager);
        Nexus.setToken(user.access_token);
        nexusLegacy.setToken(user.access_token);
        localStorage.setItem('nexus__token', user.access_token);
      })
      .catch(err => {
        // TODO: sentry that stuff
      });
  });

  // Raised when the automatic silent renew has failed.
  userManager.events.addSilentRenewError(() => {
    store.dispatch(silentRenewError());
    Nexus.removeToken();
    localStorage.removeItem('nexus__token');
  });

  //  Raised when the user's sign-in status at the OP has changed.
  userManager.events.addUserSignedOut(() => {
    store.dispatch(userSignedOut());
    Nexus.removeToken();
    localStorage.removeItem('nexus__token');
  });

  // Raised when a user session has been terminated.
  userManager.events.addUserUnloaded(() => {
    store.dispatch(sessionTerminated());
    Nexus.removeToken();
    localStorage.removeItem('nexus__token');
  });

  try {
    let user;
    // do we already have a user?
    user = await userManager.getUser();
    if (user) {
      // we've loaded a user, refresh it
      user = await userManager.signinSilent();
    }
    // nope, are we receiving a new token?
    else {
      user = await userManager.signinRedirectCallback();
    }
  } catch (e) {
    // nothing to do, we are just not logged in
  }
};

const renderApp = () => {
  return ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <NexusProvider nexusClient={nexus}>
          <App />
        </NexusProvider>
      </ConnectedRouter>
    </Provider>,
    document.getElementById('app')
  );
};

// DEVELOPMENT ONLY
// if Hot module Replacement is enables
// render app with new bundle.
if (module.hot) {
  // tslint:disable-next-line:no-console
  console.log("🔥It's hot!🔥");
  module.hot.accept('../shared/App', () => {
    const NextApp: React.StatelessComponent<{}> = require('../shared/App')
      .default;
    ReactDOM.render(
      <Provider store={store}>
        <BrowserRouter basename={base}>
          <NexusProvider nexusClient={nexus}>
            <NextApp />
          </NexusProvider>
        </BrowserRouter>
      </Provider>,
      document.getElementById('app')
    );
  });
}

async function main() {
  // configure user manager
  await store.dispatch<any>(fetchRealms());
  const userManager = getUserManager(store.getState());
  // if userManger isn't undefined, setupSession
  // it could be undefined if there are no realms
  // to login with for example, or the realm we
  // logged in with isn't available any more
  if (userManager) {
    await setupUserSession(userManager, store);
  }
  await store.dispatch<any>(fetchIdentities());
  renderApp();
}
main();
