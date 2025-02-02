import * as React from 'react';
import { PaginationSettings, Resource, NexusFile } from '@bbp/nexus-sdk-legacy';
import { List } from '../../../../store/reducers/lists';
import QueryComponent from './QueryComponent';

interface QueryContainerProps {
  list: List;
  pageSize: number;
  updateList: (list: List) => void;
  deleteList: () => void;
  cloneList: (list: List) => void;
  goToResource: (resource: Resource) => void;
  goToQuery: (list: List) => void;
  getFilePreview: (selfUrl: string) => Promise<NexusFile>;
  queryResources: (
    id: string,
    paginationSettings: PaginationSettings,
    query?: List['query']
  ) => void;
}

const QueryContainer: React.FunctionComponent<QueryContainerProps> = props => {
  const {
    list: { id, results, query },
    queryResources,
    pageSize: size,
  } = props;
  const [loadingNext, setLoadingNext] = React.useState(false);

  React.useEffect(() => {
    handleRefreshList();
  }, [query && query.textQuery, query && query.filters]);

  React.useEffect(() => {
    setLoadingNext(false);
  }, [results.isFetching]);

  const handleRefreshList = () => {
    queryResources(id, { size, from: 0 }, query);
  };

  const next = () => {
    const paginationSettings =
      results && !!results.data
        ? { size, from: results.data.resources.index + 1 * size }
        : { size, from: 0 };
    setLoadingNext(true);
    queryResources(id, paginationSettings, query);
  };

  const showSpinner = results.isFetching && !loadingNext;

  return (
    <QueryComponent {...{ ...props, next, handleRefreshList, showSpinner }} />
  );
};

export default QueryContainer;
