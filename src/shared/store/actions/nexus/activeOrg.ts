import { ActionCreator, Dispatch } from 'redux';
import {
  Organization,
  Project,
  PaginatedList,
  PaginationSettings,
} from '@bbp/nexus-sdk-legacy';
import { ThunkAction } from '../..';
import { FetchAction, FetchFulfilledAction, FetchFailedAction } from '../utils';
import { formatError } from '../utils/errors';
import { RootState } from '../../reducers';

enum OrgActionTypes {
  FETCHING = '@@nexus/ORG_FETCHING',
  FULFILLED = '@@nexus/ORG_FETCHING_FULFILLED',
  FAILED = '@@nexus/ORG_FETCHING_FAILED',
}

export const actionTypes = {
  FETCHING: OrgActionTypes.FETCHING,
  FULFILLED: OrgActionTypes.FULFILLED,
  FAILED: OrgActionTypes.FAILED,
};

const fetchOrgAction: ActionCreator<
  FetchAction<OrgActionTypes.FETCHING>
> = () => ({
  type: OrgActionTypes.FETCHING,
});

const fetchOrgFulfilledAction: ActionCreator<
  FetchFulfilledAction<
    OrgActionTypes.FULFILLED,
    { org: Organization; projects: PaginatedList<Project> }
  >
> = (org: Organization, projects: PaginatedList<Project>) => ({
  type: OrgActionTypes.FULFILLED,
  payload: { org, projects },
});

const fetchOrgFailedAction: ActionCreator<
  FetchFailedAction<OrgActionTypes.FAILED>
> = (error: Error) => ({
  error,
  type: OrgActionTypes.FAILED,
});

export type ActiveOrgActions =
  | FetchAction<OrgActionTypes.FETCHING>
  | FetchFulfilledAction<
      OrgActionTypes.FULFILLED,
      { org: Organization; projects: PaginatedList<Project> }
    >
  | FetchFailedAction<OrgActionTypes.FAILED>;

export const fetchOrg: ActionCreator<ThunkAction> = (
  orgName: string,
  paginationSettings?: PaginationSettings
) => {
  return async (
    dispatch: Dispatch<any>,
    getState,
    { nexusLegacy }
  ): Promise<
    | FetchFulfilledAction<
        OrgActionTypes.FULFILLED,
        { org: Organization; projects: PaginatedList<Project> }
      >
    | FetchFailedAction<OrgActionTypes.FAILED>
  > => {
    dispatch(fetchOrgAction());
    try {
      const Organization = nexusLegacy.Organization;
      const Project = nexusLegacy.Project;
      const org: Organization = await Organization.get(orgName);
      const displayPerPage = (getState() as RootState).uiSettings.pageSizes
        .orgsListPageSize;
      const projects: PaginatedList<Project> = await Project.list(orgName, {
        size: (paginationSettings && paginationSettings.size) || displayPerPage,
        from: (paginationSettings && paginationSettings.from) || 0,
      });
      return dispatch(fetchOrgFulfilledAction(org, projects));
    } catch (e) {
      return dispatch(fetchOrgFailedAction(formatError(e)));
    }
  };
};
